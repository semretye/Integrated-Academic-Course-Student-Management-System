import React, { useState } from 'react';
import axios from 'axios';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'admin',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/admin/register', formData);
      setMessage('✅ Registration successful!');
      setFormData({
        username: '',
        password: '',
        email: '',
        phone: '',
        role: 'admin',
      });
    } catch (err) {
      setError('❌ Registration failed. Please check inputs or try again later.');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin / Manager Registration</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <button type="submit" style={styles.button}>Register</button>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
};

export default AdminRegister;

const styles = {
  container: {
    maxWidth: '450px',
    margin: '3rem auto',
    padding: '2rem',
    borderRadius: '10px',
    backgroundColor: '#f8f9fa',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '.5rem',
    fontWeight: 'bold',
    color: '#444',
  },
  input: {
    padding: '0.6rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  select: {
    padding: '0.6rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    padding: '0.8rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginTop: '1rem',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '1rem',
  },
};
