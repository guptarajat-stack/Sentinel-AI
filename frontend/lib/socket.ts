import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(BACKEND_URL, {
      reconnectionDelay: 1500,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });
  }
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

// Raw alert shape emitted by backend on "new-alert"
export interface RawAlert {
  rule_name: string;
  severity: string;
  context: Record<string, string>;
  raw_log: string;
  matched?: boolean;
}
