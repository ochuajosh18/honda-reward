$(document).ready(function() {
    const state = {};

    loadMemberTable();

    function previewFrontCard({cardName, cardNumber, birthdate, validThru }) {

        const fontSize = 70 - cardName.length > 0 ? 70 - cardName.length : 20;

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = $('#frontImage').width();
        canvas.height = $('#frontImage').height();

        loader('Generating card', 'Please wait..');

        const printSide = $("input[name='printSide']:checked").val();
        ctx.clearRect(
            0,
            0,
            $('#frontImage').width(),
            $('#frontImage').height()
        );

        if (printSide == 'front') {
            ctx.drawImage($('#frontImage').get(0), 0, 0);

            ctx.fillStyle = '#fff';
            ctx.font = '50pt Times New Roman';
            ctx.textAlign = 'start';
            ctx.fillText(
                `Valid until : ${moment(validThru).format('MMMM DD, YYYY')}`,
                40,
                $('#frontImage').height() - 40
            );

            ctx.strokeStyle = '#0000';
            ctx.moveTo(1200, 600);
            ctx.lineTo(1200, 1000);
            ctx.stroke();

            //refill text
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';

            ctx.font = `bold ${fontSize}pt Times New Roman`;
            ctx.fillText(cardName, 1200, 835);

            ctx.font = '50pt Times New Roman';
            ctx.fillText(moment(birthdate).format('MMMM DD, YYYY'), 1200, 925);

            $('#printCardFront').attr('src', canvas.toDataURL());
            $('#preview2').attr('src', canvas.toDataURL());

            setTimeout(() => {
                jconfirm.instances[0].close();
            }, 1000);
        } else {
            JsBarcode('#barcode', cardNumber, {
                fontSize: 40,
                width: 7.5,
                height: 200
            });

            setTimeout(() => {
                ctx.drawImage($('#backImage').get(0), 0, 0);
                ctx.drawImage(
                    $('#barcode').get(0),
                    $('#frontImage').width() / 2 - 320,
                    680
                );

                $('#printCardFront').attr('src', canvas.toDataURL());
                $('#preview2').attr('src', canvas.toDataURL());

                jconfirm.instances[0].close();
            }, 1000);
        }
    }

    $("input[name='printSide']").on('change', function() {
        $('tr.selectedRow').click();
    });

    $('#print').click(function() {
        if ($('tr.selectedRow').length > 0) {
            printData();
        } else {
            alert('Select a member.');
        }
    });

    $('#search-input').keyup(function() {
        state.memberTable.search($(this).val()).draw();
    });

    function printData() {
        var divToPrint = document.getElementById('printCardFront');
        const newWin = window.open('');

        newWin.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Card Printing</title>
            <style>
                @page{
                    margin-left: 0px;
                    margin-right: 0px;
                    margin-top: 0px;
                    margin-bottom: 0px;
                    size: landscape;
                }

                @media print{
                    /* All styles for print should goes here */
                    html, body, #printCardFront{
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        
                    }
                }
            </style>
        </head>
        <body>
            ${divToPrint.outerHTML}
        </body>
        </html>`);

        newWin.print();
        newWin.document.close();
        setTimeout(function() {
            newWin.close();
        }, 10);
    }

    function loadMemberTable() {
        let parameters = {
            fields: `id, cardNumber, birthdate, validThru,
                    lastName || ', ' || firstName || CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END || CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END as name,
                    firstName || ' ' || CASE WHEN middleName != '' THEN SUBSTR(middleName, 0, 1) || '.' ELSE '' END || ' ' || lastName || CASE WHEN suffix != '' THEN ' ' || suffix ELSE '' END as cardName`,
            conditions: "AND status='active'"
        };

        loader('Loading member list', 'Please wait..');

        post('/membership/get', parameters, (err, result) => {
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
                    $(row).attr('id', data.id);

                    $(row).off('click').on('click', function() {
                        $('.selectedRow').removeClass('selectedRow');
                        $(row).addClass('selectedRow');

                        previewFrontCard(data);
                    });
                }
            });
        });
    }
});
