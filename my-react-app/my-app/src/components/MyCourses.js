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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ marginTop: '15px' }}>Loading your courses...</p>
    </div>
  );

  if (error) return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      color: '#d32f2f'
    }}>
      <p>{error}</p>
      <button 
        style={{
          background: '#3f51b5',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '350px',
        padding: '20px',
        background: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto'
      }}>
        <h2 style={{
          marginBottom: '20px',
          color: '#333'
        }}>Your Enrolled Courses</h2>
        
        {enrolledCourses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <i className="fas fa-book-open" style={{
              fontSize: '48px',
              color: '#ccc',
              marginBottom: '15px'
            }}></i>
            <h3>No enrolled courses</h3>
            <p>You haven't enrolled in any courses yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '15px'
          }}>
            {enrolledCourses.map(course => (
              <div 
                key={course._id} 
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: selectedCourse === course._id ? '4px solid #3f51b5' : 'none'
                }}
                onClick={() => fetchCourseMaterials(course._id)}
              >
                <div style={{
                  height: '120px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={course.thumbnail } 
                    alt={course.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null; 
                      
                    }}
                  />
                </div>
                <div style={{ padding: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{course.name}</h3>
                  <p style={{
                    color: '#666',
                    fontSize: '0.9em',
                    margin: '0 0 5px 0'
                  }}>{course.code}</p>
                  <p style={{
                    color: '#666',
                    fontSize: '0.9em',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <i className="fas fa-user-tie"></i> 
                    {course.instructor?.firstName} {course.instructor?.lastName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        flex: '1',
        padding: '20px',
        overflowY: 'auto'
      }}>
        {selectedCourse ? (
          <div>
            <h3 style={{
              marginBottom: '20px',
              color: '#333'
            }}>Course Materials</h3>
            
            {courseMaterials.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <i className="fas fa-folder-open" style={{
                  fontSize: '48px',
                  color: '#ccc',
                  marginBottom: '15px'
                }}></i>
                <p>No materials available for this course yet</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '15px'
              }}>
                {courseMaterials.map(material => (
                  <div key={material._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '15px',
                      color: '#3f51b5'
                    }}>
                      <i className={`fas ${
                        material.type === 'pdf' ? 'fa-file-pdf' :
                        material.type === 'video' ? 'fa-video' :
                        material.type === 'document' ? 'fa-file-word' : 'fa-file-alt'
                      }`}></i>
                    </div>
                    <div style={{ flex: '1' }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{material.title}</h4>
                      <p style={{ margin: '0 0 10px 0', color: '#666' }}>{material.description}</p>
                      <div style={{
                        display: 'flex',
                        gap: '15px',
                        fontSize: '0.8em',
                        color: '#888'
                      }}>
                        <span>
                          <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i> 
                          {new Date(material.uploadDate).toLocaleDateString()}
                        </span>
                        <span>
                          <i className="fas fa-file" style={{ marginRight: '5px' }}></i> 
                          {material.type}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`http://localhost:8080${material.filePath}`} 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#3f51b5',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
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
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <i className="fas fa-hand-pointer" style={{
              fontSize: '48px',
              color: '#ccc',
              marginBottom: '15px'
            }}></i>
            <p>Select a course to view its materials</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;