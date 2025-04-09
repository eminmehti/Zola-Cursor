# Zola Integrated Application

This project integrates the Zola landing page with the Stage-2 application, allowing users to navigate from the landing page to the Stage-2 application seamlessly.

## Setup

1. Install dependencies:
```
npm run install-deps
```

This will install dependencies for:
- The root project (for the integrated server)
- The landing page
- The Stage-2 application

2. Build the landing page:
```
npm run build-landing
```

## Running the Application

To run both applications simultaneously:

```
npm start
```

This will:
1. Build the landing page if not already built
2. Start the Stage-2 server
3. Start the integration server

The application will be available at:
- Landing page: http://localhost:3000/landing
- Stage-2 application: http://localhost:3000/stage2
- Direct access to UI1.html: http://localhost:3000/stage2/UI1.html

## Component Applications

### Landing Page
Located in `./landing-page/`
A React application built with Vite

### Stage-2 Application
Located in `./Stage-2/`
A Node.js application with HTML frontend 