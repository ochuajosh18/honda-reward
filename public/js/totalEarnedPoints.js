$(document).ready(function() {
    const state = {};

    const generateReport = () => {
        const status = $('#status').val();
        const transactionStart = $('#transactionStart').val();
        const transactionEnd = $('#transactionEnd').val();
        
        let requestBody = {
            query: `SELECT 
            trans.id AS transactionNumber,
            trans.transactionDate,
            trans.invoiceNumber,
            trans.orNumber,
            trans.posted,
            accessoriesPoints,
            generalPoints,
            goodsPoints,
            servicesPoints,
            totalPoints,
            
            member.cardNumber,
            member.lastName,
            member.firstName,
            CASE WHEN member.middleName == '' THEN ' - '  ELSE member.middleName END AS middleName, 
            CASE WHEN member.suffix == '' THEN ' - '  ELSE member.suffix END AS suffix
            
            FROM bucketName trans
            JOIN bucketName member ON KEYS trans.memberId 
            
            LET accessoriesPoints = TONUMBER(trans.transactionPerCategory.accessories.pointsEarned), 
            generalPoints = TONUMBER(trans.transactionPerCategory.general.pointsEarned), 
            goodsPoints = TONUMBER(trans.transactionPerCategory.goods.pointsEarned), 
            servicesPoints = TONUMBER(trans.transactionPerCategory.services.pointsEarned),
            totalPoints = TONUMBER(trans.totalPoints)
            
            WHERE trans.docType='TRANSACTION' AND trans.transactionType='EARN'
            ${ status ? `AND trans.posted=${status}` : '' }
            ${ transactionStart && transactionEnd ? `AND trans.transactionDate BETWEEN '${transactionStart}' AND '${transactionEnd}'` : '' }`
        }
       
        loader('Generating report', 'Please wait..');

        post("/generic/query", requestBody, (err, result) => {

            if (err) {
                console.log(err)
                if (jconfirm.instances[0]) jconfirm.instances[0].close();
                
                return;
            }

            setTimeout(() => {
                if (jconfirm.instances[0]) jconfirm.instances[0].close();
            }, 1000);

            loadReportTable(result);
        });
    };

    const loadReportTable = (data) => {
        $.fn.dataTable.moment('YYYY-MMM-DD');
        state.reportTable = $('#tblTransaction').DataTable({
            destroy: true,
            data,
            scrollX: true,
            scrollY: 300,
            scrollCollapse: true,
            autoWidth: false,
            pageLength: 100,
            dom: 'rtp',

            buttons: [
                {
                    extend: 'excelHtml5',
                    title: 'HCBT Elite Card Total Earned Points Report',
                    filename: 'HCBT Elite Card Total Earned Points Report',
                    footer: true,
                    text: 'Export',
                    className: 'btn btn-danger btn-sm'
                }
            ],

            columns: [
                //
                { data: 'transactionNumber', title: 'Transaction #' },
                {
                    data: 'transactionDate',
                    title: 'Transaction Date',
                    render: (data, type, row, meta) =>
                        moment(data).format('YYYY-MMM-DD')
                },
                { data: 'invoiceNumber', title: 'Invoice #' },
                { data: 'orNumber', title: 'OR #' },
                { data: 'cardNumber', title: 'Card #' },
                { data: 'lastName', title: 'Last name' },
                { data: 'firstName', title: 'First name' },
                { data: 'middleName', title: 'Middle name' },
                { data: 'suffix', title: 'Suffix' },
                { data: 'generalPoints', title: 'General Points' },
                { data: 'goodsPoints', title: 'Goods Points' },
                { data: 'accessoriesPoints', title: 'Accessories Points' },
                { data: 'servicesPoints', title: 'Services Points' },
                {
                    data: 'posted',
                    title: 'Status',
                    render: (data, type, row, meta) =>
                        data ? 'Posted' : 'Unposted'
                },
                { data: 'totalPoints', title: 'Total Points' }
            ],

            columnDefs: [
                {
                    targets: '_all',
                    className: 'dt-nowrap',
                    defaultContent:
                        '<span class="text-danger font-weight-bolder">X</span>'
                }
            ],

            footerCallback: function (row, data, start, end, display) {
                let api = this.api();
                let intVal = (i) => typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0;// Remove the formatting to get integer data for summation
                let total = api.column(14).data().reduce((a, b) => intVal(a) + intVal(b), 0); // Total over all pages
                
                $(api.column(11).footer()).html(total);
                
            }
        });
    }

    loadReportTable([]);

    $('#generate-report').on('click', function() {
        generateReport();
    });

    $('#export-report').on('click', function() {
        if (state.reportTable) {
            state.reportTable.button(0).trigger(); // export
        }
    });

    const currentDate = getCurrentDate();

    $('.dateRange').attr('max', currentDate)

    $('.dateRange').on('blur', function(){

        const transactionStart = $('#transactionStart').val(), transactionEnd = $('#transactionEnd').val();

        if(transactionStart != '' && transactionEnd != '' && (transactionStart > transactionEnd)){
            confirm("Warning", "Invalid date range",{
                    "Ok": () => {
                        $('#transactionStart').val('');
                        $('#transactionEnd').val('')
                    }
            });
        }

    });

});
