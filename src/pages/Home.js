import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa tus ABIs y Addresses actualizados
import { abis, addresses } from '../contracts'; 

const Home = () => {
  const { provider, account } = useContext(WalletContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1); // Para Batch Buying

  useEffect(() => {
    if (provider) loadEvents();
  }, [provider]);

  const loadEvents = async () => {
    // Aquí deberías iterar sobre los eventos creados.
    // Como simplificación académica, cargaremos el Evento ID 1 y 2 si existen.
    try {
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, provider);
      const event1 = await contract.events(1);
      
      if (event1.name) {
        setEvents([
            { id: 1, ...event1, image: "https://source.unsplash.com/random/400x250/?concert" }
        ]);
      }
    } catch (err) {
      console.log("Error cargando eventos", err);
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async (eventId, price) => {
    if (!account) return toast.error("Conecta tu wallet primero");
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      
      let tx;
      const totalPrice = price.mul(quantity);
      
      // Simulación de CID para IPFS
      const dummyCid = "ipfs://QmSimulatedCIDForDemo"; 

      if (quantity === 1) {
        tx = await contract.buyTicket(eventId, dummyCid, { value: totalPrice });
      } else {
        // Batch Buying
        const cids = Array(quantity).fill(dummyCid);
        tx = await contract.batchBuyTickets(eventId, cids, { value: totalPrice });
      }

      toast.info("Transacción enviada...");
      await tx.wait();
      toast.success(`¡${quantity} entrada(s) comprada(s) con éxito!`);
    } catch (err) {
      console.error(err);
      toast.error("Error en la compra: " + (err.reason || err.message));
    }
  };

  return (
    <div className="page-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Próximos Eventos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Compra tus entradas de forma segura en la Blockchain.
        </p>
      </header>

      {loading ? <p>Cargando eventos...</p> : (
        <div className="grid-container">
          {events.map((evt) => (
            <div key={evt.id} className="custom-card">
              <img src={evt.image} alt="Event" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
              <h3>{evt.name}</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {ethers.utils.formatEther(evt.ticketPrice)} ETH
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
                <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #444', background: '#222', color: 'white', width: '60px' }}
                />
                <button 
                  className="btn-primary-custom" 
                  style={{ width: '100%' }}
                  onClick={() => buyTicket(evt.id, evt.ticketPrice)}
                >
                  Comprar {quantity > 1 ? `(${quantity})` : ''}
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p>No hay eventos activos en este momento.</p>}
        </div>
      )}
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
};

export default Home;