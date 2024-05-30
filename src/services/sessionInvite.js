// Dependencies
const _ = require('lodash')
const utils = require('@generics/utils')
const httpStatusCode = require('@generics/http-status')
const fs = require('fs')
const path = require('path')
const csv = require('csvtojson')
const axios = require('axios')
const common = require('@constants/common')
const fileService = require('@services/files')
const request = require('request')
const userRequests = require('@requests/user')
const sessionService = require('@services/sessions')
const { isAMentor } = require('@generics/utils')
const ProjectRootDir = path.join(__dirname, '../')
const fileUploadQueries = require('@database/queries/fileUpload')
const notificationTemplateQueries = require('@database/queries/notificationTemplate')
const kafkaCommunication = require('@generics/kafka-communication')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const sessionQueries = require('@database/queries/sessions')
const entityTypeQueries = require('@database/queries/entityType')
const { Op } = require('sequelize')
const moment = require('moment')
const inviteeFileDir = ProjectRootDir + common.tempFolderForBulkUpload

module.exports = class UserInviteHelper {
	static async uploadSession(data) {
		return new Promise(async (resolve, reject) => {
			try {
				const filePath = data.fileDetails.input_path
				const userId = data.user.id
				const orgId = data.user.organization_id
				const notifyUser = true
				const roles = await userRequests.details('', userId)
				const isMentor = isAMentor(roles.data.result.user_roles)

				// download file to local directory
				const response = await this.downloadCSV(filePath)
				if (!response.success) throw new Error('FAILED_TO_DOWNLOAD')

				// extract data from csv
				const parsedFileData = await this.extractDataFromCSV(response.result.downloadPath)
				if (!parsedFileData.success) throw new Error('FAILED_TO_READ_CSV')
				const invitees = parsedFileData.result.data

				// create outPut file and create invites
				const createResponse = await this.processSessionDetails(
					invitees,
					inviteeFileDir,
					userId,
					orgId,
					notifyUser,
					isMentor
				)
				const outputFilename = path.basename(createResponse.result.outputFilePath)

				// upload output file to cloud
				const uploadRes = await this.uploadFileToCloud(outputFilename, inviteeFileDir, userId, orgId)
				const output_path = uploadRes.result.uploadDest
				const update = {
					output_path,
					updated_by: userId,
					status:
						createResponse.result.isErrorOccured == true ? common.STATUS.FAILED : common.STATUS.PROCESSED,
				}
				//update output path in file uploads
				const rowsAffected = await fileUploadQueries.update(
					{ id: data.fileDetails.id, organization_id: orgId },
					update
				)
				if (rowsAffected === 0) {
					throw new Error('FILE_UPLOAD_MODIFY_ERROR')
				}

				// send email to admin
				const templateCode = process.env.SESSION_UPLOAD_EMAIL_TEMPLATE_CODE
				if (templateCode) {
					const templateData = await notificationTemplateQueries.findOneEmailTemplate(
						templateCode,
						data.user.organization_id
					)

					if (templateData) {
						const sessionUploadURL = await utils.getDownloadableUrl(output_path)
						await this.sendSessionManagerEmail(templateData, data.user, sessionUploadURL) //Rename this to function to generic name since this function is used for both Invitee & Org-admin.
					}
				}

				// delete the downloaded file and output file.
				utils.clearFile(response.result.downloadPath)
				utils.clearFile(createResponse.result.outputFilePath)

				return resolve({
					success: true,
					message: 'CSV_UPLOADED_SUCCESSFULLY',
				})
			} catch (error) {
				console.log(error, 'CSV PROCESSING ERROR')
				return reject({
					success: false,
					message: error.message,
				})
			}
		})
	}

	static async downloadCSV(filePath) {
		try {
			const downloadableUrl = await utils.getDownloadableUrl(filePath)
			let fileName = path.basename(downloadableUrl)

			// Find the index of the first occurrence of '?'
			const index = fileName.indexOf('?')
			// Extract the portion of the string before the '?' if it exists, otherwise use the entire string
			fileName = index !== -1 ? fileName.substring(0, index) : fileName
			const downloadPath = path.join(inviteeFileDir, fileName)
			const response = await axios.get(downloadableUrl, {
				responseType: common.responseType,
			})

			const writeStream = fs.createWriteStream(downloadPath)
			response.data.pipe(writeStream)

			await new Promise((resolve, reject) => {
				writeStream.on('finish', resolve)
				writeStream.on('error', (err) => {
					reject(new Error('FAILED_TO_DOWNLOAD_FILE'))
				})
			})

			return {
				success: true,
				result: {
					destPath: inviteeFileDir,
					fileName,
					downloadPath,
				},
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	static async appendWithComma(existingMessagePromise, newMessage) {
		const existingMessage = await existingMessagePromise
		if (existingMessage) {
			return `${existingMessage}, ${newMessage}`
		} else {
			return newMessage
		}
	}

	static async extractDataFromCSV(csvFilePath) {
		try {
			const parsedCSVData = []
			const csvToJsonData = await csv().fromFile(csvFilePath)
			if (csvToJsonData.length > 0) {
				const processStatusMessage = async (statusMessage, newMessage) => {
					if (typeof statusMessage === 'string') {
						return this.appendWithComma(statusMessage, newMessage)
					} else if (statusMessage instanceof Promise) {
						const resolvedMessage = await statusMessage
						return this.appendWithComma(resolvedMessage, newMessage)
					}
					return newMessage
				}

				for (const row of csvToJsonData) {
					const {
						Action: action,
						id,
						title,
						description,
						type,
						'Mentor(Email/Mobile Num)': mentor_id,
						'Mentees(Email/Mobile Num)': mentees,
						'Date(DD-MM-YYYY)': date,
						'Time Zone(IST/UTC)': time_zone,
						'Time (24 hrs)': time24hrs,
						'Duration(Min)': duration,
						recommended_for,
						categories,
						medium,
						'Meeting Platform': meetingPlatform,
						'Meeting Link or Meeting ID': meetingLinkOrId,
						'Meeting Passcode (if needed)': meetingPasscode,
					} = row

					const menteesList = mentees
						? mentees
								.replace(/"/g, '')
								.split(',')
								.map((item) => item.trim())
						: []
					const recommendedList = recommended_for
						? recommended_for
								.replace(/"/g, '')
								.split(',')
								.map((item) => item.trim())
						: []
					const categoriesList = categories
						? categories
								.replace(/"/g, '')
								.split(',')
								.map((item) => item.trim())
						: []
					const mediumList = medium
						? medium
								.replace(/"/g, '')
								.split(',')
								.map((item) => item.trim())
						: []

					parsedCSVData.push({
						action,
						id,
						title,
						description,
						type,
						mentor_id,
						mentees: menteesList,
						date,
						time_zone,
						time24hrs,
						duration,
						recommended_for: recommendedList,
						categories: categoriesList,
						medium: mediumList,
						meeting_info: {
							platform: meetingPlatform,
							value: '',
							link: meetingLinkOrId,
							meta: {},
						},
					})

					const platformNameRegex = /https:\/\/(?:meet|call|us\d{2}web)\.(\w+)\.com/
					let meetingName = !meetingPlatform ? '' : meetingPlatform.toLowerCase().replace(/\s+/g, '')
					if (meetingName.includes(common.MEETING_VALUES.ZOOM_VALUE)) {
						const zoomMeetingRegex = /https:\/\/(?:meet|call|us\d{2}web|zoom)\.(\w+)\.us\/j\/(\d+)\?/
						const match = meetingLinkOrId.match(zoomMeetingRegex)
						const platformName = !match ? '' : match[1]
						const meetingId = match[2]
						if (
							(typeof meetingLinkOrId === 'string' &&
								platformName === common.MEETING_VALUES.ZOOM_VALUE) ||
							!meetingLinkOrId
						) {
							parsedCSVData[parsedCSVData.length - 1].meeting_info.platform =
								common.MEETING_VALUES.ZOOM_MEET
							parsedCSVData[parsedCSVData.length - 1].meeting_info.value = common.MEETING_VALUES.ZOOM_MEET
							parsedCSVData[parsedCSVData.length - 1].meeting_info.meta.meetingId = meetingId
							parsedCSVData[parsedCSVData.length - 1].meeting_info.meta.password = `"${meetingPasscode}"`
						} else {
							parsedCSVData[parsedCSVData.length - 1].status = 'Invalid'
							parsedCSVData[parsedCSVData.length - 1].statusMessage = await processStatusMessage(
								parsedCSVData[parsedCSVData.length - 1].statusMessage,
								'Invalid Link'
							)
						}
					} else if (meetingName.includes(common.MEETING_VALUES.WHATSAPP_VALUE)) {
						const match = meetingLinkOrId.match(platformNameRegex)
						const platformName = !match ? '' : match[1]
						if (platformName === common.MEETING_VALUES.WHATSAPP_VALUE || !meetingLinkOrId) {
							parsedCSVData[parsedCSVData.length - 1].meeting_info.platform =
								common.MEETING_VALUES.WHATSAPP_MEET
							parsedCSVData[parsedCSVData.length - 1].meeting_info.value =
								common.MEETING_VALUES.WHATSAPP_MEET
						} else {
							parsedCSVData[parsedCSVData.length - 1].status = 'Invalid'
							parsedCSVData[parsedCSVData.length - 1].statusMessage = await processStatusMessage(
								parsedCSVData[parsedCSVData.length - 1].statusMessage,
								'Invalid Link'
							)
						}
					} else if (common.MEETING_VALUES.GOOGLE_MEET_VALUES.some((value) => meetingName.includes(value))) {
						const match = meetingLinkOrId.match(platformNameRegex)
						const platformName = !match ? '' : match[1]
						if (platformName === common.MEETING_VALUES.GOOGLE_PLATFORM || !meetingLinkOrId) {
							parsedCSVData[parsedCSVData.length - 1].meeting_info.value =
								common.MEETING_VALUES.GOOGLE_VALUE
							parsedCSVData[parsedCSVData.length - 1].meeting_info.platform =
								common.MEETING_VALUES.GOOGLE_MEET
						} else {
							parsedCSVData[parsedCSVData.length - 1].status = 'Invalid'
							parsedCSVData[parsedCSVData.length - 1].statusMessage = await processStatusMessage(
								parsedCSVData[parsedCSVData.length - 1].statusMessage,
								'Invalid Link'
							)
						}
					} else if (common.MEETING_VALUES.BBB_PLATFORM_VALUES.some((value) => meetingName.includes(value))) {
						if (!meetingLinkOrId) {
							parsedCSVData[parsedCSVData.length - 1].meeting_info.value = common.BBB_VALUE
							parsedCSVData[parsedCSVData.length - 1].meeting_info.platform =
								common.MEETING_VALUES.BBB_MEET
						} else {
							parsedCSVData[parsedCSVData.length - 1].status = 'Invalid'
							parsedCSVData[parsedCSVData.length - 1].statusMessage = await processStatusMessage(
								parsedCSVData[parsedCSVData.length - 1].statusMessage,
								' Link should be empty for Big Blue Button '
							)
						}
					} else if (!meetingLinkOrId && !meetingName) {
						parsedCSVData[parsedCSVData.length - 1].meeting_info.value = common.BBB_VALUE
						parsedCSVData[parsedCSVData.length - 1].meeting_info.platform = common.MEETING_VALUES.BBB_MEET
					} else if (!meetingName && meetingLinkOrId) {
						parsedCSVData[parsedCSVData.length - 1].status = 'Invalid'
						parsedCSVData[parsedCSVData.length - 1].statusMessage = await processStatusMessage(
							parsedCSVData[parsedCSVData.length - 1].statusMessage,
							' Platform is not filled'
						)
					}
				}
			}
			return {
				success: true,
				result: { data: parsedCSVData },
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	static async processSession(session, userId, orgId, validRowsCount, invalidRowsCount) {
		const requiredFields = [
			'action',
			'title',
			'description',
			'date',
			'type',
			'mentor_id',
			'time_zone',
			'time24hrs',
			'duration',
			'medium',
			'recommended_for',
			'categories',
			'meeting_info',
		]

		const missingFields = requiredFields.filter(
			(field) => !session[field] || (Array.isArray(session[field]) && session[field].length === 0)
		)
		if (missingFields.length > 0) {
			session.status = 'Invalid'
			session.statusMessage = this.appendWithComma(
				session.statusMessage,
				` Mandatory fields ${missingFields.join(', ')} not filled`
			)
			if (session.type.toUpperCase() === common.SESSION_TYPE.PRIVATE && session.mentees.length === 0) {
				session.statusMessage = this.appendWithComma(
					session.statusMessage,
					'Mentees not filled for private session'
				)
			}
			invalidRowsCount++
		} else {
			if (session.meeting_info.platform !== common.MEETING_VALUES.BBB_MEET && session.meeting_info.link === '') {
				session.status = 'Invalid'
				session.statusMessage = this.appendWithComma(
					session.statusMessage,
					' Meeting Link or ID is required for platforms other than Big Blue Button'
				)
				invalidRowsCount++
			} else {
				if (session.status != 'Invalid') {
					validRowsCount++
					session.status = 'Valid'
				}
				const { date, time_zone, time24hrs } = session
				const time = time24hrs.replace(' Hrs', '')
				const dateTimeString = date + ' ' + time
				const timeZone = time_zone == common.TIMEZONE ? common.IST_TIMEZONE : common.UTC_TIMEZONE
				const momentFromJSON = moment.tz(dateTimeString, common.CSV_DATE_FORMAT, timeZone)
				const currentMoment = moment().tz(timeZone)
				const isDateValid = momentFromJSON.isSameOrAfter(currentMoment, 'day')
				if (isDateValid) {
					const differenceTime = momentFromJSON.unix() - currentMoment.unix()
					if (differenceTime >= 0) {
						session.start_date = momentFromJSON.unix()
						const momentEndDateTime = momentFromJSON.add(session.duration, 'minutes')
						session.end_date = momentEndDateTime.unix()
					} else {
						session.status = 'Invalid'
						session.statusMessage = this.appendWithComma(session.statusMessage, ' Invalid Time')
					}
				} else {
					session.status = 'Invalid'
					session.statusMessage = this.appendWithComma(session.statusMessage, ' Invalid Date')
				}

				if (session.mentees && Array.isArray(session.mentees)) {
					const menteeEmails = session.mentees.map((mentee) => mentee.toLowerCase())
					const menteeDetails = await userRequests.getListOfUserDetailsByEmail(menteeEmails)
					session.mentees = menteeDetails.result.userIdsAndInvalidEmails
					if (menteeDetails.result.invalidEmails.length != 0) {
						session.statusMessage = this.appendWithComma(
							session.statusMessage,
							' Mentee Details are incorrect'
						)
					}
				}
				const containsUserId = session.mentees.includes(userId)
				if (!containsUserId && session.mentees.length >= 5) {
					session.status = 'Invalid'
					session.statusMessage = this.appendWithComma(session.statusMessage, ' Only 5 mentees are allowed')
				} else if (containsUserId && session.mentees.length > 6) {
					session.status = 'Invalid'
					session.statusMessage = this.appendWithComma(session.statusMessage, ' Only 6 mentees are allowed')
				}
				if (session.mentor_id.length != 0) {
					const mentorEmail = [session.mentor_id.toLowerCase()]
					const mentorId = await userRequests.getListOfUserDetailsByEmail(mentorEmail)

					const mentor_Id = mentorId.result.userIdsAndInvalidEmails[0]
					if (typeof mentor_Id != 'number') {
						session.status = 'Invalid'
						session.statusMessage = this.appendWithComma(session.statusMessage, ' Invalid Mentor Email')
						invalidRowsCount++
						session.mentor_id = mentor_Id
					} else {
						session.mentor_id = mentor_Id
					}
				} else {
					session.status = 'Invalid'
					session.statusMessage = this.appendWithComma(session.statusMessage, ' Mentor Email')
				}

				if (session.type.toUpperCase() === common.SESSION_TYPE.PRIVATE) {
					if (session.mentees.length === 0) {
						session.status = 'Invalid'
						session.statusMessage = this.appendWithComma(
							session.statusMessage,
							' Private Session should have at least one mentee.'
						)
					} else if (!session.mentees.some((item) => typeof item === 'number')) {
						session.status = 'Invalid'
						session.statusMessage = this.appendWithComma(
							session.statusMessage,
							' At least one valid mentee should be for private session.'
						)
					}
				}

				const defaultOrgId = await getDefaultOrgId()
				if (!defaultOrgId)
					return responses.failureResponse({
						message: 'DEFAULT_ORG_ID_NOT_SET',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				const sessionModelName = await sessionQueries.getModelName()

				let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
					status: 'ACTIVE',
					organization_id: {
						[Op.in]: [orgId, defaultOrgId],
					},
					model_names: { [Op.contains]: [sessionModelName] },
				})

				const idAndValues = entityTypes.map((item) => ({ value: item.value, entities: item.entities }))
				await this.mapSessionToEntityValues(session, idAndValues)
				if (session.meeting_info.link === '{}') {
					session.meeting_info.link = ''
				}
			}
		}
		return { validRowsCount, invalidRowsCount }
	}

	static async mapSessionToEntityValues(session, entitiesList) {
		entitiesList.forEach((entityType) => {
			const sessionKey = entityType.value
			const sessionValues = session[sessionKey]

			if (Array.isArray(sessionValues)) {
				const entityValues = entityType.entities
				session[sessionKey] = sessionValues.map((sessionValue) => {
					const entity = entityValues.find((e) => e.label.toLowerCase() === sessionValue.toLowerCase())
					return entity ? entity.value : sessionValue
				})
			}
		})

		return session
	}

	static async revertEntityValuesToOriginal(mappedSession, entitiesList) {
		entitiesList.forEach((entityType) => {
			const sessionKey = entityType.value
			const mappedValues = mappedSession[sessionKey]

			if (Array.isArray(mappedValues)) {
				const entityValues = entityType.entities
				mappedSession[sessionKey] = mappedValues.map((mappedValue) => {
					const entity = entityValues.find((e) => e.value === mappedValue)
					return entity ? entity.label : mappedValue
				})
			}
		})

		return mappedSession
	}

	static async processRows(sessionCreationOutput, idAndValues) {
		for (let row of sessionCreationOutput) {
			await this.revertEntityValuesToOriginal(row, idAndValues)
		}
	}

	static async processSessionDetails(csvData, sessionFileDir, userId, orgId, notifyUser, isMentor) {
		try {
			const outputFileName = utils.generateFileName(common.sessionOutputFile, common.csvExtension)
			let rowsWithStatus = []
			let validRowsCount = 0
			let invalidRowsCount = 0
			for (const session of csvData) {
				if (session.action.replace(/\s+/g, '').toLowerCase() === common.ACTIONS.CREATE) {
					if (!session.id) {
						const { validRowsCount: valid, invalidRowsCount: invalid } = await this.processSession(
							session,
							userId,
							orgId,
							validRowsCount,
							invalidRowsCount
						)
						validRowsCount = valid
						invalidRowsCount = invalid
						rowsWithStatus.push(session)
					} else {
						session.status = 'Invalid'
						session.statusMessage = this.appendWithComma(
							session.statusMessage,
							'MANDATORY_FIELDS_SESSION_ID_NOT_FILLED'
						)
						rowsWithStatus.push(session)
					}
				} else if (session.action.replace(/\s+/g, '').toLowerCase() === common.ACTIONS.EDIT) {
					if (!session.id) {
						session.statusMessage = this.appendWithComma(session.statusMessage, ' Session ID not filled')
						session.status = 'Invalid'
						rowsWithStatus.push(session)
					} else {
						const { validRowsCount: valid, invalidRowsCount: invalid } = await this.processSession(
							session,
							userId,
							orgId,
							validRowsCount,
							invalidRowsCount
						)
						validRowsCount = valid
						invalidRowsCount = invalid
						session.method = 'POST'
						rowsWithStatus.push(session)
					}
				} else if (session.action.replace(/\s+/g, '').toLowerCase() === common.ACTIONS.DELETE) {
					if (!session.id) {
						session.statusMessage = this.appendWithComma(session.statusMessage, ' Session ID not filled')
						session.status = 'Invalid'
						rowsWithStatus.push(session)
					} else {
						const { validRowsCount: valid, invalidRowsCount: invalid } = await this.processSession(
							session,
							userId,
							orgId,
							validRowsCount,
							invalidRowsCount
						)
						validRowsCount = valid
						invalidRowsCount = invalid
						session.method = 'DELETE'
						rowsWithStatus.push(session)
					}
				} else {
					session.status = 'Invalid'
					session.statusMessage = this.appendWithComma(session.statusMessage, ' Action is Empty/Wrong')
				}

				if (session.statusMessage && typeof session.statusMessage != 'string') {
					session.statusMessage = await session.statusMessage.then((result) => result)
				}
			}
			const BodyDataArray = rowsWithStatus.map((item) => ({
				title: item.title,
				description: item.description,
				start_date: item.start_date,
				end_date: item.end_date,
				recommended_for: item.recommended_for,
				categories: item.categories,
				medium: item.medium,
				image: [],
				time_zone: item.time_zone,
				mentor_id: item.mentor_id,
				mentees: item.mentees,
				type: item.type,
				date: item.date,
				time24hrs: item.time24hrs,
				duration: item.duration,
				status: item.status,
				statusMessage: item.statusMessage,
				action: item.action,
				id: item.id,
				method: item.method,
				meeting_info: item.meeting_info,
			}))

			const sessionCreationOutput = await this.processCreateData(
				BodyDataArray,
				userId,
				orgId,
				isMentor,
				notifyUser
			)

			await this.fetchMentorIds(sessionCreationOutput)

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			const sessionModelName = await sessionQueries.getModelName()

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
				model_names: { [Op.contains]: [sessionModelName] },
			})
			const idAndValues = entityTypes.map((item) => ({
				value: item.value,
				entities: item.entities,
			}))

			await this.processRows(sessionCreationOutput, idAndValues)

			const modifiedCsv = sessionCreationOutput.map(
				({
					start_date,
					end_date,
					image,
					method,
					created_by,
					updated_by,
					mentor_name,
					custom_entity_text,
					mentor_organization_id,
					visibility,
					visible_to_organizations,
					mentee_feedback_question_set,
					mentor_feedback_question_set,
					meta,
					...rest
				}) => rest
			)

			const OutputCSVData = []
			modifiedCsv.forEach((row) => {
				const {
					title,
					description,
					recommended_for,
					categories,
					medium,
					time_zone,
					mentor_id,
					mentees,
					type,
					date,
					time24hrs,
					duration,
					status,
					statusMessage,
					action,
					id,
					meeting_info,
				} = row

				const meetingPlatform = meeting_info.platform
				const meetingLinkOrId = meeting_info.link
				let meetingPasscode = ''
				if (meetingPlatform == common.MEETING_VALUES.ZOOM_MEET) {
					meetingPasscode = meeting_info.meta.password ? meeting_info.meta.password.match(/\d+/)[0] : ''
				}

				const mappedRow = {
					Action: action,
					id,
					title,
					description,
					type,
					'Mentor(Email/Mobile Num)': mentor_id,
					'Mentees(Email/Mobile Num)': mentees.join(', '),
					'Date(DD-MM-YYYY)': date,
					'Time Zone(IST/UTC)': time_zone,
					'Time (24 hrs)': time24hrs,
					'Duration(Min)': duration,
					recommended_for,
					categories,
					medium,
					'Meeting Platform': meetingPlatform,
					'Meeting Link or Meeting ID': meetingLinkOrId,
					'Meeting Passcode (if needed)': meetingPasscode,
					Status: status,
					'Status Message': statusMessage,
				}
				OutputCSVData.push(mappedRow)
			})

			const csvContent = utils.generateCSVContent(OutputCSVData)
			const outputFilePath = path.join(sessionFileDir, outputFileName)
			fs.writeFileSync(outputFilePath, csvContent)

			return {
				success: true,
				result: {
					sessionCreationOutput,
					outputFilePath,
					validRowsCount,
					invalidRowsCount,
				},
			}
		} catch (error) {
			return {
				success: false,
				message: error,
			}
		}
	}

	static async processCreateData(dataArray, userId, orgId, isMentor, notifyUser) {
		const output = []
		for (const data of dataArray) {
			if (data.status != 'Invalid') {
				if (data.action.toLowerCase() == common.ACTIONS.CREATE) {
					data.status = common.PUBLISHED_STATUS
					data.time_zone =
						data.time_zone == common.TIMEZONE
							? (data.time_zone = common.IST_TIMEZONE)
							: (data.time_zone = common.UTC_TIMEZONE)
					const sessionCreation = await sessionService.create(data, userId, orgId, isMentor, notifyUser)
					if (sessionCreation.statusCode === httpStatusCode.created) {
						data.statusMessage = sessionCreation.message
						data.id = sessionCreation.result.id
						data.recommended_for = sessionCreation.result.recommended_for.map((item) => item.label)
						data.categories = sessionCreation.result.categories.map((item) => item.label)
						data.medium = sessionCreation.result.medium.map((item) => item.label)
						data.time_zone =
							data.time_zone == common.IST_TIMEZONE
								? (data.time_zone = common.TIMEZONE)
								: (data.time_zone = common.TIMEZONE_UTC)
						output.push(data)
					} else {
						data.status = 'Invalid'
						data.time_zone =
							data.time_zone == common.IST_TIMEZONE
								? (data.time_zone = common.TIMEZONE)
								: (data.time_zone = common.TIMEZONE_UTC)
						data.statusMessage = sessionCreation.message
						output.push(data)
					}
				} else if (
					data.action.toLowerCase() == common.ACTIONS.EDIT ||
					data.action.toLowerCase() == common.ACTIONS.DELETE
				) {
					data.time_zone =
						data.time_zone == common.TIMEZONE
							? (data.time_zone = common.IST_TIMEZONE)
							: (data.time_zone = common.UTC_TIMEZONE)
					const recommends = data.recommended_for
					const categoriess = data.categories
					const mediums = data.medium
					const sessionUpdateOrDelete = await sessionService.update(
						data.id,
						data,
						userId,
						data.method,
						orgId,
						notifyUser
					)
					if (sessionUpdateOrDelete.statusCode === httpStatusCode.accepted) {
						data.statusMessage = sessionUpdateOrDelete.message
						data.recommended_for = recommends
						data.categories = categoriess
						data.medium = mediums
						data.time_zone =
							data.time_zone == common.IST_TIMEZONE
								? (data.time_zone = common.TIMEZONE)
								: (data.time_zone = common.TIMEZONE_UTC)
						output.push(data)
					} else {
						data.status = 'Invalid'
						data.time_zone =
							data.time_zone == common.IST_TIMEZONE
								? (data.time_zone = common.TIMEZONE)
								: (data.time_zone = common.TIMEZONE_UTC)
						data.statusMessage = sessionUpdateOrDelete.message
						output.push(data)
					}
				}
			} else {
				output.push(data)
			}
		}
		return output
	}

	static async fetchMentorIds(sessionCreationOutput) {
		for (const item of sessionCreationOutput) {
			const mentorIdPromise = item.mentor_id
			if (typeof mentorIdPromise === 'number' && Number.isInteger(mentorIdPromise)) {
				const mentorId = await userRequests.details('', mentorIdPromise)
				item.mentor_id = mentorId.data.result.email
			} else {
				item.mentor_id = item.mentor_id
			}

			if (Array.isArray(item.mentees)) {
				const menteeEmails = []
				for (let i = 0; i < item.mentees.length; i++) {
					const menteeId = item.mentees[i]
					if (typeof menteeId === 'number' && Number.isInteger(menteeId)) {
						const mentee = await userRequests.details('', menteeId)
						menteeEmails.push(mentee.data.result.email)
					} else {
						menteeEmails.push(menteeId)
					}
				}
				item.mentees = menteeEmails
			}
		}
	}

	static async uploadFileToCloud(fileName, folderPath, userId = '', orgId, dynamicPath = '') {
		try {
			const getSignedUrl = await fileService.getSignedUrl(fileName, userId, orgId, dynamicPath)
			if (!getSignedUrl.result) {
				throw new Error('FAILED_TO_GENERATE_SIGNED_URL')
			}

			const fileUploadUrl = getSignedUrl.result.signedUrl
			const filePath = `${folderPath}/${fileName}`
			const fileData = fs.readFileSync(filePath, 'utf-8')

			const result = await new Promise((resolve, reject) => {
				try {
					request(
						{
							url: fileUploadUrl,
							method: 'put',
							headers: {
								'x-ms-blob-type': common.azureBlobType,
								'Content-Type': 'multipart/form-data',
							},
							body: fileData,
						},
						(error, response, body) => {
							if (error) reject(error)
							else resolve(response.statusCode)
						}
					)
				} catch (error) {
					reject(error)
				}
			})

			return {
				success: true,
				result: {
					uploadDest: getSignedUrl.result.destFilePath,
				},
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	static async sendSessionManagerEmail(templateData, userData, sessionUploadURL = null, subjectComposeData = {}) {
		try {
			const payload = {
				type: common.notificationEmailType,
				email: {
					to: userData.email,
					subject:
						subjectComposeData && Object.keys(subjectComposeData).length > 0
							? utils.composeEmailBody(templateData.subject, subjectComposeData)
							: templateData.subject,
					body: utils.composeEmailBody(templateData.body, {
						name: userData.name,
					}),
				},
			}

			if (sessionUploadURL != null) {
				const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '')

				payload.email.attachments = [
					{
						url: sessionUploadURL,
						filename: `session-creation-status_${currentDate}.csv`,
						type: 'text/csv',
					},
				]
			}

			await kafkaCommunication.pushEmailToKafka(payload)
			return {
				success: true,
			}
		} catch (error) {
			console.log(error)
			throw error
		}
	}
}
