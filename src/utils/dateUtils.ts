
import { format, parseISO, isAfter, isBefore, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format a date string to local format
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "No definida";
  try {
    return format(parseISO(dateString), "dd MMM yyyy", { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Fecha inválida";
  }
};

/**
 * Calculate days remaining from today to target date
 */
export const daysRemaining = (targetDateString: string | null | undefined): number | null => {
  if (!targetDateString) return null;
  
  try {
    const targetDate = parseISO(targetDateString);
    const today = new Date();
    
    // Set time to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    
    return differenceInDays(targetDate, today);
  } catch (error) {
    console.error("Error calculating days remaining:", error);
    return null;
  }
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return isBefore(date, today);
  } catch (error) {
    console.error("Error checking past date:", error);
    return false;
  }
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return isAfter(date, today);
  } catch (error) {
    console.error("Error checking future date:", error);
    return false;
  }
};

/**
 * Format date range as string
 */
export const formatDateRange = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = startDate ? formatDate(startDate) : "No definida";
  const end = endDate ? formatDate(endDate) : "No definida";
  
  return `${start} - ${end}`;
};

/**
 * Calculate if a task is delayed based on due date and percentage complete
 */
export const isTaskDelayed = (dueDate: string | null | undefined, percentDone: number): boolean => {
  if (!dueDate) return false;
  if (percentDone === 100) return false;
  
  return isPastDate(dueDate);
};

/**
 * Format date for API requests (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export default {
  formatDate,
  daysRemaining,
  isPastDate,
  isFutureDate,
  formatDateRange,
  isTaskDelayed,
  formatDateForApi
};
