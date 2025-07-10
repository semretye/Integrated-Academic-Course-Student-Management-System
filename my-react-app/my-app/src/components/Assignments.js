import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, Spinner, ListGroup, Button, Badge, Alert, Form } from 'react-bootstrap';
import { format } from 'date-fns';

const Assignments = ({ student }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const navigate = useNavigate();

  // Fetch enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/students/enrolled-courses', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setEnrolledCourses(response.data.data || []);
        setError('');
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  // Fetch assignments when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchCourseAssignments(selectedCourse);
    }
  }, [selectedCourse]);

  // Process assignments when filter changes or assignments are updated
  useEffect(() => {
    if (selectedCourse && courseAssignments.length > 0) {
      processAssignmentsWithSubmissions();
    }
  }, [filter, courseAssignments]);

  // Fetch course assignments (from teachers)
  const fetchCourseAssignments = async (courseId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:8080/api/courses/${courseId}/assignments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const assignments = Array.isArray(response.data) ? response.data : [];
      setCourseAssignments(assignments);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch assignments');
      setCourseAssignments([]);
      setFilteredAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's submission for a specific assignment
  const fetchStudentSubmission = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/submissions/assignments/${assignmentId}/student-submission`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Handle 204 No Content response
      if (response.status === 204 || !response.data || !response.data.data) {
        return null;
      }
      
      return response.data.data;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 204) {
        // No submission found
        return null;
      }
      console.error('Fetch submission error:', err);
      throw err;
    }
  };

  // Process assignments with student submissions
  const processAssignmentsWithSubmissions = async () => {
    try {
      const processed = await Promise.all(
        courseAssignments.map(async (assignment) => {
          const dueDate = new Date(assignment.dueDate);
          const now = new Date();
          const isPastDue = dueDate < now;
          
          // Fetch student's submission for this assignment
          const submission = await fetchStudentSubmission(assignment._id);
          const hasSubmission = submission !== null;

          // Process submission data if exists
          let submissionFiles = [];
          let submissionDate = null;
          let grade = null;
          let feedback = null;

          if (hasSubmission) {
            submissionFiles = submission.files?.map(file => ({
              url: file.url?.startsWith('http') 
                ? file.url 
                : `http://localhost:8080${file.url}`,
              name: file.name || 'submission.pdf',
              type: file.type || 'application/pdf'
            })) || [];
            
            submissionDate = submission.submittedAt 
              ? new Date(submission.submittedAt) 
              : null;
            grade = submission.grade;
            feedback = submission.feedback;
          }

          // Process assignment files (from teacher) separately
          const assignmentFiles = (assignment.files || []).map(file => ({
            url: file.url?.startsWith('http') 
              ? file.url 
              : `http://localhost:8080${file.url}`,
            name: file.name || 'assignment_file.pdf',
            type: file.type || 'application/pdf'
          }));

          // Status determination
          let status;
          if (hasSubmission) {
            status = (grade !== null && grade !== undefined) ? 'graded' : 'submitted';
          } else {
            status = isPastDue ? 'overdue' : 'pending';
          }

          return {
            ...assignment,
            dueDate,
            status,
            isPastDue,
            canSubmit: !hasSubmission && !isPastDue,
            assignmentFiles,  // Teacher's files
            submissionFiles,  // Student's submitted files
            submissionDate,
            grade,
            feedback,
            submitted: hasSubmission
          };
        })
      );

      // Apply filter
      let filtered = processed;
      if (filter === 'graded') {
        filtered = processed.filter(a => a.status === 'graded');
      } else if (filter === 'pending') {
        filtered = processed.filter(a => a.status === 'pending');
      } else if (filter === 'overdue') {
        filtered = processed.filter(a => a.status === 'overdue');
      } else if (filter === 'submitted') {
        filtered = processed.filter(a => a.submitted);
      }

      setFilteredAssignments(filtered);
    } catch (err) {
      console.error('Error processing assignments:', err);
      setError('Failed to process assignments');
    }
  };

  const handleSubmitAssignment = async (assignmentId, file) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('file', file);
      formData.append('assignmentId', assignmentId);
      formData.append('studentId', student._id);
      formData.append('courseId', selectedCourse);
      
      await axios.post(
        `http://localhost:8080/api/submissions`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Refetch to get updated data
      await fetchCourseAssignments(selectedCourse);
      setError('');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      if (!fileUrl || typeof fileUrl !== 'string') {
        throw new Error('Invalid or missing file URL');
      }

      const token = localStorage.getItem('token');
      const completeUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `http://localhost:8080${fileUrl}`;

      const response = await fetch(completeUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName || 'file.pdf');
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download file. Please try again.');
    }
  };

  if (loading && !selectedCourse) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
        <Button 
          variant="outline-danger"
          className="ms-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Courses List Column */}
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5>Your Enrolled Courses</h5>
            </Card.Header>
            <Card.Body>
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-3">
                  <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
                  <h5>No enrolled courses</h5>
                  <p>You haven't enrolled in any courses yet.</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {enrolledCourses.map(course => (
                    <ListGroup.Item 
                      key={course._id}
                      action
                      active={selectedCourse === course._id}
                      onClick={() => setSelectedCourse(course._id)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-1">{course.name}</h6>
                        <small className="text-muted">{course.code}</small>
                      </div>
                      <Badge bg="light" text="dark">
                        {course.instructor?.firstName || 'Instructor'}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Assignments Column */}
        <div className="col-md-8">
          {selectedCourse ? (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                <h5 className="mb-0">Course Assignments</h5>
                <div className="btn-group btn-group-sm">
                  <Button 
                    variant={filter === 'all' ? 'primary' : 'outline-secondary'}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filter === 'pending' ? 'primary' : 'outline-primary'}
                    onClick={() => setFilter('pending')}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={filter === 'overdue' ? 'primary' : 'outline-warning'}
                    onClick={() => setFilter('overdue')}
                  >
                    Overdue
                  </Button>
                  <Button 
                    variant={filter === 'submitted' ? 'primary' : 'outline-info'}
                    onClick={() => setFilter('submitted')}
                  >
                    Submitted
                  </Button>
                  <Button 
                    variant={filter === 'graded' ? 'primary' : 'outline-success'}
                    onClick={() => setFilter('graded')}
                  >
                    Graded
                  </Button>
                </div>
              </Card.Header>
              
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p>Loading assignments...</p>
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-tasks fa-3x text-muted mb-3"></i>
                    <h5>No assignments found</h5>
                    <p>{filter === 'all' 
                      ? "This course doesn't have any assignments yet." 
                      : `No ${filter} assignments found.`}
                    </p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {filteredAssignments.map(assignment => (
                      <ListGroup.Item 
                        key={assignment._id} 
                        className={`assignment-item ${assignment.status}`}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <h5 className="mb-0">{assignment.title}</h5>
                              <Badge 
                                bg={
                                  assignment.status === 'graded' ? 'success' :
                                  assignment.status === 'submitted' ? 'info' :
                                  assignment.status === 'overdue' ? 'danger' : 'primary'
                                } 
                                className="ms-2"
                              >
                                {assignment.status.toUpperCase()}
                              </Badge>
                            </div>
                            
                            {/* Teacher's assignment files */}
                            {assignment.assignmentFiles?.length > 0 && (
                              <div className="mb-3">
                                <h6>Assignment Files (From Instructor):</h6>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                  {assignment.assignmentFiles.map((file, index) => (
                                    <Button
                                      key={`assignment-file-${index}`}
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleDownloadFile(file.url, file.name)}
                                      className="text-truncate"
                                      style={{ maxWidth: '200px' }}
                                    >
                                      <i className="fas fa-file-download me-1"></i>
                                      {file.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-muted mb-2">{assignment.description}</p>
                            
                            <div className="d-flex flex-wrap gap-3 mb-2">
                              <small className={`text-${assignment.isPastDue ? 'danger' : 'secondary'}`}>
                                <i className="fas fa-calendar-alt me-1"></i>
                                Due: {format(assignment.dueDate, 'MMM dd, yyyy hh:mm a')}
                                {assignment.isPastDue && <span className="text-danger"> (Past Due)</span>}
                              </small>
                              {assignment.grade && (
                                <small className="text-success">
                                  <i className="fas fa-star me-1"></i>
                                  Grade: {assignment.grade}
                                </small>
                              )}
                              {assignment.submitted && assignment.submissionDate && (
                                <small className="text-info">
                                  <i className="fas fa-paper-plane me-1"></i>
                                  Submitted: {format(assignment.submissionDate, 'MMM dd, yyyy hh:mm a')}
                                </small>
                              )}
                            </div>
                            
                            {assignment.feedback && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small className="text-muted">Feedback:</small>
                                <p className="mb-0">{assignment.feedback}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="d-flex flex-column gap-2 ms-3" style={{ minWidth: '200px' }}>
                            {assignment.canSubmit && (
                              <FileUploadForm 
                                assignmentId={assignment._id}
                                onSubmit={handleSubmitAssignment}
                              />
                            )}
                            
                            {assignment.status === 'overdue' && !assignment.submitted && (
                              <Button variant="outline-danger" size="sm" disabled>
                                <i className="fas fa-ban me-1"></i> Closed
                              </Button>
                            )}
                            
                            {/* Student's submission files */}
                            {assignment.submissionFiles?.length > 0 && (
                              <div className="mb-2">
                                <h6>Your Submission Files:</h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {assignment.submissionFiles.map((file, index) => (
                                    <Button
                                      key={`submission-file-${index}`}
                                      variant="outline-success"
                                      size="sm"
                                      onClick={() => handleDownloadFile(file.url, file.name)}
                                      className="text-truncate"
                                      style={{ maxWidth: '200px' }}
                                    >
                                      <i className="fas fa-file-upload me-1"></i>
                                      {file.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <i className="fas fa-hand-pointer fa-3x text-muted mb-3"></i>
                <h4>Select a course to view assignments</h4>
                <p className="text-muted">Choose from your enrolled courses on the left</p>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const FileUploadForm = ({ assignmentId, onSubmit }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      setUploading(true);
      try {
        await onSubmit(assignmentId, file);
        setFile(null);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="d-flex flex-column gap-2">
      <Form.Control 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])}
        size="sm"
        required
        accept=".pdf,.doc,.docx,.txt,.zip"
      />
      <Button 
        type="submit" 
        size="sm" 
        variant="primary"
        disabled={!file || uploading}
      >
        {uploading ? (
          <>
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            <span className="ms-2">Uploading...</span>
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane me-1"></i> Submit
          </>
        )}
      </Button>
      {file && (
        <small className="text-muted">
          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
        </small>
      )}
    </Form>
  );
};

export default Assignments;