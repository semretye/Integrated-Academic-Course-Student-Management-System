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
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      if (res.data.success) {
        setNotifications(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications`,
        { 
          title: title.trim(),
          message: message.trim() 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (res.data.success) {
        setSuccess('Notification posted successfully!');
        setMessage('');
        setTitle('');
        fetchNotifications(); // Refresh the list
      } else {
        setError(res.data.message || 'Failed to post notification');
      }
    } catch (err) {
      console.error('Post error:', err);
      setError(err.response?.data?.message || 'Failed to post notification');
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
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications/${editingId}`,
        { 
          title: editTitle.trim(),
          message: editMessage.trim() 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (res.data.success) {
        setEditingId(null);
        setEditTitle('');
        setEditMessage('');
        fetchNotifications();
      } else {
        setError(res.data.message || 'Failed to update notification');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Failed to update notification');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `http://localhost:8080/api/instructors/courses/${courseId}/notifications/${notificationId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );

      if (res.data.success) {
        fetchNotifications();
      } else {
        setError(res.data.message || 'Failed to delete notification');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [courseId]);

  return (
    <Card className="shadow-sm border-0">
      <Card.Header>
        <h5 className="mb-0">Course Notifications</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        
        <h6 className="mb-3">Post New Notification</h6>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
              maxLength={100}
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
              maxLength={500}
            />
          </Form.Group>
          <Button 
            type="submit" 
            variant="primary"
            disabled={submitLoading || !title.trim() || !message.trim()}
          >
            {submitLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Posting...</span>
              </>
            ) : 'Post Notification'}
          </Button>
        </Form>
      </Card.Body>

      <Card.Footer>
        <h6 className="mb-3">Recent Notifications</h6>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading notifications...</p>
          </div>
        ) : (
          <ListGroup>
            {notifications.length === 0 ? (
              <ListGroup.Item className="text-center py-4 text-muted">
                No notifications found for this course
              </ListGroup.Item>
            ) : (
              notifications.map((n) => (
                <ListGroup.Item key={n._id} className="mb-3">
                  {editingId === n._id ? (
                    <Form onSubmit={handleEditSubmit}>
                      <Form.Group className="mb-2">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Edit title"
                          required
                          maxLength={100}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          placeholder="Edit message"
                          required
                          maxLength={500}
                        />
                      </Form.Group>
                      <div className="d-flex justify-content-end mt-2">
                        <Button 
                          variant="success" 
                          size="sm" 
                          type="submit" 
                          className="me-2"
                          disabled={!editTitle.trim() || !editMessage.trim()}
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => {
                            setEditingId(null);
                            setEditTitle('');
                            setEditMessage('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{n.title}</h6>
                          <p className="mb-1">{n.message}</p>
                        </div>
                        {n.postedBy && (
                          <small className="text-muted">
                            Posted by: {n.postedBy.firstName} {n.postedBy.lastName}
                          </small>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small className="text-muted">
                          {new Date(n.createdAt).toLocaleString()}
                        </small>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleEdit(n)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDelete(n._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        )}
      </Card.Footer>
    </Card>
  );
};

export default CourseNotificationsPage;