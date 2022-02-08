$(document).ready(function(){

	let memberId;
	let redeemableId = 0;
	let itemsToRedeem = [];
	let redeemablePoints;
	let conversion;

	const currentDate = getCurrentDate();

	// set current date as max transaction date
	transactionDate.max = currentDate;


	// form functions
	const searchMember = substring => {

		let fields =  "id, cardNumber, lastName, firstName, ";
				fields += "CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END AS middleName, ";
				fields += "CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS suffix";

		get(`/membership/searchByNameAndCardNumber/${substring}/${fields}/AND status='active'/true`, (err, result) => {
			if(result){
				
				$('#searchList').empty();

				if(result.length > 0){
					result.forEach(member => {
						$('#searchList').append(`<li class='searchItem' value='${member.id}'>${member.lastName}, ${member.firstName}${member.middleName}${member.suffix} (${member.cardNumber})</li>`)
					})
				}

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

	const loadRedeemables = () => {
		
		let parameters = { "fields": "name, amount, points", "conditions": "AND status='active' ORDER BY name"}

		post("/redeemable/get", parameters, (err, result) => {
			if(result){
				$('#redeemables').empty();
				$('#redeemables').append('<option selected disabled> - Select - </option>');
				result.forEach(redeemable => $('#redeemables').append(`<option value='${redeemable.name}' points='${redeemable.points}' amount='${redeemable.amount}'>${redeemable.name}</option>`));

				closeLoader();
			}
		})
		
	}

	const loadRedeemForm = memberId => {

		loader("Loading redeem form", "Please wait..");

		setTimeout(() => {

			get(`/membership/getById/${memberId}`, (err, result) => {
				if(result){
					redeemablePoints = result.redeemablePoints;
					fillMemberInfo(result);
					loadRedeemables();
				}
			})

		}, 400)

	}

	const loadRedeemedItemTable = () => {

		const columns = ["name", "amount", "points", "delete"];

		columns.forEach((property, index) => columns[index] = {data: property});

		$('#tblItemsToRedeem').DataTable({
			searching: false,
			paging: false,
			sorting: false,
			info: false,
	      	destroy: true,
	      	data: itemsToRedeem,
	      	columns: columns
		});
		
		closeLoader();

	}

	const computeTotal = () => {

		let totalAmount = 0;
		let totalPoints = 0;

		itemsToRedeem.forEach(redeemable => {
			totalAmount += parseFloat(redeemable.amount);
			totalPoints += parseFloat(redeemable.points);
		})

		$('#totalAmount').val(parseFloat(totalAmount).toFixed(2));
		$('#totalPoints').val(parseFloat(totalPoints).toFixed(2));

	}

	const addItem = () => {

		itemsToRedeem.push({
			"name": $('#redeemables option:selected').val(),
			"amount": $('#redeemables option:selected').attr('amount'),
			"points": $('#redeemables option:selected').attr('points'),
			"delete": `<img redeemableId="${redeemableId}" class="delete icon removeItem" style="float: right" src="../images/icons/delete.png">`,
			"id": redeemableId
		})

		redeemableId++;

		if(itemsToRedeem.length == 1) $('#div_RedeemedItems').show();
		
		loadRedeemedItemTable();
		computeTotal();

	}

	const removeItem = id => {

		itemsToRedeem = itemsToRedeem.filter(function(item){ return item.id !=  id });
		
		if(itemsToRedeem.length > 0){
				loadRedeemedItemTable();
				computeTotal();
		}

		else $('#div_RedeemedItems').hide();

	}

	const validTransactionForm = () => {

		let validTransactionForm = true;

		const allFieldsAreaFilled = requiredFieldsAreFilled();

		if($('#redeemType option:selected').val() == 'default'){
			validTransactionForm = false;
			confirm("Warning", `Please select redeem type`, {"Ok": () => {} })
			return false;
		}

		else if($('#redeemType').val() == "Discount"){
			if($('#discountPoints').val() == '' || $('#discountPoints').val() == 0){
				confirm("Warning", `Discount points must be more than 0`, {"Ok": () => {} });
				return false;
			}
		}

		else if(allFieldsAreaFilled != true){
			validTransactionForm = false;
			confirm("Warning", `${allFieldsAreaFilled} cannot be empty`, {"Ok": () => {} });
			return false;
		}

		return validTransactionForm;

	}

	const gatherTransactionData = () => {

		let transaction = {
				"transactionDate": 	$('#transactionDate').val(),
				"orNumber": 				$('#orNumber').val(),
				"invoiceNumber": 		$('#invoiceNumber').val(),
				"memberId": 				memberId,
				"cardNumber": 			$('#cardNumber').text(),
				"transactionType":  "REDEEM",
				"createdBy": 				localStorage.getItem("userId")
		};

		if($('#redeemType').val() == "Discount"){
			transaction.redeemType = "DISCOUNT";
			transaction.totalPoints = $('#discountPoints').val();
			transaction.transactionAmount = $('#transactionAmount').text();
			transaction.discountedAmount = $('#discountedAmount').text();
			transaction.dicountEquivalent = $('#dicountEquivalent').text();
			transaction.conversion = conversion;
		}

		else{
			transaction.redeemedItems = itemsToRedeem;
			transaction.redeemType = "ITEM/SERVICE";
			transaction.totalAmount = $('#totalAmount').val();
			transaction.totalPoints = $('#totalPoints').val();
		}

		return transaction;

	}

	const clearTransactionForm = () => {

		clearForm('field');

		$('#itemAmount, #itemPoints, #discountPoints, #transactionAmount, #discountedAmount').text('');

		loadRedeemables();

		$('#div_RedeemedItems').hide();
		itemsToRedeem = [];

	}

	const getTransactionByInvoiceNumber = invoiceNumber => {

		let parameters = { "fields": "transactionDate, orNumber, totalAmount", "conditions": ` AND invoiceNumber='${invoiceNumber}' AND posted=false AND transactionType='EARN' AND cardNumber='${$('#cardNumber').text()}'` }

		post("/transaction/get", parameters, (err, result) => {

			if(result){
				if(result.length > 0){

					$('#discountPoints').attr('disabled', false);

					$('#transactionDate').val(result[0].transactionDate);
					$('#orNumber').val(result[0].orNumber);
					$('#transactionAmount').text(result[0].totalAmount);

				}

				else confirm("Warning", `Transaction not found.`, {"Ok": () => {

					$('#discountPoints').attr('disabled', true);
					$('#discountPoints').val(0);
					$('#dicountEquivalent, #transactionAmount, #discountedAmount').text('');

					}
				});
			}
		})

	}

	// action
	const saveTransaction = transaction => {
	
		if($('#redeemType' == 'Discount')){

			if(redeemablePoints - parseFloat(transaction.totalPoints) >= 0){

					transaction.redeemablePoints = redeemablePoints-parseFloat(transaction.totalPoints);

					loader("Saving Transaction", "Please wait..");

					setTimeout(() => {

						post("/transaction/create", transaction, (err, result) => {
							if(jconfirm.instances[0]) jconfirm.instances[0].close();

							if(result){
								confirm("Success", `Your transaction has been saved! <br><br> Transaction Number: ${result}`, {"Ok": () => {

									clearTransactionForm();
									loadRedeemForm(memberId);

								}});
							}
						})

					})

			}

			else confirm("Warning", `Insufficient points`, {"Ok": () => {} });

		}

		else{

			if(redeemablePoints - (parseFloat(transaction.totalPoints)) >= 0){

					transaction.redeemedItems = itemsToRedeem;
					transaction.redeemablePoints = redeemablePoints;

					loader("Saving Transaction", "Please wait..");

					setTimeout(() => {

						post("/transaction/create", transaction, (err, result) => {
							if(jconfirm.instances[0]) jconfirm.instances[0].close();

							if(result){
								confirm("Success", `Your transaction has been saved! <br><br> Transaction Number: ${result}`, {"Ok": () => {

									clearTransactionForm();
									loadRedeemForm(memberId);

								}});
							}
						})

					})

			}

			else confirm("Warning", `Insufficient points`, {"Ok": () => {} });

		}
		

	}

	// on inputs
	$('#transactionDate').blur(function(){
		if($(this).val() > currentDate){
			confirm("Warning", `Invalid Transaction Date`, {"Ok": () => $(this).val('') });
		}
	})

	// search
	$('#searchMember').on('keyup', function(){
		
		if($(this).val().length > 0) searchMember($(this).val());

		else $('#searchList').hide();

	})



	// on clicks
	$('body').on('click', '.searchItem', function(){
		
		memberId = $(this).attr('value');

		$('#redeemItemServicesList, #div_itemServicesEquivalent, #div_itemServicesEquivalent, #div_invoiceForm, #div_redeemForm').hide();
		$("#redeemType").val($("#redeemType option:first").val());

		$('#searchMember').val('');
		$('#searchList').hide();
		$('#divTransaction').fadeIn();

		loadRedeemForm(memberId);

	})

	$('#addItem').click(() => {
		if($('#redeemables option:selected').text() != " - Select - ") addItem() 
	});

	$('body').on('click', '.removeItem', function(){

		removeItem($(this).attr('redeemableId'));

	})

	$('#btn_save').click(() => {
		if(validTransactionForm() == true) saveTransaction(gatherTransactionData());
	})

	$('#btn_refresh').click(() => clearTransactionForm() );


	$('input[type="number"]').on('keydown', function(e) {
	    
	    if((e.keyCode == 110 || e.keyCode == 190) && $(this).val().includes('.')){
	    	return false;
	    }

	    else if(!((e.keyCode > 95 && e.keyCode < 106)
	      || (e.keyCode > 47 && e.keyCode < 58) 
	      || e.keyCode == 8
	      || e.keyCode == 110
	      || e.keyCode == 37
	      || e.keyCode == 39
	      || e.keyCode == 190)) {
	        return false;
	    }

	    if(e.keyCode == 8 && $(this).val().length == 0) $(this).val(0)

	});
	
	// on change
	$('#redeemType').change(function(){

		clearTransactionForm();
		$('#discountPoints').attr('disabled', true);
		$('#div_redeemForm').fadeIn();

		if($(this).val() == "Discount"){

			$('#redeemItemServicesList, #div_itemServicesEquivalent, #div_itemServicesEquivalent').hide();
			$('#div_invoiceForm').fadeIn();

			$('#transactionDate, #orNumber').attr('disabled', true);

		}

		else{

			$('#transactionDate').val(currentDate);
			$('#div_invoiceForm').hide();
			$('#redeemItemServicesList, #div_itemServicesEquivalent, #div_itemServicesEquivalent').fadeIn();

			$('#transactionDate, #orNumber').attr('disabled', false);

		}

	})

	$('#redeemables').change(function(){

		$('#itemAmount').text(`${$('option:selected',this).attr('amount')}`);
		$('#itemPoints').text($('option:selected',this).attr('points'));
		
	})

	$('#invoiceNumber').blur(function(){

		if($('#redeemType').val() == "Discount" && $('#invoiceNumber').val().length > 0) getTransactionByInvoiceNumber($(this).val());

	})

	$('#discountPoints').on('input', function(){
		let requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}
		
		post("/generic/query", requestBody, (err, result) => {
			if(result.length > 0) {
			  	conversion = result[0].conversion;

				$('#dicountEquivalent').text(parseFloat($(this).val()*conversion).toFixed(2));

				const discountedAmount = parseFloat(parseFloat($('#transactionAmount').text()) - parseFloat($(this).val()*conversion)).toFixed(2);

				if(discountedAmount >= 0) $('#discountedAmount').text(discountedAmount);

				else confirm("Warning", `Discount amount is larger than transaction amount`, {"Ok": () => {
						$('#discountPoints').val(0);
						$('#dicountEquivalent').text('');
						$('#discountedAmount').text('');
				} })
			}
		});

	})

})