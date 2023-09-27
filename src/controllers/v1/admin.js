/**
 * name : admin.js
 * author : Priyanka Pradeep
 * created-date : 16-Jun-2023
 * Description : User admin
 */

// Dependencies
const adminService = require('@services/admin')
const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')

module.exports = class Admin {
	/**
	 * Delete user
	 * @method
	 * @name deleteUser
	 * @param {String} req.params._id -userId.
	 * @returns {JSON} - delete user response
	 */

	async deleteUser(req) {
		try {
			let isAdmin = false
			const roles = decodedToken.data.roles
			if (roles && roles.length > 0) {
				isAdmin = roles.some((role) => role.title === common.roleAdmin)
			}

			if (!isAdmin) {
				throw common.failureResponse({
					message: 'USER_IS_NOT_A_ADMIN',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const user = await adminService.deleteUser(req.params.id)
			return user
		} catch (error) {
			return error
		}
	}

	/**
	 * create admin users
	 * @method
	 * @name create
	 * @param {Object} bodyData - user create information
	 * @param {string} bodyData.email - email.
	 * @param {string} bodyData.password - email.
	 * @param {string} bodyData.secret_code - secret code for admin creation.
	 * @param {string} headers.internal_access_token - internal access token
	 * @returns {JSON} - returns created user information
	 */

	async create(req) {
		try {
			if (req.body.secret_code != process.env.ADMIN_SECRET_CODE) {
				throw common.failureResponse({
					message: 'INVALID_SECRET_CODE',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const createdAccount = await adminService.create(req.body)
			return createdAccount
		} catch (error) {
			return error
		}
	}

	/**
	 * login admin user
	 * @method
	 * @name login
	 * @param {Object} bodyData - user login data.
	 * @param {string} bodyData.email - email.
	 * @param {string} bodyData.password - email.
	 * @returns {JSON} - returns login response
	 */

	async login(req) {
		try {
			const loggedInAccount = await adminService.login(req.body)
			return loggedInAccount
		} catch (error) {
			return error
		}
	}
}
