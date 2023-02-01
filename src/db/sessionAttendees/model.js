/**
 * name : models/sessionAttendees/schema
 * author : Aman Karki
 * Date : 07-Oct-2021
 * Description : Session Attendees schema data
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const mongooseLeanGetter = require('mongoose-lean-getters')
let sessionAttendeesSchema = new Schema({
	userId: {
		type: ObjectId,
		index: true,
		required: true,
	},
	sessionId: {
		type: ObjectId,
		index: true,
		required: true,
	},
	isSessionAttended: {
		type: Boolean,
		default: false,
	},
	deleted: {
		type: Boolean,
		default: false,
	},
	sendNotification: {
		type: Boolean,
		default: true,
	},
	timeZone: String,
	joinedAt: Date,
	leftAt: Date,
	link: String,
	feedbacks: [
		{
			questionId: mongoose.Types.ObjectId,
			value: String,
			label: String,
		},
	],
	skippedFeedback: {
		type: Boolean,
		default: false,
	},
})
sessionAttendeesSchema.plugin(mongooseLeanGetter)
const SessionAttendes = db.model('sessionAttendees', sessionAttendeesSchema, 'sessionAttendees')
module.exports = SessionAttendes
