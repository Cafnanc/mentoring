module.exports = {
	create: (req) => {
		req.checkBody('description')
			.trim()
			.notEmpty()
			.withMessage('description field is empty')
			.isString()
			.withMessage('description is invalid')
			.not()
			.matches(/(\b)(on\S+)(\s*)=|javascript:|<(|\/|[^\/>][^>]+|\/[^>][^>]+)>/gi)
			.withMessage('invalid description')
	},
}
