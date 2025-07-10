import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Card, 
  Spinner, 
  ListGroup, 
  Button, 
  Badge,
  Modal,
  Form,
  Alert
} from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import {
  BsDownload,
  BsPencil,
  BsTrash,
  BsFileEarmarkText,
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkImage,
  BsFileEarmarkZip
} from 'react-icons/bs';

const AssignmentsList = ({ courseId: propCourseId }) => {
  const { courseId: paramCourseId } = useParams();
  const courseId = propCourseId || paramCourseId;

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalPoints: 0
  });

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/instructors/courses/${courseId}/assignments`, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Process assignments to ensure consistent file data structure
      const processedAssignments = response.data.map(assignment => ({
        ...assignment,
        filePath: assignment.file?.path || assignment.filePath,
        fileType: assignment.file?.type || assignment.fileType,
        originalFileName: assignment.file?.name || assignment.originalFileName
      }));
      
      setAssignments(processedAssignments);
      setError(null);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <BsFileEarmarkText size={20} />;
    if (fileType.includes('pdf')) return <BsFileEarmarkPdf className="text-danger" size={20} />;
    if (fileType.includes('word')) return <BsFileEarmarkWord className="text-primary" size={20} />;
    if (fileType.includes('excel') || fileType.includes('sheet')) return <BsFileEarmarkExcel className="text-success" size={20} />;
    if (fileType.includes('image')) return <BsFileEarmarkImage className="text-info" size={20} />;
    if (fileType.includes('zip') || fileType.includes('compressed')) return <BsFileEarmarkZip className="text-warning" size={20} />;
    return <BsFileEarmarkText size={20} />;
  };

 const handleDownload = async (assignment) => {
  if (!assignment.filePath) return;
  
  try {
    setDownloading(assignment._id);
    
    // Extract filename from filePath
    const filename = assignment.filePath.split('/').pop();
    
    // Use FULL backend URL with port 8080
    const downloadUrl = `http://localhost:8080/api/assignments/files/${filename}`;
    
    const response = await axios.get(downloadUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Use original filename if available
    const downloadName = assignment.originalFileName || 
                       filename || 
                       `assignment-${assignment._id}.pdf`;
    
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloading(null);
    }, 100);
  } catch (err) {
    console.error('Download error:', err);
    setDownloading(null);
    
    let errorMessage = 'Failed to download file. ';
    if (err.response?.status === 401) {
      errorMessage += 'Please login again.';
    } else if (err.response?.status === 403) {
      errorMessage += 'You are not authorized to download this file.';
    } else if (err.response?.status === 404) {
      errorMessage += 'File not found on server.';
    } else {
      errorMessage += 'Please try again later.';
    }
    
    alert(errorMessage);
  }
};

  const confirmDelete = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await axios.delete(
        `http://localhost:8080/api/assignments/${assignmentToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Refresh assignments list
      fetchAssignments();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const handleEdit = (assignment) => {
    setAssignmentToEdit(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.split('T')[0], // Format date for input
      totalPoints: assignment.totalPoints
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!assignmentToEdit) return;

    try {
      await axios.put(
        `http://localhost:8080/api/assignments/${assignmentToEdit._id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Refresh assignments list
      fetchAssignments();
      setShowEditModal(false);
    } catch (err) {
      console.error('Update error:', err);
      alert(err.response?.data?.message || 'Failed to update assignment.');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p>Loading assignments...</p>
      </div>
    );
  }

  
   return (
    <>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Course Assignments</span>
          <Badge bg="secondary">{assignments.length} assignments</Badge>
          <Button as={Link} to={`/courses/${courseId}/assignments/create`} size="sm">
            Create Assignment
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : assignments.length === 0 ? (
            <p>No assignments created yet.</p>
          ) : (
            <ListGroup variant="flush">
              {assignments.map((assignment) => (
                <ListGroup.Item key={assignment._id} className="py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {assignment.filePath && (
                          <>
                            {getFileIcon(assignment.fileType)}
                            <span className="text-muted small">
                              {assignment.originalFileName || 'Assignment file'}
                            </span>
                          </>
                        )}
                        <h5 className="mb-0">{assignment.title}</h5>
                      </div>
                      <p className="mb-2 text-muted">{assignment.description}</p>
                      <small className="text-secondary">
                        Due: {new Date(assignment.dueDate).toLocaleString()} |{' '}
                        Points: {assignment.totalPoints} |{' '}
                        Submissions: {assignment.submissionCount || 0}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/assignments/${assignment._id}/submissions`}
                      >
                        View Submissions
                      </Button>
                      {assignment.filePath && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleDownload(assignment)}
                          disabled={downloading === assignment._id}
                        >
                          {downloading === assignment._id ? (
                            <Spinner as="span" animation="border" size="sm" />
                          ) : (
                            <>
                              <BsDownload className="me-1" /> Download
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                      >
                        <BsPencil />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => confirmDelete(assignment)}
                      >
                        <BsTrash />
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the assignment: <strong>{assignmentToDelete?.title}</strong>?
          <br />
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Total Points</Form.Label>
              <Form.Control
                type="number"
                value={editForm.totalPoints}
                onChange={(e) => setEditForm({...editForm, totalPoints: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AssignmentsList;