import type {
  GridToken,
  RoomMessageRecord,
  RoomRecord,
  UserRecord
} from "../types/domain.js";
import type { NarrativeService } from "./narrativeService.js";
import { RoomLobbyService } from "./roomLobbyService.js";
import { RoomNarrativeService } from "./roomNarrativeService.js";
import type { Store } from "./store.js";

export interface RoomPublisher {
  publishRoomSnapshot(room: RoomRecord): void;
  publishRoomMessages(
    roomId: string,
    messages: RoomMessageRecord[],
    roomVersion: number
  ): void;
  publishGridUpdate(roomId: string, grid: RoomRecord["grid"]): void;
}

export class RoomService {
  private readonly lobby: RoomLobbyService;
  private readonly narrative: RoomNarrativeService;

  constructor(
    store: Store,
    options: { publisher?: RoomPublisher; narrative?: NarrativeService } = {}
  ) {
    this.lobby = new RoomLobbyService(store, { publisher: options.publisher });
    this.narrative = new RoomNarrativeService(store, {
      publisher: options.publisher,
      narrative: options.narrative
    });
  }

  public setPublisher(publisher: RoomPublisher) {
    this.lobby.setPublisher(publisher);
    this.narrative.setPublisher(publisher);
  }

  public async createRoom(user: UserRecord, input: {
    maxPlayers: number;
    isPrivate: boolean;
    password: string;
    expansion: string;
    campaign: string;
  }): Promise<RoomRecord> {
    return this.lobby.createRoom(user, input);
  }

  public async getRoom(roomId: string): Promise<RoomRecord> {
    return this.lobby.getRoom(roomId);
  }

  public async joinRoom(
    user: UserRecord,
    roomId: string,
    password?: string
  ): Promise<RoomRecord> {
    return this.lobby.joinRoom(user, roomId, password);
  }

  public async leaveRoom(user: UserRecord, roomId: string): Promise<RoomRecord> {
    return this.lobby.leaveRoom(user, roomId);
  }

  public async setReady(
    user: UserRecord,
    roomId: string,
    input: {
      isReady: boolean;
      characterId?: string;
      expectedRoomVersion?: number;
    }
  ): Promise<RoomRecord> {
    return this.lobby.setReady(user, roomId, input);
  }

  public async startRoom(
    user: UserRecord,
    roomId: string,
    input: { expectedRoomVersion?: number }
  ): Promise<RoomRecord> {
    return this.lobby.startRoom(user, roomId, input);
  }

  public async listMessages(
    roomId: string,
    afterSeq = 0,
    limit = 100
  ): Promise<RoomMessageRecord[]> {
    return this.narrative.listMessages(roomId, afterSeq, limit);
  }

  public async initGrid(roomId: string, width: number, height: number): Promise<RoomRecord> {
    return this.lobby.initGrid(roomId, width, height);
  }

  public async moveToken(roomId: string, tokenId: string, x: number, y: number): Promise<RoomRecord> {
    return this.lobby.moveToken(roomId, tokenId, x, y);
  }

  public async addToken(roomId: string, input: Omit<GridToken, "id">): Promise<RoomRecord> {
    return this.lobby.addToken(roomId, input);
  }

  public async removeToken(roomId: string, tokenId: string): Promise<RoomRecord> {
    return this.lobby.removeToken(roomId, tokenId);
  }

  public async submitAction(
    user: UserRecord,
    roomId: string,
    input: { content: string }
  ): Promise<{
    room: RoomRecord;
    messages: RoomMessageRecord[];
  }> {
    return this.narrative.submitAction(user, roomId, input);
  }
}
