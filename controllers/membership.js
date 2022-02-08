var express = require('express')
  , router = express.Router()
  , membership = require("../models/membership").membership

router.post("/create", (req,res) => {

    membership.create(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/getById/:id", (req,res) => {

    membership.getById(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.post("/get", (req,res) => {

    membership.get(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        return res.send(result);

    });

});

router.post("/update", (req,res) => {
    
    membership.update(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/searchByCardNumber/:substring", (req,res) => {

    membership.searchByCardNumber(req.params.substring, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/searchByNameAndCardNumber/:substring/:fields/:additionalConditions/:editPermission", (req,res) => {

    membership.searchByNameAndCardNumber(req.params, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/delete/:id", (req,res) => {

    membership.delete(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

// card printing API
router.get("/active/members", (req,res) => {

    membership.getActiveMembers((error,result) => {
        if(error) return res.status(400).send(error);
        res.send(result);
    });

});

// card printing API
router.get("/checkExpiryCards", (req,res) => {
    res.send('Hi')
    // membership.checkExpiryCards((error,result) => {
    //     if(error) return res.status(400).send(error);
    //     res.send(result);
    // });

});

module.exports = router;