import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { FaTicketAlt, FaWallet, FaUserCircle, FaQrcode, FaCalendarAlt, FaTools, FaCheckDouble } from 'react-icons/fa';

const Navbar = () => {
  const { account, connectWallet } = useContext(WalletContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar-custom">
      {/* LOGO */}
      <Link to="/" className="nav-logo">
        <FaTicketAlt style={{ marginRight: '8px' }} /> TicketGO
      </Link>
      
      {/* ENLACES CENTRALES */}
      <div className="nav-links-container">
        {/* ZONA USUARIO */}
        <div className="nav-group user-group">
            <Link to="/" className={`nav-item ${isActive('/')}`}>
                <FaCalendarAlt className="nav-icon" /> Eventos
            </Link>
            <Link to="/my-tickets" className={`nav-item ${isActive('/my-tickets')}`}>
                <FaTicketAlt className="nav-icon" /> Mis Entradas
            </Link>
        </div>

        {/* DIVISOR */}
        <div className="nav-divider"></div>

        {/* ZONA GESTIÓN (STAFF) */}
        <div className="nav-group staff-group">
            <Link to="/organizer" className={`nav-item staff-item ${isActive('/organizer')}`}>
                <FaTools className="nav-icon" /> Organizador
            </Link>
            <Link to="/validator" className={`nav-item staff-item ${isActive('/validator')}`}>
                <FaCheckDouble className="nav-icon" /> Validar
            </Link>
        </div>
      </div>

      {/* ZONA DERECHA: PERFIL Y WALLET */}
      <div className="nav-profile-section">
        {account && (
            <div className="profile-decoration" title="Tu Perfil">
                <FaUserCircle size={28} color="var(--text-muted)" />
                <span className="profile-status-dot"></span>
            </div>
        )}

        <button className="btn-primary-custom btn-wallet" onClick={!account ? connectWallet : null}>
          <FaWallet style={{ marginRight: '8px' }} />
          {account ? `${account.substring(0, 6)}...${account.substring(38)}` : "Conectar Wallet"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;