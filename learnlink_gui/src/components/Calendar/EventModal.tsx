import React from 'react';
import { format } from 'date-fns';
import { FaTimes, FaCalendar, FaClock, FaInfoCircle } from 'react-icons/fa';
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
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events
}) => {
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
        </div>
      </div>
    </div>
  );
};

export default EventModal; 