'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/services/api/token-store';

// Singleton: keep one socket connection alive for the whole session
let globalSocket: Socket | null = null;

/**
 * Resolves the socket server URL.
 *
 * In the browser the Next.js app is always behind the Nginx gateway.
 * We connect using the page's own origin so the browser reaches Nginx,
 * which then proxies /socket.io/ → chat-service:3001.
 *
 * Fallback for local dev without Docker: NEXT_PUBLIC_CHAT_SERVER_URL env var.
 */
function getSocketUrl(): string {
  if (typeof window !== 'undefined') {
    // Use the current page origin (e.g. https://192.168.0.101:8000 or http://localhost:8088)
    // Nginx will forward /socket.io/ to the chat-service.
    return window.location.origin;
  }
  // SSR fallback — socket hooks are client-only but keep a safe default
  return process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';
}

/**
 * useSocket Hook - Manages Socket.io connection to the Chat Service.
 *
 * Authenticated users get full access; unauthenticated users (e.g. the QR
 * login page) can still connect and join a QR room to await the login event.
 */
export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    if (!globalSocket) {
      const socketUrl = getSocketUrl();
      const token = getAccessToken(); // null when not logged in — that's OK

      globalSocket = io(socketUrl, {
        path: '/socket.io/',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
        // Pass token via both auth and query so Nginx & socket-server can read it.
        // When null/undefined, the socket still connects (Nginx no longer blocks it).
        auth: token ? { token } : {},
        query: token ? { token } : {},
      });

      globalSocket.on('connect', () => {
        console.log('✓ [Socket] Connected:', globalSocket?.id);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('✗ [Socket] Disconnected:', reason);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('✗ [Socket] Connection error:', error.message || error);
      });
    }

    // Defer state update to avoid synchronous setState warning
    const timer = setTimeout(() => {
      setSocket(globalSocket);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return socket;
}

/**
 * useSocketListener Hook - Registers a stable event listener on the socket.
 */
export function useSocketListener<T = unknown>(
  socket: Socket | null,
  eventName: string,
  callback: (data: T) => void
) {
  // Keep the latest callback reference to avoid stale closures
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: T) => savedCallback.current(data);
    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName]);
}

/**
 * useSocketRoomJoin Hook - Joins/leaves a room when component mounts/unmounts.
 */
export function useSocketRoomJoin(socket: Socket | null, roomId: string | null) {
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join_room', { roomId });
    console.log(`[Socket] Joined room: ${roomId}`);

    return () => {
      socket.emit('leave_room', { roomId });
      console.log(`[Socket] Left room: ${roomId}`);
    };
  }, [socket, roomId]);
}