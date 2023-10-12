/**
 * name : user.js
 * author : Vishnu
 * created-date : 27-Sept-2023
 * Description : Internal calls to elevate-user service.
 */

// Dependencies
const userBaseUrl = process.env.USER_SERVICE_HOST + process.env.USER_SERVICE_BASE_URL
const requests = require('@generics/requests')
const endpoints = require('@constants/endpoints')
const request = require('request')
const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')

module.exports = class UserServiceRequests {
	/**
	 * User profile details.
	 * @method
	 * @name details
	 * @param {String} [token =  ""] - token information.
	 * @param {String} [userId =  ""] - user id.
	 * @returns {JSON} - User profile details.
	 */

	static async details(token = '', userId = '') {
		try {
			let profileUrl = userBaseUrl + endpoints.USER_PROFILE_DETAILS
			let internalToken = false

			if (userId != '') {
				profileUrl = profileUrl + '/' + userId
				internalToken = true
			}
			const profileDetails = await requests.get(profileUrl, token, internalToken)
			return profileDetails
		} catch (error) {
			return error
		}
	}

	/**
	 * Get Accounts details.
	 * @method
	 * @name getAllAccountsDetail
	 * @param {Array} userIds
	 * @returns
	 */
	static getListOfUserDetails(userIds) {
		return new Promise((resolve, reject) => {
			const options = {
				headers: {
					'Content-Type': 'application/json',
					internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
				},
				form: {
					userIds,
				},
			}

			const apiUrl = userBaseUrl + endpoints.LIST_ACCOUNTS
			try {
				request.post(apiUrl, options, callback)
				function callback(err, data) {
					if (err) {
						reject({
							message: 'USER_SERVICE_DOWN',
						})
					} else {
						data.body = JSON.parse(data.body)
						resolve(data.body)
					}
				}
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Share a mentor Profile.
	 * @method
	 * @name share
	 * @param {String} profileId - Profile id.
	 * @returns {JSON} - Shareable profile link.
	 */

	static share(profileId) {
		return new Promise(async (resolve, reject) => {
			const apiUrl = userBaseUrl + endpoints.SHARE_MENTOR_PROFILE + '/' + profileId
			try {
				let shareLink = await requests.get(apiUrl, false, true)
				if (shareLink.data.responseCode === 'CLIENT_ERROR') {
					return resolve(
						common.failureResponse({
							message: shareLink.data.message,
							statusCode: httpStatusCode.bad_request,
							responseCode: 'CLIENT_ERROR',
						})
					)
				}
				return resolve(
					common.successResponse({
						statusCode: httpStatusCode.ok,
						message: shareLink.data.message,
						result: shareLink.data.result,
					})
				)
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * User list.
	 * @method
	 * @name list
	 * @param {Boolean} userType - mentor/mentee.
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search field.
	 * @returns {JSON} - List of users
	 */

	static async list(userType, pageNo, pageSize, searchText) {
		try {
			const apiUrl =
				userBaseUrl +
				endpoints.USERS_LIST +
				'?type=' +
				userType +
				'&page=' +
				pageNo +
				'&limit=' +
				pageSize +
				'&search=' +
				searchText
			const userDetails = await requests.get(apiUrl, false, true)
			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: userDetails.data.message,
				result: userDetails.data.result,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Fetches the default organization details for a given organization code/id.
	 * @param {string} organisationCode - The code of the organization.
	 * @returns {Promise} A promise that resolves with the organization details or rejects with an error.
	 */

	static async fetchDefaultOrgDetails(organisationCode) {
		return new Promise(async (resolve, reject) => {
			try {
				// Construct the URL to read organization details
				let orgReadUrl = userBaseUrl + endpoints.ORGANIZATION_READ + '?organisationCode=' + organisationCode
				let internalToken = true

				const orgDetails = await requests.get(
					orgReadUrl,
					'', // X-auth-token not required for internal call
					internalToken
				)
				return resolve(orgDetails)
			} catch (error) {
				return reject(error)
			}
		})
	}
}
