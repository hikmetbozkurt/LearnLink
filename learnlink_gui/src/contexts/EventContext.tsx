import React, { createContext, useContext, useState, useCallback } from 'react';

interface EventContextType {
  selectedEventDate: Date | null;
  setSelectedEventDate: (date: Date | null) => void;
  refreshEvents: () => void;
  shouldRefreshEvents: boolean;
  setShouldRefreshEvents: (value: boolean) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);
  const [shouldRefreshEvents, setShouldRefreshEvents] = useState<boolean>(false);

  const refreshEvents = useCallback(() => {
    setShouldRefreshEvents(true);
  }, []);

  return (
    <EventContext.Provider value={{ 
      selectedEventDate, 
      setSelectedEventDate,
      refreshEvents,
      shouldRefreshEvents,
      setShouldRefreshEvents
    }}>
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