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
const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')
const IdMappingQueries = require('@database/queries/idMapping')

function transformIdsToString(json) {
	if (typeof json !== 'object' || json === null) {
		return json
	}

	// If it's an array, recursively transform each element
	if (Array.isArray(json)) {
		return json.map((item) => transformIdsToString(item))
	}

	// If it's an object, recursively transform each property
	const transformed = {}
	for (const key in json) {
		if (Object.prototype.hasOwnProperty.call(json, key)) {
			if (key === 'id' || key === 'organization_id' || key === 'related_orgs') {
				// Convert id and organization_id to string if they are integers
				transformed[key] = typeof json[key] === 'number' ? json[key].toString() : json[key]
			} else {
				// Recursively transform nested objects or arrays
				transformed[key] = transformIdsToString(json[key])
			}
		}
	}
	return transformed
}

/**
 * Fetches the default organization details for a given organization code/id.
 * @param {string} organisationIdentifier - The code/id of the organization.
 * @returns {Promise} A promise that resolves with the organization details or rejects with an error.
 */

const fetchOrgDetails = async function ({ organizationCode, organizationId }) {
	try {
		let orgReadUrl
		if (process.env.IS_EXTERNAL_USER_SERVICE == 'true') {
			//const externalOrgId = await IdMappingQueries.getUuidById(organizationId || organizationCode)
			orgReadUrl = `${userBaseUrl}${endpoints.ORGANIZATION_READ}?external_org_id=${
				organizationId || organizationCode
			}`
		} else {
			if (organizationId)
				orgReadUrl = `${userBaseUrl}${endpoints.ORGANIZATION_READ}?organisation_id=${organizationId}`
			else if (organizationCode)
				orgReadUrl = `${userBaseUrl}${endpoints.ORGANIZATION_READ}?organisation_code=${organizationCode}`
		}
		const internalToken = true
		const orgDetails = await requests.get(orgReadUrl, '', internalToken)
		/* 		if (process.env.IS_EXTERNAL_USER_SERVICE == 'true')
			orgDetails.data.result.id = await IdMappingQueries.getIdByUuid(orgDetails.data.result.id) */

		return transformIdsToString(orgDetails)
	} catch (error) {
		console.error('Error fetching organization details:', error)
		throw error
	}
}

/**
 * User profile details.
 * @method
 * @name details
 * @param {String} [token =  ""] - token information.
 * @param {String} [userId =  ""] - user id.
 * @returns {JSON} - User profile details.
 */

const fetchUserDetails = async ({ token, userId }) => {
	try {
		let profileUrl = `${userBaseUrl}${endpoints.USER_PROFILE_DETAILS}`
		/* 
		if (process.env.IS_EXTERNAL_USER_SERVICE === 'true' && userId)
			userId = await IdMappingQueries.getUuidById(userId) */

		if (userId) profileUrl += `/${userId}`

		const isInternalTokenRequired = true
		const userDetails = await requests.get(profileUrl, token, isInternalTokenRequired)

		if (!userDetails.data?.result?.user_roles) {
			userDetails.data = userDetails.data || {}
			userDetails.data.result = userDetails.data.result || {}
			userDetails.data.result.user_roles = [{ title: 'mentee' }]
		}
		if (process.env.IS_EXTERNAL_USER_SERVICE == 'true') {
			//userDetails.data.result.uuid = userDetails.data.result.id
			//userDetails.data.result.id = await IdMappingQueries.getIdByUuid(userDetails.data.result.id)
		}
		return userDetails
	} catch (error) {
		console.error(error)
		throw error
	}
}

/**
 * Get Accounts details.
 * @method
 * @name getAllAccountsDetail
 * @param {Array} userIds
 * @param {Array} paranoid : if true, discards deleted users.
 * @returns
 */

const getListOfUserDetails = function (userIds, excludeDeletedRecords = false) {
	return new Promise(async (resolve, reject) => {
		const options = {
			headers: {
				'Content-Type': 'application/json',
				internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
			},
			form: {
				userIds,
			},
		}

		let apiUrl = userBaseUrl + endpoints.LIST_ACCOUNTS
		if (excludeDeletedRecords) apiUrl = userBaseUrl + endpoints.LIST_ACCOUNTS + '?exclude_deleted_records=true'
		try {
			request.get(apiUrl, options, callback)
			function callback(err, data) {
				if (err) {
					reject({
						message: 'USER_SERVICE_DOWN',
					})
				} else {
					data.body = JSON.parse(data.body)
					return resolve(transformIdsToString(data.body))
				}
			}
		} catch (error) {
			return reject(error)
		}
	})
}

/**
 * Get Accounts details.
 * @method
 * @name getAllAccountsDetail
 * @param {Array} userIds
 * @returns
 */

