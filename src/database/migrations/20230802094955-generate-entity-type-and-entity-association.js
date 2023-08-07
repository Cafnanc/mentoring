'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addConstraint('entities', {
			fields: ['entity_type_id'],
			type: 'foreign key',
			name: 'fk_entity_entity_type',
			references: {
				table: 'entity_types',
				field: 'id',
				as: 'entities',
			},
			onDelete: 'cascade',
			onUpdate: 'cascade',
		})
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeConstraint('entities', 'fk_entity_entity_type')
	},
}
