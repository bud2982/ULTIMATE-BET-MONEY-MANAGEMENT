import React from 'react';

// App originale con grafica professionale
function App() {
  const [sessions, setSessions] = React.useState([]);
  const [currentStrategy, setCurrentStrategy] = React.useState('percentage');
  const [betCount, setBetCount] = React.useState(0);
  const [winRate, setWinRate] = React.useState(0);
  const [bankroll, setBankroll] = React.useState(1000);
  
  const startSession = () => {
    setBetCount(1);
    setWinRate(100);
  };

  const configureStrategy = () => {
    alert('Strategy configured: ' + currentStrategy);
  };

  const viewAnalytics = () => {
    alert('Analytics view activated');
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      alert('Health Check: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      alert('Health check failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const testAPI = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      alert('API Test: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      alert('API test failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#333',
      lineHeight: 1.6,
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          background: 'rgba(255,255,255,0.95)',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h1 style={{
            fontSize: '3rem',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px',
            margin: 0
          }}>Money Management Pro</h1>
          <p style={{
            color: '#666',
            fontSize: '1.2rem',
            margin: '10px 0'
          }}>Advanced Betting Bankroll Management System</p>
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            color: '#4CAF50',
            padding: '15px',
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>🟢 System Online - Server Operational</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px',
          marginBottom: '40px'
        }}>
          {/* Strategy Selection */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s ease'
          }}>
            <h3 style={{
              color: '#333',
              marginBottom: '20px',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              marginTop: 0
            }}>
              <span style={{ marginRight: '10px', fontSize: '1.2em' }}>🎯</span>
              Strategy Selection
            </h3>
            <select 
              value={currentStrategy}
              onChange={(e) => setCurrentStrategy(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'white'
              }}
            >
              <option value="percentage">Percentage Strategy</option>
              <option value="dalembert">D'Alembert System</option>
              <option value="kelly">Kelly Criterion</option>
              <option value="masaniello">Masaniello Method</option>
              <option value="beat-delay">Beat the Delay (AI Enhanced)</option>
            </select>
            <button 
              onClick={configureStrategy}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '15px 25px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)',
                marginTop: '20px',
                width: '100%'
              }}
            >
              Configure Strategy
            </button>
          </div>

          {/* Current Session */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s ease'
          }}>
            <h3 style={{
              color: '#333',
              marginBottom: '20px',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              marginTop: 0
            }}>
              <span style={{ marginRight: '10px', fontSize: '1.2em' }}>📊</span>
              Current Session
            </h3>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Strategy:</strong>
              <span>{currentStrategy.charAt(0).toUpperCase() + currentStrategy.slice(1)} <span style={{
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>ACTIVE</span></span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Bankroll:</strong>
              <span>€{bankroll.toFixed(2)}</span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Bets:</strong>
              <span>{betCount}</span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Win Rate:</strong>
              <span>{winRate}%</span>
            </div>
            <button 
              onClick={startSession}
              style={{
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                boxShadow: '0 5px 15px rgba(76, 175, 80, 0.3)',
                color: 'white',
                border: 'none',
                padding: '15px 25px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%',
                marginTop: '20px'
              }}
            >
              Start New Session
            </button>
          </div>

          {/* Performance */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s ease'
          }}>
            <h3 style={{
              color: '#333',
              marginBottom: '20px',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              marginTop: 0
            }}>
              <span style={{ marginRight: '10px', fontSize: '1.2em' }}>📈</span>
              Performance
            </h3>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Total Sessions:</strong>
              <span>{sessions.length}</span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>ROI:</strong>
              <span>0%</span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Max Drawdown:</strong>
              <span>0%</span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ color: '#667eea' }}>Status:</strong>
              <span style={{ color: '#4CAF50' }}>Ready to Trade</span>
            </div>
            <button 
              onClick={viewAnalytics}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '15px 25px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%',
                marginTop: '20px'
              }}
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Premium Features */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
          padding: '50px 40px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '40px'
        }}>
          <h2 style={{
            marginBottom: '30px',
            fontSize: '2.5rem',
            marginTop: 0
          }}>Premium Features Available</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            marginTop: '30px'
          }}>
            <div style={{
              padding: '25px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              backdropFilter: 'blur(5px)'
            }}>
              <h4 style={{
                marginBottom: '15px',
                fontSize: '1.3rem',
                marginTop: 0
              }}>🧮 Advanced Strategies</h4>
              <p>Kelly Criterion, D'Alembert, Masaniello, Beat the Delay with machine learning predictions</p>
            </div>
            <div style={{
              padding: '25px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              backdropFilter: 'blur(5px)'
            }}>
              <h4 style={{
                marginBottom: '15px',
                fontSize: '1.3rem',
                marginTop: 0
              }}>📊 Real-time Analytics</h4>
              <p>Live performance tracking, detailed statistics, trend analysis and risk metrics</p>
            </div>
            <div style={{
              padding: '25px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              backdropFilter: 'blur(5px)'
            }}>
              <h4 style={{
                marginBottom: '15px',
                fontSize: '1.3rem',
                marginTop: 0
              }}>🔄 Multi-device Sync</h4>
              <p>Access your data from any device with secure cloud synchronization</p>
            </div>
            <div style={{
              padding: '25px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              backdropFilter: 'blur(5px)'
            }}>
              <h4 style={{
                marginBottom: '15px',
                fontSize: '1.3rem',
                marginTop: 0
              }}>🛡️ Professional Tools</h4>
              <p>Bankroll optimization, automated risk management, and intelligent alerts</p>
            </div>
          </div>
        </div>

        {/* System Test */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <h3 style={{
            color: '#4CAF50',
            marginBottom: '15px',
            marginTop: 0
          }}>🔧 System Test</h3>
          <button 
            onClick={testHealthCheck}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '15px 25px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            Test Health Check
          </button>
          <button 
            onClick={testAPI}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '15px 25px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Test API
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;