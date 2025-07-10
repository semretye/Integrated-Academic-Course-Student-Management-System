import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Table, Button, Form, Badge } from 'react-bootstrap';
import { PencilSquare, Trash, CheckCircle, XCircle } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editedCourse, setEditedCourse] = useState({
    name: '',
    code: '',
    description: '',
    duration: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/courses/${id}`);
      setCourses(prev => prev.filter(course => course._id !== id));
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const startEdit = (course) => {
    setEditingCourseId(course._id);
    setEditedCourse({
      name: course.name,
      code: course.code,
      description: course.description,
      duration: course.duration
    });
  };

  const handleEditChange = (e) => {
    setEditedCourse({ ...editedCourse, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(
        `http://localhost:8080/api/courses/${editingCourseId}`,
        editedCourse
      );

      const updatedCourse = res.data.course;

      setCourses(prev =>
        prev.map(course =>
          course._id === editingCourseId ? updatedCourse : course
        )
      );
      setEditingCourseId(null);
    } catch (err) {
      console.error('Error updating course:', err);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-primary fw-bold">📚 Manage Courses</h2>
      <Table striped bordered hover responsive className="shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Description</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course._id}>
              {editingCourseId === course._id ? (
                <>
                  <td>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editedCourse.name}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      name="code"
                      value={editedCourse.code}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      name="description"
                      value={editedCourse.description}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      name="duration"
                      value={editedCourse.duration}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <Button variant="success" size="sm" className="me-2" onClick={saveEdit}>
                      <CheckCircle className="me-1" /> Save
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingCourseId(null)}>
                      <XCircle className="me-1" /> Cancel
                    </Button>
                  </td>
                </>
              ) : (
                <>
                  <td>{course.name}</td>
                  <td>
                    <Badge bg="info">{course.code}</Badge>
                  </td>
                  <td>{course.description}</td>
                  <td>{course.duration}</td>
                  <td>
                    <Button variant="primary" size="sm" className="me-2" onClick={() => startEdit(course)}>
                      <PencilSquare className="me-1" /> Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(course._id)}>
                      <Trash className="me-1" /> Delete
                    </Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default ManageCourses;
