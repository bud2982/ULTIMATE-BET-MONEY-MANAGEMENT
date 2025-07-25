// Script di test per le API Beat the Delay Sessions
const API_BASE = 'http://localhost:3000/api';

async function testBeatDelayAPI() {
  console.log('🧪 Testing Beat the Delay Sessions API...\n');

  try {
    // Test 1: Get all sessions (should be empty initially)
    console.log('1️⃣ Testing GET /api/beat-delay-sessions');
    const sessionsResponse = await fetch(`${API_BASE}/beat-delay-sessions`, {
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', sessionsResponse.status);
    console.log('Response headers:', Object.fromEntries(sessionsResponse.headers.entries()));
    
    const responseText = await sessionsResponse.text();
    console.log('Raw response:', responseText.substring(0, 200) + '...');
    
    let sessions;
    try {
      sessions = JSON.parse(responseText);
    } catch (e) {
      console.log('Failed to parse JSON, response was HTML or other format');
      return;
    }
    console.log('✅ Sessions retrieved:', sessions.length, 'sessions');
    console.log('📊 Sessions data:', sessions);

    // Test 2: Create a new session
    console.log('\n2️⃣ Testing POST /api/beat-delay-sessions');
    const newSession = {
      sessionName: `Test Session ${new Date().toISOString()}`,
      initialBankroll: 1000,
      baseStake: 10,
      targetReturn: 30,
      stopLoss: 6,
      notes: 'Test session created via API'
    };

    const createResponse = await fetch(`${API_BASE}/beat-delay-sessions`, {
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
    console.log('✅ Session created with ID:', createdSession.id);
    console.log('📊 Created session:', createdSession);

    // Test 3: Get specific session
    console.log('\n3️⃣ Testing GET /api/beat-delay-sessions/:id');
    const sessionResponse = await fetch(`${API_BASE}/beat-delay-sessions/${createdSession.id}`);
    const sessionData = await sessionResponse.json();
    console.log('✅ Session retrieved:', sessionData.session.sessionName);

    // Test 4: Add a bet to the session
    console.log('\n4️⃣ Testing POST /api/beat-delay-sessions/:id/bets');
    const testBet = {
      sessionId: createdSession.id,
      betNumber: 1,
      stake: 10,
      odds: 2.5,
      potentialWin: 25,
      win: true,
      bankrollBefore: 1000,
      bankrollAfter: 1015,
      currentSign: 'X',
      currentDelay: 8,
      historicalFrequency: 35,
      avgDelay: 11,
      maxDelay: 18,
      captureRate: 75,
      estimatedProbability: 0.45,
      expectedValue: 0.125,
      shouldPlay: true,
      anomalyIndex: 0.3,
      recoveryRate: 0.15,
      mlProbability: 0.52,
      mlConfidence: 0.78,
      combinedProbability: 0.485,
      combinedEV: 0.138,
    };

    const betResponse = await fetch(`${API_BASE}/beat-delay-sessions/${createdSession.id}/bets`, {
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
      totalBets: betResult.session.totalBets,
      winRate: betResult.session.winRate.toFixed(1) + '%',
      roi: betResult.session.roi.toFixed(1) + '%',
      profitLoss: betResult.session.profitLoss
    });

    // Test 5: Get session bets
    console.log('\n5️⃣ Testing GET /api/beat-delay-sessions/:id/bets');
    const betsResponse = await fetch(`${API_BASE}/beat-delay-sessions/${createdSession.id}/bets`);
    const bets = await betsResponse.json();
    console.log('✅ Bets retrieved:', bets.length, 'bets');
    console.log('📊 First bet details:', bets[0]);

    // Test 6: Update session
    console.log('\n6️⃣ Testing PATCH /api/beat-delay-sessions/:id');
    const updateData = {
      notes: 'Updated via API test - ' + new Date().toISOString()
    };

    const updateResponse = await fetch(`${API_BASE}/beat-delay-sessions/${createdSession.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Update session failed: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const updatedSession = await updateResponse.json();
    console.log('✅ Session updated successfully');
    console.log('📊 Updated notes:', updatedSession.notes);

    // Test 7: Get all sessions again (should show our created session)
    console.log('\n7️⃣ Testing GET /api/beat-delay-sessions (final check)');
    const finalSessionsResponse = await fetch(`${API_BASE}/beat-delay-sessions`);
    const finalSessions = await finalSessionsResponse.json();
    console.log('✅ Final sessions count:', finalSessions.length);

    console.log('\n🎉 All tests completed successfully!');
    console.log('✨ Beat the Delay Sessions API is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testBeatDelayAPI();