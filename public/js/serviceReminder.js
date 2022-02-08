$(document).ready(function(){     
    
    const viewOnly = () => {

        // $('#btn_sentItems').hide();
        $('#btn_add').hide();

    }

    //Restriction
    let moduleRestriction;

    getModuleRestriction(restriction => {
        
        localStorage.setItem('serviceReminderRestriction', restriction);
      
        if(restriction!=2) viewOnly();
        // loadMemberTable();
    });

    let action = "add", sentItemsDetails, maxScheduleDate, typingTimer;
    const state = {};

    loadTemplateTable("");

    $('#btn_add').click(() => {

        action = "add";

        $('#formLabel').text('Add Template');

        $('#div_tblContainer').attr('class','col-md-5');
        $('#div_formContainer, #btn_back, #btn_save, #divFormButtons, #btn_addAttachment, #attachmentNote').show()

        $('#btn_edit, #btn_calendar, #btn_send, #btn_sentItems, .schedule, .recipients, #btn_cancel, #btn_saveSchedule, #btn_cancelSchedule').hide();

        $('#subject, #btn_addAttachment').prop('disabled', false);
        CKEDITOR.instances['body'].setReadOnly(false);

        clearTemplateForm();

        attachmentFormData = [];
        totalAttachmentSize = 0

    });

    $('#btn_edit').click(() => {

        action = "edit";

        $('#formLabel').text('Edit Template');
        $('.deleteAttachment').show();

        $('#div_formContainer, #btn_back, #btn_save, #divFormButtons, #btn_addAttachment, #btn_cancel, #attachmentNote').show()
        $('#btn_edit, #btn_calendar, #btn_send, #btn_sentItems, .recipients, .schedule').hide();

        $('#subject, #btn_addAttachment').prop('disabled', false);
        CKEDITOR.instances['body'].setReadOnly(false);



    })

    $('#btn_save').click(() => {

        if(validTemplateForm() == true){
            if(action == "add")
                saveTemplate(gatherTemplateData(), () => {
                    attachmentFormData = []
                })
            else{
                let updateTemplateData = gatherTemplateData()
                updateTemplateData.removedAttachment = removedAttachment;

                updateTemplate(updateTemplateData, () => {
                    attachmentFormData = [];
                    removedAttachment = [];
                    setTimeout(() => loadTemplate(localStorage.getItem('templateIdOnEdit'), result => {} ), 1000);
                });
            }
        }

    })

    $('#btn_back, #btn_back_sentItems').click(() => {

        $('#div_tblContainer').attr('class','col-md-12');
        $('#btn_sentItems, #div_tblContainer').show();
        $('#div_formContainer, #btn_back, #div_sentItemsContainer').hide();

    })

    $('#btn_cancel').click(() => {

        $('#btn_edit, #btn_calendar, #btn_send, #attachmentNote').show();
        $('#btn_cancel, #btn_addAttachment').hide();

        $('#subject').prop('disabled', true);
        CKEDITOR.instances['body'].setReadOnly(true);

        loadTemplate(localStorage.getItem('templateIdOnEdit'), result => {} );

    })

    $('body').on('click', '.deleteTemplate', function(e){

        localStorage.setItem('deleteClicked', true);
        e.stopPropagation();

        let yes = () => {
            deleteTemplate($(this).attr('id'));
            localStorage.setItem('deleteClicked', false);
        }

        let no = () => localStorage.setItem('deleteClicked', false);

        confirm("Confirmation", "Are you sure you want to delete this template?", {"Yes":yes, "No":no});

    })

    // Attachments
    $('#btn_addAttachment').click(function(){
        $('#attachment').click();
    });

    $('body').on('click', '.deleteAttachment', function(){
        
        deleteAttachment($(this).attr('id'), $(this).hasClass('uploaded'));
        $(this).closest('.attachmentDiv').remove();

    })

    $('#attachment').on('change', function(){

        for(let file of this.files){


            const fileSize = ((file.size/1024)/1024).toFixed(4); // MB
            const tempTotalFileSize = totalAttachmentSize+parseFloat(fileSize)

            if(fileSize > 5){
                confirm("Warning", `${file.name} is too big. Attachment must be less than 5mb.`, {"Ok": () => {} });
                break;
            }
            else if(tempTotalFileSize > 5){
                confirm("Warning", `Total attachment size must be less than 5mb.`, {"Ok": () => {} });
                break;
            }
            else{

                totalAttachmentSize += parseFloat(fileSize);

                displayAttachment([file]);
                attachmentFormData.push({'file': file, 'filename': file.name, 'size': fileSize}) 
            }
            
        }

    });
    
    $('#btn_send').click(() => {

        validateEmailSending((valid, recipients) => {
            if(valid == true){
                let query = `SELECT id, subject, body, attachments FROM bucketName USE KEYS '${localStorage.getItem('templateIdOnEdit')}'`

                post("/generic/query", {'query': query}, (err, result) => {
                    if(result){
                        let email = result[0];

                        email.to = $('#recipientsTo').val().join();
                        email.cc = $('#recipientsCc').val().join();
                        email.recipients = recipients;

                        loader("Sending Email", "Please wait...")

                        setTimeout(() => {

                            post("/serviceReminder/sendEmail", email, (err, res) => {
                                    closeLoader();
                                    confirm("Success", `Email sent!`, {"Ok": () => {} });
                            })

                        })
                    }
                });
            }
        })

    })

    $('#btn_calendar').click(() => {

        scheduleDate.min = getCurrentDate();

        $('.schedule').val('');

        $('.schedule, #btn_cancelSchedule, #btn_saveSchedule').show();
        $('#btn_send, #btn_edit, #btn_calendar').hide();

    })



    // Sent items
    $('#btn_sentItems').click(() => {
        $('#searchSentItem').val('');
        $('#div_sentItemsContainer').attr('class','col-md-12');
        $('#div_tblContainer, #btn_edit, #btn_send, #btn_calendar, #btn_cancel, #btn_cancelSchedule, .schedule, #attachmentNote').hide();
        $('#div_sentItemsContainer, #btn_saveSchedule').show();

        $('#sentStatus').val('Sent');

        loadSentItems();

    })

    $('#btn_cancelSchedule').click(() => {

        $('.schedule, #btn_saveSchedule, #btn_cancelSchedule').hide();
        $('#btn_calendar, #btn_edit, #btn_send').show();

    })

    $('#btn_saveSchedule').click(() => {

        const saveSched = () => {
            validateEmailSending((valid, recipients) => {
            
                if(valid == true){
                    let query = `SELECT id, subject, body, attachments FROM bucketName USE KEYS '${localStorage.getItem('templateIdOnEdit')}'`

                    post("/generic/query", {'query': query}, (err, result) => {
                        if(result){
                            let schedule = result[0];

                            schedule.to = $('#recipientsTo').val().join();
                            schedule.cc = $('#recipientsCc').val().join();
                            schedule.recipients = recipients;

                            schedule.scheduleDate = $('#scheduleDate').val();
                            schedule.scheduleTime = $('#scheduleTime').val();

                            setTimeout(() => {
                                saveSchedule(schedule);
                            }, 300);

                        }
                    });
                }
            })
        }

        if($('#scheduleDate').val() != '' && $('#scheduleTime').val() != ''){

            if($('#scheduleDate').val() == getCurrentDate()){

                if($('#scheduleTime').val() < getCurrentTime())
                    confirm("Warning", `Schedule should be at least 30 minutes subsequent to current time (${getCurrentTime()}).`, {"Ok": () => {} });

                else{
                    let schedTime = new Date("01/01/2007 "+ $('#scheduleTime').val());
                    let currentTime = new Date("01/01/2007 "+getCurrentTime());
                    
                    if(Math.floor(((schedTime-currentTime)/60000)) < 30)
                        confirm("Warning", `Schedule should be at least 30 prior to current time (${getCurrentTime()}).`, {"Ok": () => {} });
                    else
                        saveSched();    
                }
                
            }

            else if($('#scheduleDate').val() < getCurrentDate()){
                confirm("Warning", `Schedule should be present or future date.`, {"Ok": () => {
                    $('#scheduleDate').val('');
                } });
            }

            else
                saveSched();

        }

        

        else{
            if($('#scheduleDate').val() == '')
                confirm("Warning", `Schedule date cannot be empty`, {"Ok": () => {} });
            else
                confirm("Warning", `Schedule time cannot be empty`, {"Ok": () => {} });
        }

    })

    $('#scheduleDate').blur(function(){
        if($(this).val() < maxScheduleDate && $(this).val() != '')
            confirm("Warning", `Invalid ${$(this).attr('placeholder')}`, {"Ok": () => $(this).val('') });
    });

    $('#sentStatus').on('change', function(){

        $('#searchSentItem').val('');

        $('#div_sentItemsContainer').attr('class','col-md-12');
        $('#div_formContainer').hide();

        if($(this).val() == 'Sent')
            loadSentItems();
        
        
        else{
            $('#sentItems_pagination').hide();
            loadSchedules("", true);
        }
        
    })


    // Search
    $('#searchTemplate').on('keyup',function(e){

        const allowedCode = [8, 32, 221, 222];
        const keyCode = e.which;

        if((keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105) || (keyCode >= 186 && keyCode <= 219) || allowedCode.includes(keyCode)){
            if($(this).val().length > 0) loadTemplateTable($(this).val());
            else loadTemplateTable("");
        }

        else{
            if(keyCode == 220){
                if($(this).val().length > 1)
                loadTemplateTable("");
                $(this).val('');
            }
            e.preventDefault();
            return false;
        }

    })

    $('#searchSentItem').on('keyup', function(e){
        const allowedCode = [8, 32, 221, 222];
        const keyCode = e.which;
        clearTimeout(typingTimer);

        typingTimer = setTimeout(() => {
            searchSubject = $(this).val().length > 0 ? $(this).val() : null;

            if((keyCode >= 48 && keyCode <= 90) || (keyCode >= 96 && keyCode <= 105) || (keyCode >= 186 && keyCode <= 219) || allowedCode.includes(keyCode)){
                if($('#sentStatus').val() == 'Sent'){
                    loadSentItems();
                }

                else{
                    if($(this).val().length > 0) loadSchedules(searchSubject, false);
                    else loadSchedules("", true);
                }
            }

            else{
                e.preventDefault();
                return false;
            }

        }, 1000)
        
    })

})

