import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { LoginResponseDto } from '../../api/interfaces/access-control/auth.interface';

interface StoredSession {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

const STORAGE_KEY = 'front-tienda-auth';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly document = inject(DOCUMENT);
  private fallbackSession: StoredSession | null = null;

  set(response: LoginResponseDto): void {
    const session: StoredSession = {
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    this.fallbackSession = session;
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // If storage is blocked, the session is kept only in memory.
    }
  }

  get(): StoredSession | null {
    let session = this.fallbackSession;
    let saved: string | null | undefined;
    try {
      saved = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Use the in-memory session if storage is unavailable.
    }

    if (saved !== undefined) {
      try {
        session = saved ? (JSON.parse(saved) as StoredSession) : null;
      } catch {
        this.clear();
        return null;
      }
    }

    if (
      !session ||
      typeof session.accessToken !== 'string' ||
      !session.accessToken ||
      typeof session.tokenType !== 'string' ||
      !session.tokenType ||
      typeof session.expiresAt !== 'number' ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      if (session) this.clear();
      return null;
    }

    return session;
  }

  clear(): void {
    this.fallbackSession = null;
    try {
      this.document.defaultView?.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory session is already cleared.
    }
  }
}
