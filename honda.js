var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    compression = require('compression'),
    moment = require('moment-timezone'),
    momentTimezone = require('moment-timezone') 

const env = require('./modules/environment')(process.env.NODE_ENV);
const port = process.env.PORT || 7009;

const membership = require('./models/membership').membership;

const serviceReminder = require('./models/serviceReminder').serviceReminder;

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('ejs', require('ejs').__express);
app.set('view engine', 'ejs');
app.use(require('./controllers'));
app.use(express.static(__dirname + '/public'));
app.listen(port, function() {
    console.log(`--- Honda ${process.env.NODE_ENV} on port ${port}`);
});

//cron for eliminating expired memberships
membership.checkExpiryCard();

// cron for scheduled email
serviceReminder.scheduledEmail();

module.exports = app;
