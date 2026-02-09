import React from 'react'
import AnimatedBackground from './components/AnimatedBackground'
import './App.css'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', color: '#e9f2ff', fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
      <AnimatedBackground intensity="medium" theme="arcane" colorMode="dark" />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          padding: '40px'
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            padding: 28,
            borderRadius: 18,
            border: '1px solid rgba(122, 198, 255, 0.25)',
            background: 'rgba(18, 24, 38, 0.9)',
            boxShadow: '0 22px 50px rgba(5,8,16,0.6)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <h1 style={{ margin: 0, fontFamily: 'Cinzel, serif', fontSize: 28 }}>Campaign Notes</h1>
          <p style={{ color: '#9ab0c7', lineHeight: 1.6 }}>
            Arcane aurora, drifting stardust, and soft mist — all tuned for readability.
            This card stays crisp while the background animates subtly.
          </p>
          <button
            style={{
              marginTop: 12,
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(51, 230, 255, 0.5)',
              background: 'linear-gradient(135deg, rgba(12, 22, 40, 0.9), rgba(18, 30, 52, 0.95))',
              color: '#e9f2ff',
              cursor: 'pointer'
            }}
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  )
}
