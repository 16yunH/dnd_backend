import { randomUUID } from "node:crypto";
import type { UserRecord } from "../types/domain.js";
import { JsonStore } from "./jsonStore.js";

interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class AuthService {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly store: JsonStore;

  constructor(store: JsonStore) {
    this.store = store;
  }

  private purgeExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() <= now) {
        this.sessions.delete(token);
      }
    }
  }

  public async issueGuestSession(nickname: string): Promise<{
    user: UserRecord;
    accessToken: string;
    expiresAt: string;
  }> {
    const user = await this.store.getOrCreateUser(nickname);
    const token = `dev_${randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    this.sessions.set(token, {
      token,
      userId: user.id,
      expiresAt
    });

    return {
      user,
      accessToken: token,
      expiresAt
    };
  }

  public async verifyToken(token: string): Promise<UserRecord | null> {
    this.purgeExpiredSessions();
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    const user = await this.store.getUserById(session.userId);
    return user ?? null;
  }
}
