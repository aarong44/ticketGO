import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { abis, addresses } from '../contracts';
import { toast, ToastContainer } from 'react-toastify';
import QRCode from 'react-qr-code';

const MyTickets = () => {
  const { provider, account } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(0);
  const limit = 6; 

  // --- NUEVOS ESTADOS PARA TRANSFERENCIA ---
  const [transferTicketId, setTransferTicketId] = useState(null); // ID del ticket que se está transfiriendo
  const [transferToAddr, setTransferToAddr] = useState('');       // Dirección de destino

  useEffect(() => {
    if (account && provider) fetchTickets();
  }, [account, provider, page]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, provider);
      const data = await contract.getTicketsByUserPaginated(account, page * limit, limit);
      
      const formatted = data.map(t => ({
        id: t.id.toNumber(),
        eventId: t.eventId.toNumber(),
        state: t.state, // 0: Valid, 1: Used, 2: Refunded
        purchasePrice: t.purchasePrice
      }));
      // Filtramos tickets vacíos si la paginación devuelve huecos
      setTickets(formatted.filter(t => t.id !== 0));
    } catch (err) {
      console.error(err);
      toast.error("Error cargando entradas.");
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
      fetchTickets();
    } catch (err) {
      toast.error("Error: " + (err.reason || err.message));
    }
  };

  // --- NUEVA FUNCIÓN: TRANSFERIR ---
  const handleTransfer = async (id) => {
    if (!ethers.utils.isAddress(transferToAddr)) {
        return toast.warning("Dirección de destino inválida");
    }
    
    try {
        const signer = provider.getSigner();
        const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
        
        const tx = await contract.transferTicket(id, transferToAddr);
        toast.info("Transfiriendo entrada en Blockchain...");
        await tx.wait();
        
        toast.success(`Entrada #${id} transferida con éxito`);
        setTransferTicketId(null); // Reset UI
        setTransferToAddr('');
        fetchTickets(); // Recargar lista (la entrada desaparecerá)
    } catch (err) {
        toast.error("Error: " + (err.reason || err.message));
    }
  };

  const getStatusBadge = (state) => {
    if (state === 0) return <span className="badge-status status-valid">VÁLIDA</span>;
    if (state === 1) return <span className="badge-status status-used">USADA</span>;
    if (state === 2) return <span className="badge-status status-refunded">REEMBOLSADA</span>;
    return <span>CANCELADA</span>;
  };

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: '2rem' }}>Mis Entradas</h2>
      
      {loading ? <p>Cargando cartera...</p> : (
        <>
            <div className="grid-container">
                {tickets.length > 0 ? tickets.map((ticket) => (
                <div key={ticket.id} className="custom-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ticket.state !== 0 ? 0.6 : 1 }}>
                    
                    {/* QR Code */}
                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
                        <QRCode value={ticket.id.toString()} size={120} />
                    </div>
                    
                    <h4 style={{ margin: '0 0 5px 0' }}>Ticket #{ticket.id}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Evento ID: {ticket.eventId}</p>
                    <div style={{ margin: '1rem 0' }}>{getStatusBadge(ticket.state)}</div>
                    
                    {/* BOTONERA DE ACCIONES (Solo si es válida) */}
                    {ticket.state === 0 && (
                        <div style={{ width: '100%', marginTop: 'auto' }}>
                            
                            {/* MODO TRANSFERENCIA ACTIVO */}
                            {transferTicketId === ticket.id ? (
                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Dirección 0x..." 
                                        value={transferToAddr}
                                        onChange={(e) => setTransferToAddr(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--primary)', background: '#0f172a', color: 'white', marginBottom: '8px', fontSize: '0.85rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button 
                                            className="btn-primary-custom" 
                                            onClick={() => handleTransfer(ticket.id)}
                                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                                        >
                                            Confirmar
                                        </button>
                                        <button 
                                            className="btn-outline-custom" 
                                            onClick={() => { setTransferTicketId(null); setTransferToAddr(''); }}
                                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', color: 'var(--text-muted)', borderColor: '#444' }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* MODO NORMAL */
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className="btn-outline-custom" 
                                        onClick={() => setTransferTicketId(ticket.id)}
                                        style={{ flex: 1, fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                    >
                                        Transferir
                                    </button>
                                    <button 
                                        className="btn-outline-custom" 
                                        onClick={() => requestRefund(ticket.id)}
                                        style={{ flex: 1, fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    >
                                        Reembolsar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                )) : <p>No tienes entradas todavía.</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
                <button className="btn-outline-custom" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
                <span style={{ alignSelf: 'center' }}>Página {page + 1}</span>
                <button className="btn-outline-custom" disabled={tickets.length < limit} onClick={() => setPage(page + 1)}>Siguiente</button>
            </div>
        </>
      )}
      <ToastContainer theme="dark" />
    </div>
  );
};

export default MyTickets;