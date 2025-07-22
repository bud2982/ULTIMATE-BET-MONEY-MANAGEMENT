# Railway Deploy - Guida Completa

## 🚀 Deploy su Railway

### 1. Preparazione files
1. **Scarica** `money-management-railway-FIXED.zip`
2. **Estrai** tutti i files
3. **Verifica** che questi files siano presenti:
   - `server.railway.js` (server principale)
   - `package.railway.fixed.json` (configurazione)
   - `dockerfile.railway` (container)

### 2. Carica su GitHub
```bash
# Vai nella cartella estratta
cd money-management-railway-fixed

# Rinomina i files per Railway
mv package.railway.fixed.json package.json
mv dockerfile.railway Dockerfile

# Inizializza Git
git init
git add .
git commit -m "Railway deployment ready"

# Carica su GitHub (sostituisci USERNAME)
git remote add origin https://github.com/USERNAME/money-management-railway.git
git push -u origin main
```

### 3. Deploy su Railway
1. **Vai su** https://railway.app
2. **Login** con GitHub
3. **Clicca** "New Project"
4. **Seleziona** "Deploy from GitHub repo"
5. **Scegli** la repository appena creata

### 4. Configurazione Railway
**Settings da configurare:**

**Build & Deploy:**
- **Root Directory**: `/` (default)
- **Build Command**: `npm run build`
- **Start Command**: `node server.railway.js`

**Environment Variables:**
```
NODE_ENV=production
PORT=3000
```

**Networking:**
- **Public Domain**: Abilitato (automatico)
- **Custom Domain**: Opzionale

### 5. Dockerfile Deploy (alternativo)
Se preferisci usare Docker:
```dockerfile
# Il Dockerfile è già ottimizzato per Railway
# Railway lo rileverà automaticamente
```

## ✅ Verifica Deploy

### 1. Controllo Health
```bash
# Sostituisci con il tuo URL Railway
curl https://your-app.railway.app/health
```

**Risposta attesa:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T21:00:00.000Z",
  "platform": "railway",
  "version": "2.0.0-railway"
}
```

### 2. Test API
```bash
curl https://your-app.railway.app/api/auth/user
curl https://your-app.railway.app/api/sessions
```

### 3. Test Frontend
Apri `https://your-app.railway.app` nel browser

## 🔧 Troubleshooting

### Build fails
**Errore**: `Cannot find module 'tsx'`
**Soluzione**: Verifica che stai usando `package.railway.fixed.json` rinominato

### Server non parte
**Errore**: `Server crashes immediately`
**Soluzione**: 
1. Verifica Start Command: `node server.railway.js`
2. Controlla che PORT=3000 sia impostato
3. Verifica che il server.railway.js sia nella root

### App non carica
**Errore**: `Cannot GET /`
**Soluzione**:
1. Controlla che il build sia completato
2. Verifica che la cartella `dist` sia presente
3. Testa `/health` endpoint

## 📊 Monitoring Railway

### Logs
1. **Vai su Railway Dashboard**
2. **Seleziona il progetto**
3. **Clicca su "Deployments"**
4. **Visualizza logs in tempo reale**

### Metrics
- **CPU Usage**: Monitoraggio automatico
- **Memory**: Limite free tier: 512MB
- **Bandwidth**: Monitoraggio traffico

### Costs
- **Free Tier**: $5/mese di crediti
- **Hobby Plan**: $5/mese
- **Pro Plan**: $20/mese

## 🎯 Ottimizzazioni

### Performance
1. **Gzip compression**: Già abilitata nel server
2. **Static file serving**: Ottimizzato per Railway
3. **Health checks**: Configurati per load balancer

### Security
1. **CORS**: Configurato per Railway domains
2. **Trust proxy**: Abilitato per Railway
3. **Rate limiting**: Implementabile se necessario

## 🔄 Updates

### Deploy nuova versione
```bash
# Aggiorna i files
git add .
git commit -m "Update version"
git push origin main

# Railway farà autodeploy
```

### Rollback
1. **Vai su Railway Dashboard**
2. **Deployments**
3. **Seleziona versione precedente**
4. **Clicca "Redeploy"**

---

**URL finale**: `https://your-app-name.railway.app`
**Health check**: `https://your-app-name.railway.app/health`
**API**: `https://your-app-name.railway.app/api/*`