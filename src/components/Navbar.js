import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { FaTicketAlt, FaWallet } from 'react-icons/fa';

const Navbar = () => {
  const { account, connectWallet } = useContext(WalletContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar-custom">
      <Link to="/" className="nav-logo">
        <FaTicketAlt style={{ marginRight: '8px' }} /> TicketGO
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={isActive('/')}>Eventos</Link>
        <Link to="/my-tickets" className={isActive('/my-tickets')}>Mis Entradas</Link>
        <Link to="/organizer" className={isActive('/organizer')}>Organizador</Link>
        <Link to="/validator" className={isActive('/validator')}>Validar</Link>
      </div>

      <button className="btn-primary-custom" onClick={!account ? connectWallet : null}>
        <FaWallet style={{ marginRight: '8px' }} />
        {account ? `${account.substring(0, 6)}...${account.substring(38)}` : "Conectar Wallet"}
      </button>
    </nav>
  );
};

export default Navbar;