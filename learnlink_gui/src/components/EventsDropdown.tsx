import React, { useState, useEffect, useRef } from 'react';
import { FaBullhorn, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
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
  refreshEvents?: () => void;
}

const EventsDropdown: React.FC<EventsDropdownProps> = ({ isOpen, onToggle, onEventSelect, refreshEvents }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Reset confirmation dialog when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmation(false);
    }
  }, [isOpen]);

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
      
      // Sort events by date: upcoming events first, then past events
      const sortedEvents = fetchedEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const isPastA = isPast(dateA);
        const isPastB = isPast(dateB);
        
        // If one is past and one is upcoming, prioritize upcoming
        if (isPastA && !isPastB) return 1;
        if (!isPastA && isPastB) return -1;
        
        // Otherwise, sort by date (earliest first for upcoming, latest first for past)
        return isPastA 
          ? dateB.getTime() - dateA.getTime() // For past events, show most recent first
          : dateA.getTime() - dateB.getTime(); // For upcoming events, show earliest first
      });
      
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

  const handleClearPastEvents = () => {
    setShowConfirmation(true);
  };

  const confirmClearPastEvents = async () => {
    try {
      // Call the API to clear past events
      const result = await eventService.clearPastEvents();
      
      // Update the UI
      const upcomingEvents = events.filter(event => !isPast(new Date(event.date)));
      setEvents(upcomingEvents);
      setShowConfirmation(false);
      
      // Refresh the events on the events page
      if (refreshEvents) {
        refreshEvents();
      }
      
      // Show how many events were deleted
      console.log(`${result.count} past events deleted successfully`);
    } catch (error) {
      console.error('Error clearing past events:', error);
      setShowConfirmation(false);
    }
  };

  const cancelClearPastEvents = () => {
    setShowConfirmation(false);
  };

  // Count past events
  const pastEventsCount = events.filter(event => isPast(new Date(event.date))).length;

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
            {pastEventsCount > 0 && (
              <button 
                className="clear-past-events"
                onClick={handleClearPastEvents}
                title="Clear past events"
              >
                <FaTrash />
                <span>Clear Past</span>
              </button>
            )}
          </div>
          
          {showConfirmation && (
            <div className="confirmation-dialog">
              <p>Are you sure you want to clear all past events?</p>
              <div className="confirmation-actions">
                <button className="confirm-button" onClick={confirmClearPastEvents}>
                  <FaCheck /> Yes
                </button>
                <button className="cancel-button" onClick={cancelClearPastEvents}>
                  <FaTimes /> No
                </button>
              </div>
            </div>
          )}
          
          <div className="events-list">
            {isLoading ? (
              <div className="events-loading">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="no-events">No events</div>
            ) : (
              events.map(event => (
                <div 
                  key={event.event_id}
                  className={`event-item ${isEventToday(event.date) ? 'today' : ''} ${isPast(new Date(event.date)) ? 'past' : 'upcoming'}`}
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