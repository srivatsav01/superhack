import React, { useState } from 'react';
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { getDefaultProvider } from 'ethers';

const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26

function App() {
  const [attestation, setAttestation] = useState(null);

  const fetchAttestation = async () => {
    const eas = new EAS(EASContractAddress);
    console.log('hello')
    const provider = getDefaultProvider("sepolia");
    eas.connect(provider);
    const uid = "0xed4f9929ddbbe4e099e7b1534955b364d24047e6813f450633989e6702b1821a"; // Sample UID for testing
    const result = await eas.getAttestation(uid);
    console.log(result)
    setAttestation(result);

  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>EAS SDK Interaction</h1>
      <button onClick={fetchAttestation} style={{ padding: '10px 20px', margin: '20px 0' }}>
        Fetch Attestation
      </button>
      {attestation && (
        <div>
          <h2>Attestation Details:</h2>
          {/* <pre>{JSON.stringify(attestation, null, 2)}</pre> */}
        </div>
      )}
    </div>
  );
}

export default App;
