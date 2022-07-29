// Dependencies
const moment = require('moment-timezone')

const sessionAttendees = require('@db/sessionAttendees/queries')
const userProfile = require('./userProfile')
const sessionData = require('@db/sessions/queries')
const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')
const bigBlueButton = require('./bigBlueButton')
const feedbackHelper = require('./feedback')
const utils = require('@generics/utils')
const ObjectId = require('mongoose').Types.ObjectId
const sessionMentor = require('./mentors')

const { successResponse } = require('@constants/common')
module.exports = class MenteesHelper {
	/**
	 * Profile.
	 * @method
	 * @name profile
	 * @param {String} userId - user id.
	 * @returns {JSON} - profile details
	 */
	static async profile(id) {
		const menteeDetails = await userProfile.details('', id)
		const filter = { userId: id, isSessionAttended: true }
		const totalsession = await sessionAttendees.countAllSessionAttendees(filter)
		return successResponse({
			statusCode: httpStatusCode.ok,
			message: 'PROFILE_FTECHED_SUCCESSFULLY',
			result: { sessionsAttended: totalsession, ...menteeDetails.data.result },
		})
	}

	/**
	 * Sessions list. Includes upcoming and enrolled sessions.
	 * @method
	 * @name sessions
	 * @param {String} userId - user id.
	 * @param {Boolean} enrolledSessions - true/false.
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search field.
	 * @returns {JSON} - List of sessions
	 */

	static async sessions(userId, enrolledSessions, page, limit, search = '') {
		try {
			let sessions = []

			if (!enrolledSessions) {
				/** Upcoming unenrolled sessions {All sessions}*/
				sessions = await this.getAllSessions(page, limit, search, userId)
			} else {
				/** Upcoming user's enrolled sessions {My sessions}*/
				/* Fetch sessions if it is not expired or if expired then either status is live or if mentor 
                delays in starting session then status will remain published for that particular interval so fetch that also */

				/* TODO: Need to write cron job that will change the status of expired sessions from published to cancelled if not hosted by mentor */
				sessions = await this.getMySessions(page, limit, search, userId)
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: sessions,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Mentees reports.
	 * @method
	 * @name reports
	 * @param {String} userId - user id.
	 * @param {String} filterType - MONTHLY/WEEKLY/QUARTERLY.
	 * @returns {JSON} - Mentees reports
	 */

	static async reports(userId, filterType) {
		let filterStartDate
		let filterEndDate
		let totalSessionEnrolled
		let totalsessionsAttended
		try {
			if (filterType === 'MONTHLY') {
				;[filterStartDate, filterEndDate] = utils.getCurrentMonthRange()
			} else if (filterType === 'WEEKLY') {
				;[filterStartDate, filterEndDate] = utils.getCurrentWeekRange()
			} else if (filterType === 'QUARTERLY') {
				;[filterStartDate, filterEndDate] = utils.getCurrentQuarterRange()
			}

			totalSessionEnrolled = await sessionAttendees.countSessionAttendees(filterStartDate, filterEndDate, userId)

			totalsessionsAttended = await sessionAttendees.countSessionAttendeesThroughStartDate(
				filterStartDate,
				filterEndDate,
				userId
			)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MENTEES_REPORT_FETCHED_SUCCESSFULLY',
				result: { totalSessionEnrolled, totalsessionsAttended },
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Mentees homeFeed.
	 * @method
	 * @name homeFeed
	 * @param {String} userId - user id.
	 * @param {Boolean} isAMentor - true/false.
	 * @returns {JSON} - Mentees homeFeed.
	 */

	static async homeFeed(userId, isAMentor, page, limit, search) {
		try {
			/* All Sessions */

			let allSessions = await this.getAllSessions(page, limit, search, userId)

			/* My Sessions */

			let mySessions = await this.getMySessions(page, limit, search, userId)

			const result = {
				allSessions: allSessions[0].data,
				mySessions: mySessions[0].data,
			}

			const feedbackData = await feedbackHelper.pending(userId, isAMentor)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: result,
				meta: {
					type: 'feedback',
					data: feedbackData.result,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Join session as Mentees.
	 * @method
	 * @name joinSession
	 * @param {String} sessionId - session id.
	 * @param {String} token - Mentees token.
	 * @returns {JSON} - Mentees join session link.
	 */

	static joinSession(sessionId, token) {
		return new Promise(async (resolve, reject) => {
			try {
				const mentee = await userProfile.details(token)

				if (mentee.data.responseCode !== 'OK') {
					return resolve(
						common.failureResponse({
							message: 'USER_NOT_FOUND',
							statusCode: httpStatusCode.bad_request,
							responseCode: 'CLIENT_ERROR',
						})
					)
				}

				const session = await sessionData.findSessionById(sessionId)

				if (!session) {
					return resolve(
						common.failureResponse({
							message: 'SESSION_NOT_FOUND',
							statusCode: httpStatusCode.bad_request,
							responseCode: 'CLIENT_ERROR',
						})
					)
				}

				if (session.status == 'completed') {
					return resolve(
						common.failureResponse({
							message: 'SESSION_ENDED',
							statusCode: httpStatusCode.bad_request,
							responseCode: 'CLIENT_ERROR',
						})
					)
				}

				if (session.status !== 'live') {
					return resolve(
						common.failureResponse({
							message: 'JOIN_ONLY_LIVE_SESSION',
							statusCode: httpStatusCode.bad_request,
							responseCode: 'CLIENT_ERROR',
						})
					)
				}

				let menteeDetails = mentee.data.result

				const sessionAttendee = await sessionAttendees.findAttendeeBySessionAndUserId(
					menteeDetails._id,
					sessionId
				)

				if (!sessionAttendee) {
					return resolve(
						common.failureResponse({
							message: 'USER_NOT_ENROLLED',
							statusCode: httpStatusCode.bad_request,
							responseCode: 'CLIENT_ERROR',
						})
					)
				}

				let link = ''
				if (sessionAttendee.link) {
					link = sessionAttendee.link
				} else {
					const attendeeLink = await bigBlueButton.joinMeetingAsAttendee(
						sessionId,
						menteeDetails.name,
						session.menteePassword
					)

					await sessionAttendees.updateOne(
						{
							_id: sessionAttendee._id,
						},
						{
							link: attendeeLink,
							joinedAt: utils.utcFormat(),
							isSessionAttended: true,
						}
					)

					link = attendeeLink
				}

				return resolve(
					common.successResponse({
						statusCode: httpStatusCode.ok,
						message: 'SESSION_START_LINK',
						result: {
							link: link,
						},
					})
				)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Get all upcoming unenrolled session.
	 * @method
	 * @name getAllSessions
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search session.
	 * @param {String} userId - user id.
	 * @returns {JSON} - List of all sessions
	 */

	static async getAllSessions(page, limit, search, userId) {
		const sessionIds = []

		let filters = {
			status: { $in: ['published', 'live'] },
			endDateUtc: {
				$gt: moment().utc().format(common.UTC_DATE_TIME_FORMAT),
			},
			userId: {
				$ne: ObjectId(userId),
			},
		}

		const sessions = await sessionData.findAllSessions(page, limit, search, filters)

		sessions[0].data = await this.menteeSessionDetails(sessions[0].data, userId)
		sessions[0].data = await sessionMentor.sessionMentorDetails(sessions[0].data)
		return sessions
	}

	/**
	 * Get all enrolled session.
	 * @method
	 * @name getMySessions
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search session.
	 * @param {String} userId - user id.
	 * @returns {JSON} - List of enrolled sessions
	 */

	static async getMySessions(page, limit, search, userId) {
		const filters = {
			$and: [
				{
					'sessionDetail.endDateUtc': {
						$gt: moment().utc().format(common.UTC_DATE_TIME_FORMAT),
					},
				},
			],
			$or: [
				{
					'sessionDetail.status': 'published',
				},
				{
					'sessionDetail.status': 'live',
				},
			],
			userId,
		}
		const sessions = await sessionAttendees.findAllUpcomingMenteesSession(page, limit, search, filters)

		sessions[0].data = await sessionMentor.sessionMentorDetails(sessions[0].data)

		return sessions
	}

	static async menteeSessionDetails(sessions, userId) {
		const sessionIds = []
		if (sessions.length > 0) {
			sessions.forEach((session) => {
				sessionIds.push(session._id)
			})

			const filters = {
				sessionId: {
					$in: sessionIds,
				},
				userId,
			}
			const attendees = await sessionAttendees.findAllSessionAttendees(filters)
			await Promise.all(
				sessions.map(async (session) => {
					if (attendees) {
						const attendee = attendees.find(
							(attendee) => attendee.sessionId.toString() === session._id.toString()
						)
						session.isEnrolled = false
						if (attendee) {
							session.isEnrolled = true
						}
					} else {
						session.isEnrolled = false
					}
				})
			)
			return sessions
		} else {
			return sessions
		}
	}
}
