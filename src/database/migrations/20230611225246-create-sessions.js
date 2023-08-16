'use strict'
require('dotenv').config({ path: '../../.env' })
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('sessions', {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			title: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			recommended_for: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				allowNull: false,
			},
			categories: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				allowNull: false,
			},
			medium: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				allowNull: false,
			},
			image: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				allowNull: false,
			},
			mentor_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			session_reschedule: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			time_zone: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			start_date: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			end_date: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			mentee_password: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			mentor_password: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			started_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			share_link: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			completed_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			is_feedback_skipped: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			mentee_feedback_question_set: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			mentor_feedback_question_set: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			meeting_info: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			meta: {
				type: Sequelize.JSONB,
				allowNull: true,
			},
			visibility: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			organization_ids: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				allowNull: true,
			},
			mentor_org_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			seats_remaining: {
				type: Sequelize.INTEGER,
				defaultValue: process.env.SESSION_MENTEE_LIMIT,
			},
			seats_limit: {
				type: Sequelize.INTEGER,
				defaultValue: process.env.SESSION_MENTEE_LIMIT,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			deleted_at: {
				type: Sequelize.DATE,
			},
		})
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.dropTable('sessions')
	},
}
