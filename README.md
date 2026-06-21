# Codonyx

<p align="center">
  <img src="public/favicon.png" alt="Codonyx Logo" width="120" />
</p>

<p align="center">
  <b>Professional Networking Platform for Science, Research, Innovation, and Business.</b>
</p>

<p align="center">
Built with React, TypeScript, Vite, Supabase, Capacitor, Firebase Cloud Messaging, and Tailwind CSS.
</p>

---

## Overview

Codonyx is a modern professional networking platform designed to connect Advisors, Laboratories, Distributors, Researchers, and Industry Professionals through a secure and scalable ecosystem.

The platform includes:

- Professional Profiles
- Connection Requests
- Real-time Notifications
- Push Notifications
- Email Notifications
- Google Authentication
- Role-Based Access
- Mobile Application (Android)
- Responsive Web Platform
- Publication & Document Sharing

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- ShadCN UI
- React Router

### Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Supabase Edge Functions

### Mobile

- Capacitor
- Android Studio

### Notifications

- Firebase Cloud Messaging (FCM)
- Capacitor Push Notifications
- Local Notifications

### Email

- Resend API

---

## Features

### Authentication

- Email & Password Login
- Google Authentication
- Password Reset
- Secure Session Management

### Professional Profiles

- Advisor Profiles
- Laboratory Profiles
- Distributor Profiles
- Editable Professional Information
- Profile Images
- Research Interests
- Publications

### Connections

- Send Connection Requests
- Accept / Reject Requests
- Connection Management
- Professional Network

### Notifications

- In-App Notifications
- Push Notifications
- Email Notifications
- Read / Unread Status

### Publications

- Upload Research Documents
- Publication Categories
- Document Management

### Mobile Application

- Android Application
- Push Notifications
- Deep Linking
- Google Login Support

---

## Project Structure

```
src/
 ├── components/
 ├── pages/
 ├── hooks/
 ├── integrations/
 ├── lib/
 ├── services/
 └── utils/

supabase/
 ├── functions/
 ├── migrations/
 └── config.toml

android/
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/your-repository.git
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

---

## Build

Production Build

```bash
npm run build
```

Android Sync

```bash
npx cap sync android
```

Open Android Studio

```bash
npx cap open android
```

---

## Environment Variables

Create a `.env` file and configure:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Configure the following services:

- Supabase
- Firebase
- Resend

---

## File Upload Limits

### Images

- Profile Photo – 4 MB
- Laboratory Logo – 4 MB

Supported Formats

- JPG
- JPEG
- PNG
- WEBP

### Documents

Maximum Size

- 30 MB

Supported Formats

- PDF
- DOC
- DOCX
- PPT
- PPTX

---

## Notifications

The platform supports:

- In-App Notifications
- Firebase Push Notifications
- Email Notifications
- Multi-device Login Support
- Automatic Token Cleanup

---

## Deployment

### Web

```
Vercel / Netlify / Render
```

### Backend

```
Supabase
```

### Android

```
Google Play Store
```

### iOS (Future)

```
Apple App Store
```

---

## Security

- Row Level Security (RLS)
- Secure Authentication
- JWT-based Sessions
- Protected Storage
- Role-Based Authorization

---

## Future Improvements

- iOS Application
- Chat / Messaging
- Video Meetings
- Advanced Search
- AI Recommendations
- Analytics Dashboard

---

## Maintenance

This project is maintained by the development team for feature enhancements, bug fixes, and performance improvements.

---

## License

This source code is proprietary and confidential.

Unauthorized copying, modification, distribution, or use of this software without written permission from the project owner is prohibited.

© 2026 Codonyx Private Limited. All Rights Reserved.

---

## Developed By

**Hriday Das**

Full Stack Developer | AI/ML Engineer

Project developed for **Codonyx Private Limited**.
