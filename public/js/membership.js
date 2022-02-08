$(document).ready(function(){
    const state = {};

	const viewOnly = () => {

		$('#btn_add_external').hide();
		$('#btn_add').hide();
		$('#btn_save').hide();
		$('.field').attr('disabled', 'disabled');
		$('.service').attr('disabled', 'disabled');
		$('#btn_checkAllServices, #btn_uncheckAllServices').hide();

	}
	//Restriction
	let moduleRestriction;

	getModuleRestriction(restriction => {
		
		moduleRestriction = restriction;
		if(moduleRestriction!=2) viewOnly();

        loadMemberTable();
	});


	let action = 'edit';
	let memberId;
	let backAction="table";

	let memberOnEdit = {};

	membershipDate.max = getCurrentDate();
	birthdate.max = getCurrentDate();

	// View Controller
	const viewController = action => {

		if(action == "showForm"){
			loadProvinces('province');
			$('#cardNumber').prop('disabled', true);
			$('#btn_save').prop('disabled', true);
			$('#divMain').hide();
			$('#divForm').fadeIn();
		}

		else if(action == "showTable"){
			$('#divForm').hide();
			$('#divMain').fadeIn();
		}

	}


	// Member Table
	const loadMemberTable = () => {

        let parameters = {};
        
		const deleteButton = (moduleRestriction==2 ? `<img id="' || id || '" class="delete icon deleteIcon" style="float: right" src="../images/icons/delete.png">` : '');

		parameters.fields =  `'<p class="cardNumberRow" value="' || id ||'">' || cardNumber || '</p>' as cardNumber, `;
		parameters.fields += `lastName, firstName, `;
		parameters.fields += `CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, `;
		parameters.fields += `CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix, `;
		parameters.fields += `membershipDate, `;
		parameters.fields += `membershipThru,`;
		parameters.fields += `CASE WHEN status == 'active' then '<i class=\"fa fa-circle\" style=\"color: green; margin-left: 20px;	\"></i> ${deleteButton}' ELSE '<i class=\"fa fa-circle-thin\" style=\"margin-left: 20px;\"></i> ${deleteButton}' END AS status`
		
		parameters.conditions = `ORDER BY name`;
		
		loader("Loading member list", "Please wait..");

		post("/membership/get", parameters, (err, result) => {
			if(result){
				result.forEach(member => member.name = `${member.lastName}, ${member.firstName}${member.middleName}${member.suffix}`)
				setTimeout(() => {
                    state.memberTable = $('#tblMember').DataTable({
                        destroy: true,
                        data: result,
                        // scrollX: true,
                        scrollY: 300,
                        scrollCollapse: true,
                        autoWidth: false,
                        pageLength: 100,
                        dom: 'rtp',
            
                        columns: [
                            //
                            { data: 'cardNumber' },
                            { data: 'name' },
                            { data: 'membershipDate' },
                            { data: 'membershipThru' },
                            { data: 'status' },
                        ],

                        rowCallback: (row, data, iDataIndex) => {
                            $(row).on('click', function() {
                                $('.selectedRow').removeClass('selectedRow');
                                $(row).addClass('selectedRow');
                                var doc = new DOMParser().parseFromString(data.cardNumber, "text/xml");

                                memberId = $(doc).find("p:first").attr('value');
                                
                                viewController("showForm");
                                $('#div_cardNumber').show();
                                clearMembershipForm();

                                action = 'edit';
                                backAction = "table";

                                $('#btn_save').prop('disabled', false);

                                get(`/membership/getById/${memberId}`, (err, result) => {
                                    if(result) fillMemberFormData(result);
                                })
                            })
                        }
                    });
                    closeLoader();
				}, 1000)
			}
		})

	}




	// Form management
	const validMemberForm = () => {

		// Using functions from js -> utils -> formManager.js

		let validMemberForm = true;

		// Check if all required fields are filled
		const allFieldsAreaFilled = requiredFieldsAreFilled();

		if(allFieldsAreaFilled != true){
			validMemberForm = false;
			confirm("Warning", `${allFieldsAreaFilled} cannot be empty`, {"Ok": () => {} });
			return false;
		}

		// Validate Email Address Format
		const isValidEmail = validEmailFormat($('#email').val());
		if(!isValidEmail) {
			validMemberForm = false;
			confirm("Warning", "Invalid email address format", {"Ok": () => {} });
		}

		return validMemberForm;

	}

	const gatherMemberFormData = () => {
		
		// Using functions from js -> utils -> formManager.js

		let member = gatherFormData('field');

		member.lastName = member.lastName.trim().replace( /  +/g, ' ' ).replace(/[^a-zA-Z-. ]/g, "");
		member.firstName = member.firstName.trim().replace( /  +/g, ' ' ).replace(/[^a-zA-Z-. ]/g, "");
		member.middleName = member.middleName.trim().replace( /  +/g, ' ' ).replace(/[^a-zA-Z-. ]/g, "");
		member.suffix = member.suffix.trim().replace( /  +/g, ' ' ).replace(/[^a-zA-Z-. ]/g, "");

		let dateOfMembership = new Date(member.membershipDate);

	  	member.validThru = new Date(dateOfMembership.setMonth(dateOfMembership.getMonth()+24)).toISOString().substring(0, 10);

	  	let registrationNumber = []; 

	  	let uniqueRegistrationNumbers = [];

	  	$('.registrationNumber').each(function(index){

	  		let rNumber = $(this).val().replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase();

	  		$(this).val(rNumber);

	  		if(rNumber != ""){
	  			if(uniqueRegistrationNumbers.indexOf(rNumber) < 0)
		  			uniqueRegistrationNumbers.push(rNumber);
		  		else{
					$(this).val('');
					member.failed = true;  			
		  		}
	  		}

	  	})


	  	$('.registrationNumberInput').each(function(){

	  		let csNumber = $(this).find('.csNumber').val();
	  		let plateNumber = $(this).find('.plateNumber').val();

	  		if(csNumber.trim() != "" || plateNumber.trim() != ""){

	  			csNumber = csNumber.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase();
	  			plateNumber = plateNumber.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase();
	  			csNumber = csNumber.replace("  ", " ");
				plateNumber = plateNumber.replace("  ", " ");

				// CLean the value in the input text
				$(this).find('.csNumber').val(csNumber);
	  			$(this).find('.plateNumber').val(plateNumber);

				registrationNumber.push({ 'csNumber': csNumber, 'plateNumber': plateNumber });
			}

		})



	  	member.registrationNumber = registrationNumber;


		return member;

	}

	const fillMemberFormData = member => {

		// For checking duplicate purpose
		memberOnEdit.name = `${member.lastName}, ${member.firstName}, ${member.middleName}, ${member.suffix}`;
		memberOnEdit.birthdate = member.birthdate;

		$('#cardNumber').text(member.cardNumber);

		Object.keys(member).forEach(property => {
			if(!['city', 'services', 'registrationNumber'].includes(property))
				$(`#${property}`).val(member[property])
		});

		// Fill Services
		$('.service').each(function(){
			if(member.services.includes($(this).next().text())) $(this).prop('checked', true);
		})

		// Fill Registration number
		if(member.registrationNumber.length > 0){

			$('.csNumber').val(member.registrationNumber[0].csNumber);
			$('.plateNumber').val(member.registrationNumber[0].plateNumber);

			if(member.registrationNumber.length > 1){
				member.registrationNumber.forEach((registrationNumber, index) => {
					if(index != 0)
						generateRegistrationNumberInput([registrationNumber.csNumber, registrationNumber.plateNumber]);
				})
			}

		}

	}

	const clearMembershipForm = () => {

		clearForm('field');

		// Selects
		loadProvinces();

		$('select').each(function(){ $(this).prop("selectedIndex", 0); })

		$('.csNumber, .plateNumber').val('');
		$('.additionalRegistrationNumberInput').remove();

	}

	const checkDuplicateMember = (name, birthdate, callback) => {

		loader("Checking for duplicates", "Please wait..");

		setTimeout(() => {

			post("/membership/get", {fields: `LOWER(lastName || ', ' || firstName || ', ' || middleName || ', ' || suffix) as name, birthdate`, conditions: ""}, (err, members) => {
				if(members){

					let duplicate = false;

					members.forEach((member, index) => {

						if(member.name == name.toLowerCase() && member.birthdate == birthdate){
							if(action == "edit" && memberOnEdit.name.toLowerCase() != name.toLowerCase() || memberOnEdit.birthdate != birthdate) duplicate = true;
							else if(action == "save") duplicate = true;
						}

					})

					if(jconfirm.instances[0]) jconfirm.instances[0].close();

					callback(duplicate);

				}
			})

		}, 1000)
		

	}


	// Operations
	const createMember = member => {

		checkDuplicateMember(`${member.lastName}, ${member.firstName}, ${member.middleName}, ${member.suffix}`, $('#birthdate').val(), duplicate => {
			
  			if(duplicate) confirm("Warning", "Member already exists!", {"Ok": () =>  clearForm('uniqueField') });

  			else{
  				
  				member.createdBy = localStorage.getItem('userId');

  				loader("Saving member", "Please wait..");

				post("/membership/create", member, (err, result) => {
					if(jconfirm.instances[0]) jconfirm.instances[0].close();
					if(result){
						setTimeout(() => confirm("Success", "Member added!", {"Ok": () => clearMembershipForm() }), 1000)
					}
				})

  			}

  		})

	}
	
	const updateMember = (id, member) => {
		
		checkDuplicateMember(`${$('#lastName').val()}, ${$('#firstName').val()}, ${$('#middleName').val()}, ${$('#suffix').val()}`, $('#birthdate').val(), duplicate => {
			
  			if(duplicate==true) confirm("Warning", "Member already exists!", {"Ok": () =>  clearForm('uniqueField') });

  			else{

  				member.id = id;

				loader("Updating member", "Please wait..");

				setTimeout(() => {
					post("/membership/update", member, (err, result) => {
						memberOnEdit.name = `${member.lastName}, ${member.firstName}, ${member.middleName}, ${member.suffix}`
						memberOnEdit.birthdate = member.birthdate;
						if(jconfirm.instances[0]) jconfirm.instances[0].close();
						if(result) setTimeout(() => confirm("Success", "Member updated!", {"Ok": () => {} }), 400)
						
					})

				}, 1000)
				

  			}

  		})

	}

	const searchMember = (substring, type) => {

		let fields;
		if(type == "list"){
			fields =  "cardNumber, lastName, firstName, id, ";
			fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
			fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix";
		}
		else fields = "table";

		const editPermission = (moduleRestriction == 2 ? true : false);

		get(`/membership/searchByNameAndCardNumber/${substring}/${fields}/none/${editPermission}`, (err, result) => {
			if(result){
                result.forEach(member => member.name = `${member.lastName}, ${member.firstName}${member.middleName}${member.suffix}`)
				
				setTimeout(() => {
					if(type == "list"){
						$('#searchList').empty();

						if(result.length > 0) result.forEach(member => $('#searchList').append(`<li class='searchItem' value='${member.id}'>${member.name} (${member.cardNumber})</li>`));

						else $('#searchList').append('<li>No result found.</li>')

						$('#searchList').show();
					}

					else{
						$('#tblMember').DataTable({
                destroy: true,
                data: result,
                // scrollX: true,
                scrollY: 300,
                scrollCollapse: true,
                autoWidth: false,
                pageLength: 100,
                dom: 'rtp',
    
                columns: [
                    //
                    { data: 'cardNumber' },
                    { data: 'name' },
                    { data: 'membershipDate' },
                    { data: 'membershipThru' },
                    { data: 'status' },
                ],

                rowCallback: (row, data, iDataIndex) => {
                    $(row).on('click', function() {
                        $('.selectedRow').removeClass('selectedRow');
                        $(row).addClass('selectedRow');

                        let doc = new DOMParser().parseFromString(data.cardNumber, "text/xml");

                        memberId = $(doc).find("p:first").attr('value');
							viewController("showForm");
							$('#div_cardNumber').show();
							clearMembershipForm();

							action = 'edit';
							backAction = "table";

							$('#btn_save').prop('disabled', false);

							get(`/membership/getById/${memberId}`, (err, result) => {
								if(result) fillMemberFormData(result);
							})
                    })
                }
            });
						closeLoader();
					}
					
				}, 400);

			}
		})

	}

	const deleteMember = id => {

		loader("Deleting member", "Please wait..");

		setTimeout(() => {

			get(`/membership/delete/${id}`, (err, result) => {
				if(jconfirm.instances[0]) jconfirm.instances[0].close();
				if(result) setTimeout(() => confirm("Success", "Member deleted.", {"Ok": () =>  loadMemberTable() }), 1000)
			})

		}, 1000)
		

	}

	const generateRegistrationNumberInput = registrationNumbers => {

		const registrationNumberInput = `<div class="form-row col-md-12 registrationNumberInput additionalRegistrationNumberInput">
								        <div class="form-group loginTextBoxHolder col-md-6"> <span class="loginLabelHolder">CS Number</span>
								            <input type="text" class="large-textbox form-control registrationNumber csNumber" value="${registrationNumbers[0]}" placeholder="CS Number">
								        </div>
								        <div class="form-group loginTextBoxHolder col-md-5"> <span class="loginLabelHolder">Plate Number</span>
								            <input type="text" class="large-textbox form-control registrationNumber plateNumber" value="${registrationNumbers[1]}" placeholder="Plate Numer">
								        </div>
								        <div class="form-group loginTextBoxHolder col-md-1" style="display: flex; align-items: center; justify-content: center;">
								            <button type="button" class="deleteUnitNumber btn btn-danger btn-lg float-right"><i class="fa fa-minus"></i></button>
								        </div>
								    </div>`
		

		$('#div_registrationNumber').append(registrationNumberInput);

	}

	const checkEmptyRegistrationNumber = callback => {

		let error = null;

		if($('.registrationNumberInput').length == 3)
			error = "exceeded";

		if(error == null){
			$('.registrationNumberInput').each(function(){
		  		if($(this).find('.csNumber').val().trim() == "" && $(this).find('.plateNumber').val().trim() == "")
					error = "emptyRegistrationRow";
				$(this).find('.csNumber').val($(this).find('.csNumber').val().replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase())
				$(this).find('.plateNumber').val($(this).find('.plateNumber').val().replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase())
			})
		}

		callback(error);

	}

	$('#btn_add, #btn_add_external').on('click', () => {

		viewController('showForm');
		clearMembershipForm();

		action = 'save';

		$('#btn_save').prop('disabled', false);

		$('#div_cardNumber').hide();
		$('#div_search').hide();
		$('#div_back').fadeIn();

	})

	$('#btn_add').on('click', () => backAction = "form")

	$('.btn_back').on('click', () => {

		if(backAction == "form"){

			$('#btn_save').prop('disabled', true);

			$('#div_back').hide();
			$('#div_search').fadeIn();

			$('#searchMember').val('');

			action = 'edit';
			backAction = "table";

			$('#btn_save').prop('disabled', false);

			$('#searchList').hide();

			get(`/membership/getById/${memberId}`, (err, result) => {
				if(result) fillMemberFormData(result);
			})

		}

		else{
			window.location.href="/membership";
		}

	})

	$('#btn_save').on('click', () => {
		if(validMemberForm() == true){
			let memberData = gatherMemberFormData();

			if(memberData.failed == true){
				confirm("Warning", "Registration numbers cannot be duplicated.", {"Ok": () =>  {} });
			}

			else if(action=='save')
				createMember(memberData);
			else if(action=='edit')
				updateMember(memberId, memberData);
		}

	})

	$('body').on('click', '.searchItem', function(){
		
		viewController("showForm");
		$('#searchMember').val('');
		$('#div_cardNumber').show();
		clearMembershipForm();

		action = 'edit';
		backAction = "table";
		memberId = $(this).attr('value');

		$('#btn_save').prop('disabled', false);

		$('#searchList').hide();

		get(`/membership/getById/${memberId}`, (err, result) => {
			if(result) fillMemberFormData(result);
		})

	})
	

	// On input
	$('#birthdate, #membershipDate').blur(function(){
		if($(this).val() > getCurrentDate()){
			confirm("Warning", `Invalid ${$(this).attr('placeholder')}`, {"Ok": () => $(this).val('') });
		}
	})

	$('#searchPromoExternal').on('keyup', function(){
        state.memberTable.search($(this).val()).draw();
	})
	

	// Delete
	$('body').on('click', '.delete', function(){

		let yes = () => deleteMember($(this).attr('id'));
		let no = () => {};

		confirm("Confirmation", "Are you sure you want to delete this member?", {"Yes":yes, "No":no});

	})

	// Plate Number
	$('#btn_addRegistrationNumber').click(() => {

		checkEmptyRegistrationNumber(error => {
			if(error == null){
				if($('.registrationNumberInput').length < 3)
					generateRegistrationNumberInput(['','']);
			}
			else if(error == "exceeded")
				confirm("Warning", "Cannot be more than 3 registration numbers.", {"Ok": () =>  {} });	
			else if(error == "emptyRegistrationRow")
				confirm("Warning", "Please fill the current registration number row.", {"Ok": () =>  {} });
		})
		
	})

	$('body').on('click', '.deleteUnitNumber', function() {

		$(this).closest('.registrationNumberInput').remove();

	})

	// Inputs accept number and letter only
	$('body').on('keyup', '.csNumber, .plateNumber', function(){

		$(this).val($(this).val().replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase());
		$(this).val($(this).val().replace("  ", " "));

		let registrationNumber = []; 

	  	let uniqueRegistrationNumbers = [];

	  	$('.registrationNumber').each(function(index){

	  		let rNumber = $(this).val().replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase();

	  		$(this).val(rNumber);

	  		if(rNumber != ""){
	  			if(uniqueRegistrationNumbers.indexOf(rNumber) < 0)
		  			uniqueRegistrationNumbers.push(rNumber);
		  		else{
					$(this).val('');
					confirm("Warning", "Registration numbers cannot be duplicated.", {"Ok": () =>  {
					
					} });			
		  		}
	  		}

	  	})

	})

	// Check duplicate registration number
	$('body').on('focusout', '.csNumber, .plateNumber', function() {

		let uniqueRegistrationNumbers = [];

		const input = $(this);
		let promptError = false;

		$('.registrationNumber').each(function(){
			
			if($(this).val().trim() != "" && uniqueRegistrationNumbers.indexOf($(this).val().trim()) >= 0){
				confirm("Warning", "Registration numbers cannot be duplicated.", {"Ok": () =>  {
					input.val('');
					promptError = true;
				} });
			}
			else
				uniqueRegistrationNumbers.push($(this).val().trim())

			if(promptError == true)
				return false;

		})
	})

	$('.nameField').on('keyup', function(){
		$(this).val($(this).val().replace(/[^a-zA-Z-. ]/g, ""));
		$(this).val($(this).val().replace("  ", " "));
	})
})