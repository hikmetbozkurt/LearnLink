import React, { createContext, useContext, useState } from 'react';

interface EventContextType {
  selectedEventDate: Date | null;
  setSelectedEventDate: (date: Date | null) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);

  return (
    <EventContext.Provider value={{ selectedEventDate, setSelectedEventDate }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}; 