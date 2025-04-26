import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaTimes, FaCalendar, FaClock, FaInfoCircle, FaPlus } from 'react-icons/fa';
import './EventModal.css';
import eventService from '../../services/eventService';
import { useEvent } from '../../contexts/EventContext';

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

interface FormData {
  title: string;
  description: string;
  time: string;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  events: Event[];
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events
}) => {
  console.log("EventModal rendered with", { 
    isOpen, 
    selectedDate: selectedDate?.toString(), 
    eventCount: events?.length,
    eventsList: events
  });

  const { setShouldRefreshEvents } = useEvent();
  const [showForm, setShowForm] = useState(false); 
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    time: '12:00',
    type: 'assignment'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = formData.time.split(':');
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateTime.toISOString(),
        type: formData.type
      };

      await eventService.createEvent(eventData);
      console.log('Event created successfully');
      
      setShouldRefreshEvents(true);
      setShowForm(false);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'assignment': '#4CAF50',
      'exam': '#f44336',
      'meeting': '#2196F3',
      'other': '#9C27B0'
    };
    return colors[type] || colors.other;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()}>
        <div className="event-modal-header">
          <div>
            <h2>{format(selectedDate, 'MMMM d, yyyy')}</h2>
            <p>{format(selectedDate, 'EEEE')}</p>
            <p>Event count: {events.length}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="event-modal-content">
          {showForm ? (
            <form onSubmit={handleSubmit} className="add-event-form">
              <h3>Add New Event</h3>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input 
                  type="time" 
                  id="time" 
                  name="time" 
                  value={formData.time} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select 
                  id="type" 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h3>Events for {format(selectedDate, 'MMMM d, yyyy')}</h3>
              
              {events.length === 0 ? (
                <p className="no-events-message">No events scheduled for this day.</p>
              ) : (
                <div className="events-list">
                  {events.map(event => (
                    <div key={event.id} className="event-item">
                      <div 
                        className="event-type-indicator"
                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                      />
                      <div className="event-details">
                        <h4>{event.title}</h4>
                        <p>{event.description}</p>
                        <p className="event-time">
                          <FaClock /> {format(new Date(event.date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="add-event-button-container">
                <button 
                  className="add-event-button"
                  onClick={() => setShowForm(true)}
                >
                  <FaPlus /> Add Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal; 