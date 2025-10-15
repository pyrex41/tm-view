import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import open from 'open';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const BASE_PORT = process.env.PORT || 3737;
const PROJECT_DIR = process.env.TM_PROJECT_DIR || process.cwd();
const TASKMASTER_DIR = path.join(PROJECT_DIR, '.taskmaster');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from public/
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API Routes

// Helper: Get git information
function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: PROJECT_DIR,
      encoding: 'utf8'
    }).trim();

    const shortHash = execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_DIR,
      encoding: 'utf8'
    }).trim();

    const isDirty = execSync('git status --porcelain', {
      cwd: PROJECT_DIR,
      encoding: 'utf8'
    }).trim().length > 0;

    return {
      branch,
      shortHash,
      isDirty,
      status: isDirty ? 'dirty' : 'clean'
    };
  } catch (error) {
    // Not a git repository or git not available
    return null;
  }
}

// Get project info
app.get('/api/project', (req, res) => {
  try {
    const projectName = path.basename(PROJECT_DIR);
    const configPath = path.join(TASKMASTER_DIR, 'config.json');
    const statePath = path.join(TASKMASTER_DIR, 'state.json');

    let config = {};
    let state = {};

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }

    const gitInfo = getGitInfo();

    res.json({
      projectName,
      projectPath: PROJECT_DIR,
      currentTag: state.currentTag || 'master',
      port: app.get('port'), // Include the port the server is running on
      git: gitInfo,
      config,
      state
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasksPath = path.join(TASKMASTER_DIR, 'tasks', 'tasks.json');

    if (!fs.existsSync(tasksPath)) {
      return res.json({ tasks: [], format: 'none' });
    }

    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

    // Detect format: tagged or legacy
    if (tasksData.tasks && Array.isArray(tasksData.tasks)) {
      // Legacy format
      return res.json({
        tasks: tasksData.tasks,
        format: 'legacy',
        tags: ['master']
      });
    } else {
      // Tagged format
      const tags = Object.keys(tasksData);
      return res.json({
        tasks: tasksData,
        format: 'tagged',
        tags
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for a specific tag
app.get('/api/tasks/:tag', (req, res) => {
  try {
    const { tag } = req.params;
    const tasksPath = path.join(TASKMASTER_DIR, 'tasks', 'tasks.json');

    if (!fs.existsSync(tasksPath)) {
      return res.json({ tasks: [] });
    }

    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

    // Handle both formats
    if (tasksData.tasks && Array.isArray(tasksData.tasks)) {
      // Legacy format - only 'master' tag
      return res.json({ tasks: tag === 'master' ? tasksData.tasks : [] });
    } else if (tasksData[tag]) {
      // Tagged format
      return res.json({ tasks: tasksData[tag].tasks || [] });
    } else {
      return res.json({ tasks: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all PRD documents
app.get('/api/prds', (req, res) => {
  try {
    const docsPath = path.join(TASKMASTER_DIR, 'docs');

    if (!fs.existsSync(docsPath)) {
      return res.json({ prds: [] });
    }

    const files = fs.readdirSync(docsPath);
    const prds = files
      .filter(file => file.endsWith('.txt') || file.endsWith('.md'))
      .filter(file => !file.startsWith('.'))
      .map(file => ({
        name: file,
        path: file,
        size: fs.statSync(path.join(docsPath, file)).size,
        modified: fs.statSync(path.join(docsPath, file)).mtime
      }));

    res.json({ prds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific PRD content
app.get('/api/prds/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const prdPath = path.join(TASKMASTER_DIR, 'docs', filename);

    if (!fs.existsSync(prdPath)) {
      return res.status(404).json({ error: 'PRD not found' });
    }

    const content = fs.readFileSync(prdPath, 'utf8');
    res.json({ filename, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics
app.get('/api/stats', (req, res) => {
  try {
    const tasksPath = path.join(TASKMASTER_DIR, 'tasks', 'tasks.json');

    if (!fs.existsSync(tasksPath)) {
      return res.json({ total: 0, byStatus: {}, byPriority: {}, byTag: {} });
    }

    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    let allTasks = [];
    let byTag = {};

    // Handle both formats
    if (tasksData.tasks && Array.isArray(tasksData.tasks)) {
      allTasks = tasksData.tasks;
      byTag.master = tasksData.tasks.length;
    } else {
      Object.keys(tasksData).forEach(tag => {
        const tagTasks = tasksData[tag].tasks || [];
        allTasks = allTasks.concat(tagTasks);
        byTag[tag] = tagTasks.length;
      });
    }

    const byStatus = {};
    const byPriority = {};

    allTasks.forEach(task => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    });

    res.json({
      total: allTasks.length,
      byStatus,
      byPriority,
      byTag
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SSE endpoint for hot-reloading
const clients = new Set();

app.get('/api/events', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Add client to set
  clients.add(res);

  // Remove client on disconnect
  req.on('close', () => {
    clients.delete(res);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      clients.delete(client);
    }
  });
}

// Watch for file changes
const tasksDir = path.join(TASKMASTER_DIR, 'tasks');
const docsDir = path.join(TASKMASTER_DIR, 'docs');

// Debounce function to avoid multiple rapid updates
let debounceTimer = null;
function debounce(callback, delay = 300) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, delay);
}

// Watch tasks directory
if (fs.existsSync(tasksDir)) {
  fs.watch(tasksDir, { recursive: false }, (eventType, filename) => {
    if (filename === 'tasks.json') {
      debounce(() => {
        console.log(chalk.cyan('📝 Tasks updated, notifying clients...'));
        broadcast({ type: 'tasks-updated' });
      });
    }
  });
}

// Watch docs directory
if (fs.existsSync(docsDir)) {
  fs.watch(docsDir, { recursive: false }, (eventType, filename) => {
    if (filename && (filename.endsWith('.txt') || filename.endsWith('.md'))) {
      debounce(() => {
        console.log(chalk.cyan('📄 PRDs updated, notifying clients...'));
        broadcast({ type: 'prds-updated' });
      });
    }
  });
}

// Fallback to serve index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath);
});

// Smart port finder - tries up to 10 ports
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          server.close();
          resolve(port);
        }).on('error', reject);
      });
      return port;
    } catch (err) {
      if (i === maxAttempts - 1) {
        throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
      }
      // Port busy, try next one
    }
  }
}

// Start server with smart port handling
findAvailablePort(BASE_PORT).then(port => {
  app.set('port', port); // Store port in app for API access
  app.listen(port, () => {
    console.log(chalk.green(`\n✓ Task Master Viewer running!`));
    console.log(chalk.cyan(`\n  ➜ Local:   http://localhost:${port}`));
    if (port !== BASE_PORT) {
      console.log(chalk.yellow(`  (Port ${BASE_PORT} was busy, using ${port})`));
    }
    console.log(chalk.gray(`\n  Project: ${PROJECT_DIR}`));
    console.log(chalk.gray(`  Press Ctrl+C to stop\n`));

    // Auto-open browser
    open(`http://localhost:${port}`);
  });
}).catch(err => {
  console.error(chalk.red(`\n❌ Failed to start server: ${err.message}`));
  process.exit(1);
});
