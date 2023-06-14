'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('notification_templates', {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			type: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			code: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			subject: { type: Sequelize.STRING, allowNull: false },
			body: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			email_header: {
				type: Sequelize.STRING,
			},
			email_footer: {
				type: Sequelize.STRING,
			},
			created_by: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			updated_by: {
				type: Sequelize.STRING,
				allowNull: false,
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

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('notification_templates')
	},
}
