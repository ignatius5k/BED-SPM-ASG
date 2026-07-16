const express=require("express");

const router=express.Router();

const inspectionController=
require("./controllers/inspectionController");

router.get("/",inspectionController.getAllInspections);
router.delete("/:id", inspectionController.deleteInspection);
module.exports=router;


