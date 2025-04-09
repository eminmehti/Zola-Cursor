const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const app = express();
const PORT = 3000;
const STAGE2_PORT = process.env.STAGE2_PORT || 2000;
const { exec } = require('child_process');

// Helper function to check if a port is in use
const isPortInUse = async (port) => {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
};

// Helper function to kill a process using a specific port
const killProcessOnPort = (port) => {
  return new Promise((resolve, reject) => {
    // Different commands for different operating systems
    let command = '';
    if (process.platform === 'win32') {
      command = `FOR /F "tokens=5" %P IN ('netstat -a -n -o ^| find ":${port}"') DO TaskKill /PID %P /F`;
    } else {
      // For macOS and Linux
      command = `lsof -i :${port} -t | xargs kill -9`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error && !error.message.includes('No such process')) {
        console.warn(`Warning: Error killing process on port ${port}:`, error.message);
      }
      // Wait a bit to ensure the port is freed
      setTimeout(resolve, 1000);
    });
  });
};

// Determine actual Stage-2 port
const getActualStage2Port = async () => {
  // Check if default port is in use
  if (await isPortInUse(STAGE2_PORT)) {
    console.log(`Default Stage-2 port ${STAGE2_PORT} is in use.`);
    // Stage-2 server might be using the next port
    if (await isPortInUse(STAGE2_PORT + 1)) {
      console.log(`Stage-2 server likely running on port ${STAGE2_PORT + 1}.`);
      return STAGE2_PORT + 1;
    }
  }
  return STAGE2_PORT;
};

// Check if the build directory exists
const landingPageBuildPath = path.join(__dirname, 'landing-page/dist/public');
const landingPageIndexPath = path.join(landingPageBuildPath, 'index.html');

if (!fs.existsSync(landingPageBuildPath)) {
  console.error('Error: Landing page build directory does not exist.');
  console.error('Please run: cd landing-page && npm run build');
  process.exit(1);
}

// Serve landing page static assets
app.use('/landing/assets', express.static(path.join(landingPageBuildPath, 'assets')));

// Set up static file serving for the landing page root
app.use('/landing', (req, res, next) => {
  // If it's a file with extension, try to serve it as static
  if (path.extname(req.path) !== '') {
    return express.static(landingPageBuildPath)(req, res, next);
  }
  // Otherwise serve the index.html
  res.sendFile(landingPageIndexPath);
});

