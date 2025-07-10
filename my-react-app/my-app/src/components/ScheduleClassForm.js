import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // ✅ Add this line
import {
  Card,
  Form,
  Button,
  Row,
  Col
} from 'react-bootstrap';

const ScheduleClassForm = ({ courseId: propCourseId }) => {
  const { courseId: paramCourseId } = useParams(); // ✅ get from URL if not passed as prop
  const courseId = propCourseId || paramCourseId;  // ✅ use prop if available, else use URL param

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    meetingLink: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!courseId) {
      setMessage({ type: 'danger', text: 'Missing course ID. Cannot schedule class.' });
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(`http://localhost:8080/api/courses/${courseId}/schedule`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessage({ type: 'success', text: 'Class scheduled successfully!' });
      setFormData({
        title: '',
        date: '',
        time: '',
        meetingLink: '',
        description: ''
      });
    } catch (error) {
      console.error('Scheduling failed:', error);
      setMessage({ type: 'danger', text: 'Failed to schedule class.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Schedule New Class</Card.Header>
      <Card.Body>
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}
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

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Time *</Form.Label>
                <Form.Control
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Meeting Link (Optional)</Form.Label>
            <Form.Control
              type="url"
              name="meetingLink"
              value={formData.meetingLink}
              onChange={handleChange}
              placeholder="https://zoom.us/j/123456789"
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

          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Class'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ScheduleClassForm;
