import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getPublicBookings } from '../api';

// Public calendar to show approved bookings
const PublicCalendar = () => {
  const [events, setEvents] = useState([]);

  // Fetch approved bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getPublicBookings();
        const calendarEvents = response.data.map((booking) => ({
          title: booking.title,
          start: `${booking.date}T${booking.startTime}`,
          end: `${booking.date}T${booking.endTime}`,
        }));
        setEvents(calendarEvents);
      } catch (err) {
        console.error('Failed to load calendar events');
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="mt-5">
      <h3>Seminar Hall Public Calendar</h3>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev next today',
          center: 'title',
          right: 'dayGridMonth timeGridWeek timeGridDay',
        }}
        height="auto"
      />
    </div>
  );
};

export default PublicCalendar;