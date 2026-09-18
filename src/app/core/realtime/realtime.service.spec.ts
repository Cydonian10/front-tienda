import { beforeEach, describe, expect, it, vi } from 'vitest';

const socketMock = vi.hoisted(() => {
  const listeners = new Map<string, (event?: unknown) => void>();
  const managerListeners = new Map<string, () => void>();
  const socket = {
    connected: false,
    on: vi.fn((event: string, listener: (event?: unknown) => void) => {
      listeners.set(event, listener);
      return socket;
    }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    io: {
      on: vi.fn((event: string, listener: () => void) => {
        managerListeners.set(event, listener);
      }),
      removeAllListeners: vi.fn(),
    },
  };
  return { socket, listeners, managerListeners };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socketMock.socket),
}));

import { io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  beforeEach(() => {
    socketMock.socket.connected = false;
    socketMock.socket.on.mockClear();
    socketMock.socket.emit.mockClear();
    socketMock.socket.connect.mockClear();
    socketMock.socket.disconnect.mockClear();
    socketMock.socket.removeAllListeners.mockClear();
    socketMock.socket.io.on.mockClear();
    socketMock.socket.io.removeAllListeners.mockClear();
    socketMock.listeners.clear();
    socketMock.managerListeners.clear();
    vi.mocked(io).mockClear();
  });

  it('connects with the raw JWT and restores cash subscriptions on connect', () => {
    const service = new RealtimeService();
    service.subscribeToCashRegister(4);

    service.connect('jwt-token');

    expect(io).toHaveBeenCalledWith(`${environment.realtimeUrl}${environment.realtimeNamespace}`, {
      auth: { token: 'jwt-token' },
      autoConnect: false,
      reconnection: true,
    });
    expect(socketMock.socket.connect).toHaveBeenCalledOnce();
    socketMock.socket.connected = true;
    socketMock.listeners.get('connect')?.();
    expect(service.connectionState()).toBe('connected');
    expect(socketMock.socket.emit).toHaveBeenCalledWith('cash.subscribe', {
      cashRegisterId: 4,
    });
  });

  it('forwards events as invalidation signals without retaining payload state', () => {
    const service = new RealtimeService();
    const listener = vi.fn();
    service.onEvent(listener);
    service.connect('jwt-token');
    const event = {
      name: 'sale.paid' as const,
      occurredAt: '2026-09-17T10:00:00.000Z',
      entityId: 8,
      cashRegisterId: 4,
    };

    socketMock.listeners.get('sale.paid')?.(event);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it('reports reconnecting and fully disconnects on logout cleanup', () => {
    const service = new RealtimeService();
    service.connect('jwt-token');

    socketMock.managerListeners.get('reconnect_attempt')?.();
    expect(service.connectionState()).toBe('reconnecting');
    service.disconnect();

    expect(socketMock.socket.removeAllListeners).toHaveBeenCalledOnce();
    expect(socketMock.socket.io.removeAllListeners).toHaveBeenCalledOnce();
    expect(socketMock.socket.disconnect).toHaveBeenCalledOnce();
    expect(service.connectionState()).toBe('disconnected');
  });
});
