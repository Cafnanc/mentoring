const jwt = require('jsonwebtoken')
const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const requests = require('@generics/requests')
const endpoints = require('@constants/endpoints')
const rolePermissionMappingQueries = require('@database/queries/role-permission-mapping')
const responses = require('@helpers/responses')
const { Op } = require('sequelize')
const fs = require('fs')

const IdUuidMappingQueries = require('@database/queries/idUuidMapping')
const MentorExtensionQueries = require('@database/queries/mentorExtension')
const MenteeExtensionQueries = require('@database/queries/userExtension')

module.exports = async function (req, res, next) {
	try {
		const authHeader = req.get('X-auth-token')

		//Check if the API is internal access
		const isInternalAccess = common.internalAccessUrls.some((path) => {
			if (req.path.includes(path)) {
				if (req.headers.internal_access_token === process.env.INTERNAL_ACCESS_TOKEN) return true
				throw createUnauthorizedResponse()
			}
			return false
		})
		if (isInternalAccess && !authHeader) return next()

		//If no authHeader is found, check if the API is publicly accessible
		if (!authHeader) return await checkPublicAccess(req, next)

		//Check if role should be validated

		const decodedToken = await authenticateUser(authHeader, req, next)

		if (process.env.SESSION_VERIFICATION_METHOD === common.SESSION_VERIFICATION_METHOD.USER_SERVICE)
			await validateSession(authHeader)

		let roleValidation = common.roleValidationPaths.some((path) => req.path.includes(path))
		if (roleValidation) {
			if (process.env.AUTH_METHOD == common.AUTH_METHOD.NATIVE) await nativeRoleValidation(decodedToken)
			else if (process.env.AUTH_METHOD == common.AUTH_METHOD.KEYCLOAK_PUBLIC_KEY)
				await dbBasedRoleValidation(decodedToken)
		}

		const isPermissionValid = await checkPermissions(
			decodedToken.data.roles.map((role) => role.title),
			req.path,
			req.method
		)

		if (!isPermissionValid)
			throw responses.failureResponse({
				message: 'PERMISSION_DENIED',
				statusCode: httpStatusCode.unauthorized,
				responseCode: 'UNAUTHORIZED',
			})

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

function createUnauthorizedResponse() {
	return responses.failureResponse({
		message: 'UNAUTHORIZED_REQUEST',
		statusCode: httpStatusCode.unauthorized,
		responseCode: 'UNAUTHORIZED',
	})
}

async function checkPublicAccess(req, next) {
	const isPermissionValid = await checkPermissions(common.PUBLIC_ROLE, req.path, req.method)
	if (!isPermissionValid)
		throw responses.failureResponse({
			message: 'PERMISSION_DENIED',
			statusCode: httpStatusCode.unauthorized,
			responseCode: 'UNAUTHORIZED',
		})
	return next()
}

async function checkPermissions(roleTitle, requestPath, requestMethod) {
	const parts = requestPath.match(/[^/]+/g)
	const apiPath = getApiPaths(parts)
	const allowedPermissions = await fetchPermissions(roleTitle, apiPath, parts[2])
	return allowedPermissions.some((permission) => permission.request_type.includes(requestMethod))
}

function getApiPaths(parts) {
	const apiPath = [`/${parts[0]}/${parts[1]}/${parts[2]}/*`]
	if (parts[4]) apiPath.push(`/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}*`)
	else
		apiPath.push(
			`/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}`,
			`/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}*`
		)
	return apiPath
}

async function fetchPermissions(roleTitle, apiPath, module) {
	if (Array.isArray(roleTitle) && !roleTitle.includes(common.PUBLIC_ROLE)) roleTitle.push(common.PUBLIC_ROLE)
	const filter = {
		role_title: roleTitle,
		module: module,
		api_path: { [Op.in]: apiPath },
	}
	const attributes = ['request_type', 'api_path', 'module']
	return await rolePermissionMappingQueries.findAll(filter, attributes)
}

async function verifyToken(token) {
	try {
		return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			throw responses.failureResponse({
				message: 'ACCESS_TOKEN_EXPIRED',
				statusCode: httpStatusCode.unauthorized,
				responseCode: 'UNAUTHORIZED',
			})
		}
		throw createUnauthorizedResponse()
	}
}

async function validateSession(authHeader) {
	const userBaseUrl = `${process.env.USER_SERVICE_HOST}${process.env.USER_SERVICE_BASE_URL}`
	const validateSessionEndpoint = `${userBaseUrl}${endpoints.VALIDATE_SESSIONS}`
	const reqBody = { token: authHeader }

	const isSessionActive = await requests.post(validateSessionEndpoint, reqBody, '', true)

	if (isSessionActive.data.responseCode === 'UNAUTHORIZED') throw new Error('ACCESS_TOKEN_EXPIRED')
	if (!isSessionActive.data.result.data.user_session_active) throw new Error('USER_SERVICE_DOWN')
}

async function fetchUserProfile(userId) {
	const userBaseUrl = `${process.env.USER_SERVICE_HOST}${process.env.USER_SERVICE_BASE_URL}`
	const profileUrl = `${userBaseUrl}${endpoints.USER_PROFILE_DETAILS}/${userId}`
	const user = await requests.get(profileUrl, null, true)

	if (!user || !user.success)
		throw responses.failureResponse({
			message: 'USER_NOT_FOUND',
			statusCode: httpStatusCode.unauthorized,
			responseCode: 'UNAUTHORIZED',
		})

	if (user.data.result.deleted_at !== null)
		throw responses.failureResponse({
			message: 'USER_ROLE_UPDATED',
			statusCode: httpStatusCode.unauthorized,
			responseCode: 'UNAUTHORIZED',
		})
	return user.data.result
}

function isMentorRole(roles) {
	return roles.some((role) => role.title === common.MENTOR_ROLE)
}

async function dbBasedRoleValidation(decodedToken) {
	const userId = decodedToken.data.id
	const roles = decodedToken.data.roles
	const isMentor = isMentorRole(roles)
	const menteeExtension = await MenteeExtensionQueries.getMenteeExtension(userId, ['user_id'])
	const mentorExtension = await MentorExtensionQueries.getMentorExtension(userId, ['user_id'])

	if (!menteeExtension && !mentorExtension)
		throw responses.failureResponse({
			message: 'USER_NOT_FOUND',
			statusCode: httpStatusCode.unauthorized,
			responseCode: 'UNAUTHORIZED',
		})
	else if ((isMentor && menteeExtension) || (!isMentor && mentorExtension))
		throw responses.failureResponse({
			message: 'USER_ROLE_UPDATED',
			statusCode: httpStatusCode.unauthorized,
			responseCode: 'UNAUTHORIZED',
		})
}

function isAdminRole(roles) {
	return roles.some((role) => role.title === common.ADMIN_ROLE)
}

async function authenticateUser(authHeader, req, next) {
	const [authType, token] = authHeader ? authHeader.split(' ') : []
	if (authType !== 'bearer') throw createUnauthorizedResponse()

	let decodedToken = null
	if (process.env.AUTH_METHOD == common.AUTH_METHOD.NATIVE) decodedToken = await verifyToken(token)
	else if (process.env.AUTH_METHOD == common.AUTH_METHOD.KEYCLOAK_PUBLIC_KEY)
		decodedToken = await keycloakPublicKeyAuthentication(token)

	if (!decodedToken) throw createUnauthorizedResponse()

	if (decodedToken.data.roles) {
		if (isAdminRole(decodedToken.data.roles)) {
			req.decodedToken = decodedToken.data
			return next()
		}
	}

	return decodedToken
}

async function nativeRoleValidation(decodedToken) {
	const userProfile = await fetchUserProfile(decodedToken.data.id)
	decodedToken.data.roles = userProfile.user_roles
	decodedToken.data.organization_id = userProfile.organization_id
}

const keycloakPublicKeyPath = `${process.env.KEYCLOAK_PUBLIC_KEY_PATH}/`
const PEM_FILE_BEGIN_STRING = '-----BEGIN PUBLIC KEY-----'
const PEM_FILE_END_STRING = '-----END PUBLIC KEY-----'

async function keycloakPublicKeyAuthentication(token) {
	try {
		const tokenClaims = jwt.decode(token, { complete: true })
		if (!tokenClaims || !tokenClaims.header) throw createUnauthorizedResponse()
		const kid = tokenClaims.header.kid
		const path = keycloakPublicKeyPath + kid.replace(/\.\.\//g, '')
		const accessKeyFile = await fs.promises.readFile(path, 'utf8')
		const cert = accessKeyFile.includes(PEM_FILE_BEGIN_STRING)
			? accessKeyFile
			: `${PEM_FILE_BEGIN_STRING}\n${accessKeyFile}\n${PEM_FILE_END_STRING}`
		const verifiedClaims = await verifyKeycloakToken(token, cert)
		const externalUserId = verifiedClaims.sub.split(':').pop()
		const mentoringUserId = await IdUuidMappingQueries.getIdByUuid(externalUserId)
		let userExtensionData
		if (mentoringUserId) {
			userExtensionData = verifiedClaims.resource_access.account.roles.includes(common.MENTOR_ROLE)
				? await MentorExtensionQueries.getMentorExtension(mentoringUserId, ['organization_id'])
				: await MenteeExtensionQueries.getMenteeExtension(mentoringUserId, ['organization_id'])
		}
		return {
			data: {
				id: mentoringUserId,
				roles: [{ title: 'mentor' }],
				name: verifiedClaims.name,
				organization_id: userExtensionData.organization_id || process.env.DEFAULT_ORG_ID,
				externalId: externalUserId,
			},
		}
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw createUnauthorizedResponse()
		} else {
			throw err // Re-throw other unexpected errors
		}
	}
}

async function verifyKeycloakToken(token, cert) {
	try {
		return jwt.verify(token, cert, { algorithms: ['sha1', 'RS256', 'HS256'] })
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			throw responses.failureResponse({
				message: 'ACCESS_TOKEN_EXPIRED',
				statusCode: httpStatusCode.unauthorized,
				responseCode: 'UNAUTHORIZED',
			})
		}
		throw createUnauthorizedResponse()
	}
}
