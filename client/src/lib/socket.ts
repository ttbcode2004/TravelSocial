import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("/", {
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
  socket?.disconnect();
  socket = null;
}

// ─── Typed event helpers ──────────────────────────────────────

export function onSocket<T>(event: string, cb: (data: T) => void) {
  getSocket().on(event, cb);
  return () => getSocket().off(event, cb);
}

export function emitSocket<T>(
  event: string,
  data: object,
  cb?: (res: T) => void
) {
  if (cb) {
    getSocket().emit(event, data, cb);
  } else {
    getSocket().emit(event, data);
  }
}