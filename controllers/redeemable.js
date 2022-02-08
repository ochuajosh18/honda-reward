var express = require('express')
  , router = express.Router()
  , redeemable = require("../models/redeemable").redeemable

router.post("/create", (req,res) => {

    redeemable.create(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/get", (req,res) => {

    redeemable.get(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.post("/update", (req,res) => {
    
    redeemable.update(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/delete/:id", (req,res) => {

    redeemable.delete(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/search/:substring", (req,res) => {

    redeemable.search(req.params.substring, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

})

module.exports = router;