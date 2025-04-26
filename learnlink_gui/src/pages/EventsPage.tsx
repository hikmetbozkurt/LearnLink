import React, { useState, useEffect, useContext, useRef } from 'react';
import Calendar from '../components/Calendar/Calendar';
import EventModal from '../components/Calendar/EventModal';
import eventService, { Event as ServiceEvent } from '../services/eventService';
import { NotificationContext } from '../contexts/NotificationContext';
import { useEvent } from '../contexts/EventContext';
import { format, isToday, startOfDay, isSameDay, parseISO, addMinutes } from 'date-fns';
import '../styles/pages/events.css';
import api from '../api/axiosConfig';
import { NotificationBellRef } from '../components/NotificationBell';

// Calendar expects this type of Event
interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

// Our working Event type that extends ServiceEvent with the notified property
interface Event extends Omit<CalendarEvent, 'id'> {
  id: number; // From event_id
  event_id: number;
  created_at: string;
  updated_at: string;
  notified: boolean;
}

const EventsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const { showNotification } = useContext(NotificationContext);
  const { selectedEventDate, setSelectedEventDate, shouldRefreshEvents, setShouldRefreshEvents } = useEvent();
  const notificationBellRef = useRef<NotificationBellRef>(null);

  const createNotification = async (event: Event) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const userString = localStorage.getItem('user');
      if (!userString) return;
      
      const user = JSON.parse(userString);
      const userId = user.user_id || user.id;
      
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const time = format(event.date, 'HH:mm');
      const content = `You have a ${event.type} today at ${time}: ${event.title}`;

      // Create notification in the backend
      await api.post('/api/notifications', {
        recipient_id: parseInt(userId.toString()),
        content: content,
        type: 'event',
        reference_id: event.id
      });

      // Add notification to the notification bell
      if (notificationBellRef.current) {
        notificationBellRef.current.addNotification({
          sender_id: 0, // System notification
          content: content,
          chatroom_id: 0 // No chatroom for event notifications
        });
      }

      console.log('Created notification for event:', {
        eventId: event.id,
        title: event.title,
        time: time
      });

      showNotification(content, 'success');
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const checkTodayEvents = async (eventsToCheck: Event[]) => {
    const today = startOfDay(new Date());
    const todayEvents = eventsToCheck.filter(event => 
      isToday(new Date(event.date)) && !event.notified
    );

    if (todayEvents.length > 0) {
      for (const event of todayEvents) {
        const time = format(event.date, 'HH:mm');
        console.log('Creating notification for event:', {
          title: event.title,
          time: time,
          type: event.type
        });
        
        await createNotification(event);
      }

      setEvents(prevEvents => 
        prevEvents.map(event => 
          isSameDay(startOfDay(event.date), today) 
            ? { ...event, notified: true } 
            : event
        )
      );
    }
  };

  const loadEvents = async () => {
    try {
      const fetchedEvents = await eventService.getAllEvents();
      console.log('Events loaded:', fetchedEvents.length);
      
      const formattedEvents = fetchedEvents.map(event => {
        // Parse the UTC date and add 3 hours for Turkey timezone
        const utcDate = new Date(event.date);
        const localDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
        
        return {
          id: event.event_id,
          event_id: event.event_id,
          title: event.title,
          description: event.description,
          date: localDate,
          type: event.type,
          created_at: event.created_at,
          updated_at: event.updated_at,
          notified: false
        };
      });

      setEvents(formattedEvents);
      await checkTodayEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Listen for event refresh requests
  useEffect(() => {
    if (shouldRefreshEvents) {
      loadEvents();
      setShouldRefreshEvents(false);
    }
  }, [shouldRefreshEvents, setShouldRefreshEvents]);

  useEffect(() => {
    if (selectedEventDate) {
      const dayEvents = events.filter(event => 
        isSameDay(new Date(event.date), selectedEventDate)
      );
      setSelectedDate(selectedEventDate);
      setSelectedEvents(dayEvents);
      setIsModalOpen(true);
      setSelectedEventDate(null); // Reset the selected date after opening the modal
    }
  }, [selectedEventDate, events]);

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    // Seçilen günün eventlerini bul
    const matchingEvents = events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
    
    setSelectedDate(date);
    setSelectedEvents(matchingEvents);
    setIsModalOpen(true);
  };

  // Convert our Events to CalendarEvents for the Calendar component
  const getCalendarEvents = (): CalendarEvent[] => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      type: event.type
    }));
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Academic Calendar</h1>
        <p>View and manage your academic events, assignments, and deadlines</p>
      </div>
      <Calendar 
        events={getCalendarEvents()} 
        onDayClick={handleDayClick}
      />
      {isModalOpen && selectedDate && (
        <EventModal
          isOpen={isModalOpen}
          selectedDate={selectedDate}
          events={selectedEvents}
          onClose={() => {
            setIsModalOpen(false);
            loadEvents(); // Refresh events when modal closes
          }}
        />
      )}
    </div>
  );
};

export default EventsPage; 