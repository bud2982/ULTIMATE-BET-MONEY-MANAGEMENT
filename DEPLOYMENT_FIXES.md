# Deployment Fixes - Railway & Render

## Problema Identificato
- **Railway**: Crasha continuamente perché cerca di usare il server di sviluppo TypeScript
- **Render**: Non parte correttamente, probabilmente problemi di configurazione

## Soluzioni Implementate

### Per Railway
1. **Server dedicato**: `server.railway.js` - Server standalone senza dipendenze TypeScript
2. **Package.json**: `package.railway.fixed.json` - Configurazione minima per Railway
3. **Dockerfile**: `dockerfile.railway` - Container ottimizzato per Railway
4. **Porta**: Usa PORT 3000 (default Railway)

### Per Render
1. **Server dedicato**: `server.render.js` - Server ottimizzato per Render
2. **Package.json**: `package.render.fixed.json` - Configurazione specifica per Render
3. **Porta**: Usa PORT 10000 (default Render)
4. **CORS**: Configurato per dominio Render

## Configurazione Railway

### 1. Deploy Settings
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "dockerfile.railway"
  }
}
```

### 2. Environment Variables
```
NODE_ENV=production
PORT=3000
```

### 3. Files to use
- `server.railway.js` (main server)
- `package.railway.fixed.json` (rename to package.json)
- `dockerfile.railway` (rename to Dockerfile)

## Configurazione Render

### 1. Service Settings
- **Build Command**: `npm run build`
- **Start Command**: `node server.render.js`
- **Node Version**: 18

### 2. Environment Variables
```
NODE_ENV=production
PORT=10000
```

### 3. Files to use
- `server.render.js` (main server)
- `package.render.fixed.json` (rename to package.json)

## API Endpoints Disponibili

### Health Check
- `GET /health` - Verifica stato del server

### Authentication
- `GET /api/auth/user` - Dati utente demo

### Sessions
- `GET /api/sessions` - Lista sessioni
- `POST /api/sessions` - Crea sessione
- `GET /api/sessions/:id` - Dettagli sessione
- `PUT /api/sessions/:id` - Aggiorna sessione
- `DELETE /api/sessions/:id` - Elimina sessione

### Bets
- `GET /api/sessions/:id/bets` - Scommesse per sessione
- `POST /api/sessions/:id/bets` - Crea scommessa

## Test di Funzionamento

### Railway
```bash
curl https://your-railway-app.railway.app/health
```

### Render
```bash
curl https://your-render-app.onrender.com/health
```

## Risoluzione Problemi

### Railway crasha
1. Verificare che usi `server.railway.js` come entry point
2. Controllare che Dockerfile sia configurato correttamente
3. Verificare variabili d'ambiente

### Render non parte
1. Verificare build command: `npm run build`
2. Verificare start command: `node server.render.js`
3. Controllare che la porta sia 10000

---

**Nota**: Entrambi i server sono configurati per funzionare in modalità standalone senza dipendenze TypeScript o server di sviluppo.