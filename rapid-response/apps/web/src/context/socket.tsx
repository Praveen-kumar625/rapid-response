import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@auth0/nextjs-auth0/client';

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;
    const s = io(`${process.env.NEXT_PUBLIC_WS_URL}/crisis`, {
      auth: { token: user?.sub },
      transports: ['websocket'],
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>
  );
};
