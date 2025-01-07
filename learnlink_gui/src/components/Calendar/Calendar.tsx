import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Calendar.css';

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: 'assignment' | 'exam' | 'meeting' | 'other';
}

interface CalendarProps {
  events: Event[];
  onDayClick: (date: Date, events: Event[]) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (date: Date): Event[] => {
    return events.filter(event => 
      format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getDayClass = (date: Date, dayEvents: Event[]) => {
    let classes = 'calendar-day';
    if (!isSameMonth(date, currentDate)) classes += ' disabled';
    if (dayEvents.length > 0) classes += ' has-events';
    return classes;
  };

  const renderDayEvents = (dayEvents: Event[]) => {
    const maxEventsToShow = 2;
    const visibleEvents = dayEvents.slice(0, maxEventsToShow);
    const remainingCount = dayEvents.length - maxEventsToShow;

    return (
      <div className="day-events">
        {visibleEvents.map((event, index) => (
          <div key={event.id} className="day-event" title={event.title}>
            {event.title}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="more-events">
            +{remainingCount} more...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth} className="month-nav">
          <FaChevronLeft />
        </button>
        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
        <button onClick={nextMonth} className="month-nav">
          <FaChevronRight />
        </button>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {daysInMonth.map((date, idx) => {
            const dayEvents = getEventsForDay(date);
            return (
              <div
                key={idx}
                className={getDayClass(date, dayEvents)}
                onClick={() => onDayClick(date, dayEvents)}
              >
                <span className="day-number">{format(date, 'd')}</span>
                {dayEvents.length > 0 && renderDayEvents(dayEvents)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar; 