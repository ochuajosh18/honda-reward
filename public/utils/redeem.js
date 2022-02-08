const loadRedeemables = () => {

    let parameters = { "fields": "name, amount, points", "conditions": "AND status='active' ORDER BY name"}

    post("/redeemable/get", parameters, (err, result) => {
      if(result){
        $('#redeemables').empty();
        $('#redeemables').append('<option selected disabled> - Select - </option>');
        result.forEach(redeemable => $('#redeemables').append(`<option value='${redeemable.name}' points='${redeemable.points}' amount='${redeemable.amount}'>${redeemable.name}</option>`));
        closeLoader();
      }
    })

}

const loadRedeemedItemTable = itemsToRedeem => {

  const columns = ["name", "amount", "points", "delete"];

  columns.forEach((property, index) => columns[index] = {data: property});

  $('#tblItemsToRedeem').DataTable({
    searching: false,
    paging: false,
    sorting: false,
    info: false,
        destroy: true,
        data: itemsToRedeem,
        columns: columns
  });

}

const computeTotal = itemsToRedeem => {

  let totalAmount = 0;
  let totalPoints = 0;

  itemsToRedeem.forEach(redeemable => {
    totalAmount += parseFloat(redeemable.amount);
    totalPoints += parseFloat(redeemable.points);
  })

  $('#totalAmount').val(parseFloat(totalAmount).toFixed(2));
  $('#totalPoints').val(parseFloat(totalPoints).toFixed(2));

}

const addItem = (itemsToRedeem, redeemableId) => {

  const additionalItem = {

    "name": $('#redeemables option:selected').val(),
    "amount": $('#redeemables option:selected').attr('amount'),
    "points": $('#redeemables option:selected').attr('points'),
    "delete": `<img redeemableId="${redeemableId}" class="delete icon removeItem" style="float: right" src="../images/icons/delete.png">`,
    "id": redeemableId

  }

  itemsToRedeem.push(additionalItem);

  if(itemsToRedeem.length == 1){
    $('#tblItemsToRedeem').fadeIn();
    $('.totals').fadeIn()
  }
  
  console.log(itemsToRedeem.length);

  loadRedeemedItemTable(itemsToRedeem);
  computeTotal(itemsToRedeem);

  return additionalItem;

}

const removeItem = (itemsToRedeem, id) => {

  itemsToRedeem = itemsToRedeem.filter(function(item){ return item.id !=  id });

  if(itemsToRedeem.length > 0){
      loadRedeemedItemTable(itemsToRedeem);
      computeTotal(itemsToRedeem);
  }

  else{
      $('#tblItemsToRedeem').hide();
      $('.totals').hide();
  }

  return itemsToRedeem;

}

const fillRedeemForm = (transaction, memberId, itemsToRedeem, callback) => {

    $('#cardNumber').text(transaction.cardNumber);
    $('.redeemField').fadeIn();

    setTimeout(() => {

        get(`/membership/getById/${memberId}`, (err, member) => {

            if(member){

                let redeemablePoints = member.redeemablePoints + (Math.abs(transaction.totalPoints));
                conversionPoints = transaction.conversion;
                $('#points').text(member.points);
                $('#redeemablePoints').text(redeemablePoints.toFixed(2));

                if(transaction.redeemType == "ITEM/SERVICE"){

                  $('#transactionDate, #orNumber').attr('disabled', false);

                  $('.discountField').hide();
                  $('.item_serviceField').fadeIn();

                  loadRedeemedItemTable(itemsToRedeem);
                  loadRedeemables();

                  $('#totalAmount').val(transaction.totalAmount);
                  $('#totalPoints').val(Math.abs(transaction.totalPoints));

                  $('#tblItemsToRedeem').fadeIn();
                  $('.totals').fadeIn();

                }
                
                else{
                  $('#transactionDate, #orNumber').attr('disabled', true);

                  $('.item_serviceField, .totals').hide();
                  $('.discountField').fadeIn();

                  $('#discountPoints').val(Math.abs(transaction.totalPoints));
                  $('#dicountEquivalent').text(transaction.dicountEquivalent);
                  $('#transactionAmount').text(transaction.transactionAmount);
                  $('#discountedAmount').text(transaction.discountedAmount);
                }

                $('#transactionDate').val(transaction.transactionDate);
                $('#invoiceNumber').val(transaction.invoiceNumber);
                $('#orNumber').val(transaction.orNumber);

                

                $('.earnField').hide();


                closeLoader();

                callback(redeemablePoints);

            }

        })

    }, 400)

}

const validRedeemTransaction = redeemType => {

    let valid = true;
    let found = false;
    let emptyField;

    const requiredFields = [$('#transactionDate'), $('#invoiceNumber'), $('#orNumber')];

    requiredFields.forEach(element => {
        if(element.val() == "" && !found){
            confirm("Warning", `${element.attr('placeholder')} cannot be empty`, {"Ok": () => {} });
            valid = false;
            found = true;
        }
    });

    if(redeemType == 'DISCOUNT'){

        if($('#discountPoints').val == '' || $('#discountPoints').val() == 0){
          confirm("Warning", `Discount points must be more than 0`, {"Ok": () => {} });
          valid = false;
        }

    }

    return valid;
  
}

const gatherRedeemForm = (itemsToRedeem, redeemType) => {

    let data = {
      "transactionDate": $('#transactionDate').val(),
      "invoiceNumber": $('#invoiceNumber').val(),
      "orNumber": $('#orNumber').val()
    };

    data.redeemType = redeemType;

    if(redeemType == "ITEM/SERVICE"){
      data.redeemedItems = itemsToRedeem;
      data.totalAmount = parseFloat($('#totalAmount').val()).toFixed(2);
      data.totalPoints = parseFloat($('#totalPoints').val()).toFixed(2);
    }
    
    else{
      data.totalPoints = parseFloat($('#discountPoints').val());
      data.transactionAmount = parseFloat($('#transactionAmount').text());
      data.discountedAmount = parseFloat($('#discountedAmount').text());
      data.dicountEquivalent = parseFloat($('#dicountEquivalent').text());
    }

    return data;

}

const getTransactionByInvoiceNumber = (invoiceNumber, memberId) => {

    let parameters = { "fields": "transactionDate, orNumber, totalAmount", "conditions": ` AND invoiceNumber='${invoiceNumber}' AND transactionType='EARN' AND posted=false AND memberId='${memberId}'` }

    post("/transaction/get", parameters, (err, result) => {

      if(result){
        if(result.length > 0){

          $('#discountPoints').attr('disabled', false);

          $('#transactionDate').val(result[0].transactionDate);
          $('#orNumber').val(result[0].orNumber);
          $('#transactionAmount').text(result[0].totalAmount);
          $('#discountedAmount').text(result[0].totalAmount-($('#dicountEquivalent').text()))

        }

        else confirm("Warning", `Transaction not found.`, {"Ok": () => { 
            $('#discountPoints').attr('disabled', true);
            $('#discountPoints').val(0);
            $('#dicountEquivalent, #transactionAmount, #discountedAmount').text(''); 

        } });
      }
    })

  }