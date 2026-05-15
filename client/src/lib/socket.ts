// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onSocket<T>(
  event: string,
  callback: (data: T) => void
): () => void {
  const s = getSocket();
  s.on(event, callback);
  return () => s.off(event, callback);
}

export function emitSocket<T = any>(
  event: string,
  data?: object,
  ack?: (res: T) => void
) {
  const s = getSocket();
  if (ack) {
    s.emit(event, data, ack);
  } else {
    s.emit(event, data);
  }
}