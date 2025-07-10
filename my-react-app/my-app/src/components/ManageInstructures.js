import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const ManageInstructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedInstructor, setEditedInstructor] = useState({
    name: '',
    username: '',
    email: '',
    role: '',
    isHead: false,
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/instructors');
      setInstructors(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch instructors.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (instr) => {
    setEditingId(instr._id);
    setEditedInstructor({
      name: instr.name || '',
      username: instr.username || '',
      email: instr.email || '',
      role: instr.role || '',
      isHead: instr.isHead || false,
      bio: instr.bio || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedInstructor(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`http://localhost:8080/api/instructors/${editingId}`, editedInstructor);
      const updated = res.data.instructor || res.data;
      setInstructors(prev =>
        prev.map(instr => (instr._id === editingId ? updated : instr))
      );
      setEditingId(null);
    } catch (err) {
      console.error('Error updating instructor:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/instructors/${selectedInstructor._id}`);
      setInstructors(prev => prev.filter(i => i._id !== selectedInstructor._id));
      setDeleteSuccess('Instructor deleted successfully.');
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      setDeleteError('Failed to delete instructor.');
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Manage Instructors</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {deleteError && <Alert variant="danger">{deleteError}</Alert>}
      {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : instructors.length === 0 ? (
        <p>No instructors found.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Head of Dept</th>
              <th>Bio</th>
              <th>Document</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((instr, idx) => (
              <tr key={instr._id}>
                <td>{idx + 1}</td>
                {editingId === instr._id ? (
                  <>
                    <td>
                      <Form.Control
                        type="text"
                        name="name"
                        value={editedInstructor.name}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        name="username"
                        value={editedInstructor.username}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="email"
                        name="email"
                        value={editedInstructor.email}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        name="role"
                        value={editedInstructor.role}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        name="isHead"
                        checked={editedInstructor.isHead}
                        onChange={handleEditChange}
                        label="Yes"
                      />
                    </td>
                    <td>
                      <Form.Control
                        as="textarea"
                        name="bio"
                        value={editedInstructor.bio}
                        onChange={handleEditChange}
                        rows={2}
                      />
                    </td>
                    <td>{instr.documentPath ? (
                      <a
                        href={`http://localhost:8080${instr.documentPath.replace('/home/etech/Desktop/react code/my-backend/src', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : '-'}</td>
                    <td>{new Date(instr.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button size="sm" variant="success" onClick={saveEdit} className="me-2">Save</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{instr.name}</td>
                    <td>{instr.username}</td>
                    <td>{instr.email}</td>
                    <td>{instr.role}</td>
                    <td>{instr.isHead ? 'Yes' : 'No'}</td>
                    <td>{instr.bio}</td>
                    <td>{instr.documentPath ? (
                      <a
                        href={`http://localhost:8080${instr.documentPath.replace('/home/etech/Desktop/react code/my-backend/src', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : '-'}</td>
                    <td>{new Date(instr.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => startEdit(instr)}>Edit</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedInstructor(instr);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Instructor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{selectedInstructor?.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageInstructors;
