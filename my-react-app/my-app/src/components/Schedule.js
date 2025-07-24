import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';

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

  if (loadingCourses) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your courses...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Something went wrong</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0">
      <Row className="g-0">
        {/* Sidebar - Course List */}
        <Col lg={4} xl={3} className="bg-white border-end">
          <div className="p-3 border-bottom">
            <h2 className="h5 mb-1">Your Enrolled Courses</h2>
            <p className="text-muted small mb-0">{enrolledCourses.length} courses</p>
          </div>
          
          {enrolledCourses.length === 0 ? (
            <div className="p-4 text-center">
              <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                <span className="text-muted fs-4">📚</span>
              </div>
              <h3 className="h5 mb-2">No enrolled courses</h3>
              <p className="text-muted mb-3">You haven't enrolled in any courses yet.</p>
              <Button variant="primary" onClick={() => navigate('/courses')}>
                Browse Courses
              </Button>
            </div>
          ) : (
            <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              {enrolledCourses.map(course => (
                <ListGroup.Item 
                  key={course._id}
                  action
                  active={selectedCourse === course._id}
                  onClick={() => handleCourseSelect(course._id)}
                  className="border-0 rounded-0 px-4 py-3"
                >
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                      <span className="fs-5">📖</span>
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-1 text-truncate">{course.name}</h5>
                      <p className="small text-muted mb-1">{course.code}</p>
                      <p className="small text-muted mb-0">
                        Instructor: {course.instructor?.firstName} {course.instructor?.lastName}
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>

        {/* Main Content - Schedule */}
        <Col lg={8} xl={9} className="bg-light">
          <div className="p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
            {loadingSchedule ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-3">Loading schedule...</p>
                </div>
              </div>
            ) : error ? (
              <Alert variant="danger" className="text-center">
                <p>{error}</p>
              </Alert>
            ) : selectedCourse ? (
              schedule.length > 0 ? (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h4 mb-0">Scheduled Classes</h2>
                    <Badge bg="secondary" pill>
                      {schedule.length} sessions
                    </Badge>
                  </div>
                  
                  <Row xs={1} className="g-4">
                    {schedule.map((item) => (
                      <Col key={item._id}>
                        <Card>
                          <Card.Body>
                            <Card.Title className="h5 mb-3">{item.title}</Card.Title>
                            
                            <div className="d-flex gap-4 mb-3">
                              <div className="d-flex align-items-center">
                                <span className="me-2">📅</span>
                                <span className="text-muted">Date:</span>
                                <span className="ms-1 fw-semibold">{item.date}</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <span className="me-2">⏰</span>
                                <span className="text-muted">Time:</span>
                                <span className="ms-1 fw-semibold">{item.time}</span>
                              </div>
                            </div>
                            
                            {item.meetingLink && (
                              <Button 
                                variant="primary" 
                                href={item.meetingLink} 
                                target="_blank"
                                className="mb-3"
                              >
                                Join Meeting
                              </Button>
                            )}
                            
                            {item.description && (
                              <Card.Text className="text-muted">
                                <span className="me-2">📝</span>
                                {item.description}
                              </Card.Text>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="text-center">
                    <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                      <span className="text-muted fs-4">📅</span>
                    </div>
                    <h3 className="h5 mb-2">No Scheduled Classes</h3>
                    <p className="text-muted">No classes scheduled for this course yet</p>
                  </div>
                </div>
              )
            ) : (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <span className="text-muted fs-4">👉</span>
                  </div>
                  <h3 className="h5 mb-2">Select a Course</h3>
                  <p className="text-muted">Choose a course from the sidebar to view its schedule</p>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Schedule;