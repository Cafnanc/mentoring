// Dependencies
const _ = require('lodash')
const moment = require('moment-timezone')
const httpStatusCode = require('@generics/http-status')
const apiEndpoints = require('@constants/endpoints')
const common = require('@constants/common')
//const sessionData = require('@db/sessions/queries')
const notificationTemplateData = require('@db/notification-template/query')
const kafkaCommunication = require('@generics/kafka-communication')
const apiBaseUrl = process.env.USER_SERVICE_HOST + process.env.USER_SERVICE_BASE_URL
const request = require('request')
const sessionQueries = require('@database/queries/sessions')
const sessionAttendeesQueries = require('@database/queries/sessionAttendees')
const mentorExtensionQueries = require('@database/queries/mentorExtension')
const menteeExtensionQueries = require('@database/queries/userExtension')
const sessionEnrollmentQueries = require('@database/queries/sessionEnrollments')
const postSessionQueries = require('@database/queries/postSessionDetail')
const sessionOwnershipQueries = require('@database/queries/sessionOwnership')
const entityTypeQueries = require('@database/queries/entityType')
const entitiesQueries = require('@database/queries/entity')
const { Op } = require('sequelize')
const notificationQueries = require('@database/queries/notificationTemplate')

const schedulerRequest = require('@requests/scheduler')

const bigBlueButtonRequests = require('@requests/bigBlueButton')
const userRequests = require('@requests/user')
const utils = require('@generics/utils')
const sessionMentor = require('./mentors')
const bigBlueButtonService = require('./bigBlueButton')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const { removeDefaultOrgEntityTypes } = require('@generics/utils')
const menteeService = require('@services/mentees')
const { Parser } = require('@json2csv/plainjs')
const entityTypeService = require('@services/entity-type')

