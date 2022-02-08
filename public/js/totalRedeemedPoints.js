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
            ABS(trans.totalPoints) totalPoints,

            member.cardNumber,
            member.lastName,
            member.firstName,
            CASE WHEN member.middleName == '' THEN ' - '  ELSE member.middleName END AS middleName, 
            CASE WHEN member.suffix == '' THEN ' - '  ELSE member.suffix END AS suffix

            FROM bucketName trans 
            JOIN bucketName member ON KEYS trans.memberId 
            
            WHERE trans.docType='TRANSACTION' AND trans.transactionType='REDEEM'
            ${ status ? `AND trans.posted=${status}` : '' }
            ${ transactionStart && transactionEnd ? `AND trans.transactionDate BETWEEN '${transactionStart}' AND '${transactionEnd}'` : '' }`
        }

        loader('Generating report', 'Please wait..');

        post("/generic/query", requestBody, (err, result) => {
            if (err) {
                alert('Something went wrong');
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
                    title: 'HCBT Elite Card Total Redeemed Points Report',
                    filename: 'HCBT Elite Card Total Redeemed Points Report',
                    footer: true,
                    text: 'Export',
                    className: 'btn btn-danger btn-sm'
                }
            ],

            columns: [
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
                let total = api.column(10).data().reduce((a, b) => intVal(a) + intVal(b), 0); // Total over all pages

                $(api.column(7).footer()).html(total.toFixed(2));
                
            }
        });
    };

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
