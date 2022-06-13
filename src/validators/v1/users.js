/**
 * name : validators/v1/questions.js
 * author : Rakesh Kumar
 * Date : 01-Dec-2021
 * Description : Validations of user questions controller
 */

module.exports = {
	pendingFeedbacks: (req) => {
		req.checkParams('id').notEmpty().withMessage('id param is empty')
	},

	list: (req) => {
		req.checkQuery('type').notEmpty().withMessage('type can not be null').isString()
	},
}
