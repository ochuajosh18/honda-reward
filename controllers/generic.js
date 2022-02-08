var express = require('express')
  , router = express.Router()
  , couchbaseModel = require("../modules/couchbaseModel").couchbaseModel

router.post("/getById", (req,res) => {

    couchbaseModel.getById(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
		    res.send(result);

    });

});

router.post("/query", (req,res) => {
  couchbaseModel.adhocQuery(req.body.query, (error,result) => {

      if (error) return res.status(400).send(error);
      return res.send(result);

  });

});


module.exports = router;