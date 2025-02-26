import React, { useState } from 'react';
import '../styles/pages/shared.css';
import '../styles/pages/support.css';
import { 
  FaQuestionCircle, 
  FaBook, 
  FaHeadset, 
  FaLock
} from 'react-icons/fa';
import { useToast } from '../components/ToastProvider';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { showToast } = useToast();

  const supportCategories = [
    {
      icon: <FaQuestionCircle />,
      title: 'General Help',
      description: 'Get answers to common questions about using LearnLink.'
    },
    {
      icon: <FaBook />,
      title: 'Study Resources',
      description: 'Access guides and tutorials for effective studying.'
    },
    {
      icon: <FaHeadset />,
      title: 'Technical Support',
      description: 'Get help with technical issues and platform features.'
    },
    {
      icon: <FaLock />,
      title: 'Account & Security',
      description: 'Manage your account settings and security preferences.'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    showToast('Your message has been sent. We\'ll get back to you soon!', 'success');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="support-container">
      <div className="page-header">
        <h2 className="page-title">Support Center</h2>
      </div>

      <div className="support-grid">
        {supportCategories.map((category, index) => (
          <div key={index} className="support-card">
            <div className="support-card-header">
              <div className="support-card-icon">
                {category.icon}
              </div>
              <h3>{category.title}</h3>
            </div>
            <p>{category.description}</p>
          </div>
        ))}
      </div>

      <div className="contact-section">
        <h2>Contact Support</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportPage; 