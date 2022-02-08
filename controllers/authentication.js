var express = require('express')
  , router = express.Router()
  , authentication = require("../models/authentication").authentication

router.post("/authenticate", (req,res) => {

    authentication.authenticate(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
		res.send(result);

    });

});

module.exports = router;