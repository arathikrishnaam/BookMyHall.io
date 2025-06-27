# Book My Hall

A comprehensive web application designed to streamline hall bookings for educational institutions, eliminating manual paperwork and reducing administrative overhead.

## Purpose

This system digitizes the hall booking process, allowing faculty and club leaders to request bookings online while providing administrators with an efficient approval workflow. The public calendar ensures transparency and prevents scheduling conflicts.

## Features

- **User Authentication**: Secure login/signup system with role-based access control
- **Pre-approved Users**: Only authorized faculty and club leaders can make bookings
- **Smart Conflict Detection**: Automatic checking with 60-minute buffer between bookings
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
