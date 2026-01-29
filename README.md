# TrioLogic Medical EHR System

![TrioLogic Logo](./images/image.png)

**TrioLogic** is a comprehensive Electronic Health Records (EHR) system designed to streamline clinical workflows, simplify patient documentation, and enhance healthcare delivery. The system provides healthcare professionals with a modern, secure platform to manage patient records, appointments, prescriptions, and medical data efficiently.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Security Features](#security-features)
- [File Structure](#file-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)
- [Academic Context](#academic-context)

---

## 🎯 Overview

TrioLogic is a web-based Electronic Health Records system that enables healthcare providers to:

- **Manage Patient Records**: Comprehensive patient information management including demographics, medical history, allergies, and medications
- **Track Appointments**: Schedule and manage patient appointments with calendar integration
- **Document Medical Records**: Record vital signs, clinical notes, prescriptions, and diagnostic scans
- **Generate Reports**: Analytics and reporting capabilities for patient data insights
- **Secure Authentication**: Multi-step authentication with email verification and password recovery

The system follows modern health informatics standards and best practices for data security, privacy, and interoperability.

---

## ✨ Features

### 1. **User Authentication & Account Management**
- Secure user registration and login for healthcare providers
- Email verification system using SendGrid
- Password reset functionality with token-based security
- Session management with secure cookies

### 2. **Patient Management**
- Multi-step patient registration form (4-step process)
  - Step 1: Personal Information (demographics, contact details)
  - Step 2: Medical History (conditions, allergies, medications, surgeries)
  - Step 3: Emergency Contact Information
  - Step 4: Reason for Visit
- Patient search and filtering
- Comprehensive patient profiles
- Patient record editing and updates
- Patient deletion with cascade operations

### 3. **Medical Records Management**
- **Vital Signs**: Track blood pressure, heart rate, temperature, oxygen saturation, respiratory rate, weight, height, and BMI
- **Prescriptions**: Manage medications with dosage, frequency, duration, and status tracking
- **Clinical Notes**: Document patient encounters, diagnoses, and treatment plans
- **Diagnostic Scans**: Upload and manage medical imaging (X-rays, MRI, CT scans, ultrasounds)
- **Medical History**: Track chronic conditions, allergies, current medications, and surgical history

### 4. **Appointment Scheduling**
- Interactive calendar interface using Flatpickr
- Create, view, and manage appointments
- Appointment status tracking (scheduled, completed, cancelled)
- Patient-specific appointment history

### 5. **Task Management**
- Create and manage clinical tasks
- Task prioritization (low, medium, high)
- Due date tracking
- Task status management (pending, in-progress, completed)

### 6. **Reports & Analytics**
- Patient statistics and demographics
- Clinical data visualization
- Custom date range filtering
- Export capabilities

### 7. **User Interface Features**
- Responsive design for desktop and mobile devices
- Dark mode / Light mode theme toggle
- Global search functionality (Ctrl+K / Cmd+K)
- Intuitive navigation with sidebar menu
- Modern, clean UI with Inter font family

### 8. **Settings & Preferences**
- Profile management
- Password updates
- User preferences configuration
- Theme customization

---

## 🛠 Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Custom styling with CSS variables for theming
- **JavaScript (ES6+)**: Vanilla JavaScript for interactivity
- **Flatpickr**: Date and time picker library
- **Bootstrap 5**: Grid system and components (used in reports section)
- **SVG**: Custom icons and branding

### Backend
- **PHP 7.4+**: Server-side scripting
- **MySQL 5.7+/MariaDB**: Relational database management
- **PDO**: PHP Data Objects for secure database access
- **SendGrid API**: Email delivery service for verification and notifications

### Development Tools
- **Git**: Version control
- **VS Code**: Recommended IDE
- **XAMPP/WAMP/MAMP**: Local development environment

---

## 🏗 System Architecture

The application follows a **three-tier architecture**:

```
┌─────────────────────────────────────┐
│     Presentation Layer (Client)     │
│  HTML, CSS, JavaScript              │
│  - User Interface                   │
│  - Client-side validation           │
│  - Theme management                 │
└──────────────┬──────────────────────┘
               │
               │ HTTP/AJAX Requests
               ▼
┌─────────────────────────────────────┐
│    Application Layer (Server)       │
│  PHP                                │
│  - Business logic                   │
│  - Authentication & Authorization   │
│  - Data validation                  │
│  - API endpoints                    │
└──────────────┬──────────────────────┘
               │
               │ PDO/SQL Queries
               ▼
┌─────────────────────────────────────┐
│      Data Layer (Database)          │
│  MySQL/MariaDB                      │
│  - Relational data storage          │
│  - Data integrity constraints       │
│  - Foreign key relationships        │
└─────────────────────────────────────┘
```

## 🔒 Security Features

### Authentication & Authorization
- **Password Hashing**: Bcrypt with salt (via `password_hash()`)
- **Session Management**: Secure session cookies with HttpOnly flag
- **Email Verification**: Two-factor authentication during registration
- **Password Reset**: Secure token-based password recovery
- **CSRF Protection**: Token validation on sensitive operations

### Data Security
- **SQL Injection Prevention**: Parameterized queries using PDO
- **XSS Prevention**: HTML escaping for all user inputs
- **Input Validation**: Server-side and client-side validation
- **Data Encryption**: HTTPS recommended for production
- **Access Control**: Role-based access with doctor-patient relationship verification

### Database Security
- **Foreign Key Constraints**: Referential integrity enforcement
- **Cascade Deletes**: Automatic cleanup of related records
- **Unique Constraints**: Prevent duplicate entries
- **Prepared Statements**: All queries use prepared statements

### HIPAA Compliance Considerations
While this is an educational project, it implements several HIPAA-aligned practices:
- Audit logging capabilities
- Access controls
- Data encryption readiness
- Secure authentication

**Note**: For production use in healthcare settings, additional HIPAA compliance measures would be required.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PSR-12 coding standards for PHP
- Use meaningful variable and function names
- Comment complex logic
- Test all changes thoroughly
- Ensure backwards compatibility

---

## 📝 License

This project is licensed for educational purposes. Please contact the authors for commercial use permissions.

---

## 🎓 Academic Context

This project was developed as part of the **Information Systems in Healthcare** course in the **Health Informatics** program at **Deggendorf Institute of Technology (DIT)**, Germany.

### Project Information

- **Course**: Information Systems in Healthcare
- **Program**: Health Informatics (Bsc)
- **Institution**: Deggendorf Institute of Technology (Technische Hochschule Deggendorf)
- **Academic Year**: 2025
- **Project Type**: Group Project

### Learning Objectives

This project was designed to demonstrate understanding of:

1. **Health Informatics Principles**
   - Electronic Health Records (EHR) system design
   - Healthcare data standards and interoperability
   - Clinical workflow integration
   - Patient data management

2. **Information Systems Development**
   - Full-stack web application development
   - Database design and normalization
   - RESTful API architecture
   - User interface/experience design

3. **Healthcare IT Security**
   - Authentication and authorization
   - Data privacy and protection
   - HIPAA compliance considerations
   - Secure coding practices

4. **Software Engineering**
   - Project planning and management
   - Version control with Git
   - Agile development methodology
   - Code documentation

### Team Contributors

This was a collaborative effort by Derrick Otieno and Safari Samuel Onyango.


## 🌟 Features Roadmap

Future enhancements could include:

- [ ] Laboratory results integration
- [ ] Imaging viewer (DICOM support)
- [ ] E-prescribing (e-Rx) integration
- [ ] Patient portal for self-service
- [ ] Mobile application
- [ ] Telemedicine integration
- [ ] HL7 FHIR API support
- [ ] Multi-language support
- [ ] Advanced reporting and analytics
- [ ] Integration with external health systems

---

**Built with ❤️ for better healthcare delivery**

*TrioLogic - Secure. Simple. Smart patient record management*
