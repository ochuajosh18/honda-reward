const requiredFieldsAreFilled = () => {
	let valid = true;

	// Will return placeholder if the element is empty
	$('.requiredField').each(function() {
		valid = $(this).val() == null ? $(this).attr('placeholder') : $(this).val().length < 1 ? $(this).attr('placeholder') : true;
		if(valid != true) return false;
	})

	return valid;
}

const validEmailFormat = email => { 
	var re = /\S+@\S+\.\S+/;
	return re.test(email);
}

const gatherFormData = element => {

	let model = {};

	$(`.${element}`).each(function() {
		model[$(this).attr('id')] = $(this).val();
	})

	return model;

}

const clearForm = element => {

	$(`.${element}`).each(function() {
		$(this).val('');
	})

}

// Inputs accept number and letter only
$('body').on('keyup', '.noSpecialCharacter', function(){

	let string = $(this).val();
	$(this).val(string.replace(/[^a-zA-Z0-9]/g, ""));

	
})

const getCurrentDate = () => {

    let d = new Date(),
    			month = '' + (d.getMonth() + 1),
    			day = '' + d.getDate(),
    			year = d.getFullYear();

    if(month.length < 2) 
        month = '0' + month;
    if(day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');

}

const formatDate = (date) => {

    let d = new Date(date),
    			month = '' + (d.getMonth() + 1),
    			day = '' + d.getDate(),
    			year = d.getFullYear();

    if(month.length < 2) 
        month = '0' + month;
    if(day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');

}

const getCurrentTime = () => {

    let d = new Date(),
    			hours = '' + (d.getHours()),
    			minutes = '' + d.getMinutes()
    			
    if(minutes < 10)
    	minutes = '0'+minutes;
    if(hours < 10)
        hours = '0'+hours;

    return `${hours}:${minutes}`;

}