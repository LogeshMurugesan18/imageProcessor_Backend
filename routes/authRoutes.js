const express = require('express');
const router = express.Router();
const authController =require('../controllers/authController');
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const { verifyToken } = require("../middleware/authMiddleware");
const imageController = require('../controllers/imageController');

//email verification method
router.post('/send-verification',authController.sendVerificationLink);
//email verification method
router.get("/verify-email", authController.verifyEmail);
//complete signup method
router.post('/complete-signup',authController.completeSignup);
//login method
router.post("/login", authController.login);
//upload image method
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload-image",verifyToken,upload.single("uploadedFile"), uploadController.uploadImage);

//logout method
router.post('/logout',authController.logout);
//get user profile method
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: "This is your profile", user: req.user });
});
//rotate image method
router.post("/rotate", verifyToken, upload.single("uploadedFile"),imageController.rotateImage);
//upscale image method
router.post('/upscale',upload.single("uploadedFile"),imageController.upscaleImage)

module.exports =router;