// Initialize server and set up proxy middleware once we know the actual Stage-2 port
(async () => {
  // Check if PORT is already in use and kill the process if needed
  if (await isPortInUse(PORT)) {
    console.log(`Port ${PORT} is already in use. Attempting to free it...`);
    await killProcessOnPort(PORT);
    console.log(`Port ${PORT} should now be available.`);
  }

  const actualStage2Port = await getActualStage2Port();
  console.log(`Using Stage-2 port: ${actualStage2Port}`);
  
  // Proxy requests to /stage2 to the Stage-2 server
  app.use('/stage2', createProxyMiddleware({
    target: `http://localhost:${actualStage2Port}`,
    pathRewrite: {
      '^/stage2/UI1.html': '/UI1.html',
      '^/stage2/UI2.html': '/UI2.html',
      '^/stage2/UI4.html': '/UI4.html',
      '^/stage2/UI6.html': '/UI6.html',
      '^/stage2/UI7.html': '/UI7.html',
      '^/stage2/UI8.html': '/UI8.html',
      '^/stage2/UI9.html': '/UI9.html',
      '^/stage2/UI10.html': '/UI10.html',
      '^/stage2/UI11.html': '/UI11.html',
      '^/stage2/questionnaire': '/questionnaire',
      '^/stage2/ui4': '/ui4',
      '^/stage2/ui6': '/ui6',
      '^/stage2/ui7': '/ui7',
      '^/stage2/ui8': '/ui8',
      '^/stage2/ui9': '/ui9',
      '^/stage2/ui10': '/ui10',
      '^/stage2/ui11': '/ui11',
      '^/stage2/final-submit': '/final-submit',
      '^/stage2/generate-proposal': '/generate-proposal',
      '^/stage2': '/'
    },
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      
      if (err.code === 'ECONNREFUSED') {
        console.error(`Could not connect to Stage-2 server on port ${actualStage2Port}. Make sure it's running.`);
        res.status(503).send(`
          <html>
            <head>
              <title>Stage-2 Server Unavailable</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                h1 { color: #d32f2f; }
                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
                .message { background: #fffde7; padding: 15px; border-left: 5px solid #fbc02d; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Stage-2 Server Unavailable</h1>
              <div class="message">
                <p>The Stage-2 server is currently not running or not reachable on port ${actualStage2Port}.</p>
                <p>To fix this issue:</p>
                <ol>
                  <li>Make sure the Stage-2 server is running by opening a terminal and executing:</li>
                  <pre>cd Stage-2 && node server.js</pre>
                  <li>Then, restart this server with:</li>
                  <pre>node zola-server.js</pre>
                </ol>
              </div>
              <p><a href="/">Return to Zola homepage</a></p>
            </body>
          </html>
        `);
      } else {
        res.status(500).send('Proxy Error: Could not connect to the Stage-2 server.');
      }
    }
  }));
  
  // Add direct route handling for UI1.html for better error handling
  app.get('/UI1.html', (req, res) => {
    res.redirect('/stage2/UI1.html');
  });
  
  // Add a route for the "Start Now" button
  app.get('/start-now', (req, res) => {
    console.log('Received request for /start-now - redirecting to Stage-2 UI1');
    res.redirect('/stage2/UI1.html');
  });

  // Add a direct route handler for '/questionnaire'
  app.get('/questionnaire', (req, res) => {
    console.log('Received request for /questionnaire - redirecting to Stage-2 questionnaire');
    res.redirect('/stage2/questionnaire');
  });
  
  // Add a direct route handler for '/ui4'
  app.get('/ui4', (req, res) => {
    console.log('Received request for /ui4 - redirecting to Stage-2 ui4');
    res.redirect('/stage2/ui4');
  });
  
  // Add a direct route handler for '/ui6'
  app.get('/ui6', (req, res) => {
    console.log('Received request for /ui6 - redirecting to Stage-2 ui6');
    res.redirect('/stage2/ui6');
  });
  
  // Add a direct route handler for '/ui7'
  app.get('/ui7', (req, res) => {
    console.log('Received request for /ui7 - redirecting to Stage-2 ui7');
    res.redirect('/stage2/ui7');
  });
  
  // Add a direct route handler for '/ui8'
  app.get('/ui8', (req, res) => {
    console.log('Received request for /ui8 - redirecting to Stage-2 ui8');
    res.redirect('/stage2/ui8');
  });
  
  // Add a direct route handler for '/ui9'
  app.get('/ui9', (req, res) => {
    console.log('Received request for /ui9 - redirecting to Stage-2 ui9');
    res.redirect('/stage2/ui9');
  });
  
  // Add a direct route handler for '/ui10'
  app.get('/ui10', (req, res) => {
    console.log('Received request for /ui10 - redirecting to Stage-2 ui10');
    res.redirect('/stage2/ui10');
  });
  
  // Add a direct route handler for '/ui11'
  app.get('/ui11', (req, res) => {
    console.log('Received request for /ui11 - redirecting to Stage-2 ui11');
    res.redirect('/stage2/ui11');
  });
  
  // Add a direct route handler for '/final-submit' POST requests
  app.post('/final-submit', (req, res) => {
    console.log('Received POST request for /final-submit - redirecting to Stage-2 final-submit');
    res.redirect(307, '/stage2/final-submit'); // 307 preserves the POST method
  });
  
  // Add a direct route handler for '/save-answer' POST requests
  app.post('/save-answer', (req, res) => {
    console.log('Received POST request for /save-answer - redirecting to Stage-2 save-answer');
    res.redirect(307, '/stage2/save-answer'); // 307 preserves the POST method
  });
  
  // Add a direct route handler for '/create-payment-intent' POST requests
  app.post('/create-payment-intent', (req, res) => {
    console.log('Received POST request for /create-payment-intent - redirecting to Stage-2 create-payment-intent');
    res.redirect(307, '/stage2/create-payment-intent'); // 307 preserves the POST method
  });
  
  // Add a direct route handler for '/generate-proposal' POST requests
  app.post('/generate-proposal', (req, res) => {
    console.log('Received POST request for /generate-proposal - redirecting to Stage-2 generate-proposal');
    res.redirect(307, '/stage2/generate-proposal'); // 307 preserves the POST method
  });
  
  // Also serve landing page at root
  app.get('/', (req, res) => {
    res.sendFile(landingPageIndexPath);
  });
  
  // Catch-all route for SPA
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/stage2')) {
      return next();
    }
    res.sendFile(landingPageIndexPath);
  });
  
  // Start the server with error handling
  try {
    app.listen(PORT, () => {
      console.log(`Zola server running at http://localhost:${PORT}`);
      console.log(`Landing page available at http://localhost:${PORT} and http://localhost:${PORT}/landing`);
      console.log(`Stage-2 application available at http://localhost:${PORT}/stage2`);
      console.log(`Stage-2 server is proxied from port ${actualStage2Port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is still in use. You may need to manually kill the process.`);
        console.error(`On Mac/Linux: lsof -i :${PORT} -t | xargs kill -9`);
        console.error(`On Windows: FOR /F "tokens=5" %P IN ('netstat -a -n -o ^| find ":${PORT}"') DO TaskKill /PID %P /F`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
