const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
	, moment = require('moment')
	, cron = require('node-cron');

const bucketName = process.env.HONDA_DB_BUCKET;

function membership(){}


membership.create = (data, callback) => {

	data.docType 	      = "MEMBER";
	data.id 	 	      = data.docType + "::" + uuid.v4();
	data.dateCreated      = moment().format('YYYY-MM-DD'); 
	data.dateUpdated      = moment().format('YYYY-MM-DD');
	data.validIn	      = data.membershipDate;
	data.status		      = "inactive";
	data.points		      = 0;
	data.redeemablePoints = 0;

	couchbaseModel.getById("CARDNUMBER", (err, cardNumberCount) => {

			if(err) throw err;

			let cardNumber = cardNumberCount.cardNumber.toString();
			
			while(cardNumber.length != 5) cardNumber = "0"+cardNumber;

			data.cardNumber = cardNumber;

			couchbaseModel.save(data, (err, res) => {

				if(err) throw err;
				
				cardNumberCount.cardNumber = cardNumberCount.cardNumber + 1;

				couchbaseModel.update("CARDNUMBER", `cardNumber=${cardNumberCount.cardNumber}`, (err, res) => {

					if(err) throw err;
					callback(null, res);

				})

			})

	})

}

membership.getById = (id, callback) => {

	couchbaseModel.getById(id, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

membership.get = ({fields, conditions }, callback) => {

	conditions = "docType='MEMBER' " + conditions;

	couchbaseModel.getDocumentByParameters(fields, conditions, (err, res) => {

		if(err) return callback(err, null);
		return callback(null, res);

	})

}
 	
membership.update = (data, callback) => {

	let properties = '';

	Object.keys(data).forEach((property, index) => {

		if(property != 'id' && property != 'cardNumber'){

			if(property=="registrationNumber") properties += `${property}=${JSON.stringify(data.registrationNumber)}`
			else properties += `${property}='${data[property]}'`

			if(index<Object.keys(data).length-2) properties += ', ';

		}

	});

	couchbaseModel.update(data.id, properties, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

membership.searchByCardNumber = (substring, callback) => {

	let fields =  "id, cardNumber, lastName, firstName, ";
			fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
			fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix, ";

	couchbaseModel.getDocumentByParameters(fields, `docType='MEMBER' AND LOWER(cardNumber) LIKE LOWER('%${substring}%')`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}


membership.searchByNameAndCardNumber = ({substring, fields, additionalConditions, editPermission}, callback) => {

	const deleteButton = (editPermission==true ? `<img id="' || id || '" class="delete icon deleteIcon" style="float: right" src="../images/icons/delete.png">` : '');

	if(additionalConditions == "none") additionalConditions = "";

	if(fields == "table"){
		fields =  `'<p class="cardNumberRow" value="' || id || '">' || cardNumber || '</p>' as cardNumber, `;
		fields += `lastName, firstName, `;
		fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
		fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix, ";
		fields += `membershipDate, `;
		fields += `membershipThru, `
		fields += `CASE WHEN status == 'active' then '<i class=\"fa fa-circle\" style=\"color: green; margin-left: 20px;\"></i> ${deleteButton}' ELSE '<i class=\"fa fa-circle-thin\" style=\"margin-left: 20px;\"></i> ${deleteButton}' END AS status`
	}
	
	couchbaseModel.getDocumentByParameters(fields, `docType='MEMBER' AND (LOWER(lastName) LIKE LOWER('%${substring}%') OR LOWER(firstName) LIKE LOWER('%${substring}%') OR LOWER(middleName) LIKE LOWER('%${substring}%') OR LOWER(suffix) LIKE LOWER('%${substring}%') OR LOWER(cardNumber) LIKE LOWER('%${substring}%')) ${additionalConditions} LIMIT 5`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

membership.delete = (id, callback) => {

	couchbaseModel.delete(id, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

// card printing API
membership.getActiveMembers = (callback) => {
	const query = `SELECT 
	cardNumber,
	firstName || middleName || lastName || suffix AS fullname, 
	birthdate,
	validThru
	
	FROM ${bucketName}
	LET middleName = CASE WHEN middleName != '' THEN ' ' || middleName ELSE '' END,
	lastName = ' ' || lastName,
	suffix = CASE WHEN suffix != '' THEN ' ' || suffix ELSE '' END
	
	WHERE docType='MEMBER' AND status='active'
	ORDER BY cardNumber`

	couchbaseModel.query(query, (err, res) => {

		if(err) return callback(err, null);
		return callback(null, res);

	})
};


membership.checkExpiryCard = () => {

	cron.schedule('0 0 0 * * *', () => {
		
		const currentDate = new Date(moment().format('YYYY-MM-DD'));
		const renewDate = new Date(currentDate.setMonth(currentDate.getMonth()+24)).toISOString().substring(0, 10);

		// Get all expiry cards with 4 or more transactions
		let query = `
		SELECT RAW ARRAY_AGG(member.id)[0] id
		FROM ${bucketName} transactions
		JOIN ${bucketName} member ON KEYS transactions.memberId

		WHERE transactions.docType="TRANSACTION"
		AND member.validThru >= '${moment().format('YYYY-MM-DD')}'
		AND member.status == 'active'
		AND transactions.transactionDate >= member.validIn
		AND transactions.transactionType='EARN'
		GROUP BY transactions.memberId
		HAVING count(transactions) >= 4`
		
		couchbaseModel.query(query, (err, res) => {
			
			if(err) return callback(err, null);

			// renew cards with 4 or more transactions 
			let query = `UPDATE ${bucketName} SET validIn = '${currentDate}', validThru = '${renewDate}' WHERE docType = 'MEMBER' AND id IN ${JSON.stringify(res)}`
			
			couchbaseModel.query(query, (error, result) => {

				if(err) return callback(err, null);

				// set card status to inactive if the member have less than 4 visits
				let query = `UPDATE ${bucketName} SET status='inactive' WHERE docType = 'MEMBER' AND validThru == "${moment().format('YYYY-MM-DD')}"`
				
				couchbaseModel.query(query, (error, result) => {

					if(err) return callback(err, null);
					console.log(`Expiry card count: ${result.length}`)
					
				})


			})

		})
  
	})

};

module.exports.membership = membership;
