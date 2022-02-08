var express = require('express')
  , router = express.Router()
  , promotion = require("../models/promotion").promotion

router.post("/create", (req,res) => {

    promotion.create(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/get", (req,res) => {

    promotion.get(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.post("/update", (req,res) => {
    
    promotion.update(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/delete/:id", (req,res) => {

    promotion.delete(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/search/:substring/:source", (req,res) => {

    promotion.search(req.params.substring, req.params.source, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

})

module.exports = router;