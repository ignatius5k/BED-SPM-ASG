const scheduleModel = require("../models/scheduleModel");

async function getSchedules(req,res){

    try{

        const schedules = await scheduleModel.getAllSchedules();

        res.json(schedules);

    }catch(err){

        res.status(500).json({
            message: err.message
        });

    }

}

async function createSchedule(req,res){

    try{

        await scheduleModel.createSchedule(req.body);

        res.status(201).json({
            message:"Schedule created successfully"
        });

    }catch(err){

        res.status(500).json({
            message:err.message
        });

    }

}

async function updateSchedule(req,res){

    try{

        await scheduleModel.updateSchedule(req.params.id,req.body);

        res.json({
            message:"Schedule updated successfully"
        });

    }catch(err){

        res.status(500).json({
            message:err.message
        });

    }

}

async function deleteSchedule(req,res){

    try{

        await scheduleModel.deleteSchedule(req.params.id);

        res.json({
            message:"Schedule deleted successfully"
        });

    }catch(err){

        res.status(500).json({
            message:err.message
        });

    }

}

module.exports={
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
};