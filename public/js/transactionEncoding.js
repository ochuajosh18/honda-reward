$(document).ready(function(){

	let promo;
	let memberId;

	// Set current date as transaction date and max date

	const currentDate = getCurrentDate();
	transactionDate.max = currentDate;

	const searchMember = substring => {

		let fields =  "id, cardNumber, lastName, firstName, ";
				fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
				fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix";


		get(`/membership/searchByNameAndCardNumber/${substring}/${fields}/AND status='active'/true`, (err, result) => {
			if(result){
				
				$('#searchList').empty();

				if(result.length > 0) result.forEach(member => $('#searchList').append(`<li class='searchItem' value='${member.id}'>${member.lastName}, ${member.firstName}${member.middleName}${member.suffix} (${member.cardNumber})</li>`));

				else $('#searchList').append('<li>No result found.</li>')

				$('#searchList').show();

			}
		})

	}

	const fillMemberInfo = member => {

		memberId = member.id;
		member.middleName = (member.middleName != "" ? `, ${member.middleName}` : `${member.middleName}`);
		member.suffix = (member.suffix != "" ? `, ${member.suffix}` : `${member.suffix}`);

		$('#name').text(`${member.lastName}, ${member.firstName}${member.middleName}${member.suffix}`);
		$('#birthdate').text(member.birthdate);

		const validThru = (member.validThru == "9999-01-01" ? "Lifetime" : member.validThru);

		$('#validUntil').text(validThru);
		$('#points').text(member.points);
		$('#redeemablePoints').text(member.redeemablePoints);
		$('#cardNumber').text(member.cardNumber);

	}

	const identifyPromo = transactionDate => {

		let parameters = { "fields": "startDate, endDate, setup, title, id", "conditions": `AND (startDate <= '${transactionDate}' AND endDate >= '${transactionDate}')`};

		post("/promotion/get", parameters, (err, result) => {
			if(result) {

				promo = "";

				if(result.length > 1){
					if(result[0].title != "Default Promo") promo = result[0];
					else promo = result[1];
				}

				else promo = result[0];

				$('#activePromo').text(promo.title);
				$('#divAmount').fadeIn();

				calculatePointsAndAmountAllFields();

			};
		})

	}

	const validTransactionForm = () => {

		let validTransactionForm = true;

		const allFieldsAreaFilled = requiredFieldsAreFilled();

		if(allFieldsAreaFilled != true){
			validMemberForm = false;
			confirm("Warning", `${allFieldsAreaFilled} cannot be empty`, {"Ok": () => {} });
			return false;
		}

		return validTransactionForm;

	}

	const gatherTransactionData = callback => {
		let requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}
		
		post("/generic/query", requestBody, (err, result) => {
			if(result.length > 0) {
			  const conversion = result[0].conversion;

				let transaction = gatherFormData('requiredField');

				transaction.conversion = conversion;
				transaction.promotionId = promo.id;
				transaction.memberId = memberId;
				transaction.cardNumber = $('#cardNumber').text();
				transaction.transactionType = "EARN";
				transaction.createdBy = localStorage.getItem("userId");

				callback(transaction);
			}
		})

	}

	const calculatePointsAndAmountSingleField = (category, amount) => {

		let requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}

		post("/generic/query", requestBody, (err, result) => {
			if(result.length > 0) {
				const conversion = result[0].conversion;

				let minimum = parseFloat(promo.setup[category].minimum)
				let pointPer = parseFloat(promo.setup[category].pointPer);

				if(minimum == 0 && pointPer > 0) $(`#${category}Points`).val(amount)
				else if(pointPer > 0 && amount >= minimum) $(`#${category}Points`).val(Math.floor((amount/pointPer)))
				else $(`#${category}Points`).val(0)

				// totals
				$('#totalAmount').val(parseFloat(parseFloat($('#generalAmount').val()) + parseFloat($('#goodsAmount').val()) + parseFloat($('#accessoriesAmount').val()) + parseFloat($('#servicesAmount').val())).toFixed(2));
				$('#totalPoints').val(parseFloat(parseFloat($('#generalPoints').val()) + parseFloat($('#goodsPoints').val()) + parseFloat($('#accessoriesPoints').val()) + parseFloat($('#servicesPoints').val())).toFixed(2));
				$('#totalConversion').val(parseFloat(parseFloat($('#totalPoints').val())*conversion).toFixed(2));
			}
		});

	}

	const calculatePointsAndAmountAllFields = () => {

		let requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}

		post("/generic/query", requestBody, (err, result) => {
			if(result.length > 0) {
				const conversion = result[0].conversion;
				const categories = ["general", "goods", "accessories", "services"];

				categories.forEach(category => {

					let minimum = parseFloat(promo.setup[category].minimum);
					let pointPer = parseFloat(promo.setup[category].pointPer);
					let amount = parseFloat($(`#${category}Amount`).val());

					if(minimum == 0 && pointPer > 0) $(`#${category}Points`).val(amount)
					else if(pointPer > 0 && amount >= minimum) $(`#${category}Points`).val(Math.floor(amount/pointPer));
					else $(`#${category}Points`).val(0)

				})
				
				// totals
				$('#totalAmount').val(parseFloat(parseFloat($('#generalAmount').val()) + parseFloat($('#goodsAmount').val()) + parseFloat($('#accessoriesAmount').val()) + parseFloat($('#servicesAmount').val())).toFixed(2));
				$('#totalPoints').val(parseFloat(parseFloat($('#generalPoints').val()) + parseFloat($('#goodsPoints').val()) + parseFloat($('#accessoriesPoints').val()) + parseFloat($('#servicesPoints').val())).toFixed(2));
				$('#totalConversion').val(parseFloat(parseFloat($('#totalPoints').val())*conversion).toFixed(2));
			}
		});
		
	}

	const clearTransactionForm= () => {

		promo = "";
		clearForm('field');
		$('#activePromo').text('');
		$('.amount').each(function(){ $(this).val(0) })
		$('#divAmount').hide();

		$('#transactionDate').val(currentDate);
		identifyPromo($('#transactionDate').val());

	}



	// action
	const saveTransaction = transaction => {

		loader("Saving Transaction", "Please wait..");

		setTimeout(() => {

			post("/transaction/create", transaction, (err, result) => {
				if(jconfirm.instances[0]) jconfirm.instances[0].close();

				if(result){
					confirm("Success", `Your transaction has been saved! <br><br> Transaction Number: ${result}`, {"Ok": () => clearTransactionForm() });
				}
			})

		})

	}

	// search
	$('#searchMember').on('keyup', function(){
		
		if($(this).val().length > 0) searchMember($(this).val());

		else $('#searchList').hide();

	})



	// on clicks
	$('body').on('click', '.searchItem', function(){
		
		memberId = $(this).attr('value');

		$('#searchMember').val('');
		$('#searchList').hide();
		$('#divTransaction').fadeIn();
		$('#divAmount').hide();

		get(`/membership/getById/${memberId}`, (err, result) => {
			if(result) fillMemberInfo(result);
		})

		$('#transactionDate').val(currentDate);
		identifyPromo($('#transactionDate').val());

	})

	$('#btn_save').click(() => {
		if(validTransactionForm() == true) {
			gatherTransactionData(result => {
				saveTransaction(result);
			})
		}
	})

	$('#btn_refresh').click(() => clearTransactionForm() );


	// on input
	// convert amount to points
	// On input
	$('#transactionDate').blur(function(){
		if($(this).val() > currentDate){
			confirm("Warning", `Invalid Transaction Date`, {"Ok": () => $(this).val('') });
		}
		else{
			if($(this).val() != "") identifyPromo($(this).val())
			else $('#divAmount').hide();
		}
	})

	$('.amount').on('input', function(e){ 
		let value = $(this).val();

		if(value[0] == 0) $(this).val(value.toString().substring(1,value.length));
		if(value == "") $(this).val(0);
		calculatePointsAndAmountSingleField($(this).attr('category'), value)

	})
	
	$('input[type="number"]').on('keydown', function(e) {
	    
	    if((e.keyCode == 110 || e.keyCode == 190) && $(this).val().includes('.')){
	    	return false;
	    }

	    else if(!((e.keyCode > 95 && e.keyCode < 106)
	      || (e.keyCode > 47 && e.keyCode < 58) 
	      || e.keyCode == 8
	      || e.keyCode == 9
	      || e.keyCode == 110
	      || e.keyCode == 37
	      || e.keyCode == 39
	      || e.keyCode == 190)) {
	        return false;
	    }

	});
	

})