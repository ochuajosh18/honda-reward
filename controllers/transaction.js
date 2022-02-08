var express = require('express')
  , router = express.Router()
  , transaction = require("../models/transaction").transaction

router.post("/create", (req,res) => {

    transaction.create(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/update", (req,res) => {

    transaction.update(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/get", (req,res) => {

    transaction.get(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.get("/getById/:id", (req,res) => {

    transaction.getById(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.get("/delete/:id/:transactionType/:memberId", (req,res) => {

    transaction.delete(req.params, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/getUnpostedTransactions/:startDate/:endDate", (req,res) => {

    transaction.getUnpostedTransactions(req.params.startDate, req.params.endDate, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.post("/postTransaction", (req,res) => {

    transaction.postTransaction(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.post("/getTotalEarnedData", (req,res) => {

    transaction.getTotalEarnedData(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
            
        return res.send(result);

    });

});

module.exports = router;