import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { ToastContainer, toast } from 'react-toastify';
import { abis, addresses } from '../contracts'; 
import { FaSearch, FaMapMarkerAlt, FaTicketAlt, FaEthereum } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const Home = () => {
  const { provider, account } = useContext(WalletContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (provider) loadEvents();
  }, [provider]);

  // Filtro en tiempo real
  useEffect(() => {
    const results = events.filter(evt =>
      evt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(results);
  }, [searchTerm, events]);

  // Generadores de datos simulados (para realismo UI)
  const getFakeDate = (id) => {
    const months = ["ENE", "FEB", "DIC"];
    // Pseudo-random consistente basado en ID
    const month = months[(id * 3) % 12];
    const day = (id * 7) % 28 + 1;
    return { day, month };
  };

  const getFakeLocation = (id) => {
    const cities = ["Madrid, WiZink", "A Coruña, Pelícano", "Valencia, Plaza", "Ourense, Auditorio", "Vigo, Balaídos", "Online, Metaverso"];
    return cities[id % cities.length];
  };

  const loadEvents = async () => {
    try {
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, provider);
      const loadedEvents = [];
      
      for (let i = 1; i < 20; i++) { 
        try {
          const evt = await contract.events(i);
          if (evt.id.toString() === "0") break;
          
          if (evt.isActive) {
            loadedEvents.push({
                id: evt.id.toNumber(),
                name: evt.name,
                ticketPrice: evt.ticketPrice,
                image: `https://picsum.photos/seed/${evt.id}/500/300`, // Imágenes de alta calidad
                date: getFakeDate(evt.id.toNumber()),
                location: getFakeLocation(evt.id.toNumber())
            });
          }
        } catch (e) { break; }
      }
      setEvents(loadedEvents);
      setFilteredEvents(loadedEvents);
    } catch (err) {
      console.log("Error cargando eventos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (eventId, val) => {
    if(val < 1) val = 1;
    if(val > 10) val = 10;
    setQuantities({ ...quantities, [eventId]: Number(val) });
  };

  const buyTicket = async (eventId, priceWei) => {
    if (!account) return toast.error("⚠️ Conecta tu wallet para continuar");
    const qty = quantities[eventId] || 1;

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      
      const totalPrice = priceWei.mul(qty);
      const generateFakeCID = () => "ipfs://Qm" + ethers.utils.id(Date.now().toString() + Math.random()).substring(2, 44);

      let tx;
      if (qty === 1) {
        tx = await contract.buyTicket(eventId, generateFakeCID(), { value: totalPrice });
      } else {
        const cids = Array.from({ length: qty }, () => generateFakeCID());
        tx = await contract.batchBuyTickets(eventId, cids, { value: totalPrice });
      }

      toast.info("🔗 Confirmando transacción en Blockchain...");
      await tx.wait();
      toast.success(`🎉 ¡Éxito! Tienes ${qty} entrada(s) nuevas.`);
    } catch (err) {
      console.error(err);
      toast.error("Error: " + (err.reason || "Transacción fallida"));
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      
      {/* HERO SECTION */}
      <div className="hero-container">
        <h1 className="hero-title">Vivi la experiencia</h1>
        <p className="hero-subtitle">Descubre eventos exclusivos y asegura tu entrada con la tecnología blockchain más segura del mercado. Sin reventas fraudulentas.</p>
        
        {/* BARRA DE BÚSQUEDA FLOTANTE */}
        <div className="search-wrapper">
            <FaSearch color="var(--primary)" size={20} />
            <input 
                type="text" 
                className="search-input" 
                placeholder="Buscar artista, evento o lugar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="page-container">
        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaTicketAlt color="var(--accent)" /> Próximos Eventos
        </h2>

        {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}></div>
                <p style={{marginTop: '1rem', color: 'var(--text-muted)'}}>Sincronizando con la Blockchain...</p>
            </div>
        ) : (
            <div className="grid-container">
            {filteredEvents.length > 0 ? filteredEvents.map((evt) => (
                <div key={evt.id} className="custom-card" style={{ padding: 0, overflow: 'hidden', border: 'none', background: '#1e293b' }}>
                
                {/* IMAGEN Y FECHA */}
                <div className="card-image-wrapper">
                    <img 
                        src={evt.image} 
                        alt={evt.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display='none'; e.target.parentNode.style.background='#334155'; }}
                    />
                    <div className="date-badge">
                        <span className="date-month">{evt.date.month}</span>
                        <span className="date-day">{evt.date.day}</span>
                    </div>
                </div>

                {/* CONTENIDO DE LA TARJETA */}
                <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {evt.name}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <FaMapMarkerAlt style={{ marginRight: '5px' }} /> {evt.location}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Precio desde</p>
                            <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaEthereum /> {ethers.utils.formatEther(evt.ticketPrice)}
                            </p>
                        </div>

                        {/* CONTROL DE CANTIDAD Y COMPRA */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: '6px', padding: '2px' }}>
                                <button 
                                    onClick={() => handleQuantityChange(evt.id, (quantities[evt.id] || 1) - 1)}
                                    style={{ background: 'none', border: 'none', color: 'white', padding: '0 8px', cursor: 'pointer' }}
                                >-</button>
                                <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{quantities[evt.id] || 1}</span>
                                <button 
                                    onClick={() => handleQuantityChange(evt.id, (quantities[evt.id] || 1) + 1)}
                                    style={{ background: 'none', border: 'none', color: 'white', padding: '0 8px', cursor: 'pointer' }}
                                >+</button>
                            </div>
                            
                            <button 
                                className="btn-primary-custom" 
                                style={{ padding: '0.5rem 1.5rem', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)' }}
                                onClick={() => buyTicket(evt.id, evt.ticketPrice)}
                            >
                                Comprar
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <h3>No se encontraron eventos.</h3>
                    <p>Prueba con otro término de búsqueda.</p>
                </div>
            )}
            </div>
        )}
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
};

export default Home;