'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const defaultOrgId = queryInterface.sequelize.options.defaultOrgId
		if (!defaultOrgId) {
			throw new Error('Default org ID is undefined. Please make sure it is set in sequelize options.')
		}

		const formsToUpdate = [
			{
				type: 'editProfile',
				sub_type: 'editProfileForm',
				data: {
					fields: {
						controls: [
							{
								name: 'name',
								label: 'Your name',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								position: 'floating',
								placeHolder: 'Please enter your full name',
								errorMessage: {
									required: 'Enter your name',
									pattern: 'This field can only contain alphabets',
								},
								validators: {
									required: true,
									pattern: '^[^0-9!@#%$&()\\-`.+,/"]*$',
								},
								options: [],
								meta: {
									showValidationError: true,
									maxLength: 255,
								},
							},
							{
								name: 'location',
								label: 'Select your location',
								value: [],
								class: 'ion-no-margin',
								type: 'select',
								position: 'floating',
								errorMessage: {
									required: 'Please select your location',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'location',
									errorLabel: 'Location',
								},
								multiple: false,
							},
							{
								name: 'designation',
								label: 'Your role',
								class: 'ion-no-margin',
								value: [{}],
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter your role',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'designation',
									addNewPopupHeader: 'Add a new role',
									showSelectAll: true,
									showAddOption: true,
									errorLabel: 'Designation',
								},
								multiple: true,
							},
							{
								name: 'experience',
								label: 'Your experience in years',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								position: 'floating',
								placeHolder: 'Ex. 5 years',
								errorMessage: {
									required: 'Enter your experience in years',
								},
								isNumberOnly: true,
								validators: {
									required: true,
									maxLength: 2,
								},
								options: [],
							},
							{
								name: 'about',
								label: 'Tell us about yourself',
								value: '',
								class: 'ion-no-margin',
								type: 'textarea',
								position: 'floating',
								errorMessage: {
									required: 'This field cannot be empty',
								},
								placeHolder: 'Please use only 150 characters',
								validators: {
									required: true,
									maxLength: 150,
									pattern: '^[a-zA-Z0-9-.,s]+$',
								},
								options: [],
							},
							{
								name: 'area_of_expertise',
								label: 'Your expertise',
								class: 'ion-no-margin',
								value: [],
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter your expertise',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'area_of_expertise',
									addNewPopupHeader: 'Add your expertise',
									showSelectAll: true,
									showAddOption: true,
									errorLabel: 'Expertise',
								},
								multiple: true,
							},
							{
								name: 'education_qualification',
								label: 'Education qualification',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								position: 'floating',
								errorMessage: {
									required: 'Enter education qualification',
								},
								placeHolder: 'Ex. BA, B.ED',
								validators: {
									required: true,
								},
								options: [],
								meta: {
									errorLabel: 'Education qualification',
									maxLength: 255,
								},
							},
							{
								name: 'languages',
								label: 'Languages',
								class: 'ion-no-margin',
								value: [],
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter language',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'languages',
									addNewPopupHeader: 'Add new language',
									showSelectAll: true,
									showAddOption: true,
									errorLabel: 'Medium',
								},
								multiple: true,
							},
						],
					},
				},
			},
			{
				type: 'session',
				sub_type: 'sessionForm',
				data: {
					fields: {
						controls: [
							{
								name: 'title',
								label: 'Session title',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								placeHolder: 'Ex. Name of your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter session title',
								},
								validators: {
									required: true,
									maxLength: 255,
									pattern: '^[a-zA-Z0-9-.,s]+$',
								},
							},
							{
								name: 'description',
								label: 'Description',
								value: '',
								class: 'ion-no-margin',
								type: 'textarea',
								placeHolder: 'Tell the community something about your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter description',
								},
								validators: {
									required: true,
									maxLength: 255,
									pattern: '^[a-zA-Z0-9-.,s]+$',
								},
							},
							{
								name: 'start_date',
								label: 'Start date',
								class: 'ion-no-margin',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedChild: 'end_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter start date',
								},
								position: 'floating',
								validators: {
									required: true,
								},
							},
							{
								name: 'end_date',
								label: 'End date',
								class: 'ion-no-margin',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedParent: 'start_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter end date',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'recommended_for',
								label: 'Recommended for',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter recommended for',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'recommended_for',
									addNewPopupHeader: 'Recommended for',
									addNewPopupSubHeader: 'Who is this session for?',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'categories',
								label: 'Categories',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter categories',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'categories',
									addNewPopupHeader: 'Add a new category',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'session',
								label: 'Session for',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter session for',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'session',
									addNewPopupHeader: 'Session for',
									addNewPopupSubHeader: 'Who is this session for?',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'medium',
								label: 'Select medium',
								alertLabel: 'medium',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter select medium',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'medium',
									addNewPopupHeader: 'Add new language',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
						],
					},
				},
			},
			{
				type: 'managersSession',
				sub_type: 'managersSessionForm',
				data: {
					fields: {
						controls: [
							{
								name: 'title',
								label: 'Session title',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								placeHolder: 'Ex. Name of your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter session title',
								},
								validators: {
									required: true,
									maxLength: 255,
									pattern: '^[a-zA-Z0-9-.,s]+$',
								},
							},
							{
								name: 'description',
								label: 'Description',
								value: '',
								class: 'ion-no-margin',
								type: 'textarea',
								placeHolder: 'Tell the community something about your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter description',
								},
								validators: {
									required: true,
									maxLength: 255,
									pattern: '^[a-zA-Z0-9-.,s]+$',
								},
							},
							{
								name: 'type',
								label: 'Session type',
								class: 'ion-no-margin',
								type: 'select',
								dependedChild: 'mentees',
								value: '',
								position: 'floating',
								info: [
									{
										header: 'Public session',
										message: 'Discoverable. Mentees can enroll and attend',
									},
									{
										header: 'Private session',
										message: 'Non-discoverable. Invited mentee can attend',
									},
								],
								errorMessage: {
									required: 'Please select your session type',
								},
								validators: {
									required: true,
								},
								meta: {
									errorLabel: 'Location',
									disabledChildren: ['mentees', 'mentor_id'],
								},
								multiple: false,
								options: [
									{
										label: 'Private',
										value: 'PRIVATE',
									},
									{
										label: 'Public',
										value: 'PUBLIC',
									},
								],
							},
							{
								name: 'mentor_id',
								label: 'Add mentor',
								value: '',
								class: 'ion-no-margin',
								type: 'search',
								position: 'floating',
								disabled: true,
								meta: {
									multiSelect: false,
									disableIfSelected: true,
									searchLabel: 'Search for mentor',
									searchData: [],
									url: 'MENTORS_LIST',
									labelArrayForSingleSelect: ['mentor_name', 'organization.name'],
									filters: {
										entity_types: [
											{
												key: 'designation',
												label: 'Designation',
												type: 'checkbox',
											},
										],
										organizations: [
											{
												isEnabled: true,
												key: 'organizations',
												type: 'checkbox',
											},
										],
									},
									filterType: 'mentor',
								},
								info: [
									{
										message: 'Click to select Mentor for this session',
									},
								],
								errorMessage: {
									required: 'Please add a mentor for the session',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'mentees',
								label: 'Add mentee',
								value: [],
								class: 'ion-no-margin',
								disabled: true,
								type: 'search',
								meta: {
									multiSelect: true,
									url: 'MENTEES_LIST',
									searchLabel: 'Search for mentee',
									searchData: [],
									maxCount: 'MAX_MENTEE_ENROLLMENT_COUNT',
									labelForListButton: 'View Mentee List',
									labelForAddButton: 'Add New Mentee',
									filters: {
										entity_types: [
											{
												key: 'designation',
												label: 'Designation',
												type: 'checkbox',
											},
										],
										organizations: [
											{
												isEnabled: true,
												key: 'organizations',
												type: 'checkbox',
											},
										],
									},
									filterType: 'mentee',
								},
								position: 'floating',
								info: [
									{
										message: 'Click to select Mentee(s) for this session',
									},
								],
								errorMessage: {
									required: 'Please add mentee for the session',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'start_date',
								label: 'Start date',
								class: 'ion-no-margin',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedChild: 'end_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter start date',
								},
								position: 'floating',
								validators: {
									required: true,
								},
							},
							{
								name: 'end_date',
								label: 'End date',
								class: 'ion-no-margin',
								position: 'floating',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedParent: 'start_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter end date',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'recommended_for',
								label: 'Recommended for',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter recommended for',
								},
								validators: {
									required: true,
								},
								options: [
									{
										label: 'Block education officer',
										value: 'beo',
									},
									{
										label: 'Cluster officials',
										value: 'co',
									},
									{
										label: 'District education officer',
										value: 'deo',
									},
									{
										label: 'Head master',
										value: 'hm',
									},
									{
										label: 'Teacher',
										value: 'te',
									},
								],
								meta: {
									entityType: 'recommended_for',
									addNewPopupHeader: 'Recommended for',
									addNewPopupSubHeader: 'Who is this session for?',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'categories',
								label: 'Categories',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter categories',
								},
								validators: {
									required: true,
								},
								options: [
									{
										label: 'Communication',
										value: 'communication',
									},
									{
										label: 'Educational leadership',
										value: 'educational_leadership',
									},
									{
										label: 'Professional development',
										value: 'professional_development',
									},
									{
										label: 'School process',
										value: 'school_process',
									},
									{
										label: 'SQAA',
										value: 'sqaa',
									},
								],
								meta: {
									entityType: 'categories',
									addNewPopupHeader: 'Add a new category',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'medium',
								label: 'Select medium',
								alertLabel: 'medium',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter select medium',
								},
								validators: {
									required: true,
								},
								options: [
									{
										label: 'English',
										value: 'en_in',
									},
									{
										label: 'Hindi',
										value: 'hi',
									},
								],
								meta: {
									entityType: 'medium',
									addNewPopupHeader: 'Add new language',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
						],
					},
				},
			},
			{
				type: 'helpApp',
				sub_type: 'helpAppForm',
				data: {
					fields: {
						forms: [
							{
								name: 'Report an issue',
								value: 'Report an issue',
								buttonText: 'SUBMIT',
								form: {
									controls: [
										{
											name: 'description',
											label: 'Report an issue',
											value: '',
											class: 'ion-margin',
											position: 'floating',
											platformPlaceHolder: 'Tell us more about the problem you faced',
											errorMessage: {
												required: 'Enter the issue',
											},
											type: 'textarea',
											validators: {
												required: true,
												pattern: '^[a-zA-Z0-9-.,s]+$',
											},
										},
									],
								},
							},
							{
								name: 'Request to delete my account',
								menteeMessage:
									'Please note the following points<ul><li>Account deletion takes 2 days to process. You will receive an email notification when complete.</li><li>Your previous session data will be retained.</li><li>You will be un-enrolled from enrolled sessions.</li></ul>',
								menterMessage:
									'Please note the following points<ul><li>Account deletion takes 2 days to process. You will receive an email notification when complete.</li><li>Your previous session data will be retained.</li><li>Sessions created by you will be deleted.</li><li>You will be un-enrolled from enrolled sessions.</li></ul>',
								value: 'Request to delete my account',
								buttonText: 'DELETE_ACCOUNT',
								form: {
									controls: [
										{
											name: 'description',
											label: 'Reason for deleting account',
											value: '',
											class: 'ion-margin',
											position: 'floating',
											platformPlaceHolder: 'Reason for deleting account',
											errorMessage: '',
											type: 'textarea',
											validators: {
												required: false,
												pattern: '^[a-zA-Z0-9-.,s]+$',
											},
										},
									],
								},
							},
						],
					},
				},
			},
		]

		for (const formData of formsToUpdate) {
			await queryInterface.bulkUpdate(
				'forms',
				{ data: formData.data, updated_at: new Date() },
				{ type: formData.type, sub_type: formData.sub_type, organization_id: defaultOrgId }
			)
		}
	},

	down: async (queryInterface, Sequelize) => {
		const defaultOrgId = queryInterface.sequelize.options.defaultOrgId
		if (!defaultOrgId) {
			throw new Error('Default org ID is undefined. Please make sure it is set in sequelize options.')
		}

		const formsToUpdate = [
			{
				type: 'editProfile',
				sub_type: 'editProfileForm',
				data: {
					fields: {
						controls: [
							{
								name: 'name',
								label: 'Your name',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								position: 'floating',
								placeHolder: 'Please enter your full name',
								errorMessage: {
									required: 'Enter your name',
									pattern: 'This field can only contain alphabets',
								},
								validators: {
									required: true,
									pattern: '^[^0-9!@#%$&()\\-`.+,/"]*$',
								},
								options: [],
								meta: {
									showValidationError: true,
									maxLength: 255,
								},
							},
							{
								name: 'location',
								label: 'Select your location',
								value: [],
								class: 'ion-no-margin',
								type: 'select',
								position: 'floating',
								errorMessage: {
									required: 'Please select your location',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'location',
									errorLabel: 'Location',
								},
								multiple: false,
							},
							{
								name: 'designation',
								label: 'Your role',
								class: 'ion-no-margin',
								value: [{}],
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter your role',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'designation',
									addNewPopupHeader: 'Add a new role',
									showSelectAll: true,
									showAddOption: true,
									errorLabel: 'Designation',
								},
								multiple: true,
							},
							{
								name: 'experience',
								label: 'Your experience in years',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								position: 'floating',
								placeHolder: 'Ex. 5 years',
								errorMessage: {
									required: 'Enter your experience in years',
								},
								isNumberOnly: true,
								validators: {
									required: true,
									maxLength: 2,
								},
								options: [],
							},
							{
								name: 'about',
								label: 'Tell us about yourself',
								value: '',
								class: 'ion-no-margin',
								type: 'textarea',
								position: 'floating',
								errorMessage: {
									required: 'This field cannot be empty',
								},
								placeHolder: 'Please use only 150 characters',
								validators: {
									required: true,
									maxLength: 150,
								},
								options: [],
							},
							{
								name: 'area_of_expertise',
								label: 'Your expertise',
								class: 'ion-no-margin',
								value: [],
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter your expertise',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'area_of_expertise',
									addNewPopupHeader: 'Add your expertise',
									showSelectAll: true,
									showAddOption: true,
									errorLabel: 'Expertise',
								},
								multiple: true,
							},
							{
								name: 'education_qualification',
								label: 'Education qualification',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								position: 'floating',
								errorMessage: {
									required: 'Enter education qualification',
								},
								placeHolder: 'Ex. BA, B.ED',
								validators: {
									required: true,
								},
								options: [],
								meta: {
									errorLabel: 'Education qualification',
									maxLength: 255,
								},
							},
							{
								name: 'languages',
								label: 'Languages',
								class: 'ion-no-margin',
								value: [],
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter language',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'languages',
									addNewPopupHeader: 'Add new language',
									showSelectAll: true,
									showAddOption: true,
									errorLabel: 'Medium',
								},
								multiple: true,
							},
						],
					},
				},
			},
			{
				type: 'session',
				sub_type: 'sessionForm',
				data: {
					fields: {
						controls: [
							{
								name: 'title',
								label: 'Session title',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								placeHolder: 'Ex. Name of your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter session title',
								},
								validators: {
									required: true,
									maxLength: 255,
								},
							},
							{
								name: 'description',
								label: 'Description',
								value: '',
								class: 'ion-no-margin',
								type: 'textarea',
								placeHolder: 'Tell the community something about your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter description',
								},
								validators: {
									required: true,
									maxLength: 255,
								},
							},
							{
								name: 'start_date',
								label: 'Start date',
								class: 'ion-no-margin',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedChild: 'end_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter start date',
								},
								position: 'floating',
								validators: {
									required: true,
								},
							},
							{
								name: 'end_date',
								label: 'End date',
								class: 'ion-no-margin',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedParent: 'start_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter end date',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'recommended_for',
								label: 'Recommended for',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter recommended for',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'recommended_for',
									addNewPopupHeader: 'Recommended for',
									addNewPopupSubHeader: 'Who is this session for?',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'categories',
								label: 'Categories',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter categories',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'categories',
									addNewPopupHeader: 'Add a new category',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'session',
								label: 'Session for',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter session for',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'session',
									addNewPopupHeader: 'Session for',
									addNewPopupSubHeader: 'Who is this session for?',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'medium',
								label: 'Select medium',
								alertLabel: 'medium',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter select medium',
								},
								validators: {
									required: true,
								},
								options: [],
								meta: {
									entityType: 'medium',
									addNewPopupHeader: 'Add new language',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
						],
					},
				},
			},
			{
				type: 'managersSession',
				sub_type: 'managersSessionForm',
				data: {
					fields: {
						controls: [
							{
								name: 'title',
								label: 'Session title',
								value: '',
								class: 'ion-no-margin',
								type: 'text',
								placeHolder: 'Ex. Name of your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter session title',
								},
								validators: {
									required: true,
									maxLength: 255,
								},
							},
							{
								name: 'description',
								label: 'Description',
								value: '',
								class: 'ion-no-margin',
								type: 'textarea',
								placeHolder: 'Tell the community something about your session',
								position: 'floating',
								errorMessage: {
									required: 'Enter description',
								},
								validators: {
									required: true,
									maxLength: 255,
								},
							},
							{
								name: 'type',
								label: 'Session type',
								class: 'ion-no-margin',
								type: 'select',
								dependedChild: 'mentees',
								value: '',
								position: 'floating',
								info: [
									{
										header: 'Public session',
										message: 'Discoverable. Mentees can enroll and attend',
									},
									{
										header: 'Private session',
										message: 'Non-discoverable. Invited mentee can attend',
									},
								],
								errorMessage: {
									required: 'Please select your session type',
								},
								validators: {
									required: true,
								},
								meta: {
									errorLabel: 'Location',
									disabledChildren: ['mentees', 'mentor_id'],
								},
								multiple: false,
								options: [
									{
										label: 'Private',
										value: 'PRIVATE',
									},
									{
										label: 'Public',
										value: 'PUBLIC',
									},
								],
							},
							{
								name: 'mentor_id',
								label: 'Add mentor',
								value: '',
								class: 'ion-no-margin',
								type: 'search',
								position: 'floating',
								disabled: true,
								meta: {
									multiSelect: false,
									disableIfSelected: true,
									searchLabel: 'Search for mentor',
									searchData: [],
									url: 'MENTORS_LIST',
									labelArrayForSingleSelect: ['mentor_name', 'organization.name'],
									filters: {
										entity_types: [
											{
												key: 'designation',
												label: 'Designation',
												type: 'checkbox',
											},
										],
										organizations: [
											{
												isEnabled: true,
												key: 'organizations',
												type: 'checkbox',
											},
										],
									},
									filterType: 'mentor',
								},
								info: [
									{
										message: 'Click to select Mentor for this session',
									},
								],
								errorMessage: {
									required: 'Please add a mentor for the session',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'mentees',
								label: 'Add mentee',
								value: [],
								class: 'ion-no-margin',
								disabled: true,
								type: 'search',
								meta: {
									multiSelect: true,
									url: 'MENTEES_LIST',
									searchLabel: 'Search for mentee',
									searchData: [],
									maxCount: 'MAX_MENTEE_ENROLLMENT_COUNT',
									labelForListButton: 'View Mentee List',
									labelForAddButton: 'Add New Mentee',
									filters: {
										entity_types: [
											{
												key: 'designation',
												label: 'Designation',
												type: 'checkbox',
											},
										],
										organizations: [
											{
												isEnabled: true,
												key: 'organizations',
												type: 'checkbox',
											},
										],
									},
									filterType: 'mentee',
								},
								position: 'floating',
								info: [
									{
										message: 'Click to select Mentee(s) for this session',
									},
								],
								errorMessage: {
									required: 'Please add mentee for the session',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'start_date',
								label: 'Start date',
								class: 'ion-no-margin',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedChild: 'end_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter start date',
								},
								position: 'floating',
								validators: {
									required: true,
								},
							},
							{
								name: 'end_date',
								label: 'End date',
								class: 'ion-no-margin',
								position: 'floating',
								value: '',
								displayFormat: 'DD/MMM/YYYY HH:mm',
								dependedParent: 'start_date',
								type: 'date',
								placeHolder: 'YYYY-MM-DD hh:mm',
								errorMessage: {
									required: 'Enter end date',
								},
								validators: {
									required: true,
								},
							},
							{
								name: 'recommended_for',
								label: 'Recommended for',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter recommended for',
								},
								validators: {
									required: true,
								},
								options: [
									{
										label: 'Block education officer',
										value: 'beo',
									},
									{
										label: 'Cluster officials',
										value: 'co',
									},
									{
										label: 'District education officer',
										value: 'deo',
									},
									{
										label: 'Head master',
										value: 'hm',
									},
									{
										label: 'Teacher',
										value: 'te',
									},
								],
								meta: {
									entityType: 'recommended_for',
									addNewPopupHeader: 'Recommended for',
									addNewPopupSubHeader: 'Who is this session for?',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'categories',
								label: 'Categories',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter categories',
								},
								validators: {
									required: true,
								},
								options: [
									{
										label: 'Communication',
										value: 'communication',
									},
									{
										label: 'Educational leadership',
										value: 'educational_leadership',
									},
									{
										label: 'Professional development',
										value: 'professional_development',
									},
									{
										label: 'School process',
										value: 'school_process',
									},
									{
										label: 'SQAA',
										value: 'sqaa',
									},
								],
								meta: {
									entityType: 'categories',
									addNewPopupHeader: 'Add a new category',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
							{
								name: 'medium',
								label: 'Select medium',
								alertLabel: 'medium',
								class: 'ion-no-margin',
								value: '',
								type: 'chip',
								position: '',
								disabled: false,
								errorMessage: {
									required: 'Enter select medium',
								},
								validators: {
									required: true,
								},
								options: [
									{
										label: 'English',
										value: 'en_in',
									},
									{
										label: 'Hindi',
										value: 'hi',
									},
								],
								meta: {
									entityType: 'medium',
									addNewPopupHeader: 'Add new language',
									showSelectAll: true,
									showAddOption: true,
								},
								multiple: true,
							},
						],
					},
				},
			},
			{
				type: 'helpApp',
				sub_type: 'helpAppForm',
				data: {
					fields: {
						forms: [
							{
								name: 'Report an issue',
								value: 'Report an issue',
								buttonText: 'SUBMIT',
								form: {
									controls: [
										{
											name: 'description',
											label: 'Report an issue',
											value: '',
											class: 'ion-margin',
											position: 'floating',
											platformPlaceHolder: 'Tell us more about the problem you faced',
											errorMessage: {
												required: 'Enter the issue',
											},
											type: 'textarea',
											validators: {
												required: true,
											},
										},
									],
								},
							},
							{
								name: 'Request to delete my account',
								menteeMessage:
									'Please note the following points<ul><li>Account deletion takes 2 days to process. You will receive an email notification when complete.</li><li>Your previous session data will be retained.</li><li>You will be un-enrolled from enrolled sessions.</li></ul>',
								menterMessage:
									'Please note the following points<ul><li>Account deletion takes 2 days to process. You will receive an email notification when complete.</li><li>Your previous session data will be retained.</li><li>Sessions created by you will be deleted.</li><li>You will be un-enrolled from enrolled sessions.</li></ul>',
								value: 'Request to delete my account',
								buttonText: 'DELETE_ACCOUNT',
								form: {
									controls: [
										{
											name: 'description',
											label: 'Reason for deleting account',
											value: '',
											class: 'ion-margin',
											position: 'floating',
											platformPlaceHolder: 'Reason for deleting account',
											errorMessage: '',
											type: 'textarea',
											validators: {
												required: false,
											},
										},
									],
								},
							},
						],
					},
				},
			},
		]

		for (const formData of formsToUpdate) {
			await queryInterface.bulkUpdate(
				'forms',
				{ data: formData.data, updated_at: new Date() },
				{ type: formData.type, sub_type: formData.sub_type, organization_id: defaultOrgId }
			)
		}
	},
}
