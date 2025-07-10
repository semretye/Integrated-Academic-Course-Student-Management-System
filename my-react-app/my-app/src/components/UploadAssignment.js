import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // <-- Import useParams
import axios from 'axios';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';

const UploadAssignment = () => {
  const { courseId } = useParams(); // <-- Get courseId from URL params

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null,
    totalPoints: 100,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseId) {
      alert('Course ID is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('totalPoints', formData.totalPoints);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      await axios.post(`http://localhost:8080/api/courses/${courseId}/assignments`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      alert('Assignment created successfully!');
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        file: null,
        totalPoints: 100,
      });
    } catch (error) {
      console.error('Assignment creation failed:', error);
      alert('Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optional fallback UI if courseId is missing
  if (!courseId) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <p className="text-danger">Error: Course ID is missing in the URL.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>Create New Assignment</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Assignment Title *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Due Date *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Total Points *</Form.Label>
                <Form.Control
                  type="number"
                  name="totalPoints"
                  value={formData.totalPoints}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Assignment File (Optional)</Form.Label>
            <Form.Control
              type="file"
              name="file"
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Upload instructions or template files
            </Form.Text>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default UploadAssignment;
