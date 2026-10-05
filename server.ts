import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { INITIAL_ROUTING_DATA } from './src/data/initialData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'routing_db.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialPayload = {
      updatedAt: new Date().toISOString(),
      items: INITIAL_ROUTING_DATA,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialPayload, null, 2), 'utf-8');
  }
}

app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get saved routing data from server
app.get('/api/routing', (req, res) => {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    res.json({
      success: true,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      items: Array.isArray(parsed.items) ? parsed.items : INITIAL_ROUTING_DATA,
    });
  } catch (err: any) {
    console.error('Error reading routing data:', err);
    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      items: INITIAL_ROUTING_DATA,
    });
  }
});

// Save routing data to server
app.post('/api/routing', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Invalid items array' });
    }
    ensureDataFile();
    const updatedAt = new Date().toISOString();
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ updatedAt, items }, null, 2),
      'utf-8'
    );
    res.json({
      success: true,
      updatedAt,
      count: items.length,
      message: 'บันทึกข้อมูลลงเซิร์ฟเวอร์สำเร็จ',
    });
  } catch (err: any) {
    console.error('Error saving routing data:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to save routing data',
    });
  }
});

// Reset routing data to initial state
app.post('/api/routing/reset', (req, res) => {
  try {
    ensureDataFile();
    const updatedAt = new Date().toISOString();
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ updatedAt, items: INITIAL_ROUTING_DATA }, null, 2),
      'utf-8'
    );
    res.json({
      success: true,
      updatedAt,
      items: INITIAL_ROUTING_DATA,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to reset routing data',
    });
  }
});

// LINE Notify Proxy endpoint to bypass browser CORS
app.post('/api/line-notify', async (req, res) => {
  const { token, message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // If token is missing, provide a friendly simulated success or error
  if (!token || token.trim() === '' || token === 'SIMULATED_TOKEN') {
    return res.json({
      success: true,
      simulated: true,
      status: 200,
      message: 'Simulated LINE Notification sent successfully (No token provided)',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('message', message);

    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || `LINE Notify API returned status ${response.status}`,
        details: data,
      });
    }

    return res.json({
      success: true,
      simulated: false,
      status: 200,
      message: 'LINE notification sent successfully',
      data,
    });
  } catch (err: any) {
    console.error('Error sending LINE notification:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while dispatching to LINE Notify',
    });
  }
});

// Generic Webhook Proxy (for LINE Messaging API / custom factory webhooks)
app.post('/api/webhook-proxy', async (req, res) => {
  const { webhookUrl, payload } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({ success: false, error: 'webhookUrl is required' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.json({
      success: response.ok,
      status: response.status,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch to webhook',
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
