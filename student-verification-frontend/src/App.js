import React, { useState } from 'react';
import ReclaimSDK from '@reclaimprotocol/reclaim-client-sdk';
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { Web3Provider } from '@ethersproject/providers';
import { Wallet, getDefaultProvider,JsonRpcProvider } from 'ethers';
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
        createAttestation(); // Call the attestation function directly if proofs are submitted
      }
    } catch (e) {
      console.error('Error during submission:', e);
    } finally {
      setIsLoading(false);
    }
  };

 // WARNING: Do not use a real private key in client-side code!

const createAttestation = async () => {
    const eas = new EAS(EASContractAddress);
    const YOUR_PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;
    console.log(YOUR_PRIVATE_KEY)
    // Use your private key to create a signer
    const SEPOLIA_RPC_URL = "https://eth-sepolia-public.unifra.io";

    // Create a provider for Sepolia
    const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
    
    // Use your private key to create a signer
    const wallet = new Wallet(process.env.REACT_APP_PRIVATE_KEY);
    const signer = wallet.connect(provider);
    eas.connect(signer);
    console.log(signer)

    // Now, use the signer directly with EAS
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
    }, { gasLimit: 500000, signer: signer }); // Pass the signer here

    const newAttestationUID = await tx.wait();
    console.log("New attestation UID:", newAttestationUID);
};
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Student Verification</h1>
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
              <div>
                <QRCode value={sessionLink} />
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="app-footer">
        &copy; 2023 Student Verification. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
