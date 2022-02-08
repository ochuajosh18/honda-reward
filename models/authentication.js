const uuid = require('uuid')
    , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel
    , bcrypt = require('bcrypt')
    
function authentication(){}


authentication.authenticate = ({userName, password}, callback) => {

	userName = userName.toLowerCase();

	let fields = "id, LOWER(userName) userName, `password`, roleId";
	let conditions = `docType='USER'`;

	couchbaseModel.getDocumentByParameters(fields, conditions, async(err, res) => {
		if(err) throw err;
        
        let matchedAccount = [];
        // Get matched credentials
        for(let user of res) {
            const match = await bcrypt.compare(password, user.password);
            
            if(match && user.userName == userName) {
                matchedAccount.push(user);
            }
        }

		if(matchedAccount.length == 0){
			const matchedUserName = res.filter(user => {
				if(user.userName == userName) return user;
			})
			
			if(matchedUserName.length == 0) callback(null, {"error": "Invalid credentials"})
			else callback(null, {"error": "Incorrect password!"})
		}

		else callback(null, {"user" : matchedAccount[0], "error": null})

	});

}

module.exports.authentication = authentication;
