import React, { useState } from 'react';
import axios from 'axios';

function AddCourse() {
  const [course, setCourse] = useState({
    name: '',
    code: '',
    description: '',
    duration: '',
    price: '', // Added price
  });

  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setCourse({
      ...course,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const validate = () => {
    const errors = {};
    if (!course.name.trim()) errors.name = 'Course name is required';
    if (!course.code.trim()) errors.code = 'Course code is required';
    if (!course.duration.trim()) errors.duration = 'Duration is required';
    if (!course.price || isNaN(course.price) || parseFloat(course.price) < 0) {
      errors.price = 'Valid price is required';
    }
    if (!image) errors.image = 'Course image is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('name', course.name);
      formData.append('code', course.code);
      formData.append('description', course.description);
      formData.append('duration', course.duration);
      formData.append('price', course.price); // Append price

      const response = await axios.post('http://localhost:8080/api/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Course created:', response.data);
      setSuccessMessage('Course added successfully!');

      // Reset form
      setCourse({ name: '', code: '', description: '', duration: '', price: '' });
      setImage(null);
    } catch (err) {
      console.error('Error adding course:', err);
      if (err.response?.data?.message) {
        setErrors({ submit: err.response.data.message });
      } else {
        setErrors({ submit: 'Failed to add course. Try again later.' });
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add Course</h2>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errors.submit && <div className="alert alert-danger">{errors.submit}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Course Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={course.name}
            onChange={handleChange}
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="code" className="form-label">Course Code</label>
          <input
            type="text"
            id="code"
            name="code"
            value={course.code}
            onChange={handleChange}
            className={`form-control ${errors.code ? 'is-invalid' : ''}`}
          />
          {errors.code && <div className="invalid-feedback">{errors.code}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            value={course.description}
            onChange={handleChange}
            className="form-control"
            rows="3"
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="duration" className="form-label">Duration (e.g., 3 months)</label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={course.duration}
            onChange={handleChange}
            className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
          />
          {errors.duration && <div className="invalid-feedback">{errors.duration}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="price" className="form-label">Course Price (e.g., 100)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={course.price}
            onChange={handleChange}
            className={`form-control ${errors.price ? 'is-invalid' : ''}`}
            min="0"
            step="0.01"
          />
          {errors.price && <div className="invalid-feedback">{errors.price}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">Course Image</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            className={`form-control ${errors.image ? 'is-invalid' : ''}`}
            accept="image/*"
          />
          {errors.image && <div className="invalid-feedback">{errors.image}</div>}
        </div>

        <button type="submit" className="btn btn-primary">Add Course</button>
      </form>
    </div>
  );
}

export default AddCourse;
