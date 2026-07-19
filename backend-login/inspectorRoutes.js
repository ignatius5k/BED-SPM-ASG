const express = require("express");
const router = express.Router();

const inspectorController = require("./controllers/inspectorController");

router.get("/", inspectorController.getInspectors);

module.exports = router;