$(document).ready(function(){

	const viewOnly = () => $('#btn_save').hide();

	//Restriction
	let moduleRestriction;

	getModuleRestriction(restriction => {
		
		moduleRestriction = restriction;
		if(moduleRestriction!=2) viewOnly();

	});


	let memberId, memberValidThru, memberStatus;

	// let a = getCurrentDate()
	let dateToday = new Date();
	const dateTomorrow = dateToday.setDate(dateToday.getDate() + 1)
	
	validThru.min = formatDate(dateTomorrow);

	// Form management
	const loadMemberTable = () => {

		let parameters = {};
		parameters.fields =  "cardNumber, lastName, firstName,";
		parameters.fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
		parameters.fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix, ";
		parameters.fields += "CASE WHEN status == 'active' then '<i class=\"fa fa-circle\" style=\"color: green; margin-left: 20px;	\"/>' ELSE '<i class=\"fa fa-circle-thin\" style=\"margin-left: 20px;\"/>' END AS status"
		parameters.conditions = "";

		loader("Loading member list", "Please wait..");

		post("/membership/get", parameters, (err, result) => {
			if(result){
				result.forEach(member => member.name = `${member.lastName}, ${member.firstName}${member.middleName}${member.suffix}`)
				setTimeout(() => initializeDataTable('#tblMember', result, ["cardNumber", "name", "status"]), 400);
			} 
		})

	}

	const fillActivationForm = member => {

		clearCardActivationForm();

		member = member[0]
		memberId = member.id;

		// Member's basic Info
    	$('#cardNumber').text(member.cardNumber);
    	$('#name').val(`${member.lastName}, ${member.firstName}${member.middleName}${member.suffix}`);
    	$('#address').val(member.address);
    	$('#mobileNumber').val(member.mobileNumber);
    	$('#companyPhoneNumber').val(member.companyPhoneNumber);
    	$('#email').val(member.email);

    	// Valid in depends on membership date
    	$('#validIn').text(member.validIn);

    	member.validThru != null ? $('#validThru').val(member.validThru) : $('#validThru').val(' - ')


    	$('#status').val(member.status);

    	closeLoader();

	}

	const clearCardActivationForm = () => {

		clearForm('field');

		$('#status').prop("selectedIndex", 0);

		$('#validThru').val('');
	
	}

	const validCardSettings = () => {

		if($('#status').val() == null){
			confirm("Warning", "Select card status", {"Ok": () => {} });
			return false;
		}

		else return true;

	}


	// Operations

	const getMemberData = cardNumber => {

		let parameters = {};
		parameters.fields =  "cardNumber, lastName, firstName, address || ', ' || city || ', ' || province as address, ";
		parameters.fields += "mobileNumber, companyPhoneNumber, email, membershipDate, validThru, validIn, status, id, "
		parameters.fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
		parameters.fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix";
		parameters.conditions = ` AND cardNumber='${cardNumber}'`

		post("/membership/get", parameters, (err, result) => {

			memberStatus = result[0].status;
			memberValidThru = result[0].validThru;

			if(result) fillActivationForm(result);
		})

	}

	const saveCardSettings = card => {
		
		card.id = memberId;

		const currentDate = getCurrentDate();

		let requestBody = {
    	query: `UPDATE bucketName
				    	SET status='${card.status}'
				    	${card.validThru ? `, validIn='${currentDate}', validThru='${card.validThru}'` : ''}
				    	WHERE id='${card.id}'` 
    };
         
    loader('Updating member', 'Please wait..');

    post("/generic/query", requestBody, (err, result) => {

        setTimeout(() => {

            if (jconfirm.instances[0]) jconfirm.instances[0].close();

            memberStatus = card.status;

            if(card.validThru){
            	memberValidThru = card.validThru;
            	$('#validIn').text(currentDate);
            }

            confirm("Success", "Member updated!", {"Ok": () => loadMemberTable() });
        }, 1000);

    });

	}

	const searchMember = substring => {

		let fields =  "id, lastName, firstName, cardNumber, status, ";
				fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
				fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix";		

		get(`/membership/searchByNameAndCardNumber/${substring}/${fields}/none/true`, (err, result) => {
			
			if(result){

				result.forEach(member => {
					member.name = `${member.lastName}, ${member.firstName}${member.middleName}${member.suffix}`;
					if(member.status == 'active') member.status = '<i class="fa fa-circle" style="color: green; margin-left: 20px;"></i>';
					else member.status = '<i class="fa fa-circle-thin" style="margin-left: 20px;"></i>';
				})

				initializeDataTable('#tblMember', result, ["cardNumber", "name", "status"])
		
			}

		})

	}
	

	// On load

	loadMemberTable();



	// On clicks

	// Display member data
    $('#tblMember').on('click', 'tbody tr', function(){

    	loader("Loading member details", "Please wait..");

    	$('tr').removeClass('selectedRow');
    	$(this).addClass('selectedRow');
    	$('#btn_save').prop('disabled', false);

    	$('#cardActivationForm').fadeIn();

    	setTimeout(() => {
    		
    		const cardNumber = $(this).children(0)[0].innerHTML;

	      getMemberData(cardNumber);

	      if(moduleRestriction == 2) $('select').each(function(){ $(this).prop('disabled', false) });

    	}, 400);

    });

    $('#btn_save').on('click', () => {
    	let validCard = validCardSettings();
    	if(validCard) saveCardSettings({ "status": $('#status').val(), "validThru": $('#validThru').val() })
    });



    // On changes

    // Search
	$('#searchMember').on('keyup', function(){

		if($(this).val().length > 0) searchMember($(this).val());
		if($(this).val().length==0) loadMemberTable();

	})

})