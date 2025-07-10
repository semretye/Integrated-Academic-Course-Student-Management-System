import React from 'react';
import { Link } from 'react-router-dom';

// Embedded CSS styles
const styles = `
  .homepage {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #2c3e50;
  }

  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: white;
    border-bottom: 1px solid #ddd;
  }

  .logo-container {
    display: flex;
    align-items: center;
  }

  .logo {
    height: 40px;
    margin-right: 10px;
  }

  .school-name {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4a6bff;
  }

  .nav-links {
    display: flex;
    gap: 20px;
  }

  .nav-link {
    text-decoration: none;
    color: #2c3e50;
    font-weight: 500;
  }

  .nav-link:hover {
    color: #4a6bff;
  }

  .auth-buttons {
    display: flex;
    gap: 10px;
  }

  .btn {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 5px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background-color: #4a6bff;
    color: white;
    border: 2px solid #4a6bff;
  }

  .btn-primary:hover {
    background-color: #3a56d4;
    border-color: #3a56d4;
  }

  .btn-outline,
  .btn-outline-primary {
    background-color: transparent;
    color: #4a6bff;
    border: 2px solid #4a6bff;
  }

  .btn-outline:hover,
  .btn-outline-primary:hover {
    background-color: #4a6bff;
    color: white;
  }

  .hero {
    padding: 80px 20px;
    background-color: #eaf0ff;
    text-align: center;
  }

  .hero h1 {
    font-size: 2.8rem;
    margin-bottom: 1rem;
  }

  .hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }

  .hero-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
  }

  .featured-courses {
    padding: 80px 20px;
    background-color: #f8f9fa;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
  }

  .section-subtitle {
    text-align: center;
    color: #666;
    font-size: 1.2rem;
    max-width: 700px;
    margin: 0 auto 50px;
  }

  .course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 30px;
  }

  .course-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .course-image {
    height: 180px;
    background-size: cover;
    background-position: center;
  }

  .course-info {
    padding: 20px;
  }

  .course-info h3 {
    margin-bottom: 10px;
  }

  .course-meta {
    display: flex;
    justify-content: space-between;
    margin: 15px 0;
    font-size: 0.9rem;
    color: #777;
  }

  .cta-section {
    padding: 60px 20px;
    background-color: #4a6bff;
    text-align: center;
    color: white;
  }

  .cta-content h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .cta-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }

  .btn-large {
    font-size: 1.1rem;
    padding: 12px 25px;
  }

  .footer {
    background-color: #2c3e50;
    color: white;
    padding: 40px 20px 20px;
  }

  .footer-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    max-width: 1200px;
    margin: auto;
  }

  .footer-section {
    max-width: 300px;
    margin-bottom: 20px;
  }

  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .footer-links a {
    color: white;
    text-decoration: none;
  }

  .footer-links a:hover {
    text-decoration: underline;
  }

  .copyright {
    text-align: center;
    margin-top: 30px;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2rem;
    }

    .section-title {
      font-size: 2rem;
    }

    .section-subtitle {
      font-size: 1rem;
    }

    .featured-courses {
      padding: 50px 20px;
    }
  }
`;

const HomePage = () => {
  const featuredCourses = [
    {
      id: 'web-dev',
      title: 'Full Stack Web Development',
      description: 'Master HTML, CSS, JavaScript, React, Node.js and build complete web applications.',
      duration: '12 Weeks',
      level: 'Beginner to Advanced',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 'python',
      title: 'Python Programming',
      description: 'Learn Python from scratch, including data science, automation, and web development.',
      duration: '8 Weeks',
      level: 'Beginner Friendly',
      image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 'data-science',
      title: 'Data Science Fundamentals',
      description: 'Learn data analysis, visualization, and machine learning with Python and R.',
      duration: '10 Weeks',
      level: 'Intermediate Level',
      image: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    }
  ];

  return (
    <div className="homepage">
      <style>{styles}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <img src="/logo.png" alt="Semret Tech School" className="logo" />
          <span className="school-name">Semret Tech School</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/courses" className="nav-link">Courses</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
           
        </div>
        <div className="auth-buttons">
          <Link to="/Login" className="btn btn-outline">Login</Link>
       
          
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Transform Your Future with Tech Education</h1>
          <p>Join Semret Tech School to gain industry-relevant skills from expert instructors</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/courses" className="btn btn-outline">Browse Courses</Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="featured-courses">
        <div className="container">
          <h2 className="section-title">Popular Courses</h2>
          <p className="section-subtitle">Start learning with our most popular programs</p>
          <div className="course-grid">
            {featuredCourses.map(course => (
              <div className="course-card" key={course.id}>
                <div className="course-image" style={{ backgroundImage: `url(${course.image})` }}></div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span>{course.duration}</span>
                    <span>{course.level}</span>
                  </div>
                  <Link to={`/courses/${course.id}`} className="btn btn-primary">Learn More</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-5" style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/courses" className="btn btn-outline-primary">View All Courses</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Learning?</h2>
          <p>Join thousands of students advancing their careers with Semret Tech School</p>
          <Link to="/register" className="btn btn-primary btn-large">Enroll Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Semret Tech School</h3>
            <p>Empowering the next generation of technology professionals.</p>
          </div>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} Semret Tech School. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
