$(document).ready(function() {
    const state = {};

    const loadMemberTable = () => {
        let parameters = { 
            fields: "cardNumber, lastName || ', ' || firstName || CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END || CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END as name", 
            conditions: ""
        }

		loader("Loading member list", "Please wait..");

		post("/membership/get", parameters, (err, result) => {
            if (err) {
                alert('Something went wrong');
                if (jconfirm.instances[0]) jconfirm.instances[0].close();
                
                return;
            }

            setTimeout(() => {
                if (jconfirm.instances[0]) jconfirm.instances[0].close();
            }, 1000);

            state.memberTable = $('#tblMember').DataTable({
                destroy: true,
                data: result,
                // scrollX: true,
                scrollY: 300,
                scrollCollapse: true,
                autoWidth: false,
                pageLength: 100,
                dom: 'rtp',
    
                columns: [
                    //
                    { data: 'cardNumber', title: 'Card #', width: 100 },
                    { data: 'name', title: 'Member Name' }
                ],

                rowCallback: (row, data, iDataIndex) => {
                    $(row).on('click', function() {
                        $('.selectedRow').removeClass('selectedRow');
                        $(row).addClass('selectedRow');
                        setMemberDetails(data)
                    })
                }
            });
        });
    }

    $('#report-screen').hide();
    loadMemberTable();

    const setMemberDetails = data => {
        const { cardNumber, name } = data;

        $('#cardNumberText').text(cardNumber);
        $('#memberNameText').text(name);

        $('#cardNumber').val(cardNumber);
        $('#memberName').val(name);
    };

    const generateReport = () => {
        const cardNumber = $('#cardNumber').val();
        const memberName = $('#memberName').val();
        const transactionStart = $('#transactionStart2').val();
        const transactionEnd = $('#transactionEnd2').val();
        const transactionType = $('#transactionType2').val();

        let requestBody = {
            query: `SELECT 
            trans.id AS transactionNumber,
            trans.transactionDate,
            trans.transactionType,
            trans.totalPoints,
            CASE WHEN trans.transactionType='EARN' THEN trans.totalConversion ELSE ABS(trans.totalPoints*25) END AS totalAmount
            
            FROM bucketName trans
            JOIN bucketName member ON KEYS trans.memberId 
            
            WHERE trans.docType='TRANSACTION' AND trans.cardNumber='${cardNumber}'
            ${ transactionType ? `AND trans.transactionType='${transactionType}'` : '' }
            ${ transactionStart && transactionEnd ? ` AND trans.transactionDate BETWEEN '${transactionStart}' AND '${transactionEnd}'` : '' }`
        };

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

            loadReportTable(result, { cardNumber, memberName });
        });
    };

    const computeTotal = (column, typeColumn, type) => {
        
        let total = 0;

        Object.keys(column).forEach((property, index) => {
            if(!isNaN(property)){
                if(typeColumn[index] == type) total += Math.abs(column[index]);
            }
        })

        return total.toFixed(2);

    }

    const loadReportTable = (data, { cardNumber, memberName }) => {
        $.fn.dataTable.moment('YYYY-MMM-DD');

        const breakLine = {
            exportOptions: {
                format: {
                    body: function ( data, row, column, node ) {
                        return column === 5 ?
                            data.replace( /[<br>]/g, '\n' ) :
                            data;
                    }
                }
            }
        };

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
                    title: 'HCBT Elite Card Member Ledger',
                    messageTop: `${cardNumber} ${memberName}`,
                    filename: 'HCBT Elite Card Member Ledger',
                    footer: true,
                    text: 'Export',
                    exportOptions: { stripNewLines: false },
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
                { data: 'transactionType', title: 'Transaction Type' },
                { data: 'totalAmount', title: 'Total Amount' },
                { 
                    data: 'totalPoints', 
                    title: 'Total Points',
                    render: (data, type, row, meta) => {
                        return data < 0 ? `<span class="text-danger font-weight-bolder">${Math.abs(data)}</span>` : `<span class="text-success font-weight-bolder">${Math.abs(data)}</span>`;
                    } 
                }
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

                $('tr:eq(0) th:eq(0)', api.table().footer()).html(`TOTAL EARNED AMOUNT: ${computeTotal(api.column(3).data(), api.column(2).data(), 'EARN')}`); // total earned amount
                $('tr:eq(0) th:eq(1)', api.table().footer()).html(`TOTAL EARNED POINTS: ${computeTotal(api.column(4).data(), api.column(2).data(), 'EARN')}`); // total earned points
                $('tr:eq(0) th:eq(3)', api.table().footer()).html(`TOTAL REDEEMED AMOUNT: ${computeTotal(api.column(3).data(), api.column(2).data(), 'REDEEM')}`); // total redeemed amount
                $('tr:eq(0) th:eq(4)', api.table().footer()).html(`TOTAL REDEEMED POINTS: ${computeTotal(api.column(4).data(), api.column(2).data(), 'REDEEM')}`); // total redeemed points

            }
        });
    }

    $('#search-input').keyup(function() {
        state.memberTable.search($(this).val()).draw() ;
    })

    $('#generate-report').on('click', function() {
        // generateReport();
        const cardNumber = $('#cardNumber').val();
        const memberName = $('#memberName').val();
        const transactionStart = $('#transactionStart').val();
        const transactionEnd = $('#transactionEnd').val();
        const transactionType = $('#transactionType').val();

        if (!cardNumber) {
            alert('Select a member.');
            return;
        }

       
        // loader("Generating report", "Please wait..");

        $('#initial-screen').fadeOut(function() {
            $('#report-screen').fadeIn();

            $('#cardNumberText2').text(cardNumber);
            $('#memberNameText2').text(memberName);
            $('#transactionStart2').val(transactionStart);
            $('#transactionEnd2').val(transactionEnd);
            $('#transactionType2').val(transactionType);

            // loadReportTable([]);
            generateReport();

            setTimeout(() => {
                if (jconfirm.instances[0]) jconfirm.instances[0].close();
            }, 1000);
        });
    });

    // Report screen
    $('#back-button').on('click', function() {
        // generateReport();

        $('#report-screen').fadeOut(function() {
            $('#initial-screen').fadeIn();
        });
    });

    $('#generate-report2').on('click', function() {
        generateReport();
    });

    $('#export-report').on('click', function() {
        if (state.reportTable) {
            state.reportTable.button(0).trigger(); // export
        }
    });

    // event shadow
    $('#transactionStart2').on('change', function() {
        $('#transactionStart').val(this.value);
    });

    $('#transactionEnd2').on('change', function() {
        $('#transactionEnd').val(this.value);
    });

    $('#transactionType2').on('change', function() {
        $('#transactionType').val(this.value);
    });

    const currentDate = getCurrentDate();

    $('.dateRange').attr('max', currentDate)

    $('.dateRange').on('blur', function(){

        let transactionStart = $('#transactionStart').val(), transactionEnd = $('#transactionEnd').val();

        if(transactionStart != '' && transactionEnd != '' && (transactionStart > transactionEnd)){
            confirm("Warning", "Invalid date range",{
                    "Ok": () => {
                        $('#transactionStart').val('');
                        $('#transactionEnd').val('')

                        $('#transactionStart2').val('');
                        $('#transactionEnd2').val('')
                    }
            });
        }
    });
});
