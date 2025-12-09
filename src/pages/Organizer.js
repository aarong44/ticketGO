import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { abis, addresses } from '../contracts';
import { toast, ToastContainer } from 'react-toastify';
import { FaPlusCircle, FaCoins, Famagic, FaPowerOff } from 'react-icons/fa'; // Asegúrate de tener react-icons

const Organizer = () => {
  const { provider, account } = useContext(WalletContext);
  
  // Estado para el formulario de crear evento
  const [newEventName, setNewEventName] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('');
  
  // Estado para Admin Mint
  const [mintTo, setMintTo] = useState('');
  const [mintEventId, setMintEventId] = useState('');
  
  // Estado general
  const [events, setEvents] = useState([]);
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
      
      // 1. Verificar Rol
      const ORG_ROLE = await contract.ORGANIZER_ROLE();
      const hasRole = await contract.hasRole(ORG_ROLE, account);
      setIsOrganizer(hasRole);

      if (hasRole) {
        // 2. Cargar Eventos (Simplificado: cargamos los primeros 5 IDs para demo)
        const loadedEvents = [];
        for (let i = 1; i <= 5; i++) {
          const evt = await contract.events(i);
          if (evt.id.gt(0)) { // Si el ID > 0, el evento existe
            loadedEvents.push({
              id: evt.id.toNumber(),
              name: evt.name,
              price: ethers.utils.formatEther(evt.ticketPrice),
              isActive: evt.isActive
            });
          }
        }
        setEvents(loadedEvents);
      }
    } catch (err) {
      console.error("Error cargando datos de organizador:", err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      
      const priceWei = ethers.utils.parseEther(newEventPrice);
      const tx = await contract.createEvent(newEventName, priceWei);
      
      toast.info("Creando evento en la Blockchain...");
      await tx.wait();
      toast.success("¡Evento creado correctamente!");
      
      // Limpiar y recargar
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
      toast.info("Cambiando estado...");
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
      
      const tx = await contract.withdrawFunds(); // O withdraw(), verifica el nombre en tu contrato final
      toast.info("Retirando fondos...");
      await tx.wait();
      toast.success("¡Fondos enviados a tu wallet!");
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Verificando permisos...</p></div>;

  if (!isOrganizer) {
    return (
      <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--danger)' }}>Acceso Denegado</h2>
        <p>Esta página es exclusiva para los organizadores del contrato.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Panel de Organizador</h1>
        <button className="btn-primary-custom" onClick={withdrawFunds} style={{ backgroundColor: 'var(--success)' }}>
           Retirar Fondos
        </button>
      </header>

      <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* TARJETA 1: CREAR EVENTO */}
        <div className="custom-card">
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
             Nuevo Evento
          </h3>
          <form onSubmit={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label>Nombre del Evento</label>
              <input 
                type="text" 
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="Ej. Concierto Fin de Curso"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white' }}
                required
              />
            </div>
            <div>
              <label>Precio (ETH)</label>
              <input 
                type="number" 
                step="0.0001"
                value={newEventPrice}
                onChange={(e) => setNewEventPrice(e.target.value)}
                placeholder="0.01"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary-custom" style={{ marginTop: '1rem' }}>
              Crear Evento en Blockchain
            </button>
          </form>
        </div>

        {/* TARJETA 2: LISTADO DE EVENTOS */}
        <div className="custom-card">
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Gestión de Eventos</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
            {events.length === 0 ? <p className="text-muted">No hay eventos creados.</p> : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(evt => (
                    <tr key={evt.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '10px 0' }}>#{evt.id}</td>
                      <td>{evt.name}</td>
                      <td>
                        <span className={`badge-status ${evt.isActive ? 'status-valid' : 'status-refunded'}`}>
                          {evt.isActive ? 'ACTIVO' : 'PAUSADO'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-outline-custom"
                          onClick={() => toggleEvent(evt.id)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        >
                          <FaPowerOff />
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
      
      {/* SECCIÓN EXTRA: ADMIN MINT (Opcional si quieres mostrar la potencia del backend) */}
      <div className="custom-card" style={{ marginTop: '2rem' }}>
        <h3>Emisión Administrativa (Airdrop)</h3>
        <p style={{ color: 'var(--text-muted)' }}>Envía entradas directamente a una wallet (Regalos/VIP).</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input 
                type="text" 
                placeholder="Dirección Wallet (0x...)" 
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value)}
                style={{ flex: 2, padding: '0.8rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white' }}
            />
            <input 
                type="number" 
                placeholder="ID Evento" 
                value={mintEventId}
                onChange={(e) => setMintEventId(e.target.value)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white' }}
            />
            <button 
                className="btn-primary-custom"
                onClick={async () => {
                    if(!mintTo || !mintEventId) return toast.warning("Rellena todos los campos");
                    try {
                        const signer = provider.getSigner();
                        const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
                        // Recordar: adminMint es payable si el precio > 0, aquí asumimos cortesía (0 value)
                        // Si tu contrato exige value, habría que añadir { value: ... }
                        const tx = await contract.adminMint(mintTo, mintEventId, "ipfs://admin-gift", 0, { value: 0 });
                        toast.info("Enviando entrada...");
                        await tx.wait();
                        toast.success("¡Entrada enviada!");
                    } catch(e) { toast.error(e.message) }
                }}
            >
                Emitir Entrada
            </button>
        </div>
      </div>

      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
};

export default Organizer;