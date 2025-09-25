const jwt = require('jsonwebtoken');
const sql = require('mssql');

// exports.uploadImage = async (req, res) => {
//   try {
//     const token = req.cookies.accessToken;
//     if (!token) {
//       return res.status(401).json({ error: "Not authenticated" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const userId = decoded.id;
//     console.log("userid:",userId);
    
//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ error: 'File is required' });
//     }

//     const pool = await sql.connect();
//     await pool.request()
//       .input('UserId', sql.Int, userId)
//       .input('FileName', sql.NVarChar, file.originalname)
//       .input('FileType', sql.NVarChar, file.mimetype)
//       .input('FileSize', sql.Int, file.size)
//       .input('UploadedFile', sql.VarBinary(sql.MAX), file.buffer)
//       .input('UploadedOn', sql.DateTime, new Date())
//       .query(`
//         INSERT INTO UploadedImages (UserId, FileName, FileType, FileSize, UploadedFile, UploadedOn)
//         VALUES (@UserId, @FileName, @FileType, @FileSize, @UploadedFile, @UploadedOn)
//       `);

//     res.status(200).json({ message: 'File uploaded successfully' });
//   } catch (err) {
//     console.error('Upload Error:', err);
//     res.status(500).json({ error: 'File upload failed' });
//   }
// };




exports.uploadImage = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log("userid:", userId);
    
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const pool = await sql.connect();
    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .input('FileName', sql.NVarChar, file.originalname)
      .input('FileType', sql.NVarChar, file.mimetype)
      .input('FileSize', sql.Int, file.size)
      .input('UploadedFile', sql.VarBinary(sql.MAX), file.buffer)
      .input('UploadedOn', sql.DateTime, new Date())
      .query(`
        INSERT INTO UploadedImages (UserId, FileName, FileType, FileSize, UploadedFile, UploadedOn)
        OUTPUT INSERTED.ImageId
        VALUES (@UserId, @FileName, @FileType, @FileSize, @UploadedFile, @UploadedOn)
      `);

    const imageId = result.recordset[0].ImageId;

    res.status(200).json({ message: 'File uploaded successfully', imageId });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
};