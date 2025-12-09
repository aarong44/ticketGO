// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // <--- IMPORTAR
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Organizer from './pages/Organizer';
import Validator from './pages/Validator';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          
          <div style={{ flex: 1 }}> {/* Empuja el footer abajo */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/organizer" element={<Organizer />} /> 
              <Route path="/validator" element={<Validator />} />
            </Routes>
          </div>

          <Footer />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;