const { Peminjaman, Anggota, Buku } = require("../models");
const { Op } = require("sequelize");

const tambahPeminjaman = async (req, res) => {
    try {
        const { anggotaId, bukuId, tanggal_pinjam, tanggal_jatuh_tempo } = req.body;

        if (!anggotaId || !bukuId || !tanggal_pinjam || !tanggal_jatuh_tempo) {
            return res.status(400).json({
                status: "error",
                message: "Semua field wajib diisi",
            });
        }

        const dataPeminjaman = await Peminjaman.create({
            anggotaId,
            bukuId,
            tanggal_pinjam,
            tanggal_jatuh_tempo,
            status: "Dipinjam",
        });

        // Update status buku menjadi Dipinjam
        await Buku.update(
            { status: "Dipinjam" },
            { where: { id: bukuId } }
        );

        return res.status(201).json({
            status: "success",
            message: "Peminjaman berhasil ditambahkan",
            data: dataPeminjaman,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const getPeminjaman = async (req, res) => {
    try {
        const search = req.query.search || "";
        const status = req.query.status || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = {
            '$anggota.nama$': { [Op.like]: `%${search}%` }
        };

        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await Peminjaman.findAndCountAll({
            where: whereClause,
            include: [
                { model: Anggota, as: "anggota" },
                { model: Buku, as: "buku" }
            ],
            limit: limit,
            offset: offset,
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            status: "success",
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit: limit,
            },
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const getOverduePeminjaman = async (req, res) => {
    try {
        const today = new Date();
        const overdue = await Peminjaman.findAll({
            where: {
                status: "Dipinjam",
                tanggal_jatuh_tempo: {
                    [Op.lt]: today
                }
            },
            include: [
                { model: Anggota, as: "anggota" },
                { model: Buku, as: "buku" }
            ],
            order: [["tanggal_jatuh_tempo", "ASC"]],
        });

        return res.status(200).json({
            status: "success",
            data: overdue,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const kembalikanBuku = async (req, res) => {
    try {
        const { id } = req.params;
        const { kondisi } = req.body; // 'utuh' atau 'rusak'

        const peminjaman = await Peminjaman.findByPk(id);

        if (!peminjaman) {
            return res.status(404).json({
                status: "error",
                message: "Data peminjaman tidak ditemukan",
            });
        }

        // Update status peminjaman (jika rusak, status transaksi jadi Rusak)
        await peminjaman.update({
            status: kondisi === "rusak" ? "Rusak" : "Dikembalikan",
            tanggal_kembali: new Date()
        });

        // Update status buku berdasarkan kondisi
        if (kondisi === "rusak") {
            await Buku.update(
                { status: "Rusak" },
                { where: { id: peminjaman.bukuId } }
            );
        } else {
            await Buku.update(
                { status: "Tersedia" },
                { where: { id: peminjaman.bukuId } }
            );
        }

        return res.status(200).json({
            status: "success",
            message: `Buku berhasil dikembalikan ${kondisi === "rusak" ? "dengan kondisi rusak" : "dalam keadaan utuh"}`,
            data: peminjaman,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
}

const hapusMasalPeminjaman = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) {
            return res.status(400).json({
                status: "error",
                message: "ID peminjaman wajib disediakan",
            });
        }

        // Cek apakah ada peminjaman yang masih aktif (Dipinjam)
        const activeLoans = await Peminjaman.count({
            where: {
                id: { [Op.in]: ids },
                status: 'Dipinjam'
            }
        });

        if (activeLoans > 0) {
            return res.status(400).json({
                status: "error",
                message: "Tidak dapat menghapus data peminjaman yang masih aktif",
            });
        }

        await Peminjaman.destroy({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Data peminjaman berhasil dihapus",
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
}

const countPeminjamanStats = async (req, res) => {
    try {
        const totalDipinjam = await Peminjaman.count({
            where: { status: "Dipinjam" }
        });

        const today = new Date();
        const totalTerlambat = await Peminjaman.count({
            where: {
                status: "Dipinjam",
                tanggal_jatuh_tempo: {
                    [Op.lt]: today
                }
            }
        });

        return res.status(200).json({
            totalDipinjam,
            totalTerlambat
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
}

module.exports = {
    tambahPeminjaman,
    getPeminjaman,
    getOverduePeminjaman,
    kembalikanBuku,
    hapusMasalPeminjaman,
    countPeminjamanStats
};
