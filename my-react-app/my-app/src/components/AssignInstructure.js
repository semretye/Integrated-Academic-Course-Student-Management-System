import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignInstructor = () => {
  const [formData, setFormData] = useState({
    courseId: '',
    instructorId: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit-related state
  const [editingAssignedId, setEditingAssignedId] = useState(null);
  const [editedAssignment, setEditedAssignment] = useState({
    courseId: '',
    instructorId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, instructorsRes, assignmentsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/assigned-courses/courses'),
        axios.get('http://localhost:8080/api/assigned-courses/instructors'),
        axios.get('http://localhost:8080/api/assigned-courses'),
      ]);

      setCourses(coursesRes.data);
      setInstructors(instructorsRes.data);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage({ text: 'Failed to load data', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8080/api/assigned-courses',
        formData
      );

      setMessage({ text: response.data.message || 'Instructor assigned successfully!', type: 'success' });
      setFormData({ courseId: '', instructorId: '' });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error assigning instructor';
      setMessage({ text: errorMsg, type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/assigned-courses/${id}`);
      setAssignments(prev => prev.filter(a => a._id !== id));
      setMessage({ text: 'Assignment deleted successfully!', type: 'success' });
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setMessage({ text: 'Failed to delete assignment.', type: 'danger' });
    }
  };

  const startEdit = (assigned) => {
    setEditingAssignedId(assigned._id);
    setEditedAssignment({
      courseId: assigned.courseId,
      instructorId: assigned.instructorId
    });
  };

  const handleEditChange = (e) => {
    setEditedAssignment({ ...editedAssignment, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(
        `http://localhost:8080/api/assigned-courses/${editingAssignedId}`,
        editedAssignment
      );
      setAssignments(prev =>
        prev.map(a => (a._id === editingAssignedId ? res.data : a))
      );
      setEditingAssignedId(null);
      setEditedAssignment({ courseId: '', instructorId: '' });
      setMessage({ text: 'Assignment updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Error updating assignment:', err);
      setMessage({ text: 'Failed to update assignment.', type: 'danger' });
    }
  };

  return (
    <div className="container mt-4">
      <h2>Assign Instructor to Course</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="courseId" className="form-label">Course</label>
          <select
            id="courseId"
            name="courseId"
            className="form-control"
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            required
          >
            <option value="">-- Select Course --</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="instructorId" className="form-label">Instructor</label>
          <select
            id="instructorId"
            name="instructorId"
            className="form-control"
            value={formData.instructorId}
            onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
            required
          >
            <option value="">-- Select Instructor --</option>
            {instructors.map(inst => (
              <option key={inst._id} value={inst._id}>
                {inst.name} ({inst.email})
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing...' : 'Assign Instructor'}
        </button>
      </form>

      <div className="mt-5">
        <h4>Current Assignments</h4>
        {loading ? (
          <p>Loading assignments...</p>
        ) : (
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Course Name</th>
                <th>Course Code</th>
                <th>Instructor Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No assignments found</td>
                </tr>
              ) : (
                assignments.map((item) => (
                  editingAssignedId === item._id ? (
                    <tr key={item._id}>
                      <td>
                        <select
                          name="courseId"
                          value={editedAssignment.courseId}
                          onChange={handleEditChange}
                          className="form-control"
                        >
                          <option value="">-- Select Course --</option>
                          {courses.map(course => (
                            <option key={course._id} value={course._id}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>–</td>
                      <td>
                        <select
                          name="instructorId"
                          value={editedAssignment.instructorId}
                          onChange={handleEditChange}
                          className="form-control"
                        >
                          <option value="">-- Select Instructor --</option>
                          {instructors.map(inst => (
                            <option key={inst._id} value={inst._id}>
                              {inst.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-success btn-sm me-2" onClick={saveEdit}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingAssignedId(null)}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item._id}>
                      <td>{item.courseName}</td>
                      <td>{item.courseCode}</td>
                      <td>{item.instructorName}</td>
                      <td>
                        <button className="btn btn-primary btn-sm me-2" onClick={() => startEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>Delete</button>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AssignInstructor;
