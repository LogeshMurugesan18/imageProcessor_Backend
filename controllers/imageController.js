const sharp = require("sharp");
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









// const Jimp = require('jimp').default; // ✅ This is the key fix

// exports.upscaleImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const { option } = req.body;
//     const scale = parseFloat(option);

//     if (isNaN(scale) || scale <= 1) {
//       return res.status(400).json({ error: "Invalid upscale factor" });
//     }

//     console.log("Received file size:", req.file.buffer.length, "bytes");

//     let image;
//     try {
//       image = await Jimp.read(req.file.buffer); // ✅ Now this works
//     } catch (imgErr) {
//       console.error("Jimp failed to read image:", imgErr);
//       return res.status(400).json({ error: "Unsupported or corrupted image format" });
//     }

//     const originalWidth = image.bitmap.width;
//     const originalHeight = image.bitmap.height;

//     const newWidth = Math.round(originalWidth * scale);
//     const newHeight = Math.round(originalHeight * scale);

//     image.resize(newWidth, newHeight, Jimp.RESIZE_LANCZOS3);
//     image.contrast(0.1); // Optional sharpening

//     const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
//     const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

//     res.json({ image: base64Image });

//   } catch (err) {
//     console.error("Upscale failed:", err);
//     res.status(500).json({ error: err.message || "Image upscaling failed" });
//   }
// };
