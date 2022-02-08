CKEDITOR.replace('body',{

    "height": 300,
    "toolbar": [
        { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
        '/',
        { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat' ] },
        { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
        { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
        '/',
        { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
        { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
    ],
    "resize_enabled": false,
    "toolbarCanCollapse": true

});

$('#recipientsTo, #recipientsCc').select2();

let sentItemsList;

const loadTemplateTable = substring => {
    
    getModuleRestriction(restriction => {
        
        let query = `SELECT id,
                 ${restriction == 2 ?  `subject || '<img id=\"' || id || '\" class=\"deleteTemplate icon deleteIcon\" style=\"float: right\" src=\"../images/icons/delete.png\">' subject` : `subject`}
                 FROM bucketName
                 WHERE docType='SR::TEMPLATE'
                 ${substring.length > 0 ? `AND LOWER(subject) LIKE LOWER('%${substring}%')` : '' }`
                 
        loader('Loading templates', 'Please wait..');

        post("/generic/query", {'query': query}, (err, result) => {
            setTimeout(() => {
                const templateTable = $('#tblTemplate').DataTable({
                    destroy: true,
                    data: result,
                    scrollY: 300,
                    scrollCollapse: true,
                    autoWidth: false,
                    pageLength: 100,
                    dom: 'rtp',

                    columns: [
                        { data: 'subject', title: 'Subject'},
                        { data: 'id', title: 'id' }
                    ],
                    columnDefs: [
                        {
                            "targets": [ 1 ],
                            "visible": false,
                            "searchable": false
                        }
                    ],
                    rowCallback: (row, data, iDataIndex) => {

                        $(row).on('click', function() {

                            setTimeout(() => {
                                if(localStorage.getItem('deleteClicked') != "true"){
                                    
                                    $('.scheduler').val('');

                                    $('tr').removeClass('selectedRow');
                                    $(this).addClass('selectedRow');

                                    $('.schedule').hide();

                                    loadTemplate(data.id, result => {} );

                                    localStorage.setItem('templateIdOnEdit', data.id);

                                }
                            }, 300)

                        })

                    }
                });

                closeLoader();

            }, 300);
        }); 
    });
    
}

const validTemplateForm = () => {
    let validTemplateForm = true;

    if($('#subject').val().trim().length < 1 == true){
        validTemplateForm = false;
        confirm("Warning", `Subject cannot be empty`, {"Ok": () => {} });
        return false;
    }

    if(CKEDITOR.instances.body.document.getBody().getText().trim().length < 1 == true){
        validTemplateForm = false;
        confirm("Warning", `Body cannot be empty`, {"Ok": () => {} });
        return false;
    }

    return validTemplateForm;
}

const gatherTemplateData = () => {
   return { "subject": $('#subject').val(), "body": CKEDITOR.instances['body'].getData(), "attachments": attachmentFormData };
}

const clearTemplateForm = () => {
    $('#subject').val('');
    CKEDITOR.instances['body'].setData('');
    $('#div_attachments_img, #div_attachments_file').empty();
}

const createDirectory = (directoryName, folderName, callback) => {
    get(`/serviceReminder/createDirectory/${directoryName}/${folderName}`, (err, result) => {
        if(result) callback("success");
        else callback("error");
    })
}

const uploadAttachments = (attachmentFormData, directory, callback) => {
    if(attachmentFormData.length > 0) {

        let formData = new FormData();

        attachmentFormData.forEach(file => formData.append('uploads[]', file.file, file.filenames))

        loader("Uploading attachments", "<p id='uploadProgress'></p>")

        setTimeout(() => {
            $.ajax({
                async:true,
                url: `/serviceReminder/uploadTemplateAttachments/${directory}`,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function(){
                    
                },
                xhr: () => {
                var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            let percentComplete = `${Math.round((evt.loaded / evt.total)*100, 2)}%...`;
                            $('#uploadProgress').text(percentComplete);
                        }
                    }, false);
                    return xhr;
                },
                success: data => {
                    closeLoader();
                    callback("success");
                },
                error: error => callback("error")
            });
        }, 300) 
    }
    
    else callback("success")
}

const saveTemplate = (template, callback) => {
    loader("Saving template", "Please wait..");

    setTimeout(() => {
        post("/serviceReminder/createTemplate", template, (err, directory) => {
            if(directory){
                closeLoader();

                createDirectory('Service Reminder Templates', directory, result => {
                    if(result == "success"){

                        uploadAttachments(template.attachments, directory, result => {
                            if(result == "success"){
                                confirm("Success", "Template created!", {"Ok": () => {
                                    clearTemplateForm();
                                    loadTemplateTable("");
                                    callback();
                                } });
                            }
                            else confirm("Error", `Failed uploading attachments`, {"Ok": () => callback() });          
                        })

                    }
                    else confirm("Error", `Failed creating directory`, {"Ok": () => callback() });
                })  

            }
        })
    }, 300);
}

const saveSchedule = schedule => {
    
    let templateDirectory = localStorage.getItem('templateIdOnEdit').split('::')[2];

    loader("Saving schedule", "Please wait..");

    setTimeout(() => {
        post("/serviceReminder/createSchedule", schedule, (err, directory) => {
            if(directory){
                closeLoader();

                if(schedule.attachments.length > 0){
                    createDirectory('Schedules', directory, result => {
                        if(result == "success"){

                            get(`/serviceReminder/copyAttachments/${templateDirectory}/${directory}`, (err, result) => {
                                if(result == "success"){
                                    confirm("Success", "Schedule created!", {"Ok": () => {} });
                                }
                                else confirm("Error", `Failed moving files`, {"Ok": () => {} });
                            })

                        }
                        else confirm("Error", `Failed creating directory`, {"Ok": () => {} });
                    }) 
                }
                else
                    confirm("Success", "Schedule created!", {"Ok": () => {} });
            }
        })
    }, 300);
}

const deleteIcon = (id, className) => `<img id="${id}" class="${className}" src="../images/icons/delete.png">`

const imageAttachment = (source, name, status) => {
    $('#div_attachments_img').append(`<div class="attachmentDiv"><img class="attachment_img" src="${source}">${deleteIcon(name, `deleteAttachment deleteIcon ${status}`)}</div>`)
}

const fileAttachment = (filename, status) => {
    trimmedFilename = filename.length > 20 ? `${filename.substr(0,20)}...` : filename;
    $('#div_attachments_file').append(`<div class="attachmentDiv" style="padding: 10px;"><i class="fa fa-file"></i> <span style="margin-right: 25px;">${trimmedFilename}</span> ${deleteIcon(filename, `deleteAttachment deleteIcon ${status}`)}</div>`)
}

const displayAttachment = attachments => {
    attachments.forEach(attachment => {
        if(attachment.type.substr(0, 5) == 'image'){
            const reader = new FileReader();
            reader.onload = e => imageAttachment(e.target.result, attachment.name, 'forUpload')
            reader.readAsDataURL(attachment);
        }
        else fileAttachment(attachment.name, 'forUpload')
    });
}

const fillTemplateForm = template => {
    $('#subject').val(template.subject)
    CKEDITOR.instances['body'].setData(template.body)
}

const deleteAttachment = (attachmentName, uploaded) => {

    if(uploaded){
        let removedFile = originalAttachments.filter(attachment => attachment.filename == attachmentName);
        originalAttachments = originalAttachments.filter(attachment => attachment.filename != attachmentName);
        totalAttachmentSize = parseFloat(totalAttachmentSize-parseFloat(removedFile[0].size))
        console.log(totalAttachmentSize);
        removedAttachment.push(attachmentName)
    }

    else{
        let removedFile = attachmentFormData.filter(attachment => attachment.filename == attachmentName);
        attachmentFormData = attachmentFormData.filter(attachment => attachment.filename != attachmentName);
        totalAttachmentSize = (totalAttachmentSize-parseFloat(removedFile[0].size))
    }
    
}

const deleteTemplate = id => {
    loader("Deleting template", "Please wait..");

    setTimeout(() => {

        get(`/serviceReminder/delete/${id}`, (err, result) => {
            closeLoader();
            if(result) setTimeout(() => confirm("Success", "Template deleted!", {"Ok": () =>  loadTemplateTable("") }), 300)
        })

    }, 300)
}

const loadRecipients = () => {
    $('#recipientsTo, #recipientsCc').empty();

    let query = `SELECT lastName || ', ' || firstName || CASE WHEN middleName != '' THEN ', ' || middleName ELSE '' END || CASE WHEN suffix != '' THEN ', ' || suffix ELSE '' END AS name, email
                 FROM bucketName
                 WHERE docType="MEMBER"`

    post("/generic/query", {'query': query}, (err, result) => {
        if(result){
            result.forEach(member => $('#recipientsTo, #recipientsCc').append(`<option value="${member.email}">${member.name}</option>`))
        }
    }); 
}

const loadSentItemAttachment = sentItem => {
       
    loader("Loading attachment", "Please wait..")

    $('#div_attachments_img, #div_attachments_file').empty();

    setTimeout(() => {

        let ctr = 1;

        const imageExtensions = ["jpg", "jpeg", "png", "gif"];

        const getAttachment = () => {
            get(`/serviceReminder/getSentItemAttachment/${sentItem.id}/${sentItem.payload[ctr].body.attachmentId}`, (err, result) => {
                let extension = sentItem.payload[ctr].filename.split('.')[1];

                if(imageExtensions.includes(extension))
                    $('#div_attachments_img').append(`<div class="attachmentDiv"><img class="attachment_img" src="data:image/${extension};base64, ${result.replace(/-/g, '+').replace(/_/g,'/')}"></div>`)
                else{
                    let trimmedFilename = sentItem.payload[ctr].filename.length > 20 ? `${sentItem.payload[ctr].filename.substr(0,20)}...` : sentItem.payload[ctr].filename;
                    $('#div_attachments_file').append(`<div class="attachmentDiv" style="padding: 10px;"><i class="fa fa-file"></i> <span style="margin-right: 25px;">${trimmedFilename}</span></div>`)
                }
                ctr++;
                if(ctr < sentItem.payload.length) getAttachment();
                else closeLoader();
            });
        }

        getAttachment();
        
    }, 300)  
}

const loadSentItems = () => {

    $('#div_tblSchedule, #tblSentItems').hide();
    $('#div_tblSentItems').show();

    loader('Loading sent items', 'Please wait..');

    get(`/serviceReminder/getSentItemsList/${searchSubject}`, (err, result) => {
        
        searchSubject = null;

        if(result.length > 0){
            $('#sentItems_pagination').show();

            let totalPages = parseInt(result.length/5);

            totalPages = (result.length%5 > 0 ? totalPages+1 : totalPages)

            $('#sentItems_pagination').twbsPagination('destroy');
            
            $('#sentItems_pagination').twbsPagination({
                totalPages: totalPages,
                visiblePages: 5,
                first: '',
                last: '',
                onPageClick: function (event, page) {
                    
                    const from = page * 5 -5;
                    const pageData = result.filter((id, index) => index >= from && index <= from+4)

                    if(!jconfirm.instances[0])
                        loader('Loading sent items', 'Please wait..');

                    loadSentItemsTable(pageData)
                }
            });
        }
        else{
            $('#sentItems_pagination').hide();
            loadSentItemsTable([])
        }
        
    })

}

const loadSentItemsTable = sentItemIds => {

    setTimeout(() => {
        post(`/serviceReminder/getSentItems`, {'sentItemIds': sentItemIds}, (err, result) => {

            $('#tblSentItems').show();

            $('#tblSentItems').DataTable({
                destroy: true,
                data: result,
                scrollY: 300,
                scrollX: 300,
                fixedHeader: true,
                scrollCollapse: true,
                sortable: false,
                pageLength: 5,
                bPaginate: false,
                dom: 'rtp',
                destroy: true,
                columns: [
                    { data: 'subject', title: 'Subject', width: '20%'},
                    { data: 'to', title: 'To', width: '20%' },
                    { data: 'cc', title: 'Cc', width: '20%' },
                    { data: 'date', title: 'Date', width: '20%' },
                    { data: 'id', title: 'id', width: '20%' }
                ],
                columnDefs: [
                    {
                        "targets": [ 4 ],
                        "visible": false,
                        "searchable": false
                    }
                ],
                rowCallback: (row, data, iDataIndex) => {
                    $(row).off('click').on('click', function() {
                        
                        $('#divFormButtons, #btn_addAttachment, .recipients').hide();
                        $('#div_sentItemsContainer').attr('class','col-md-5');
                        $('#div_formContainer').fadeIn();

                        $('#formLabel').text('Sent Item Detail');

                        fillTemplateForm(data)

                        $('#subject').prop('disabled', true);
                        CKEDITOR.instances['body'].setReadOnly(true);

                        if(data.payload.length > 1){
                            loadSentItemAttachment(data);
                        }
                        
                    })
                }
            });

            closeLoader();

        })
    }, 300)

}

const loadTemplateAttachments = attachments => {

    const imageExtensions = ["jpg", "jpeg", "png", "gif"];

    $('#div_attachments_img').empty();
    $('#div_attachments_file').empty();

    attachments.forEach(attachment => {
        if(imageExtensions.includes(attachment.filename.split('.')[1])) 
            imageAttachment(attachment.path, attachment.filename, 'uploaded');
        else fileAttachment(attachment.filename, 'uploaded')
    })

    $('.deleteAttachment').hide();

}

const loadSchedules = (substring, firstLoad) => {

    let query = `SELECT id, subject, body, attachments, scheduleTime, scheduleDate, recipients
                 FROM bucketName
                 WHERE docType='SCHEDULE'
                 AND sent=false`;

    const buildScheduleTable = scheduleData => $('#tblSchedule').DataTable({
        destroy: true,
        data: scheduleData,
        scrollY: 300,
        scrollX: 300,
        scrollCollapse: true,
        autoWidth: false,
        pageLength: 100,
        dom: 'rtp',

        columns: [
            { data: 'subject', title: 'Subject', width: '20%'},
            { data: 'recipients', title: 'Recipient', width: '20%'},
            { data: 'scheduleDate', title: 'Schedule Date', width: '20%'},
            { data: 'scheduleTime', title: 'Schedule Time', width: '20%'},
            { data: 'id', title: 'id', width: '0'}
        ],
        columnDefs: [
            {
                "targets": [ 4 ],
                "visible": false,
                "searchable": false
            }
        ],
        rowCallback: (row, data, iDataIndex) => {
            $(row).off('click').on('click', function() {
                $('#searchSentItem').val('');
                $('#div_sentItemsContainer').attr('class','col-md-5');
                $('#div_formContainer').fadeIn();
                $('#btn_cancel, #btn_save, #btn_saveSchedule, #btn_addAttachment').hide();

                buildScheduleTable(JSON.parse(localStorage.getItem('schedData')));

                loadSchedule(data.id)
                
            })
        }
    });


    $('#div_tblSentItems').hide();
    $('#div_tblSchedule').show();

    if(substring != ""){
        const filteredData = JSON.parse(localStorage.getItem('schedData')).filter(sentItem => sentItem.subject.toLowerCase().includes(substring.toLowerCase()));

        buildScheduleTable(filteredData);
    }

    else if(firstLoad == true){

        loader('Loading scheduled email', 'Please wait..');

        setTimeout(() => {

            post("/generic/query", {'query': query}, (err, result) => {
                if(result){
                   
                    buildScheduleTable(result);
                    localStorage.setItem('schedData', JSON.stringify(result));
                    closeLoader();
                }
            });

        }, 300)    
    }
}

const loadSchedule = (id, callback) => {

    $('#formLabel').text('Schedule Details')

    let query = `SELECT id, subject, body, attachments, scheduleTime, scheduleDate FROM bucketName USE KEYS '${id}'`
    
    loader('Loading schedule', 'Please wait..');

    setTimeout(() => {

        post("/generic/query", {'query': query}, (err, result) => {
            if(result){
                
                fillTemplateForm(result[0]);

                loadTemplateAttachments(result[0].attachments)
                $('#subject').prop('disabled', true);
                CKEDITOR.instances['body'].setReadOnly(true);
                closeLoader();
            }
        });

    }, 300)
     
}


const loadTemplate = (id, callback) => {
    
    $('#formLabel').text('Send Template')

    $('#div_tblContainer').attr('class','col-md-5');

    $('#btn_sentItems, #attachmentNote').hide();

    let query = `SELECT id, subject, body, attachments FROM bucketName USE KEYS '${id}'`
    
    loader('Loading template', 'Please wait..');

    setTimeout(() => {

        post("/generic/query", {'query': query}, (err, result) => {
            if(result){
                fillTemplateForm(result[0]);

                $('#subject').prop('disabled', true);
                CKEDITOR.instances['body'].setReadOnly(true);

                $('#btn_edit, #btn_calendar, #btn_send, .recipients, #div_formContainer, #btn_back, #divFormButtons').show();

                // Restrict actions if user has no permission to edit
                if(localStorage.getItem('serviceReminderRestriction') != 2){
                    $('.recipients, #btn_edit, #btn_calendar, #btn_send, #attachmentNote').hide();
                }


                loadRecipients();

                originalAttachments = result[0].attachments;

                totalAttachmentSize = result[0].attachments.reduce((totalSize, attachment) => totalSize + parseFloat(attachment.size), 0 );

                loadTemplateAttachments(result[0].attachments);

                $('#btn_save, #btn_addAttachment, #btn_cancel, #btn_saveSchedule, #btn_cancelSchedule').hide();

                setTimeout(() => {
                    closeLoader();

                    callback(result[0]);
                }, 300)
            }
        });

    }, 300)
     
}

const updateTemplate = (template,callback) => {

    loader("Updating template", "Please wait..");

    let query = `SELECT attachments, id FROM bucketName USE KEYS '${localStorage.getItem('templateIdOnEdit')}'`

    setTimeout(() => {
        post("/generic/query", {'query': query}, (err, result) => {
            if(result){
                
                template.originalAttachments = result[0].attachments;
                template.id = result[0].id;
                post("/serviceReminder/updateTemplate", template, (err, directory) => {
                    if(directory){
                        closeLoader();
                        uploadAttachments(template.attachments, directory, result => {
                            if(result == "success"){
                                confirm("Success", "Template updated!", {"Ok": () => {
                                    loadTemplateTable("");
                                    callback();
                                } });
                            }
                            else confirm("Error", `Failed uploading attachments`, {"Ok": () => {} });          
                        })  

                    }
                })

            }
        }); 
    }, 300);

}

const validateEmailSending = callback => {

    let recipients = [];

    $(".selectRecipients option:selected").each(function () {
       if($(this).length>0) {
        if(recipients.indexOf($(this).text()) < 0) recipients.push($(this).text());
       }
    });

    if(recipients.length > 0) callback(true, recipients)

    else confirm("Warning", `Please select recipient/s`, {"Ok": () => callback(false, null) });

}