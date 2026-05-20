const express = require("express");
const cors = require("cors");
const bukuRouter = require("./routes/buku.js");
const anggotaRouter = require("./routes/anggota.js");
const peminjamanRouter = require("./routes/peminjaman.js");


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/buku", bukuRouter);
app.use("/anggota", anggotaRouter);
app.use("/peminjaman", peminjamanRouter);


app.get("/", (req, res) => {
  res.send("Server sedang berjalan jalan");
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
