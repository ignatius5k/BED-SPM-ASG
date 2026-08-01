const express = require("express");
const router = express.Router();

const stallController = require("./controllers/stallController");

router.get("/public", stallController.getPublicStalls);
router.get("/", stallController.getAllStalls);

module.exports = router;
