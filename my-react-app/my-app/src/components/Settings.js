import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = ({ student }) => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    semester: '',
    profilePicture: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (student) {
      setProfile({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        department: student.department || '',
        semester: student.semester || '',
        profilePicture: null
      });
      setPreviewImage(student.profilePicture || '/default-profile.jpg');
      setLoading(false);
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile(prev => ({ ...prev, profilePicture: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      Object.entries(profile).forEach(([key, value]) => {
        if (value && key !== 'email') formData.append(key, value);
      });

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      await axios.put('http://localhost:8080/api/students/profile', formData, config);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8080/api/students/account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Account deleted.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  if (loading) return <div className="text-center my-5"><div className="spinner-border text-primary" role="status" /><p>Loading your settings...</p></div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Account Settings</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4 text-center">
          <img
            src={previewImage}
            alt="Profile"
            className="rounded-circle mb-2"
            width="120"
            height="120"
          />
          <div className="d-flex justify-content-center gap-2 mt-2">
            <label className="btn btn-outline-secondary btn-sm mb-0">
              <i className="fas fa-camera me-1"></i> Change
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </label>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                setProfile(prev => ({ ...prev, profilePicture: null }));
                setPreviewImage('');
              }}
            >
              <i className="fas fa-trash me-1"></i> Remove
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">First Name</label>
          <input
            type="text"
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={profile.email}
            className="form-control"
            disabled
          />
        </div>

    
       

        <div className="d-flex gap-2 mb-5">
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save me-1"></i> Save Changes
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </button>
        </div>
      </form>

      <hr />

      <div className="my-4">
        <h4>Account Security</h4>
        <button className="btn btn-outline-warning mt-2" onClick={() => alert('Redirect to password reset')}>
          <i className="fas fa-key me-1"></i> Change Password
        </button>
      </div>

      <div className="my-4">
        <h4 className="text-danger">Danger Zone</h4>
        <p>This action is irreversible. All your data will be lost.</p>
        <button className="btn btn-danger" onClick={handleDeleteAccount}>
          <i className="fas fa-trash me-1"></i> Delete Account
        </button>
      </div>
    </div>
  );
};

export default Settings;
