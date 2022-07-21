/**
 * name : pagination.js
 * author : Aman Karki
 * Date : 13-July-2020
 * Description : Pagination
 */
const common = require('@constants/common')
const httpStatus = require('@generics/http-status')
module.exports = (req, res, next) => {
	req.pageNo = req.query.page && Number(req.query.page) > 0 ? Number(req.query.page) : 1

	req.pageSize =
		req.query.limit && Number(req.query.limit) > 0 && Number(req.query.limit) <= 100 ? Number(req.query.limit) : 100

	req.searchText = req.query.search && req.query.search != '' ? decodeURI(req.query.search) : ''

	if (req.searchText.match(/^[A-Za-z0-9 ]+$/) || req.searchText == '') {
		delete req.query.page
		delete req.query.limit
		next()
		return
	} else {
		return common.successResponse({
			statusCode: httpStatus.ok,
			message: 'SESSION_FETCHED_SUCCESSFULLY',
			result: [{ data: [] }],
		})
	}
}
