const calculatePointsAndAmountSingleField = (promo, category, amount) => {

  let minimum = parseFloat(promo.setup[category].minimum)
  let pointPer = parseFloat(promo.setup[category].pointPer);

  if(minimum == 0 && pointPer > 0) $(`#${category}Points`).val(amount)
  else if(pointPer > 0 && amount >= minimum) $(`#${category}Points`).val(Math.floor((amount/pointPer)))
  else $(`#${category}Points`).val(0)

  // totals
  $('#totalAmount').val(parseFloat(parseFloat($('#generalAmount').val()) + parseFloat($('#goodsAmount').val()) + parseFloat($('#accessoriesAmount').val()) + parseFloat($('#servicesAmount').val())).toFixed(2));
  $('#totalPoints').val(parseFloat(parseFloat($('#generalPoints').val()) + parseFloat($('#goodsPoints').val()) + parseFloat($('#accessoriesPoints').val()) + parseFloat($('#servicesPoints').val())).toFixed(2));
  $('#totalConversion').val(parseFloat(parseFloat($('#totalPoints').val())*conversionPoints).toFixed(2));

}

const calculatePointsAndAmountAllFields = promo => {

  const categories = ["general", "goods", "accessories", "services"];

  categories.forEach(category => {

    let minimum = parseFloat(promo.setup[category].minimum);
    let pointPer = parseFloat(promo.setup[category].pointPer);
    let amount = parseFloat($(`#${category}Amount`).val());

    if(minimum == 0 && pointPer > 0) $(`#${category}Points`).val(amount)
    else if(pointPer > 0 && amount >= minimum) $(`#${category}Points`).val(Math.floor(amount/pointPer));
    else $(`#${category}Points`).val(0)

  })
  
  
  // totals
  $('#totalAmount').val(parseFloat(parseFloat($('#generalAmount').val()) + parseFloat($('#goodsAmount').val()) + parseFloat($('#accessoriesAmount').val()) + parseFloat($('#servicesAmount').val())).toFixed(2));
  $('#totalPoints').val(parseFloat(parseFloat($('#generalPoints').val()) + parseFloat($('#goodsPoints').val()) + parseFloat($('#accessoriesPoints').val()) + parseFloat($('#servicesPoints').val())).toFixed(2));
  $('#totalConversion').val(parseFloat(parseFloat($('#totalPoints').val())*conversionPoints).toFixed(2));
  
}

const identifyPromo = (transactionDate, callback) => {

  let parameters = { "fields": "startDate, endDate, setup, title, id", "conditions": `AND (startDate <= '${transactionDate}' AND endDate >= '${transactionDate}')`};

  post("/promotion/get", parameters, (err, result) => {
    if(result) {

      promo = "";

      if(result.length > 1){
        if(result[0].title != "Default Promo") promo = result[0];
        else promo = result[1];
      }

      else promo = result[0];

      $('#activePromo').text(promo.title);
      $('#divAmount').fadeIn();

      promotionId = promo.id;

      calculatePointsAndAmountAllFields(promo);

      callback(promo);

    };
  })

}

const fillEarnForm = (transaction, callback) => {
    conversionPoints = transaction.conversion;
    $('#cardNumber').text(transaction.cardNumber);
    $('#transactionDate, #orNumber').attr('disabled', false);

    const parameters = { "fields": 'title, setup', "conditions": `AND id='${transaction.promotionId}'` }

    setTimeout(() => {

        post("/promotion/get", parameters, (err, activatedPromo) => {
          if(activatedPromo){

              $('#activePromo').text(activatedPromo[0].title)
              $('#transactionDate').val(transaction.transactionDate);
              $('#invoiceNumber').val(transaction.invoiceNumber);
              $('#orNumber').val(transaction.orNumber);

              $('#generalAmount').val(transaction.transactionPerCategory.general.amount);
              $('#generalPoints').val(transaction.transactionPerCategory.general.pointsEarned);

              $('#servicesAmount').val(transaction.transactionPerCategory.services.amount);
              $('#servicesPoints').val(transaction.transactionPerCategory.services.pointsEarned);

              $('#goodsAmount').val(transaction.transactionPerCategory.goods.amount);
              $('#goodsPoints').val(transaction.transactionPerCategory.goods.pointsEarned);

              $('#accessoriesAmount').val(transaction.transactionPerCategory.accessories.amount);
              $('#accessoriesPoints').val(transaction.transactionPerCategory.accessories.pointsEarned);

              $('#totalAmount').val(transaction.totalAmount);
              $('#totalPoints').val(transaction.totalPoints);
              $('#totalConversion').val(transaction.totalConversion);

              closeLoader();

              $('.redeemField').hide();
              $('.earnField').fadeIn();

              $('.totals').fadeIn();
              
          }

          callback(activatedPromo[0]);

        })



    }, 400)

}

const validEarnTransaction = () => {

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
    })

    return valid;

}

const gatherEarnForm = promotionId => {

    let data = gatherFormData('earnProperty');

    data.promotionId = promotionId;
    data.transactionDate = $('#transactionDate').val();
    data.invoiceNumber = $('#invoiceNumber').val();
    data.orNumber = $('#orNumber').val();
    data.totalAmount = parseFloat($('#totalAmount').val()).toFixed(2);
    data.totalPoints = parseFloat($('#totalPoints').val()).toFixed(2);
    data.totalConversion = parseFloat($('#totalConversion').val()).toFixed(2);

    return data;

}
