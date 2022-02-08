const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
    , moment = require('moment');

function transaction(){}


transaction.create = (data, callback) => {

	data.docType 	  			= "TRANSACTION";
	data.dateCreated  		= moment().toISOString(); 
	data.dateUpdated  		= moment().toISOString();
	data.posted 	  			= false;

	data.totalPoints = parseFloat(data.totalPoints);

	if(data.transactionType == "EARN"){

		//Converting totals to float
		data.totalAmount = parseFloat(data.totalAmount);
		data.totalPoints = parseFloat(data.totalPoints);

		data.totalConversion = parseFloat(data.totalConversion);

		// Constructing transactionPerCategory property
		data.transactionPerCategory = {};
		data.transactionPerCategory.general = { "amount": parseFloat(data.generalAmount), "pointsEarned": parseFloat(data.generalPoints) }
		data.transactionPerCategory.services = { "amount": parseFloat(data.servicesAmount), "pointsEarned": parseFloat(data.servicesPoints) }
		data.transactionPerCategory.goods = { "amount": parseFloat(data.goodsAmount), "pointsEarned": parseFloat(data.goodsPoints) }
		data.transactionPerCategory.accessories = { "amount": parseFloat(data.accessoriesAmount), "pointsEarned": parseFloat(data.accessoriesPoints) }
		
		// Removing remodelled properties
		const remodelledProperties = ["generalAmount","generalPoints","servicesAmount","servicesPoints","goodsAmount","goodsPoints","accessoriesAmount","accessoriesPoints"];
		remodelledProperties.forEach(property => delete data[property]);

	}

	else{

		if(data.redeemType == "DISCOUNT"){
			data.transactionAmount = parseFloat(data.transactionAmount);
			data.discountedAmount = parseFloat(data.discountedAmount);
			data.dicountEquivalent = parseFloat(data.dicountEquivalent);
		}

		else{
			data.totalAmount = parseFloat(data.totalAmount);
			
			// Removing unnecessary properties of redeemedItems 
			data.redeemedItems.forEach(item => {
					item['amount'] = parseFloat(item['amount']);
					item['points'] = parseFloat(item['points']);
					delete item['delete'];
					delete item['id']
			})
		}
		
		data.redeemablePoints = data.redeemablePoints.toFixed(2);

		// Converting total points to negative
		data.totalPoints = -Math.abs(data.totalPoints);

		couchbaseModel.update(data.memberId, `redeemablePoints=${data.redeemablePoints}`, (err, res) => {
			if(err) throw err;
		});

	}

	delete data['redeemablePoints'];

	couchbaseModel.getById("TRANSACTION::NUMBER", (err, transaction) => {

		if(err) throw err;

		let transactionNumber= transaction.transactionNumber.toString();
		
		while(transactionNumber.length != 13) transactionNumber = "0"+transactionNumber;

		data.id = transactionNumber;

		couchbaseModel.save(data, (err, res) => {

			if(err) throw err;
			
			transaction.transactionNumber = transaction.transactionNumber + 1;

			couchbaseModel.update("TRANSACTION::NUMBER", `transactionNumber=${transaction.transactionNumber}`, (err, res) => {

				if(err) throw err;
				callback(null, transactionNumber);

			})

		})

	})

}

transaction.update = (data, callback) => {

		let properties = `dateUpdated="${moment().format('YYYY-MM-DD')}", `;

		if(data.transactionType == "EARN"){

			// Constructing transactionPerCategory property
			data.transactionPerCategory = {};
			data.transactionPerCategory.general = { "amount": parseFloat(data.generalAmount), "pointsEarned": parseFloat(data.generalPoints) }
			data.transactionPerCategory.services = { "amount": parseFloat(data.servicesAmount), "pointsEarned": parseFloat(data.servicesPoints) }
			data.transactionPerCategory.goods = { "amount": parseFloat(data.goodsAmount), "pointsEarned": parseFloat(data.goodsPoints) }
			data.transactionPerCategory.accessories = { "amount": parseFloat(data.accessoriesAmount), "pointsEarned": parseFloat(data.accessoriesPoints) }
			

			// Removing remodelled properties
			const remodelledProperties = ["generalAmount","generalPoints","servicesAmount","servicesPoints","goodsAmount","goodsPoints","accessoriesAmount","accessoriesPoints"];
			remodelledProperties.forEach(property => delete data[property]);

		}

		else{

			if(data.redeemType == "DISCOUNT"){
				data.transactionAmount = parseFloat(data.transactionAmount);
				data.discountedAmount = parseFloat(data.discountedAmount);
				data.dicountEquivalent = parseFloat(data.dicountEquivalent);
			}

			else{
				data.totalAmount = parseFloat(data.totalAmount);
				
				// Removing unnecessary properties of redeemedItems 
				data.redeemedItems.forEach(item => {
						item['amount'] = parseFloat(item['amount']);
						item['points'] = parseFloat(item['points']);
						delete item['delete'];
						delete item['id']
				})
			}

			data.redeemablePoints = data.redeemablePoints.toFixed(2);
			
			//Converting total points to negative
			data.totalPoints = -Math.abs(data.totalPoints);

			couchbaseModel.update(data.memberId, `redeemablePoints=${data.redeemablePoints}`, (err, res) => {
				if(err) throw err;
			})

			delete data['memberId'];
			delete data['redeemablePoints'];

		}

		Object.keys(data).forEach((property, index) => {

			if(property != 'id' && property != 'transactionType'){

				if(property == 'transactionPerCategory') properties += 'transactionPerCategory=' + JSON.stringify(data.transactionPerCategory) + '}';
				else if(property == 'redeemedItems') properties += 'redeemedItems=' + JSON.stringify(data.redeemedItems);
				else if(['totalAmount', 'totalPoints', 'totalConversion', 'transactionAmount', 'discountedAmount', 'dicountEquivalent'].includes(property)) properties += `${property}=${data[property]}`
				else properties += `${property}='${data[property]}'`

				if(index<Object.keys(data).length-3) properties += ', ';

			}

		});

		if(data.transactionType == "EARN") properties = properties.slice(0, -1);

		couchbaseModel.update(data.id, properties, (err, res) => {

			if(err) throw err;
			callback(null, res)

		})

}


