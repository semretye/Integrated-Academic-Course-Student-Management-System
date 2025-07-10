const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Register new admin or manager
exports.registerAdmin = async (req, res) => {
  const { username, password, email, phone, role } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      email,
      phone,
      role,
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Get all admins and managers
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: { $in: ['admin', 'manager'] } });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admins', error: error.message });
  }
};

// Delete an admin by ID
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    await Admin.findByIdAndDelete(id);
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Deletion failed', error: error.message });
  }
};
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, role } = req.body;

  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.username = username || admin.username;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;
    admin.role = role || admin.role;

    const updatedAdmin = await admin.save();
    res.status(200).json({ message: 'Admin updated successfully', admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};
