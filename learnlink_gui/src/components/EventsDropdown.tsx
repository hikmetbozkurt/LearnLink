import React, { useState, useEffect, useRef } from 'react';
import { FaBullhorn } from 'react-icons/fa';
import { format, isToday, isPast, addHours } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import '../styles/components/EventsDropdown.css';

interface Event {
  event_id: number;
  title: string;
  description: string;
  date: string;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

interface EventsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onEventSelect?: (date: Date) => void;
}

const EventsDropdown: React.FC<EventsDropdownProps> = ({ isOpen, onToggle, onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && isOpen) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle, isOpen]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const fetchedEvents = await eventService.getAllEvents();
      
      // Sort events by date and filter out past events
      const sortedEvents = fetchedEvents
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatEventTime = (date: string) => {
    const eventDate = new Date(date);
    const adjustedDate = addHours(eventDate, 3);
    return format(adjustedDate, 'HH:mm');
  };

  const formatEventDate = (date: string) => {
    const eventDate = new Date(date);
    return format(eventDate, 'MMM d, yyyy');
  };

  const isEventToday = (date: string) => {
    return isToday(new Date(date));
  };

  const getEventStatus = (date: string) => {
    const eventDate = new Date(date);
    if (isToday(eventDate)) return 'Today';
    if (isPast(eventDate)) return 'Past';
    return '';
  };

  const handleEventClick = (event: Event) => {
    const eventDate = new Date(event.date);
    navigate('/events');
    if (onEventSelect) {
      onEventSelect(eventDate);
    }
    onToggle(); // Close the dropdown after selection
  };

  return (
    <div className="events-dropdown-container" ref={dropdownRef}>
      <button 
        className={`events-icon ${isOpen ? 'active' : ''}`} 
        onClick={onToggle}
      >
        <FaBullhorn />
      </button>

      {isOpen && (
        <div className="events-dropdown">
          <div className="events-header">
            <h3>Upcoming Events</h3>
          </div>
          <div className="events-list">
            {isLoading ? (
              <div className="events-loading">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="no-events">No upcoming events</div>
            ) : (
              events.map(event => (
                <div 
                  key={event.event_id}
                  className={`event-item ${isEventToday(event.date) ? 'today' : ''}`}
                  onClick={() => handleEventClick(event)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="event-type-indicator" data-type={event.type} />
                  <div className="event-content">
                    <p className="event-title">
                      {event.title}
                      {getEventStatus(event.date) && (
                        <span className={`event-status ${getEventStatus(event.date).toLowerCase()}`}>
                          {getEventStatus(event.date)}
                        </span>
                      )}
                    </p>
                    <div className="event-details">
                      <span className="event-time">{formatEventTime(event.date)}</span>
                      <span className="event-date">{formatEventDate(event.date)}</span>
                      <span className={`event-type ${event.type}`}>{event.type}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsDropdown; 