import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/auth';
import * as usersController from '../controllers/usersController';

const router = Router();

// Multer для завантаження аватарів
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user!.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ok) cb(null, true);
    else cb(new Error('Only images allowed!'));
  },
});

router.get('/profile/:id', usersController.getProfile);
router.patch('/change-password', auth, usersController.changePassword);
router.post('/upload-avatar', auth, upload.single('avatar'), usersController.uploadAvatar);
router.delete('/delete-avatar', auth, usersController.deleteAvatar);
router.patch('/update-status', auth, usersController.updateStatus);

export default router;
