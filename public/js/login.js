$(document).ready(function(){
    if (localStorage.getItem("userId")) {
        window.location.href="/dashboard"
    }

	let authenticating = false;

	const authenticate = () => {

		loader("Authenticating", "Please wait..");

		if(!authenticating){

			authenticating = true;

			const credentials = {
				'userName': $('#userName').val(),
				'password': $('#password').val()
			}

			$.ajax({

				url: "/authentication/authenticate",
				type: "post",
				contentType: 'application/json',
				data:JSON.stringify(credentials),
				success: (result) => {
					
					setTimeout(() => {

						closeLoader();

						if(result.error == null){
							localStorage.setItem("userId", result.user.id);
							localStorage.setItem("permission", result.user.roleId);
							
							window.location.href="/dashboard";
						}

						else{
							confirm("Warning", result.error,
								{"Ok": () => {
									$('#btn_login').prop('disabled', false);
									authenticating = false;
								}
							});
						}
					}, 1000)
		
				} 

			});

		}

	}

	const doPrevent = e => {

		e.preventDefault();
  		e.stopPropagation();

	}

	$(document).keydown(function(e){

		if(authenticating) return false;

		else if(e.which==13 && !authenticating){
			$(document).on('keydown', doPrevent)
			if($('#btn_login').attr('disabled') == undefined) $('#btn_login').trigger("click");
		}

	})

	$('#btn_login').click(authenticate);

	$('input').on('focus', () => {

		$(document).off('keydown', doPrevent)

	});

	$('.forgotPassword').click(() => {

		$.confirm({
		    title: 'Forgot Password?',
		    content: '' +
		    '<form action="" class="formName">' +
		    '<div class="form-group">' +
		    '<label>Please enter your username</label>' +
		    '<input type="text" placeholder="Username" class="userName form-control" required />' +
		    '</div>' +
		    '</form>',
		    buttons: {
		        formSubmit: {
		            text: 'Submit',
		            btnClass: 'btn-blue',
		            action: function () {

		                const userName = this.$content.find('.userName').val();

		                if(!userName){
		                    $.alert('Username cannot be empty!');
		                    return false;
		                }

		                let requestBody = {
						            query: `SELECT email
						            FROM bucketName 
						            WHERE docType='USER' AND LOWER(userName)=LOWER('${userName}')`
						        };

				        		post("/generic/query", requestBody, (err, result) => {
				            
					            if (err) {
					                alert('Something went wrong');
					                return;
					            }

					            if(result.length > 0){
					            	
					            	loader("Sending email", "Please wait..");

					            	setTimeout(() =>{

					            		get(`/user/forgotPassword/${userName}/${result[0].email}`, res => confirm("Success", `Your temporary password was sent to your email.`, {"Ok": () => closeLoader() }))

					            	}, 400)
					            	
					            }
				            	
				            	else confirm("Warning", `User not found`, {"Ok": () => {} });

						        });
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

	})

})