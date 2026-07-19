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


//delete
async function deleteInspection(req, res) {
    try {
        const id = req.params.id;

        const deleted = await inspectionModel.deleteInspection(id);

        if (!deleted) {
            return res.status(404).json({
                error: "Inspection not found"
            });
        }

        res.json({
            message: "Inspection deleted successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to delete inspection"
        });
    }
}
module.exports={
    getAllInspections,
    deleteInspection
};


