const ObjectId = require('mongoose').Types.ObjectId

let projects = [
	{
		"userId" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"userRole" : "DYEO",
		"createdFor" : [ 
			"0126796199493140480", 
			"0127562898604687369396"
		],
		"status" : "started",
		"isDeleted" : false,
		"categories" : [ 
			{
				"_id" : ObjectId("5fcfa9a2457d6055e33843f3"),
				"externalId" : "educationLeader",
				"name" : "Education Leader"
			}
		],
		"createdBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"remarks" : "P1-Remark",
		"tasks" : [ 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [ 
					{
						"_id" : "1ba997bd-2bff-4025-ac16-d079716b3dfa",
						"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
						"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
						"isDeleted" : false,
						"taskSequence" : [],
						"children" : [],
						"visibleIf" : [ 
							{
								"operator" : "===",
								"_id" : "014743f2-5440-404d-b91a-b6bd60af56f2",
								"value" : "started"
							}
						],
						"hasSubTasks" : false,
						"learningResources" : [],
						"deleted" : false,
						"type" : "simple",
						"name" : "P1-T1-ST1",
						"externalId" : "IMP-3147aa-TASK7",
						"description" : "",
						"updatedAt" :  Date("2022-04-26T08:32:52.100Z"),
						"createdAt" : "2020-12-10T15:53:31.476Z",
						"parentId" : "5fd2447b1233354b094f15d5",
						"isDeletable" : true,
						"status" : "completed",
						"isImportedFromLibrary" : false,
						"syncedAt" :  Date("2022-04-26T08:32:52.100Z")
					}
				],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "Something",
						"link" : "https://diksha.gov.in/resources/play/content/do_312609629019742208212574"
					}
				],
				"deleted" : false,
				"type" : "content",
				"projectTemplateExternalId" : "IMP-3399dd_IMPORTED",
				"name" : "P1-T1",
				"externalId" : "IMP-3399dd-TASK1-1612432631465",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:08:25.328Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.341Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:08:25.328Z"),
				"attachments" : [ 
					{
						"name" : "T1-E1",
						"type" : "link",
						"isUploaded" : false,
						"url" : ""
					}, 
					{
						"name" : "T1-E2",
						"type" : "link",
						"isUploaded" : false,
						"url" : ""
					}, 
					{
						"name" : "T1-E3",
						"type" : "link",
						"isUploaded" : false,
						"url" : ""
					}
				],
				"remarks" : "T1-Remarks"
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd_IMPORTED",
				"name" : "P1-T2",
				"externalId" : "IMP-3399dd-TASK3-1612432631471",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:08:25.328Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.363Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:08:25.328Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd_IMPORTED",
				"name" : "P3-T3",
				"externalId" : "IMP-3399dd-TASK4-1612432631473",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:08:25.328Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.367Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:08:25.328Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "Guiding Principles to provide effective feedback",
						"link" : "https://diksha.gov.in/resources/play/content/do_31248141632307200021853"
					}
				],
				"deleted" : false,
				"type" : "content",
				"projectTemplateExternalId" : "IMP-3399dd_IMPORTED",
				"name" : "P1-T4",
				"externalId" : "IMP-3399dd-TASK2-1612432631475",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:08:25.328Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.359Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:08:25.328Z")
			}
		],
		"updatedBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"rootOrganisations" : [ 
			"0126796199493140480"
		],
		"learningResources" : [ 
			{
				"name" : "Movements",
				"link" : "https://diksha.gov.in/resources/play/content/do_3128850456266506241713"
			}
		],
		"deleted" : false,
		"description" : "",
		"title" : "Test project",
		"metaInformation" : {
			"rationale" : "",
			"primaryAudience" : [ 
				"School Leaders."
			],
			"goal" : "Please enter the goal for your  Prerak Head Teacher of the Month project",
			"duration" : "1 months",
			"successIndicators" : "",
			"risks" : "",
			"approaches" : ""
		},
		"updatedAt" :  Date("2021-02-04T10:08:25.341Z"),
		"createdAt" :  Date("2021-02-04T10:08:25.323Z"),
		"__v" : 0,
		"solutionId" : ObjectId("601bc4c8fdf0bd513d6d7bb1"),
		"solutionExternalId" : "IMP-3399dd-solution-1",
		"programId" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
		"programExternalId" : "Test-program-1597310031178",
		"projectTemplateId" : ObjectId("601bc4f7822c5351b813c9e7"),
		"projectTemplateExternalId" : "IMP-3399dd_IMPORTED",
		"taskReport" : {
			"total" : 4,
			"notStarted" : 4
		},
		"isAPrivateProgram" : false,
		"programInformation" : {
			"_id" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
			"externalId" : "Test-program-1597310031178",
			"description" : "",
			"name" : "Test Program"
		},
		"solutionInformation" : {
			"_id" : ObjectId("601bc4c8fdf0bd513d6d7bb1"),
			"externalId" : "IMP-3399dd-solution-1",
			"description" : "",
			"name" : "Test project"
		},
		"entityInformation" : {
			"externalId" : "2812",
			"name" : "VIZIANAGARAM",
			"region" : "",
			"districtId" : "2812",
			"state" : "AP",
			"_id" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
			"entityType" : "district",
			"entityTypeId" : ObjectId("5f32d8228e0dc8312404056c"),
			"registryDetails" : {
				"locationId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
				"code" : "2812",
				"lastUpdatedAt" : "2021-01-27T13:08:56.065Z"
			},
			"hierarchy" : [ 
				{
					"code" : "28",
					"name" : "Andhra Pradesh",
					"id" : "bc75cc99-9205-463e-a722-5326857838f8",
					"type" : "state"
				}
			]
		},
		"entityId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
		"lastDownloadedAt" :  Date("2021-02-04T10:08:25.337Z"),
		"appInformation" : {
			"appName" : "DIKSHA",
			"appVersion" : "86"
		},
		"hasAcceptedTAndC" : false
	},
	{
		"userId" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"userRole" : "DYEO",
		"createdFor" : [ 
			"0126796199493140480", 
			"0127562898604687369396"
		],
		"status" : "started",
		"isDeleted" : false,
		"categories" : [ 
			{
				"_id" : ObjectId("5fcfa9a2457d6055e33843f3"),
				"externalId" : "educationLeader",
				"name" : "Education Leader"
			}
		],
		"createdBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"tasks" : [ 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "ELECTRICITY",
						"link" : "https://diksha.gov.in/resources/play/content/do_3128848863878676481659",
						"app" : "diksha",
						"id" : "do_3128848863878676481659"
					}
				],
				"deleted" : false,
				"type" : "content",
				"projectTemplateExternalId" : "IMP-3399dd2_IMPORTED",
				"name" : "P2-T1",
				"externalId" : "IMP-3399dd-TASK1-1612435038834",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:37:25.649Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.341Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:37:25.649Z"),
				"attachments" : [ 
					{
						"name" : "T1-E1",
						"type" : "link",
						"isUploaded" : false,
						"url" : ""
					}
				]
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [ 
					{
						"_id" : "1ba997bd-2bff-4025-ac16-d079716b3dfa",
						"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
						"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
						"isDeleted" : false,
						"taskSequence" : [],
						"children" : [],
						"visibleIf" : [ 
							{
								"operator" : "===",
								"_id" : "014743f2-5440-404d-b91a-b6bd60af56f2",
								"value" : "started"
							}
						],
						"hasSubTasks" : false,
						"learningResources" : [],
						"deleted" : false,
						"type" : "simple",
						"name" : "P2-T2-ST1",
						"externalId" : "IMP-3147aa-TASK7",
						"description" : "",
						"updatedAt" :  Date("2022-04-26T08:32:52.100Z"),
						"createdAt" : "2020-12-10T15:53:31.476Z",
						"parentId" : "5fd2447b1233354b094f15d5",
						"isDeletable" : true,
						"status" : "completed",
						"isImportedFromLibrary" : false,
						"syncedAt" :  Date("2022-04-26T08:32:52.100Z")
					}, 
					{
						"_id" : "1ba997bd-2bff-4025-ac16-d079716b3dfa",
						"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
						"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
						"isDeleted" : false,
						"taskSequence" : [],
						"children" : [],
						"visibleIf" : [ 
							{
								"operator" : "===",
								"_id" : "014743f2-5440-404d-b91a-b6bd60af56f2",
								"value" : "started"
							}
						],
						"hasSubTasks" : false,
						"learningResources" : [],
						"deleted" : false,
						"type" : "simple",
						"name" : "P2-T2-ST2",
						"externalId" : "IMP-3147aa-TASK7",
						"description" : "",
						"updatedAt" :  Date("2022-04-26T08:32:52.100Z"),
						"createdAt" : "2020-12-10T15:53:31.476Z",
						"parentId" : "5fd2447b1233354b094f15d5",
						"isDeletable" : true,
						"status" : "completed",
						"isImportedFromLibrary" : false,
						"syncedAt" :  Date("2022-04-26T08:32:52.100Z")
					}
				],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd2_IMPORTED",
				"name" : "P2-T2",
				"externalId" : "IMP-3399dd-TASK3-1612435038843",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:37:25.649Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.363Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:37:25.649Z"),
				"attachments" : [ 
					{
						"name" : "T2-E1",
						"type" : "link",
						"isUploaded" : false,
						"url" : ""
					}
				]
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd2_IMPORTED",
				"name" : "P2-T3",
				"externalId" : "IMP-3399dd-TASK4-1612435038846",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:37:25.649Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.367Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:37:25.650Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "Examprep_10tm_ps_cha 11-Q3",
						"link" : "https://diksha.gov.in/resources/play/content/do_31269108472948326417493",
						"app" : "diksha",
						"id" : "do_31269108472948326417493"
					}
				],
				"deleted" : false,
				"type" : "content",
				"projectTemplateExternalId" : "IMP-3399dd2_IMPORTED",
				"name" : "P2-T4",
				"externalId" : "IMP-3399dd-TASK2-1612435038849",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:37:25.650Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.359Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:37:25.650Z")
			}
		],
		"updatedBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"rootOrganisations" : [ 
			"0126796199493140480"
		],
		"learningResources" : [ 
			{
				"name" : "Movements",
				"link" : "https://diksha.gov.in/resources/play/content/do_3128850456266506241713"
			}
		],
		"deleted" : false,
		"description" : "",
		"title" : "Test project",
		"metaInformation" : {
			"rationale" : "",
			"primaryAudience" : [ 
				"School Leaders."
			],
			"goal" : "Please enter the goal for your  Prerak Head Teacher of the Month project",
			"duration" : "1 months",
			"successIndicators" : "",
			"risks" : "",
			"approaches" : ""
		},
		"updatedAt" :  Date("2021-02-04T10:37:25.659Z"),
		"createdAt" :  Date("2021-02-04T10:37:25.646Z"),
		"__v" : 0,
		"solutionId" : ObjectId("601bce49fdf0bd513d6d7bb2"),
		"solutionExternalId" : "IMP-3399dd-solution-2",
		"programId" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
		"programExternalId" : "Test-program-1597310031178",
		"projectTemplateId" : ObjectId("601bce5e822c5351b813c9f3"),
		"projectTemplateExternalId" : "IMP-3399dd2_IMPORTED",
		"taskReport" : {
			"total" : 4,
			"notStarted" : 4
		},
		"isAPrivateProgram" : false,
		"programInformation" : {
			"_id" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
			"externalId" : "Test-program-1597310031178",
			"description" : "",
			"name" : "Test Program"
		},
		"solutionInformation" : {
			"_id" : ObjectId("601bce49fdf0bd513d6d7bb2"),
			"externalId" : "IMP-3399dd-solution-2",
			"description" : "",
			"name" : "Test project"
		},
		"entityInformation" : {
			"externalId" : "2812",
			"name" : "VIZIANAGARAM",
			"region" : "",
			"districtId" : "2812",
			"state" : "AP",
			"_id" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
			"entityType" : "district",
			"entityTypeId" : ObjectId("5f32d8228e0dc8312404056c"),
			"registryDetails" : {
				"locationId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
				"code" : "2812",
				"lastUpdatedAt" : "2021-01-27T13:08:56.065Z"
			},
			"hierarchy" : [ 
				{
					"code" : "28",
					"name" : "Andhra Pradesh",
					"id" : "bc75cc99-9205-463e-a722-5326857838f8",
					"type" : "state"
				}
			]
		},
		"entityId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
		"lastDownloadedAt" :  Date("2021-02-04T10:37:25.656Z"),
		"appInformation" : {
			"appName" : "DIKSHA",
			"appVersion" : "86"
		},
		"hasAcceptedTAndC" : false,
		"attachments" : [ 
			{
				"name" : "PE1",
				"type" : "image/jpeg",
				"url" : "https://samikshaprod.blob.core.windows.net/samiksha/survey//0fecc38b-956c-4909-a3e7-be538ef7acd4/f0",
				"sourcePath" : "_PE1"
			}
		],
		"remarks" : "P2-Remark"
	},
	{
		"userId" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"userRole" : "DYEO",
		"createdFor" : [ 
			"0126796199493140480", 
			"0127562898604687369396"
		],
		"status" : "started",
		"isDeleted" : false,
		"categories" : [ 
			{
				"_id" : ObjectId("5fcfa9a2457d6055e33843f3"),
				"externalId" : "educationLeader",
				"name" : "Education Leader"
			}
		],
		"createdBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"tasks" : [ 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "ELECTRICITY",
						"link" : "https://diksha.gov.in/resources/play/content/do_3128848863878676481659",
						"app" : "diksha",
						"id" : "do_3128848863878676481659"
					}
				],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd3_IMPORTED",
				"name" : "P3-T1",
				"externalId" : "IMP-3399dd-TASK1-1612435520512",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:45:28.518Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.341Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:45:28.518Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "Examprep_10tm_ps_cha 11-Q3",
						"link" : "https://diksha.gov.in/resources/play/content/do_31269108472948326417493",
						"app" : "diksha",
						"id" : "do_31269108472948326417493"
					}
				],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd3_IMPORTED",
				"name" : "P3-T2",
				"externalId" : "IMP-3399dd-TASK2-1612435520515",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:45:28.518Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.359Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:45:28.518Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd3_IMPORTED",
				"name" : "P3-T3",
				"externalId" : "IMP-3399dd-TASK3-1612435520518",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:45:28.518Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.363Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:45:28.518Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd3_IMPORTED",
				"name" : "P3-T4",
				"externalId" : "IMP-3399dd-TASK4-1612435520521",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:45:28.518Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.367Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:45:28.518Z")
			}
		],
		"updatedBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"rootOrganisations" : [ 
			"0126796199493140480"
		],
		"learningResources" : [ 
			{
				"name" : "Movements",
				"link" : "https://diksha.gov.in/resources/play/content/do_3128850456266506241713"
			}
		],
		"deleted" : false,
		"description" : "",
		"title" : "Test project",
		"metaInformation" : {
			"rationale" : "",
			"primaryAudience" : [ 
				"School Leaders."
			],
			"goal" : "Please enter the goal for your  Prerak Head Teacher of the Month project",
			"duration" : "1 months",
			"successIndicators" : "",
			"risks" : "",
			"approaches" : ""
		},
		"updatedAt" :  Date("2021-02-04T10:45:28.528Z"),
		"createdAt" :  Date("2021-02-04T10:45:28.514Z"),
		"__v" : 0,
		"solutionId" : ObjectId("601bd027fdf0bd513d6d7bb3"),
		"solutionExternalId" : "IMP-3399dd-solution-3",
		"programId" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
		"programExternalId" : "Test-program-1597310031178",
		"projectTemplateId" : ObjectId("601bd040822c5351b813c9f9"),
		"projectTemplateExternalId" : "IMP-3399dd3_IMPORTED",
		"taskReport" : {
			"total" : 4,
			"notStarted" : 4
		},
		"isAPrivateProgram" : false,
		"programInformation" : {
			"_id" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
			"externalId" : "Test-program-1597310031178",
			"description" : "",
			"name" : "Test Program"
		},
		"solutionInformation" : {
			"_id" : ObjectId("601bd027fdf0bd513d6d7bb3"),
			"externalId" : "IMP-3399dd-solution-3",
			"description" : "",
			"name" : "Test project"
		},
		"entityInformation" : {
			"externalId" : "2812",
			"name" : "VIZIANAGARAM",
			"region" : "",
			"districtId" : "2812",
			"state" : "AP",
			"_id" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
			"entityType" : "district",
			"entityTypeId" : ObjectId("5f32d8228e0dc8312404056c"),
			"registryDetails" : {
				"locationId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
				"code" : "2812",
				"lastUpdatedAt" : "2021-01-27T13:08:56.065Z"
			},
			"hierarchy" : [ 
				{
					"code" : "28",
					"name" : "Andhra Pradesh",
					"id" : "bc75cc99-9205-463e-a722-5326857838f8",
					"type" : "state"
				}
			]
		},
		"entityId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
		"lastDownloadedAt" :  Date("2021-02-04T10:45:28.525Z"),
		"appInformation" : {
			"appName" : "DIKSHA",
			"appVersion" : "86"
		},
		"hasAcceptedTAndC" : false,
		"attachments" : [ 
			{
				"name" : "PE1",
				"type" : "link",
				"url" : "https://samikshaprod.blob.core.windows.net/samiksha/survey//0fecc38b-956c-4909-a3e7-be538ef7acd4/f0",
				"sourcePath" : "_PE1"
			}
		]
	},
	{
		"userId" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"userRole" : "DYEO",
		"createdFor" : [ 
			"0126796199493140480", 
			"0127562898604687369396"
		],
		"status" : "started",
		"isDeleted" : false,
		"categories" : [ 
			{
				"_id" : ObjectId("5fcfa9a2457d6055e33843f3"),
				"externalId" : "educationLeader",
				"name" : "Education Leader"
			}
		],
		"createdBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"tasks" : [ 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [ 
					{
						"name" : "Movements",
						"link" : "https://diksha.gov.in/resources/play/content/do_3128850456266506241713"
					}
				],
				"deleted" : false,
				"type" : "content",
				"projectTemplateExternalId" : "IMP-3399dd4_IMPORTED",
				"name" : "P4-T1",
				"externalId" : "IMP-3399dd-TASK1-1612436280449",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:58:08.965Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.341Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:58:08.965Z")
			}, 
			{
				"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
				"isDeleted" : false,
				"isDeletable" : true,
				"taskSequence" : [],
				"children" : [],
				"visibleIf" : [],
				"hasSubTasks" : false,
				"learningResources" : [],
				"deleted" : false,
				"type" : "simple",
				"projectTemplateExternalId" : "IMP-3399dd4_IMPORTED",
				"name" : "P4-T2",
				"externalId" : "IMP-3399dd-TASK3-1612436280453",
				"description" : "",
				"updatedAt" :  Date("2021-02-04T10:58:08.965Z"),
				"createdAt" :  Date("2021-02-04T09:50:35.363Z"),
				"status" : "notStarted",
				"isImportedFromLibrary" : false,
				"syncedAt" :  Date("2021-02-04T10:58:08.965Z")
			}
		],
		"updatedBy" : "19569316-7b66-4b94-9082-f2b4b8b178ee",
		"rootOrganisations" : [ 
			"0126796199493140480"
		],
		"learningResources" : [ 
			{
				"name" : "ELECTRICITY",
				"link" : "https://diksha.gov.in/resources/play/content/do_3128848863878676481659"
			}
		],
		"deleted" : false,
		"description" : "",
		"title" : "Test project",
		"metaInformation" : {
			"rationale" : "",
			"primaryAudience" : [ 
				"School Leaders."
			],
			"goal" : "Please enter the goal for your  Prerak Head Teacher of the Month project",
			"duration" : "1 months",
			"successIndicators" : "",
			"risks" : "",
			"approaches" : ""
		},
		"updatedAt" :  Date("2021-02-04T10:58:08.974Z"),
		"createdAt" :  Date("2021-02-04T10:58:08.961Z"),
		"__v" : 0,
		"solutionId" : ObjectId("601bd322fdf0bd513d6d7bb4"),
		"solutionExternalId" : "IMP-3399dd-solution-4",
		"programId" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
		"programExternalId" : "Test-program-1597310031178",
		"projectTemplateId" : ObjectId("601bd338822c5351b813c9ff"),
		"projectTemplateExternalId" : "IMP-3399dd4_IMPORTED",
		"taskReport" : {
			"total" : 4,
			"notStarted" : 4
		},
		"isAPrivateProgram" : false,
		"programInformation" : {
			"_id" : ObjectId("601bc3eafdf0bd513d6d7bb0"),
			"externalId" : "Test-program-1597310031178",
			"description" : "",
			"name" : "Test Program"
		},
		"solutionInformation" : {
			"_id" : ObjectId("601bd322fdf0bd513d6d7bb4"),
			"externalId" : "IMP-3399dd-solution-4",
			"description" : "",
			"name" : "Test project"
		},
		"entityInformation" : {
			"externalId" : "2812",
			"name" : "VIZIANAGARAM",
			"region" : "",
			"districtId" : "2812",
			"state" : "AP",
			"_id" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
			"entityType" : "district",
			"entityTypeId" : ObjectId("5f32d8228e0dc8312404056c"),
			"registryDetails" : {
				"locationId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
				"code" : "2812",
				"lastUpdatedAt" : "2021-01-27T13:08:56.065Z"
			},
			"hierarchy" : [ 
				{
					"code" : "28",
					"name" : "Andhra Pradesh",
					"id" : "bc75cc99-9205-463e-a722-5326857838f8",
					"type" : "state"
				}
			]
		},
		"entityId" : "b54a5c6d-98be-4313-af1c-33040b1703aa",
		"lastDownloadedAt" :  Date("2021-02-04T10:58:08.971Z"),
		"appInformation" : {
			"appName" : "DIKSHA",
			"appVersion" : "86"
		},
		"hasAcceptedTAndC" : false,
		"remarks" : "P4-Remark",
		"attachments" : [ 
			{
				"name" : "PE1",
				"type" : "link",
				"url" : "https://samikshaprod.blob.core.windows.net/samiksha/survey//0fecc38b-956c-4909-a3e7-be538ef7acd4/f0",
				"sourcePath" : "_PE1"
			}, 
			{
				"name" : "PE2",
				"type" : "link",
				"url" : "https://samikshaprod.blob.core.windows.net/samiksha/survey//0fecc38b-956c-4909-a3e7-be538ef7acd4/f0",
				"sourcePath" : "_PE1"
			}, 
			{
				"name" : "PE3",
				"type" : "link",
				"url" : "https://samikshaprod.blob.core.windows.net/samiksha/survey//0fecc38b-956c-4909-a3e7-be538ef7acd4/f0",
				"sourcePath" : "_PE1"
			}, 
			{
				"name" : "PE4",
				"type" : "link",
				"url" : "https://samikshaprod.blob.core.windows.net/samiksha/survey//0fecc38b-956c-4909-a3e7-be538ef7acd4/f0",
				"sourcePath" : "_PE1"
			}
		]
	}
]
var moment = require('moment')

var chunk = require('chunk');


module.exports = {
	async up(db) {
		global.migrationMsg = 'Uploaded mongo'
		
		
		
		
		for (let index = 0; index <= 50000; index++) {

			
			let docs = [];

			await Promise.all(
				projects.map(async (element) => {
					element['_id'] = ObjectId();
					docs.push(... projects);
					await db.collection('projects12').insertOne(element);
				})
			)

			// projects.forEach(async function(element) {
			// 	docs.push(... projects);
			// 	await db.collection('projects12').insertMany(docs);
			// });
			// await Promise.all(projects.map(async function(element){
			// 	docs.push(element);
			// //	await db.collection('projects11').insertMany(element);
				
			// }));
			

			//const element = array[index];
			console.log("index",index);
			if(index == 50000){
				await db.collection('projects12').insertMany(docs);
				console.log("-------done-----");
				sss
			}

		}
		
		console.log("------------");
		
		

		
	},

	async down(db) {
		// db.collection('entities').deleteMany({
		// 	value: { $in: categories.map((category) => category.value) },
		// })
	},
}
