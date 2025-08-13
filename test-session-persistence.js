#!/usr/bin/env node

/**
 * Test Script per Verificare la Persistenza delle Sessioni
 * 
 * Questo script testa:
 * 1. Creazione di una nuova sessione di betting
 * 2. Aggiunta di scommesse alla sessione  
 * 3. Verifica che i dati siano salvati nel database SQLite
 * 4. Persistenza dopo riavvio dell'applicazione
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

// Funzione per aspettare un po'
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test di creazione sessione
async function createTestSession() {
  console.log('\n🧪 TEST: Creazione Sessione di Betting...');
  
  const sessionData = {
    name: `Test Session ${new Date().toISOString()}`,
    initialBankroll: 1000,
    currentBankroll: 1000,
    targetReturn: 10,
    strategy: 'Kelly Criterion',
    strategySettings: JSON.stringify({
      kelly_fraction: 0.25,
      min_bet: 10,
      max_bet: 100
    })
  };

  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const session = await response.json();
    console.log('✅ Sessione creata con successo:', {
      id: session.id,
      name: session.name,
      bankroll: session.currentBankroll
    });
    
    return session;
  } catch (error) {
    console.error('❌ Errore nella creazione della sessione:', error.message);
    throw error;
  }
}

// Test di aggiunta scommessa
async function addTestBet(sessionId) {
  console.log('\n🧪 TEST: Aggiunta Scommessa...');
  
  const betData = {
    betNumber: 1,
    stake: 50,
    odds: 2.0,
    potentialWin: 100,
    win: true,
    bankrollBefore: 1000,
    bankrollAfter: 1050
  };

  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(betData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Scommessa aggiunta con successo:', {
      betId: result.bet?.id,
      stake: result.bet?.stake,
      win: result.bet?.win,
      newBankroll: result.session?.currentBankroll
    });
    
    return result;
  } catch (error) {
    console.error('❌ Errore nell\'aggiunta della scommessa:', error.message);
    throw error;
  }
}

// Test di recupero sessioni
async function getAllSessions() {
  console.log('\n🧪 TEST: Recupero Tutte le Sessioni...');
  
  try {
    const response = await fetch(`${API_BASE}/sessions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const sessions = await response.json();
    console.log(`✅ Trovate ${sessions.length} sessioni:`);
    
    sessions.forEach(session => {
      console.log(`  • ID: ${session.id} | Nome: ${session.name} | Bankroll: €${session.currentBankroll} | Scommesse: ${session.betCount}`);
    });
    
    return sessions;
  } catch (error) {
    console.error('❌ Errore nel recupero delle sessioni:', error.message);
    throw error;
  }
}

// Test di recupero scommesse per una sessione
async function getBetsForSession(sessionId) {
  console.log(`\n🧪 TEST: Recupero Scommesse per Sessione ${sessionId}...`);
  
  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/bets`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bets = await response.json();
    console.log(`✅ Trovate ${bets.length} scommesse:`);
    
    bets.forEach(bet => {
      console.log(`  • Scommessa #${bet.betNumber} | €${bet.stake} @ ${bet.odds} | ${bet.win ? 'VINTA' : 'PERSA'} | Bankroll: €${bet.bankrollAfter}`);
    });
    
    return bets;
  } catch (error) {
    console.error('❌ Errore nel recupero delle scommesse:', error.message);
    throw error;
  }
}

// Funzione principale di test
async function runTests() {
  try {
    console.log('🚀 INIZIO TEST DI PERSISTENZA DELLE SESSIONI\n');
    
    // Aspetta che il server sia pronto
    await sleep(2000);
    
    // Test 1: Controlla sessioni esistenti
    const existingSessions = await getAllSessions();
    
    // Test 2: Crea una nuova sessione
    const newSession = await createTestSession();
    
    // Test 3: Aggiungi una scommessa
    await addTestBet(newSession.id);
    
    // Test 4: Verifica che la sessione sia stata aggiornata
    await sleep(1000); // Aspetta che il database si aggiorni
    const updatedSessions = await getAllSessions();
    
    // Test 5: Verifica le scommesse della sessione
    await getBetsForSession(newSession.id);
    
    console.log('\n🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!');
    console.log('\n📝 ISTRUZIONI PER VERIFICARE LA PERSISTENZA:');
    console.log('1. Ferma il server (Ctrl+C)');
    console.log('2. Riavvia il server (npm run dev)');
    console.log('3. Esegui nuovamente questo script');
    console.log('4. Verifica che le sessioni create siano ancora presenti');
    console.log('\n💾 Le sessioni dovrebbero essere salvate in: ./data/ultimate_bet.db');
    
  } catch (error) {
    console.error('\n💥 TEST FALLITO:', error.message);
    console.log('\n🔍 Possibili cause:');
    console.log('- Il server non è avviato (npm run dev)');
    console.log('- Problemi con il database SQLite');
    console.log('- Errori nelle API endpoints');
    
    process.exit(1);
  }
}

// Avvia i test
runTests();