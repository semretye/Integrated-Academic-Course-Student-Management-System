import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [editAdmin, setEditAdmin] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/all');
      setAdmins(response.data);
    } catch (err) {
      setError('❌ Failed to load admins. Please try again later.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/admin/${id}`);
      fetchAdmins(); // Refresh list
    } catch (err) {
      alert('❌ Failed to delete admin');
    }
  };

  const handleEditClick = (admin) => {
    setEditAdmin({ ...admin }); // Create a copy
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditAdmin((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8080/api/admin/${editAdmin._id}`, editAdmin);
      setEditAdmin(null);
      fetchAdmins(); // Refresh list
    } catch (err) {
      alert('❌ Failed to update admin');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Registered Admins / Managers</h2>
      {error && <p style={styles.error}>{error}</p>}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Username</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin._id}>
              <td style={styles.td}>{admin._id}</td>
              <td style={styles.td}>
                {editAdmin && editAdmin._id === admin._id ? (
                  <input
                    name="username"
                    value={editAdmin.username || ''}
                    onChange={handleEditChange}
                  />
                ) : (
                  admin.username
                )}
              </td>
              <td style={styles.td}>
                {editAdmin && editAdmin._id === admin._id ? (
                  <input
                    name="email"
                    value={editAdmin.email || ''}
                    onChange={handleEditChange}
                  />
                ) : (
                  admin.email
                )}
              </td>
              <td style={styles.td}>
                {editAdmin && editAdmin._id === admin._id ? (
                  <input
                    name="phone"
                    value={editAdmin.phone || ''}
                    onChange={handleEditChange}
                  />
                ) : (
                  admin.phone
                )}
              </td>
              <td style={styles.td}>
                {editAdmin && editAdmin._id === admin._id ? (
                  <select
                    name="role"
                    value={editAdmin.role || ''}
                    onChange={handleEditChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                ) : (
                  admin.role
                )}
              </td>
              <td style={styles.td}>
                {editAdmin && editAdmin._id === admin._id ? (
                  <div style={styles.buttonGroup}>
                    <button onClick={handleEditSubmit} style={styles.saveBtn}>💾 Save</button>
                    <button onClick={() => setEditAdmin(null)} style={styles.cancelBtn}>Cancel</button>
                  </div>
                ) : (
                  <div style={styles.buttonGroup}>
                    <button onClick={() => handleEditClick(admin)} style={styles.editBtn}>✏️ Edit</button>
                    <button onClick={() => handleDelete(admin._id)} style={styles.deleteBtn}>🗑️ Delete</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminList;

const styles = {
  container: {
    maxWidth: '950px',
    margin: '3rem auto',
    padding: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 0 12px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '0.8rem',
    textAlign: 'left',
  },
  td: {
    padding: '0.8rem',
    borderBottom: '1px solid #ccc',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  editBtn: {
    marginRight: '0.5rem',
    padding: '0.4rem 0.7rem',
    backgroundColor: '#ffc107',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    padding: '0.4rem 0.7rem',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  saveBtn: {
    marginRight: '0.5rem',
    padding: '0.4rem 0.7rem',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  cancelBtn: {
    padding: '0.4rem 0.7rem',
    backgroundColor: '#6c757d',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
