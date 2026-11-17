import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSeedEOSState } from './src/data/seedData';
import type { EOSState } from './src/types/eos';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'eos-state.json');

function ensureSeededState(): EOSState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedEOSState();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as EOSState;
  } catch {
    const seed = createSeedEOSState();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function saveState(state: EOSState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/eos', (_req, res) => {
    const state = ensureSeededState();
    res.json(state);
  });

  app.put('/api/eos', (req, res) => {
    const body = req.body as EOSState;
    if (!body || typeof body !== 'object' || !body.vto || !Array.isArray(body.members)) {
      res.status(400).json({ error: 'ساختار داده EOS نامعتبر است.' });
      return;
    }
    saveState(body);
    res.json(body);
  });

  app.post('/api/eos/reset', (_req, res) => {
    const seed = createSeedEOSState();
    saveState(seed);
    res.json(seed);
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`EOS Server listening on http://localhost:${port}`);
  });
}

startServer();
