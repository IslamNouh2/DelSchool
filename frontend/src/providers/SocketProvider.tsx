"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface SocketContextType {
  socket: Socket | null;
  refreshKey: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  refreshKey: 0,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:47005';
    // Socket.io should connect to the root (not /api)
    const socketUrl = rawUrl.replace(/\/api$/, '').replace(/\/$/, '');
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket Connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket Connection Error:', error.message);
    });

    newSocket.on('refresh', () => {
      console.log('🔄 WebSocket: Refresh event received');
      setRefreshKey((prev) => prev + 1);
      router.refresh();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket Disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [router]);

  return (
    <SocketContext.Provider value={{ socket, refreshKey }}>
      {children}
    </SocketContext.Provider>
  );
};
