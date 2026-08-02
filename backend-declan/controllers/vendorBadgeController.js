const badgeModel = require("../models/vendorBadgeModel");


async function getBadgeCounts(req, res) {
    try {
        const result = await badgeModel.getCounts(req.params.vendorId);
        res.json(result);
    } catch(err){
        console.error(err);
        res.status(500).json({
            error:"Server error"
        });
    }
};

module.exports = {
    getBadgeCounts
};