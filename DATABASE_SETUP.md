# Database Setup Guide

## Overview

L'applicazione Ultimate Bet Money Management supporta due modalità di persistenza dei dati:

1. **InMemoryStorage** - Per sviluppo locale (dati temporanei)
2. **DatabaseStorage** - Per produzione con PostgreSQL (dati persistenti)

## Configurazione Attuale

### Sviluppo Locale
- **Storage**: InMemoryStorage + localStorage (browser)
- **Persistenza**: I dati vengono salvati nel localStorage del browser come fallback
- **Vantaggi**: Funziona immediatamente senza configurazione database
- **Limitazioni**: I dati sono locali al browser e possono essere persi

### Produzione
- **Storage**: DatabaseStorage con PostgreSQL
- **Persistenza**: Dati salvati permanentemente nel database
- **Vantaggi**: Dati condivisi tra dispositivi, backup automatico, scalabilità

## Setup PostgreSQL per Produzione

### 1. Configurare DATABASE_URL

Modifica il file `.env` per utilizzare PostgreSQL:

```env
# Sostituisci questa riga:
DATABASE_URL="file:./dev.db"

# Con il tuo URL PostgreSQL:
DATABASE_URL="postgresql://username:password@host:port/database"
```

### 2. Esempi di URL PostgreSQL

**Neon Database:**
```env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Railway:**
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

**Supabase:**
```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### 3. Eseguire le Migrazioni

Una volta configurato il DATABASE_URL per PostgreSQL:

```bash
npm run db:push
```

Questo comando creerà automaticamente tutte le tabelle necessarie:
- `users` - Utenti e abbonamenti
- `betting_sessions` - Sessioni di betting
- `bets` - Scommesse delle sessioni
- `beat_delay_sessions` - Sessioni Beat the Delay
- `beat_delay_bets` - Scommesse Beat the Delay

## Schema Database

### Tabelle Principali

1. **betting_sessions**
   - Sessioni per tutte le strategie (Kelly, D'Alembert, Masaniello, etc.)
   - Traccia bankroll, vincite/perdite, configurazioni strategia

2. **bets**
   - Singole scommesse per ogni sessione
   - Traccia stake, odds, risultati, bankroll prima/dopo

3. **beat_delay_sessions**
   - Sessioni specifiche per la strategia Beat the Delay
   - Include metriche avanzate e configurazioni ML

4. **beat_delay_bets**
   - Scommesse Beat the Delay con dati analitici estesi
   - Include probabilità ML, indici di anomalia, tassi di recupero

## Funzionalità di Fallback

### localStorage Backup
L'applicazione implementa un sistema di fallback intelligente:

1. **Tentativo Server**: Prima prova a salvare/caricare dal database
2. **Fallback localStorage**: Se il server non è disponibile, usa localStorage
3. **Sincronizzazione**: Quando il server torna disponibile, i dati possono essere sincronizzati

### Vantaggi del Sistema Ibrido
- ✅ Funziona sempre, anche offline
- ✅ Dati persistenti localmente
- ✅ Sincronizzazione automatica quando possibile
- ✅ Esperienza utente fluida

## Migrazione da InMemory a Database

### Passo 1: Backup Dati Locali
I dati nel localStorage sono automaticamente preservati e possono essere esportati.

### Passo 2: Configurare PostgreSQL
Seguire i passi sopra per configurare DATABASE_URL.

### Passo 3: Riavviare Applicazione
```bash
npm run dev  # Per sviluppo
npm run build && npm start  # Per produzione
```

### Passo 4: Verifica
L'applicazione mostrerà nel log:
```
Using DatabaseStorage with PostgreSQL
```

## Troubleshooting

### Errore di Connessione Database
Se vedi errori di connessione:
1. Verifica che DATABASE_URL sia corretto
2. Controlla che il database sia accessibile
3. L'applicazione userà automaticamente InMemoryStorage come fallback

### Dati Mancanti
Se i dati sembrano persi:
1. Controlla il localStorage del browser (F12 > Application > Local Storage)
2. Verifica che il database sia configurato correttamente
3. I dati locali sono preservati fino alla sincronizzazione

### Performance
Per ottimizzare le performance:
1. Usa indici appropriati nel database
2. Configura connection pooling
3. Monitora le query lente

## Comandi Utili

```bash
# Sviluppo con InMemoryStorage
npm run dev

# Build per produzione
npm run build

# Avvio produzione
npm start

# Migrazione database
npm run db:push

# Controllo tipi TypeScript
npm run check
```

## Supporto

Per problemi di configurazione database:
1. Verifica i log dell'applicazione
2. Controlla la configurazione DATABASE_URL
3. Testa la connessione al database
4. Il sistema di fallback garantisce sempre il funzionamento base