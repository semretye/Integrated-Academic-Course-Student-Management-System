import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Outlet } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Spinner, 
  Alert,
  Nav,
  Navbar,
  Badge,
  Card,
  ProgressBar
} from 'react-bootstrap';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    students: 42,
    assignments: 5,
    materials: 8,
    completionRate: 75
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
  const fetchCourseDetailsAndStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!courseId) {
        throw new Error('Course ID is missing');
      }

      const [courseRes, statsRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:8080/api/courses/${courseId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCourse(courseRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching course or stats:', err);
      setError(err.response?.data?.message || err.message || 'Error loading course data');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchCourseDetailsAndStats();
}, [courseId, navigate]);

  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Course</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-primary" onClick={() => navigate('/instructor')}>
              Back to Courses
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>Course Not Found</Alert.Heading>
          <p>The requested course could not be found.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-primary" onClick={() => navigate('/instructor')}>
              Back to Courses
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0">
      {/* Navigation Bar */}
      <Navbar bg="white" expand="lg" className="border-bottom shadow-sm py-3 sticky-top">
        <Container fluid>
          <Navbar.Brand as={Link} to="/instructor" className="fw-bold text-primary">
            Instructor Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}`}>
                  Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}/upload-material`}>
                  Upload Material
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}/upload-assignment`}>
                  Assignments
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}/view-submitted`}>
                  View Submissions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}/schedule-class`}>
                  Schedule Class
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}/assignment-list`}>
                  Assignment List
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to={`/instructor/courses/${courseId}/material-list`}>
                  Material Lists
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
  <Nav.Link as={Link} to={`/instructor/courses/${courseId}/notifications`}>
    Notifications
  </Nav.Link>
</Nav.Item>
            </Nav>
            
            <Button 
              variant="outline-danger" 
              onClick={handleLogout}
              className="ms-2"
            >
              Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Course Header */}
      <Container fluid className="bg-primary bg-opacity-10 py-4 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center mb-2">
                <h2 className="fw-bold mb-0">{course.name}</h2>
                <Badge bg="primary" className="ms-3 fs-6 py-2">{course.code}</Badge>
              </div>
              <p className="lead mb-0">{course.description}</p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button variant="outline-primary" className="me-2">
                Manage Students
              </Button>
              <Button variant="outline-secondary">
                Course Settings
              </Button>
            </Col>
          </Row>
        </Container>
      </Container>

      {/* Quick Stats */}
      <Container className="mb-4">
        <Row className="g-4">
          <Col md={3}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <span className="text-primary fs-4">👥</span>
                </div>
                <h3 className="mb-1">{stats.students}</h3>
                <p className="text-muted mb-0">Enrolled Students</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <span className="text-success fs-4">📝</span>
                </div>
                <h3 className="mb-1">{stats.assignments}</h3>
                <p className="text-muted mb-0">Active Assignments</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <span className="text-info fs-4">📚</span>
                </div>
                <h3 className="mb-1">{stats.materials}</h3>
                <p className="text-muted mb-0">Learning Materials</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Completion Rate</span>
                  <span className="fw-bold">{stats.completionRate}%</span>
                </div>
                <ProgressBar now={stats.completionRate} variant="warning" className="mb-3" />
                <div className="d-flex justify-content-between small">
                  <span className="text-muted">Avg. Score</span>
                  <span className="fw-bold">82%</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Main Content Area */}
      <Container>
        <Row>
          <Col>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Outlet />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default CourseDetailPage;