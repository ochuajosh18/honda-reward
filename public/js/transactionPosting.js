$(document).ready(function(){


    const viewOnly = () => {

      $('#postTransaction').hide();
      $('#btn_save').hide();
      $('#btn_delete').hide();
      $('#addItem').hide();
      $('.field').attr('disabled', 'disabled');

    }


    //Restriction
    let moduleRestriction;

    getModuleRestriction(restriction => {
      
      moduleRestriction = restriction;
      if(moduleRestriction!=2) viewOnly();

    });


    //set maximum date today
    const currentDate = new Date().toISOString().split("T")[0];


    let itemsToRedeem = [], redeemableId, memberId, redeemablePoints, transactionType, promotionId, promo, transactionId, redeemType;


    $('#startDate').attr("max", currentDate);
    $('#endDate').attr("max", currentDate);
    $('#transactionDate').attr("max", currentDate);

    let dateRange = {};

    const validDateRange = () => { 

        if($('#startDate').val() == "") return "Start date cannot be empty";
        else if($('#endDate').val() == "") return "End date cannot be empty";
        else return true;

    };

    const loadLastPostDate = () => {

        get(`/transaction/getById/lastPostDate`, (err, postingData) => {
          if(postingData) $('#lastPostDate').text(postingData.lastPostDate);
        })

    }

    const loadUnpostedTransactionTable = () => {

        loader("Loading transactions table", "Please wait..");

        get(`/transaction/getUnpostedTransactions/${$('#startDate').val()}/${$('#endDate').val()}`, (err, result) => {
          
          if(result) {

              result.forEach((row, index) => {
                
                row.customerName = `${row.lastName}, ${row.firstName}${row.middleName}${row.suffix}`
                row.no = index+1
                row.unpostedPoints = `<span class="unpostedPoints" memberId='${row.memberId}'>${row.unpostedPoints}</span>`;

              });

              setTimeout(() => {

                initializeDataTable('#tblUnpostedTransaction', result, ["checkBox", "no", "cardNumber", "customerName", "currentPoints", "unpostedPoints", "projectedPoints"])
                if(moduleRestriction != 2) $('input[type="checkbox"]').attr('disabled', 'disabled');
                $('#tblUnpostedTransaction').fadeIn();

              }, 400);
              
          }
        
        })

    }

    const loadUnpostedTransactionByMember = memberId => {

        setTimeout(() => {

            let parameters = {
                "fields": `id, transactionType, transactionDate`,
                "conditions": `AND memberId='${memberId}' AND transactionDate between '${dateRange.startDate}' AND '${dateRange.endDate}' AND posted=false`
            }
            
            post("/transaction/get", parameters, (err, result) => {
                if(result){
                  
                    initializeDataTable('#tblTransaction', result, ["id", "transactionType", "transactionDate"]);
                    $('#div_transactionEditing').show();

                } 
            })

        },400)

    }

    const validTransaction = () => {

        let validTransactionForm = true;

        if(transactionType == "EARN") validTransactionForm = validEarnTransaction();

        else{
          if(itemsToRedeem.length < 1 && redeemType == "ITEM/SERVICE"){
            confirm("Warning", `Please select item/service to be redeemed`, {"Ok": () => {} });
            validTransactionForm = false;
          }
          else validTransactionForm = validRedeemTransaction(redeemType);
        }

        return validTransactionForm;

    }

    const fillTransactionForm = transaction => {

        transactionType = transaction.transactionType;

        $('#div_transactionEditingForm').fadeIn();

        loader("Loading transaction", "Please wait..");

        if(transaction.transactionType == "EARN"){
          $('#div_totalConversion').fadeIn();
          fillEarnForm(transaction, activatedPromo => promo = activatedPromo);
        }
        else{ 
            
            redeemType = transaction.redeemType;

            $('#div_totalConversion').hide();

            if(transaction.redeemType == 'ITEM/SERVICE'){
              redeemableId = transaction.redeemedItems.length;
              itemsToRedeem = transaction.redeemedItems;

              itemsToRedeem.forEach((item, index) => {
                item.delete = (moduleRestriction == 2 ? `<img redeemableId="${index}" class="delete icon removeItem" style="float: right" src="../images/icons/delete.png">` : '');
                item.id = index;
              })
            }
          
            fillRedeemForm(transaction, memberId, itemsToRedeem, points => redeemablePoints = points);
        } 

    }

    const gatherTransactionData = () => {

        let data = {};

        if(transactionType == 'EARN') data = gatherEarnForm(promo.id);

        else data = gatherRedeemForm(itemsToRedeem, redeemType);

        return data;

    }

    const updateTransaction = transaction => {

        transaction.id = transactionId;
        transaction.transactionType = transactionType;

        loader("Updating transaction", "Please wait..");

        setTimeout(() => {

          if(transactionType == "EARN"){
            post("/transaction/update", transaction, (err, result) => {
              if(result){
                closeLoader();
                confirm("Success", "Transaction updated!", {"Ok": () => {} });
              }
            })
          }

          else{

              if(redeemablePoints - (parseFloat(transaction.totalPoints)) >= 0){

                  if(redeemType == "ITEM/SERVICE") transaction.redeemedItems = itemsToRedeem;

                  transaction.redeemablePoints = redeemablePoints - (parseFloat(transaction.totalPoints));
                  transaction.memberId = memberId;

                  post("/transaction/update", transaction, (err, result) => {
                    if(result){
                      closeLoader();
                      confirm("Success", "Transaction updated!", {"Ok": () => {

                        $('#redeemablePoints').text(redeemablePoints.toFixed(2))

                      } });
                    }
                  })

              }

              else{
                  closeLoader();
                  confirm("Warning", `Insufficient points`, {"Ok": () => {} });
              }

          }

        }, 400)

    }

    const deleteTransaction = () => {

        get(`/transaction/delete/${transactionId}/${transactionType}/${memberId}`, (err, result) => {
          if(result){
            confirm("Success", "Transaction deleted!", {"Ok": () =>  {

              $('#div_transactionEditingForm').hide();
              loadUnpostedTransactionByMember(memberId);

            }});

          }
          
        })

    }
    
    loadLastPostDate();

    // on clicks
    $('#generate').click(() => {

        let dateRangeIsValid = validDateRange();

        if(dateRangeIsValid == true) loadUnpostedTransactionTable();

        else confirm("Warning", dateRangeIsValid, {"Ok": () => {}});

    });

    $('#postTransaction').click(() => {

        let memberIdWithPoints = []

        $('.checkboxTransaction:checkbox:checked').each(function(row){
            memberIdWithPoints.push({ "memberId": $(this).attr('memberId'), "projectedPoints": $(this).attr('projectedPoints')});
        })

        if(memberIdWithPoints.length > 0){

            loader("Posting transactions", "Please wait..");

            setTimeout(() => {

              post("/transaction/postTransaction", {'memberIdWithPoints': memberIdWithPoints, 'dateRange': dateRange}, (err, result) => {
                  if(result){
                      closeLoader();
                      confirm("Success", "Transactions posted!", {"Ok": () => {

                        loadLastPostDate();
                        loadUnpostedTransactionTable();

                      } })
                  } 
              })

            }, 400)

        }

        else confirm("Warning", "Please select transactions posted.", {"Ok": () => {} })

    })

    // Trigger click to all checkboxes to bind projected points
    $('#checkAll').click(function(){
        $('.checkboxTransaction').each(function(){
            $(this).prop("checked", $('#checkAll').prop("checked"));
            $(this).attr('projectedPoints', $(this).closest('tr').children(0)[6].innerHTML);
        });
    });

    // Bind the projected points to checkbox for posting purpose
    $('body').on('change', '.checkboxTransaction', function() {
        if(this.checked) $(this).attr('projectedPoints', $(this).closest('tr').children(0)[6].innerHTML);
    });

    $('body').on('click', '.unpostedPoints', function(){

        memberId = $(this).attr('memberId');

        $('#div_posting').hide();
        $('#div_transactionEditingForm').hide();
        $('#itemAmount').text('');
        $('#itemPoints').text('');

        loader("Loading transactions list", "Please wait..");

        loadUnpostedTransactionByMember(memberId);

    })

    $('#btn_back').click(() => {

        $('#div_transactionEditing').hide();
        $('#div_posting').fadeIn();

        loadUnpostedTransactionTable();

    })

    // Display transaction data
    $('#tblTransaction').on('click', 'tr', function(){

        $('#tblTransaction tr').removeClass('selectedRow');
        $(this).addClass('selectedRow');

        transactionId = $(this).children(0)[0].innerHTML;
       
        get(`/transaction/getById/${transactionId}`, (err, transaction) => {
          if(transaction) fillTransactionForm(transaction);
        })

    });

    $('#btn_delete').click(() => {

        let yes = () => deleteTransaction()
        let no = () => {};

        confirm("Confirmation", "Are you sure you want to delete this transaction?", {"Yes":yes, "No":no});

    });

    // Redeem functions
    $('#addItem').click(() => {
      if($('#redeemables option:selected').text() != " - Select - "){
        const additionalItem = addItem(itemsToRedeem, redeemableId);
        redeemableId++;
      }
    });

    $('body').on('click', '.removeItem', function(){
      itemsToRedeem = removeItem(itemsToRedeem, $(this).attr('redeemableId'));
    })

    $('#btn_save').click(() => {
        if(validTransaction() == true) updateTransaction(gatherTransactionData());
    })



    // on inputs
    $('.dateRange').on('blur', function(){

        if($(this).val().length > 0 && $(this).val() > new Date().toISOString().split("T")[0]){
          confirm("Warning", `Invalid ${$(this).attr('placeholder')}`, {"Ok": () => $(this).val('') });
        }

        else if($('#startDate').val().length > 0 && $('#endDate').val().length > 0){

          // Avoid duplicate display of error message
          if(!jconfirm.instances[0]){

              var inputDateRange = {"startDate": $('#startDate').val(), "endDate": $('#endDate').val()}
              
              if(inputDateRange.startDate > inputDateRange.endDate){

                confirm("Warning", "Invalid date range",{
                    "Ok": () => {
                      $('#startDate').val('');
                      $('#endDate').val('')
                    }
                });

              }
              
              else dateRange = {"startDate": $('#startDate').val(), "endDate": $('#endDate').val()};

          }

        }

    })


    // On input
    $('#transactionDate').blur(function(){
      if($(this).val() > new Date().toISOString().split("T")[0]){
        confirm("Warning", `Invalid ${$(this).attr('placeholder')}`, {"Ok": () => $(this).val('') });
      }
      else{
        if($(this).val() != "" && transactionType == "EARN") identifyPromo($(this).val(), activatedPromo => promo = activatedPromo)
      }
    })

    // convert amount to points
    $('.amount').on('input', function(e){

      let value = $(this).val();

      if(value[0] == 0) $(this).val(value.toString().substring(1,value.length));
      if(value == "") $(this).val(0);
      calculatePointsAndAmountSingleField(promo, $(this).attr('category'), value)

    })

    $('input[type="number"]').on('keydown', function(e) {
        
        if((e.keyCode == 110 || e.keyCode == 190) && $(this).val().includes('.')){
          return false;
        }

        else if(!((e.keyCode > 95 && e.keyCode < 106)
          || (e.keyCode > 47 && e.keyCode < 58) 
          || e.keyCode == 8
          || e.keyCode == 110
          || e.keyCode == 37
          || e.keyCode == 39
          || e.keyCode == 190)) {
            return false;
        }

    });


    // On change
    $('#redeemables').change(function(){

      $('#itemAmount').text(`${$('option:selected',this).attr('amount')}`);
      $('#itemPoints').text($('option:selected',this).attr('points'));

    })


    $('#discountPoints').on('input', function(){
     
        $('#dicountEquivalent').text(parseFloat($(this).val()*conversionPoints).toFixed(2));

        const discountedAmount = parseFloat(parseFloat($('#transactionAmount').text()) - parseFloat($(this).val()*conversionPoints)).toFixed(2);

        if(discountedAmount >= 0) $('#discountedAmount').text(discountedAmount);

        else confirm("Warning", `Discount amount is larger than transaction amount`, {"Ok": () => {
            $('#discountPoints').val(0);
            $('#dicountEquivalent').text('');
            $('#discountedAmount').text('');
        } })

    });

    $('#invoiceNumber').blur(function(){

      if(redeemType == "DISCOUNT" && $('#invoiceNumber').val().length > 0) getTransactionByInvoiceNumber($(this).val(), memberId);

    })

})