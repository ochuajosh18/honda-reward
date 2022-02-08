const bucketName = process.env.HONDA_DB_BUCKET;
const host = process.env.HONDA_DB_HOST;

const couchbase = require('couchbase');
const cluster = new couchbase.Cluster(host);
const N1qlQuery = couchbase.N1qlQuery;
const moment = require('moment');

if (process.env.NODE_ENV != 'local') {
    cluster.authenticate('Administrator', process.env.HONDA_DB_PASS);
}

const bucket = cluster.openBucket(bucketName);

bucket.on('error', err => console.log(err.message));
bucket.on('connect', () => {
    console.log(`couchbase: ${host}`);
    console.log(`bucket: ${bucketName}`);
});

function couchbaseModel() {}

couchbaseModel.getById = (id, callback) => {
    bucket.get(id, function(error, result) {
        if (error) return callback(error, null);
        return callback(null, result.value);
    });
};

couchbaseModel.save = (value, callback) => {
    value.dateCreated = moment().format('YYYY-MM-DD');
    value.dateUpdated = moment().format('YYYY-MM-DD');

    bucket.insert(value.id, value, (error, result) => {
        if (error) throw error;

        setTimeout(() => {
            callback(null, result);
        }, 500);
    });
};

couchbaseModel.update = (id, properties, callback) => {
    query = N1qlQuery.fromString();

    let queryString = `UPDATE ${bucketName} USE KEYS '${id}' SET ${properties}`;

    bucket.query(N1qlQuery.fromString(queryString), (error, result) => {
        if (error) callback(error, null);
        callback(null, result);
    });
};

couchbaseModel.delete = (id, callback) => {
    bucket.remove(id, (error, result) => {
        if (error) callback(error, null);
        callback(null, result);
    });
};

couchbaseModel.query = (query, callback) => {
    query = N1qlQuery.fromString(query);

    bucket.query(query, (error, result) => {
        if (error) callback(error, null);
        callback(null, result);
    });
};

couchbaseModel.getDocumentByParameters = (fields, conditions, callback) => {
    let translatedFields = fields.replace(/bucketName/g, bucketName);

    query = N1qlQuery.fromString(`SELECT ${translatedFields} FROM ${bucketName} WHERE ${conditions}`);

    bucket.query(query, (error, result) => {
        if (error) callback(error, null);
        callback(null, result);
    });
};

couchbaseModel.getJoinedDocumentByParameters = (fields, alias, conditions, callback) => {
    let joinBuckets = alias.replace(/bucketName/g, bucketName);
    // console.log(`SELECT ${fields} FROM ${joinBuckets} WHERE ${conditions}`);

    query = N1qlQuery.fromString(`SELECT ${fields} FROM ${joinBuckets} WHERE ${conditions}`);

    bucket.query(query, (error, result) => {
        if (error) return callback(error, null);
        return callback(null, result);
    });
};

couchbaseModel.adhocQuery = (queryString, callback) => {
    query = N1qlQuery.fromString();

    const queryStr = queryString.replace(/bucketName/g, bucketName);

    bucket.query(N1qlQuery.fromString(queryStr), function(error, result) {
        if (error) return callback(error, null);
        return callback(null, result);
    });
};

couchbaseModel.executeQuery = queryString => {
    query = N1qlQuery.fromString();
    
    return new Promise((resolve, reject) => {
        bucket.query(N1qlQuery.fromString(queryString), function(error, result) {
            if(error) {
                reject(error.message);
            }
            else {
                resolve(result);
            }
        });
    })
};

module.exports.couchbaseModel = couchbaseModel;
