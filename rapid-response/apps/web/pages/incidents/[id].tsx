import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Incident } from '@rapid-response/contracts';
import { useSocket } from '../../src/context/socket';

const IncidentPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [incident, setIncident] = useState<Incident | null>(null);
  const [messages, setMessages] = useState<
    { id: string; userId: string; text: string; ts: string }[]
  >([]);
  const [draft, setDraft] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    if (!id) return;
    axios.get<Incident>(`/api/incidents/${id}`).then((res) => setIncident(res.data));
  }, [id]);

  // Join incident room for chat
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join-incident', id);
    const handler = (msg: any) => setMessages((m) => [...m, msg]);
    socket.on('incident.message', handler);
    return () => {
      socket.emit('leave-incident', id);
      socket.off('incident.message', handler);
    };
  }, [socket, id]);

  const send = () => {
    if (!draft.trim()) return;
    socket?.emit('incident.message', { incidentId: id, text: draft });
    setDraft('');
  };

  if (!incident) return <p>Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold">{incident.title}</h1>
      <p className="my-2">{incident.description}</p>
      <p>
        <strong>Severity:</strong> {incident.severity}
      </p>
      <p>
        <strong>Status:</strong> {incident.status}
      </p>

      <hr className="my-4" />

      <h2 className="text-xl mb-2">Responder chat</h2>
      <div className="border rounded h-64 overflow-y-auto p-2 mb-2 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className="mb-1">
            <strong>{m.userId.slice(0, 8)}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 p-2 border"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4"
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default IncidentPage;
