import { isPast, parseISO } from "date-fns";

/**
 * Checks if a date string represents a date that has already passed
 * @param dateString ISO date string to check
 * @returns true if the date is in the past, false otherwise
 */
export const isPastDue = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    return isPast(date);
  } catch (error) {
    console.error("Error parsing date in isPastDue:", error);
    return false;
  }
}; 