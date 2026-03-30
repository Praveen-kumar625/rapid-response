import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Incident } from '@rapid-response/contracts';
import { useSocket } from '../src/context/socket';
import Link from 'next/link';

const Map = dynamic(() => import('../src/components/Map'), { ssr: false });

const Home: NextPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { socket } = useSocket();

  // Load initial data (bbox of whole world for demo)
  useEffect(() => {
    axios
      .get<Incident[]>('/api/incidents')
      .then((res) => setIncidents(res.data));
  }, []);

  // Real‑time updates
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { incident: Incident }) => {
      setIncidents((prev) => [...prev, payload.incident]);
    };
    socket.on('incident.created', handler);
    return () => {
      socket.off('incident.created', handler);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-blue-800 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Rapid Crisis Response</h1>
        <Link href="/report">
          <a className="bg-white text-blue-800 px-4 py-2 rounded">Report incident</a>
        </Link>
      </header>

      <main className="flex-1">
        <Map incidents={incidents} />
      </main>
    </div>
  );
};

export default Home;