module.exports = class SessionsHelper {
	/**
	 * Create session.
	 * @method
	 * @name create
	 * @param {Object} bodyData - Session creation data.
	 * @param {String} loggedInUserId - logged in user id.
	 * @returns {JSON} - Create session data.
	 */

	static async create(bodyData, loggedInUserId, orgId) {
		try {
			bodyData.created_by = loggedInUserId
			bodyData.updated_by = loggedInUserId

			const mentorIdToCheck = bodyData.mentor_id || loggedInUserId
			const isSessionCreatedByManager = !!bodyData.mentor_id

			const mentorDetails = await mentorExtensionQueries.getMentorExtension(mentorIdToCheck)
			if (!mentorDetails) {
				return common.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			if (!bodyData.mentor_id) {
				bodyData.mentor_id = loggedInUserId
			} else if (
				mentorDetails.visibility !== common.ASSOCIATED ||
				!mentorDetails.visible_to_organizations.includes(orgId)
			) {
				return common.failureResponse({
					message: 'USER_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const timeSlot = await this.isTimeSlotAvailable(mentorIdToCheck, bodyData.start_date, bodyData.end_date)

			if (timeSlot.isTimeSlotAvailable === false) {
				const errorMessage = isSessionCreatedByManager
					? 'INVALID_TIME_SELECTION_FOR_GIVEN_MENTOR'
					: { key: 'INVALID_TIME_SELECTION', interpolation: { sessionName: timeSlot.sessionName } }

				return common.failureResponse({
					message: errorMessage,
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			let duration = moment.duration(moment.unix(bodyData.end_date).diff(moment.unix(bodyData.start_date)))
			let elapsedMinutes = duration.asMinutes()

			if (elapsedMinutes < 30) {
				return common.failureResponse({
					message: 'SESSION__MINIMUM_DURATION_TIME',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (elapsedMinutes > 1440) {
				return common.failureResponse({
					message: 'SESSION_DURATION_TIME',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const userDetails = (await userRequests.details('', mentorIdToCheck)).data.result
			if (userDetails && userDetails.name) {
				bodyData.mentor_name = userDetails.name
			}

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return common.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)

			let res = utils.validateInput(bodyData, validationData, await sessionQueries.getModelName())
			if (!res.success) {
				return common.failureResponse({
					message: 'SESSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: res.errors,
				})
			}
			let sessionModel = await sessionQueries.getColumns()
			bodyData = utils.restructureBody(bodyData, validationData, sessionModel)

			bodyData.meeting_info = {
				platform: process.env.DEFAULT_MEETING_SERVICE,
				value: process.env.DEFAULT_MEETING_SERVICE,
			}
			if (process.env.DEFAULT_MEETING_SERVICE === common.BBB_VALUE) {
				bodyData.meeting_info = {
					platform: common.BBB_PLATFORM,
					value: common.BBB_VALUE,
				}
			}

			bodyData['mentor_organization_id'] = orgId
			// SAAS changes; Include visibility and visible organisations
			// Call user service to fetch organisation details --SAAS related changes
			let userOrgDetails = await userRequests.fetchDefaultOrgDetails(orgId)

			// Return error if user org does not exists
			if (!userOrgDetails.success || !userOrgDetails.data || !userOrgDetails.data.result) {
				return common.failureResponse({
					message: 'ORGANISATION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			// Find organisation policy from organisation_extension table
			let organisationPolicy = await organisationExtensionQueries.findOrInsertOrganizationExtension(orgId)
			bodyData.visibility = organisationPolicy.session_visibility_policy
			bodyData.visible_to_organizations = userOrgDetails.data.result.related_orgs
				? userOrgDetails.data.result.related_orgs.concat([orgId])
				: [orgId]
			if (organisationPolicy.mentee_feedback_question_set)
				bodyData.mentee_feedback_question_set = organisationPolicy.mentee_feedback_question_set
			if (organisationPolicy.mentor_feedback_question_set)
				bodyData.mentor_feedback_question_set = organisationPolicy.mentor_feedback_question_set
			const data = await sessionQueries.create(bodyData)

			await sessionOwnershipQueries.create({
				mentor_id: loggedInUserId,
				session_id: data.id,
			})

			await this.setMentorPassword(data.id, data.mentor_id)
			await this.setMenteePassword(data.id, data.created_at)

			const processDbResponse = utils.processDbResponse(data.toJSON(), validationData)

			// Set notification schedulers for the session
			// Deep clone to avoid unintended modifications to the original object.
			const jobsToCreate = _.cloneDeep(common.jobsToCreate)

			// Calculate delays for notification jobs
			jobsToCreate[0].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.start_date, 1, 'hour')
			jobsToCreate[1].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.start_date, 24, 'hour')
			jobsToCreate[2].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.start_date, 15, 'minutes')
			jobsToCreate[3].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.end_date, 0, 'minutes')

			// Iterate through the jobs and create scheduler jobs
			for (let jobIndex = 0; jobIndex < jobsToCreate.length; jobIndex++) {
				// Append the session ID to the job ID

				jobsToCreate[jobIndex].jobId = jobsToCreate[jobIndex].jobId + data.id

				const reqBody = {
					job_id: jobsToCreate[jobIndex].jobId,
					email_template_code: jobsToCreate[jobIndex].emailTemplate,
					job_creator_org_id: orgId,
				}
				// Create the scheduler job with the calculated delay and other parameters
				await schedulerRequest.createSchedulerJob(
					jobsToCreate[jobIndex].jobId,
					jobsToCreate[jobIndex].delay,
					jobsToCreate[jobIndex].jobName,
					reqBody,
					reqBody.email_template_code
						? common.notificationEndPoint
						: common.sessionCompleteEndpoint + data.id,
					reqBody.email_template_code ? common.POST_METHOD : common.PATCH_METHOD
				)
			}

			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'SESSION_CREATED_SUCCESSFULLY',
				result: processDbResponse,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Update session.
	 * @method
	 * @name update
	 * @param {String} sessionId - Session id.
	 * @param {Object} bodyData - Session creation data.
	 * @param {String} userId - logged in user id.
	 * @param {String} method - method name.
	 * @returns {JSON} - Update session data.
	 */

	static async update(sessionId, bodyData, userId, method, orgId) {
		let isSessionReschedule = false
		try {
			bodyData.updated_by = userId

			let mentorExtension = await mentorExtensionQueries.getMentorExtension(userId)
			if (!mentorExtension) {
				return common.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const sessionDetail = await sessionQueries.findById(sessionId)
			if (!sessionDetail) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			if (!sessionDetail.created_by !== userId) {
				return common.failureResponse({
					message: 'CANNOT_EDIT_DELETE_SESSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let isEditingAllowedAtAnyTime = process.env.SESSION_EDIT_WINDOW_MINUTES == 0

			const currentDate = moment.utc()
			const startDate = moment.unix(sessionDetail.start_date)
			let elapsedMinutes = startDate.diff(currentDate, 'minutes')

			if (!isEditingAllowedAtAnyTime && elapsedMinutes < process.env.SESSION_EDIT_WINDOW_MINUTES) {
				return common.failureResponse({
					message: {
						key: 'SESSION_EDIT_WINDOW',
						interpolation: { editWindow: process.env.SESSION_EDIT_WINDOW_MINUTES },
					},
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const timeSlot = await this.isTimeSlotAvailable(userId, bodyData.start_date, bodyData.end_date, sessionId)
			if (timeSlot.isTimeSlotAvailable === false) {
				return common.failureResponse({
					message: { key: 'INVALID_TIME_SELECTION', interpolation: { sessionName: timeSlot.sessionName } },
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return common.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)

			let res = utils.validateInput(bodyData, validationData, await sessionQueries.getModelName())

			if (!res.success) {
				return common.failureResponse({
					message: 'SESSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: res.errors,
				})
			}
			let sessionModel = await sessionQueries.getColumns()
			bodyData = utils.restructureBody(bodyData, validationData, sessionModel)

			if (method != common.DELETE_METHOD && (bodyData.end_date || bodyData.start_date)) {
				let duration = moment.duration(moment.unix(bodyData.end_date).diff(moment.unix(bodyData.start_date)))
				let elapsedMinutes = duration.asMinutes()
				if (elapsedMinutes < 30) {
					return common.failureResponse({
						message: 'SESSION__MINIMUM_DURATION_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				if (elapsedMinutes > 1440) {
					return common.failureResponse({
						message: 'SESSION_DURATION_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			}

			let message
			const sessionRelatedJobIds = common.notificationJobIdPrefixes.map((element) => element + sessionDetail.id)
			if (method == common.DELETE_METHOD) {
				let statTime = moment.unix(sessionDetail.start_date)
				const current = moment.utc()
				let diff = statTime.diff(current, 'minutes')

				if (sessionDetail.status == common.PUBLISHED_STATUS && diff > 10) {
					await sessionQueries.deleteSession({
						id: sessionId,
					})
					message = 'SESSION_DELETED_SUCCESSFULLY'

					// Delete scheduled jobs associated with deleted session
					for (let jobIndex = 0; jobIndex < sessionRelatedJobIds.length; jobIndex++) {
						// Remove scheduled notification jobs using the jobIds
						await schedulerRequest.removeScheduledJob({ jobId: sessionRelatedJobIds[jobIndex] })
					}
				} else {
					return common.failureResponse({
						message: 'SESSION_DELETION_FAILED',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			} else {
				const rowsAffected = await sessionQueries.updateOne({ id: sessionId }, bodyData)
				if (rowsAffected == 0) {
					return common.failureResponse({
						message: 'SESSION_ALREADY_UPDATED',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				message = 'SESSION_UPDATED_SUCCESSFULLY'

				// If new start date is passed update session notification jobs

				if (bodyData.start_date && bodyData.start_date !== Number(sessionDetail.start_date)) {
					isSessionReschedule = true

					const updateDelayData = sessionRelatedJobIds.map((jobId) => ({ id: jobId }))

					// Calculate new delays for notification jobs
					updateDelayData[0].delay = await utils.getTimeDifferenceInMilliseconds(
						bodyData.start_date,
						1,
						'hour'
					)
					updateDelayData[1].delay = await utils.getTimeDifferenceInMilliseconds(
						bodyData.start_date,
						24,
						'hour'
					)
					updateDelayData[2].delay = await utils.getTimeDifferenceInMilliseconds(
						bodyData.start_date,
						15,
						'minutes'
					)

					// Update scheduled notification job delays
					for (let jobIndex = 0; jobIndex < updateDelayData.length; jobIndex++) {
						await schedulerRequest.updateDelayOfScheduledJob(updateDelayData[jobIndex])
					}
				}
				if (bodyData.end_date && bodyData.end_date !== Number(sessionDetail.end_date)) {
					isSessionReschedule = true

					const jobId = common.jobPrefixToMarkSessionAsCompleted + sessionDetail.id
					await schedulerRequest.updateDelayOfScheduledJob({
						id: jobId,
						delay: await utils.getTimeDifferenceInMilliseconds(bodyData.end_date, 0, 'minutes'),
					})
				}
			}
			if (method == common.DELETE_METHOD || isSessionReschedule) {
				const sessionAttendees = await sessionAttendeesQueries.findAll({
					session_id: sessionId,
				})
				const sessionAttendeesIds = []
				sessionAttendees.forEach((attendee) => {
					sessionAttendeesIds.push(attendee.mentee_id)
				})

				const attendeesAccounts = await userRequests.getListOfUserDetails(sessionAttendeesIds)

				sessionAttendees.map((attendee) => {
					for (let index = 0; index < attendeesAccounts.result.length; index++) {
						const element = attendeesAccounts.result[index]
						if (element.id == attendee.mentee_id) {
							attendee.attendeeEmail = element.email
							attendee.attendeeName = element.name
							break
						}
					}
				})

				/* Find email template according to request type */
				let templateData
				if (method == common.DELETE_METHOD) {
					templateData = await notificationQueries.findOneEmailTemplate(
						process.env.MENTOR_SESSION_DELETE_EMAIL_TEMPLATE,
						orgId
					)
				} else if (isSessionReschedule) {
					templateData = await notificationQueries.findOneEmailTemplate(
						process.env.MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE,
						orgId
					)
					console.log('Session rescheduled email code:', process.env.MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE)

					console.log('Session rescheduled Template Data:', templateData)
				}

				sessionAttendees.forEach(async (attendee) => {
					if (method == common.DELETE_METHOD) {
						const payload = {
							type: 'email',
							email: {
								to: attendee.attendeeEmail,
								subject: templateData.subject,
								body: utils.composeEmailBody(templateData.body, {
									name: attendee.attendeeName,
									sessionTitle: sessionDetail.title,
								}),
							},
						}

						await kafkaCommunication.pushEmailToKafka(payload)
					} else if (isSessionReschedule) {
						const payload = {
							type: 'email',
							email: {
								to: attendee.attendeeEmail,
								subject: templateData.subject,
								body: utils.composeEmailBody(templateData.body, {
									name: attendee.attendeeName,
									sessionTitle: sessionDetail.title,
									oldStartDate: utils.getTimeZone(
										sessionDetail.start_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									oldStartTime: utils.getTimeZone(
										sessionDetail.startDateUtc
											? sessionDetail.startDateUtc
											: sessionDetail.start_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									oldEndDate: utils.getTimeZone(
										sessionDetail.end_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									oldEndTime: utils.getTimeZone(
										sessionDetail.end_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									newStartDate: utils.getTimeZone(
										bodyData['start_date'] ? bodyData['start_date'] : sessionDetail.start_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									newStartTime: utils.getTimeZone(
										bodyData['start_date'] ? bodyData['start_date'] : sessionDetail.start_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									newEndDate: utils.getTimeZone(
										bodyData['end_date'] ? bodyData['end_date'] : sessionDetail.end_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									newEndTime: utils.getTimeZone(
										bodyData['end_date'] ? bodyData['end_date'] : sessionDetail.end_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
								}),
							},
						}
						let kafkaRes = await kafkaCommunication.pushEmailToKafka(payload)
						console.log('Kafka payload:', payload)
						console.log('Session attendee mapped, isSessionReschedule true and kafka res: ', kafkaRes)
					}
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: message,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Session details.
	 * @method
	 * @name details
	 * @param {String} id 						- Session id.
	 * @param {Number} userId 					- User id.
	 * @param {Boolean} isAMentor 				- user mentor or not.
	 * @returns {JSON} 							- Session details
	 */

	static async details(id, userId = '', isAMentor = '') {
		try {
			let filter = {}
			if (utils.isNumeric(id)) {
				filter.id = id
			} else {
				filter.share_link = id
			}

			const sessionDetails = await sessionQueries.findOne(filter, {
				attributes: {
					exclude: ['share_link', 'mentee_password', 'mentor_password'],
				},
			})

			if (!sessionDetails) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			sessionDetails.is_enrolled = false
			if (userId) {
				let sessionAttendee = await sessionAttendeesQueries.findOne({
					session_id: sessionDetails.id,
					mentee_id: userId,
				})
				if (sessionAttendee) {
					sessionDetails.is_enrolled = true
				}
			}

			// check for accessibility
			if (userId !== '' && isAMentor !== '') {
				let isAccessible = await this.checkIfSessionIsAccessible(sessionDetails, userId, isAMentor)

				// Throw access error
				if (!isAccessible) {
					return common.failureResponse({
						statusCode: httpStatusCode.not_found,
						message: 'SESSION_RESTRICTED',
					})
				}
			}

			if (userId != sessionDetails.mentor_id) {
				delete sessionDetails?.meeting_info?.link
				delete sessionDetails?.meeting_info?.meta
			} else {
				sessionDetails.is_assigned = sessionDetails.mentor_id !== sessionDetails.created_by
			}
			delete sessionDetails.created_by
			delete sessionDetails.updated_by

			if (sessionDetails.image && sessionDetails.image.some(Boolean)) {
				sessionDetails.image = sessionDetails.image.map(async (imgPath) => {
					if (imgPath != '') {
						return await utils.getDownloadableUrl(imgPath)
					}
				})
				sessionDetails.image = await Promise.all(sessionDetails.image)
			}

			const mentorDetails = await userRequests.details('', sessionDetails.mentor_id)
			sessionDetails.mentor_name = mentorDetails.data.result.name
			sessionDetails.organization = mentorDetails.data.result.organization

			const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return common.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [sessionDetails.mentor_organization_id, defaultOrgId],
				},
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, sessionDetails.mentor_organization_id)

			const processDbResponse = utils.processDbResponse(sessionDetails, validationData)

			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: processDbResponse,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * @description 							- check if session is accessible based on user's saas policy.
	 * @method
	 * @name checkIfSessionIsAccessible
	 * @param {Number} userId 					- User id.
	 * @param {Array}							- Session data
	 * @param {Boolean} isAMentor 				- user mentor or not.
	 * @returns {JSON} 							- List of filtered sessions
	 */
	static async checkIfSessionIsAccessible(session, userId, isAMentor) {
		try {
			if (isAMentor && session.mentor_id === userId) return true
			const userPolicyDetails = isAMentor
				? await mentorExtensionQueries.getMentorExtension(userId, [
						'external_session_visibility',
						'organization_id',
				  ])
				: await menteeExtensionQueries.getMenteeExtension(userId, [
						'external_session_visibility',
						'organization_id',
				  ])

			// Throw error if mentor/mentee extension not found
			if (!userPolicyDetails || Object.keys(userPolicyDetails).length === 0) {
				return common.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: isAMentor ? 'MENTORS_NOT_FOUND' : 'MENTEE_EXTENSION_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}

			// check the accessibility conditions
			let isAccessible = false
			if (userPolicyDetails.external_session_visibility && userPolicyDetails.organization_id) {
				const { external_session_visibility, organization_id } = userPolicyDetails
				const isEnrolled = session.is_enrolled || false

				switch (external_session_visibility) {
					/**
					 * If {userPolicyDetails.external_session_visibility === CURRENT} user will be able to sessions-
					 *  -created by his/her organization mentors.
					 * So will check if mentor_organization_id equals user's  organization_id
					 */
					case common.CURRENT:
						isAccessible = isEnrolled || session.mentor_organization_id === organization_id
						break
					/**
					 * user external_session_visibility is ASSOCIATED
					 * user can see sessions where session's visible_to_organizations contain user's organization_id and -
					 *  - session's visibility not CURRENT (In case of same organization session has to be
					 * fetched for that we added OR condition {"mentor_organization_id" = ${userPolicyDetails.organization_id}})
					 */
					case common.ASSOCIATED:
						isAccessible =
							isEnrolled ||
							(session.visible_to_organizations.includes(organization_id) &&
								session.visibility != common.CURRENT) ||
							session.mentor_organization_id === organization_id
						break
					/**
					 * user's external_session_visibility === ALL (ASSOCIATED sessions + sessions whose visibility is ALL)
					 */
					case common.ALL:
						isAccessible =
							isEnrolled ||
							(session.visible_to_organizations.includes(organization_id) &&
								session.visibility != common.CURRENT) ||
							session.visibility === common.ALL ||
							session.mentor_organization_id === organization_id
						break
					default:
						break
				}
			}
			return isAccessible
		} catch (err) {
			return err
		}
	}

	/**
	 * Sessions list
	 * @method
	 * @name list
	 * @param {Object} req -request data.
	 * @param {String} req.decodedToken.id - User Id.
	 * @param {String} req.pageNo - Page No.
	 * @param {String} req.pageSize - Page size limit.
	 * @param {String} req.searchText - Search text.
	 * @param {Boolean} isAMentor - Is a mentor.
	 * @returns {JSON} - Session List.
	 */

	static async list(loggedInUserId, page, limit, search, queryParams, isAMentor) {
		try {
			let allSessions = await menteeService.getAllSessions(
				page,
				limit,
				search,
				loggedInUserId,
				queryParams,
				isAMentor
			)

			const result = {
				data: allSessions.rows,
				count: allSessions.count,
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			console.log
			throw error
		}
	}

	/**
	 * Enroll Session.
	 * @method
	 * @name enroll
	 * @param {String} sessionId - Session id.
	 * @param {Object} userTokenData
	 * @param {String} userTokenData.id - user id.
	 * @param {String} timeZone - timezone.
	 * @returns {JSON} - Enroll session.
	 */

	static async enroll(sessionId, userTokenData, timeZone) {
		const userDetails = (await userRequests.details('', userTokenData.id)).data.result

		const userId = userTokenData.id
		const email = userDetails.email
		const name = userDetails.name
		try {
			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorName = await userRequests.details('', session.mentor_id)
			session.mentor_name = mentorName.data.result.name

			const sessionAttendeeExist = await sessionAttendeesQueries.findOne({
				session_id: sessionId,
				mentee_id: userId,
			})

			if (sessionAttendeeExist) {
				return common.failureResponse({
					message: 'USER_ALREADY_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (session.seats_remaining <= 0) {
				return common.failureResponse({
					message: 'SESSION_SEAT_FULL',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const attendee = {
				session_id: sessionId,
				mentee_id: userId,
				time_zone: timeZone,
			}

			await sessionAttendeesQueries.create(attendee)
			await sessionEnrollmentQueries.create(_.omit(attendee, 'time_zone'))

			await sessionQueries.updateEnrollmentCount(sessionId, false)

			const templateData = await notificationQueries.findOneEmailTemplate(
				process.env.MENTEE_SESSION_ENROLLMENT_EMAIL_TEMPLATE,
				session.mentor_organization_id
			)

			if (templateData) {
				// Push successfull enrollment to session in kafka
				const payload = {
					type: 'email',
					email: {
						to: email,
						subject: templateData.subject,
						body: utils.composeEmailBody(templateData.body, {
							name,
							sessionTitle: session.title,
							mentorName: session.mentor_name,
							startDate: utils.getTimeZone(session.start_date, common.dateFormat, session.time_zone),
							startTime: utils.getTimeZone(session.start_date, common.timeFormat, session.time_zone),
						}),
					},
				}

				await kafkaCommunication.pushEmailToKafka(payload)
			}

			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'USER_ENROLLED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * UnEnroll Session.
	 * @method
	 * @name enroll
	 * @param {String} sessionId - Session id.
	 * @param {Object} userTokenData
	 * @param {String} userTokenData._id - user id.
	 * @returns {JSON} - UnEnroll session.
	 */

	static async unEnroll(sessionId, userTokenData) {
		const userDetails = (await userRequests.details('', userTokenData.id)).data.result

		const userId = userTokenData.id
		const name = userDetails.name
		const email = userDetails.email
		try {
			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorName = await userRequests.details('', session.mentor_id)
			session.mentor_name = mentorName.data.result.name

			const deletedRows = await sessionAttendeesQueries.unEnrollFromSession(sessionId, userId)
			if (deletedRows === 0) {
				return common.failureResponse({
					message: 'USER_NOT_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			await sessionEnrollmentQueries.unEnrollFromSession(sessionId, userId)

			await sessionQueries.updateEnrollmentCount(sessionId)

			const templateData = await notificationQueries.findOneEmailTemplate(
				process.env.MENTEE_SESSION_CANCELLATION_EMAIL_TEMPLATE,
				session.mentor_organization_id
			)

			if (templateData) {
				// Push successful unenrollment to session in kafka
				const payload = {
					type: 'email',
					email: {
						to: email,
						subject: templateData.subject,
						body: utils.composeEmailBody(templateData.body, {
							name,
							sessionTitle: session.title,
							mentorName: session.mentor_name,
						}),
					},
				}

				await kafkaCommunication.pushEmailToKafka(payload)
			}

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'USER_UNENROLLED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Verify whether user is a mentor
	 * @method
	 * @name verifyMentor
	 * @param {String} id - user id.
	 * @returns {Boolean} - true/false.
	 */

	static async verifyMentor(id) {
		return new Promise((resolve, reject) => {
			try {
				let options = {
					headers: {
						'Content-Type': 'application/json',
						internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
					},
				}

				let apiUrl = apiBaseUrl + apiEndpoints.VERIFY_MENTOR + '?userId=' + id
				try {
					request.post(apiUrl, options, (err, data) => {
						if (err) {
							return reject({
								message: 'USER_SERVICE_DOWN',
							})
						} else {
							data.body = JSON.parse(data.body)
							if (data.body.result && data.body.result.isAMentor) {
								return resolve(true)
							} else {
								return resolve(false)
							}
						}
					})
				} catch (error) {
					reject(error)
				}
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Share a session.
	 * @method
	 * @name share
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - Session share link.
	 */

	static async share(sessionId) {
		try {
			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let shareLink = session.share_link
			if (!shareLink) {
				shareLink = utils.md5Hash(sessionId + '###' + session.mentor_id)
				await sessionQueries.updateOne(
					{
						id: sessionId,
					},
					{ share_link: shareLink }
				)
			}
			return common.successResponse({
				message: 'SESSION_LINK_GENERATED_SUCCESSFULLY',
				statusCode: httpStatusCode.ok,
				result: {
					shareLink,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * List of upcoming sessions.
	 * @method
	 * @name upcomingPublishedSessions
	 * @param {Number} page - page no.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search text.
	 * @returns {JSON} - List of upcoming sessions.
	 */

	static async upcomingPublishedSessions(page, limit, search) {
		try {
			const publishedSessions = await sessionData.searchAndPagination(page, limit, search)
			return publishedSessions
		} catch (error) {
			return error
		}
	}

	/**
	 * Start session.
	 * @method
	 * @name start
	 * @param {String} sessionId - session id.
	 * @param {String} token - token information.
	 * @returns {JSON} - start session link
	 */

	static async start(sessionId, userTokenData) {
		const loggedInUserId = userTokenData.id
		const mentorName = userTokenData.name
		try {
			const mentor = await mentorExtensionQueries.getMentorExtension(loggedInUserId)
			if (!mentor) {
				return common.failureResponse({
					message: 'NOT_A_MENTOR',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return resolve(
					common.failureResponse({
						message: 'SESSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				)
			}

			if (session.mentor_id !== mentor.user_id) {
				return common.failureResponse({
					message: 'CANNOT_START_OTHER_MENTOR_SESSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (process.env.DEFAULT_MEETING_SERVICE == 'OFF' && !session?.meeting_info?.link) {
				return common.failureResponse({
					message: 'MEETING_SERVICE_INFO_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let meetingInfo
			if (session?.meeting_info?.value !== common.BBB_VALUE && !session.started_at) {
				await sessionQueries.updateOne(
					{
						id: sessionId,
					},
					{
						status: common.LIVE_STATUS,
						started_at: utils.utcFormat(),
					}
				)
			}
			if (session?.meeting_info?.link) {
				meetingInfo = session.meeting_info
			} else {
				let currentDate = moment().utc().format(common.UTC_DATE_TIME_FORMAT)

				const formattedStartDate = moment.unix(session.start_date).format(common.UTC_DATE_TIME_FORMAT)

				const formattedEndDate = moment.unix(session.end_date).format(common.UTC_DATE_TIME_FORMAT)

				let elapsedMinutes = moment(formattedStartDate).diff(currentDate, 'minutes')

				if (elapsedMinutes > 10) {
					return common.failureResponse({
						message: 'SESSION_ESTIMATED_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				let sessionDuration = moment(formattedEndDate).diff(formattedStartDate, 'minutes')

				const meetingDetails = await bigBlueButtonRequests.createMeeting(
					session.id,
					session.title,
					session.mentee_password,
					session.mentor_password,
					sessionDuration
				)
				if (!meetingDetails.success) {
					return common.failureResponse({
						message: 'MEETING_NOT_CREATED',
						statusCode: httpStatusCode.internal_server_error,
						responseCode: 'SERVER_ERROR',
					})
				}

				const moderatorMeetingLink = await bigBlueButtonService.joinMeetingAsModerator(
					session.id,
					mentorName,
					session.mentor_password
				)
				meetingInfo = {
					platform: common.BBB_PLATFORM,
					value: common.BBB_VALUE,
					link: moderatorMeetingLink,
					meta: {
						meeting_id: meetingDetails.data.response.internalMeetingID,
					},
				}

				await sessionQueries.updateOne(
					{
						id: sessionId,
					},
					{
						status: common.LIVE_STATUS,
						started_at: utils.utcFormat(),
						meeting_info: meetingInfo,
					}
				)
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_START_LINK',
				result: meetingInfo,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Set mentor password in session collection..
	 * @method
	 * @name setMentorPassword
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @returns {JSON} - updated session data.
	 */

	static async setMentorPassword(sessionId, userId) {
		try {
			let hashPassword = utils.hash('' + sessionId + userId + '')
			const result = await sessionQueries.updateOne(
				{
					id: sessionId,
				},
				{
					mentor_password: hashPassword,
				}
			)

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Set mentee password in session collection.
	 * @method
	 * @name setMenteePassword
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @returns {JSON} - update session data.
	 */

	static async setMenteePassword(sessionId, createdAt) {
		try {
			let hashPassword = utils.hash(sessionId + createdAt)
			const result = await sessionQueries.updateOne(
				{
					id: sessionId,
				},
				{
					mentee_password: hashPassword,
				}
			)

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Update session collection status to completed.
	 * @method
	 * @name completed
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - updated session data.
	 */

	static async completed(sessionId, isBBB) {
		try {
			const sessionDetails = await sessionQueries.findOne({
				id: sessionId,
			})
			if (!sessionDetails) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (sessionDetails.meeting_info.value == common.BBB_VALUE && sessionDetails.started_at != null && !isBBB) {
				return common.successResponse({
					statusCode: httpStatusCode.ok,
					result: [],
				})
			}

			await sessionQueries.updateOne(
				{
					id: sessionId,
				},
				{
					status: common.COMPLETED_STATUS,
					completed_at: utils.utcFormat(),
				},
				{ returning: false, raw: true }
			)

			if (sessionDetails.meeting_info.value == common.BBB_VALUE && isBBB) {
				const recordingInfo = await bigBlueButtonRequests.getRecordings(sessionId)

				if (recordingInfo?.data?.response) {
					const { recordings } = recordingInfo.data.response

					// Update recording info in post_session_table
					await postSessionQueries.create({
						session_id: sessionId,
						recording_url: recordings.recording.playback.format.url,
						recording: recordings,
					})
				}
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				result: [],
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name getRecording
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - Recording details.
	 */

	static async getRecording(sessionId) {
		try {
			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const recordingInfo = await bigBlueButtonRequests.getRecordings(sessionId)

			// let response = await requestUtil.get("https://dev.mentoring.shikshalokam.org/playback/presentation/2.3/6af6737c986d83e8d5ce2ff77af1171e397c739e-1638254682349");
			// console.log(response);

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				result: recordingInfo.data.response.recordings,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name updateRecordingUrl
	 * @param {String} internalMeetingID - Internal Meeting ID
	 * @returns {JSON} - Recording link updated.
	 */

	static async updateRecordingUrl(internalMeetingId, recordingUrl) {
		try {
			const sessionDetails = await sessionQueries.findOne({
				'meeting_info.meta.meeting_id': internalMeetingId,
			})

			if (!sessionDetails) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const rowsAffected = await postSessionQueries.updateOne(
				{
					session_id: sessionDetails.id,
				},
				{
					recording_url: recordingUrl,
				}
			)

			if (rowsAffected === 0) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}
	/**
	 * Verify if time slot is available for the mentor
	 * @method
	 * @name isTimeSlotAvailable
	 * @param {String} id - user id.
	 * @param {String} startDate - start date in utc.
	 * @param {String} endDate - end date in utc.
	 * @returns {String} - STAR_AND_END_DATE_OVERLAP/START_DATE_OVERLAP/END_DATE_OVERLAP.
	 */

	static async isTimeSlotAvailable(id, startDate, endDate, sessionId) {
		try {
			const sessions = await sessionQueries.getSessionByUserIdAndTime(id, startDate, endDate, sessionId)
			if (!sessions) {
				return true
			}

			const startDateResponse = sessions.startDateResponse?.[0]
			const endDateResponse = sessions.endDateResponse?.[0]

			if (startDateResponse && endDateResponse && startDateResponse.id !== endDateResponse.id) {
				return {
					isTimeSlotAvailable: false,
					sessionName: `${startDateResponse.title} and ${endDateResponse.title}`,
				}
			}

			if (startDateResponse || endDateResponse) {
				return {
					isTimeSlotAvailable: false,
					sessionName: (startDateResponse || endDateResponse).title,
				}
			}

			return true
		} catch (error) {
			return error
		}
	}
	/**
	 * Downloads a list of sessions created by a user in CSV format based on query parameters.
	 * @method
	 * @name downloadList
	 * @param {string} userId - User ID of the creator.
	 * @param {Object} queryParams - Query parameters for filtering sessions.
	 * @param {string} timezone - Time zone for date and time formatting.
	 * @param {string} searchText - Text to search for in session titles.
	 * @returns {Promise<Object>} - A promise that resolves to a response object containing
	 *                             a CSV stream of the session list for download.
	 * @throws {Error} - Throws an error if there's an issue during processing.
	 */

	static async downloadList(userId, queryParams, timezone, searchText) {
		try {
			const filter = {
				created_by: userId,
				...(queryParams.status && { status: queryParams.status.split(',') }),
				...(queryParams.type && { type: queryParams.type.split(',') }),
				...(searchText && {
					[Op.or]: [
						{ title: { [Op.iLike]: `%${searchText}%` } },
						{ mentor_name: { [Op.iLike]: `%${searchText}%` } },
					],
				}),
			}
			const sortBy = queryParams.sort_by || 'created_at'
			const order = queryParams.order || 'DESC'

			let sessions = await sessionQueries.findAll(filter, {
				order: [[sortBy, order]],
			})

			const CSVFields = [
				{ label: 'No.', value: 'index_number' },
				{ label: 'Session Name', value: 'title' },
				{ label: 'Type', value: 'type' },
				{ label: 'Mentors', value: 'mentor_name' },
				{ label: 'Date', value: 'start_date' },
				{ label: 'Time', value: 'start_time' },
				{ label: 'Duration (Min)', value: 'duration_in_minutes' },
				{ label: 'Mentee Count', value: 'mentee_count' },
				{ label: 'Status', value: 'status' },
			]

			//Return an empty CSV if sessions list is empty
			if (sessions.length == 0) {
				const parser = new Parser({
					fields: CSVFields,
					header: true,
					includeEmptyRows: true,
					defaultValue: null,
				})
				const csv = parser.parse()
				return common.successResponse({
					statusCode: httpStatusCode.ok,
					isResponseAStream: true,
					stream: csv,
					fileName: 'session_list' + moment() + '.csv',
				})
			}

			sessions = await this.populateSessionDetails({
				sessions: sessions,
				timezone: timezone,
				transformEntities: true,
			})

			const parser = new Parser({ fields: CSVFields, header: true, includeEmptyRows: true, defaultValue: null })
			const csv = parser.parse(sessions)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				isResponseAStream: true,
				stream: csv,
				fileName: 'session_list' + moment() + '.csv',
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Transform session data from epoch format to date time format with duration.
	 *
	 * @static
	 * @method
	 * @name transformSessionDate
	 * @param {Object} session - Sequelize response for a mentoring session.
	 * @param {string} [timezone='Asia/Kolkata'] - Time zone for date and time formatting.
	 * @returns {Object} - Transformed session data.
	 * @throws {Error} - Throws an error if any issues occur during transformation.
	 */
	static async transformSessionDate(session, timezone = 'Asia/Kolkata') {
		try {
			const transformDate = (epochTimestamp) => {
				const date = moment.unix(epochTimestamp) // Use moment.unix() to handle Unix timestamps
				const formattedDate = date.clone().tz(timezone).format('DD-MMM-YYYY')
				const formattedTime = date.clone().tz(timezone).format('hh:mm A')
				return { formattedDate, formattedTime }
			}

			const transformDuration = (startEpoch, endEpoch) => {
				const startDate = moment.unix(startEpoch)
				const endDate = moment.unix(endEpoch)
				const duration = moment.duration(endDate.diff(startDate))
				return duration.asMinutes()
			}

			const startDate = session.start_date
			const endDate = session.end_date

			const { formattedDate: startDateFormatted, formattedTime: startTimeFormatted } = transformDate(startDate)

			const durationInMinutes = transformDuration(startDate, endDate)

			return {
				start_date: startDateFormatted,
				start_time: startTimeFormatted,
				duration_in_minutes: durationInMinutes,
			}
		} catch (error) {
			throw error
		}
	}
	/**
	 * Populates session details with additional information such as start_date,
	 * start_time, duration_in_minutes, mentee_count, and index_number.
	 * @method
	 * @name populateSessionDetails
	 * @param {Object[]} sessions - Array of session objects.
	 * @param {string} timezone - Time zone for date and time formatting.
	 * @param {number} [page] - Page number for pagination.
	 * @param {number} [limit] - Limit of sessions per page for pagination.
	 * @param {boolean} [transformEntities=false] - Flag to indicate whether to transform entity types.
	 * @returns {Promise<Array>} - Array of session objects with populated details.
	 * @throws {Error} - Throws an error if there's an issue during processing.
	 */
	static async populateSessionDetails({ sessions, timezone, page, limit, transformEntities = false }) {
		try {
			const uniqueOrgIds = [...new Set(sessions.map((obj) => obj.mentor_organization_id))]
			sessions = await entityTypeService.processEntityTypesToAddValueLabels(
				sessions,
				uniqueOrgIds,
				common.sessionModelName,
				'mentor_organization_id'
			)

			await Promise.all(
				sessions.map(async (session, index) => {
					if (transformEntities) {
						if (session.status) session.status = session.status.label
						if (session.type) session.type = session.type.label
					}
					const res = await this.transformSessionDate(session, timezone)
					const menteeCount = session.seats_limit - session.seats_remaining
					let indexNumber

					indexNumber = index + 1 + (page && limit ? limit * (page - 1) : 0)

					Object.assign(session, {
						start_date: res.start_date,
						start_time: res.start_time,
						duration_in_minutes: res.duration_in_minutes,
						mentee_count: menteeCount,
						index_number: indexNumber,
					})
				})
			)
			return sessions
		} catch (error) {
			throw error
		}
	}

	/**
	 * Retrieves and formats sessions created by a user based on query parameters.
	 * @method
	 * @name createdSessions
	 * @param {string} userId - User ID of the creator.
	 * @param {Object} queryParams - Query parameters for filtering and sorting sessions.
	 * @param {string} timezone - Time zone for date and time formatting.
	 * @param {number} page - Page number for pagination.
	 * @param {number} limit - Limit of sessions per page for pagination.
	 * @param {string} searchText - Text to search for in session titles or mentor names.
	 * @returns {Promise<Object>} - A promise that resolves to a response object containing
	 *                             the formatted list of created sessions and count.
	 * @throws {Error} - Throws an error if there's an issue during processing.
	 */

	static async createdSessions(userId, queryParams, timezone, page, limit, searchText) {
		try {
			const filter = {
				created_by: userId,
				...(queryParams.status && { status: queryParams.status.split(',') }),
				...(queryParams.type && { type: queryParams.type.split(',') }),
				...(searchText && {
					[Op.or]: [
						{ title: { [Op.iLike]: `%${searchText}%` } },
						{ mentor_name: { [Op.iLike]: `%${searchText}%` } },
					],
				}),
			}
			const sortBy = queryParams.sort_by || 'created_at'
			const order = queryParams.order || 'DESC'

			let sessions = await sessionQueries.findAndCountAll(filter, {
				order: [[sortBy, order]],
				offset: limit * (page - 1),
				limit: limit,
			})
			if (sessions.rows.length == 0) {
				return common.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'LIST_FETCHED',
					result: { data: [], count: 0 },
				})
			}

			sessions.rows = await this.populateSessionDetails({
				sessions: sessions.rows,
				timezone: timezone,
				page: page,
				limit: limit,
			})
			const formattedSessionList = sessions.rows.map((session, index) => ({
				id: session.id,
				index_number: index + 1 + limit * (page - 1), //To keep consistency with pagination
				title: session.title,
				type: session.type,
				mentor_name: session.mentor_name,
				start_date: session.start_date,
				start_time: session.start_time,
				duration_in_minutes: session.duration_in_minutes,
				status: session.status,
				mentee_count: session.mentee_count,
				mentor_organization_id: session.mentor_organization_id,
			}))

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_LIST_FETCHED',
				result: { data: formattedSessionList, count: sessions.count },
			})
		} catch (error) {
			throw error
		}
	}
	/**
	 * Bulk update mentor names for sessions.
	 * @method
	 * @name bulkUpdateMentorNames
	 * @param {Array} mentorsId - Array of mentor IDs to update.
	 * @param {STRING} mentorsName - Mentor name that needs to be updated.
	 * @returns {Object} - Success response indicating the update was performed successfully.
	 * @throws {Error} - Throws an error if there's an issue during the bulk update.
	 */
	static async bulkUpdateMentorNames(mentorsId, mentorsName) {
		try {
			await sessionQueries.updateSession(
				{
					mentor_id: mentorsId,
				},
				{
					mentor_name: mentorsName,
				}
			)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get details of mentees enrolled in a session, including their extension details.
	 * @method
	 * @name enrolledMentees
	 * @param {string} sessionId - ID of the session.
	 * @param {Object} req.query - Query params.
	 * @returns {Object} - Success response with details of enrolled mentees.
	 * @throws {Error} - Throws an error if there's an issue during data retrieval.
	 */
	static async enrolledMentees(sessionId, queryParams) {
		try {
			const mentees = await sessionAttendeesQueries.findAll({ session_id: sessionId })
			const menteeIds = mentees.map((mentee) => mentee.mentee_id)

			const [menteeDetails, mentorDetails, attendeesAccounts] = await Promise.all([
				menteeExtensionQueries.getUsersByUserIds(menteeIds),
				mentorExtensionQueries.getMentorsByUserIds(menteeIds),
				userRequests.getListOfUserDetails(menteeIds).then((result) => result.result),
			])

			// Combine details of mentees and mentors
			let enrolledUsers = [...menteeDetails, ...mentorDetails]

			// Process entity types to add value labels
			const uniqueOrgIds = [...new Set(enrolledUsers.map((user) => user.organization_id))]
			enrolledUsers = await entityTypeService.processEntityTypesToAddValueLabels(
				enrolledUsers,
				uniqueOrgIds,
				[await menteeExtensionQueries.getModelName(), await mentorExtensionQueries.getModelName()],
				'organization_id'
			)

			// Merge arrays based on user_id and id
			const mergedUserArray = enrolledUsers.map((user) => {
				const matchingUserDetails = attendeesAccounts.find((details) => details.id === user.user_id)

				// Merge properties from user and matchingUserDetails

				return matchingUserDetails ? { ...user, ...matchingUserDetails } : user
			})
			if (queryParams.csv) {
				const CSVFields = [
					{ label: 'Name', value: 'name' },
					{ label: 'Designation', value: 'designation' },
					{ label: 'Organization', value: 'organization' },
					{ label: 'E-mail ID', value: 'email' },
					{ label: 'Enrollment Type', value: 'type' },
				]

				//Return an empty CSV if list is empty
				if (mergedUserArray.length == 0) {
					const parser = new Parser({
						fields: CSVFields,
						header: true,
						includeEmptyRows: true,
						defaultValue: null,
					})
					const csv = parser.parse()
					return common.successResponse({
						statusCode: httpStatusCode.ok,
						isResponseAStream: true,
						stream: csv,
						fileName: 'mentee_list_' + sessionId + '_' + moment() + '.csv',
					})
				}

				const parser = new Parser({
					fields: CSVFields,
					header: true,
					includeEmptyRows: true,
					defaultValue: null,
				})
				const csv = parser.parse(
					mergedUserArray.map((user) => ({
						name: user.name,
						designation: user.designation.map((designation) => designation.label).join(', '), // Assuming designation is an array
						email: user.email,
						type: user.type,
						organization: user.organization.name,
					}))
				)

				return common.successResponse({
					statusCode: httpStatusCode.ok,
					isResponseAStream: true,
					stream: csv,
					fileName: 'mentee_list_' + sessionId + '_' + moment() + '.csv',
				})
			}
			const propertiesToDelete = [
				'user_id',
				'visibility',
				'organization_id',
				'meta',
				'rating',
				'stats',
				'tags',
				'configs',
				'visible_to_organizations',
				'external_session_visibility',
				'external_mentor_visibility',
				'experience',
				'email_verified',
				'gender',
				'location',
				'about',
				'share_link',
				'status',
				'last_logged_in_at',
				'has_accepted_terms_and_conditions',
				'languages',
				'preferred_language',
				'custom_entity_text',
			]

			const cleanedAttendeesAccounts = mergedUserArray.map((user) => {
				propertiesToDelete.forEach((property) => {
					delete user[property]
				})

				return user
			})
			// Return success response with merged user details
			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_ATTENDEES',
				result: cleanedAttendeesAccounts,
			})
		} catch (error) {
			throw error
		}
	}
}
