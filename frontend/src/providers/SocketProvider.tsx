"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

  useEffect(() => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:47005';
    // Socket.io should connect to the root (not /api)
    const socketUrl = rawUrl.replace(/\/api$/, '').replace(/\/$/, '');
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('refresh', () => {
      console.log('Received refresh event');
      setRefreshKey((prev) => prev + 1);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, refreshKey }}>
      {children}
    </SocketContext.Provider>
  );
};
