const express=require("express");

const router=express.Router();

const inspectionController=
require("./controllers/inspectionController");

router.get(
"/",
inspectionController.getAllInspections
);

module.exports=router;