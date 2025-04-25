import React, { useState, useEffect } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isPast,
  isValid,
  formatDistanceToNow,
} from "date-fns";
import "./DeadlineCountdown.css";

interface DeadlineCountdownProps {
  dueDate: Date;
}

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ dueDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  useEffect(() => {
    // Validate date
    if (!dueDate || !isValid(dueDate)) {
      console.error("Invalid due date provided to DeadlineCountdown:", dueDate);
      setTimeLeft("Due date unknown");
      return;
    }

    // If date is already past, don't show countdown
    if (isPast(dueDate)) {
      setTimeLeft("Past due");
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const days = differenceInDays(dueDate, now);
      const hours = differenceInHours(dueDate, now) % 24;
      const minutes = differenceInMinutes(dueDate, now) % 60;

      // Set urgent flag if less than 24 hours remaining
      setIsUrgent(differenceInHours(dueDate, now) < 24);

      // For very close deadlines (less than 1 hour), use formatDistanceToNow for better precision
      if (days === 0 && hours === 0) {
        return `${formatDistanceToNow(dueDate, {
          addSuffix: false,
        })} remaining`;
      } else if (days > 0) {
        return `${days}d ${hours}h remaining`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
      } else if (minutes > 0) {
        return `${minutes}m remaining`;
      } else {
        return "Due now";
      }
    };

    // Update time left immediately
    setTimeLeft(calculateTimeLeft());

    // Update every minute
    const interval = setInterval(() => {
      // If date becomes past during the interval, update accordingly
      if (isPast(dueDate)) {
        setTimeLeft("Past due");
        clearInterval(interval);
        return;
      }

      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(interval);
  }, [dueDate]);

  return (
    <div className={`deadline-countdown ${isUrgent ? "urgent" : ""}`}>
      {timeLeft}
    </div>
  );
};

export default DeadlineCountdown;
