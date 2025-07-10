import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Container, Modal, Form, Alert } from 'react-bootstrap';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editedStudent, setEditedStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    gender: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/students');
      setStudents(Array.isArray(res.data) ? res.data : res.data.students || []);
    } catch (err) {
      setError('Error fetching students');
      console.error(err);
    }
  };

  const startEdit = (student) => {
    setEditingStudentId(student._id);
    setEditedStudent({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      username: student.username,
      gender: student.gender
    });
  };

  const handleEditChange = (e) => {
    setEditedStudent({ ...editedStudent, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`http://localhost:8080/api/students/${editingStudentId}`, editedStudent);
      const updated = res.data.student || res.data; // Adjust to your API response
      setStudents(prev =>
        prev.map(s => (s._id === editingStudentId ? updated : s))
      );
      setEditingStudentId(null);
    } catch (err) {
      console.error('Error updating student:', err);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/students/${selectedStudent._id}`);
      setStudents(prev => prev.filter(s => s._id !== selectedStudent._id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Manage Students</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Username</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student, index) => (
              <tr key={student._id}>
                <td>{index + 1}</td>
                <td>
                  <img
                    src={
                      student.profilePicture?.startsWith('http')
                        ? student.profilePicture
                        : `http://localhost:8080/${student.profilePicture}`
                    }
                    alt="Profile"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                </td>
                {editingStudentId === student._id ? (
                  <>
                    <td>
                      <Form.Control
                        name="firstName"
                        value={editedStudent.firstName}
                        onChange={handleEditChange}
                      />
                      <Form.Control
                        name="lastName"
                        value={editedStudent.lastName}
                        onChange={handleEditChange}
                        className="mt-1"
                      />
                    </td>
                    <td>
                      <Form.Control
                        name="email"
                        value={editedStudent.email}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <Form.Control
                        name="username"
                        value={editedStudent.username}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <Form.Select
                        name="gender"
                        value={editedStudent.gender}
                        onChange={handleEditChange}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Button size="sm" variant="success" onClick={saveEdit} className="me-2">
                        Save
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingStudentId(null)}>
                        Cancel
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.email}</td>
                    <td>{student.username}</td>
                    <td>{student.gender}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => startEdit(student)}
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageStudents;
