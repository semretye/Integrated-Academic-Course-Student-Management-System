import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Navbar,
  Nav,
  Offcanvas,
  Alert,
  Image
} from 'react-bootstrap';

const ViewInstructureDetail = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignedCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get('http://localhost:8080/api/instructors/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Invalid response');
      }

      const formattedCourses = response.data.data.map(course => ({
        ...course,
        id: course._id || course.id,
        schedule: course.schedule || [],
        materials: course.materials || []
      }));

      setCourses(formattedCourses);
      setError(null);
    } catch (err) {
      console.error('API Error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load courses';
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchAssignedCourses();
  }, [currentUser, authLoading, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const profilePicUrl = currentUser?.profileImageUrl || 'https://via.placeholder.com/100';

  if (authLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <>
      {/* Top Navbar */}
      

      {/* Offcanvas (Mobile Sidebar) */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="text-center mb-3">
            <Image src={profilePicUrl} roundedCircle width="80" height="80" />
            <h6 className="mt-2">{currentUser?.name || currentUser?.username}</h6>
          </div>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/instructor" onClick={() => setShowSidebar(false)}>My Courses</Nav.Link>
            <Nav.Link as={Link} to="/instructor/profile" onClick={() => setShowSidebar(false)}>Profile</Nav.Link>
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <Container fluid>
        <Row>
          {/* Desktop Sidebar */}
          <Col md={3} className="d-none d-md-block bg-light p-3">
            <div className="text-center mb-3">
              <Image src={profilePicUrl} roundedCircle width="100" height="100" />
              <h6 className="mt-2">{currentUser?.name || currentUser?.username}</h6>
            </div>
            <Nav className="flex-column">
              <Nav.Link as={Link} to="/CourseDetailPage">My Courses</Nav.Link>
              <Nav.Link as={Link} to="/instructor/profile">Profile</Nav.Link>
              <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
            </Nav>
          </Col>

          {/* Course Display */}
          <Col md={9} className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}
            {loading ? (
              <div className="text-center"><Spinner animation="border" /></div>
            ) : (
              <CoursesList courses={courses} />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

const CoursesList = ({ courses }) => (
  <>
    <h2>My Courses</h2>
    {courses.length === 0 ? (
      <p>No courses assigned yet.</p>
    ) : (
      <Row>
        {courses.map(course => (
          <Col md={6} lg={4} key={course.id} className="mb-4">
            <Card>
              <Card.Header>
                <h5>{course.name}</h5>
                <small>{course.code}</small>
              </Card.Header>
              <Card.Body>
                <p>{course.description}</p>
                <Button
                  as={Link}
                  to={`/instructor/courses/${course.id}`}
                  variant="primary"
                  size="sm"
                >
                  View Course
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    )}
  </>
);

export default ViewInstructureDetail;
