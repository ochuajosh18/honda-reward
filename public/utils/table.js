const initializeDataTable = (tableId, data, columns) => {

	columns.forEach((property, index) => columns[index] = {data: property});

	$(tableId).DataTable({
		searching: false,
		paging: false,
		info: false,
      	destroy: true,
      	data: data,
      	columns: columns
	});

	if(jconfirm.instances[0]) jconfirm.instances[0].close();
	
}
