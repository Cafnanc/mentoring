# Mentoring Service APIs

Recommend to,
Install any IDE in your system(eg: VScode etc..)
Install nodejs from : https://nodejs.org/en/download/
Install mongoDB: https://docs.mongodb.com/manual/installation/
Install Robo 3T: ​​https://robomongo.org/

## 1. Cloning the Mentoring repository into your system

Goto https://github.com/ELEVATE-Project/mentoring From the code tab copy the link. Using that link clone the repository into your local machine.

Let's make it more easy for you:

    1. Create a new folder where you want to clone the repository.
    2. Goto that directory through the terminal and execute the commands.

git clone https://github.com/ELEVATE-Project/mentoring.git

## 2. Add .env file to the project directory

    create  a file named as .env in root directory of the project and copy below code into that file.
    Add fallowing enviorment configs

## 3. Run mongodb locally

spacify the mongo port and ip in .env
application takes the db as specified in the .env

### Required Environment variables:

````
```
# Mentoring Service Config


# Port on which service runs
APPLICATION_PORT = 3000

# Service environment
APPLICATION_ENV = development

# Route after base url
APPLICATION_BASE_URL = /mentoring/

# Mongo db connectivity url
MONGODB_URL = mongodb://localhost:27017/elevate-mentoring

# Token secret to verify the access token
ACCESS_TOKEN_SECRET = 'bsj82AHBxahusub12yexlashsbxAXADHBlaj'

# Kafka hosted server url
KAFKA_URL = localhost:9092

# Kafka group to which consumer belongs
KAFKA_GROUP_ID = userservice

# Kafka topic to push notification data
NOTIFICATION_KAFKA_TOPIC = notificationtopic

# Kafka topic name to consume from mentoring topic
KAFKA_MENTORING_TOPIC ="mentoringtopic"

# Kafka topic to push recording data
KAFKA_RECORDING_TOPIC ="recordingtopic"

# Any one of three features available for cloud storage
CLOUD_STORAGE = 'GCP/AWS/AZURE'

# Gcp json config file path
GCP_PATH = 'gcp.json'

# Gcp bucket name which stores files
DEFAULT_GCP_BUCKET_NAME = 'gcp-bucket-storage-name'

# Gcp project id
GCP_PROJECT_ID = 'project-id'

# Aws access key id
AWS_ACCESS_KEY_ID = 'aws-access-key-id'

# Aws secret access key
AWS_SECRET_ACCESS_KEY = 'aws-secret-access-key'

# Aws region where bucket will be located
AWS_BUCKET_REGION = 'ap-south-1'

# Aws end point
AWS_BUCKET_ENDPOINT = 's3.ap-south-1.amazonaws.com'

# Aws bucket name which stores files
DEFAULT_AWS_BUCKET_NAME = 'aws-bucket-storage-name'

# Azure storage account name
AZURE_ACCOUNT_NAME = 'account-name'

# Azure storage account key
AZURE_ACCOUNT_KEY = 'azure-account-key'

# Azure storage container which stores files
DEFAULT_AZURE_CONTAINER_NAME = 'azure-container-storage-name'

# user serice host
USER_SERIVCE_HOST = 'http://localhost:3001'

# user serice base url
USER_SERIVCE_BASE_URL = '/user/'

# Big blue button url
BIG_BLUE_BUTTON_URL = https://dev.mentoring.shikshalokam.org

# Big blue button base url
BIB_BLUE_BUTTON_BASE_URL = /bigbluebutton/

# Meeting end callback events end point
MEETING_END_CALLBACK_EVENTS = https%3A%2F%2Fdev.elevate-apis.shikshalokam.org%2Fmentoring%2Fv1%2Fsessions%2Fcompleted

# Big blue button secret key
BIG_BLUE_BUTTON_SECRET_KEY = n

# Big blue button recording ready callback url
RECORDING_READY_CALLBACK_URL = http%3A%2F%2Flocalhost%3A3000%2F%3FmeetingID%3Dmeet123

# Enable logging of network request
ENABLE_LOG = true

```
````

## 4. Install Npm

    npm i
    To install the dependencies in your local machine.

## 5. To Run server

    npm start
