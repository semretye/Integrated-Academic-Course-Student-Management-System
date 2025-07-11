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
    const finalPercentage = weightedSum / totalWeight;
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

module.exports = { calculateFinalGrade };