import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username: formData.username,
        password: formData.password,
        role: formData.role
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      switch (user.role) {
        case 'student':
          navigate('/StudentHomePage');
          break;
        case 'teacher':
          navigate('/ViewInstructureDetail');
          break;
        case 'admin':
          navigate('/HomePageAdmin');
          break;
        case 'manager':
          navigate('/InstructureHomepage');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="role" style={styles.label}>I am a:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter your username"
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter your password"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? (
            <>
              <span style={styles.spinner}></span> Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <p style={styles.signupText}>
        Don't have an account?{' '}
        <Link to="/StudentRegistration" style={styles.signupLink}>Sign Up</Link>
      </p>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '450px',
    margin: '50px auto',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '25px',
    fontSize: '28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#34495e',
    fontSize: '15px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '6px',
    border: '1px solid #dfe6e9',
    fontSize: '16px',
    transition: 'border 0.3s',
  },
  select: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '6px',
    border: '1px solid #dfe6e9',
    fontSize: '16px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10px',
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    margin: '15px 0',
    textAlign: 'center',
  },
  spinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 1s ease-in-out infinite',
    marginRight: '10px',
  },
  signupText: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '15px',
    color: '#7f8c8d',
  },
  signupLink: {
    color: '#3498db',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
};

export default Login;
