import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Organizer from './pages/Organizer'; // <--- Importar
import Validator from './pages/Validator';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            {/* Ruta activada */}
            <Route path="/organizer" element={<Organizer />} /> 
            <Route path="/validator" element={<Validator />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;