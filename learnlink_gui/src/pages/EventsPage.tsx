import React, { useState, useEffect, useContext } from 'react';
import Calendar from '../components/Calendar/Calendar';
import EventModal from '../components/Calendar/EventModal';
import eventService, { Event } from '../services/eventService';
import { NotificationContext } from '../contexts/NotificationContext';
import { format, isToday, startOfDay, isSameDay, parseISO } from 'date-fns';
import '../styles/pages/events.css';
import axios from 'axios';

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
  notified?: boolean;
}

const EventsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { showNotification } = useContext(NotificationContext);

  const createNotification = async (event: CalendarEvent) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const time = format(event.date, 'HH:mm');
      const content = `You have a ${event.type} today at ${time}: ${event.title}`;

      await axios.post('/api/notifications', {
        recipient_id: parseInt(userId),
        content: content,
        type: 'event',
        reference_id: event.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Created notification for event:', {
        eventId: event.id,
        title: event.title,
        time: time
      });

      showNotification(content, 'success');
    } catch (error) {
      console.error('Error creating notification:', error);
      if (axios.isAxiosError(error)) {
        console.error('Notification creation error details:', error.response?.data);
      }
    }
  };

  const checkTodayEvents = async (events: CalendarEvent[]) => {
    console.log('Checking today events...');
    console.log('Total events:', events.length);
    
    const today = startOfDay(new Date());
    const todayEvents = events.filter(event => {
      const eventDate = startOfDay(new Date(event.date));
      const isEventToday = isSameDay(eventDate, today);
      console.log('Event:', {
        title: event.title,
        date: format(event.date, 'yyyy-MM-dd HH:mm'),
        isToday: isEventToday,
        notified: event.notified
      });
      return isEventToday && !event.notified;
    });

    console.log('Today events:', todayEvents.length);

    if (todayEvents.length > 0) {
      for (const event of todayEvents) {
        const time = format(event.date, 'HH:mm');
        console.log('Creating notification for event:', {
          title: event.title,
          time: time,
          type: event.type
        });
        
        // Create notification in the backend
        await createNotification(event);
        
        // Show notification in the UI
        showNotification(
          `You have a ${event.type} today at ${time}: ${event.title}`,
          'success'
        );
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
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const fetchedEvents = await eventService.getAllEvents();
      console.log('Browser Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      
      const formattedEvents = fetchedEvents.map(event => {
        // Parse the UTC date and add 3 hours for Turkey timezone
        const utcDate = new Date(event.date);
        const localDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
        
        console.log('Event Processing:', {
          eventId: event.event_id,
          originalDate: event.date,
          utcDate,
          localDate,
          displayTime: format(localDate, 'HH:mm')
        });
        
        return {
          id: event.event_id,
          title: event.title,
          description: event.description,
          date: localDate,
          type: event.type,
          notified: false
        };
      });

      setEvents(formattedEvents);
      await checkTodayEvents(formattedEvents);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error loading events:', error.response?.data);
      }
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(date);
    setSelectedEvents(dayEvents);
    setIsModalOpen(true);
  };

  const handleAddEvent = async (newEvent: Omit<CalendarEvent, 'id'>) => {
    try {
      // Just send the date as is - browser will handle UTC conversion
      console.log('Creating event:', {
        date: newEvent.date,
        time: format(newEvent.date, 'HH:mm')
      });

      await eventService.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date.toISOString(),
        type: newEvent.type
      });
      await loadEvents();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleUpdateEvent = async (eventId: number, updatedEvent: Partial<CalendarEvent>) => {
    try {
      if (updatedEvent.date) {
        console.log('Updating event:', {
          date: updatedEvent.date,
          time: format(updatedEvent.date, 'HH:mm')
        });

        await eventService.updateEvent(eventId, {
          ...updatedEvent,
          date: updatedEvent.date.toISOString()
        });
      } else {
        const { date, ...eventWithoutDate } = updatedEvent;
        await eventService.updateEvent(eventId, eventWithoutDate);
      }
      await loadEvents();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await eventService.deleteEvent(eventId);
      await loadEvents();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Academic Calendar</h1>
        <p>View and manage your academic events, assignments, and deadlines</p>
      </div>
      <Calendar events={events} onDayClick={handleDayClick} />
      {isModalOpen && selectedDate && (
        <EventModal
          isOpen={isModalOpen}
          selectedDate={selectedDate}
          events={selectedEvents}
          onClose={() => setIsModalOpen(false)}
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default EventsPage; 