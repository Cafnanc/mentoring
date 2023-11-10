const MentorExtension = require('@database/models/index').MentorExtension // Adjust the path accordingly

const sequelize = require('sequelize')
const Sequelize = require('@database/models/index').sequelize
const common = require('@constants/common')

module.exports = class MentorExtensionQueries {
	static async getColumns() {
		try {
			return await Object.keys(MentorExtension.rawAttributes)
		} catch (error) {
			return error
		}
	}
	static async createMentorExtension(data) {
		try {
			return await MentorExtension.create(data, { returning: true })
		} catch (error) {
			throw error
		}
	}

	static async updateMentorExtension(userId, data, options = {}) {
		try {
			if (data.user_id) {
				delete data['user_id']
			}
			return await MentorExtension.update(data, {
				where: {
					user_id: userId,
				},
				...options,
			})
		} catch (error) {
			throw error
		}
	}

	static async getMentorExtension(userId) {
		try {
			const mentor = await MentorExtension.findOne({
				where: { user_id: userId },
				raw: true,
			})
			return mentor
		} catch (error) {
			throw error
		}
	}

	static async deleteMentorExtension(userId, force = false) {
		try {
			const options = { where: { user_id: userId } }

			if (force) {
				options.force = true
			}

			return await MentorExtension.destroy(options)
		} catch (error) {
			throw error
		}
	}
	static async removeMentorDetails(userId) {
		try {
			return await MentorExtension.update(
				{
					designation: null,
					area_of_expertise: [],
					education_qualification: [],
					rating: null,
					meta: null,
					stats: null,
					tags: [],
					configs: null,
					visibility: null,
					organisation_ids: [],
					external_session_visibility: null,
					external_mentor_visibility: null,
					deleted_at: Date.now(),
				},
				{
					where: {
						user_id: userId,
					},
				}
			)
		} catch (error) {
			console.error('An error occurred:', error)
			throw error
		}
	}
	static async getMentorsByUserIds(ids, options = {}) {
		try {
			const result = await MentorExtension.findAll({
				where: {
					user_id: ids,
				},
				...options,
				returning: true,
				raw: true,
			})

			return result
		} catch (error) {
			throw error
		}
	}

	static async getAllMentors(options = {}) {
		try {
			const result = await MentorExtension.findAll({
				...options,
				returning: true,
				raw: true,
			})

			return result
		} catch (error) {
			throw error
		}
	}

	static async getMentorsByUserIdsFromView(ids, page, limit, filter) {
		try {
			const filterConditions = []

			if (filter && typeof filter === 'object') {
				for (const key in filter) {
					if (Array.isArray(filter[key])) {
						filterConditions.push(`"${key}" @> ARRAY[:${key}]::character varying[]`)
					}
				}
			}
			const filterClause = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : ''

			const sessionAttendeesData = await Sequelize.query(
				`
				SELECT
					user_id,
					rating
				FROM
						${common.materializedViewsPrefix + MentorExtension.tableName}
				WHERE
					user_id IN (${ids.join(',')})
					${filterClause}
				OFFSET
					:offset
				LIMIT
					:limit;
			`,
				{
					replacements: {
						offset: limit * (page - 1),
						limit: limit,
						...filter, // Add filter parameters to replacements
					},
					type: sequelize.QueryTypes.SELECT,
				}
			)

			return {
				data: sessionAttendeesData,
				count: sessionAttendeesData.length,
			}
		} catch (error) {
			return error
		}
	}
}
