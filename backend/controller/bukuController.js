const { Buku, Peminjaman, Rating } = require("../models");

const tambahBuku = async (req, res) => {
    try {
        const { judul, penulis, kategori } = req.body;

        if (!judul || !penulis || !kategori) {
            return res.status(400).json({
                status: "error",
                message: "Judul, penulis dan kategori wajib diisi",
            });
        }

        const dataBuku = await Buku.create({
            judul: judul,
            penulis: penulis,
            kategori: kategori,
            status: "Tersedia",
        });

        return res.status(201).json({
            status: "success",
            message: "Buku berhasil ditambahkan",
            data: dataBuku,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const getBuku = async (req, res) => {
    try {
        const search = req.query.search || "";
        const status = req.query.status || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { Op } = require("sequelize");

        const whereClause = {
            judul: { [Op.like]: `%${search}%` },
        };

        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await Buku.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: Rating,
                    as: "ratings",
                    attributes: ["nilai"],
                }
            ],
            distinct: true,
        });

        const booksWithRatings = rows.map((buku) => {
            const ratings = buku.ratings || [];
            const ratingCount = ratings.length;
            const ratingAverage = ratingCount > 0 
                ? ratings.reduce((sum, r) => sum + r.nilai, 0) / ratingCount 
                : 0;

            const bukuJson = buku.toJSON();
            delete bukuJson.ratings; // Remove ratings relation list from json to keep response clean
            return {
                ...bukuJson,
                rating_average: ratingAverage,
                rating_count: ratingCount,
            };
        });

        return res.status(200).json({
            status: "success",
            data: booksWithRatings,
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

const countBuku = async (req, res) => {
    const totalBuku = await Buku.count()

    return res.status(200).json({
        count: totalBuku
    })
}

const updateBuku = async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, penulis, kategori, status } = req.body;

        const buku = await Buku.findByPk(id);

        if (!buku) {
            return res.status(404).json({
                status: "error",
                message: "Buku tidak ditemukan",
            });
        }

        await buku.update({ judul, penulis, kategori, status });

        return res.status(200).json({
            status: "success",
            message: "Buku berhasil diperbarui",
            data: buku,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const deleteBuku = async (req, res) => {
    try {
        const { id } = req.params;
        const buku = await Buku.findByPk(id);

        if (!buku) {
            return res.status(404).json({
                status: "error",
                message: "Buku tidak ditemukan",
            });
        }

        // Hapus semua peminjaman terkait buku ini (Cascade)
        await Peminjaman.destroy({
            where: { bukuId: id }
        });

        await buku.destroy();

        return res.status(200).json({
            status: "success",
            message: "Buku berhasil dihapus",
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

const deleteBukuBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "ID buku tidak valid atau kosong",
            });
        }

        // Hapus semua peminjaman terkait buku-buku ini (Cascade)
        await Peminjaman.destroy({
            where: { bukuId: ids }
        });

        await Buku.destroy({
            where: {
                id: ids
            }
        });

        return res.status(200).json({
            status: "success",
            message: `${ids.length} buku berhasil dihapus`,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

module.exports = { tambahBuku, getBuku, countBuku, updateBuku, deleteBuku, deleteBukuBulk };