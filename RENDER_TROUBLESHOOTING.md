# Render Deployment Troubleshooting

## Problemi Risolti ✅

### 1. Path degli Asset
- **Problema**: Asset non si caricavano per path relativi
- **Soluzione**: Configurato `base: "/"` in vite.config.ts
- **Verifica**: Gli asset ora usano path assoluti `/assets/`

### 2. Build Command
- **Problema**: Comando di build complesso che poteva fallire
- **Soluzione**: Semplificato a `npm ci --include=dev --legacy-peer-deps && npm run build`
- **Verifica**: Build funziona correttamente

### 3. Server Configuration
- **Problema**: Server non trovava i file statici
- **Soluzione**: Configurato correttamente per servire da `dist/public/`
- **Verifica**: Server trova e serve tutti i file

## Diagnostica Post-Deploy

### 1. Verifica Health Check
```bash
curl https://your-app.onrender.com/health
```
**Risposta attesa**:
```json
{
  "status": "ok",
  "timestamp": "2025-08-03T...",
  "platform": "render",
  "version": "2.0.0-render",
  "service": "Money Management Pro"
}
```

### 2. Verifica Frontend
- Apri `https://your-app.onrender.com`
- Controlla Developer Tools > Network tab
- Verifica che gli asset si carichino da `/assets/`
- Controlla Console per errori JavaScript

### 3. Verifica API Endpoints
```bash
# Test user endpoint
curl https://your-app.onrender.com/api/auth/user

# Test sessions endpoint
curl https://your-app.onrender.com/api/sessions
```

## Possibili Problemi e Soluzioni

### Problema: "Application failed to respond"
**Causa**: Server non si avvia correttamente
**Soluzioni**:
1. Verifica i log di deploy su Render
2. Controlla che `server.render.js` sia presente
3. Verifica che la porta sia configurata correttamente

### Problema: "Build failed"
**Causa**: Errore durante il processo di build
**Soluzioni**:
1. Controlla i log di build su Render
2. Verifica che tutte le dipendenze siano installate
3. Testa il build localmente: `npm run build`

### Problema: Frontend non si carica
**Causa**: File statici non trovati o path errati
**Soluzioni**:
1. Verifica che `dist/public/` contenga i file
2. Controlla che gli asset usino path assoluti
3. Verifica la configurazione del server per i file statici

### Problema: API non risponde
**Causa**: Endpoint non configurati o errori nel server
**Soluzioni**:
1. Verifica che il server sia in ascolto sulla porta corretta
2. Controlla la configurazione CORS
3. Testa gli endpoint localmente

### Problema: Errori CORS
**Causa**: Configurazione CORS non corretta
**Soluzioni**:
1. Verifica che `RENDER_EXTERNAL_URL` sia configurato
2. Controlla la configurazione CORS in `server.render.js`
3. Aggiungi il dominio Render agli allowed origins

## Log di Debug

### Durante il Deploy
Render mostrerà i log del build process. Cerca:
- ✅ `npm ci` completato con successo
- ✅ `npm run build` completato con successo
- ✅ File creati in `dist/public/`

### Durante l'Avvio
Il server mostrerà:
```
🔍 STATIC FILES SEARCH:
✅ FOUND STATIC FILES AT: /opt/render/project/src/dist/public
✅ Serving static files from: /opt/render/project/src/dist/public
🚀 Render Server running on port 10000
```

## Comandi Utili per Debug

### Test Locale
```bash
# Build e test completo
npm run build
node server.render.js

# Test deployment
node test-full-deployment.js

# Debug informazioni
node debug-render.js
```

### Test Remoto
```bash
# Health check
curl -I https://your-app.onrender.com/health

# Test frontend
curl -I https://your-app.onrender.com/

# Test asset
curl -I https://your-app.onrender.com/assets/index-[hash].js
```

## Checklist Pre-Deploy

- [ ] Build locale funziona: `npm run build`
- [ ] Server locale funziona: `node server.render.js`
- [ ] Test completo passa: `node test-full-deployment.js`
- [ ] Health check risponde: `curl localhost:10000/health`
- [ ] Frontend si carica: apri `http://localhost:10000`
- [ ] Asset si caricano correttamente
- [ ] API endpoints rispondono

## Checklist Post-Deploy

- [ ] Health check risponde su Render
- [ ] Frontend si carica su Render
- [ ] Asset si caricano correttamente
- [ ] API endpoints funzionano
- [ ] Nessun errore nei log di Render
- [ ] Nessun errore nella console del browser

## Contatti di Supporto

Se i problemi persistono:
1. Controlla i log dettagliati su Render Dashboard
2. Verifica la configurazione delle variabili d'ambiente
3. Testa tutti gli endpoint manualmente
4. Confronta con la configurazione locale funzionante