// Dependencies
const ObjectId = require('mongoose').Types.ObjectId

const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const entitiesData = require('@db/entities/query')
const { InternalCache } = require('@ankitpws/caching-library')
module.exports = class EntityHelper {
	/**
	 * Create entity.
	 * @method
	 * @name create
	 * @param {Object} bodyData - entity body data.
	 * @param {String} _id - entity id.
	 * @returns {JSON} - Entity created response.
	 */

	static async create(bodyData, _id) {
		bodyData.createdBy = ObjectId(_id)
		bodyData.updatedBy = ObjectId(_id)
		try {
			const entity = await entitiesData.findOneEntity(bodyData.type, bodyData.value)
			if (entity) {
				return common.failureResponse({
					message: 'ENTITY_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			await entitiesData.createEntity(bodyData)
			const key = 'mentoring_entity_' + bodyData.type
			await InternalCache.delKey(key)
			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'ENTITY_CREATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Update entity.
	 * @method
	 * @name update
	 * @param {Object} bodyData - entity body data.
	 * @param {String} _id - entity id.
	 * @param {String} loggedInUserId - logged in user id.
	 * @returns {JSON} - Entity updted response.
	 */

	static async update(bodyData, _id, loggedInUserId) {
		bodyData.updatedBy = loggedInUserId
		bodyData.updatedAt = new Date().getTime()
		try {
			const result = await entitiesData.updateOneEntity(_id, bodyData)
			if (result === 'ENTITY_ALREADY_EXISTS') {
				return common.failureResponse({
					message: 'ENTITY_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			} else if (result === 'ENTITY_NOT_FOUND') {
				return common.failureResponse({
					message: 'ENTITY_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			console.log(_id)
			let key = ''
			if (bodyData.type) {
				key = 'mentoring_entity_' + bodyData.type
				await InternalCache.delKey(key)
			} else {
				const entities = await entitiesData.findOne(_id)
				key = 'mentoring_entity_' + entities.type
				await InternalCache.delKey(key)
			}
			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'ENTITY_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Read entity.
	 * @method
	 * @name read
	 * @param {Object} bodyData - entity body data.
	 * @returns {JSON} - Entity read response.
	 */

	static async read(bodyData) {
		if (!bodyData.deleted) {
			bodyData.deleted = false
		}
		try {
			let entities = {}
			const key = 'mentoring_entity_' + bodyData.type
			if (await InternalCache.getKey(key)) {
				entities = await InternalCache.getKey(key)
			} else {
				entities = await entitiesData.findAllEntities(bodyData)
				await InternalCache.setKey(key, entities, 86400)
			}
			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ENTITY_FETCHED_SUCCESSFULLY',
				result: entities,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Delete entity.
	 * @method
	 * @name delete
	 * @param {String} _id - Delete entity.
	 * @returns {JSON} - Entity deleted response.
	 */

	static async delete(_id) {
		try {
			const result = await entitiesData.deleteOneEntity(_id)
			if (result === 'ENTITY_ALREADY_EXISTS') {
				return common.failureResponse({
					message: 'ENTITY_ALREADY_DELETED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			} else if (result === 'ENTITY_NOT_FOUND') {
				return common.failureResponse({
					message: 'ENTITY_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const entities = await entitiesData.findOne(_id)
			key = 'mentoring_entity_' + entities.type
			await InternalCache.delKey(key)

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'ENTITY_DELETED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}
}
