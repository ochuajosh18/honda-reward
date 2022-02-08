const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
    , moment = require('moment');

function redeemable(){}


redeemable.create = (data, callback) => {

	data.docType 	 = "REDEEMABLE";
	data.id 	 	 = data.docType + "::" + uuid.v4();
	data.dateCreated = moment().toISOString();
	data.dateUpdated = moment().toISOString();

	couchbaseModel.save(data, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

redeemable.get = ({fields, conditions }, callback) => {

	conditions = "docType='REDEEMABLE' " + conditions;

	couchbaseModel.getDocumentByParameters(fields, conditions, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}
 	
redeemable.update = (data, callback) => {

	let properties = `dateUpdated="${moment().toISOString()}", `;


	Object.keys(data).forEach((property, index) => {

		if(property != 'id'){

			properties += `${property}='${data[property]}'`

			if(index<Object.keys(data).length-2) properties += ', ';

		}

	});

	couchbaseModel.update(data.id, properties, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

redeemable.delete = (id, callback) => {

	couchbaseModel.delete(id, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

redeemable.search = (substring, callback) => {

	couchbaseModel.getDocumentByParameters("name, category, CASE WHEN status == 'active' then '<i class=\"fa fa-circle\" style=\"color: green; margin-left: 20px;	\"/>' else '<i class=\"fa fa-circle-thin\" style=\"margin-left: 20px;\"/>' end as status", `docType='REDEEMABLE' AND LOWER(name) LIKE LOWER('%${substring}%')`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

module.exports.redeemable = redeemable;