transaction.get = ({fields, conditions }, callback) => {

		conditions = "docType='TRANSACTION' " + conditions;

		couchbaseModel.getDocumentByParameters(fields, conditions, (err, res) => {

			if(err) throw err;
			callback(null, res)

		})

}

transaction.getById = (id, callback) => {

		couchbaseModel.getById(id, (err, res) => {

			if(err) throw err;
			callback(null, res)

		})

}

transaction.delete = ({id, transactionType, memberId}, callback) => {

		// since the redeem transaction is deleted, this will retrieve the points back to the member (redeemablePoints)
		// for deletion of transaction in posting
		if(transactionType == "REDEEM"){

				couchbaseModel.getById(id, (err, transaction) => {

					if(err) throw err;

					const retrievedPoints = Math.abs(transaction.totalPoints);

					couchbaseModel.update(memberId, `redeemablePoints=redeemablePoints+${retrievedPoints}`, (err, res) => {

						if(err) throw err;

					})

				})

		}

		couchbaseModel.delete(id, (err, res) => {

			if(err) throw err;
			callback(null, res)

		})

}

transaction.getUnpostedTransactions = (startDate, endDate, callback) => {

		let fields =  `transactions.memberId, ROUND(SUM(transactions.totalPoints),2) AS unpostedPoints, ARRAY_AGG(member.points)[0] AS currentPoints, ROUND((SUM(transactions.totalPoints)+ARRAY_AGG(member.points)[0]),2) AS projectedPoints,`;
			fields += `ARRAY_AGG(member.lastName)[0] as lastName, ARRAY_AGG(member.firstName)[0] as firstName, `;
			fields += `CASE WHEN ARRAY_AGG(member.middleName)[0] != "" THEN  ', ' || ARRAY_AGG(member.middleName)[0] ELSE "" END AS middleName, `
			fields += `CASE WHEN ARRAY_AGG(member.suffix)[0] != "" THEN  ', ' || ARRAY_AGG(member.suffix)[0] ELSE "" END AS suffix,`;
			fields += `ARRAY_AGG(member.cardNumber)[0] AS cardNumber, `;
			fields += `ARRAY_AGG("<input type='checkbox' class='checkboxTransaction' memberId='" || member.id || "'>")[0] AS checkBox`;

		let alias =  `bucketName transactions`
			alias += ` JOIN bucketName member ON KEYS transactions.memberId`

		let conditions = `transactions.docType='TRANSACTION'`;
			conditions += ` AND transactions.posted=false`;
			conditions += ` AND transactions.transactionDate between '${startDate}' AND '${endDate}'`;
			conditions += ` GROUP BY transactions.memberId`;
			conditions += ` ORDER BY ARRAY_AGG(member.lastName)`;
		
		couchbaseModel.getJoinedDocumentByParameters(fields, alias, conditions, (err, res) => {

			if(err) throw err;
			callback(null, res)

		})

}

transaction.postTransaction = ({memberIdWithPoints, dateRange}, callback) => {

		let counter = 0

		const postTransactions = counter => {

				couchbaseModel.adhocQuery(`UPDATE bucketName SET posted=true WHERE docType='TRANSACTION' AND memberId='${memberIdWithPoints[counter].memberId}' AND posted=false AND transactionDate between '${dateRange.startDate}' AND '${dateRange.endDate}'`, (err, res) => {

					if(err) throw err;

					couchbaseModel.adhocQuery(`SELECT SUM(totalPoints) AS totalUnpostedRedeemedPoints FROM bucketName WHERE docType='TRANSACTION' AND transactionType='REDEEM' AND memberId='${memberIdWithPoints[counter].memberId}' AND posted=false`, (err, res) => {

						if(err) throw err;

						let updatedRedeemablePoints = 0;
						
						if(res.length > 0){
							if(res[0].totalUnpostedRedeemedPoints != null) updatedRedeemablePoints = parseFloat(memberIdWithPoints[counter].projectedPoints) + (res[0].totalUnpostedRedeemedPoints);
							else updatedRedeemablePoints = memberIdWithPoints[counter].projectedPoints;
						}							

						else updatedRedeemablePoints = memberIdWithPoints[counter].projectedPoints;



						couchbaseModel.update(memberIdWithPoints[counter].memberId, `points=${memberIdWithPoints[counter].projectedPoints}, redeemablePoints=${updatedRedeemablePoints}`, (err, res) => {

							if(err) throw err;

								counter++;

								if(counter < memberIdWithPoints.length) postTransactions(counter);

								else{

									couchbaseModel.update("lastPostDate", `lastPostDate='${moment().format('MMMM DD, YYYY')}'`, (err, res) => {

										if(err) throw err;

										callback(null, res);

									})

								}
						})

					})

				})

		}

		postTransactions(0);

}

transaction.getTotalEarnedData = ({fields, alias, conditions }, callback) => {
	couchbaseModel.getJoinedDocumentByParameters(fields, alias, conditions, (err, res) => {

		if(err) return callback(err, null);
		return callback(null, res);

	})

}

module.exports.transaction = transaction;
