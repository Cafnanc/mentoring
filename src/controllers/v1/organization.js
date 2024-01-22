const organizationService = require('@services/organization')

module.exports = class Organization {
	async update(req) {
		try {
			return await organizationService.update(req.body, req.decodedToken)
		} catch (error) {
			return error
		}
	}

	async eventListener(req) {
		try {
			return await organizationService.eventListener(req.body)
		} catch (error) {
			throw error
		}
	}
}
