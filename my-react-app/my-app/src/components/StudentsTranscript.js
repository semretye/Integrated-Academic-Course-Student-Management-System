import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Button,
  Table,
  Alert,
  Spinner,
  Modal,
  Form,
  Card
} from 'react-bootstrap';

const StudentsTranscript = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [transcriptData, setTranscriptData] = useState({
    assignments: [],
    remarks: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const [courseRes, studentsRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8080/api/courses/${courseId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCourse(courseRes.data);
        
        // Handle different possible response formats
        let studentsData = [];
        if (Array.isArray(studentsRes.data)) {
          studentsData = studentsRes.data;
        } else if (studentsRes.data?.data && Array.isArray(studentsRes.data.data)) {
          studentsData = studentsRes.data.data;
        } else if (studentsRes.data?.students && Array.isArray(studentsRes.data.students)) {
          studentsData = studentsRes.data.students;
        } else {
          throw new Error('Invalid students data format');
        }
        
        setStudents(studentsData);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleOpenTranscript = async (student) => {
    try {
      setLoading(true);
      setSelectedStudent(student);
      
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:8080/api/courses/${courseId}/students/${student._id}/transcript`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      // Handle different response formats
      const transcript = res.data?.transcript || res.data || {};
      
      setTranscriptData({
        assignments: transcript?.assignments?.length > 0 
          ? transcript.assignments 
          : [{
              name: '', 
              score: '', 
              maxScore: '', 
              weight: '',
              percentage: ''
            }],
        remarks: transcript?.remarks || ''
      });
      
      setShowTranscriptModal(true);
    } catch (err) {
      console.error('Transcript load error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load transcript. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptChange = (index, field, value) => {
    const updatedAssignments = [...transcriptData.assignments];
    updatedAssignments[index][field] = value;
    
    if ((field === 'score' || field === 'maxScore') && 
        updatedAssignments[index].score && 
        updatedAssignments[index].maxScore) {
      updatedAssignments[index].percentage = Math.round(
        (updatedAssignments[index].score / updatedAssignments[index].maxScore) * 100
      );
    }
    
    setTranscriptData({
      ...transcriptData,
      assignments: updatedAssignments
    });
  };

  const addAssignment = () => {
    setTranscriptData({
      ...transcriptData,
      assignments: [
        ...transcriptData.assignments,
        { name: '', score: '', maxScore: '', weight: '', percentage: '' }
      ]
    });
  };

  const removeAssignment = (index) => {
    const updatedAssignments = [...transcriptData.assignments];
    updatedAssignments.splice(index, 1);
    setTranscriptData({
      ...transcriptData,
      assignments: updatedAssignments
    });
  };

  const handleSaveTranscript = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `http://localhost:8080/api/courses/${courseId}/students/${selectedStudent._id}/transcript`,
        transcriptData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowTranscriptModal(false);
      
      // Refresh students list
      const studentsRes = await axios.get(
        `http://localhost:8080/api/courses/${courseId}/students`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Handle response format
      const updatedStudents = studentsRes.data?.data || studentsRes.data?.students || studentsRes.data;
      if (Array.isArray(updatedStudents)) {
        setStudents(updatedStudents);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to save transcript. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showTranscriptModal) {
    return (
      <Container className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
        <span className="ms-2">Loading data...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="my-4">Transcript Management - {course?.name}</h2>
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Enrolled Students</span>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh List
          </Button>
        </Card.Header>
        <Card.Body>
          {students.length === 0 ? (
            <Alert variant="info">
              No students are currently enrolled in this course.
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id}>
                    <td>{student.studentId || 'N/A'}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenTranscript(student)}
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : 'Edit Transcript'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal 
        show={showTranscriptModal} 
        onHide={() => setShowTranscriptModal(false)} 
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedStudent?.name}'s Transcript
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Assignments</h5>
          {transcriptData.assignments.length === 0 ? (
            <Alert variant="info">No assignments added yet</Alert>
          ) : (
            <Table bordered className="mb-4">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Max Score</th>
                  <th>Weight (%)</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transcriptData.assignments.map((assignment, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        type="text"
                        value={assignment.name}
                        onChange={(e) => handleTranscriptChange(index, 'name', e.target.value)}
                        placeholder="Assignment name"
                        required
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={assignment.score}
                        onChange={(e) => handleTranscriptChange(index, 'score', e.target.value)}
                        placeholder="Score"
                        min="0"
                        required
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={assignment.maxScore}
                        onChange={(e) => handleTranscriptChange(index, 'maxScore', e.target.value)}
                        placeholder="Max score"
                        min="1"
                        required
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={assignment.weight}
                        onChange={(e) => handleTranscriptChange(index, 'weight', e.target.value)}
                        placeholder="Weight"
                        min="0"
                        max="100"
                        required
                      />
                    </td>
                    <td className="align-middle">
                      {assignment.percentage ? calculateLetterGrade(assignment.percentage) : 'N/A'}
                    </td>
                    <td className="align-middle">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeAssignment(index)}
                        disabled={transcriptData.assignments.length <= 1}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <div className="d-flex justify-content-between mb-3">
            <Button variant="secondary" onClick={addAssignment}>
              Add Assignment
            </Button>
            <div>
              <strong>Final Grade: </strong>
              {transcriptData.assignments.length > 0 ? (
                <span>
                  {calculateFinalGrade(transcriptData.assignments).letterGrade} (
                  {calculateFinalGrade(transcriptData.assignments).percentage}%)
                </span>
              ) : (
                <span>N/A</span>
              )}
            </div>
          </div>

          <Form.Group>
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={transcriptData.remarks}
              onChange={(e) => setTranscriptData({
                ...transcriptData,
                remarks: e.target.value
              })}
              placeholder="Additional comments about student's performance"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowTranscriptModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveTranscript} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : 'Save Transcript'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Helper functions
function calculateLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

function calculateFinalGrade(assignments) {
  let totalWeight = 0;
  let weightedSum = 0;
  
  assignments.forEach(assignment => {
    if (assignment.percentage && assignment.weight) {
      weightedSum += (assignment.percentage * assignment.weight) / 100;
      totalWeight += parseFloat(assignment.weight);
    }
  });
  
  if (totalWeight > 0) {
    const finalPercentage = weightedSum / totalWeight * 100;
    const gradeObj = gradeScale.find(g => finalPercentage >= g.min);
    return {
      percentage: Math.round(finalPercentage),
      letterGrade: gradeObj.grade,
      points: gradeObj.points
    };
  }
  
  return {
    percentage: 0,
    letterGrade: 'N/A',
    points: 0
  };
}

const gradeScale = [
  { min: 97, grade: 'A+', points: 4.0 },
  { min: 93, grade: 'A', points: 4.0 },
  { min: 90, grade: 'A-', points: 3.7 },
  { min: 87, grade: 'B+', points: 3.3 },
  { min: 83, grade: 'B', points: 3.0 },
  { min: 80, grade: 'B-', points: 2.7 },
  { min: 77, grade: 'C+', points: 2.3 },
  { min: 73, grade: 'C', points: 2.0 },
  { min: 70, grade: 'C-', points: 1.7 },
  { min: 67, grade: 'D+', points: 1.3 },
  { min: 63, grade: 'D', points: 1.0 },
  { min: 60, grade: 'D-', points: 0.7 },
  { min: 0, grade: 'F', points: 0.0 }
];

export default StudentsTranscript;