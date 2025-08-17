// Script di avvio per produzione con caricamento .env
import 'dotenv/config';
import { spawn } from 'child_process';

// Usa TSX per eseguire direttamente il server TypeScript
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (err) => {
  console.error('Errore nell\'avvio del server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server terminato con codice ${code}`);
  process.exit(code || 0);
});