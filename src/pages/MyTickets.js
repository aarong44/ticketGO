import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { abis, addresses } from '../contracts';
import { toast, ToastContainer } from 'react-toastify';
import QRCode from 'react-qr-code'; // npm install react-qr-code

const MyTickets = () => {
  const { provider, account } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(0);
  const limit = 5; 

  useEffect(() => {
    if (account && provider) fetchTickets();
  }, [account, provider, page]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, provider);
      // Usamos la función paginada del backend
      const data = await contract.getTicketsByUserPaginated(account, page * limit, limit);
      
      // Formatear datos
      const formatted = data.map(t => ({
        id: t.id.toNumber(),
        eventId: t.eventId.toNumber(),
        state: t.state, // 0: Valid, 1: Used, 2: Refunded
        purchasePrice: t.purchasePrice
      }));
      setTickets(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (id) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      const tx = await contract.refundTicket(id);
      toast.info("Procesando reembolso...");
      await tx.wait();
      toast.success("Reembolso completado");
      fetchTickets(); // Recargar
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const getStatusBadge = (state) => {
    if (state === 0) return <span className="badge-status status-valid">Válida</span>;
    if (state === 1) return <span className="badge-status status-used">Usada</span>;
    if (state === 2) return <span className="badge-status status-refunded">Reembolsada</span>;
    return <span>Cancelada</span>;
  };

  return (
    <div className="page-container">
      <h2>Mis Entradas</h2>
      
      <div className="grid-container">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="custom-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>
                {/* QR contiene el ID del ticket para que el validador lo escanee */}
                <QRCode value={ticket.id.toString()} size={120} />
            </div>
            <h4>Ticket #{ticket.id}</h4>
            <p>Evento ID: {ticket.eventId}</p>
            <div style={{ marginBottom: '1rem' }}>{getStatusBadge(ticket.state)}</div>
            
            {ticket.state === 0 && (
                <button 
                    className="btn-outline-custom" 
                    onClick={() => requestRefund(ticket.id)}
                    style={{ fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                    Solicitar Reembolso
                </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page + 1}</span>
        <button className="btn-secondary" disabled={tickets.length < limit} onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>
      <ToastContainer theme="dark" />
    </div>
  );
};

export default MyTickets;