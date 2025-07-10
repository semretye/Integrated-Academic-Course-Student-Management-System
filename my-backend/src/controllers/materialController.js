const Material = require('../models/Material');
const Course = require('../models/Course');
const User = require('../models/User'); 
const fs = require('fs');
const path = require('path');

exports.uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const material = new Material({
      title: req.body.title,
      description: req.body.description,
      filePath: `/uploads/materials/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      course: req.params.courseId,
      instructor: req.user.id
    });

    await material.save();
    
    // Update course materials array
    await Course.findByIdAndUpdate(
      req.params.courseId,
      { $push: { materials: material._id } }
    );

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
exports.getAllMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;

    const materials = await Material.find({ course: courseId })
      .sort({ createdAt: -1 }); // No populate

    res.json({ 
      success: true, 
      data: materials 
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Could not fetch materials',
      error: error.message 
    });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve material' });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const updated = await Material.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Material not found' });

    res.json({ success: true, message: 'Updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    // Delete file from disk
    if (material.filePath && fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    await Material.findByIdAndDelete(id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};
exports.downloadMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    // Construct absolute file path
    const filePath = path.join(__dirname, '../..', material.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename=${material.fileName}`);
    res.setHeader('Content-Type', material.fileType);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Download failed' });
  }
};
