$('#btn_logout').click(function(){

    // localStorage.clearItem('permission', null);
    // localStorage.clearItem('userId', null);
    localStorage.clear();
    
	window.location.href="/";

})


const confirm = (title, content, buttons) => {

	$.confirm({
		theme: 'bootstrap',
	    title: title,
	    content: content,
	    buttons: buttons
	});

}

const dialog = (title, content) => {

	$.dialog({
	    title: title,
	    content: content,
	});

}

const loader = (title, content) => {
	$.dialog({
		icon: 'fa fa-spinner fa-spin',
	    title: title,
	    content: content,
	});
}

const closeLoader = () => { if(jconfirm.instances[0]) jconfirm.instances[0].close() };

const getPermission = callback => {

    const roleId = localStorage.getItem('permission');

	if(!roleId) callback(null);

	else{

		$.ajax({

			url: `/user/getPermission/${roleId}`,
			type: "get",
			success: (result) => callback(result)		

		});

	}

}

const restrictUser = () => {

	let module = window.location.pathname.replace('/', '');

	if(module=='redeem') module = "redeemPoints";
	else if(module=='redeemable') module = "services";
	else if(["eliteCardMasterfile","totalEarnedPoints","totalRedeemedPoints","memberLedger", "transactionLog"].includes(module)) module = "reports";
	
	getPermission(rolePermission => {

			const permission = rolePermission;

			if(permission == null) window.location.href='/';

			else{

				// Show / hide navigations

				// Show / hide entire admin list
				const adminModules =["user", "setup", "cardActivation", "transactionPosting", "services"];
				const permittedAdminModule = adminModules.filter(adminModule => permission[adminModule] > 0);
				if(permittedAdminModule.length == 0) $('#nav_administrator').hide();



				Object.keys(permission).forEach(property => {
					
						if(permission[property] > 0) $(`#nav_${property}`).show();
						else $(`#nav_${property}`).hide();
					
				});
				
				// Redirect user to dashboard if he tries to manual input url to restricted module
				// Redirect user to login if not yet logged in
				if(module != 'dashboard'){
						if(permission[module] > 0 || module == "changePassword") $('#mainContainerDiv').fadeIn();
						
						else{
							$('main').hide();
							if(permission[module] == 0) window.location.href='/dashboard';
							else window.location.href='/';
						} 
				}

			}	

	});

}

const getModuleRestriction = callback => {

	getPermission(rolePermission => {

			let module = window.location.pathname.replace('/', '');

			if(module=='redeem') module = "redeemPoints";
			else if(module=='redeemable') module = "services";

			callback(rolePermission[module]);

	});

}

if(window.location.pathname != "/") restrictUser();