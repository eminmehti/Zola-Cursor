/**
 * Cleanup utility to find and terminate processes using port 2000
 * Run this script with: node cleanup-port.js
 */
const { execSync } = require('child_process');
const PORT = process.env.PORT || 2000;

try {
  console.log(`Searching for processes using port ${PORT}...`);
  
  // Find process IDs using the port
  const findCommand = `lsof -i :${PORT} | grep LISTEN`;
  const output = execSync(findCommand, { encoding: 'utf8' });
  
  if (!output || output.trim() === '') {
    console.log(`No processes found using port ${PORT}.`);
    process.exit(0);
  }
  
  console.log('Found processes:');
  console.log(output);
  
  // Extract process IDs
  const processLines = output.trim().split('\n');
  const pids = processLines.map(line => {
    const parts = line.trim().split(/\s+/);
    return parts[1]; // Second column is typically the PID
  });
  
  if (pids.length === 0) {
    console.log('No process IDs found to terminate.');
    process.exit(0);
  }
  
  console.log(`Attempting to terminate ${pids.length} process(es) with IDs: ${pids.join(', ')}`);
  
  // Kill the processes
  pids.forEach(pid => {
    try {
      console.log(`Terminating process ${pid}...`);
      execSync(`kill -9 ${pid}`, { encoding: 'utf8' });
      console.log(`Process ${pid} terminated successfully.`);
    } catch (killError) {
      console.error(`Failed to terminate process ${pid}:`, killError.message);
    }
  });
  
  console.log(`Port ${PORT} should now be available.`);
} catch (error) {
  if (error.stderr && error.stderr.includes('No such process')) {
    console.log(`No processes found using port ${PORT}.`);
  } else {
    console.error('Error finding or terminating processes:', error.message);
    if (process.platform !== 'darwin' && process.platform !== 'linux') {
      console.log('\nNote: This script is designed for macOS/Linux. On Windows, use:');
      console.log(`netstat -ano | findstr :${PORT}`);
      console.log('Then terminate the process with:');
      console.log('taskkill /F /PID <PID>');
    }
  }
} 