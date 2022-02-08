const post = (url, parameters, callback) =>{

	$.ajax({

		url: url,
		type: "post",
		contentType: 'application/json',
		data:JSON.stringify(parameters),

		success: (result) => callback(null, result),
		error: (jqXHR, textStatus, errorThrown) => {
			
			callback(jqXHR.responseJSON, null)
      		
      		$.confirm({
      			icon: 'fa fa-warning',
      			title: "Error",
      			content: "Something went wrong",
      			buttons: {
      				"Ok": () => {
      					if(jconfirm.instances[0]) jconfirm.instances[0].close()
      				}
      			}
      		});
      		
      		return;

		}

	});

}

const get = (url, callback) =>{

	$.ajax({

		url: url,
		type: "get",
		success: (result) => callback(null, result),
		error: (jqXHR, textStatus, errorThrown) => {
			
			callback(jqXHR.responseJSON, null)

      		$.confirm({
      			icon: 'fa fa-warning',
      			title: "Error",
      			content: "Something went wrong",
      			buttons: {
      				"Ok": () => {
      					if(jconfirm.instances[0]) jconfirm.instances[0].close()
      				}
      			}
      		});

      		return;

		}

	});

}