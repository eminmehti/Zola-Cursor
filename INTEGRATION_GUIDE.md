# Zola Business Setup - Stage-2 to Client Portal Integration Guide

This guide explains how to set up the integration between the Stage-2 form/payment system and the client portal.

## Overview

The integration flow works as follows:

1. User completes the Stage-2 form and selects a proposal
2. User makes a payment for the selected proposal
3. Upon successful payment, a case is automatically created in the client portal Firebase
4. User is redirected to the client portal to view their case

## Prerequisites

- Node.js 14+ installed
- Firebase account with Firestore database
- Basic knowledge of Firebase Auth and Firestore

## Setup Steps

### 1. Install Dependencies

First, install the required dependencies in both the Stage-2 and client-portal projects:

**Stage-2:**
```bash
cd Stage-2
npm install
```

**Client Portal:**
```bash
cd client-portal
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore database
3. Set up Firebase Authentication (Email/Password at minimum)
4. Generate a service account key from Project Settings > Service accounts
5. Save the service account JSON file to `Stage-2/service-account.json`

### 3. Configure Environment Variables

**Stage-2:**

Update the `.env` file in the Stage-2 directory with:

```
# Client Portal Integration
FIREBASE_PROJECT_ID=your-firebase-project-id
CLIENT_PORTAL_URL=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

**Client Portal:**

Create a `.env` file in the client-portal directory with:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

### 4. Initialize the Database

Make sure to initialize the SQLite database in Stage-2 with the required tables:

```bash
cd Stage-2
node initDB.js
```

This will create the necessary tables and add the redirect_url column to the payments table.

### 5. Start Both Applications

**Stage-2:**
```bash
cd Stage-2
node server.js
```

**Client Portal:**
```bash
cd client-portal
npm run dev
```

## Testing the Integration

1. Navigate to the Stage-2 form (usually at http://localhost:2000)
2. Complete the form and select a proposal
3. Proceed to payment and complete a payment
4. After successful payment, you should be redirected to the client portal
5. Sign in to the client portal (create an account if needed)
6. You should see your case in the dashboard

## Troubleshooting

- **Database Issues**: Run `node initDB.js` to ensure the database is properly initialized
- **Firebase Connection Issues**: Verify the service account JSON file is correct and properly referenced
- **Redirect Issues**: Check that the `CLIENT_PORTAL_URL` environment variable is set correctly
- **Authentication Issues**: Ensure user accounts exist in Firebase Authentication

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html) 