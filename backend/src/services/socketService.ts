import { Server } from 'socket.io';

let _io: Server | null = null;

export function initSocket(io: Server): void {
  _io = io;
}

export function emit(event: string, data: unknown): void {
  if (_io) {
    _io.emit(event, data);
  }
}
