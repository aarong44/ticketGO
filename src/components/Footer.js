import React from 'react';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="page-container">
        <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>TicketGO</h3>
        </div>
        
        <div className="footer-links">
          <a href="#!" className="footer-link">Términos y Condiciones</a>
          <a href="#!" className="footer-link">Política de Privacidad</a>
          <a href="#!" className="footer-link">Cookies</a>
          <a href="#!" className="footer-link">Soporte Organizadores</a>
          <a href="#!" className="footer-link">Seguridad Blockchain</a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <FaGithub size={20} color="#94a3b8" style={{cursor: 'pointer'}} />
            <FaTwitter size={20} color="#94a3b8" style={{cursor: 'pointer'}} />
            <FaLinkedin size={20} color="#94a3b8" style={{cursor: 'pointer'}} />
        </div>

        <div className="footer-copy">
          <p>&copy; {new Date().getFullYear()} TicketGO Decentralized Ticketing S.L. Todos los derechos reservados.</p>
          <p style={{fontSize: '0.7rem', marginTop: '0.5rem'}}>Proyecto Académico - Universidad de A Coruña</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;