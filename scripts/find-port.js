#!/usr/bin/env node

/**
 * Simple port detection utility
 * Finds the next available port starting from a given port
 */

const net = require('net');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  
  while (port < startPort + 100) { // Check up to 100 ports
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  
  throw new Error(`No available ports found starting from ${startPort}`);
}

// CLI usage
if (require.main === module) {
  const startPort = parseInt(process.argv[2]) || 3000;
  
  findAvailablePort(startPort)
    .then(port => {
      console.log(port);
      process.exit(0);
    })
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { findAvailablePort, isPortAvailable };