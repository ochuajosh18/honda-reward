$(document).ready(function () {
    const state = {};

    const generateReport = () => {
        const membershipStart = $('#membershipStart').val();
        const membershipEnd = $('#membershipEnd').val();
        const expirationStart = $('#expirationStart').val();
        const expirationEnd = $('#expirationEnd').val();
        const membershipThru = $('#membershipThru').val();
        const status = $('#status').val();
        
        let requestBody = {
            query: `SELECT 
            m.id, 
            m.cardNumber, 
            m.lastName,
            m.firstName,
            CASE WHEN m.middleName == '' THEN ' - '  ELSE m.middleName END AS middleName, 
            CASE WHEN m.suffix == '' THEN ' - '  ELSE m.suffix END AS suffix, 
            m.status, 
            m.membershipDate, 
            m.validThru,
            m.membershipThru,
            m.birthdate,
            m.civilStatus,
            m.address || ', ' || m.province as address,
            m.email,
            m.mobileNumber,
            m.companyName,
            m.companyAddress,
            m.position,
            m.registrationNumber,
            m.companyPhoneNumber,
            m.faxNumber,
            m.autorizedPerson,
            m.endorsedBy,
            u.name as encodedBy
            
            FROM bucketName m
            LEFT JOIN bucketName u ON KEYS m.createdBy

            WHERE m.docType='MEMBER'
            ${status ? ` AND m.status='${status}'` : '' }
            ${membershipThru ? ` AND m.membershipThru='${membershipThru}'` : '' }
            ${membershipStart && membershipEnd ? ` AND m.membershipDate BETWEEN '${membershipStart}' AND '${membershipEnd}'` : '' }
            ${expirationStart && expirationEnd ? ` AND m.validThru BETWEEN '${expirationStart}' AND '${expirationEnd}'` : '' }
            
            ORDER BY m.name`
        };

        loader("Generating report", "Please wait..");

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
    }

    const loadReportTable = (data) => {
        $.fn.dataTable.moment('YYYY-MMM-DD');
        state.memberTable = $('#tblMember').DataTable({			    
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
                    extend    : 'excelHtml5',
                    title     : 'HCBT Elite Card Masterfile Report',
                    filename  : 'HCBT Elite Card Masterfile Report',
                    text      : 'Export',
                    className : 'btn btn-danger btn-sm'
                }
            ],
            
            columns:  [
                // 
                { data: 'cardNumber' , title: 'Card #' }, 
                { data: 'lastName', title: 'Last name' },
                { data: 'firstName', title: 'First name' },
                { data: 'middleName', title: 'Middle name' },
                { data: 'suffix', title: 'Suffix' },
                { data: 'status', title: 'Status' },
                { data: 'membershipDate', title: 'Date of application'},
                { data: 'validThru', title: 'Expiration date'},
                { data: 'membershipThru', title: 'Membership Thru'},

                { data: 'birthdate', title: 'Birthday'},
                { data: 'civilStatus', title: 'Civil Status'},
                { data: 'address', title: 'Address'},
                { data: 'email', title: 'Email address'},
                { data: 'mobileNumber', title: 'Mobile #'},

                { data: 'companyName', title: 'Company'},
                { data: 'companyAddress', title: 'Company address'},
                { data: 'position', title: 'Position'},
                { data: 'companyPhoneNumber', title: 'Company #'},
                { data: 'faxNumber', title: 'Fax #'},

                { data: 'autorizedPerson', title: 'Authorized person'},
                { data: 'endorsedBy', title: 'Endorsed by'},
                { data: 'encodedBy', title: 'Encoded by'},

                // Registration number in 3 columns
                {
                    data: 'registrationNumber',
                    title: 'Registration Number 1',
                    render:function(data, type, full, meta){

                        if(full.registrationNumber[0])
                            return `CS#: ${full.registrationNumber[0].csNumber}, Plate#: ${full.registrationNumber[0].plateNumber}`;
                        else
                            return `<span class="text-danger font-weight-bolder">N/A</span>`

                    }
                },
                {
                    data: 'registrationNumber',
                    title: 'Registration Number 2',
                    render:function(data, type, full, meta){

                        if(full.registrationNumber[1])
                            return `CS#: ${full.registrationNumber[1].csNumber}, Plate#: ${full.registrationNumber[1].plateNumber}`;
                        else
                            return `<span class="text-danger font-weight-bolder">N/A</span>`
                              
                    }
                },
                {
                    data: 'registrationNumber',
                    title: 'Registration Number 3',
                    render:function(data, type, full, meta){

                        if(full.registrationNumber[2])
                            return `CS#: ${full.registrationNumber[2].csNumber}, Plate#: ${full.registrationNumber[2].plateNumber}`;
                        else
                            return `<span class="text-danger font-weight-bolder">N/A</span>`
                              
                    }
                }

                // Registration number in 1 column
                // {
                //     data: 'registrationNumber',
                //     title: 'Registration Number',
                //     render:function(data, type, full, meta){

                //         if(full.registrationNumber.length == 0)
                //             return `<span class="text-danger font-weight-bolder">N/A</span>`
                //         else{
                //             let registrationNumbers = "";

                //             full.registrationNumber.forEach(rNumber => registrationNumbers += `CS: ${rNumber.csNumber} P: ${rNumber.plateNumber}, <br>`)

                //             return registrationNumbers;
                //         }
                      
                //     }
                // }

            ],

            columnDefs: [
                { targets: '_all', className: 'dt-nowrap' },
                { 
                    targets: [6, 7, 9], 
                    render: (data, type, row, meta) => {
                        if (!data) {
                            return '<span class="text-danger font-weight-bolder">N/A</span>'
                        }

                        if (moment(data).format('YYYY') == '9999') {
                            return 'Lifetime'
                        }

                        return moment(data).format('YYYY-MMM-DD');
                    }
                },
                { 
                    targets: '_all', 
                    render: (data, type, row, meta) => data || '<span class="text-danger font-weight-bolder">N/A</span>'
                }
            ],

            rowCallback: (row, data, displayNum, displayIndex, dataIndex) => {
                $(row).attr('id', data.id);
            }
        });
    }


    $('#generate-report').on('click', function() {
        generateReport();
    });

    $('#export-report').on('click', function() {
        if (state.memberTable) {
            state.memberTable.button(0).trigger(); // export
        }
    });

    const currentDate = getCurrentDate();
    
    $('.dateRange').attr('max', currentDate)

    $('.dateRange').on('blur', function(){

        let transactionStart = $('#membershipStart').val(), transactionEnd = $('#membershipEnd').val();

        if(transactionStart != '' && transactionEnd != '' && (transactionStart > transactionEnd)){
            confirm("Warning", "Invalid date range",{
                    "Ok": () => {
                        $('#membershipStart').val('');
                        $('#membershipEnd').val('')
                    }
            });
        }

        transactionStart = $('#expirationStart').val(), transactionEnd = $('#expirationEnd').val();

        if(transactionStart != '' && transactionEnd != '' && (transactionStart > transactionEnd)){
            confirm("Warning", "Invalid date range",{
                    "Ok": () => {
                        $('#expirationStart').val('');
                        $('#expirationEnd').val('')
                    }
            });
        }

    });
});