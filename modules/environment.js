const env = require('dotenv').config();

function setEnvironmentVariables(environment) {
    switch (environment) {
        case 'production':
            process.env.HONDA_DB_HOST = process.env.PRODUCTION_DB_HOST;
            process.env.HONDA_AMI_HOST = process.env.PRODUCTION_AMI_HOST;
            process.env.HONDA_DB_BUCKET = process.env.PRODUCTION_DB_BUCKET;
            process.env.HONDA_DB_PASS = process.env.PRODUCTION_DB_PASS;
            break;

        case 'staging':
            process.env.HONDA_DB_HOST = process.env.STAGING_DB_HOST;
            process.env.HONDA_AMI_HOST = process.env.STAGING_AMI_HOST;
            process.env.HONDA_DB_BUCKET = process.env.STAGING_DB_BUCKET;
            process.env.HONDA_DB_PASS = process.env.STAGING_DB_PASS;
            break;

        case 'development':
            process.env.HONDA_DB_HOST = process.env.DEVELOP_DB_HOST;
            process.env.HONDA_AMI_HOST = process.env.DEVELOP_AMI_HOST;
            process.env.HONDA_DB_BUCKET = process.env.DEVELOP_DB_BUCKET;
            process.env.HONDA_DB_PASS = process.env.DEVELOP_DB_PASS;
            break;

        default:
            process.env.HONDA_DB_HOST = process.env.LOCAL_DB_HOST;
            process.env.HONDA_AMI_HOST = process.env.LOCAL_AMI_HOST;
            process.env.HONDA_DB_BUCKET = process.env.LOCAL_DB_BUCKET;
            process.env.HONDA_DB_PASS = process.env.LOCAL_DB_PASS;
            break;
    }
}

module.exports = setEnvironmentVariables;
