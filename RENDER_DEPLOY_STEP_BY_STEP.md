# Guida Step-by-Step per Deploy su Render

## 📋 Preparazione

### 1. Scarica il file ZIP
- Scarica `money-management-render-FIXED.zip` dal progetto
- Estrai tutti i file in una cartella locale

### 2. Prepara i file per Render
```bash
# Rinomina il file di configurazione
mv package.render.fixed.json package.json

# Verifica che server.render.js sia presente
ls -la server.render.js
```

### 3. Carica su GitHub (raccomandato)
```bash
# Inizializza repository Git
git init
git add .
git commit -m "Deploy ready for Render"

# Carica su GitHub
git remote add origin https://github.com/TUO-USERNAME/money-management-pro.git
git push -u origin main
```

## 🚀 Deploy su Render

### 1. Vai su Render Dashboard
- Accedi a https://render.com
- Clicca su "New +" in alto a destra
- Seleziona "Web Service"

### 2. Connetti Repository
- Seleziona "Connect a repository"
- Autorizza GitHub se richiesto
- Seleziona il repository che hai creato

### 3. Configura il Service
**Nome**: `money-management-pro`

**Environment**: `Node`

**Build Command**: 
```bash
npm run build
```

**Start Command**:
```bash
node server.render.js
```

**Node Version**: `18`

### 4. Variabili d'Ambiente
Clicca su "Advanced" e aggiungi:
```
NODE_ENV=production
PORT=10000
```

### 5. Deploy
- Clicca su "Create Web Service"
- Aspetta che il build finisca (circa 5-10 minuti)
- L'app sarà disponibile su `https://your-app-name.onrender.com`

## ✅ Verifica del Deploy

### Test Health Check
```bash
curl https://your-app-name.onrender.com/health
```

**Risposta attesa**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T21:00:00.000Z",
  "platform": "render",
  "service": "Money Management Pro"
}
```

### Test API
```bash
curl https://your-app-name.onrender.com/api/auth/user
```

### Test Frontend
- Apri `https://your-app-name.onrender.com` nel browser
- Dovresti vedere l'app Money Management Pro

## 🔧 Troubleshooting

### Build fallisce
1. Verifica che `package.json` sia rinominato correttamente
2. Controlla che Node version sia 18
3. Verifica Build Command: `npm run build`

### Server non parte
1. Verifica Start Command: `node server.render.js`
2. Controlla variabili d'ambiente
3. Guarda i logs in Render Dashboard

### App non carica
1. Verifica che il build sia completato
2. Controlla che `/health` risponda correttamente
3. Verifica che la cartella `dist` sia stata creata

## 📊 Monitoring

### Logs in Render
- Vai su Render Dashboard
- Seleziona il tuo service
- Clicca su "Logs" per vedere output in tempo reale

### Metriche
- "Metrics" mostra CPU, memoria, e richieste
- "Events" mostra deploy history

## 🎯 Passi Successivi

1. **Custom Domain** (opzionale)
   - Vai su "Settings" → "Custom Domains"
   - Aggiungi il tuo dominio

2. **SSL** (automatico)
   - Render fornisce SSL gratuito
   - Sarà attivo automaticamente

3. **Monitoring**
   - Configura notifiche per downtime
   - Monitora performance

---

**Nota**: Render ha un piano gratuito con alcune limitazioni. Per uso in produzione, considera l'upgrade a un piano paid per migliori performance.