import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaTimes, FaCalendar, FaClock, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';
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
  const { setShouldRefreshEvents } = useEvent();
  // Eğer olay yoksa direkt ekleme formunu göster
  const [isAddingEvent, setIsAddingEvent] = useState(events.length === 0);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    time: '12:00',
    type: 'assignment'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  useEffect(() => {
    // Modal açıldığında form verilerini sıfırla
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        time: '12:00',
        type: 'assignment'
      });
      
      // Eğer olay yoksa direkt form göster
      if (events.length === 0) {
        setIsAddingEvent(true);
      }
    }
  }, [isOpen, events.length]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Tarih ve saat birleştir
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = formData.time.split(':');
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateTime.toISOString(),
        type: formData.type
      };

      console.log('Creating event with data:', eventData);

      if (editingEventId) {
        await eventService.updateEvent(editingEventId, eventData);
      } else {
        await eventService.createEvent(eventData);
      }

      // Form ve modal durumlarını sıfırla
      setFormData({
        title: '',
        description: '',
        time: '12:00',
        type: 'assignment'
      });
      setIsAddingEvent(false);
      setEditingEventId(null);
      setShouldRefreshEvents(true);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      setDeletingEventId(eventId);
      await eventService.deleteEvent(eventId);
      setShouldRefreshEvents(true);
      // Event silindikten sonra kısa bir süre bekleyip modalı kapatalım
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeletingEventId(null);
    }
  };

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
          {!isAddingEvent ? (
            <>
              <button 
                className="add-event-button" 
                onClick={() => setIsAddingEvent(true)}
              >
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
                            <FaClock /> {format(new Date(event.date), 'HH:mm')}
                          </span>
                          <span className="event-type">
                            <FaInfoCircle /> {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                        </div>
                        <div className="event-actions">
                          <button 
                            className="delete-event-button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            disabled={deletingEventId === event.id}
                          >
                            <FaTrash /> {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                          </button>
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
            <form onSubmit={handleSubmit} className="add-event-form event-modal-form">
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
              
              <div className="form-actions button-group">
                <button
                  type="button"
                  onClick={() => {
                    // Eğer etkinlik varsa listeye dön, yoksa modalı kapat
                    if (events.length > 0) {
                      setIsAddingEvent(false);
                    } else {
                      onClose();
                    }
                  }}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  {events.length > 0 ? 'Back to Events' : 'Cancel'}
                </button>
                
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (editingEventId ? 'Update Event' : 'Add Event')}
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