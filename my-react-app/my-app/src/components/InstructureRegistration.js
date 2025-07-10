import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const InstructorRegistration = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    birthDate: null,
    age: '',
    country: '',
    cbeAccountNumber: '',
    isHead: false,
    bio: ''
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const documentInputRef = useRef(null);
  const navigate = useNavigate();

  const countries = ['Ethiopia', 'Kenya', 'Uganda', 'Tanzania', 'South Africa', 'Nigeria', 'Other'];

  // Auto calculate age when birthDate changes
  useEffect(() => {
    if (formData.birthDate) {
      const today = new Date();
      const birth = new Date(formData.birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  }, [formData.birthDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      birthDate: date
    }));
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      setDocumentName(file.name);
    } else {
      setDocumentFile(null);
      setDocumentName('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.email.match(/\S+@\S+\.\S+/)) newErrors.email = 'Valid email required';
    if (!formData.name.trim()) newErrors.name = 'Full name required';
    if (!formData.birthDate) newErrors.birthDate = 'Birth date required';
    if (!formData.age || isNaN(formData.age) || Number(formData.age) < 0) newErrors.age = 'Valid age required';
    if (!formData.country) newErrors.country = 'Country required';
    if (!formData.cbeAccountNumber.trim()) newErrors.cbeAccountNumber = 'CBE Account Number required';
    if (!documentFile) newErrors.documentFile = 'Document upload required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all simple fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'birthDate' && value instanceof Date) {
            formDataToSend.append(key, value.toISOString().split('T')[0]); // format date as yyyy-mm-dd
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      // Append document file
      if (documentFile) {
          formDataToSend.append('documentFile', documentFile);
      }

     const response = await axios.post('http://localhost:8080/api/instructors/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        navigate('/admin/instructors', {
          state: {
            message: 'Instructor registered successfully',
            instructor: response.data.instructor
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h2 className="text-center mb-4">Register New Instructor</h2>

          {serverError && <Alert variant="danger">{serverError}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    isInvalid={!!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Birth Date *</Form.Label>
                  <DatePicker
                    selected={formData.birthDate}
                    onChange={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    maxDate={new Date()}
                    className={`form-control ${errors.birthDate ? 'is-invalid' : ''}`}
                    placeholderText="Select birth date"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                  />
                  {errors.birthDate && <div className="invalid-feedback d-block">{errors.birthDate}</div>}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age *</Form.Label>
                  <Form.Control
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    isInvalid={!!errors.age}
                    min="0"
                    max="120"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.age}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Country *</Form.Label>
              <Form.Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                isInvalid={!!errors.country}
              >
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.country}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CBE Account Number *</Form.Label>
              <Form.Control
                type="text"
                name="cbeAccountNumber"
                value={formData.cbeAccountNumber}
                onChange={handleChange}
                isInvalid={!!errors.cbeAccountNumber}
              />
              <Form.Control.Feedback type="invalid">
                {errors.cbeAccountNumber}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Upload Document (PDF/DOC) *</Form.Label>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  {documentName ? (
                    <Card style={{ padding: '8px' }}>
                      <strong>{documentName}</strong>
                    </Card>
                  ) : (
                    <div
                      style={{
                        minWidth: '150px',
                        minHeight: '40px',
                        border: '1px dashed #6c757d',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6c757d'
                      }}
                    >
                      No Document Selected
                    </div>
                  )}
                </div>
                <div>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocumentChange}
                    ref={documentInputRef}
                    style={{ display: 'none' }}
                  />
                  <Button variant="outline-secondary" onClick={() => documentInputRef.current.click()}>
                    {documentName ? 'Change Document' : 'Upload Document'}
                  </Button>
                  {documentName && (
                    <Button
                      variant="link"
                      className="text-danger ms-2"
                      onClick={() => {
                        setDocumentFile(null);
                        setDocumentName('');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {errors.documentFile && <div className="text-danger mt-1">{errors.documentFile}</div>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Set as Head of Department"
                name="isHead"
                checked={formData.isHead}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-grid gap-2 mt-4">
              <Button variant="primary" type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Instructor'}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default InstructorRegistration;
