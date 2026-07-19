const inspectorModel = require("../models/inspectorModel");

async function getInspectors(req, res) {

    try {

        const inspectors = await inspectorModel.getAllInspectors();

        res.json(inspectors);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: err.message
        });

    }

}

module.exports = {
    getInspectors
};