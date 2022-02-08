const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
    , moment = require('moment')
    , nodemailer = require('nodemailer')
    , bcrypt = require('bcrypt')

const bucketName = process.env.HONDA_DB_BUCKET;

function user(){}


user.create = async(data, callback) => {

	data.docType 	= "USER";
	data.id 	 	= data.docType + "::" + uuid.v4();
	data.dateCreated = moment().format('YYYY-MM-DD'); 
	data.dateUpdated = moment().format('YYYY-MM-DD');
    data.password = await bcrypt.hash(data.password, 10)
    
	couchbaseModel.save(data, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

user.get = ({fields, conditions }, callback) => {

	conditions = "docType='USER' " + conditions;

	couchbaseModel.getDocumentByParameters(fields, conditions, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}
 
user.search = (substring, callback) => {

	couchbaseModel.getDocumentByParameters("name, userName", `docType='USER' AND (LOWER(name) LIKE LOWER('%${substring}%') OR LOWER(userName) LIKE LOWER('%${substring}%'))`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

user.getPermission = (roleId, callback) => {

	couchbaseModel.getById(roleId, (err, role) => {

		if(err) return callback(err, null) ;
		
		callback(null, role.permission);

	})

}

user.getDataAndPermission = (conditions, callback) => {

	conditions = "docType='USER' " + conditions;

	couchbaseModel.getDocumentByParameters('bucketName.*', conditions, (err, user) => {

		if(err) throw err;

		if(user.length > 0){

			couchbaseModel.getById(user[0].roleId, (err, role) => {

				if(err) throw err;

				user[0].permission = role.permission
				
				callback(null, user[0]);

			})

		}
		

	})

}

user.update = async(data, callback) => {

	let properties = `dateUpdated="${moment().format('YYYY-MM-DD')}", `;

    if(data.password) {
        data.password = await bcrypt.hash(data.password, 10)
    }
    
	// Move permission property to role document
	const roleData = data.permission;

	Object.keys(data).forEach((property, index) => {

		if(property != 'id'){

			if(property == 'password') properties += `\`${property}\`='${data[property]}'`
			else properties += `${property}='${data[property]}'`

			if(index<Object.keys(data).length-2) properties += ', ';

		}

	});

	couchbaseModel.update(data.id, properties, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

user.getRoles = (fields, callback) => {

	conditions = "docType='ROLE' ORDER BY name";

	couchbaseModel.getDocumentByParameters(fields, conditions, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

user.createRole = (data, callback) => {

	data.docType 	= "ROLE";
	data.id 	 	= data.docType + "::" + uuid.v4();
	data.dateCreated = moment().format('YYYY-MM-DD'); 
	data.dateUpdated = moment().format('YYYY-MM-DD');

	couchbaseModel.save(data, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

user.updateRole = (data, callback) => {

	couchbaseModel.update(data.id, `permission=${JSON.stringify(data.permission)}, name='${data.name}', dateUpdated='${moment().format('YYYY-MM-DD')}'`, (err, res) => {

		if(err) throw err;
		callback(null, res)

	})

}

user.delete = (userName, callback) => {

	couchbaseModel.getDocumentByParameters("id", "docType='USER' AND userName='"+ userName +"'", (err, res) => {

		if(err) throw err;
		
		if(res.length > 0){

			couchbaseModel.delete(res[0].id, (err, res) => {

				if(err) throw err;
				callback(null, res)

			})

		}
		

	})

}

user.forgotPassword = async({userName, email}, callback) => {
	
	const temporaryPassword = await bcrypt.hash(uuid.v4(), 10);
    
	const transporter = nodemailer.createTransport({
	 service: 'gmail',
	 auth: {
	        user: 'hcbt.elite@gmail.com',
	        pass: 'Honda_123'
	    }
	});

	const mailOptions = {
	  from: 'hcbt.elite@gmail.com',
	  to: email,
	  subject: 'HONDA ELITE',
	  html: `<p>Hi <b>${userName}</b>,</p><p>Your temporary password is <b>${temporaryPassword}</b> </p>`
	};

	const query = `UPDATE ${bucketName} 
	SET \`password\` = '${temporaryPassword}'
	WHERE docType='USER' AND LOWER(userName)=LOWER('${userName}')`

	couchbaseModel.query(query, (err, res) => {

		if(err) return callback(err, null);

		transporter.sendMail(mailOptions, function (emailError, info) {
		   if(emailError) throw emailError;
		   callback(null, info)
		});

	})
    
}

user.hashPassword = (callback) => {

    let fields = "id, `password`";
    let conditions = `docType='USER' AND LENGTH(\`password\`) < 50`;

    couchbaseModel.getDocumentByParameters(fields, conditions, async(err, res) => {
        if(err) throw err;

        try {
        	console.log(res.length)
            // for(let user of res) {
            //     let password = await bcrypt.hash(user.password, 10);
            //     let result = await couchbaseModel.executeQuery(`
            //         UPDATE honda
            //         USE KEYS "${user.id}"
            //         SET \`password\`="${password}"
            //         RETURNING RAW id
            //     `);
            // }

            callback(null, "Done")
        }
        catch(e) {
            console.log(e)
        }

    })

}

module.exports.user = user;
