import React, { useState } from 'react';
import ReclaimSDK from '@reclaimprotocol/reclaim-client-sdk';
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { Web3Provider } from '@ethersproject/providers';
import { Wallet, JsonRpcProvider } from 'ethers';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e";
const schemaEncoder = new SchemaEncoder("address studentAddr, bool isStudent");
const schemaUID = '0x3b17d657b982933abb9a27f563160264784d9bd8afd73b94802dcb4d94b61143';

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [sessionLink, setSessionLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attestationLink, setAttestationLink] = useState(null);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setUserAddress(accounts[0]);
    } else {
      alert("MetaMask not detected!");
    }
  };

  const generateSession = async () => {
    setIsLoading(true);
    const reclaimSDK = new ReclaimSDK('18f1df37-30f2-4096-a186-07f651faab45');
    const userId = uuidv4();
    const session = await reclaimSDK.generateSession(userId);
    setSessionLink(session.link);

    try {
      const submissionData = await session?.onSubmission;
      if (submissionData.proofs) {
        const parsedData = JSON.parse(submissionData.proofs[0].parameters);
        const email = parsedData.emailAddress || ""; // Extracting the email
    
        if (email.endsWith('iith.ac.in')) {
            console.log('Email is from iith.ac.in domain');
            createAttestation(); // Call the attestation function directly if proofs are submitted
        } else {
            console.log('Email is not from iith.ac.in domain');
        }
    }
    
    } catch (e) {
      console.error('Error during submission:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const createAttestation = async () => {
    const eas = new EAS(EASContractAddress);
    const SEPOLIA_RPC_URL = "https://eth-sepolia-public.unifra.io";
    const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new Wallet(process.env.REACT_APP_PRIVATE_KEY);
    const signer = wallet.connect(provider);
    eas.connect(signer);

    const encodedData = schemaEncoder.encodeData([
      { name: "studentAddr", value: userAddress, type: "address" },
      { name: "isStudent", value: true, type: "bool" },
    ]);

    const tx = await eas.attest({
      schema: schemaUID,
      data: {
        recipient: userAddress,
        expirationTime: 0,
        revocable: true,
        data: encodedData,
      },
    }, { gasLimit: 500000, signer: signer });

    const newAttestationUID = await tx.wait();
    console.log("New attestation UID:", newAttestationUID);
    setAttestationLink(`https://sepolia.easscan.org/attestation/view/${newAttestationUID}`);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Educlaim</h1>
      </header>
      <main className="app-main">
        <div className="verification-box">
          {!userAddress && (
            <button className="btn" onClick={connectMetaMask}>
              Connect MetaMask
            </button>
          )}

          {userAddress && !sessionLink && (
            <button className="btn" onClick={generateSession} disabled={isLoading}>
              Prove you're a student
            </button>
          )}

          {sessionLink && (
            <div>
              <h2>Scan the QR Code to Verify</h2>
              <div className="qr-box">
                <QRCode value={sessionLink} />
              </div>
            </div>
          )}

          {attestationLink && (
            <div className="confirmation-section">
              <h2>Your proof has been submitted!</h2>
              <p>View your attestation <a href={attestationLink} target="_blank" rel="noopener noreferrer">here</a>.</p>
            </div>
          )}
        </div>
      </main>
      <footer className="app-footer">
        &copy; 2023 Educlaim. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
