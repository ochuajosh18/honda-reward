const host = process.env.HONDA_AMI_HOST;

const express = require('express')
  , router = express.Router()
  , serviceReminder = require("../models/serviceReminder").serviceReminder
  , fs = require('fs')
  , path = require('path')
  , formidable = require('formidable')
  , mkdirp = require("mkdirp")
  , ncp = require("ncp")

router.post("/createTemplate", (req,res) => {

    serviceReminder.createTemplate(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/createSchedule", (req,res) => {

    serviceReminder.createSchedule(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get('/copyAttachments/:templateUuid/:scheduleUuid', function(req, res){

    ncp.limit = 5;
      
    let source = `/opt/honda-elite/public/images/Service Reminder Templates/${req.params.templateUuid}`;
    let destination = `/opt/honda-elite/public/images/Schedules/${req.params.scheduleUuid}`;

    ncp(source, destination, function (error) {
       if(error) return res.status(400).send(error);
       res.send('success')
    }); 


});

router.post("/updateTemplate", (req,res) => {

    serviceReminder.updateTemplate(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post('/uploadTemplateAttachments/:folderName', function(req, res){

      const form = new formidable.IncomingForm();

      form.multiples = true;
      // form.uploadDir = `/images/Service Reminder Templates/${req.params.template}`;
      form.uploadDir = `/opt/honda-elite/public/images/Service Reminder Templates/${req.params.folderName}`

      form.on('file', (field, file) => {
        fs.rename(file.path, path.join(form.uploadDir, file.name), (err, result) =>{
            if(err) console.log(err);
        }); 
      });

      form.on('error', err => console.log('An error has occured: \n' + err) ); 
      form.on('end', () => res.end('Success!') );
      form.parse(req);

      

});

router.get('/createDirectory/:directoryName/:templateUuid', function(req, res){

    console.log("Creating directory..")

    const oldmask = process.umask(0);
    const folder = `/opt/honda-elite/public/images/${req.params.directoryName}/${req.params.templateUuid}`

    console.log(folder)

    mkdirp(folder, '0777', function (error, result) {
        console.log("Directory created!")
        process.umask(oldmask);
       
        if(error) return res.status(400).send(error);
        res.send(req.params.templateUuid);
    
    });

});

router.post("/get", (req,res) => {

    serviceReminder.get(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/update", (req,res) => {
    
    serviceReminder.update(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/delete/:id", (req,res) => {

    serviceReminder.delete(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/search/:substring", (req,res) => {

    serviceReminder.search(req.params.substring, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

})

router.post("/sendEmail", (req,res) => {
   
    serviceReminder.sendEmail(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/getSentItems", (req,res) => {

    const sentItemIds = req.body.sentItemIds;

    if(sentItemIds.length == 0){
        res.send([])
    }
    else{
      serviceReminder.getSentItems(sentItemIds, (error,result) => {

          if(error) return res.status(400).send(error);
          res.send(result);

      });
    }

})

router.get("/getSentItemsList/:searchSubject", (req,res) => {

    serviceReminder.getSentItemsList(req.params.searchSubject, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

})

router.get("/getSentItemAttachment/:messageId/:attachmentId", (req,res) => {

    serviceReminder.getSentItemAttachment(req.params.messageId, req.params.attachmentId, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

})

module.exports = router;