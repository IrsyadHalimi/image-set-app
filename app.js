const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Folder image
const downloadFolder = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

// Fungsi download
const downloadImage = async (url, filename) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const filePath = path.join(downloadFolder, filename);
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
};

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/download", async (req, res) => {
  const imageUrl = req.body.imageUrl;

  if (!imageUrl) {
    return res.status(400).send("Image URL not valid!");
  }

  try {
    const filename = `image_${Date.now()}.jpg`;
    const filePath = await downloadImage(imageUrl, filename);
    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed load image, please check the URL and try again.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running  on http://localhost:${PORT}`);
});