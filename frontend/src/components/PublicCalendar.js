import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // required for click
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useEffect, useState } from 'react';
import { getPublicBookings } from '../api'; // Assuming your API call is correctly imported

const PublicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getPublicBookings();
        console.log('API Raw Response Data:', response.data); // Debug: Log the raw data from API

        const calendarEvents = response.data.map((booking) => {
          // IMPORTANT: Extract just the date part (YYYY-MM-DD) from the 'date' field
          // Example: "2025-07-04T18:30:00.000Z" becomes "2025-07-04"
          const eventDate = booking.date.split('T')[0];

          // Ensure your backend uses 'start_time' and 'end_time' (snake_case)
          // If your API layer transforms them to camelCase (startTime, endTime), adjust accordingly.
          return {
            title: booking.title,
            start: `${eventDate}T${booking.start_time}`, // Combine YYYY-MM-DD with HH:MM:SS
            end: `${eventDate}T${booking.end_time}`,     // Combine YYYY-MM-DD with HH:MM:SS
            description: booking.description || '',       // Optional: Add description
            // You can add more FullCalendar event properties here if needed, e.g., id, color, etc.
          };
        });

        console.log('Processed Calendar Events:', calendarEvents); // Debug: Log the formatted events
        setEvents(calendarEvents);
      } catch (err) {
        console.error('Failed to load calendar events:', err);
        setError('Failed to load calendar data. Please try again later.');
      }
    };
    fetchBookings();
  }, []); // Empty dependency array means this runs once on component mount

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="mt-5">
      <h3>Seminar Hall Public Calendar</h3>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        // Optional: Event click handler to show details in an alert
        eventClick={(info) => {
          // You might want a more sophisticated modal/popover for event details
          let details = `Title: ${info.event.title}\n`;
          details += `Start: ${info.event.start ? info.event.start.toLocaleString() : 'N/A'}\n`;
          details += `End: ${info.event.end ? info.event.end.toLocaleString() : 'N/A'}\n`;
          if (info.event.extendedProps.description) {
            details += `Description: ${info.event.extendedProps.description}\n`;
          }
          alert(details);
        }}
        headerToolbar={{
          left: 'prev,next,today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        height="auto" // Adjust height as needed, 'auto' makes it fit content
      />
    </div>
  );
};

export default PublicCalendar;
