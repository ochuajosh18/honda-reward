const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
    , moment = require('moment');

function promotion(){}


promotion.create = (data, callback) => {

	data.docType 	 = "PROMOTION";
	data.id 	 	 = data.docType + "::" + uuid.v4();
	data.dateCreated = moment().format('YYYY-MM-DD'); 
	data.dateUpdated = moment().format('YYYY-MM-DD');

	
	// Constructing setup property
	data.setup = {};
	data.setup.general = { "minimum": data.generalMinimumAmount, "pointPer": data.onePointPerGeneral }
	data.setup.services = { "minimum": data.servicesMinimumAmount, "pointPer": data.onePointPerServices }
	data.setup.goods = { "minimum": data.goodsMinimumAmount, "pointPer": data.onePointPerGoods }
	data.setup.accessories = { "minimum": data.accessoriesMinimumAmount, "pointPer": data.onePointPerAccessories }
	
	// Removing remodelled properties
	const remodelledProperties = ["generalMinimumAmount", "onePointPerGeneral", "servicesMinimumAmount", "onePointPerServices", "goodsMinimumAmount", "onePointPerGoods", "accessoriesMinimumAmount", "onePointPerAccessories"];
	remodelledProperties.forEach(property => delete data[property]);

	couchbaseModel.save(data, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

promotion.get = ({fields, conditions }, callback) => {

	conditions = "docType='PROMOTION' " + conditions;

	couchbaseModel.getDocumentByParameters(fields, conditions, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}
 	
promotion.update = (data, callback) => {

	let properties = `dateUpdated="${moment().format('YYYY-MM-DD')}", `;

	// Constructing setup property
	data.setup = {};
	data.setup.general = { "minimum": data.generalMinimumAmount, "pointPer": data.onePointPerGeneral }
	data.setup.services = { "minimum": data.servicesMinimumAmount, "pointPer": data.onePointPerServices }
	data.setup.goods = { "minimum": data.goodsMinimumAmount, "pointPer": data.onePointPerGoods }
	data.setup.accessories = { "minimum": data.accessoriesMinimumAmount, "pointPer": data.onePointPerAccessories }
	
	// Removing unnecessary properties
	const remodelledProperties = ["generalMinimumAmount", "onePointPerGeneral", "servicesMinimumAmount", "onePointPerServices", "goodsMinimumAmount", "onePointPerGoods", "accessoriesMinimumAmount", "onePointPerAccessories"];
	remodelledProperties.forEach(property => delete data[property]);

	Object.keys(data).forEach((property, index) => {

		if(property != 'id'){

			if(property == 'setup') properties += 'setup='+ JSON.stringify(data.setup) + '}';
			else properties += `${property}='${data[property]}'`

			if(index<Object.keys(data).length-2) properties += ', ';

		}

	});

	properties = properties.slice(0, -1);

	couchbaseModel.update(data.id, properties, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

promotion.delete = (id, callback) => {

	couchbaseModel.delete(id, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

promotion.search = (substring, source, callback) => {

	let fields = (source=="external" ? `'<p class="promoTitle">' || title || '</p>' as title, setup, id` : `title`)

	couchbaseModel.getDocumentByParameters(fields, `docType='PROMOTION' AND LOWER(title) LIKE LOWER('%${substring}%')`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

module.exports.promotion = promotion;
