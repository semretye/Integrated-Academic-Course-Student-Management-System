import React, { useState } from 'react';
import axios from 'axios';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const UploadMaterial = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!formData.file) {
      setError('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('file', formData.file);

      const response = await axios.post(
        `http://localhost:8080/api/courses/${courseId}/materials`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate(`/instructor/courses/${courseId}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Upload New Material</Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Upload successful! Redirecting...</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>File *</Form.Label>
            <Form.Control
              type="file"
              name="file"
              onChange={handleChange}
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Upload'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/instructor/courses/${courseId}`)}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default UploadMaterial;