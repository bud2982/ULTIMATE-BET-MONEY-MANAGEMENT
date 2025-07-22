import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onNewSession: () => void;
}

export default function Header({ onNewSession }: HeaderProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      <div 
        id="top-header" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 15px',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎮</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>TOP BET</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'rgba(255,255,255,0.9)',
              color: '#333',
              padding: '10px 15px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              userSelect: 'none',
              border: 'none',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            ☰ MENU
          </div>
          
          <div
            onClick={onNewSession}
            style={{
              background: '#4CAF50',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              userSelect: 'none',
              border: 'none',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            + NUOVO
          </div>
        </div>
      </div>
      
      {/* Spacer per compensare l'header fisso */}
      <div style={{ height: '60px' }}></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            left: '15px',
            right: '15px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 9998,
            border: '1px solid #ddd'
          }}
        >
          <div style={{ padding: '20px' }}>
            {isAuthenticated && (
              <>
                <div 
                  onClick={() => {
                    navigate('/pricing');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  💳 Piani e Abbonamenti
                </div>
                
                <div 
                  onClick={() => {
                    navigate('/account');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  👤 Account
                </div>
                
                <div 
                  onClick={() => {
                    navigate('/demo-invite');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '15px',
                    marginBottom: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  🛡️ Demo per Amici
                </div>
              </>
            )}
            
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <div 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '15px',
                  textAlign: 'center',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Chiudi Menu
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
