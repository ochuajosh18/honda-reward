var express = require('express')
  , router = express.Router()
  , user = require("../models/user").user
  , bcrypt = require('bcrypt')

router.post("/create", (req,res) => {

    user.create(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/get", (req,res) => {

    user.get(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});


router.get("/search/:substring", (req,res) => {

    user.search(req.params.substring, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

})

router.get("/getPermission/:id", (req,res) => {

    user.getPermission(req.params.id, (error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});

router.get("/getDataAndPermission/:conditions", (req,res) => {

    user.getDataAndPermission(req.params.conditions, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/getRoles/:fields", (req,res) => {

    user.getRoles(req.params.fields, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/update", (req,res) => {
    
    user.update(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/createRole", (req,res) => {

    user.createRole(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.post("/updateRole", (req,res) => {
    
    user.updateRole(req.body, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/delete/:userName", (req,res) => {

    user.delete(req.params.userName, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/forgotPassword/:userName/:email", (req,res) => {
   
    user.forgotPassword(req.params, (error,result) => {

        if(error) return res.status(400).send(error);
        res.send(result);

    });

});

router.get("/hashPassword", (req,res) => {

    user.hashPassword((error,result) => {

        if(error) return res.status(400).send(error);
            res.send(result);

    });

});


router.post("/comparePassword", async(req,res) => {

    const result = await bcrypt.compare(req.body.oldPassword, req.body.password);

    res.send(result);

});

module.exports = router;