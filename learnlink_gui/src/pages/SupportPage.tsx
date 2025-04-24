import React, { useState } from 'react';
import '../styles/pages/shared.css';
import '../styles/pages/support.css';
import { 
  FaQuestionCircle, 
  FaBook, 
  FaHeadset, 
  FaLock,
  FaChevronDown,
  FaChevronUp,
  FaComments,
  FaUsers,
  FaCalendarAlt,
  FaFileAlt,
  FaChartBar,
  FaUserGraduate,
  FaEnvelope,
  FaPhone,
  FaMobile,
  FaTimes
} from 'react-icons/fa';
import { useToast } from '../components/ToastProvider';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const SupportPage = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('account');
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { showToast } = useToast();

  const faqCategories: FAQCategory[] = [
    {
      id: 'account',
      title: 'Account & Profile',
      icon: <FaUserGraduate />,
      items: [
        {
          question: 'How do I create an account on LearnLink?',
          answer: 'To create an account, go to the Login page and click "Sign Up". Fill in your information including name, email, and password. After verification, you can set up your profile including academic interests and profile picture.'
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Click on your profile picture in the top-right corner and select "Profile". Here, you can edit your personal information, update your profile picture, and customize your notification preferences.'
        },
        {
          question: 'What should I do if I forget my password?',
          answer: 'Click the "Forgot Password" link on the login page. Enter your email address, and we\'ll send you a link to reset your password. For security reasons, the link expires after 24 hours.'
        },
        {
          question: 'Can I change my email address?',
          answer: 'Yes. Go to Profile Settings, click on "Account", and update your email address. You\'ll need to verify the new email address before the change takes effect.'
        }
      ]
    },
    {
      id: 'courses',
      title: 'Courses & Learning',
      icon: <FaBook />,
      items: [
        {
          question: 'How do I enroll in a course?',
          answer: 'Browse courses through the Courses page. When you find a course you want to join, click the "Enroll" button. If the course requires an enrollment key, you\'ll need to enter it. The key should be provided by your instructor.'
        },
        {
          question: 'Can I create my own course?',
          answer: 'Yes, if you have instructor privileges. Go to the Courses page and click "Create Course". Fill in the course details, including name, description, and whether it requires an enrollment key. You can then add materials and assignments.'
        },
        {
          question: 'How do I view course materials?',
          answer: 'Navigate to the course page by clicking on the course from your Courses list. Course materials are organized in the "Materials" tab, where you can download resources, view announcements, and access assignment details.'
        },
        {
          question: 'Can I leave a course I\'ve enrolled in?',
          answer: 'Yes. Go to the course page and click the settings icon (⚙️). Select "Leave Course" from the dropdown menu. Note that this action may result in losing access to course materials and assignments.'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      icon: <FaComments />,
      items: [
        {
          question: 'How do I send direct messages to other users?',
          answer: 'You can send direct messages from the Direct Messages page. Click the "+" button to start a new conversation, search for the user, and begin chatting. You can also start a conversation from a user\'s profile by clicking the message icon.'
        },
        {
          question: 'How do I join a chatroom?',
          answer: 'Course-specific chatrooms are automatically available when you enroll in a course. To join other chatrooms, go to the Chatrooms page, browse available chatrooms, and click "Join". Some chatrooms may require permission from the admin.'
        },
        {
          question: 'Can I create my own chatroom?',
          answer: 'Yes. Go to the Chatrooms page and click "Create Chatroom". Set a name, description, and privacy settings. You can make it public, private (invitation only), or course-specific (available only to enrolled students).'
        },
        {
          question: 'How do I manage notifications for messages?',
          answer: 'Go to your Profile Settings and select "Notifications". Here you can customize which message notifications you receive, including direct messages, chatroom mentions, and announcements.'
        }
      ]
    },
    {
      id: 'connections',
      title: 'Connections & Networking',
      icon: <FaUsers />,
      items: [
        {
          question: 'How do I connect with other students?',
          answer: 'Go to the Connections page to find and connect with other users. You can search by name or browse recommendations based on shared courses. Send a connection request, and once accepted, you can message and collaborate.'
        },
        {
          question: 'How do I manage connection requests?',
          answer: 'Connection requests appear in your notifications (bell icon at the top). You can also view and manage all requests from the Connections page under the "Requests" tab.'
        },
        {
          question: 'Can I remove a connection?',
          answer: 'Yes. Go to your Connections page, find the connection you want to remove, click the options menu (⋮), and select "Remove Connection". The person will not be notified when removed.'
        },
        {
          question: 'How can I find recommended connections?',
          answer: 'LearnLink suggests connections based on shared courses, similar academic interests, and mutual connections. These recommendations appear on your Connections page under "Recommended".'
        }
      ]
    },
    {
      id: 'assignments',
      title: 'Assignments & Submissions',
      icon: <FaFileAlt />,
      items: [
        {
          question: 'How do I view assignments for my courses?',
          answer: 'Assignments for each course are listed on the course page under the "Assignments" tab. You can also see all upcoming assignments across courses on the Assignments page, which is accessible from the main navigation.'
        },
        {
          question: 'How do I submit an assignment?',
          answer: 'Open the assignment from the course or assignments page. Click "Submit Assignment" and either upload your file(s) or enter text for written submissions. Confirm your submission before the deadline.'
        },
        {
          question: 'Can I edit or resubmit an assignment?',
          answer: 'Yes, if the instructor allows it and the deadline hasn\'t passed. Go to the assignment page and click "Edit Submission". Your new submission will replace the previous one.'
        },
        {
          question: 'How do I check my grades and feedback?',
          answer: 'Go to the assignment page and view the "Grades & Feedback" section. You\'ll see your score and any comments from your instructor. You can also view all your grades from the Progress page.'
        }
      ]
    },
    {
      id: 'events',
      title: 'Events & Calendar',
      icon: <FaCalendarAlt />,
      items: [
        {
          question: 'How do I create an event?',
          answer: 'Go to the Events page and click "Create Event". Fill in the details including title, date, time, and description. You can make it private, share it with specific connections, or make it available to all course participants.'
        },
        {
          question: 'How do I join an event created by someone else?',
          answer: 'Events shared with you will appear on your Events page. Click "Join" to confirm your participation. For some events, you may need to request access first.'
        },
        {
          question: 'Can I set reminders for events and deadlines?',
          answer: 'Yes. When viewing an event, click "Set Reminder" and choose when you want to be notified. You can also set reminders for assignment deadlines from the assignment details page.'
        },
        {
          question: 'How do I sync LearnLink events with my calendar app?',
          answer: 'Go to Events settings and select "Calendar Integration". You can export events to popular calendar apps like Google Calendar, Apple Calendar, or Outlook by copying the calendar URL or downloading the ICS file.'
        }
      ]
    },
    {
      id: 'progress',
      title: 'Progress Tracking',
      icon: <FaChartBar />,
      items: [
        {
          question: 'How can I track my learning progress?',
          answer: 'The Progress page provides comprehensive analytics on your activity. You can see statistics on your course engagement, message activity, assignments completed, and more. Click on any chart to view detailed information.'
        },
        {
          question: 'What do the different charts on the Progress page mean?',
          answer: 'The charts display different aspects of your learning journey: Direct vs Group Messages shows your communication patterns; Courses shows your enrollment and creation stats; Posts displays your content creation metrics; and Comments shows your engagement with other users\' content.'
        },
        {
          question: 'Can I export my progress data?',
          answer: 'Yes. On the Progress page, click the export icon in the top-right corner. You can download your data in various formats including CSV, PDF, or JSON for personal record-keeping or analysis.'
        },
        {
          question: 'How is my progress calculated?',
          answer: 'Progress metrics are based on your actual activity within the platform, including message counts, assignment completion rates, course engagement, post and comment activity, and more. The data is updated in real-time as you interact with LearnLink.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: <FaHeadset />,
      items: [
        {
          question: 'What browsers are supported by LearnLink?',
          answer: 'LearnLink works best on modern browsers like Chrome, Firefox, Safari, and Edge. For optimal performance, we recommend keeping your browser updated to the latest version.'
        },
        {
          question: 'How can I report a bug or technical issue?',
          answer: 'Use the Contact Form below to report technical issues. Please provide as much detail as possible, including steps to reproduce the issue, screenshots if available, and what you expected to happen.'
        },
        {
          question: 'Is LearnLink available on mobile devices?',
          answer: 'Yes. LearnLink is optimized for mobile browsers and adjusts to fit different screen sizes. While we don\'t have native apps yet, you can add LearnLink to your home screen for app-like access on both iOS and Android devices.'
        },
        {
          question: 'What should I do if the page isn\'t loading or is showing errors?',
          answer: 'First, try refreshing the page. If that doesn\'t work, clear your browser cache and cookies, then restart your browser. If you still experience issues, check your internet connection and try a different browser if possible. If problems persist, contact technical support.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: <FaLock />,
      items: [
        {
          question: 'How is my data protected on LearnLink?',
          answer: 'LearnLink uses encryption for all sensitive data, including passwords and personal information. We also employ secure server infrastructure and regularly audit our security measures to ensure your data remains protected.'
        },
        {
          question: 'Who can see my profile information?',
          answer: 'By default, only connected users can see your full profile. You can customize privacy settings in your Profile Settings to control who sees your courses, activity, and contact information.'
        },
        {
          question: 'Are my messages private?',
          answer: 'Direct messages are private and can only be seen by the participants. Chatroom messages are visible to all chatroom members. For additional security, messages are encrypted during transmission and storage.'
        }
      ]
    }
  ];

  const handleFAQClick = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleCategoryClick = (id: string) => {
    setExpandedCategory(id);
    setExpandedFAQ(null); // Close any expanded FAQs when changing categories
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
    setContactModalOpen(false);
  };

  return (
    <div className="support-container">
      <div className="page-header">
        <h1 className="page-title">Help & Support</h1>
        <p className="page-subtitle">Find answers to common questions and get assistance with LearnLink</p>
      </div>

      <div className="support-content">
        <div className="category-sidebar">
          <h2>Categories</h2>
          {faqCategories.map(category => (
            <div 
              key={category.id}
              className={`category-item ${expandedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
              data-category={category.id}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-title">{category.title}</span>
            </div>
          ))}
        </div>

        <div className="faq-main-content">
          {faqCategories.map(category => (
            expandedCategory === category.id && (
              <div key={category.id} className="faq-category-section">
                <h2>{category.title}</h2>
                <div className="faq-list">
                  {category.items.map((item, index) => (
                    <div 
                      key={`${category.id}-${index}`} 
                      className="faq-item"
                    >
                      <div 
                        className="faq-question"
                        onClick={() => handleFAQClick(`${category.id}-${index}`)}
                      >
                        <span>{item.question}</span>
                        <span className={`faq-icon ${expandedFAQ === `${category.id}-${index}` ? 'rotated' : ''}`}>
                          <FaChevronDown />
                        </span>
                      </div>
                      {expandedFAQ === `${category.id}-${index}` && (
                        <div className="faq-answer">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="contact-button-container">
                  <button 
                    className="contact-button" 
                    onClick={() => setContactModalOpen(true)}
                  >
                    <FaEnvelope /> Still Have Questions?
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="support-modal-overlay" onClick={() => setContactModalOpen(false)}>
          <div className="support-contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <h2><FaEnvelope /> Contact Us</h2>
              <button className="support-close-button" onClick={() => setContactModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="support-modal-content">
              <div className="support-contact-info">
                <div className="support-contact-item">
                  <FaEnvelope />
                  <span>learnlink411@gmail.com</span>
                </div>
                <div className="support-contact-item">
                  <FaMobile />
                  <span>+90 544 350 90 60</span>
                </div>
                <div className="support-contact-item">
                  <FaPhone />
                  <span>0 232 433 33 83</span>
                </div>
              </div>
              
              <div className="support-form-container">
                <h3>Send Us a Message</h3>
                <form className="support-contact-form" onSubmit={handleSubmit}>
                  <div className="support-form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="support-form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Your email address"
                    />
                  </div>
                  
                  <div className="support-form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="What is your question about?"
                    />
                  </div>
                  
                  <div className="support-form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Describe your issue in detail"
                      rows={4}
                    />
                  </div>
                  
                  <button type="submit" className="support-submit-button">Send Message</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage; 