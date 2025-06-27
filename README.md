## Book My Hall

If you've ever tried to book a hall at a college or university, you know the pain. Paperwork, phone calls, waiting for approvals, and inevitably someone else books your time slot while you're still filling out forms. We built Book My Hall to fix this mess.

## What This Does

Book My Hall lets faculty and club leaders book halls online instead of dealing with paper forms. Administrators get a clean dashboard to approve or reject requests, and everyone can see what's already booked on a public calendar. No more double bookings, no more confusion.

## Features

- **User Authentication**: Secure login/signup system with role-based access control
- **Pre-approved Users**: Only authorised faculty and club leaders can make bookings
- **Smart Conflict Detection**: Automatic checking with a 60-minute buffer between bookings
- **Admin Dashboard**: Streamlined approval/rejection workflow for administrators
- **Public Calendar**: Real-time view of approved bookings using FullCalendar
- **Responsive Design**: Mobile-friendly interface using Bootstrap

## Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with connection pooling
- **API Routes**: RESTful endpoints for auth, bookings, and admin operations
- **Middleware**: Role-based access control and request validation

### Frontend (React)
- **State Management**: React hooks for local state management
- **Routing**: React Router for navigation and protected routes
- **Calendar**: FullCalendar integration for booking visualization
- **UI**: Bootstrap for responsive design

## User Roles

### Faculty/Club Leaders
- Submit booking requests
- View their booking history
- Accept terms and conditions

### Administrators
- Review pending bookings
- Approve or reject requests with comments
- Access admin dashboard

### Public Users
- View approved bookings on public calendar
- No booking capabilities


## 📅 Booking Rules

- **Buffer Time**: 60-minute buffer between bookings to prevent conflicts
- **Approval Required**: All bookings require admin approval
- **Terms Acceptance**: Users must accept terms and conditions
- **Conflict Detection**: System automatically prevents overlapping bookings

## Collaborators

- [Arathi Krishna AM](https://github.com/arathikrishnaam)
- [S Sreelakshmi](https://github.com/ssreelakshmi04)
- [Shahana K V](https://github.com/ShahanaKV)

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

**Note**: Book My Hall is designed specifically for LBSITW, Trivandrum to reduce manual workload in hall management. For support or questions, please create an issue in the repository.
