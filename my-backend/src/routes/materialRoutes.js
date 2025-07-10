const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/authMiddleware');
const materialController = require('../controllers/materialController');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});


// Routes
router.post('/courses/:courseId/materials', 
  authenticate,
  upload.single('file'),
  materialController.uploadMaterial
);
router.get('/materials/:id/download', 
  authenticate,
  materialController.downloadMaterial
);
router.get('/courses/:courseId/materials', materialController.getAllMaterials);
router.get('/materials/:id', materialController.getMaterialById);
router.put('/materials/:id', materialController.updateMaterial);
router.delete('/materials/:id', materialController.deleteMaterial);

module.exports = router;
