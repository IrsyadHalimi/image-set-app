const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const sharp = require("sharp");
const multer = require("multer");

const app = express();
const PORT = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));

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

// Compress image
const compressImage = (inputBuffer, outputPath, quality = 80) => {
  return sharp(inputBuffer)
    .resize(800)
    .jpeg({ quality })
    .toFile(outputPath);
};

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Download image route
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

// Download compressed image
app.post('/download-compress', express.json(), async (req, res) => {
  const { imageUrlCompress, quality = 80 } = req.body;
  try {
    const response = await axios.get(imageUrlCompress, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // File output name
    const fileName = path.basename(imageUrlCompress);
    const outputPath = path.join(downloadFolder, `compressed_${fileName}`);

    // Image Compression
    await compressImage(buffer, outputPath, quality);

    res.sendFile(outputPath);
  } catch (error) {
    console.log('Error downloading or compressing image:', error);
    res.status(500).send('Failed compressing image!');
  }
});

app.post('/upload-compress', upload.single('image'), async (req, res) => {
  const { quality = 80 } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded!');
  }

  try {
    const outputPath = path.join(downloadFolder, `compressed_${file.originalname}`);
    await compressImage(file.buffer, outputPath, quality);

    res.sendFile(outputPath);
  } catch (error) {
    console.error('Error compressing uploaded image:', error);
    res.status(500).send('Failed compressing image');
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running  on http://localhost:${PORT}`);
});