-- latest.sql
-- Purpose: Defines the database schema and seed data for the Seminar Hall Booking System
-- Usage: Run with `psql -d seminar_booking -f latest.sql`

-- Drop existing tables (optional: uncomment if a fresh reset is needed)
-- DROP TABLE IF EXISTS bookings;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS preapproved_users;

-- ============================
-- Table: Preapproved Users
-- ============================
CREATE TABLE IF NOT EXISTS preapproved_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('club_leader', 'faculty', 'admin'))
);

-- ============================
-- Table: Users
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Store hashed password
    role VARCHAR(20) NOT NULL CHECK (role IN ('club_leader', 'faculty', 'admin'))
);

-- ============================
-- Table: Bookings
-- ============================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_comments TEXT,
    terms_accepted BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Seed Data
-- ============================

-- Pre-approved Users
INSERT INTO preapproved_users (name, email, role) VALUES
    ('Alice Smith', 'alice@university.edu', 'club_leader'),
    ('Bob Johnson', 'bob@university.edu', 'faculty'),
    ('Admin User', 'admin@university.edu', 'admin');

-- Admin User in Users table (hashed password: 'password123')
INSERT INTO users (name, email, password, role) VALUES
    ('Admin User', 'admin@university.edu', '$2a$10$5z1Qz8f9k2Q5z6y7x8z9A.3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q', 'admin');