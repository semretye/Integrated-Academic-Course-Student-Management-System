import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  Spinner,
  ListGroup,
  Button,
  Badge,
  Form,
  Row,
  Col,
  Alert
} from 'react-bootstrap';
import { FaFile, FaDownload } from 'react-icons/fa';

const AssignmentSubmissions = () => {
  const { courseId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const downloadFile = async (url, filename) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:8080/api/instructors/courses/${courseId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSubmissions(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError(error.response?.data?.message || error.message);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchSubmissions();
  }, [courseId]);

 const handleGradeSubmit = async (submissionId, gradeData) => {
  setError(null);
  try {
    // Validate input
    if (gradeData.grade === undefined || gradeData.grade === null || gradeData.grade === '') {
      throw new Error('Please enter a grade');
    }

    const numericGrade = Number(gradeData.grade);
    if (isNaN(numericGrade)) {
      throw new Error('Grade must be a number');
    }

    // Get current user info
    const currentUser = {
      id: localStorage.getItem('userId'),
      name: localStorage.getItem('userName')
    };

    // Optimistic update
    setSubmissions(prev => prev.map(sub => 
      sub._id === submissionId ? {
        ...sub,
        grade: numericGrade,
        feedback: gradeData.feedback || '',
        gradedAt: new Date().toISOString(),
        gradedBy: { _id: currentUser.id, name: currentUser.name }
      } : sub
    ));

    // API call
    const response = await axios.put(
      `http://localhost:8080/api/instructors/submissions/${submissionId}/grade`,
      {
        grade: numericGrade,
        feedback: gradeData.feedback || ''
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Grading failed on server');
    }

  } catch (error) {
    console.error('Grading error:', {
      error: error.response?.data || error.message,
      submissionId,
      gradeData
    });
    
    let errorMessage = 'Failed to save grade. Please try again.';
    
    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = 'Network error - please check your connection';
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    setError(errorMessage);
    
    // Re-fetch to ensure consistency
    try {
      await fetchSubmissions();
    } catch (fetchError) {
      console.error('Failed to refresh submissions:', fetchError);
    }
  }
};


  const GradeForm = ({ submission, onSubmit }) => {
  const [grade, setGrade] = useState(submission.grade || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (grade === '') {
      setValidationError('Please enter a grade');
      return;
    }
    
    const numericGrade = Number(grade);
    if (isNaN(numericGrade)) {
      setValidationError('Grade must be a number');
      return;
    }
    
    if (numericGrade > (submission.assignment?.totalPoints || 100)) {
      setValidationError(`Grade cannot exceed ${submission.assignment?.totalPoints || 100}`);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    
    try {
      await onSubmit({
        grade: numericGrade,
        feedback
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-3">
      {validationError && (
        <Alert variant="danger" className="mb-3">
          {validationError}
        </Alert>
      )}
      <Row className="align-items-end">
        <Col md={3}>
          <Form.Group controlId="grade">
            <Form.Label>Grade (out of {submission.assignment?.totalPoints || 100})</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max={submission.assignment?.totalPoints || 100}
              step="0.01"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setValidationError('');
              }}
              required
              isInvalid={!!validationError}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="feedback">
            <Form.Label>Feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3} className="text-end">
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              'Save Grade'
            )}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchSubmissions}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Student Submissions</span>
        <Button variant="outline-primary" size="sm" onClick={fetchSubmissions}>
          Refresh
        </Button>
      </Card.Header>
      <Card.Body>
        {submissions.length === 0 ? (
          <Alert variant="info">No submissions found for this course.</Alert>
        ) : (
          <ListGroup variant="flush">
            {submissions.map((submission) => (
              <ListGroup.Item key={submission._id} className="py-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5>
                      {submission.student?.firstName} {submission.student?.lastName}
                      <br />
                      <small className="text-muted">{submission.student?.email}</small>
                    </h5>
                    <small className="text-muted">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </small>
                  </div>
                  {submission.grade ? (
                    <Badge bg="success" pill>
                      Graded: {submission.grade}/{submission.assignment?.totalPoints || 100}
                    </Badge>
                  ) : (
                    <Badge bg="warning" pill>Pending Grading</Badge>
                  )}
                </div>

                {/* Updated Assignment Files Section */}
                {submission.assignment?.filePath && (
                  <div className="mb-3">
                    <strong>Assignment Files:</strong>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => downloadFile(
                          `http://localhost:8080/api/instructors/assignments/${submission.assignment._id}/files`,
                          submission.assignment.originalFileName || 'assignment.pdf'
                        )}
                      >
                        <FaDownload className="me-1" />
                        {submission.assignment.originalFileName || 'Download Assignment'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Updated Student Submission Files Section */}
                {submission.files?.length > 0 && (
                  <div className="mb-3">
                    <strong>Submitted Files:</strong>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {submission.files.map((file, idx) => (
                        <Button
                          key={idx}
                          variant="outline-primary"
                          size="sm"
                          onClick={() => downloadFile(
                            `http://localhost:8080/api/instructors/submissions/${submission._id}/files/${file.name}`,
                            file.name
                          )}
                        >
                          <FaFile className="me-1" />
                          {file.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {submission.textSubmission && (
                  <div className="mb-3">
                    <strong>Text Submission:</strong>
                    <div className="p-3 bg-light rounded mt-2">
                      {submission.textSubmission}
                    </div>
                  </div>
                )}

                {submission.feedback && submission.grade && (
                  <div className="mb-3">
                    <strong>Previous Feedback:</strong>
                    <div className="p-3 bg-light rounded mt-2">
                      {submission.feedback}
                    </div>
                  </div>
                )}

                <GradeForm
                  submission={submission}
                  onSubmit={(gradeData) => handleGradeSubmit(submission._id, gradeData)}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default AssignmentSubmissions;