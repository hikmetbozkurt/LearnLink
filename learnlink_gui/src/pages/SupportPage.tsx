import React, { useState } from 'react';
import '../styles/pages/shared.css';
import '../styles/pages/support.css';
import { 
  FaQuestionCircle, 
  FaBook, 
  FaHeadset, 
  FaLock,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { useToast } from '../components/ToastProvider';

interface FAQItem {
  question: string;
  answer: string;
}

const SupportPage = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
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

  const faqItems: FAQItem[] = [
    {
      question: 'How do I create a study group?',
      answer: 'To create a study group, navigate to the Groups section and click the "Create Group" button. Fill in the group details like name, description, and privacy settings, then invite your peers.'
    },
    {
      question: 'Can I track my study progress?',
      answer: 'Yes! LearnLink provides detailed progress tracking. Visit your Progress page to view statistics, completed tasks, and study time analytics.'
    },
    {
      question: 'How do I connect with other students?',
      answer: 'You can connect with other students through the Connections page. Search for users, send friend requests, and join study groups to collaborate.'
    },
    {
      question: 'What should I do if I forget my password?',
      answer: 'If you forget your password, click the "Forgot Password" link on the login page. Enter your email address, and we\'ll send you instructions to reset your password.'
    }
  ];

  const handleFAQClick = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

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

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={index} className="faq-item">
              <div 
                className="faq-question"
                onClick={() => handleFAQClick(index)}
              >
                <span>{item.question}</span>
                {expandedFAQ === index ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {expandedFAQ === index && (
                <div className="faq-answer">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 