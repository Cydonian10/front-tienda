import { Injectable, inject } from '@angular/core';
import { LoginResponseDto } from '../../api/interfaces/access-control/auth.interface';
import { LocalStorageService } from '../../shared/services/local-storage/local-storage.service';

interface StoredSession {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

const STORAGE_KEY = 'front-tienda-auth';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly storage = inject(LocalStorageService);

  set(response: LoginResponseDto): void {
    const session: StoredSession = {
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    this.storage.set(STORAGE_KEY, session);
  }

  get(): StoredSession | null {
    const session = this.storage.get<StoredSession>(STORAGE_KEY);

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
    this.storage.remove(STORAGE_KEY);
  }
}
