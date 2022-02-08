$(document).ready(function(){

	let memberId;

	// form functions
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

		closeLoader();

	}

	const loadRedeemForm = memberId => {

		loader("Loading redeem form", "Please wait..");

		setTimeout(() => {

			get(`/membership/getById/${memberId}`, (err, result) => {
				if(result) fillMemberInfo(result);
			})

		}, 400)

	}

	const clearInquiryForm = () => $('.inquiryField').text('');


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

		loadRedeemForm(memberId);

	})

	
	$('#btn_refresh').click(() => clearInquiryForm() );

})