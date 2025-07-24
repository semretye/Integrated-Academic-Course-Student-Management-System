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

  if (loading) {
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
        {/* Sidebar */}
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
                  onClick={() => fetchCourseMaterials(course._id)}
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

        {/* Main Content */}
        <Col lg={8} xl={9} className="bg-light">
          <div className="p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
            {selectedCourse ? (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="h4 mb-0">Course Materials</h2>
                  <Badge bg="secondary" pill>
                    {courseMaterials.length} materials available
                  </Badge>
                </div>
                
                {courseMaterials.length === 0 ? (
                  <Card className="text-center py-5">
                    <Card.Body>
                      <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                        <span className="text-muted fs-4">📂</span>
                      </div>
                      <p className="text-muted mb-1">No materials available for this course yet</p>
                      <small className="text-muted">Check back later or contact your instructor</small>
                    </Card.Body>
                  </Card>
                ) : (
                  <Row xs={1} md={2} className="g-4">
                    {courseMaterials.map(material => (
                      <Col key={material._id}>
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex">
                              <div className="me-3">
                                <span className="text-primary fs-3">
                                  {material.type === 'pdf' ? '📄' :
                                   material.type === 'video' ? '🎬' :
                                   material.type === 'document' ? '📝' : '📑'}
                                </span>
                              </div>
                              <div className="flex-grow-1">
                                <Card.Title className="h6 mb-2">{material.title}</Card.Title>
                                <Card.Text className="small text-muted mb-2">
                                  {material.description}
                                </Card.Text>
                                <div className="d-flex small text-muted gap-3">
                                  <span>
                                    {new Date(material.uploadDate).toLocaleDateString()}
                                  </span>
                                  <span>
                                    {material.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                          <Card.Footer className="bg-transparent border-0">
                            <Button 
                              variant="primary" 
                              size="sm"
                              href={`http://localhost:8080${material.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </Button>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ) : (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <span className="text-muted fs-4">👉</span>
                  </div>
                  <h3 className="h5 mb-2">Select a Course</h3>
                  <p className="text-muted">Choose a course from the sidebar to view its materials</p>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default MyCourses;