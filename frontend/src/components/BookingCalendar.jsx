import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfToday } from 'date-fns';

export default function BookingCalendar({ selectedDates, onDateSelect, unavailableDates = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const isDateUnavailable = (date) => {
    return unavailableDates.some(unavailableDate => 
      isSameDay(date, new Date(unavailableDate))
    );
  };

  const isDateSelected = (date) => {
    if (!selectedDates.start && !selectedDates.end) return false;
    if (selectedDates.start && isSameDay(date, selectedDates.start)) return true;
    if (selectedDates.end && isSameDay(date, selectedDates.end)) return true;
    if (selectedDates.start && selectedDates.end) {
      return date >= selectedDates.start && date <= selectedDates.end;
    }
    return false;
  };

  const handleDateClick = (date) => {
    if (isDateUnavailable(date) || date < startOfToday()) return;
    onDateSelect(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Select Dates
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(day => {
          const isUnavailable = isDateUnavailable(day);
          const isSelected = isDateSelected(day);
          const isPast = day < startOfToday();
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isUnavailable || isPast}
              className={`
                p-2 text-sm rounded-lg transition-all duration-200 relative
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : isCurrentDay
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${isUnavailable || isPast 
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                  : 'cursor-pointer'
                }
                ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
              `}
            >
              {format(day, 'd')}
              {isUnavailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-6 bg-red-500 transform rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>Unavailable</span>
          </div>
        </div>
        {selectedDates.start && selectedDates.end && (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {format(selectedDates.start, 'MMM d')} - {format(selectedDates.end, 'MMM d')}
          </div>
        )}
      </div>
    </div>
  );
}