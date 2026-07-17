const stallModel = require("../models/stallModel");

async function getAllStalls(req, res) {
    try {
        const stalls = await stallModel.getAllStalls();
        res.json(stalls);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error retrieving stalls"
        });
    }
}

module.exports = {
    getAllStalls
};