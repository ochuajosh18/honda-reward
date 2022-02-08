$(document).ready(function(){

	const viewOnly = () => {

		$('#btn_add').hide();
		$('#btn_addInside').hide();
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



	let action="add", promoId, selectedPromoTitle;

	const currentDate = getCurrentDate();

	// set today
	startDate.min = currentDate;
	endDate.min = currentDate;



	// form functions
	const validDateRange = (inputDateRange, callback) => {

		let parameters = { "fields": "startDate, endDate, title", "conditions": "" }

		post("/promotion/get", parameters, (err, dateRanges) => {
			if(dateRanges){

				let valid = true;
				dateRanges.forEach((existingDateRange, index) => {
					if(existingDateRange.title != "Default Promo"){
						if((inputDateRange.startDate <= existingDateRange.endDate) && (inputDateRange.endDate >= existingDateRange.startDate)){
							if(existingDateRange.title != selectedPromoTitle) valid = false;
						}
					}
					if(index == dateRanges.length-1) callback(valid);
				})

			}
		})

	}

	const validPromotionTitle = (title, callback) => {

		let parameters = { "fields": "RAW LOWER(title)", "conditions": "" }

		post("/promotion/get", parameters, (err, titles) => {

			if(titles){

				if(titles.includes($('#title').val().toLowerCase())){
					if(action == "edit" && title.toLowerCase() == selectedPromoTitle.toLowerCase()) callback(false)
					else callback(true); 
				}
				
				callback(false);

			}
		})

	}

	const validPromotion = () => {

		let validPromotionForm = true;

		const allFieldsAreaFilled = requiredFieldsAreFilled();

		if(allFieldsAreaFilled != true){
			validMemberForm = false;
			confirm("Warning", `${allFieldsAreaFilled} cannot be empty`, {"Ok": () => {} });
			return false;
		}

		return validPromotionForm;

	}

	const gatherPromotionFormData = () => {
		
		let promotion = gatherFormData('field');
		
		if(selectedPromoTitle == 'Default Promo'){
			delete promotion['startDate'];
			delete promotion['endDate'];
		}

		return promotion;

	}

	const loadPromotionTableExternal = () => {

		let fields  = `CASE WHEN (startDate <= '${currentDate}' AND endDate >= '${currentDate}' AND title != 'Default Promo') `;
				fields += `THEN "<p style='color: green;' class='promoTitle'>" || title || "</p>" `;
				fields += `ELSE "<p class='promoTitle'>" || title || "</p>" END as title, `;
				fields += `title as titleOriginal, setup, id`;

		const parameters = { "fields": fields, "conditions": "ORDER BY titleOriginal"}

		loader("Loading promo list", "Please wait..");

		post("/promotion/get", parameters, (err, result) => {
			if(result){

				setTimeout(() => {
					let promotions = result.filter(promo => { return promo.titleOriginal == "Default Promo" });
					let otherPromotions = result.filter(promo => promo.titleOriginal != "Default Promo");
					let activePromo = result.filter(promo => promo.titleOriginal != "Default Promo" && promo.title.includes('green'));

					if(activePromo.length == 0) promotions[0].title = "<p style='color: green;' class='promoTitle'>Default Promo</p>"

					promotions = promotions.concat(otherPromotions);

					initializeDataTableExternal(promotions)

				}, 400);

			}
		})

	}

	const initializeDataTableExternal = promotions => {

		let data = [];

		promotions.forEach((promotion, index) => {

			let promotionRow = {};

			promotionRow.general     = `Minimum: <span>${promotion.setup.general.minimum} </span> <br>Value per point:<span> ${promotion.setup.general.pointPer} </span>`;
			promotionRow.services    = `Minimum: <span>${promotion.setup.services.minimum} </span> <br>Value per point: <span>${promotion.setup.services.pointPer} </span>`;
			promotionRow.goods 	  	 = `Minimum: <span>${promotion.setup.goods.minimum} </span> <br>Value per point: <span>${promotion.setup.goods.pointPer} </span>`;
			promotionRow.accessories = `Minimum: <span>${promotion.setup.accessories.minimum} </span> <br>Value per point: <span>${promotion.setup.accessories.pointPer} </span>`;
			
			if(promotion.id != "PROMOTION::DEFAULT" && moduleRestriction == 2) promotionRow.accessories += `<img id="${promotion.id}" class="deleteExternal icon deleteIcon" style="float: right" src="../images/icons/delete.png">`

			promotionRow.title       = promotion.title;

			data.push(promotionRow);

		})

		$('#tblPromotionExternal').DataTable({
			searching: false,
			paging: false,
			info: false,
	      	destroy: true,
	      	data: data,
	      	aaSorting: [],
	      	columns: [
  			{ data: 'title' 	  	},
            { data: 'general' 	  },
            { data: 'services'	  },
            { data: 'goods' 	  	},
            { data: 'accessories' }
	        ]
		});

		if(jconfirm.instances[0]) jconfirm.instances[0].close();
				
	}

	const loadPromotionTableInternal = trigger => {
		let fields  = `CASE WHEN (startDate <= '${currentDate}' AND endDate >= '${currentDate}' AND title != 'Default Promo') `;
				fields += `THEN "<p style='color: green;' class='promoTitle'>" || title || "</p>" `;
				fields += `ELSE title END as title, title as titleOriginal `;

		let parameters = { "fields": fields, "conditions": "ORDER BY titleOriginal"}

		loader("Loading promo list", "Please wait..");

		post("/promotion/get", parameters, (err, result) => {

			if(result) {

				let promotions = result.filter(promo => { return promo.title == "Default Promo" });
				let otherPromotions = result.filter(promo => promo.title != "Default Promo");
				let activePromo = result.filter(promo => promo.titleOriginal != "Default Promo" && promo.title.includes('green'));

				if(activePromo.length == 0) promotions[0].title = "<p style='color: green;' class='promoTitle'>Default Promo</p>"

				promotions = promotions.concat(otherPromotions);
				
				setTimeout(() => {

					$('#tblPromotionInternal').DataTable({
						searching: false,
						paging: false,
						info: false,
				      	destroy: true,
				      	data: promotions,
				      	aaSorting: [],
				      	columns: [{ data: "title"}]
					});
				
					if(jconfirm.instances[0]) jconfirm.instances[0].close();

					if(trigger == "externalTable"){
			        	
		        		$('#tblPromotionInternal td').each(function() {

			        		if($(this)[0].innerHTML == selectedPromoTitle) $(this).closest('tr').addClass('selectedRow');

						})
					
					}

				}, 400)

			};
		})

	}

	const getPromotionData = (title, callback) => {
		const requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}
		post("/generic/query", requestBody, (err, result) => {
			const conversion = result[0].conversion;

			let parameters = { "fields": "title, startDate, endDate, setup, remarks, id", "conditions": " AND title='" + title + "'" }
			console.log(result);
			post("/promotion/get", parameters, (err, result) => {
				if(result) {
					result[0].conversion = conversion;
					callback(result[0]);
				}
			})
		});

	}

	const fillPromotionForm = promotion => {
		
		clearPromoForm(() => {
			$('#title').val(promotion.title);
			$('#equivalent').val(promotion.conversion);

			if(promotion.title != "Default Promo"){
				if(moduleRestriction == 2) $('#title').prop('disabled', false);
				$('#divDateRange').fadeIn();
				$('#startDate').val(promotion.startDate);
				$('#endDate').val(promotion.endDate);
				$('#startDate, #endDate').addClass('requiredField');
			}

			else{
				$('#title').prop('disabled', true);
				$('#startDate, #endDate').removeClass('requiredField');
				$('#divDateRange').fadeOut();
			}

			// setup
			$('#generalMinimumAmount').val(promotion.setup.general.minimum);
			$('#onePointPerGeneral').val(promotion.setup.general.pointPer);
			$('#servicesMinimumAmount').val(promotion.setup.services.minimum);
			$('#onePointPerServices').val(promotion.setup.services.pointPer);
			$('#goodsMinimumAmount').val(promotion.setup.goods.minimum);
			$('#onePointPerGoods').val(promotion.setup.goods.pointPer);
			$('#accessoriesMinimumAmount').val(promotion.setup.accessories.minimum);
			$('#onePointPerAccessories').val(promotion.setup.accessories.pointPer);

			// redeeming setup
			$('#remarks').val(promotion.remarks);
		});
	}

	const clearPromoForm = callback => {
		let requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}

		post("/generic/query", requestBody, (err, result) => {
			if(result.length > 0) {
				const conversion = result[0].conversion;
				clearForm('promoField');
				$('.settingField').val(0);
				if($('#title').val() != "Default Promo") $('#title').val('');
				$('#equivalent').val(conversion);
			}
			callback();
		});
		
	}



	// on loads
	loadPromotionTableExternal();



	// actions
	const savePromotion = promotion => {

		post("/promotion/create", promotion, (err, result) => {
			if(result){
				confirm("Success", "Promo created!", {"Ok": () => {
					clearPromoForm(() => {});
					loadPromotionTableInternal('internalTable') ;
				} });
			}
		})

	}

	const updatePromotion = promotion => {

		promotion.id = promoId;

		post("/promotion/update", promotion, (err, result) => {
			if(result){
				confirm("Success", "Promo updated!", {"Ok": () => loadPromotionTableInternal('internalTable') });
			}
		})

	}

	const deletePromotion = (id, table) => {

		get("/promotion/delete/"+id, (err, result) => {
			if(result){
				confirm("Success", "Promo deleted!", {"Ok": () =>  {

					if(table == "external") window.location.href="/setup";
					
					else{
						loadPromotionTableInternal('internalTable');
						clearPromoForm(() => {});
					};

				}});
				clearPromoForm(() => {});
			}
			
		})

	}

	const searchRedeemable = (substring, source) => {

		get(`/promotion/search/${substring}/${source}`, (err, result) => {
			if(result){
				if(source=="internal") initializeDataTable('#tblPromotionInternal', result, ["title"]);
				else{ initializeDataTableExternal(result) }
			}
		})

	}


	// on clicks
	$('#btn_add, #btn_addInside').click(function(){

		$('#divDateRange').show();

		clearPromoForm(() => {});

		$('#title').val('');

		$('#title').prop('disabled', false);

		action = "add";

		$('#btn_delete').hide();

		$('#div_main').hide();
		$('#div_form').fadeIn();
		$('#startDate, #endDate').addClass('requiredField');
		
		loadPromotionTableInternal('internalTable');

	})

	$('#btn_save').click(() => {

		if(validPromotion() == true){
			if(action=="add") savePromotion(gatherPromotionFormData());
			else updatePromotion(gatherPromotionFormData());
		}

	})

	$('#btn_conversion').click(() => {
		let requestBody = {
			"query": "SELECT conversion FROM bucketName USE KEYS 'pointsToPeso'"
		}

		post("/generic/query", requestBody, (err, result) => {
			if(result.length > 0) {
				const conversion = result[0].conversion;
				$.confirm({
					title: 'Conversion',
					content: `
						<form action="" class="formName">
							<div class="form-group">
							<label>Points to peso</label>
							<input id="conversion" type="number" placeholder="Conversion value..." min=0 value="${conversion}" pattern="[0-9]" class="conversion form-control" required />
							</div>
						</form>`,
					buttons: {
						formSubmit: {
							text: 'Update',
							btnClass: 'btn-blue',
							action: function () {
								var conversion = this.$content.find('.conversion').val();
								if(!conversion){
									confirm("Warning", "Conversion value cannot be empty", {"Ok": () => {} });
									return false;
								}
								
								const dateToday = formatDate(new Date);

								let requestBody = {
									"query": `UPDATE bucketName USE KEYS 'pointsToPeso' SET conversion=${conversion}, dateUpdated='${dateToday}'`
								}
								
								post("/generic/query", requestBody, (err, result) => {
									confirm("Success", "Conversion value updated!", {"Ok": () => {} });
								})
							}
						},
						cancel: function () {
							//close
						},
					},
					onContentReady: function () {
						// bind to events
						var jc = this;
						this.$content.find('form').on('submit', function (e) {
							// if the user submits the form by pressing enter in the field.
							e.preventDefault();
							jc.$$formSubmit.trigger('click'); // reference the button and click it
						});
					}
				});
			}
		
		});
	})

	$('#btn_refresh').click(() => clearPromoForm(() => {}))

	$('#tblPromotionInternal').on('click', 'tr', function(){

			action = 'edit';

			$('tr').removeClass('selectedRow');
			$(this).addClass('selectedRow');
			
			if(moduleRestriction == 2) $('#btn_delete').show();
		
		const promoTitle = $(this).children(0)[0].innerHTML;

		if(promoTitle == "Default Promo" || moduleRestriction < 2) $('#btn_delete').hide();
				else $('#btn_delete').show();

		getPromotionData(promoTitle, promotion => {

			if(promoTitle.substring(0,2) != "<p"){
				selectedPromoTitle = promotion.title;
				promoId = promotion.id;
				fillPromotionForm(promotion);
			}

		});

	});

	$('body').on('click', '.promoTitle', function(){

			action = 'edit';
			
		const promoTitle = $(this)[0].innerHTML;

		$('#div_main').hide();
				$('#div_form').fadeIn();

				if(moduleRestriction != 2) $('#btn_addInside').hide();

				if(promoTitle == "Default Promo" || moduleRestriction < 2) $('#btn_delete').hide();
				else $('#btn_delete').show();

		getPromotionData(promoTitle, promotion => {

			selectedPromoTitle = promotion.title;
			promoId = promotion.id;
			fillPromotionForm(promotion);

			loadPromotionTableInternal('externalTable');

		});

	});	

	$('#btn_delete').click(() => {

		let yes = () => deletePromotion(promoId, "internal");
    	let no = () => {};

		confirm("Confirmation", "Are you sure you want to delete promo?", {"Yes":yes, "No":no});

	})

	$('body').on('click', '.deleteExternal', function(){

    	let yes = () => deletePromotion($(this).attr('id'), "external");
    	let no = () => {};

		confirm("Confirmation", "Are you sure you want to delete promo?", {"Yes":yes, "No":no});

	})



	// on inputs
	$('.dateRange').on('blur', function(){

		if($(this).val().length > 0 && $(this).val() < currentDate){
			confirm("Warning", `Invalid ${$(this).attr('placeholder')}`, {"Ok": () => $(this).val('') });
		}
		else if($('#startDate').val().length > 0 && $('#endDate').val().length > 0){

			// Avoid duplicate display of error message
			if(!jconfirm.instances[0]){
				var inputDateRange = {"startDate": $('#startDate').val(), "endDate": $('#endDate').val()}
			
				if(inputDateRange.startDate > inputDateRange.endDate){

					confirm("Warning", "Invalid date range",{
							"Ok": () => {
								$('#startDate').val('');
								$('#endDate').val('')
							}
					});

				} 

				else{
						validDateRange(inputDateRange, (valid) => {
							if(valid == false){

								confirm("Warning", "Date range is already taken", {
										"Ok": () => {
											$('#startDate').val('');
											$('#endDate').val('')
										}
								});

							}
						})
				} 
			}

		}

	})

	$('input[type="number"]').on('input', function(e){ 
		let value = $(this).val();

		if(value[0] == 0) $(this).val(value.toString().substring(1,value.length));
		if(value == "") $(this).val(0);

	})

	$('body').on('keydown', 'input[type="number"]', function(e) {
		
	    if((e.keyCode == 110 || e.keyCode == 190) && $(this).val().includes('.')){
	    	return false;
	    }

	    else if(!((e.keyCode > 95 && e.keyCode < 106)
	      || (e.keyCode > 47 && e.keyCode < 58) 
	      || e.keyCode == 8
	      || e.keyCode == 110	
	      || e.keyCode == 9
	      || e.keyCode == 190)) {
	        return false;
	    }
	    
	    if(e.keyCode == 8 && $(this).val().length == 1) $(this).val(0)

	});

	$('#title').focusout(function(){

		validPromotionTitle($(this).val(), function(duplicate){

			if(duplicate) confirm("Warning", "Promo title is already taken", {"Ok": () => $('#title').val('') });

		});

	})

	$('#searchPromoExternal').on('keyup', function(){

		if($(this).val().length > 0) searchRedeemable($(this).val(), "external");
		if($(this).val().length==0) loadPromotionTableExternal();

	})

	$('#searchPromoInternal').on('keyup', function(){

		if($(this).val().length > 0) searchRedeemable($(this).val(), "internal");
		if($(this).val().length==0) loadPromotionTableInternal("internalTable");

	})


})