import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface SimpleHeaderProps {
  onNewSession: () => void;
}

export default function SimpleHeader({ onNewSession }: SimpleHeaderProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      {/* Header fisso */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          backgroundColor: '#1e40af',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          zIndex: 10000,
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          🎮 TOP BET
        </div>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{
              backgroundColor: 'white',
              color: '#1e40af',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              userSelect: 'none'
            }}
          >
            MENU
          </div>
          
          <div
            onClick={onNewSession}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              userSelect: 'none'
            }}
          >
            NUOVO
          </div>
        </div>
      </div>

      {/* Spazio per compensare header fisso */}
      <div style={{ height: '50px' }}></div>

      {/* Menu dropdown */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: '50px',
            right: '10px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            minWidth: '200px'
          }}
        >
          {isAuthenticated && (
            <>
              <div
                onClick={() => {
                  navigate('/pricing');
                  setShowMenu(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                💳 Piani e Abbonamenti
              </div>
              
              <div
                onClick={() => {
                  navigate('/account');
                  setShowMenu(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                👤 Account
              </div>
              
              <div
                onClick={() => {
                  navigate('/demo-invite');
                  setShowMenu(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                🛡️ Demo per Amici
              </div>
            </>
          )}
          
          <div
            onClick={() => setShowMenu(false)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Chiudi
          </div>
        </div>
      )}
    </div>
  );
}