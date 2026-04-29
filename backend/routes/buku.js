const express = require("express");
const { tambahBuku, getBuku, countBuku, updateBuku, deleteBuku, deleteBukuBulk } = require("../controller/bukuController.js");

const router = express.Router();

router.get("/", getBuku);
router.get('/count', countBuku)
router.post("/", tambahBuku);
router.post("/delete-bulk", deleteBukuBulk);
router.put("/:id", updateBuku);
router.delete("/:id", deleteBuku);

module.exports = router;