// src/controllers/employeeController.js
const pool = require('../config/db');

// Fetch all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.name, e.email, e.phone_number, u.username, u.role 
      FROM employees e 
      JOIN users u ON e.user_id = u.id
    `);
    res.json({ status: 'success', employees: result.rows });
  } catch (error) {
    console.error('Error retrieving employees:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch employees' });
  }
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, phoneNumber, username, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !username || !password) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Insert into users first
    const userResult = await pool.query(
      'INSERT INTO users(username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, password, role]
    );
    const userId = userResult.rows[0].id;

    // Insert employee record
    const empResult = await pool.query(
      `INSERT INTO employees (name, email, phone_number, user_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phoneNumber, userId]
    );

    res.status(201).json({ status: 'success', message: 'Employee created', employee: empResult.rows[0] });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create employee' });
  }
};

// Update an existing employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber, role } = req.body;

    if (!name || !email || !phoneNumber || !role) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Update employee table
    const empRes = await pool.query(
      `UPDATE employees SET name = $1, email = $2, phone_number = $3 
       WHERE id = $4 RETURNING *`,
      [name, email, phoneNumber, id]
    );
    if (empRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    // Update user role if needed
    await pool.query('UPDATE users SET role = $1 WHERE id = (SELECT user_id FROM employees WHERE id = $2)', [role, id]);

    res.json({ status: 'success', message: 'Employee updated', employee: empRes.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update employee' });
  }
};

// Delete an employee (and optionally associated user)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const delEmp = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING user_id', [id]);
    if (delEmp.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }
    // Optionally cleanup user
    const userId = delEmp.rows[0].user_id;
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ status: 'success', message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete employee' });
  }
};

// Search employees
exports.searchEmployees = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ status: 'error', message: 'Search query required' });
    }
    const pattern = `%${q}%`;
    const result = await pool.query(
      `SELECT e.id, e.name, e.email, e.phone_number, u.username, u.role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.name ILIKE $1 OR e.email ILIKE $1 OR e.phone_number ILIKE $1`,
      [pattern]
    );
    res.json({ status: 'success', employees: result.rows });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ status: 'error', message: 'Search failed' });
  }
};
