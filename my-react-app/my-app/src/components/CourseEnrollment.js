import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message, Steps } from 'antd';
import axios from 'axios';

const { Step } = Steps;
const { Option } = Select;

const CourseEnrollmentModal = ({ course, visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePayment = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/enrollments', {
        courseId: course._id,
        paymentMethod: values.paymentMethod,
        phone: values.phone,
        accountNumber: values.accountNumber,
        amount: course.price
      });

      if (response.data.success) {
        message.success('Payment successful! Enrollment confirmed.');
        setCurrentStep(2); // Move to success step
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Payment Method',
      content: (
        <Form form={form} layout="vertical">
          <Form.Item
            name="paymentMethod"
            label="Select Payment Method"
            rules={[{ required: true }]}
          >
            <Select placeholder="Choose payment option">
              <Option value="telebirr">Telebirr</Option>
              <Option value="cbe">CBE</Option>
              <Option value="bank">Other Bank</Option>
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Payment Details',
      content: (
        <Form form={form} layout="vertical">
          <Form.Item
            noStyle
            shouldUpdate={(prev, current) => prev.paymentMethod !== current.paymentMethod}
          >
            {({ getFieldValue }) => {
              const method = getFieldValue('paymentMethod');
              
              if (method === 'telebirr') {
                return (
                  <Form.Item
                    name="phone"
                    label="Telebirr Phone Number"
                    rules={[
                      { required: true },
                      { pattern: /^09\d{8}$/, message: 'Invalid Ethiopian phone' }
                    ]}
                  >
                    <Input placeholder="0912345678" />
                  </Form.Item>
                );
              } else if (method === 'cbe') {
                return (
                  <Form.Item
                    name="accountNumber"
                    label="CBE Account Number"
                    rules={[
                      { required: true },
                      { pattern: /^\d{13,16}$/, message: 'Invalid CBE account' }
                    ]}
                  >
                    <Input placeholder="1000123456789" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Confirmation',
      content: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <h3>Enrollment Successful!</h3>
          <p>You are now enrolled in {course.title}</p>
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      ),
    },
  ];

  const next = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Modal
      title={`Enroll in ${course.title} - ${course.price} ETB`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      destroyOnClose
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      
      <div className="steps-content">{steps[currentStep].content}</div>
      
      <div className="steps-action">
        {currentStep === 0 && (
          <Button type="primary" onClick={next}>
            Next
          </Button>
        )}
        {currentStep === 1 && (
          <>
            <Button style={{ marginRight: 8 }} onClick={prev}>
              Back
            </Button>
            <Button 
              type="primary" 
              onClick={() => form.submit()} 
              loading={loading}
            >
              Pay Now
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CourseEnrollmentModal;