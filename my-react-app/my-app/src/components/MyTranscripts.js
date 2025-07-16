import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyTranscripts = ({ student }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState({
    courses: true,
    transcript: false
  });
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  // Fetch enrolled courses on component mount
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

        const response = await axios.get(
          'http://localhost:8080/api/students/enrolled-courses', 
          config
        );
        
        if (response.data && response.data.data) {
          setEnrolledCourses(response.data.data);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch enrolled courses');
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    fetchEnrolledCourses();
  }, []);

  // Fetch transcript when a course is selected
  const fetchCourseTranscript = async (courseId) => {
    setSelectedCourse(courseId);
    setLoading(prev => ({ ...prev, transcript: true }));
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
        `http://localhost:8080/api/students/${student._id}/transcripts/${courseId}`,
        config
      );

      if (response.data && response.data.data) {
        setTranscriptData(response.data.data);
      } else {
        throw new Error('Unexpected transcript format');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load transcript');
    } finally {
      setLoading(prev => ({ ...prev, transcript: false }));
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || !selectedCourse) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.post(
        `http://localhost:8080/api/students/${student._id}/feedback`,
        { 
          courseId: selectedCourse,
          feedback: feedback.trim() 
        },
        config
      );

      setFeedback('');
      alert('Feedback submitted successfully!');
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading.courses) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <div className="spinner"></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: '#d32f2f' 
      }}>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3f51b5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: 'calc(100vh - 60px)',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Course List Sidebar */}
      <div style={{ 
        width: '300px', 
        padding: '20px', 
        borderRight: '1px solid #e0e0e0',
        backgroundColor: 'white',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          marginBottom: '20px', 
          color: '#333',
          paddingBottom: '10px',
          borderBottom: '1px solid #eee'
        }}>
          My Enrolled Courses
        </h2>

        {enrolledCourses.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#666'
          }}>
            <p>You haven't enrolled in any courses yet.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '15px' 
          }}>
            {enrolledCourses.map(course => (
              <div 
                key={course._id}
                onClick={() => fetchCourseTranscript(course._id)}
                style={{
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: selectedCourse === course._id ? '#e3f2fd' : 'white',
                  border: `1px solid ${selectedCourse === course._id ? '#90caf9' : '#e0e0e0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                <h3 style={{ 
                  margin: '0 0 5px 0', 
                  fontSize: '1.1rem',
                  color: selectedCourse === course._id ? '#1976d2' : '#333'
                }}>
                  {course.name}
                </h3>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  {course.code} • {course.credits} credits
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        padding: '20px',
        overflowY: 'auto'
      }}>
        {!selectedCourse ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem' }}>Select a course to view your transcript</p>
            </div>
          </div>
        ) : loading.transcript ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <div className="spinner"></div>
            <p>Loading transcript...</p>
          </div>
        ) : transcriptData ? (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <h2 style={{ margin: 0 }}>
                Transcript for {transcriptData.course?.name || 'Selected Course'}
              </h2>
              <p style={{ 
                margin: 0,
                color: '#666',
                fontSize: '0.9rem'
              }}>
                {transcriptData.course?.code || ''}
              </p>
            </div>

            {/* Transcript Details */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0 }}>Course Performance</h3>
              
              {transcriptData.assignments && transcriptData.assignments.length > 0 ? (
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  marginBottom: '20px'
                }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#f5f5f5',
                      textAlign: 'left'
                    }}>
                      <th style={{ padding: '12px 15px' }}>Assignment</th>
                      <th style={{ padding: '12px 15px' }}>Score</th>
                      <th style={{ padding: '12px 15px' }}>Max Score</th>
                      <th style={{ padding: '12px 15px' }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transcriptData.assignments.map((assignment, index) => (
                      <tr key={index} style={{ 
                        borderBottom: '1px solid #eee',
                        '&:last-child': { borderBottom: 'none' }
                      }}>
                        <td style={{ padding: '12px 15px' }}>{assignment.name}</td>
                        <td style={{ padding: '12px 15px' }}>{assignment.score}</td>
                        <td style={{ padding: '12px 15px' }}>{assignment.maxScore}</td>
                        <td style={{ padding: '12px 15px' }}>{assignment.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No assignment data available for this course.</p>
              )}

              {/* Course Summary */}
              <div style={{ 
                backgroundColor: '#f9f9f9', 
                padding: '15px', 
                borderRadius: '4px',
                marginTop: '20px'
              }}>
                <h4 style={{ marginTop: 0 }}>Course Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Current Grade:</p>
                    <p style={{ margin: '5px 0' }}>{transcriptData.currentGrade || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Overall Percentage:</p>
                    <p style={{ margin: '5px 0' }}>{transcriptData.overallPercentage || '0'}%</p>
                  </div>
                </div>
                {transcriptData.remarks && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Instructor Remarks:</p>
                    <p style={{ margin: '5px 0', fontStyle: 'italic' }}>{transcriptData.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Section */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0 }}>Provide Feedback</h3>
              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="feedback" style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold'
                  }}>
                    Your Feedback:
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="Share your thoughts about this course..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3f51b5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#303f9f'
                    }
                  }}
                >
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#666'
          }}>
            <p>No transcript data available for the selected course.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTranscripts;