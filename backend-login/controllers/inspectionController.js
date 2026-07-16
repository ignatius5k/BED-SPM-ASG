const inspectionModel = require("../models/inspectionModel");

async function getAllInspections(req,res){

    try{

        const inspections =
            await inspectionModel.getAllInspections();

        res.json(inspections);

    }

    catch(err){

        console.log(err);

        res.status(500).json({
            error:"Unable to retrieve inspections."
        });

    }

}

module.exports={
    getAllInspections
};