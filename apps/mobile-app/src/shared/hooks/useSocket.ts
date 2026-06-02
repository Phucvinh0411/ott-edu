import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { API_URL, getAccessToken } from '@/modules/api';

// Global singleton to maintain single socket connection across app lifecycle
let globalSocket: Socket | null = null;
let currentSocketToken: string | null | undefined = undefined; // undefined = never checked

/**
 * Resolves the gateway URL for socket connection.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL env var (set in .env for production/LAN)
 *  2. Auto-detected LAN host from Expo debugger (dev mode)
 *
 * The mobile app connects through the Nginx gateway (:8088) which
 * forwards /socket.io/ to the chat-service. This avoids firewall
 * issues caused by connecting directly to port 3001.
 */
function getGatewayUrl(): string {
  // API_URL already resolves EXPO_PUBLIC_API_URL → LAN IP:8088 → localhost:8088
  return API_URL;
}

/**
 * useSocket Hook - Manages Socket.io connection for real-time updates.
 *
 * Connects through the Nginx gateway (port 8088) with auth token so
 * Nginx can forward the connection to the chat-service.
 * When no token is present (e.g. before login), the connection is skipped
 * and retried after the userId/token dependency changes.
 */
export function useSocket(userId?: string): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    let active = true;

    async function initSocket() {
      try {
        const token = await getAccessToken();

        if (!active) return;

        // Disconnect if no token (user logged out) or token changed (re-login)
        if (globalSocket && currentSocketToken !== token) {
          console.log('[Socket] Token changed — reconnecting');
          globalSocket.disconnect();
          globalSocket = null;
          currentSocketToken = undefined;
        }

        // Don't connect without a token; will retry when userId/token changes
        if (!token) {
          if (active) setSocket(null);
          return;
        }

        if (!globalSocket) {
          const gatewayUrl = getGatewayUrl();
          currentSocketToken = token;
          console.log('[Socket] Connecting via gateway:', gatewayUrl);

          globalSocket = io(gatewayUrl, {
            path: '/socket.io/',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
            auth: { token },
            query: { token },
          });

          globalSocket.on('connect', () => {
            console.log('[Socket] Connected:', globalSocket?.id);
          });

          globalSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
          });

          globalSocket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error?.message || error);
          });
        }

        if (active) setSocket(globalSocket);
      } catch (err) {
        console.error('[Socket] Init error:', err);
      }
    }

    void initSocket();
    return () => { active = false; };
  }, [userId]);

  return socket;
}

/**
 * useSocketListener Hook - Registers event listener on socket.
 * Automatically handles cleanup and uses latest callback reference.
 */
export function useSocketListener<T = unknown>(
  socket: Socket | null,
  eventName: string,
  callback: (data: T) => void
): void {
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
 * useSocketRoomJoin Hook - Joins/leaves socket room when component mounts/unmounts.
 * Useful for receiving room-specific real-time updates.
 */
export function useSocketRoomJoin(socket: Socket | null, roomId: string | null): void {
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
