import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { abis, addresses } from '../contracts';
import { toast, ToastContainer } from 'react-toastify';
import { FaPowerOff, FaCheckCircle, FaTimesCircle, FaUserShield, FaBan, FaGift } from 'react-icons/fa';

const Organizer = () => {
  const { provider, account } = useContext(WalletContext);
  
  // Estado para gestión de Eventos
  const [newEventName, setNewEventName] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('');
  const [events, setEvents] = useState([]);
  
  // Estado para Admin Mint (Regalos)
  const [mintTo, setMintTo] = useState('');
  const [mintEventId, setMintEventId] = useState('');

  // Estado para Gestión de Roles (NUEVO)
  const [roleAddress, setRoleAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('VALIDATOR'); // 'VALIDATOR' o 'ORGANIZER'
  const [roleAction, setRoleAction] = useState('GRANT'); // 'GRANT' o 'REVOKE'

  // Estado para Gestión de Tickets (NUEVO)
  const [refundTicketId, setRefundTicketId] = useState('');

  // Estados generales
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (provider && account) {
      checkRoleAndLoadData();
    }
  }, [provider, account]);

  const checkRoleAndLoadData = async () => {
    try {
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, provider);
      
      const ORG_ROLE = await contract.ORGANIZER_ROLE();
      const hasRole = await contract.hasRole(ORG_ROLE, account);
      setIsOrganizer(hasRole);

      if (hasRole) {
        const loadedEvents = [];
        // Cargamos una cantidad razonable de eventos para la demo
        for (let i = 1; i < 20; i++) {
            try {
                const evt = await contract.events(i);
                if (evt.id.toString() === "0") break;
                loadedEvents.push({
                    id: evt.id.toNumber(),
                    name: evt.name,
                    price: ethers.utils.formatEther(evt.ticketPrice),
                    isActive: evt.isActive
                });
            } catch { break; }
        }
        setEvents(loadedEvents);
      }
    } catch (err) {
      console.error("Error verificando rol:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONES DE EVENTOS ---

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      
      const priceWei = ethers.utils.parseEther(newEventPrice);
      const tx = await contract.createEvent(newEventName, priceWei);
      
      toast.info("Creando evento...");
      await tx.wait();
      toast.success("¡Evento creado correctamente!");
      
      setNewEventName('');
      setNewEventPrice('');
      checkRoleAndLoadData();
    } catch (err) {
      toast.error("Error: " + (err.reason || err.message));
    }
  };

  const toggleEvent = async (id) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      const tx = await contract.toggleEventStatus(id);
      toast.info("Actualizando estado...");
      await tx.wait();
      toast.success("Estado actualizado");
      checkRoleAndLoadData();
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const withdrawFunds = async () => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      const tx = await contract.withdrawFunds();
      toast.info("Retirando fondos...");
      await tx.wait();
      toast.success("¡Fondos transferidos!");
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // --- FUNCIONES DE ROLES (NUEVO) ---

  const manageRole = async () => {
    if (!roleAddress || !ethers.utils.isAddress(roleAddress)) return toast.warning("Dirección inválida");
    
    try {
        const signer = provider.getSigner();
        const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
        
        // Obtenemos el hash del rol directamente del contrato
        let roleHash;
        if (selectedRole === 'ORGANIZER') roleHash = await contract.ORGANIZER_ROLE();
        else roleHash = await contract.VALIDATOR_ROLE();

        let tx;
        if (roleAction === 'GRANT') {
            tx = await contract.grantRole(roleHash, roleAddress);
            toast.info(`Otorgando rol ${selectedRole}...`);
        } else {
            tx = await contract.revokeRole(roleHash, roleAddress);
            toast.info(`Revocando rol ${selectedRole}...`);
        }

        await tx.wait();
        toast.success(`Rol ${roleAction === 'GRANT' ? 'otorgado' : 'revocado'} con éxito`);
        setRoleAddress('');
    } catch (err) {
        toast.error("Error gestionando rol: " + (err.reason || err.message));
    }
  };

  // --- FUNCIONES DE TICKETS (NUEVO) ---

  const adminRefundTicket = async () => {
      if (!refundTicketId) return;
      try {
          const signer = provider.getSigner();
          const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
          
          const tx = await contract.refundTicket(refundTicketId);
          toast.info(`Procesando anulación del Ticket #${refundTicketId}...`);
          await tx.wait();
          toast.success("Ticket anulado y fondos reembolsados");
          setRefundTicketId('');
      } catch (err) {
          toast.error("Error: " + (err.reason || err.message));
      }
  };

  // --- RENDER ---

  if (loading) return <div className="page-container"><p>Verificando permisos...</p></div>;

  if (!isOrganizer) {
    return (
      <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--danger)' }}>Acceso Restringido</h2>
        <p>Esta área es exclusiva para los organizadores del contrato.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Panel de Control</h1>
        <button className="btn-primary-custom" onClick={withdrawFunds} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
           Retirar Fondos Acumulados
        </button>
      </header>

      {/* GRID SUPERIOR: CREAR Y LISTAR EVENTOS */}
      <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* PANEL 1: CREAR EVENTO */}
        <div className="custom-card">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>Nuevo Evento</h3>
          <form onSubmit={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input 
                type="text" 
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="Nombre del Evento"
                style={inputStyle}
                required
            />
            <input 
                type="number" 
                step="0.0001"
                value={newEventPrice}
                onChange={(e) => setNewEventPrice(e.target.value)}
                placeholder="Precio en ETH (ej. 0.05)"
                style={inputStyle}
                required
            />
            <button type="submit" className="btn-primary-custom" style={{ marginTop: '0.5rem' }}>
              Publicar en Blockchain
            </button>
          </form>
        </div>

        {/* PANEL 2: LISTADO */}
        <div className="custom-card">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>Eventos Activos</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {events.length === 0 ? <p className="text-muted">No hay eventos.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <tbody>
                  {events.map(evt => (
                    <tr key={evt.id} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '12px 5px' }}>#{evt.id}</td>
                      <td><strong>{evt.name}</strong></td>
                      <td>{evt.price} ETH</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-outline-custom"
                          onClick={() => toggleEvent(evt.id)}
                          title={evt.isActive ? "Pausar Ventas" : "Activar Ventas"}
                          style={{ borderColor: evt.isActive ? 'var(--success)' : 'var(--danger)', color: evt.isActive ? 'var(--success)' : 'var(--danger)' }}
                        >
                          {evt.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* GRID INFERIOR: GESTIÓN AVANZADA */}
      <h2 style={{marginTop: '3rem', marginBottom: '1rem'}}>Gestión Avanzada</h2>
      <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

        {/* PANEL 3: EMISIÓN DE REGALOS (AIRDROP) */}
        <div className="custom-card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}> <FaGift color="var(--accent)" /> Regalar Entrada</h3>
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Emite una entrada gratis a una wallet específica.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <input type="text" placeholder="Wallet Destino (0x...)" value={mintTo} onChange={e=>setMintTo(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="ID Evento" value={mintEventId} onChange={e=>setMintEventId(e.target.value)} style={inputStyle} />
                <button className="btn-primary-custom" onClick={async () => {
                    if(!mintTo || !mintEventId) return toast.warning("Faltan datos");
                    try {
                        const signer = provider.getSigner();
                        const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
                        const tx = await contract.adminMint(mintTo, mintEventId, "ipfs://gift", 0, { value: 0 });
                        toast.info("Enviando...");
                        await tx.wait();
                        toast.success("¡Enviado!");
                        setMintTo(''); setMintEventId('');
                    } catch(e) { toast.error(e.message) }
                }}>Enviar Regalo</button>
            </div>
        </div>

        {/* PANEL 4: GESTIÓN DE ROLES */}
        <div className="custom-card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}> <FaUserShield color="var(--primary)" /> Gestión de Roles</h3>
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Añade o elimina personal autorizado.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <input 
                    type="text" 
                    placeholder="Wallet del Empleado (0x...)" 
                    value={roleAddress} 
                    onChange={e=>setRoleAddress(e.target.value)} 
                    style={inputStyle} 
                />
                <div style={{display: 'flex', gap: '10px'}}>
                    <select 
                        value={selectedRole} 
                        onChange={e=>setSelectedRole(e.target.value)}
                        style={{...inputStyle, flex: 1}}
                    >
                        <option value="VALIDATOR">Validador (Portero)</option>
                        <option value="ORGANIZER">Organizador</option>
                    </select>
                    <select 
                        value={roleAction} 
                        onChange={e=>setRoleAction(e.target.value)}
                        style={{...inputStyle, flex: 1, color: roleAction === 'REVOKE' ? 'var(--danger)' : 'var(--success)'}}
                    >
                        <option value="GRANT">Otorgar</option>
                        <option value="REVOKE">Revocar</option>
                    </select>
                </div>
                <button className="btn-outline-custom" onClick={manageRole}>
                    Ejecutar Acción
                </button>
            </div>
        </div>

        {/* PANEL 5: ANULACIÓN MANUAL */}
        <div className="custom-card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}> <FaBan color="var(--danger)" /> Anular Ticket</h3>
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Cancela un ticket problemático y devuelve el dinero.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <input 
                    type="number" 
                    placeholder="ID Ticket" 
                    value={refundTicketId} 
                    onChange={e=>setRefundTicketId(e.target.value)} 
                    style={{...inputStyle, flex: 1}} 
                />
                <button 
                    className="btn-primary-custom" 
                    style={{background: 'var(--danger)', border: 'none'}}
                    onClick={adminRefundTicket}
                >
                    Anular
                </button>
            </div>
        </div>

      </div>

      <ToastContainer theme="dark" />
    </div>
  );
};

// Estilo auxiliar para inputs limpios
const inputStyle = {
    padding: '0.8rem', 
    borderRadius: '8px', 
    background: '#0f172a', 
    border: '1px solid #333', 
    color: 'white',
    width: '100%'
};

export default Organizer;