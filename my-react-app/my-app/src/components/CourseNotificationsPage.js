import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, ListGroup, Form, Button, Spinner, Alert } from 'react-bootstrap';

const CourseNotificationsPage = () => {
  const { courseId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/instructors/courses/${courseId}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data?.data || []);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      setError('Title and message are required');
      return;
    }

    try {
      setSubmitLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications`,
        { title, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Notification posted successfully!');
      setMessage('');
      setTitle('');
      fetchNotifications();
    } catch (err) {
      setError('Failed to post notification');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (notification) => {
    setEditingId(notification._id);
    setEditTitle(notification.title);
    setEditMessage(notification.message);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications/${editingId}`,
        { title: editTitle, message: editMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditTitle('');
      setEditMessage('');
      fetchNotifications();
    } catch (err) {
      setError('Failed to update notification');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      setError('Failed to delete notification');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [courseId]);

  return (
    <Card className="shadow-sm border-0">
      <Card.Header>
        <h5 className="mb-0">Post New Notification</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message"
              required
            />
          </Form.Group>
          <Button type="submit" disabled={submitLoading}>
            {submitLoading ? 'Posting...' : 'Post Notification'}
          </Button>
        </Form>
      </Card.Body>

      <Card.Footer>
        <h6 className="mt-4">Recent Notifications</h6>
        {loading ? (
          <Spinner animation="border" variant="primary" size="sm" />
        ) : (
          <ListGroup>
            {notifications.map((n) => (
              <ListGroup.Item key={n._id}>
                {editingId === n._id ? (
                  <Form onSubmit={handleEditSubmit}>
                    <Form.Group className="mb-2">
                      <Form.Control
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Edit title"
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        placeholder="Edit message"
                        required
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button variant="success" size="sm" type="submit" className="me-2">
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <>
                    <strong>{n.title}</strong>
                    <p className="mb-1">{n.message}</p>
                    <small className="text-muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </small>
                    <div className="mt-2 d-flex gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(n)}>
                        Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(n._id)}>
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </ListGroup.Item>
            ))}
            {notifications.length === 0 && (
              <div className="text-muted p-2">No notifications yet</div>
            )}
          </ListGroup>
        )}
      </Card.Footer>
    </Card>
  );
};

export default CourseNotificationsPage;
