import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Row, Col, Card, Button, 
  Badge, Alert, Spinner, Image, ListGroup,
  Modal
} from 'react-bootstrap';
import { People, Clock, CheckCircle, ArrowLeft } from 'react-bootstrap-icons';

function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const verificationInterval = useRef(null);
  const paymentWindowRef = useRef(null);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  const DEFAULT_COURSE_THUMBNAIL = '/images/default-course.png';

  const getImageUrl = (path) => {
    if (!path) return DEFAULT_COURSE_THUMBNAIL;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (path.startsWith('/uploads')) return `${API_BASE_URL}${path}`;
    return `${API_BASE_URL}/uploads/${path}`;
  };

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return null;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/students/me`, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );

      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching student data:', err);
      return null;
    }
  };

  // Check URL for payment success parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      setPaymentSuccess(true);
      checkEnrollmentStatus();
    }
  }, [location]);

  const checkEnrollmentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const updatedStudent = await fetchStudentData();
      if (updatedStudent) {
        setStudent(updatedStudent);
        setIsEnrolled(
          updatedStudent.enrolledCourses?.some(
            c => c._id === courseId || c.course?._id === courseId
          ) || false
        );
      }
    } catch (err) {
      console.error('Error checking enrollment status:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCourseDetails = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return;
      }

      try {
        // Fetch student data first
        const studentData = await fetchStudentData();
        if (studentData && isMounted) {
          setStudent(studentData);
        }

        // Fetch course data
        const config = {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        };

        const courseResponse = await axios.get(
          `${API_BASE_URL}/api/courses/${courseId}`, 
          config
        );

        let courseData;
        if (courseResponse.data?.data) {
          courseData = courseResponse.data.data;
        } else if (courseResponse.data) {
          courseData = courseResponse.data;
        } else {
          throw new Error('Invalid course data format');
        }

        if (!courseData._id || !courseData.name) {
          throw new Error('Course data missing required fields');
        }

        if (isMounted) {
          setCourse({
            ...courseData,
            thumbnail: getImageUrl(courseData.thumbnail)
          });

          // Check if student is enrolled
          if (studentData) {
            setIsEnrolled(
              studentData.enrolledCourses?.some(
                c => c._id === courseId || c.course?._id === courseId
              ) || false
            );
          }
        }

      } catch (err) {
        if (isMounted) {
          let errorMessage = 'Failed to load course details';
          
          if (err.response) {
            if (err.response.status === 401) {
              errorMessage = 'Session expired. Please login again.';
              localStorage.removeItem('token');
              navigate('/login');
            } else if (err.response.status === 404) {
              errorMessage = 'Course not found';
            } else if (err.response.data?.message) {
              errorMessage = err.response.data.message;
            }
          } else if (err.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out. Please try again.';
          } else if (err.message === 'Network Error') {
            errorMessage = 'Cannot connect to server. Check your internet connection.';
          }

          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCourseDetails();

    return () => {
      isMounted = false;
      // Cleanup interval and payment window when component unmounts
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
      }
      if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
        paymentWindowRef.current.close();
      }
    };
  }, [courseId, navigate]);

  const initiateChapaPayment = async () => {
    setIsProcessing(true);
    setPaymentError('');
    setPaymentSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return;
      }

      if (!student || !course) {
        throw new Error('Student or course information not available');
      }

      const paymentData = {
        courseId,
        amount: course.price,
        currency: 'ETB',
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone || '+251900000000',
        returnUrl: `${window.location.origin}/courses/${courseId}?payment=success`,
        cancelUrl: `${window.location.origin}/courses/${courseId}?payment=cancel`
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/payments/initiate-chapa`,
        paymentData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data?.success && response.data?.checkoutUrl) {
        // Open payment in new tab and store reference
        const paymentWindow = window.open(response.data.checkoutUrl, '_blank');
        paymentWindowRef.current = paymentWindow;
        
        if (!paymentWindow) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
        
        // Poll for payment completion
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes at 10 second intervals
        
        verificationInterval.current = setInterval(async () => {
          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(verificationInterval.current);
            setPaymentError('Payment verification timed out. Please check your email for confirmation.');
            return;
          }
          
          try {
            const verification = await axios.get(
              `${API_BASE_URL}/api/payments/verify/${response.data.reference}`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            
            if (verification.data?.status === 'completed') {
              clearInterval(verificationInterval.current);
              setIsEnrolled(true);
              setPaymentSuccess(true);
              // Refresh student data
              const updatedStudent = await fetchStudentData();
              if (updatedStudent) {
                setStudent(updatedStudent);
              }
              // Close payment window if still open
              if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
                paymentWindowRef.current.close();
              }
            }
          } catch (err) {
            console.error('Verification error:', err);
          }
        }, 10000); // Check every 10 seconds
      } else {
        throw new Error(response.data?.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(
        err.response?.data?.message || 
        err.message || 
        'Payment initiation failed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnrollmentClick = async () => {
    if (course.price > 0) {
      try {
        setIsProcessing(true);
        await initiateChapaPayment();
      } catch (err) {
        console.error('Enrollment error:', err);
        setError('Failed to initiate payment. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      handleFreeEnrollment();
    }
  };

  const handleFreeEnrollment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/courses/${courseId}/enroll`,
        {},
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        setIsEnrolled(true);
        setCourse(prev => ({
          ...prev,
          students: [...(prev?.students || []), { _id: 'current-user' }]
        }));
      } else {
        throw new Error(response.data.message || 'Enrollment failed');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Enrollment failed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span className="ms-3">Loading course details...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Course</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 mt-3">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>
              <ArrowLeft className="me-2" /> Go Back
            </Button>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}>
              Login Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Course Not Found</Alert.Heading>
          <p>The requested course could not be found.</p>
          <Button variant="primary" onClick={() => navigate('/courses')}>
            Browse Available Courses
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button 
        variant="outline-secondary" 
        className="mb-4" 
        onClick={() => navigate(-1)}
        disabled={isProcessing}
      >
        <ArrowLeft className="me-2" /> Back to Courses
      </Button>

      {paymentSuccess && (
        <Alert variant="success" className="mb-4">
          <CheckCircle className="me-2" />
          Payment successful! You are now enrolled in this course.
        </Alert>
      )}

     <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Image
              src={course.thumbnail}
              className="card-img-top"
              alt={course.name}
              style={{ height: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_COURSE_THUMBNAIL;
              }}
            />
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h1 className="h2">{course.name}</h1>
                <Badge bg="light" text="dark" className="fs-6">{course.code}</Badge>
              </div>
              
              <div className="d-flex align-items-center mb-4">
                <h4 className="text-primary mb-0 me-3">
                  {course.price ? `${course.price.toLocaleString()} ETB` : 'Free'}
                </h4>
                {course.duration && (
                  <span className="text-muted">
                    <Clock className="me-1" />
                    {course.duration}
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <h5 className="mb-3">About This Course</h5>
                <p className="lead">{course.shortDescription || ''}</p>
                <p>{course.description || 'No description available'}</p>
              </div>
              
              <div className="mb-4">
                <h5 className="mb-3">What You'll Learn</h5>
                {course.learningOutcomes?.length > 0 ? (
                  <ListGroup variant="flush">
                    {course.learningOutcomes.map((outcome, index) => (
                      <ListGroup.Item key={index} className="d-flex align-items-center">
                        <span className="text-success me-2">✓</span>
                        {outcome}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p>No learning outcomes specified.</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Enrollment</h5>
                <div className="d-flex align-items-center">
                  <People className="me-2" />
                  <span>{course.students?.length || 0} enrolled</span>
                </div>
              </div>
              
              {isEnrolled ? (
                <div className="text-center">
                  <Button variant="success" className="w-100 mb-3" disabled>
                    <CheckCircle className="me-2" /> Enrolled
                  </Button>
                  <p className="text-success small">You have access to this course</p>
                </div>
              ) : (
                <>
                  <Button 
                    variant="primary" 
                    className="w-100 mb-3"
                    size="lg"
                    onClick={handleEnrollmentClick}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      course.price > 0 ? 'Enroll Now' : 'Enroll for Free'
                    )}
                  </Button>
                  {course.price > 0 && (
                    <p className="text-muted small text-center">
                      Secure payment · 7-day money-back guarantee
                    </p>
                  )}
                </>
              )}
              
              <hr className="my-4" />
              
              <div className="mb-4">
                <h5 className="mb-3">Course Details</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Instructor:</span>
                    <strong>{course.instructor?.name || 'Not specified'}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Start Date:</span>
                    <strong>
                      {course.startDate ? new Date(course.startDate).toLocaleDateString() : 'Flexible'}
                    </strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Category:</span>
                    <strong>{course.category || 'General'}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Level:</span>
                    <strong>{course.level || 'All Levels'}</strong>
                  </ListGroup.Item>
                </ListGroup>
              </div>
              
              <div>
                <h5 className="mb-3">What's Included</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex align-items-center">
                    <span className="text-success me-2">✓</span>
                    Full lifetime access
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <span className="text-success me-2">✓</span>
                    Certificate of completion
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <span className="text-success me-2">✓</span>
                    Downloadable resources
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <span className="text-success me-2">✓</span>
                    Instructor support
                  </ListGroup.Item>
                </ListGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Payment Error Modal */}
      <Modal show={!!paymentError} onHide={() => setPaymentError('')}>
        <Modal.Header closeButton>
          <Modal.Title>Payment Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            {paymentError}
          </Alert>
          <p>Please try again or contact support if the problem persists.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPaymentError('')}>
            Close
          </Button>
          <Button variant="primary" onClick={initiateChapaPayment}>
            Try Again
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CoursePage;