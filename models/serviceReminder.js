const host = process.env.HONDA_AMI_HOST;
const bucketName = process.env.HONDA_DB_BUCKET;

const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
    , moment = require('moment-timezone')
    , nodemailer = require('nodemailer')
    , fs = require('fs')
    , rimraf = require('rimraf')
    , cron = require('node-cron')
    , ncp = require('ncp').ncp
	, gmailApi = require("../models/gmailApi").gmailApi

function serviceReminder(){}


serviceReminder.createTemplate = (data, callback) => {

	const templateUuid = uuid.v4();

	data.docType 	 = "SR::TEMPLATE";
	data.id 	 	 = data.docType + "::" + templateUuid;
	data.dateCreated = moment().format('YYYY-MM-DD'); 
	data.dateUpdated = moment().format('YYYY-MM-DD');
	
	data.attachments = data.attachments.map(attachment => {
		return {
			"filename": `${attachment.filename}`,
			"path": `${host}images/Service Reminder Templates/${templateUuid}/${attachment.filename}`,
			"size": `${attachment.size}`
		}
	})

	couchbaseModel.save(data, (err, res) => {
		if(err) throw err;
		callback(null, templateUuid)
	})

}
 	
serviceReminder.createSchedule = (data, callback) => {

	const scheduleUuid = uuid.v4();

	data.docType 	 = "SCHEDULE";
	data.id 	 	 = data.docType + "::" + scheduleUuid;
	data.dateCreated = moment().format('YYYY-MM-DD'); 
	data.dateUpdated = moment().format('YYYY-MM-DD');
	data.sent		 = false;

	data.attachments = data.attachments.map(attachment => {
		return {"filename": `${attachment.filename}`, "path": `${host}images/Schedules/${scheduleUuid}/${attachment.filename}`}
	})

	couchbaseModel.save(data, (err, res) => {
		if(err) throw err;
		callback(null, scheduleUuid)
	})

}

serviceReminder.updateTemplate = (data, callback) => {

	const directory = data.id.split('::')[2];

	data.attachments = data.attachments.map(attachment => {
		return {
			"filename": `${attachment.filename}`,
			"path": `${host}images/Service Reminder Templates/${directory}/${attachment.filename}`,
			"size": `${attachment.size}`
		}
	})

	let processedAttachments = data.originalAttachments.filter(attachment => data.removedAttachment.includes(attachment.filename) == false ) 

	data.finalAttachments = data.attachments.concat(processedAttachments)


	let properties = `subject='${data.subject}', body='${data.body}', dateUpdated='${moment().format('YYYY-MM-DD')}', attachments = ${JSON.stringify(data.finalAttachments)}`

	couchbaseModel.update(data.id, properties, (err, res) => {

		if(err) throw err;

		let ctr = 0;

	  const folder = `/opt/honda-elite/public/images/Service Reminder Templates/${directory}`

	  const deleteAttachment = () => {
	    const path = `${folder}/${data.removedAttachment[ctr]}`;
	    rimraf(path, () => {
	        ctr++;
	        if(ctr < data.removedAttachment.length)
	        	deleteAttachment();
	        else
	        	callback(null, directory);
	    });
	  }
		
		if(data.removedAttachment.length > 0)
			deleteAttachment();
		else
			callback(null, directory);

	})

}

serviceReminder.delete = (id, callback) => {

	couchbaseModel.delete(id, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

serviceReminder.search = (substring, source, callback) => {

	let fields = (source=="external" ? `'<p class="promoTitle">' || title || '</p>' as title, setup, id` : `title`)

	couchbaseModel.getDocumentByParameters(fields, `docType='serviceReminder' AND LOWER(title) LIKE LOWER('\`%${substring}%\`')`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

const processEmailDetails = (details, callback) => {

	fs.readFile('./gmailApiCredentials.json', (err, content) => {

	  if (err) return console.log('Error loading client secret file:', err);
	  
	  gmailApi.authorize(JSON.parse(content), authentication => {

	  	gmailApi.sendEmail(authentication, details, sentItemData => {

	  		callback(sentItemData)

	  	})

	  });
	  
	});

}

serviceReminder.sendEmail = (details, callback) => {
	
	processEmailDetails(details, sentItemData => {
		callback(null, sentItemData)
	})

}

serviceReminder.scheduledEmail = () => {

	cron.schedule('* * * * *', () => {
		
		const currentTime = moment().tz('Asia/Manila').format("HH:mm");

		const currentDate = moment().tz('Asia/Manila').format('YYYY-MM-DD');
		
		let query = `
			SELECT subject, body, \`to\`, cc, attachments, id
			FROM ${bucketName}
			WHERE docType='SCHEDULE'
			AND scheduleDate='${currentDate}'
			AND scheduleTime='${currentTime}'
			AND sent=false`

		couchbaseModel.query(query, (err, res) => {
			
			if(err) throw err;

			if(res.length > 0){

				let ctr = 0;

				const sendReminder = () => {

					const emailDetails = {
						to: res[ctr].to,
						cc: res[ctr].cc,
						subject: res[ctr].subject,
						body: res[ctr].body,
						attachments: res[ctr].attachments
					}

					processEmailDetails(emailDetails, sentItemData => {
						
						let scheduleDirectory = res[ctr].id.split('::')[1];

						path = `/opt/honda-elite/public/images/Schedules/${scheduleDirectory}`

						rimraf(path, function () {
						    let query = `UPDATE ${bucketName} USE KEYS '${res[ctr].id}' SET sent=true`

							couchbaseModel.query(query, (updateErr, updateRes) => {
							 		if(updateErr) throw updateErr

							 		ctr++;

							 		if(ctr<res.length)
										sendReminder();
									
							})
						});

					})

				}

				sendReminder();

			}

		})
  
	})

};

serviceReminder.getSentItems = (sentItemIds, callback) => {

	let sentEmails = [], ctr=0, auth;

	const getEmailById = () => {

		gmailApi.getSentMessageById(auth, sentItemIds[ctr], sentEmail => {

			// console.log(`${ctr} => ${sentEmail.date}`);

			sentEmails.push(sentEmail)
			ctr++;		
			if(ctr < sentItemIds.length) getEmailById()
			else callback(null, sentEmails)
	  	
	  	}) 
	}

	// Authorization
	fs.readFile('./gmailApiCredentials.json', (err, content) => {
	  if (err) return console.log('Error loading client secret file:', err);
	  
	  gmailApi.authorize(JSON.parse(content), authentication => {

	  	auth = authentication;
  		getEmailById();

	  });
	});

}

serviceReminder.getSentItemsList = (searchSubject, callback) => {

	fs.readFile('./gmailApiCredentials.json', (err, content) => {
	  if (err) return console.log('Error loading client secret file:', err);
	  
	  gmailApi.authorize(JSON.parse(content), authentication => {

	  	auth = authentication;

	  	gmailApi.listSentMessages(searchSubject, auth, sentEmail_list => {
	  		callback(null, sentEmail_list);
	  	})

	  });
	});
	

}

serviceReminder.getSentItemAttachment = (messageId, attachmentId, callback) => {

	fs.readFile('./gmailApiCredentials.json', (err, content) => {
	  if (err) return console.log('Error loading client secret file:', err);
	  
	  gmailApi.authorize(JSON.parse(content), authentication => {

	  	gmailApi.getAttachment(authentication, messageId, attachmentId, attachment => {

	  		callback(null, attachment)

	  	})

	  });
	});

}

module.exports.serviceReminder = serviceReminder;