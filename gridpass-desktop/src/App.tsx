import { useEffect, useState } from 'react'
import PairingScreen from './components/PairingScreen'
import Dashboard from './components/Dashboard'

function App() {
  const [auth, setAuth] = useState<{ status: string, pairingCode?: string, deviceId: string } | null>(null);

  useEffect(() => {
    // Initial Load
    window.api.getAuthStatus().then(setAuth);

    // Subscribe to updates
    const cleanup = window.api.onAuthUpdate((newAuth) => {
      console.log("Auth Update:", newAuth);
      setAuth(newAuth);
    });

    return () => cleanup();
  }, []);

  const handleReset = async () => {
    await window.api.resetPairing();
  };

  // FORCE DUMP DASHBOARD (Bypass Auth for GridPass Stats)
  return <Dashboard deviceId={auth?.deviceId || "debug_mode"} onUnpair={handleReset} />
}

export default App
