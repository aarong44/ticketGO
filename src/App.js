import React, { useEffect, useState } from "react";
import "./App.css";
import { create } from "kubo-rpc-client";
import { ethers } from "ethers";
import { Buffer } from "buffer";

import logo from "./ethereumLogo.png";
import { addresses, abis } from "./contracts";

const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

const ipfsContract = new ethers.Contract(
  addresses.ipfs,
  abis.ipfs,
  defaultProvider
);

async function readCurrentUserFile() {
  try {
    const signer = defaultProvider.getSigner();
    const contractWithSigner = ipfsContract.connect(signer);

    const result = await contractWithSigner.getLastFileOfCaller();
    const cid = result.cid ?? result[0];
    const tsRaw = result.timestamp ?? result[1];
    const timestamp = tsRaw.toNumber ? tsRaw.toNumber() : Number(tsRaw);

    console.log("Último fichero del usuario:", { cid, timestamp });
    return { cid, timestamp };
  } catch (err) {
    console.log(
      "No hay ficheros registrados o error al leer:",
      err?.message || err
    );
    return { cid: "", timestamp: null };
  }
}

function App() {
  const [ipfsHash, setIpfsHash] = useState("");
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [userAddress, setUserAddress] = useState("");

  // Conectar MetaMask al cargar
  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum && window.ethereum.request) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts.length > 0) {
            setUserAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Error solicitando cuentas a MetaMask:", err);
          setStatus(
            "No se ha podido conectar con MetaMask. Revisa la extensión e inténtalo de nuevo."
          );
        }
      } else {
        console.error("MetaMask no está disponible en este navegador.");
        setStatus(
          "MetaMask no está disponible. Abre la aplicación en un navegador con MetaMask instalado."
        );
      }
    }
    connectWallet();
  }, []);

  // Cargar el último CID registrado por el usuario
  useEffect(() => {
    async function loadLastFile() {
      const { cid, timestamp } = await readCurrentUserFile();
      if (cid) {
        setIpfsHash(cid);
        setLastTimestamp(timestamp);
      }
    }
    loadLastFile();
  }, []);

  async function setFileIPFSOnChain(hash) {
    const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
    setStatus("Registrando el adjunto en la blockchain...");
    const tx = await ipfsWithSigner.setFileIPFS(hash);
    await tx.wait();
    setStatus("Adjunto registrado correctamente en la blockchain.");

    const { cid, timestamp } = await readCurrentUserFile();
    setIpfsHash(cid);
    setLastTimestamp(timestamp);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Selecciona un fichero antes de pulsar 'Registrar adjunto'.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("Subiendo fichero a IPFS...");

      const client = create({
        url: "http://127.0.0.1:5001/api/v0",
      });

      const result = await client.add(file);
      const cid = result.cid.toString();
      console.log("CID recibido de IPFS:", cid);

      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);

      setStatus("Fichero subido a IPFS. Registrando en el contrato...");
      await setFileIPFSOnChain(cid);

      alert("Adjunto registrado correctamente:\n" + cid);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      setStatus(
        "Se ha producido un error al subir el fichero o registrar el adjunto. Revisa la consola."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    if (!data) {
      setFile(null);
      setFileName("");
      return;
    }

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    console.log("Fichero seleccionado:", data.name);

    reader.onloadend = () => {
      const buf = Buffer(reader.result);
      console.log("Buffer data:", buf);
      setFile(buf);
      setFileName(data.name);
    };

    e.preventDefault();
  };

  const formattedTimestamp =
    lastTimestamp != null
      ? new Date(lastTimestamp * 1000).toLocaleString()
      : null;

const ipfsGatewayUrl = ipfsHash
    ? `http://127.0.0.1:8080/ipfs/${ipfsHash}`
    : undefined;


  const shortAddress =
    userAddress && userAddress.length > 10
      ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
      : userAddress;

  return (
    <div className="App">
      <header className="App-header">
        <div className="app-brand">
          <img src={logo} className="App-logo" alt="Ethereum logo" />
          <div className="brand-text">
            <span className="app-title">Ticketing DApp</span>
            <span className="app-subtitle">Panel de adjuntos IPFS</span>
          </div>
        </div>

        <div className="header-right-info">
          <div className="breadcrumb">
            <span className="crumb">Inicio</span>
            <span className="crumb-separator">/</span>
            <span className="crumb">Tickets</span>
            <span className="crumb-separator">/</span>
            <span className="crumb crumb-active">Adjuntos y documentación</span>
          </div>
          {shortAddress && (
            <div className="wallet-pill">
              <span className="wallet-label">Cuenta conectada</span>
              <span className="wallet-address">🎫 {shortAddress}</span>
            </div>
          )}
        </div>
      </header>

      <main className="App-main">
        <section className="card card-primary">
          <h2>📎 Registrar nuevo adjunto</h2>
          <p className="card-description">
            Sube aquí documentos relacionados con tus entradas: versiones
            digitales del ticket, justificantes de compra o cualquier archivo
            que quieras vincular de forma segura a la blockchain.
          </p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="label">Selecciona un fichero</label>
              <input type="file" name="data" onChange={retrieveFile} />
              {fileName && (
                <p className="file-name">Fichero seleccionado: {fileName}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading || !file}
            >
              {isUploading ? "Registrando adjunto..." : "Registrar adjunto"}
            </button>
          </form>

          {status && <p className="status">{status}</p>}
        </section>

        <section className="card card-secondary">
          <h2>📂 Último adjunto registrado</h2>
          {ipfsHash ? (
            <>
              <p className="cid-label">
                <strong>CID almacenado:</strong>
              </p>
              <p className="cid-value">{ipfsHash}</p>

              {formattedTimestamp && (
                <p className="cid-meta">
                  Registrado el: <strong>{formattedTimestamp}</strong>
                </p>
              )}

              {ipfsGatewayUrl && (
                <p className="cid-link">
                  Ver documento (gateway público):{" "}
                  <a href={ipfsGatewayUrl} target="_blank" rel="noreferrer">
                    {ipfsGatewayUrl}
                  </a>
                </p>
              )}

              <p className="helper-text">
                Esta sección muestra el último documento asociado a tu cuenta.
                El archivo se almacena en IPFS y aquí solo se conserva su
                identificador de contenido, garantizando su integridad y
                permitiendo recuperarlo cuando sea necesario.
              </p>
            </>
          ) : (
            <p className="empty-state">
              Aún no hay adjuntos registrados para la cuenta conectada. Sube un
              fichero en el panel de la izquierda para crear el primer
              documento asociado a tus tickets.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
