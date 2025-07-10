import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, ListGroup, Spinner, Alert, Form } from 'react-bootstrap';

const Schedule = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/students/enrolled-courses', { headers });
        setEnrolledCourses(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch enrolled courses.');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const fetchSchedule = async (courseId) => {
    setLoadingSchedule(true);
    setError('');
    try {
      const res = await axios.get(
        `http://localhost:8080/api/courses/${courseId}/schedule?nocache=${Date.now()}`,
        { headers }
      );
      setSchedule(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedule.');
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    if (courseId) {
      fetchSchedule(courseId);
    } else {
      setSchedule([]);
    }
  };

  if (loadingCourses) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Select Course to View Schedule</Form.Label>
            <Form.Select value={selectedCourseId} onChange={handleCourseChange}>
              <option value="">-- Choose a course --</option>
              {enrolledCourses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {loadingSchedule && (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading schedule...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {schedule.length > 0 && (
        <Card>
          <Card.Header className="bg-primary text-white">Scheduled Classes</Card.Header>
          <ListGroup variant="flush">
            {schedule.map((item) => (
              <ListGroup.Item key={item._id}>
                <h5>{item.title}</h5>
                <p><strong>Date:</strong> {item.date}</p>
                <p><strong>Time:</strong> {item.time}</p>
                {item.meetingLink && (
                  <p>
                    <a href={item.meetingLink} target="_blank" rel="noopener noreferrer">
                      Join Meeting
                    </a>
                  </p>
                )}
                {item.description && <p>{item.description}</p>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      {!loadingSchedule && selectedCourseId && schedule.length === 0 && (
        <p>No scheduled classes found for this course.</p>
      )}
    </div>
  );
};

export default Schedule;
