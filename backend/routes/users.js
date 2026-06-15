const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const usersController = require('../controllers/usersController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const check = allowed.test(path.extname(file.originalname).toLowerCase());
    if (check) cb(null, true);
    else cb(new Error('Only images allowed!'));
  }
});

router.get('/profile/:id', usersController.getProfile);
router.patch('/change-password', auth, usersController.changePassword);
// @route   POST api/users/upload-avatar
router.post('/upload-avatar', auth, upload.single('avatar'), usersController.uploadAvatar);
router.delete('/delete-avatar', auth, usersController.deleteAvatar);


router.patch('/update-status', auth, usersController.updateStatus);

module.exports = router;
