const complaintModel = require("../models/vendorComplaintModel");

async function getVendorComplaints(req, res) {

    try {

        const complaints =
            await complaintModel.getVendorComplaints(
                req.params.vendorId
            );

        res.json(complaints);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: err.message
        });

    }

}

async function updateComplaintStatus(req, res) {

    try {

        await complaintModel.updateComplaintStatus(
            req.params.id,
            req.body.status
        );

        res.json({
            message: "Complaint updated"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: err.message
        });

    }

}

module.exports = {
    getVendorComplaints,
    updateComplaintStatus
};