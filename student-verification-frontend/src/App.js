import React, { useState, useEffect } from 'react';
import ReclaimSDK from '@reclaimprotocol/reclaim-client-sdk';
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { getDefaultProvider} from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import './App.css';


const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Replace with the correct contract address
const schemaString = "uint256 eventId, uint8 voteIndex"; // Define your schema
const schemaEncoder = new SchemaEncoder(schemaString);
const schemaUID = '0x3b17d657b982933abb9a27f563160264784d9bd8afd73b94802dcb4d94b61143'

function App() {
  const [isProofSubmitted, setIsProofsSubmitted] = useState(false);
  const [sessionLink, setSessionLink] = useState('');
  const [proofs, setProofs] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSession = async () => {
    setIsLoading(true);
    const reclaimSDK = new ReclaimSDK('18f1df37-30f2-4096-a186-07f651faab45');
    const userId = uuidv4();
    const session = await reclaimSDK.generateSession(userId);
    setSessionLink(session.link);

    try {
      const submissionData = await session?.onSubmission;
      console.log(submissionData)
      setProofs(submissionData.proofs);
      setIsProofsSubmitted(true);
    } catch (e) {
      console.error('Error during submission:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const createAttestation = async () => {
    const eas = new EAS(EASContractAddress);

    const provider = new Web3Provider(window.ethereum);
    // Assuming you have initialized the web3 provider
let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const signer = provider.getSigner(accounts[0]); // This gets the signer for the first account
console.log(signer);




// Connect the signer to the EAS
eas.connect(signer);

    // 2. Get the signer
    
    // 3. Connect the signer to the EAS
    // Initialize SchemaEncoder with the new schema string
    const schemaEncoder = new SchemaEncoder("address studentAddr, bool isStudent");
    const encodedData = schemaEncoder.encodeData([
      { name: "studentAddr", value: "0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165", type: "address" },
      { name: "isStudent", value: true, type: "bool" },
    ]);
    
    const schemaUID = "0x4464cea8669763510204204e367c58716bd9c443af1da43d9cc8c5d238c53b5e";
                       

    
    const tx = await eas.attest({
      schema: schemaUID,
      data: {
        recipient: "0x3C7AF4E43e582A4fF5CbAfcB91195b2376DcF954", // This can be the student's address or any other recipient
        expirationTime: 0,
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        data: encodedData,
         // example valu
      },
     
    },{ gasLimit: 500000 });
    
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
          {isProofSubmitted && (
            <button className="btn" onClick={generateSession} disabled={isLoading}>
              Prove you're a student
            </button>
          )}

          {sessionLink && !isProofSubmitted && (
            <div>
              <h2>Scan the QR Code to Verify</h2>
              <div>
                <QRCode value={sessionLink} />
              </div>
            </div>
          )}

          {!isProofSubmitted && (
            <button className="btn" onClick={createAttestation} disabled={isLoading}>
              Attest on Chain
            </button>
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
