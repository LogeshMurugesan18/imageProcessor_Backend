const sharp = require("sharp");
const multer = require('multer');
const upload = multer();
const sql = require('mssql');
const jwt = require('jsonwebtoken')

exports. rotateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const option = req.body.option; // "90", "180", "270", "flipH", "flipV"
    let transformer = sharp(req.file.buffer);

    switch (option) {
      case "90":
        transformer = transformer.rotate(90);
        break;
      case "180":
        transformer = transformer.rotate(180);
        break;
      case "-90":
        transformer = transformer.rotate(-90);
        break;
      case "-180":
        transformer = transformer.rotate(-180);
        break;
      case "flipH":
        transformer = transformer.flop(); // horizontal flip
        break;
      case "flipV":
        transformer = transformer.flip(); // vertical flip
        break;
      default:
        return res.status(400).json({ message: "Invalid rotate option" });
    }

    const outputBuffer = await transformer.png().toBuffer();

    // Convert processed image to base64 for frontend preview
    const base64Image = `data:image/png;base64,${outputBuffer.toString("base64")}`;

    res.json({ image: base64Image });
  } catch (err) {
    console.error("Rotation error:", err);
    res.status(500).json({ message: "Image rotation failed", error: err.message });
  }
};


//upscale

exports.upscaleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { option } = req.body; // scaling factor (1.5, 2, 3, 4)
    const scale = parseFloat(option);

    if (isNaN(scale) || scale <= 1) {
      return res.status(400).json({ error: "Invalid upscale factor" });
    }

    // Get original metadata
    const metadata = await sharp(req.file.buffer).metadata();
    const newWidth = Math.round((metadata.width || 0) * scale);
    const newHeight = Math.round((metadata.height || 0) * scale);

    // Process upscale
    const processedImage = await sharp(req.file.buffer)
      .resize({
        width: newWidth,
        height: newHeight,
        kernel:sharp.kernel.lanczos3,
        fastShrinkOnLoad:false,
      })
      .sharpen({sigma:1})
      .png({quality:100, compressionLevel:0})
      .toBuffer();

    // Convert to base64 for Angular preview
    const base64Image = `data:image/png;base64,${processedImage.toString("base64")}`;

    res.json({ image: base64Image });
  } catch (err) {
    console.error("Upscale failed:", err);
    res.status(500).json({ error: "Image upscaling failed" });
  }
};



// processed image to sql database

exports.saveImageProcess = async (req, res) => {
  try {
    // 1️⃣ Get userId from accessToken cookie
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; // same as in uploadImage
    console.log("userid:", userId);

    const { imageId, processedFileSize, actionId } = req.body;
    const processedFile = req.file;

    if (!processedFile) {
      return res.status(400).json({ error: 'No processed file uploaded' });
    }

    const pool = await sql.connect();
    await pool.request()
      .input('UserId', sql.Int, userId) // <-- add userId
      .input('ImageId', sql.Int, parseInt(imageId))
      .input('ProcessedFileSize', sql.Int, parseInt(processedFileSize) || 0)
      .input('ProcessedFile', sql.VarBinary(sql.MAX), processedFile.buffer)
      .input('ActionId', sql.UniqueIdentifier, actionId || null)
      .input('ProcessedOn', sql.DateTime, new Date())
      .query(`
        INSERT INTO ImageProcess (
          ImageProcessId, UserId, ImageId, ProcessedFileSize,
          ProcessStart, ProcessEnd, ProcessedFile, ActionId,
          UpdatedOn
        )
        VALUES (
          NEWID(), @UserId, @ImageId, @ProcessedFileSize,
          GETDATE(), GETDATE(), @ProcessedFile,
          @ActionId, GETDATE()
        )
      `);

    res.status(200).json({ message: 'Processed image saved successfully' });
  } catch (err) {
    console.error('Save Image Process Error:', err.message);
    res.status(500).json({ error: 'Failed to save processed image', details: err.message });
  }
};