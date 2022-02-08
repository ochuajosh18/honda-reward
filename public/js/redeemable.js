$(document).ready(function(){

	const viewOnly = () => {

		$('#btn_add').hide();
		$('#btn_refresh').hide();
		$('#btn_save').hide();
		$('#btn_delete').hide();
		$('.field').attr('disabled', 'disabled');

	}

	//Restriction
	let moduleRestriction;

	getModuleRestriction(restriction => {
		
		moduleRestriction = restriction;
		if(moduleRestriction!=2) viewOnly();

	});


	let action="add";
	let redeemableId;
	let selectedRedeemableName;


	// form functions

	const validRedeemableName = (title, callback) => {

		let parameters = { "fields": "RAW LOWER(name)", "conditions": "" }

		loader("Checking for duplicates", "Please wait..");

		setTimeout(() => {
			post("/redeemable/get", parameters, (err, titles) => {
				if(titles){

					if(titles.includes($('#name').val().toLowerCase())){
						if(action == "edit" && title.toLowerCase() == selectedRedeemableName.toLowerCase()) callback(false)
						else callback(true); 
					}
					
					if(jconfirm.instances[0]) jconfirm.instances[0].close();
					callback(false);

				}
			})
		}, 400);

	}

	const validRedeemable = () => {

		let validRedeemableForm = true;

		const allFieldsAreaFilled = requiredFieldsAreFilled();

		if(allFieldsAreaFilled != true){
			validRedeemableForm = false;
			confirm("Warning", `${allFieldsAreaFilled} cannot be empty`, {"Ok": () => {} });
			return false;
		}

		return validRedeemableForm;

	}

	const loadRedeemableTable = () => {

		let parameters = { "fields": "name, category, CASE WHEN status == 'active' then '<i class=\"fa fa-circle\" style=\"color: green; margin-left: 20px;	\"/>' ELSE '<i class=\"fa fa-circle-thin\" style=\"margin-left: 20px;\"/>' END AS status", "conditions": ""}

		loader("Loading redeemable list", "Please wait..");

		post("/redeemable/get", parameters, (err, result) => {
			if(result) setTimeout(() => initializeDataTable('#tblRedeemable', result, ["name", "category", "status"]), 400)
		})

	}

	const getRedeemableData = (name, callback) => {

		let parameters = { "fields": "name, amount, points, category, status, id", "conditions": " AND name='" + name + "'" }

		loader("Loading redeemable", "Please wait..");


		setTimeout(() => {

			post("/redeemable/get", parameters, (err, result) => {
				if(jconfirm.instances[0]) jconfirm.instances[0].close();
				if(result) callback(result[0]);
			})

		}, 400)
		

	}

	const searchRedeemable = substring => {

		get("/redeemable/search/"+substring, (err, result) => {
			if(result) initializeDataTable('#tblRedeemable', result, ["name", "category", "status"]) 
		})

	}

	const fillRedeemableForm = redeemable => {

		clearRedeemableForm();

		$('#name').val(redeemable.name);
		$('#amount').val(redeemable.amount);
		$('#points').val(redeemable.points)
		$('#category').val(redeemable.category);
		$('#status').val(redeemable.status);

	}

	const clearRedeemableForm = () => {

		clearForm('field');
		$('select').each(function(){ $(this).prop("selectedIndex", 0); })

	}

	// on loads
	loadRedeemableTable();



	// actions
	const saveRedeemable = redeemable => {

		loader("Saving redeemable", "Please wait..");

		post("/redeemable/create", redeemable, (err, result) => {
			if(result){
				if(jconfirm.instances[0]) jconfirm.instances[0].close();
				confirm("Success", "Redeemable created!", {"Ok": () => {
					clearRedeemableForm();
					loadRedeemableTable()
				} });
			}
		})

	}

	const updateRedeemable = redeemable => {

		redeemable.id = redeemableId;

		loader("Updating", "Please wait..");

		post("/redeemable/update", redeemable, (err, result) => {
			if(result){
				if(jconfirm.instances[0]) jconfirm.instances[0].close();
				confirm("Success", "Redeemable updated!", {"Ok": () => loadRedeemableTable() });
			}
		})

	}

	const deleteRedeemable = id => {

		get("/redeemable/delete/"+id, (err, result) => {
			if(result){
				confirm("Success", "Redeemable deleted!", {"Ok": () =>  {

					loadRedeemableTable();
					clearRedeemableForm();

				}});

				clearRedeemableForm();
			}
			
		})

	}




	// on clicks
	$('#btn_add').click(function(){

		clearRedeemableForm();
		$('#btn_delete').hide();
		action = "add";

	})

	$('#btn_save').click(() => {

		if(validRedeemable() == true){
			if(action=="add") saveRedeemable(gatherFormData('field'));
			else updateRedeemable(gatherFormData('field'));
		}

	})

	$('#btn_refresh').click(() => clearRedeemableForm())

    $('#tblRedeemable').on('click', 'tr', function(){

    	action = 'edit';
    	if(moduleRestriction == 2) $('#btn_delete').show();

    	$('tr').removeClass('selectedRow');
    	$(this).addClass('selectedRow');

        const redeemableName = $(this).children(0)[0].innerHTML;

        getRedeemableData(redeemableName, (redeemable) => {

        	selectedRedeemableName = redeemableName;
        	redeemableId = redeemable.id;
        	fillRedeemableForm(redeemable)

        });

    });


	// on inputs
	$('input[type="number"]').on('keydown', function(e) {
	    
	    if((e.keyCode == 110 || e.keyCode == 190) && $(this).val().includes('.')){
	    	return false;
	    }

	    else if(!((e.keyCode > 95 && e.keyCode < 106)
	      || (e.keyCode > 47 && e.keyCode < 58) 
	      || e.keyCode == 8
	      || e.keyCode == 110
	      || e.keyCode == 190)) {
	        return false;
	    }

	});

	$('#btn_delete').click(() => {

		let yes = () => deleteRedeemable(redeemableId);
    let no = () => {};

		confirm("Confirmation", "Are you sure you want to delete redeemable?", {"Yes":yes, "No":no});

	})

	$('#name').focusout(function(){

		validRedeemableName($(this).val(), function(duplicate){

			if(duplicate) confirm("Warning", "Redeemable name is already taken", {"Ok": () => $('#name').val('') });

		});

	})

	// Search
	$('#searchRedeemable').on('keyup', function(){

		if($(this).val().length > 0) searchRedeemable($(this).val());
		if($(this).val().length==0) loadRedeemableTable();

	})

})