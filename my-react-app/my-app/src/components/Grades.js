import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Grades = ({ student }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get('http://localhost:8080/api/students/grades', config);
        setGrades(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch grades');
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const coursesWithGrades = [...new Set(grades.map(grade => grade.course._id))].map(courseId => {
    const courseGrades = grades.filter(grade => grade.course._id === courseId);
    const course = courseGrades[0].course;
    return {
      ...course,
      grades: courseGrades,
      averageGrade: calculateAverage(courseGrades.map(g => g.score))
    };
  });

  function calculateAverage(scores) {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / scores.length).toFixed(2);
  }

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading your grades...</p>
    </div>
  );

  if (error) return (
    <div className="error-message">
      {error}
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  return (
    <div className="grades-container">
      <div className="courses-list">
        <h2>Your Courses</h2>
        {coursesWithGrades.length === 0 ? (
          <div className="empty-grades">
            <i className="fas fa-book-open"></i>
            <h3>No grades available</h3>
            <p>You don't have any grades recorded yet.</p>
          </div>
        ) : (
          <div className="course-cards">
            {coursesWithGrades.map(course => (
              <div 
                key={course._id} 
                className={`course-card ${selectedCourse?._id === course._id ? 'active' : ''}`}
                onClick={() => setSelectedCourse(course)}
              >
                <div className="course-header">
                  <h3>{course.name}</h3>
                  <span className="course-code">{course.code}</span>
                </div>
                <div className="course-grade">
                  <div className="average-grade">
                    <span>Average</span>
                    <div className="grade-value">{course.averageGrade}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grades-details">
        {selectedCourse ? (
          <div className="grades-list">
            <h3>{selectedCourse.name} Grades</h3>
            <div className="grade-summary">
              <div className="summary-item">
                <span>Average Grade</span>
                <span className="value">{selectedCourse.averageGrade}</span>
              </div>
              <div className="summary-item">
                <span>Total Assignments</span>
                <span className="value">{selectedCourse.grades.length}</span>
              </div>
              <div className="summary-item">
                <span>Highest Grade</span>
                <span className="value">
                  {Math.max(...selectedCourse.grades.map(g => g.score))}
                </span>
              </div>
            </div>

            <div className="grades-table">
              <div className="table-header">
                <div>Assignment</div>
                <div>Score</div>
                <div>Feedback</div>
                <div>Date</div>
              </div>
              {selectedCourse.grades.map(grade => (
                <div key={grade._id} className="table-row">
                  <div>{grade.assignment?.title || 'N/A'}</div>
                  <div className={`score ${getGradeClass(grade.score)}`}>
                    {grade.score}
                  </div>
                  <div className="feedback">
                    {grade.feedback || 'No feedback provided'}
                  </div>
                  <div>{new Date(grade.gradedDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="select-course-prompt">
            <i className="fas fa-hand-pointer"></i>
            <p>Select a course to view detailed grades</p>
          </div>
        )}
      </div>
    </div>
  );
};

function getGradeClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  if (score >= 60) return 'below-average';
  return 'poor';
}

export default Grades;