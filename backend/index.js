const express = require("express");
const cors = require("cors");
const bukuRouter = require("./routes/buku.js");
const anggotaRouter = require("./routes/anggota.js");


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/buku", bukuRouter);
app.use("/anggota", anggotaRouter);


app.get("/", (req, res) => {
  res.send("Server Express Sequelize berjalan dengan baik!");
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
