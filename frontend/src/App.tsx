import React from 'react';
import './App.css';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          🛡️ Security Incident Response Dashboard
        </h1>
        <p style={{ color: '#6b7280', margin: '10px 0 0 0' }}>
          Monitor and respond to security incidents in real-time
        </p>
      </header>

      <main style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginBottom: '10px' }}>
            🚀 Frontend Successfully Running!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            The React frontend is now connected and ready to display security alerts.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>🚨 Critical Alerts</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>0</p>
            </div>
            
            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fed7aa', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ color: '#d97706', margin: '0 0 10px 0' }}>⚠️ High Priority</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706', margin: 0 }}>0</p>
            </div>
            
            <div style={{ backgroundColor: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ color: '#2563eb', margin: '0 0 10px 0' }}>📊 Total Events</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>0</p>
            </div>
          </div>

          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <h3 style={{ color: '#374151', marginTop: 0 }}>🔧 Next Steps</h3>
            <ul style={{ textAlign: 'left', color: '#6b7280', paddingLeft: '20px' }}>
              <li>Start the backend API server to connect to Azure Log Analytics</li>
              <li>Configure Elasticsearch and Logstash services</li>
              <li>Begin monitoring security events in real-time</li>
              <li>Set up custom alert rules for your organization</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
