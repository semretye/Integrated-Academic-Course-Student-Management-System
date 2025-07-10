import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyCourses = ({ student }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get('http://localhost:8080/api/students/enrolled-courses', config);
      
      // Check if response.data exists and has data property
      if (response.data && response.data.data) {
        setEnrolledCourses(response.data.data);
      } else {
        throw new Error('Invalid response structure');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch enrolled courses');
      setLoading(false);
    }
  };

  fetchEnrolledCourses();
}, []);

  const fetchCourseMaterials = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`http://localhost:8080/api/courses/${courseId}/materials`, config);
      setCourseMaterials(response.data.data);
      setSelectedCourse(courseId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course materials');
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading your courses...</p>
    </div>
  );

  if (error) return (
    <div className="error-message">
      {error}
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  return (
    <div className="my-courses-container">
      <div className="courses-list">
        <h2>Your Enrolled Courses</h2>
        {enrolledCourses.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-book-open"></i>
            <h3>No enrolled courses</h3>
            <p>You haven't enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="enrolled-courses-grid">
            {enrolledCourses.map(course => (
              <div 
                key={course._id} 
                className={`course-item ${selectedCourse === course._id ? 'active' : ''}`}
                onClick={() => fetchCourseMaterials(course._id)}
              >
                <div className="course-thumbnail">
                  <img 
                    src={course.thumbnail} 
                    alt={course.name}
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = ''
                    }}
                  />
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p className="course-code">{course.code}</p>
                  <p className="instructor">
                    <i className="fas fa-user-tie"></i> 
                    {course.instructor?.firstName} {course.instructor?.lastName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="course-details">
        {selectedCourse ? (
          <div className="materials-section">
            <h3>Course Materials</h3>
            {courseMaterials.length === 0 ? (
              <div className="empty-materials">
                <i className="fas fa-folder-open"></i>
                <p>No materials available for this course yet</p>
              </div>
            ) : (
              <div className="materials-list">
                {courseMaterials.map(material => (
                  <div key={material._id} className="material-item">
                    <div className="material-icon">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="material-info">
                      <h4>{material.title}</h4>
                      <p>{material.description}</p>
                      <div className="material-meta">
                        <span>
                          <i className="fas fa-calendar-alt"></i> 
                          {new Date(material.uploadDate).toLocaleDateString()}
                        </span>
                        <span>
                          <i className="fas fa-file"></i> 
                          {material.type}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`http://localhost:8080${material.filePath}`} 
                      className="download-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fas fa-download"></i> Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="select-course-prompt">
            <i className="fas fa-hand-pointer"></i>
            <p>Select a course to view its materials</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;