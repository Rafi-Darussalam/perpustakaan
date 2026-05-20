const { Peminjaman, Anggota, Buku, Rating, sequelize } = require("../models");
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
    await Buku.update({ status: "Dipinjam" }, { where: { id: bukuId } });

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

    const whereClause = {};

    if (search) {
      whereClause["$anggota.nama$"] = { [Op.like]: `%${search}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Peminjaman.findAndCountAll({
      where: whereClause,
      include: [
        { model: Anggota, as: "anggota", required: false },
        { model: Buku, as: "buku", required: false },
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      subQuery: false,
      distinct: true,
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
          [Op.lt]: today,
        },
      },
      include: [
        { model: Anggota, as: "anggota" },
        { model: Buku, as: "buku" },
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
    const { kondisi, rating } = req.body; // 'utuh' atau 'rusak'

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
      tanggal_kembali: new Date(),
    });

    const buku = await Buku.findByPk(peminjaman.bukuId);
    let newRatingCount = buku.rating_count || 0;
    let newRatingAverage = buku.rating_average || 0;

    if (rating && rating > 0 && rating <= 5) {
      await Rating.create({
        bukuId: peminjaman.bukuId,
        nilai: Number(rating),
      });

      newRatingAverage =
        (newRatingAverage * newRatingCount + Number(rating)) /
        (newRatingCount + 1);
      newRatingCount += 1;
    }

    // Update status buku berdasarkan kondisi dan update rating
    await buku.update({
      status: kondisi === "rusak" ? "Rusak" : "Tersedia",
      rating_average: newRatingAverage,
      rating_count: newRatingCount,
    });

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
};

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
        status: "Dipinjam",
      },
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
          [Op.in]: ids,
        },
      },
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
};

const countPeminjamanStats = async (req, res) => {
  try {
    const totalDipinjam = await Peminjaman.count({
      where: { status: "Dipinjam" },
    });

    const today = new Date();
    const totalTerlambat = await Peminjaman.count({
      where: {
        status: "Dipinjam",
        tanggal_jatuh_tempo: {
          [Op.lt]: today,
        },
      },
    });

    return res.status(200).json({
      totalDipinjam,
      totalTerlambat,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

const getChartData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Count new borrowings
    const peminjamanData = await Peminjaman.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("tanggal_pinjam")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        tanggal_pinjam: {
          [Op.gte]: startDate,
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("tanggal_pinjam"))],
    });

    // Fill in missing dates
    const result = [];
    const pinjamMap = new Map(
      peminjamanData.map((item) => [
        item.dataValues.date,
        parseInt(item.dataValues.count),
      ]),
    );

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      result.push({
        date: dateStr,
        peminjaman: pinjamMap.get(dateStr) || 0,
      });
    }

    // Add today explicitly to be safe, or just ensure the loop reaches it
    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
    if (result[result.length - 1].date !== todayStr) {
      result.push({
        date: todayStr,
        peminjaman: pinjamMap.get(todayStr) || 0,
      });
    }

    return res.status(200).json({
      status: "success",
      data: result,
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
  tambahPeminjaman,
  getPeminjaman,
  getOverduePeminjaman,
  kembalikanBuku,
  hapusMasalPeminjaman,
  countPeminjamanStats,
  getChartData,
};