const getListOfUserDetailsByEmail = function (emailIds) {
	return new Promise(async (resolve, reject) => {
		const options = {
			headers: {
				'Content-Type': 'application/json',
				internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
			},
			form: {
				emailIds,
			},
		}

		const apiUrl = userBaseUrl + endpoints.VALIDATE_EMAIL
		try {
			await request.post(apiUrl, options, callback)
			function callback(err, data) {
				if (err) {
					reject({
						message: 'USER_SERVICE_DOWN',
					})
				} else {
					data.body = JSON.parse(data.body)
					data.body.result = data.body.result.map(String)
					return resolve(transformIdsToString(data.body))
				}
			}
		} catch (error) {
			return reject(error)
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

const share = function (profileId) {
	return new Promise(async (resolve, reject) => {
		const apiUrl = userBaseUrl + endpoints.SHARE_MENTOR_PROFILE + '/' + profileId
		try {
			let shareLink = await requests.get(apiUrl, false, true)
			if (shareLink.data.responseCode === 'CLIENT_ERROR') {
				return resolve(
					responses.failureResponse({
						message: shareLink.data.message,
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				)
			}
			return resolve(
				responses.successResponse({
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

const list = function (userType, pageNo, pageSize, searchText) {
	return new Promise(async (resolve, reject) => {
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

			return resolve(userDetails)
		} catch (error) {
			return reject(error)
		}
	})
}

/**
 * User Role list.
 * @method
 * @name defaultList
 * @param {Number} page - page No.
 * @param {Number} limit - page limit.
 * @param {String} search - search field.
 * @returns {JSON} - List of roles
 */

const getListOfUserRoles = async (page, limit, search) => {
	const options = {
		headers: {
			'Content-Type': 'application/json',
			internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
		},
		json: true,
	}

	const apiUrl = userBaseUrl + endpoints.USERS_ROLE_LIST + `?page=${page}&limit=${limit}&search=${search}`

	try {
		const data = await new Promise((resolve, reject) => {
			request.get(apiUrl, options, (err, response) => {
				if (err) {
					reject({
						message: 'USER_SERVICE_DOWN',
						error: err,
					})
				} else {
					try {
						resolve(response.body)
					} catch (parseError) {
						reject({
							message: 'Failed to parse JSON response',
							error: parseError,
						})
					}
				}
			})
		})

		return data
	} catch (error) {
		throw error
	}
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

const listWithoutLimit = function (userType, searchText) {
	return new Promise(async (resolve, reject) => {
		try {
			const apiUrl = userBaseUrl + endpoints.USERS_LIST + '?type=' + userType + '&search=' + searchText
			const userDetails = await requests.get(apiUrl, false, true)

			return resolve(userDetails)
		} catch (error) {
			return reject(error)
		}
	})
}
const search = function (userType, pageNo, pageSize, searchText, userServiceQueries) {
	let userSearchBody = {}
	// queryParams to search in user service. Like user_ids , name , email etc...
	if (userServiceQueries) {
		for (const [key, value] of Object.entries(userServiceQueries)) {
			userSearchBody[key] = value
		}
	}
	return new Promise(async (resolve, reject) => {
		try {
			const apiUrl =
				userBaseUrl +
				endpoints.SEARCH_USERS +
				'?type=' +
				userType +
				'&page=' +
				pageNo +
				'&limit=' +
				pageSize +
				'&search=' +
				searchText
			const userDetails = await requests.post(apiUrl, { ...userSearchBody }, '', true)

			return resolve(userDetails)
		} catch (error) {
			return reject(error)
		}
	})
}

// const listOrganization = function (organizationIds = []) {
// 	return new Promise(async (resolve, reject) => {
// 		try {
// 			const apiUrl = userBaseUrl + endpoints.ORGANIZATION_LIST
// 			const organizations = await requests.post(apiUrl, { organizationIds }, '', true)

// 			return resolve(organizations)
// 		} catch (error) {
// 			return reject(error)
// 		}
// 	})
// }

/**
 * Get Organization list.
 * @method
 * @name listOrganization
 * @param {Array} organizationIds
 * @returns
 */

const listOrganization = function (organizationIds = []) {
	return new Promise(async (resolve, reject) => {
		const options = {
			headers: {
				'Content-Type': 'application/json',
				internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
			},
			form: {
				organizationIds,
			},
		}

		const apiUrl = userBaseUrl + endpoints.ORGANIZATION_LIST
		try {
			request.get(apiUrl, options, callback)
			let result = {
				success: true,
			}
			function callback(err, data) {
				if (err) {
					result.success = false
				} else {
					response = JSON.parse(data.body)
					result.data = response
				}
				return resolve(result)
			}
		} catch (error) {
			return reject(error)
		}
	})
}

module.exports = {
	fetchOrgDetails,
	fetchUserDetails,
	getListOfUserDetails,
	list,
	share,
	listWithoutLimit,
	search,
	getListOfUserRoles,
	listOrganization,
	getListOfUserDetailsByEmail,
}
