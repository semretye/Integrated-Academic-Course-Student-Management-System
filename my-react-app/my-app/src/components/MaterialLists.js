import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  ListGroup,
  Spinner,
  Alert,
  Button,
  Badge,
  Row,
  Col,
  Modal,
  Form,
} from 'react-bootstrap';

import { useParams } from 'react-router-dom';

import {
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkImage,
  BsFileEarmarkZip,
  BsDownload,
  BsFileEarmarkText,
  BsPencil,
  BsTrash
} from 'react-icons/bs';

const MaterialLists = () => {
  const { courseId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);
  

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/courses/${courseId}/materials`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setMaterials(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch materials');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <BsFileEarmarkPdf className="text-danger" size={24} />;
    if (fileType.includes('word')) return <BsFileEarmarkWord className="text-primary" size={24} />;
    if (fileType.includes('excel') || fileType.includes('sheet')) return <BsFileEarmarkExcel className="text-success" size={24} />;
    if (fileType.includes('image')) return <BsFileEarmarkImage className="text-info" size={24} />;
    if (fileType.includes('zip') || fileType.includes('compressed')) return <BsFileEarmarkZip className="text-warning" size={24} />;
    return <BsFileEarmarkText size={24} />;
  };

  const handleDownload = async (material) => {
  try {
    const response = await axios.get(
      `http://localhost:8080/api/materials/${material._id}/download`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        responseType: 'blob' // Important for file downloads
      }
    );

    // Create a download link for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', material.title || 'download');
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('Failed to download file. Please try again.');
  }
};

  const confirmDelete = (material) => {
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:8080/api/materials/${materialToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setMaterials((prev) => prev.filter((m) => m._id !== materialToDelete._id));
        setShowDeleteModal(false);
        setMaterialToDelete(null);
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete material');
    }
  };

  const handleEdit = (material) => {
    setMaterialToEdit(material);
    setEditForm({ title: material.title, description: material.description });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/materials/${materialToEdit._id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setMaterials((prev) =>
          prev.map((m) => (m._id === materialToEdit._id ? response.data.data : m))
        );
        setShowEditModal(false);
      } else {
        alert(response.data.message || 'Failed to update');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to update material');
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p>Loading materials...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      <Card>
        <Card.Header className="fw-bold d-flex justify-content-between align-items-center">
          <span>Course Materials</span>
          <Badge bg="secondary">{materials.length} files</Badge>
        </Card.Header>
        <Card.Body>
          {materials.length === 0 ? (
            <p>No materials uploaded yet.</p>
          ) : (
            <ListGroup variant="flush">
              {materials.map((material) => (
                <ListGroup.Item key={material._id} className="py-3">
                  <Row className="align-items-center">
                    <Col xs={1} className="text-center">
                      {getFileIcon(material.fileType)}
                    </Col>
                    <Col>
                      <h5 className="mb-1">{material.title}</h5>
                      <p className="mb-2 text-muted">{material.description}</p>
                      <small className="text-muted">
                        Uploaded by: {material.instructor?.name || 'Unknown'} •{' '}
                        {new Date(material.uploadedAt).toLocaleDateString()} •{' '}
                        {material.fileType}
                      </small>
                    </Col>
                    <Col xs="auto">
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleDownload(material)}
                          title="Download"
                        >
                          <BsDownload className="me-1" /> Download
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(material)}
                          title="Edit"
                        >
                          <BsPencil />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => confirmDelete(material)}
                          title="Delete"
                        >
                          <BsTrash />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
      
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Material</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{materialToDelete?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Material</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
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

export default MaterialLists;