const Schedule = require('../models/Schedule');

// Create a new scheduled class
exports.createScheduledClass = async (req, res) => {
  const { courseId } = req.params;
  const { title, date, time, meetingLink, description } = req.body;

  try {
    const newSchedule = new Schedule({
      courseId,
      title,
      date,
      time,
      meetingLink,
      description
    });

    const savedSchedule = await newSchedule.save();
    res.status(201).json({ success: true, schedule: savedSchedule });
  } catch (error) {
    console.error('Error creating scheduled class:', error);
    res.status(500).json({ message: 'Server error creating scheduled class' });
  }
};

// Optional: get all scheduled classes for a course
exports.getScheduledClassesByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const schedules = await Schedule.find({ courseId });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Failed to fetch scheduled classes' });
  }
};

