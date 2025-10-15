#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if .taskmaster directory exists in current directory
const taskmasterDir = join(process.cwd(), '.taskmaster');

if (!fs.existsSync(taskmasterDir)) {
  console.log(chalk.red('❌ Error: No .taskmaster directory found in current directory'));
  console.log(chalk.yellow('\nPlease run this command from a directory containing a Task Master project.'));
  console.log(chalk.gray('\nLooking for: ') + taskmasterDir);
  process.exit(1);
}

console.log(chalk.green('✓ Found Task Master project'));
console.log(chalk.gray('Starting viewer...'));

// Start the server
const serverPath = join(__dirname, '..', 'src', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TM_PROJECT_DIR: process.cwd()
  }
});

server.on('error', (err) => {
  console.error(chalk.red('Failed to start server:'), err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(chalk.red(`Server exited with code ${code}`));
  }
  process.exit(code);
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nShutting down...'));
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});
