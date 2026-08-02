# Feedback Application

A full-stack web application for collecting and managing anonymous feedback during courses and training sessions.

---

# 🇩🇪 Projektbeschreibung

Die Feedback Application wurde im Rahmen eines Praktikums entwickelt und ermöglicht die digitale Erfassung, Verwaltung und Auswertung von anonymem Teilnehmerfeedback.

Das System besteht aus drei Benutzerrollen:

### Administrator

- Trainer verwalten
- Trainer bearbeiten
- Trainer aktivieren oder deaktivieren
- Trainer löschen
- Passwörter zurücksetzen

### Trainer

- Registrierung und Login
- Module erstellen und verwalten
- Feedback-Sitzungen erstellen
- QR-Code für Teilnehmer anzeigen
- Sitzungen starten und beenden
- Live-Ergebnisse anzeigen
- Feedback exportieren

### Teilnehmer

- Teilnahme per Sitzungscode oder QR-Code
- Anonymes Feedback
- Deutsche und englische Oberfläche

---

# 🇬🇧 Project Description

The Feedback Application is a full-stack web application developed as part of a university practical project.

It allows trainers to collect anonymous participant feedback in real time while administrators manage trainer accounts.

The system provides three different user roles:

- Administrator
- Trainer
- Participant

---

# Features

## Administrator

- Secure login
- Manage trainer accounts
- Edit trainer information
- Activate or deactivate trainers
- Reset trainer passwords
- Delete trainer accounts

## Trainer

- Register an account
- Secure login
- Create and manage modules
- Create feedback sessions
- Generate QR codes
- Start and close sessions
- View live feedback
- Export results

## Participant

- Join via session code
- Join via QR code
- Anonymous feedback
- Responsive interface
- German and English language support

---

# Technologies

## Frontend

- React
- React Router
- Axios
- CSS3

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt

---

# Project Structure

```
feedback-app
│
├── client
│   ├── components
│   ├── pages
│   ├── services
│   ├── translations
│   └── assets
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── scripts
│   └── utils
│
├── README.md
├── package.json
└── package-lock.json
```

---

# Installation

## Clone the repository

```bash
git clone <repository-url>
```

---

## Install dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd client
npm install
```

---

# Environment Variables

Create a `.env` file inside the **server** folder.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

---

# Create Administrator

Run:

```bash
npm run create-admin
```

The administrator account will be created using the values stored in the `.env` file.

---

# Start the Application

## Backend

```bash
cd server
npm run dev
```

## Frontend

```bash
cd client
npm run dev
```

---

# Default URLs

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:5000
```

---

# Security

The application implements:

- JWT Authentication
- Password hashing using bcrypt
- Role-based authorization
- Protected API routes
- Input validation
- Secure password storage

---

# Responsive Design

The application is fully responsive and optimized for:

- Desktop
- Tablet
- Mobile devices

---

# Localization

Supported languages:

- 🇩🇪 German
- 🇬🇧 English

Users can switch languages directly within the application.

---

# Future Improvements

Possible future enhancements include:

- Email-based password reset
- User profile management
- Dashboard statistics
- Additional feedback analytics
- Dark mode
- Notification system

---

# Author

**N_kh**

University Practical Project

2026

---

# License

This project was developed for educational purposes as part of a university practical project.