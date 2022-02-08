$(document).ready(function(){

	const viewOnly = () => {

		$('#btn_addUser').hide();
		$('#btn_saveUser').hide();
		$('#btn_deleteUser').hide();
		$('.field').attr('disabled', 'disabled');
		$('input[type="checkbox"]').attr('disabled', 'disabled');

	}

	//Restriction
	let moduleRestriction;

	getModuleRestriction(restriction => {
		
		moduleRestriction = restriction;
		if(moduleRestriction!=2) viewOnly();

	});


	let action="add";
	let userId;
	let userNameOnEdit;
	let roleOnEdit="";
	let userRoleIdOnEdit = "";

	// Operations
	const uniqueUserName = (userName, callback) => {

		let parameters = { "fields": `RAW userName`, "conditions": ` AND LOWER(userName)='${userName.toLowerCase()}'` }

		post("/user/get", parameters, (err, result) => {
			if(result) callback(result.length == 0);
		})

	}

	const createUser = user => {
		
		loader("Saving user", "Please wait..");

		setTimeout(() => {

			uniqueUserName(user.userName, unique => {

					closeLoader();

					if(unique == true){

							post("/user/create", user, (err, result) => {
								if(result){
									confirm("Success", "User created!", {"Ok": () => loadUserTable() });
								}
							})

					}

					else confirm("Warning", "Username is already taken!", {"Ok": () => {} });

			})

		}, 400);

	}

	const getUserData = (userName, callback) => {

		get(`/user/getDataAndPermission/ AND userName='${userName}'`, (err, result) => {
			if(result) callback(result);
		})

	}

	const updateUser = (id, data) => {
		
		loader("Updating user", "Please wait..");

		setTimeout(() => {

				uniqueUserName(data.userName, unique => {

						closeLoader();
						
						if(unique == true || data.userName.toLowerCase() == userNameOnEdit.toLowerCase()){

								data.id = id;

								post("/user/update", data, (err, result) => {
									if(result){
										confirm("Success", "User updated!", {"Ok": () => {
											userNameOnEdit = data.userName;
											userRoleIdOnEdit = data.roleId;
											loadUserTable() 
										} });
									}
								})
						}

						else confirm("Warning", "Username is already taken!", {"Ok": () => {} });
				})

		}, 400);

	}

	const deleteUser = userName => {

		get("/user/delete/"+userName, (err, result) => {
			if(result){
				confirm("Success", "User deleted!", {"Ok": () => loadUserTable() });
				$('#divPassword').attr('class','col-md-6');
				$('#divRePassword').fadeIn();

				clearForm();
				$('#btn_deleteUser').fadeOut();
				action = 'add';
			}
			
		})

	}

	const getPermission = (role, action) => {

		get(`/user/getPermission/${role}`, (err, permission) => {	
			if(permission){
				clearPermission();
				plotPermission(permission, action);
			}
		})

	}

	const loadRoles = (selectId, callback) => {
		
		get(`/user/getRoles/bucketName.*`, (err, roles) => {	
			if(roles){
				
				$(`#${selectId}`).empty();
				$(`#${selectId}`).append(`<option value="placeHolder" selected disabled> - Select - </option>`);
				roles.forEach(role => $(`#${selectId}`).append(`<option value="${role.id}">${role.name}</option>`) );

				callback();

			}
		})

	}
	
	const checkDuplicateRole = (action, callback) => {

		get(`/user/getRoles/RAW LOWER(name)`, (err, roles) => {	
			if(roles){
				let duplicate;
				let roleName = $('#roleName').val().toLowerCase();
		
				if(action == 'update') duplicate = (roleName == roleOnEdit ? false : roles.includes(roleName))
				else duplicate = roles.includes(roleName);

				callback(duplicate);
			}
		})

	}

	const createRole = role => {

		loader("Creating role", "Please wait..");

		setTimeout(() => {
			
			closeLoader();

			checkDuplicateRole('create', duplicate => {

				if(duplicate == false){

					post("/user/createRole", role, (err, result) => {
						
						if(result){
							confirm("Success", "Role created!", {"Ok": () => {
								clearPermission();
								$('#roleName').val('');
							}});
						}

					});

				}

				else confirm("Warning", "Role name is already taken!", {"Ok": () => {} });

			})

		}, 400)

	}

	const updateRole = role => {

		loader("Updating role", "Please wait..");

		setTimeout(() => {
			
			closeLoader();

			checkDuplicateRole('update', duplicate => {

				if(duplicate == false){

					post("/user/updateRole", role, (err, result) => {
						
						if(result){
							confirm("Success", "Role updated!", {"Ok": () => {
								loadRoles('roles_roleManagement', () => {} );
								clearPermission();
								$('#roleName').val('');
							}});
						}

					});

				}

				else confirm("Warning", "Role name is already taken!", {"Ok": () => {} });

			})

		}, 400)

	}

	// Form management
	const loadUserTable = () => {

		let parameters = { "fields": "userName, name", "conditions": ""}

		loader("Loading user list", "Please wait..");

		post("/user/get", parameters, (err, result) => {
			if(result) setTimeout(() => initializeDataTable('#tblUser', result, ["userName", "name"]), 400);
		})

	}	

	const searchUser = substring => {

		get("/user/search/"+substring, (err, result) => {
			if(result) initializeDataTable('#tblUser', result, ["userName", "name"]) 
		})

	}

	const plotPermission = (permission, action) => {

	    const permissions = ["membership", "transactionEncoding", "rewardInquiry", "redeemPoints", "cardPrinting", "reports", "user", "setup", "cardActivation", "transactionPosting", "services", "serviceReminder"];

	    permissions.forEach(module => {

	    	let restriction = permission[module];

	    	module = (action == 'view' ? `view_${module}` : module);

	    	$("input[name='"+module+"']").each(function(){

	    		let permissionType = $(this).attr('permission');

	    		if(restriction == 2 || (permissionType=="view" && restriction==1)) $(this).prop("checked", true);

		    })

	    });

	}

	const processPermission = () => {

	    let permissions = {
	    		"membership": 0,
	    		"transactionEncoding": 0,
	    		"rewardInquiry": 0,
	    		"redeemPoints": 0,
	    		"cardPrinting": 0,
	    		"reports": 0,
	    		"user": 0,
	    		"setup": 0,
	    		"cardActivation": 0,
	    		"transactionPosting": 0,
	    		"services": 0,
	    		"serviceReminder": 0
	    	};

	    Object.keys(permissions).forEach(module => {

	    	let permission = 0;

	    	$("input[name='"+module+"']").each(function(){

	    		let permissionType = $(this).attr('permission');
	    		let restriction = $(this).is(':checked');

		    	permission = (permissionType == 'view' && restriction == true ? 1 : permissionType == 'edit' && restriction == true ? 2 : permission);

		    	if(permissionType=="edit") permissions[module] = permission;

		    })

	    });

	    return permissions;

	}

	const gatherFormData = () => {

		let user = {};

		user.userName 	= $('#userName').val();
		user.password 	= $('#password').val();
		user.email 	= $('#email').val();
		user.name 	  	= $('#name').val();
		user.roleId		= $('#roles_userDetails').val();

		return user;

	}

	const validUser = () => {
		
		const upperCase = new RegExp('[A-Z]');
		const lowerCase = new RegExp('[a-z]');
		const numbers = new RegExp('[0-9]');

		if($('#userName').val().length < 6){
			confirm("Warning", "Username must be at least 6 characters.", {"Ok": () => {} });
			return false;
		}

		else if($('#password').val().length < 8 || $('#password').val().length > 36){
            if(action == 'add') {
                confirm("Warning", "Password must be 8-36 characters.", {"Ok": () => {} });
			    return false;
            }
			else {
                if($('#password').val().length != 0) {
                    confirm("Warning", "Password must be 8-36 characters.", {"Ok": () => {} });
			        return false;
                }
            }
		}
		
		if($('#password').val().match(upperCase) == null || $('#password').val().match(lowerCase) == null ||  $('#password').val().match(numbers) == null){
            if(action == 'add') {
                confirm("Warning", "Password must contain upper case, lower case and number.", {"Ok": () => {} });
			    return false;
            }
			else {
                if($('#password').val().length != 0) {
                    confirm("Warning", "Password must contain upper case, lower case and number.", {"Ok": () => {} });
			    return false;
                }
            }
        }
        
        let name_split = $('#name').val().split(' ');
        
        for(let name of name_split) {
            if(name.length > 1 && $('#password').val().toLowerCase().includes(name.toLowerCase())) {
                confirm("Warning", "Name must not be used in password.", {"Ok": () => {} });
			    return false;
            }
        }

		const isValidEmail = validEmailFormat($('#email').val());

		if(!isValidEmail) {
			confirm("Warning", "Invalid email address format", {"Ok": () => {} });
			return false;
		}

		else if(action == "add" && $('#password').val() != $('#retypePassword').val()){
				confirm("Warning", "Passwords did not match.", {"Ok": () => {} });
				return false;
		}

		else if($('#name').val().length == 0){
			confirm("Warning", "Please enter name.", {"Ok": () => {} });
			return false;
		}

		else if($('#roles_userDetails').val() == "placeHolder" || $('#roles_userDetails').val() == null){
			confirm("Warning", "Please select role.", {"Ok": () => {} });
			return false;
		}

		else return true;

	}
	
	const clearForm = () => {

		$('#userName').val('');
		$('#password').val('');
		$('#retypePassword').val('');
		$('#name').val('');
		$('#email').val('');
		$('#roles_userDetails').val('placeHolder');
		
		clearPermission();

	}

	const clearPermission = () => {

		$('input[type="checkbox"]').each(function(){
			$(this).prop("checked", false);
		});

	}

	//On load function
	loadUserTable();
    $('#tblPermission :input').attr('disabled', true);
    loadRoles('roles_userDetails', () => {} );

	// On clicks
	$('#tblUser').on('click', 'tr', function(){

		const userName = $(this).children(0)[0].innerHTML;

		if(userName != "Username"){

			$('#div_roleManagement').hide();
			$('#div_userDetails').fadeIn();

			$('tr').removeClass('selectedRow');
		  	$(this).addClass('selectedRow');

		  	$('#divPassword').attr('class','col-md-12');
		  	$('#divRePassword').hide();

	      	if(moduleRestriction==2) $('#btn_deleteUser').fadeIn();

	      	loader("Loading user information", "Please wait..");

	      	setTimeout(() => {

	      	getUserData(userName, (user) => {

		      	clearForm();

		      	userId = user.id;
		      	userNameOnEdit = user.userName;
		      	userRoleIdOnEdit = user.roleId;

		      	$('#userName').val(user.userName);
		      	$('#name').val(user.name);
		      	$('#email').val(user.email);
		      	$('#roles_userDetails').val(user.roleId);

		      	plotPermission(user.permission, 'view');

		      	closeLoader();

		      });

	      	}, 400)
	      

	      	action='edit';

		}

  	});

	$('#btn_addUser').on('click', function(){

		$('#divPassword').attr('class','col-md-6');
		$('#divRePassword').fadeIn();
		$('#roles_userDetails').val('placeHolder');

		clearForm();
		$('#btn_deleteUser').fadeOut();
		action = 'add';

	})

	$('#btn_saveUser').click(() => {
		
	  	if(validUser()){
	  		
	  		if(action=='add') createUser(gatherFormData());
	  		else {
                const userData = gatherFormData();

                if(userData.password.length == 0) {
                    delete userData['password']
                }

                updateUser(userId, userData)
            }
	  	}

	});	

	$('#btn_deleteUser').click(() => {

		let yes = () => deleteUser($('#userName').val());
		let no = () => {};

		confirm("Confirmation", "Are you sure you want to delete user?", {"Yes":yes, "No":no});

	})

	$('#btn_manageRoles').click(() => {

		$('#roleName').val('');
		clearPermission();
		
		$('#div_userDetails').hide();
		$('#div_roleManagement').fadeIn();
		loadRoles('roles_roleManagement', () => {} );

	});

	$('#btn_backToUserDetails').click(() => {

		$('#div_roleManagement').hide();
		$('#div_userDetails').fadeIn();

		loadRoles('roles_userDetails', () => {
			if(action == 'edit') $('#roles_userDetails').val(userRoleIdOnEdit);
		});
		
	})

	$('#btn_addRole').click(() => {

		$('#roleName').val('');
		clearPermission();

		$('#btn_backToUserDetails').hide();
		$('#btn_addRole').hide();
		$('#btn_updateRole').hide();
		$('#div_roleManagementSelect').hide();

		$('#btn_backToRoleManagement').fadeIn();
		$('#btn_saveRole').fadeIn();

	})
	
	$('#btn_saveRole').click(() => {

		if($('#roleName').val() == '') confirm("Warning", "Please select role.", {"Ok": () => {} });
		else createRole({'name': $('#roleName').val(), 'permission': processPermission()});

	});

	$('#btn_updateRole').click(() => {

		let role = {};
			role.permission = processPermission();
			role.name = $('#roleName').val();
			role.id = $('#roles_roleManagement option:selected').val();

		if($('#roles_roleManagement option:selected').val() != 'placeHolder') updateRole(role);
		else confirm("Warning", "Please select role.", {"Ok": () => {} });

	})

	$('#btn_backToRoleManagement').click(() => {

		loadRoles('roles_roleManagement', () => {} );

		$('#roleName').val('');

		$('#btn_saveRole').hide();
		$('#btn_backToRoleManagement').hide();

		$('#div_roleManagementSelect').fadeIn();
		$('#btn_backToUserDetails').fadeIn();
		$('#btn_addRole').fadeIn();
		$('#btn_updateRole').fadeIn();

	});


	// Change
	$('#roles_userDetails').change(function(){
		getPermission($(this).val(), 'view');
	});

	$('#roles_roleManagement').change(function(){

		getPermission($(this).val(), 'update');
		$('#roleName').val($('option:selected', this).text());
		roleOnEdit = $('option:selected', this).text().toLowerCase();

	});

	$('input[type="checkbox"]').change(function(){

		let module 			= $(this).attr('name');
		let permissionType  = $(this).attr('permission');
		let checked 		= $(this).is(':checked')

		// Props both permission if edit permission is checked
		if(permissionType=="edit" && checked) $("input[name='"+module+"']").prop('checked', true);

		// Remove check to edit if view is unchecked (while both permissions are checked)
		else if(permissionType=="view" && $("input[name='"+module+"']").filter("input[permission='edit']").is(':checked') == true) $("input[name='"+module+"']").prop('checked', false);

	});

  // Search
	$('#searchUser').on('keyup', function(){

		if($(this).val().length > 0) searchUser($(this).val());
		if($(this).val().length==0) loadUserTable();

	})

	// Inputs accept number and letter only
	$('#userName').on('keyup', function(){
		// $(this).val($(this).val().replace(/[^a-zA-Z0-9]/g, ""));
		$(this).val($(this).val().replace("  ", " "));
	})

})