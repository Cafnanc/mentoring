'use strict'
module.exports = (sequelize, DataTypes) => {
	const Entity = sequelize.define(
		'Entity',
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			entity_type_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			value: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			label: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			status: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: 'active',
			},
			type: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			created_by: {
				type: DataTypes.INTEGER,
			},
			updated_by: {
				type: DataTypes.INTEGER,
			},
		},
		{ sequelize, modelName: 'Entity', tableName: 'entities', freezeTableName: true, paranoid: true }
	)
	Entity.associate = (models) => {
		Entity.belongsTo(models.EntityType, { foreignKey: 'id' })
	}
	return Entity
}
