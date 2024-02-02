/**
 * name : middlewares/authenticator
 * author : Aman Kumar Gupta
 * Date : 04-Nov-2021
 * Description : Validating authorized requests
 */

const jwt = require('jsonwebtoken')

const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const requests = require('@generics/requests')
const endpoints = require('@constants/endpoints')
const rolePermissionMappingQueries = require('@database/queries/role-permission-mapping')
const userRequests = require('@requests/user')

async function checkPermissions(roleId, requestPath, requestMethod) {
	const filter = { role_id: roleId }
	const attributes = ['request_type', 'api_path', 'module']
	const allPermissions = await rolePermissionMappingQueries.find(filter, attributes)

	const matchingPermissions = allPermissions.filter((permission) =>
		requestPath.match(new RegExp('^' + permission.api_path.replace(/\*/g, '.*') + '$'))
	)

	const isPermissionValid = matchingPermissions.some((permission) => permission.request_type.includes(requestMethod))

	return isPermissionValid
}

module.exports = async function (req, res, next) {
	try {
		let internalAccess = false
		let roleValidation = false
		let decodedToken

		const authHeader = req.get('X-auth-token')

		common.internalAccessUrs.map(function (path) {
			if (req.path.includes(path)) {
				if (
					req.headers.internal_access_token &&
					process.env.INTERNAL_ACCESS_TOKEN == req.headers.internal_access_token
				) {
					internalAccess = true
				}
			}
		})

		common.roleValidationPaths.map(function (path) {
			if (req.path.includes(path)) {
				roleValidation = true
			}
		})

		if (internalAccess && !authHeader) {
			next()
			return
		}

		if (!authHeader) {
			try {
				const response = await userRequests.getListOfUserRoles(
					common.pagination.DEFAULT_PAGE_NO,
					common.pagination.DEFAULT_PAGE_SIZE,
					common.PUBLIC_ROLE
				)
				const isPermissionValid = await checkPermissions(
					response.result.data.map((role) => role.id),
					req.path,
					req.method
				)
				if (!isPermissionValid) {
					throw common.failureResponse({
						message: 'PERMISSION_DENIED',
						statusCode: httpStatusCode.unauthorized,
						responseCode: 'UNAUTHORIZED',
					})
				}

				return next()
			} catch (error) {
				throw common.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}
		}

		const authHeaderArray = authHeader.split(' ')
		if (authHeaderArray[0] !== 'bearer') {
			throw common.failureResponse({
				message: 'UNAUTHORIZED_REQUEST',
				statusCode: httpStatusCode.unauthorized,
				responseCode: 'UNAUTHORIZED',
			})
		}
		try {
			decodedToken = jwt.verify(authHeaderArray[1], process.env.ACCESS_TOKEN_SECRET)
		} catch (err) {
			if (err.name === 'TokenExpiredError') {
				throw common.failureResponse({
					message: 'ACCESS_TOKEN_EXPIRED',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			} else {
				throw common.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}
		}

		if (!decodedToken) {
			throw common.failureResponse({
				message: 'UNAUTHORIZED_REQUEST',
				statusCode: httpStatusCode.unauthorized,
				responseCode: 'UNAUTHORIZED',
			})
		}

		let isAdmin = false
		if (decodedToken.data.roles) {
			isAdmin = decodedToken.data.roles.some((role) => role.title == common.ADMIN_ROLE)
			if (isAdmin) {
				req.decodedToken = decodedToken.data
				return next()
			}
		}
		if (roleValidation) {
			/* Invalidate token when user role is updated, say from mentor to mentee or vice versa */
			const userBaseUrl = process.env.USER_SERVICE_HOST + process.env.USER_SERVICE_BASE_URL
			const profileUrl = userBaseUrl + endpoints.USER_PROFILE_DETAILS + '/' + decodedToken.data.id
			const user = await requests.get(profileUrl, null, true)
			if (!user || !user.success) {
				throw common.failureResponse({
					message: 'USER_NOT_FOUND',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}

			if (user.data.result.deleted_at !== null) {
				throw common.failureResponse({
					message: 'USER_ROLE_UPDATED',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}

			decodedToken.data.roles = user.data.result.user_roles
			decodedToken.data.organization_id = user.data.result.organization_id
		}

		const isPermissionValid = await checkPermissions(
			decodedToken.data.roles.map((role) => role.id),
			req.path,
			req.method
		)
		if (!isPermissionValid) {
			throw common.failureResponse({
				message: 'PERMISSION_DENIED',
				statusCode: httpStatusCode.unauthorized,
				responseCode: 'UNAUTHORIZED',
			})
		}

		req.decodedToken = {
			id: decodedToken.data.id,
			roles: decodedToken.data.roles,
			name: decodedToken.data.name,
			token: authHeader,
			organization_id: decodedToken.data.organization_id,
		}
		next()
	} catch (err) {
		console.log(err)
		next(err)
	}
}
