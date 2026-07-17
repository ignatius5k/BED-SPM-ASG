const express = require("express");
const router = express.Router();

const stallController = require("./controllers/stallController");

router.get("/", stallController.getAllStalls);

module.exports = router;