import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getPublicBookings } from '../api';

// Public calendar to show approved bookings
const PublicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  // Fetch approved bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getPublicBookings();
        console.log('API Response:', response.data); // Debug: Log raw response
        const calendarEvents = response.data.map((booking) => {
          console.log('Processing booking:', booking); // Debug: Log each booking
          return {
            title: booking.title,
            start: `${booking.date}T${booking.startTime}`,
            end: `${booking.date}T${booking.endTime}`,
          };
        });
        setEvents(calendarEvents);
      } catch (err) {
        console.error('Failed to load calendar events:', err);
        setError('Failed to load calendar data. Please try again later.');
      }
    };
    fetchBookings();
  }, []);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="mt-5">
      <h3>Seminar Hall Public Calendar</h3>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next,today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        height="auto"
      />
    </div>
  );
};

export default PublicCalendar;

// import React from 'react';

// const PublicCalendar = () => {
//   return <h1>Public Calendar Test</h1>;
// };

// export default PublicCalendar;