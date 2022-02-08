$(document).ready(function() {

	const userId = localStorage.getItem('userId');

	let currentPassword, fullName;

	const loadUser = () => {

		let query = `SELECT userName, \`password\`, name FROM bucketName USE KEYS '${userId}'`

        loader('Loading user', 'Please wait..');

        setTimeout(() => {

        	post("/generic/query", {'query': query}, (err, result) => {
	            closeLoader();
	            $('#userName').text(result[0].userName)
	            currentPassword = result[0].password;
	            fullName = result[0].name;
	        }); 

        }, 300)

	}

	const validPassword = async() => {

		const upperCase = new RegExp('[A-Z]');
		const lowerCase = new RegExp('[a-z]');
		const numbers = new RegExp('[0-9]');

		if($('#oldPassword').val() == ''){
			confirm("Warning", "Old password cannot be empty.", {"Ok": () => {} });
			return false;
		}

		if($('#password').val().length < 8 || $('#password').val().length > 36){
			confirm("Warning", "New password must be 8-36 characters..", {"Ok": () => {} });
			return false;
		}

		let name_split = fullName.split(' ');

        for(let name of name_split) {
            if(name.length > 1 && $('#password').val().toLowerCase().includes(name.toLowerCase())) {
                confirm("Warning", "Name must not be used in password.", {"Ok": () => {} });
			    return false;
            }
        }
		
		if($('#password').val().match(upperCase) == null || $('#password').val().match(lowerCase) == null ||  $('#password').val().match(numbers) == null){
			confirm("Warning", "New password must contain upper case, lower case and number.", {"Ok": () => {} });
			return false;
		}

		else if($('#password').val() != $('#retypePassword').val()){
				confirm("Warning", "New passwords did not match.", {"Ok": () => {} });
				return false;
		}

		else return true;

	}

	const updatePassword = () => {

		const data = {
			"password": $('#password').val(),
			"id": userId
		};

        loader('Updating password', 'Please wait..');

        setTimeout(() => {

        	post("/user/comparePassword", { "oldPassword": $('#oldPassword').val(), "password": currentPassword }, (err, result) => {
        		if(result == true) {
        			post("/user/update", data, (err, result) => {
						if(result){
							closeLoader();
				            currentPassword = password;
				            confirm("Success", "Password successfully updated.", {"Ok": () => {
				            	window.location.href="/changePassword"
				            } });
						}
					})
        		}
        		else {
        			closeLoader();
		            confirm("Warning", "Incorrect old password.", {"Ok": () => {} });
        		}
        	});


        }, 300)

	}


	loadUser();

	$('#btn_save').click(async() => {
		if(await validPassword()) {
			updatePassword();
		}
	})

});