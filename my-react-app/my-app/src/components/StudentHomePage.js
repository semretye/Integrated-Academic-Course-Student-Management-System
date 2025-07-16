import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Tab, Nav, Spinner, Alert, Button, 
  Card, Form, Badge, Image, Navbar, Dropdown, Modal, ListGroup
} from 'react-bootstrap';
import {
  Speedometer2, JournalBookmark, Calendar3, ListTask, 
  GraphUp, Envelope, Gear, BoxArrowRight, Bell, Search,
  PersonCircle, Book, People, Clock, Plus, CheckCircle
} from 'react-bootstrap-icons';
import MyCourses from './MyCourses';
import Schedule from './Schedule';
import Assignments from './Assignments';
import Grades from './Grades';
import Messages from './Messages';
import MyTranscripts from './MyTranscripts';
import Settings from './Settings';

function StudentHomePage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      // Fetch student data with enrolled courses populated
      const studentRes = await axios.get('http://localhost:8080/api/students/me', {
        ...config,
        params: { populate: 'enrolledCourses' }
      });
      
      if (!studentRes.data.success) {
        throw new Error(studentRes.data.message || 'Failed to fetch student data');
      }

      setStudent(studentRes.data.data);
    } catch (err) {
      console.error('Student data fetch error:', {
        message: err.message,
        response: err.response?.data
      });
      setError(err.response?.data?.message || 'Failed to load student data.');
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/students/courses/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Merge with student's enrollment status
        const coursesWithEnrollment = response.data.data.map(course => ({
          ...course,
          isEnrolled: student?.enrolledCourses?.some(ec => ec._id === course._id) || false,
          studentCount: course.students?.length || 0
        }));
        setCourses(coursesWithEnrollment);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load available courses');
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/students/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { timestamp: Date.now() } // Cache buster
      });

      if (response.data && response.data.success) {
        const notifications = response.data.data || [];
        
        // Process notifications with proper date handling
        const processedNotifications = notifications.map(notif => ({
          ...notif,
          createdAt: new Date(notif.createdAt),
          isRead: notif.isRead || false,
          course: notif.course || { name: 'General', code: '' },
          postedBy: notif.postedBy || { firstName: 'System', lastName: '' }
        }));

        setNotifications(processedNotifications);
        setUnreadCount(processedNotifications.filter(n => !n.isRead).length);
      } else {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid notification response structure');
      }
    } catch (error) {
      console.error('Notification fetch failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:8080/api/notifications/${notificationId}/read`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchNotifications(); // Refresh the notifications
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const res = await axios.post(
        `http://localhost:8080/api/courses/${courseId}/enroll`, 
        {}, 
        config
      );
      
      setNotification({ 
        message: res.data.message || 'Enrolled successfully!', 
        variant: 'success' 
      });

      // Refresh both student data and courses
      await fetchStudentData();
      await fetchAvailableCourses();
    } catch (err) {   
      setNotification({ 
        message: err.response?.data?.message || 'Enrollment failed.', 
        variant: 'danger' 
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchStudentData();
        await fetchAvailableCourses();
        await fetchNotifications();
      } catch (err) {
        console.error('Initial data fetch error:', err);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for new notifications every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notificationInterval);
  }, [navigate]);

  useEffect(() => {
    // Update courses when student data changes
    if (student) {
      fetchAvailableCourses();
    }
  }, [student]);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error) return (
    <Alert variant="danger" className="m-4">
      {error}
      <Button variant="outline-danger" className="ms-3" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </Alert>
  );

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white" style={{ width: '280px' }}>
        {/* Branding */}
        <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <Book className="bi me-2" width="32" height="32" />
          <span className="fs-4">ScholarPro</span>
        </div>
        <hr />
        
        {/* Profile */}
        {student && (
          <div className="text-center mb-4">
            <Image 
              src={student.profilePicture || 'https://via.placeholder.com/150'} 
              roundedCircle 
              width={100} 
              height={100} 
              className="border border-3 border-primary mb-2"
            />
            <h5>{student.firstName} {student.lastName}</h5>
            <small className="text-muted">{student.email}</small>
          </div>
        )}
        
        {/* Navigation */}
        <Nav variant="pills" className="flex-column mb-auto">
          <Nav.Item>
            <Nav.Link 
              eventKey="dashboard" 
              active={activeKey === 'dashboard'}
              onClick={() => setActiveKey('dashboard')}
              className="d-flex align-items-center"
            >
              <Speedometer2 className="me-2" /> Dashboard
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="my-courses" 
              active={activeKey === 'my-courses'}
              onClick={() => setActiveKey('my-courses')}
              className="d-flex align-items-center"
            >
              <JournalBookmark className="me-2" /> My Courses
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="schedule" 
              active={activeKey === 'schedule'}
              onClick={() => setActiveKey('schedule')}
              className="d-flex align-items-center"
            >
              <Calendar3 className="me-2" /> Schedule
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="assignments" 
              active={activeKey === 'assignments'}
              onClick={() => setActiveKey('assignments')}
              className="d-flex align-items-center"
            >
              <ListTask className="me-2" /> Assignments
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="grades" 
              active={activeKey === 'grades'}
              onClick={() => setActiveKey('grades')}
              className="d-flex align-items-center"
            >
              <GraphUp className="me-2" /> Grades
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
  <Nav.Link 
    eventKey="transcripts" 
    active={activeKey === 'transcripts'}
    onClick={() => setActiveKey('transcripts')}
    className="d-flex align-items-center"
  >
    <JournalBookmark className="me-2" /> Transcripts
  </Nav.Link>
</Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="messages" 
              active={activeKey === 'messages'}
              onClick={() => setActiveKey('messages')}
              className="d-flex align-items-center"
            >
              <Envelope className="me-2" /> Messages
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="settings" 
              active={activeKey === 'settings'}
              onClick={() => setActiveKey('settings')}
              className="d-flex align-items-center"
            >
              <Gear className="me-2" /> Settings
            </Nav.Link>
          </Nav.Item>
        </Nav>
        
        <hr />
        <div className="dropdown">
          <Dropdown>
            <Dropdown.Toggle variant="outline-light" className="d-flex align-items-center w-100">
              <PersonCircle className="me-2" />
              {student?.firstName || 'Account'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="#/profile">Profile</Dropdown.Item>
              <Dropdown.Item href="#/help">Help Center</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => navigate('/logout')}>
                <BoxArrowRight className="me-2" /> Sign out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto">
        {/* Top Navigation */}
        <Navbar bg="light" expand="lg" className="shadow-sm p-3">
          <Container fluid>
            <Navbar.Brand>
              <h4 className="mb-0">
                {activeKey === 'dashboard' && 'Dashboard'}
                {activeKey === 'my-courses' && 'My Courses'}
                {activeKey === 'schedule' && 'Schedule'}
                {activeKey === 'assignments' && 'Assignments'}
                {activeKey === 'grades' && 'Grades'}
                {activeKey === 'messages' && 'Messages'}
                {activeKey === 'settings' && 'Settings'}
                {activeKey === 'transcripts' && 'MyTranscripts'}
              </h4>
            </Navbar.Brand>
            
            <div className="d-flex align-items-center">
              <Form className="d-flex me-3">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <Search />
                  </span>
                  <Form.Control
                    type="search"
                    placeholder="Search..."
                    className="border-start-0"
                    aria-label="Search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </Form>
              
              <Button 
                variant="outline-secondary" 
                className="position-relative me-2"
                onClick={() => setShowNotifications(true)}
              >
                <Bell />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <Image 
                src={student?.profilePicture || 'https://via.placeholder.com/40'} 
                roundedCircle 
                width={40} 
                height={40} 
                className="border"
              />
            </div>
          </Container>
        </Navbar>

        {/* Content Area */}
        <div className="p-4">
          {activeKey === 'dashboard' && (
            <>
              <h5 className="mb-4">Welcome back, {student?.firstName}!</h5>
              
              {/* Stats Cards */}
              <Row className="mb-4 g-4">
                <Col md={3}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                        <JournalBookmark size={24} />
                      </div>
                      <div>
                        <Card.Title as="h6" className="text-muted mb-1">Enrolled Courses</Card.Title>
                        <Card.Text as="h4" className="mb-0">{student?.enrolledCourses?.length || 0}</Card.Text>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                        <ListTask size={24} />
                      </div>
                      <div>
                        <Card.Title as="h6" className="text-muted mb-1">Pending Assignments</Card.Title>
                        <Card.Text as="h4" className="mb-0">5</Card.Text>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-3">
                        <Calendar3 size={24} />
                      </div>
                      <div>
                        <Card.Title as="h6" className="text-muted mb-1">Upcoming Classes</Card.Title>
                        <Card.Text as="h4" className="mb-0">3</Card.Text>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 text-info rounded-circle p-3 me-3">
                        <GraphUp size={24} />
                      </div>
                      <div>
                        <Card.Title as="h6" className="text-muted mb-1">Current GPA</Card.Title>
                        <Card.Text as="h4" className="mb-0">3.8</Card.Text>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Courses Section */}
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Available Courses</h5>
                </Card.Header>
                <Card.Body>
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-5">
                      <Book size={48} className="text-muted mb-3" />
                      <h5>No available courses found</h5>
                      <p className="text-muted">You may have enrolled in all available courses</p>
                    </div>
                  ) : (
                    <Row className="g-4">
                      {filteredCourses.map(course => (
                        <Col md={4} key={course._id}>
                          <Card className="h-100">
                            <Card.Img 
                              variant="top" 
                              src={course.thumbnail || 'https://via.placeholder.com/300x200'} 
                              height="160"
                              style={{ objectFit: 'cover' }}
                            />
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <Card.Title>{course.name}</Card.Title>
                                <Badge bg="light" text="dark">{course.code}</Badge>
                              </div>
                              <Card.Text className="flex-grow-1">
                                {course.description || 'No description available'}
                              </Card.Text>
                              <div className="d-flex flex-wrap gap-2 small text-muted mb-3">
                                <span><People className="me-1" /> {course.studentCount} students</span>
                                <span><Clock className="me-1" /> {course.duration}</span>
                              </div>
                              <Button 
                                variant={course.isEnrolled ? 'outline-success' : 'primary'} 
                                onClick={() => !course.isEnrolled && handleEnroll(course._id)}
                                disabled={course.isEnrolled}
                              >
                                {course.isEnrolled ? (
                                  <>
                                    <CheckCircle className="me-1" /> Enrolled
                                  </>
                                ) : (
                                  <>
                                    <Plus className="me-1" /> Enroll Now
                                  </>
                                )}
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {activeKey === 'my-courses' && <MyCourses student={student} />}
          {activeKey === 'schedule' && <Schedule student={student} />}
          {activeKey === 'assignments' && <Assignments student={student} />}
          {activeKey === 'grades' && <Grades student={student} />}
          {activeKey === 'messages' && <Messages student={student} />}
          {activeKey === 'settings' && <Settings student={student} />}
          {activeKey === 'transcripts' && <MyTranscripts student={student} />}

        </div>
      </div>

      {/* Notifications Modal */}
      <Modal show={showNotifications} onHide={() => setShowNotifications(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            My Notifications
            {unreadCount > 0 && (
              <Badge bg="danger" className="ms-2">
                {unreadCount} new
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-4">
              <Bell size={48} className="text-muted mb-3" />
              <h5>No notifications yet</h5>
              <p className="text-muted">
                Notifications from your courses will appear here
              </p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.map((notification) => {
                const courseName = notification.course?.name || 'General Announcement';
                const courseCode = notification.course?.code ? `(${notification.course.code})` : '';
                const instructorName = notification.postedBy 
                  ? `${notification.postedBy.firstName} ${notification.postedBy.lastName}`
                  : 'System';

                return (
                  <ListGroup.Item 
                    key={notification._id}
                    action
                    className={`${!notification.isRead ? 'fw-bold' : ''}`}
                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-3">
                        <h6 className="mb-1">{notification.title}</h6>
                        <p className="mb-1">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <Badge bg="primary" pill>New</Badge>
                      )}
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">
                        {courseName} {courseCode}
                      </small>
                      <small className="text-muted">
                        {notification.createdAt.toLocaleString()}
                      </small>
                    </div>
                    <small className="text-muted d-block mt-1">
                      From: {instructorName}
                    </small>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>

      {/* Toast Notification */}
      {notification && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
          <div className={`toast show bg-${notification.variant} text-white`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                {notification.message}
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto" 
                onClick={() => setNotification(null)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentHomePage;