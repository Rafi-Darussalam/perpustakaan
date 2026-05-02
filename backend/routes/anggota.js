const express = require("express");
const router = express.Router();
const {
    tambahAnggota,
    getAnggota,
    countAnggota,
    updateAnggota,
    deleteAnggota,
    deleteAnggotaBulk
} = require("../controller/anggotaController");

router.post("/", tambahAnggota);
router.get("/", getAnggota);
router.get("/count", countAnggota);
router.put("/:id", updateAnggota);
router.post("/delete-bulk", deleteAnggotaBulk);
router.delete("/:id", deleteAnggota);

module.exports = router;
