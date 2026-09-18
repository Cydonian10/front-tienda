import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { RealtimeConnectionState, RealtimeEvent, RealtimeEventName } from './realtime-event.model';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private readonly cashRegisterIds = new Set<number>();
  private readonly eventListeners = new Set<(event: RealtimeEvent) => void>();
  private readonly connectionStateSignal = signal<RealtimeConnectionState>('disconnected');

  readonly connectionState = this.connectionStateSignal.asReadonly();

  connect(token: string): void {
    if (this.socket && this.token === token) {
      if (!this.socket.connected) {
        this.connectionStateSignal.set('connecting');
        this.socket.connect();
      }
      return;
    }

    if (this.socket) {
      this.disconnect();
    }
    this.token = token;
    this.connectionStateSignal.set('connecting');
    const socket = io(`${environment.realtimeUrl}${environment.realtimeNamespace}`, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
    });
    this.socket = socket;

    socket.on('connect', () => {
      if (this.socket !== socket) {
        return;
      }
      this.connectionStateSignal.set('connected');
      this.resubscribeToCashRegisters(socket);
    });
    socket.on('disconnect', () => {
      if (this.socket === socket) {
        this.connectionStateSignal.set('disconnected');
      }
    });
    socket.on('connect_error', () => {
      if (this.socket === socket) {
        this.connectionStateSignal.set('reconnecting');
      }
    });
    socket.io.on('reconnect_attempt', () => {
      if (this.socket === socket) {
        this.connectionStateSignal.set('reconnecting');
      }
    });
    this.listenForEvents(socket);
    socket.connect();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.io.removeAllListeners();
      this.socket.disconnect();
    }
    this.socket = null;
    this.token = null;
    this.cashRegisterIds.clear();
    this.connectionStateSignal.set('disconnected');
  }

  subscribeToCashRegister(cashRegisterId: number): void {
    this.cashRegisterIds.add(cashRegisterId);
    if (this.socket?.connected) {
      this.socket.emit('cash.subscribe', { cashRegisterId });
    }
  }

  onEvent(listener: (event: RealtimeEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private listenForEvents(socket: Socket): void {
    const eventNames: RealtimeEventName[] = [
      'sale.created',
      'sale.paid',
      'sale.cancelled',
      'cash.opened',
      'cash.closed',
      'cash.movement.created',
      'stock.low',
    ];
    eventNames.forEach((name) => {
      socket.on(name, (event: RealtimeEvent) => {
        if (this.socket === socket) {
          this.eventListeners.forEach((listener) => listener(event));
        }
      });
    });
  }

  private resubscribeToCashRegisters(socket: Socket): void {
    this.cashRegisterIds.forEach((cashRegisterId) => {
      socket.emit('cash.subscribe', { cashRegisterId });
    });
  }
}
