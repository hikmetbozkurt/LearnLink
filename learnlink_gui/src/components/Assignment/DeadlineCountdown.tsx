import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import './DeadlineCountdown.css';

interface DeadlineCountdownProps {
  dueDate: Date;
}

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ dueDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const days = differenceInDays(dueDate, now);
      const hours = differenceInHours(dueDate, now) % 24;
      const minutes = differenceInMinutes(dueDate, now) % 60;
      
      // Set urgent flag if less than 24 hours remaining
      setIsUrgent(differenceInHours(dueDate, now) < 24);
      
      if (days > 0) {
        return `${days}d ${hours}h remaining`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
      } else if (minutes > 0) {
        return `${minutes}m remaining`;
      } else {
        return 'Due now';
      }
    };
    
    // Update time left immediately
    setTimeLeft(calculateTimeLeft());
    
    // Update every minute
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [dueDate]);
  
  return (
    <div className={`deadline-countdown ${isUrgent ? 'urgent' : ''}`}>
      {timeLeft}
    </div>
  );
};

export default DeadlineCountdown; 