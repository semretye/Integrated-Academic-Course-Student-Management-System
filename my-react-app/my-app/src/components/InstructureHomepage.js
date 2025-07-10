import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Navbar, 
  Dropdown, Image, Badge, Spinner, Alert 
} from 'react-bootstrap';
import { 
  PersonPlus, People, PersonCheck, CashCoin, 
  Book, JournalBookmark, PersonGear, BoxArrowRight,
  Bell, Search, PersonCircle, Gear, ListCheck, ClipboardCheck
} from 'react-bootstrap-icons';


const InstructorHomePage = () => {
  const [stats, setStats] = useState({
    instructors: 0,
    students: 0,
    pendingApprovals: 0,
    courses: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Mock data fetch - replace with actual API calls
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Replace with actual API calls
        // const res = await axios.get('/api/instructor/stats');
        // setStats(res.data);
        
        // Mock data for demonstration
        setTimeout(() => {
          setStats({
            instructors: 12,
            students: 48,
            pendingApprovals: 6,
            courses: 20,
            pendingPayments: 8
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    // Add your logout logic here
    localStorage.removeItem('token');
    navigate('/login');
  };

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
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <div className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white" style={{ width: '280px' }}>
        <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <JournalBookmark className="bi me-2" width="32" height="32" />
          <span className="fs-4">Instructor Portal</span>
        </div>
        <hr />
        
        {/* Profile Section - Replace with actual instructor data */}
        <div className="text-center mb-4">
          <Image 
            src={'https://via.placeholder.com/150'}
            roundedCircle 
            width={100} 
            height={100} 
            className="border border-3 border-primary mb-2"
          />
          <h5>Admin User</h5>
          <small className="text-muted">admin@example.com</small>
        </div>
        
        <hr />
        <div className="dropdown">
          <Dropdown>
            <Dropdown.Toggle variant="outline-light" className="d-flex align-items-center w-100">
              <PersonCircle className="me-2" />
              Admin Panel
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings">Settings</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <BoxArrowRight className="me-2" /> Logout
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
              <h4 className="mb-0">Instructor Dashboard</h4>
            </Navbar.Brand>
            
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                className="position-relative me-2"
              >
                <Bell />
                <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                  {stats.pendingApprovals}
                </Badge>
              </Button>
              
              <Image 
                src={'https://via.placeholder.com/40'} 
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
          {/* Quick Actions Section */}
          <section className="mb-5">
            <h2 className="mb-4">Quick Actions</h2>
            <Row className="g-4">
              <Col md={3}>
                <Card as={Link} to="/InstructureRegistration" className="h-100 text-decoration-none text-white bg-success">
                  <Card.Body className="text-center py-4">
                    <PersonPlus size={32} className="mb-3" />
                    <Card.Title>Add Instructor</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card as={Link} to="/ManageInstructures" className="h-100 text-decoration-none text-white bg-dark">
                  <Card.Body className="text-center py-4">
                    <PersonGear size={32} className="mb-3" />
                    <Card.Title>Manage Instructors</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card as={Link} to="/ManageStudents" className="h-100 text-decoration-none text-white bg-info">
                  <Card.Body className="text-center py-4">
                    <People size={32} className="mb-3" />
                    <Card.Title>Registered Students</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card as={Link} to="/students/approvals" className="h-100 text-decoration-none text-white bg-warning">
                  <Card.Body className="text-center py-4">
                    <PersonCheck size={32} className="mb-3" />
                    <Card.Title>Registration Approvals</Card.Title>
                    <Badge pill bg="light" text="dark">{stats.pendingApprovals} pending</Badge>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </section>

          {/* Course & Payment Management */}
          <section className="mb-5">
            <h2 className="mb-4">Course & Payment Management</h2>
            <Row className="g-4">
              <Col md={3}>
                <Card as={Link} to="/payments/settlements" className="h-100 text-decoration-none text-white bg-danger">
                  <Card.Body className="text-center py-4">
                    <CashCoin size={32} className="mb-3" />
                    <Card.Title>Payment Settlements</Card.Title>
                    <Badge pill bg="light" text="dark">{stats.pendingPayments} pending</Badge>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card as={Link} to="/AddCourses" className="h-100 text-decoration-none text-white bg-primary">
                  <Card.Body className="text-center py-4">
                    <Book size={32} className="mb-3" />
                    <Card.Title>Add Courses</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card as={Link} to="/ManageCourses" className="h-100 text-decoration-none text-white bg-primary">
                  <Card.Body className="text-center py-4">
                    <JournalBookmark size={32} className="mb-3" />
                    <Card.Title>Manage Courses</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card as={Link} to="/AssignInstructure" className="h-100 text-decoration-none text-white bg-secondary">
                  <Card.Body className="text-center py-4">
                    <ListCheck size={32} className="mb-3" />
                    <Card.Title>Assign Instructors</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </section>

          {/* Summary Stats */}
          <section>
            <h2 className="mb-4">Summary Statistics</h2>
            <Row className="g-4">
              <Col md={2}>
                <Card className="h-100 text-white bg-success">
                  <Card.Body className="text-center py-3">
                    <People size={24} className="mb-2" />
                    <Card.Title>Instructors</Card.Title>
                    <Card.Text as="h3">{stats.instructors}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="h-100 text-white bg-info">
                  <Card.Body className="text-center py-3">
                    <PersonCircle size={24} className="mb-2" />
                    <Card.Title>Students</Card.Title>
                    <Card.Text as="h3">{stats.students}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="h-100 text-white bg-warning">
                  <Card.Body className="text-center py-3">
                    <ClipboardCheck size={24} className="mb-2" />
                    <Card.Title>Pending Approvals</Card.Title>
                    <Card.Text as="h3">{stats.pendingApprovals}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="h-100 text-white bg-primary">
                  <Card.Body className="text-center py-3">
                    <Book size={24} className="mb-2" />
                    <Card.Title>Courses</Card.Title>
                    <Card.Text as="h3">{stats.courses}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="h-100 text-white bg-danger">
                  <Card.Body className="text-center py-3">
                    <CashCoin size={24} className="mb-2" />
                    <Card.Title>Pending Payments</Card.Title>
                    <Card.Text as="h3">{stats.pendingPayments}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InstructorHomePage;