const host = process.env.HONDA_AMI_HOST;

const fs = require('fs')
	, readline = require('readline')
	, {google} = require('googleapis')
	, SCOPES = [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send'
  ]
	, TOKEN_PATH = 'token.json'
  , moment = require('moment-timezone')
  , {OAuth2Client} = require('google-auth-library')
  , createBody = require('gmail-api-create-message-body')
  , nodemailer = require('nodemailer')
  , MailComposer = require('nodemailer/lib/mail-composer')

function gmailApi(){}


gmailApi.authorize = (credentials, callback) => { 

	const {client_secret, client_id, redirect_uris} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	 // Check if we have previously stored a token.
  	fs.readFile(TOKEN_PATH, (err, token) => {
    	if (err) return getNewToken(oAuth2Client, callback);
    	oAuth2Client.setCredentials(JSON.parse(token));
    	callback(oAuth2Client);
  	});

}

const getNewToken = (oAuth2Client, callback) => {

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {

    rl.close();

    oAuth2Client.getToken(code, (err, token) => {

      if (err) return console.error('Error retrieving access token', err);

      oAuth2Client.setCredentials(token);

      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });

      callback(oAuth2Client);

    });

  });

}

gmailApi.listSentMessages = (searchSubject, auth, callback) => {

  const query = searchSubject == "null" ? '' : `subject:${searchSubject}`;

  console.log(query);

  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.list({
    userId: 'me',
    labelIds: ["SENT"],
    q: query,
    }, (err, res) => {

	    if (err) return console.log('The API returned an error: ' + err);

	    sentEmailIds = res.data.resultSizeEstimate > 0 ? res.data.messages.map(sentEmail => sentEmail.id) : [];

	    callback(sentEmailIds)

  });
}

gmailApi.getSentMessageById = (auth, messageId, callback) => {

  const gmail = google.gmail({version: 'v1', auth});

  gmail.users.messages.get({
    userId: 'me',
    id: messageId
    }, (err, res) => {


	    if (err) return console.log('The API returned an error: ' + err);

	    const subject = res.data.payload.headers.filter(header => header.name == "Subject" );
	    const to = res.data.payload.headers.filter(header => header.name == "To" ).map(to => to.value);
	    const cc = res.data.payload.headers.filter(header => header.name == "Cc" ).map(cc => cc.value);
	   	let date = res.data.payload.headers.filter(header => header.name == "Date")
          date = moment(date[0].value).tz('Asia/Manila').format("YYYY-MM-DD HH:mm")

      
	    const sentItem = {
	    	"subject": subject[0].value,
	    	"to": to.join(", "),
	    	"cc": cc.join(", "),
	    	"date": date,
	    	"id": res.data.id
	    }

      if(res.data.payload.parts){
        if(res.data.payload.parts[0].body.data)
          sentItem.body = Buffer.from(res.data.payload.parts[0].body.data, 'base64').toString('ascii');
        else
          sentItem.body = "";
      }
      
      sentItem.payload = res.data.payload.parts ? res.data.payload.parts : [];

	    callback(sentItem)

  });

}

gmailApi.getAttachment = (auth, messageId, attachmentId, callback) => {
	
  const gmail = google.gmail({version: 'v1', auth});

  gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: messageId,
    id: attachmentId,
    }, (err, res) => {
    	
	    if (err) return console.log('The API returned an error: ' + err);

	    callback(res.data.data)

  });

}

gmailApi.sendEmail = (auth, {to, cc, subject, body, attachments}, callback) => {

  let mail = new MailComposer(
    {
      to: to,
      cc: cc,
      html: body,
      subject: subject,
      textEncoding: "base64",
      attachments: attachments
    });

  mail.compile().build((error, msg) => {
    if (error) return console.log('Error compiling email ' + error);

    const encodedMessage = Buffer.from(msg)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmail = google.gmail({version: 'v1', auth});

    gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: encodedMessage,
      }
    }, (err, result) => {
      if (err) return console.log('NODEMAILER - The API returned an error: ' + err);
      callback(result.data);

    });

  })


}

module.exports.gmailApi = gmailApi;
