const model = require("../models/vendorBadgeModel");


exports.getBadgeCounts = async (req,res)=>{

    try {

        const result = await model.getCounts(req.params.vendorId);
        res.json(result);

    } catch(err){

        console.error(err);
        res.status(500).json({
            error:"Server error"
        });

    }

};