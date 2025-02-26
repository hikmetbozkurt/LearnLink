import React, { useState } from 'react';
import { format, parse, setHours, setMinutes } from 'date-fns';
import { FaTimes, FaCalendar, FaClock, FaInfoCircle, FaPlus } from 'react-icons/fa';
import './EventModal.css';

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  events: Event[];
  onAddEvent: (event: Event) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events,
  onAddEvent
}) => {
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({
    title: '',
    description: '',
    date: selectedDate,
    type: 'other'
  });
  const [eventTime, setEventTime] = useState('12:00');

  if (!isOpen) return null;

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'assignment':
        return '#4CAF50';
      case 'exam':
        return '#f44336';
      case 'meeting':
        return '#2196F3';
      default:
        return '#9C27B0';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDate = setMinutes(setHours(selectedDate, hours), minutes);
    
    onAddEvent({ ...newEvent, id: 0, date: eventDate });
    setIsAddingEvent(false);
    setNewEvent({
      title: '',
      description: '',
      date: selectedDate,
      type: 'other'
    });
    setEventTime('12:00');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'time') {
      setEventTime(value);
    } else {
      setNewEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()}>
        <div className="event-modal-header">
          <div>
            <h2>{format(selectedDate, 'MMMM d, yyyy')}</h2>
            <p>{format(selectedDate, 'EEEE')}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="event-modal-content">
          {!isAddingEvent ? (
            <>
              <button className="add-event-button" onClick={() => setIsAddingEvent(true)}>
                <FaPlus /> Add Event
              </button>
              
              {events.length > 0 ? (
                <div className="events-list">
                  {events.map(event => (
                    <div key={event.id} className="event-item">
                      <div 
                        className="event-type-indicator"
                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                      />
                      <div className="event-details">
                        <h3>{event.title}</h3>
                        <p className="event-description">{event.description}</p>
                        <div className="event-meta">
                          <span>
                            <FaCalendar /> {format(new Date(event.date), 'MMM d, yyyy')}
                          </span>
                          <span>
                            <FaClock /> {format(new Date(event.date), 'h:mm a')}
                          </span>
                          <span className="event-type">
                            <FaInfoCircle /> {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-events">
                  <p>No events scheduled for this day</p>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="add-event-form">
              <div className="form-group">
                <label htmlFor="title">Event Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={eventTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Event Type</label>
                <select
                  id="type"
                  name="type"
                  value={newEvent.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsAddingEvent(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Event
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal; 