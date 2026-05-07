const express = require("express");
const router = express.Router();

const {
    tambahPeminjaman,
    getPeminjaman,
    getOverduePeminjaman,
    kembalikanBuku,
    hapusMasalPeminjaman,
    countPeminjamanStats
} = require("../controller/peminjamanController");

router.post("/", tambahPeminjaman);
router.get("/", getPeminjaman);
router.get("/overdue", getOverduePeminjaman);
router.get("/stats", countPeminjamanStats);
router.put("/kembalikan/:id", kembalikanBuku);
router.post("/bulk-delete", hapusMasalPeminjaman);

module.exports = router;
