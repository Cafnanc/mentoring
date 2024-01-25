const organizationService = require('@services/organization')

module.exports = class Organization {
	async update(req) {
		try {
			return await organizationService.update(req.body, req.decodedToken)
		} catch (error) {
			return error
		}
	}
	async create(req) {
		try {
			return await organizationService.createExtension(req.body, req.headers)
		} catch (error) {
			return error
		}
	}
}
