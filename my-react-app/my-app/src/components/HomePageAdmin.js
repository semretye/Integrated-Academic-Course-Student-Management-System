import React from 'react';
import { Link } from 'react-router-dom';
const HomePageAdmin = () => {
  return (
    <div>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>Admin Panel</div>
        <ul style={styles.navLinks}>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><Link to="/AdminRegister" className="nav-link">admin register</Link></li>
            <li><Link to="/AdminList" className="nav-link">Admin List</Link></li>
          <li><a href="#logout">Logout</a></li>
        </ul>
      </nav>

      {/* Dashboard Section */}
      <main style={styles.dashboard}>
        <h2>Welcome, Admin!</h2>
        <p>Here’s a quick overview of the system.</p>

        <div style={styles.statsContainer}>
          <div style={styles.card}>
            <h3>Registered Users</h3>
            <p>120</p>
          </div>
          <div style={styles.card}>
            <h3>Active Courses</h3>
            <p>24</p>
          </div>
          <div style={styles.card}>
            <h3>Instructors</h3>
            <p>15</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePageAdmin;

// Styles
const styles = {
  navbar: {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  navLinks: {
    listStyle: 'none',
    display: 'flex',
    gap: '1.5rem',
  },
  dashboard: {
    padding: '2rem',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
    gap: '1rem',
  },
  card: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
};
