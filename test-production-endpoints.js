// Test script for production endpoints
// Usage: node test-production-endpoints.js [URL]
// Example: node test-production-endpoints.js https://your-app.onrender.com

const baseUrl = process.argv[2] || 'http://localhost:10000';

console.log('🧪 TESTING PRODUCTION ENDPOINTS');
console.log('================================');
console.log(`Base URL: ${baseUrl}`);
console.log('');

async function testEndpoint(path, expectedStatus = 200, method = 'GET', body = null) {
  try {
    const url = `${baseUrl}${path}`;
    console.log(`Testing ${method} ${path}...`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    const success = status === expectedStatus;
    
    console.log(`  ${success ? '✅' : '❌'} Status: ${status} (expected: ${expectedStatus})`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = await response.json();
        console.log(`  📄 Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (e) {
        console.log(`  📄 Response: [JSON parse error]`);
      }
    } else {
      const text = await response.text();
      console.log(`  📄 Response: ${text.substring(0, 100)}...`);
    }
    
    return success;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const tests = [
    // Health check
    { path: '/health', expectedStatus: 200 },
    
    // Frontend
    { path: '/', expectedStatus: 200 },
    
    // API endpoints
    { path: '/api/auth/user', expectedStatus: 200 },
    { path: '/api/sessions', expectedStatus: 200 },
    
    // Test POST endpoint
    { 
      path: '/api/sessions', 
      expectedStatus: 201, 
      method: 'POST',
      body: {
        name: 'Test Session',
        strategy: 'percentage',
        initialBankroll: 1000,
        targetProfit: 100,
        maxLoss: 200
      }
    },
    
    // SPA routes (should return 200 with HTML)
    { path: '/strategia/percentage', expectedStatus: 200 },
    { path: '/account', expectedStatus: 200 },
    { path: '/pricing', expectedStatus: 200 },
    
    // 404 for non-existent API endpoint
    { path: '/api/nonexistent', expectedStatus: 404 },
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(
      test.path, 
      test.expectedStatus, 
      test.method || 'GET',
      test.body
    );
    if (success) passed++;
    console.log('');
  }
  
  console.log('🏁 TEST RESULTS');
  console.log('===============');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('✅ All tests passed! Application is working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
  }
  
  return passed === total;
}

// Run the tests
runTests().catch(console.error);