import React, { useState } from 'react';
import Calendar from '../components/Calendar/Calendar';
import EventModal from '../components/Calendar/EventModal';
import '../styles/pages/events.css';

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

const EventsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]); // Boş events array'i

  const handleDayClick = (date: Date, dayEvents: Event[]) => {
    setSelectedDate(date);
    setSelectedEvents(dayEvents);
    setIsModalOpen(true);
  };

  const handleAddEvent = (newEvent: Event) => {
    setEvents(prevEvents => [...prevEvents, { ...newEvent, id: Date.now() }]);
    setSelectedEvents(prevEvents => [...prevEvents, { ...newEvent, id: Date.now() }]);
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
        />
      )}
    </div>
  );
};

export default EventsPage; 