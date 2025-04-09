# Port Troubleshooting Guide

## Common Port Issues

When starting the server, you might encounter this error:

```
Error: listen EADDRINUSE: address already in use :::2000
```

This means that port 2000 (or whatever port you've configured) is already being used by another process, likely a previous instance of this server that wasn't properly terminated.

## Solution 1: Let the Server Handle It

The server is now configured to automatically try using the next available port (e.g., 2001 if 2000 is taken). You can simply allow this to happen, but be aware that if you're using a different port, you may need to update any hard-coded URLs in your client applications.

## Solution 2: Manually Clean Up the Port

### Using the Cleanup Script

We've included a utility script to help terminate processes using port 2000:

```bash
node cleanup-port.js
```

### Manual Cleanup

#### On macOS/Linux:

1. Find the process using port 2000:
   ```bash
   lsof -i :2000
   ```

2. Look for the process ID (PID) in the second column of the output.

3. Terminate the process:
   ```bash
   kill -9 <PID>
   ```

#### On Windows:

1. Find the process using port 2000:
   ```bash
   netstat -ano | findstr :2000
   ```

2. Look for the PID (last column) in the output.

3. Terminate the process:
   ```bash
   taskkill /F /PID <PID>
   ```

## Preventing Future Issues

To avoid port conflicts:

1. Always properly stop your server with Ctrl+C before starting a new instance.
2. If you're running the server in the background, make sure to properly terminate it:
   ```bash
   # Find the process
   ps aux | grep node
   
   # Kill it
   kill -9 <PID>
   ```

3. If using PM2 or similar process managers, use proper commands to restart:
   ```bash
   pm2 restart server
   ``` 