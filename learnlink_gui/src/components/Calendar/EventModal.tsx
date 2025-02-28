import React, { useState, useEffect } from 'react';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { FaTimes, FaCalendar, FaClock, FaInfoCircle, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './EventModal.css';

interface CalendarEvent {
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
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (eventId: number, event: Partial<CalendarEvent>) => void;
  onDeleteEvent: (eventId: number) => void;
}

interface FormData {
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
  time: string;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const initialFormData: FormData = {
    title: '',
    description: '',
    date: selectedDate,
    type: 'other',
    time: format(selectedDate, 'HH:mm')
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (editingEventId) {
      const eventToEdit = events.find(e => e.id === editingEventId);
      if (eventToEdit) {
        setFormData({
          title: eventToEdit.title,
          description: eventToEdit.description,
          date: eventToEdit.date,
          type: eventToEdit.type,
          time: format(eventToEdit.date, 'HH:mm')
        });
      }
    } else {
      setFormData({
        ...initialFormData,
        date: selectedDate,
        time: format(selectedDate, 'HH:mm')
      });
    }
  }, [editingEventId, events, selectedDate]);

  if (!isOpen) return null;

  const getEventTypeColor = (type: CalendarEvent['type']) => {
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
    const [hours, minutes] = formData.time.split(':').map(Number);
    
    // Create a new date object and set the time
    const eventDate = new Date(formData.date);
    eventDate.setHours(hours);
    eventDate.setMinutes(minutes);
    eventDate.setSeconds(0);
    eventDate.setMilliseconds(0);

    console.log('Submitting event:', {
      inputTime: formData.time,
      hours,
      minutes,
      eventDate,
      localTime: format(eventDate, 'HH:mm')
    });

    const eventData = {
      title: formData.title,
      description: formData.description,
      date: eventDate,
      type: formData.type
    };

    if (editingEventId) {
      onUpdateEvent(editingEventId, eventData);
    } else {
      onAddEvent(eventData);
    }
    setIsAddingEvent(false);
    setEditingEventId(null);
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setIsAddingEvent(true);
  };

  const handleDelete = (eventId: number) => {

      onDeleteEvent(eventId);
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
                      <div className="event-item-header">
                        <div 
                          className="event-type-indicator"
                          style={{ backgroundColor: getEventTypeColor(event.type) }}
                        />
                        <div className="event-title-section">
                          <h3>{event.title}</h3>
                          <div className="event-actions">
                            <button onClick={() => handleEdit(event)} className="edit-button">
                              <FaEdit /> Edit
                            </button>
                            <button onClick={() => handleDelete(event.id)} className="delete-button">
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="event-details">
                        <p className="event-description">{event.description}</p>
                        <div className="event-meta">
                          <span>
                            <FaCalendar /> {format(event.date, 'MMM d, yyyy')}
                          </span>
                          <span>
                            <FaClock /> {format(event.date, 'HH:mm')}
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
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
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
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Event Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
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
                  onClick={() => {
                    setIsAddingEvent(false);
                    setEditingEventId(null);
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editingEventId ? 'Update Event' : 'Add Event'}
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