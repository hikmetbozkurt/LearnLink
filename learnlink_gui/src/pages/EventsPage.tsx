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

  // Dummy events data
  const events: Event[] = [
    {
      id: 1,
      title: 'Mathematics Exam',
      description: 'Final exam for Calculus II',
      date: new Date(2024, 1, 15),
      type: 'exam'
    },
    {
      id: 2,
      title: 'Physics Assignment Due',
      description: 'Submit Chapter 5 homework',
      date: new Date(2024, 1, 15),
      type: 'assignment'
    },
    {
      id: 3,
      title: 'Study Group Meeting',
      description: 'Chemistry study group',
      date: new Date(2024, 1, 20),
      type: 'meeting'
    }
  ];

  const handleDayClick = (date: Date, dayEvents: Event[]) => {
    setSelectedDate(date);
    setSelectedEvents(dayEvents);
    setIsModalOpen(true);
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
        />
      )}
    </div>
  );
};

export default EventsPage; 