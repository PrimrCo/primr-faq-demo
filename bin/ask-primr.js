#!/usr/bin/env node

/**
 * ask-primr CLI tool
 * Commands for primr-faq-demo
 */

const { spawn } = require('child_process');
const path = require('path');

function showHelp() {
  console.log('ask-primr - Primr FAQ Demo CLI');
  console.log('');
  console.log('Usage:');
  console.log('  npx ask-primr check-environment    Check environment configuration');
  console.log('  npx ask-primr --help              Show this help message');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const command = args[0];
  
  if (command === 'check-environment') {
    // Run the check-environment script
    const scriptPath = path.join(__dirname, '..', 'scripts', 'check-environment.ts');
    const child = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}