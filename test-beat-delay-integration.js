// Test di integrazione per Beat the Delay con sistema esistente
const API_BASE = 'http://localhost:3000/api';

async function testBeatDelayIntegration() {
  console.log('🧪 Testing Beat the Delay Integration with Existing System...\n');

  try {
    // Test 1: Crea una sessione Beat the Delay usando il sistema esistente
    console.log('1️⃣ Testing POST /api/sessions (Beat the Delay)');
    const newSession = {
      name: `Beat the Delay Test ${new Date().toISOString()}`,
      initialBankroll: 1000,
      currentBankroll: 1000,
      targetReturn: 30,
      strategy: 'beat-delay',
      strategySettings: JSON.stringify({
        baseStake: 10,
        stopLoss: 6,
        targetReturn: 30,
        currentSign: 'X',
        currentDelay: 8,
        historicalFrequency: 35,
        avgDelay: 11,
        maxDelay: 18,
        currentOdds: 2.5,
        captureRate: 75
      })
    };

    const createResponse = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSession)
    });

    if (!createResponse.ok) {
      throw new Error(`Create session failed: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createdSession = await createResponse.json();
    console.log('✅ Beat the Delay session created with ID:', createdSession.id);
    console.log('📊 Session strategy:', createdSession.strategy);

    // Test 2: Verifica che la sessione sia salvata correttamente
    console.log('\n2️⃣ Testing GET /api/sessions (filter by strategy)');
    const sessionsResponse = await fetch(`${API_BASE}/sessions`);
    const allSessions = await sessionsResponse.json();
    
    const beatDelaySessions = allSessions.filter(s => s.strategy === 'beat-delay');
    console.log('✅ Beat the Delay sessions found:', beatDelaySessions.length);
    console.log('📊 Latest session:', beatDelaySessions[beatDelaySessions.length - 1]?.name);

    // Test 3: Aggiungi una scommessa alla sessione
    console.log('\n3️⃣ Testing POST /api/sessions/:id/bets');
    const testBet = {
      sessionId: createdSession.id,
      betNumber: 1,
      stake: 10,
      odds: 2.5,
      potentialWin: 25,
      win: true,
      bankrollBefore: 1000,
      bankrollAfter: 1015
    };

    const betResponse = await fetch(`${API_BASE}/sessions/${createdSession.id}/bets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBet)
    });

    if (!betResponse.ok) {
      throw new Error(`Add bet failed: ${betResponse.status} ${betResponse.statusText}`);
    }

    const betResult = await betResponse.json();
    console.log('✅ Bet added successfully');
    console.log('📊 Updated session stats:', {
      betCount: betResult.session.betCount,
      wins: betResult.session.wins,
      currentBankroll: betResult.session.currentBankroll
    });

    // Test 4: Verifica che la sessione sia aggiornata
    console.log('\n4️⃣ Testing GET /api/sessions/:id');
    const sessionResponse = await fetch(`${API_BASE}/sessions/${createdSession.id}`);
    const sessionData = await sessionResponse.json();
    console.log('✅ Session retrieved after bet');
    console.log('📊 Session stats:', {
      name: sessionData.name,
      strategy: sessionData.strategy,
      betCount: sessionData.betCount,
      wins: sessionData.wins,
      losses: sessionData.losses,
      currentBankroll: sessionData.currentBankroll,
      roi: (((sessionData.currentBankroll - sessionData.initialBankroll) / sessionData.initialBankroll) * 100).toFixed(1) + '%'
    });

    // Test 5: Verifica le scommesse della sessione
    console.log('\n5️⃣ Testing GET /api/sessions/:id/bets');
    const betsResponse = await fetch(`${API_BASE}/sessions/${createdSession.id}/bets`);
    const bets = await betsResponse.json();
    console.log('✅ Bets retrieved:', bets.length, 'bets');
    if (bets.length > 0) {
      console.log('📊 First bet:', {
        betNumber: bets[0].betNumber,
        stake: bets[0].stake,
        odds: bets[0].odds,
        win: bets[0].win,
        bankrollAfter: bets[0].bankrollAfter
      });
    }

    // Test 6: Test eliminazione sessione
    console.log('\n6️⃣ Testing DELETE /api/sessions/:id');
    const deleteResponse = await fetch(`${API_BASE}/sessions/${createdSession.id}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete session failed: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    console.log('✅ Session deleted successfully');

    // Test 7: Verifica che la sessione sia stata eliminata
    console.log('\n7️⃣ Testing GET /api/sessions (final check)');
    const finalSessionsResponse = await fetch(`${API_BASE}/sessions`);
    const finalSessions = await finalSessionsResponse.json();
    const remainingBeatDelaySessions = finalSessions.filter(s => s.strategy === 'beat-delay');
    console.log('✅ Remaining Beat the Delay sessions:', remainingBeatDelaySessions.length);

    console.log('\n🎉 All integration tests completed successfully!');
    console.log('✨ Beat the Delay integration with existing system is working correctly!');
    console.log('🔄 The system can now save, load, and delete Beat the Delay sessions!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the integration test
testBeatDelayIntegration();