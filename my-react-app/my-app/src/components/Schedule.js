import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Schedule = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get('http://localhost:8080/api/students/enrolled-courses', config);
        setEnrolledCourses(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch enrolled courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const fetchSchedule = async (courseId) => {
    setLoadingSchedule(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(
        `http://localhost:8080/api/courses/${courseId}/schedule?nocache=${Date.now()}`,
        config
      );
      setSchedule(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedule');
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    if (courseId) {
      fetchSchedule(courseId);
    } else {
      setSchedule([]);
    }
  };

  if (loadingCourses) return (
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
                onClick={() => handleCourseSelect(course._id)}
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
        {loadingSchedule ? (
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
            <p style={{ marginTop: '15px' }}>Loading schedule...</p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#d32f2f'
          }}>
            <p>{error}</p>
          </div>
        ) : selectedCourse ? (
          schedule.length > 0 ? (
            <div>
              <h2 style={{
                marginBottom: '20px',
                color: '#333'
              }}>Scheduled Classes</h2>
              
              <div style={{
                display: 'grid',
                gap: '15px'
              }}>
                {schedule.map((item) => (
                  <div key={item._id} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{item.title}</h3>
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      marginBottom: '10px'
                    }}>
                      <p style={{ margin: '0' }}>
                        <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                        <strong>Date:</strong> {item.date}
                      </p>
                      <p style={{ margin: '0' }}>
                        <i className="fas fa-clock" style={{ marginRight: '5px' }}></i>
                        <strong>Time:</strong> {item.time}
                      </p>
                    </div>
                    {item.meetingLink && (
                      <a 
                        href={item.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          background: '#3f51b5',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          marginBottom: '10px'
                        }}
                      >
                        <i className="fas fa-video" style={{ marginRight: '5px' }}></i>
                        Join Meeting
                      </a>
                    )}
                    {item.description && (
                      <p style={{ margin: '10px 0 0 0' }}>
                        <i className="fas fa-align-left" style={{ marginRight: '5px' }}></i>
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666'
            }}>
              <i className="fas fa-calendar-times" style={{
                fontSize: '48px',
                color: '#ccc',
                marginBottom: '15px'
              }}></i>
              <p>No scheduled classes found for this course.</p>
            </div>
          )
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
            <p>Select a course to view its schedule</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;