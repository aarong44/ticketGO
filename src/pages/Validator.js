import React, { useState, useContext, useRef } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { abis, addresses } from '../contracts';
import { toast, ToastContainer } from 'react-toastify';
import { FaQrcode, FaCamera, FaTimes } from 'react-icons/fa';

const Validator = () => {
  const { provider, account } = useContext(WalletContext);
  const [ticketId, setTicketId] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Estados para la Cámara
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
        setIsScanning(true);
        // Solicitar acceso a la cámara (User Media API)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error(err);
        setIsScanning(false);
        toast.error("No se pudo acceder a la cámara. Revisa los permisos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const validate = async (e) => {
    if(e) e.preventDefault();
    if (!ticketId) return toast.warning("Introduce un ID válido");
    
    setProcessing(true);
    // Si la cámara estaba abierta, la cerramos al validar
    if (isScanning) stopCamera();

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(addresses.ticketGo, abis.ticketGo, signer);
      
      const tx = await contract.validateEntry(ticketId);
      toast.info("Validando en la Blockchain...");
      await tx.wait();
      
      toast.success(`✅ ACCESO CONCEDIDO: Ticket #${ticketId}`);
      setTicketId('');
    } catch (err) {
      console.error(err);
      let msg = "Error desconocido";
      if (err.message.includes("TicketNotValid")) msg = "⛔ ENTRADA INVÁLIDA O YA USADA";
      if (err.message.includes("TicketNotFound")) msg = "⛔ LA ENTRADA NO EXISTE";
      toast.error(msg);
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '70vh', justifyContent: 'center' }}>
      
      <div className="custom-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '2rem' }}>
        
        <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <FaQrcode color="var(--primary)" /> Control de Acceso
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Escanea el QR del asistente o introduce el ID.</p>
        
        {/* ZONA DE CÁMARA */}
        {isScanning ? (
            <div className="camera-viewport">
                <video ref={videoRef} autoPlay playsInline className="camera-video" muted></video>
                <div className="scan-overlay">
                    <div className="scan-line"></div>
                </div>
                <button 
                    onClick={stopCamera}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
                >
                    <FaTimes />
                </button>
            </div>
        ) : (
            <button 
                className="btn-outline-custom" 
                onClick={startCamera}
                style={{ marginBottom: '2rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1rem' }}
            >
                <FaCamera /> ACTIVAR CÁMARA / ESCÁNER
            </button>
        )}

        {/* FORMULARIO MANUAL */}
        <form onSubmit={validate}>
            <input 
                type="number" 
                placeholder="ID del Ticket (Entrada Manual)" 
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                style={{ 
                    width: '100%', padding: '1rem', fontSize: '1.5rem', 
                    marginBottom: '1rem', borderRadius: '12px', 
                    border: '1px solid #333', background: '#0f172a', 
                    color: 'white', textAlign: 'center', fontWeight: 'bold' 
                }}
            />
            <button 
                type="submit" 
                className="btn-primary-custom" 
                disabled={!account || processing}
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            >
                {processing ? 'Verificando en Blockchain...' : 'VALIDAR ENTRADA'}
            </button>
        </form>
        
        {!account && <p style={{color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem'}}>⚠️ Conecta la wallet autorizada (Validador)</p>}
      </div>
      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
};

export default Validator;