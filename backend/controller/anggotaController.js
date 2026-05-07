const { Anggota, Peminjaman } = require("../models");
const { Op } = require("sequelize");

const tambahAnggota = async (req, res) => {
    try {
        const { nama, nomor_telepon, email, alamat } = req.body;

        if (!nama || !nomor_telepon || !email) {
            return res.status(400).json({
                status: "error",
                message: "Nama, nomor telepon, dan email wajib diisi",
            });
        }

        const dataAnggota = await Anggota.create({
            nama,
            nomor_telepon,
            email,
            alamat,
        });

        return res.status(201).json({
            status: "success",
            message: "Anggota berhasil ditambahkan",
            data: dataAnggota,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const getAnggota = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Anggota.findAndCountAll({
            where: {
                nama: { [Op.like]: `%${search}%` },
            },
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

const countAnggota = async (req, res) => {
    try {
        const totalAnggota = await Anggota.count();
        return res.status(200).json({
            count: totalAnggota
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const updateAnggota = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, nomor_telepon, email, alamat } = req.body;

        const anggota = await Anggota.findByPk(id);

        if (!anggota) {
            return res.status(404).json({
                status: "error",
                message: "Anggota tidak ditemukan",
            });
        }

        await anggota.update({ nama, nomor_telepon, email, alamat });

        return res.status(200).json({
            status: "success",
            message: "Anggota berhasil diperbarui",
            data: anggota,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const deleteAnggota = async (req, res) => {
    try {
        const { id } = req.params;
        const anggota = await Anggota.findByPk(id);

        if (!anggota) {
            return res.status(404).json({
                status: "error",
                message: "Anggota tidak ditemukan",
            });
        }

        // Cek apakah anggota memiliki pinjaman aktif
        const activeLoans = await Peminjaman.count({
            where: {
                anggotaId: id,
                status: 'Dipinjam'
            }
        });

        if (activeLoans > 0) {
            return res.status(400).json({
                status: "error",
                message: "Tidak dapat menghapus anggota yang masih memiliki pinjaman aktif",
            });
        }

        await anggota.destroy();

        return res.status(200).json({
            status: "success",
            message: "Anggota berhasil dihapus",
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const deleteAnggotaBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "ID anggota tidak valid atau kosong",
            });
        }

        // Cek apakah ada anggota yang memiliki pinjaman aktif
        const activeLoans = await Peminjaman.count({
            where: {
                anggotaId: { [Op.in]: ids },
                status: 'Dipinjam'
            }
        });

        if (activeLoans > 0) {
            return res.status(400).json({
                status: "error",
                message: "Beberapa anggota yang dipilih masih memiliki pinjaman aktif dan tidak dapat dihapus",
            });
        }

        await Anggota.destroy({
            where: {
                id: ids
            }
        });

        return res.status(200).json({
            status: "success",
            message: `${ids.length} anggota berhasil dihapus`,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

module.exports = {
    tambahAnggota,
    getAnggota,
    countAnggota,
    updateAnggota,
    deleteAnggota,
    deleteAnggotaBulk
};
