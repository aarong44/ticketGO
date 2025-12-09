import React, { useState, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { abis, addresses } from '../contracts';
import { toast, ToastContainer } from 'react-toastify';

const Validator = () => {
  const { provider } = useContext(WalletContext);
  const [ticketId, setTicketId] = useState('');

  const validate = async (e) => {
    e.preventDefault();
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      
      const tx = await contract.validateEntry(ticketId);
      toast.info("Validando...");
      await tx.wait();
      toast.success(`Entrada #${ticketId} VALIDADA correctamente.`);
      setTicketId('');
    } catch (err) {
      toast.error("Error: Entrada inválida o ya usada.");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '600px', textAlign: 'center' }}>
      <div className="custom-card">
        <h2>Panel de Control de Acceso</h2>
        <p>Introduce el ID de la entrada o escanea el QR.</p>
        
        <form onSubmit={validate} style={{ marginTop: '2rem' }}>
            <input 
                type="text" 
                placeholder="ID del Ticket" 
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                style={{ 
                    width: '100%', padding: '1rem', fontSize: '1.5rem', 
                    marginBottom: '1rem', borderRadius: '8px', border: 'none', textAlign: 'center' 
                }}
            />
            <button type="submit" className="btn-primary-custom" style={{ width: '100%', padding: '1rem' }}>
                VALIDAR ACCESO
            </button>
        </form>
      </div>
      <ToastContainer theme="dark" />
    </div>
  );
};

export default Validator;