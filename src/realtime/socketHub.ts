import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { AuthService } from "../services/authService.js";
import { RoomService, type RoomPublisher } from "../services/roomService.js";
import type { RoomMessageRecord, RoomRecord } from "../types/domain.js";

const roomChannel = (roomId: string) => `room:${roomId.toUpperCase()}`;

interface JoinPayload {
  roomId: string;
}

interface LeavePayload {
  roomId: string;
}

const parseBearerToken = (value: string | undefined): string => {
  if (!value) return "";
  const [scheme, token] = value.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return token ?? "";
};

export class SocketHub implements RoomPublisher {
  private readonly io: Server;
  private readonly authService: AuthService;
  private readonly roomService: RoomService;

  constructor(server: HttpServer, deps: { authService: AuthService; roomService: RoomService }) {
    this.authService = deps.authService;
    this.roomService = deps.roomService;

    this.io = new Server(server, {
      cors: {
        origin: "*"
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const tokenFromAuth = String((socket.handshake.auth as any)?.token || "");
        const tokenFromHeader = parseBearerToken(
          typeof socket.handshake.headers.authorization === "string"
            ? socket.handshake.headers.authorization
            : undefined
        );
        const token = tokenFromAuth || tokenFromHeader;

        if (!token) {
          return next(new Error("UNAUTHORIZED"));
        }

        const user = await this.authService.verifyToken(token);
        if (!user) {
          return next(new Error("UNAUTHORIZED"));
        }

        (socket.data as any).auth = {
          token,
          userId: user.id,
          nickname: user.nickname
        };
        return next();
      } catch {
        return next(new Error("UNAUTHORIZED"));
      }
    });

    this.io.on("connection", (socket) => {
      socket.on("room:join", async (payload: JoinPayload) => {
        const roomId = String(payload?.roomId || "").toUpperCase();
        if (!roomId) {
          socket.emit("room:error", { message: "缺少房间号" });
          return;
        }

        try {
          const auth = (socket.data as any).auth;
          const room = await this.roomService.getRoom(roomId);
          const inRoom = room.players.some((player) => player.userId === auth.userId);
          if (!inRoom) {
            socket.emit("room:error", { message: "你未加入该房间" });
            return;
          }

          socket.join(roomChannel(roomId));
          socket.emit("room:snapshot", { room });

          const messages = await this.roomService.listMessages(roomId, 0, 200);
          socket.emit("room:messages", {
            roomId,
            roomVersion: room.roomVersion,
            messages
          });
        } catch (error: any) {
          socket.emit("room:error", {
            message: error?.message || "加入房间实时通道失败"
          });
        }
      });

      socket.on("room:leave", (payload: LeavePayload) => {
        const roomId = String(payload?.roomId || "").toUpperCase();
        if (!roomId) return;
        socket.leave(roomChannel(roomId));
      });
    });
  }

  public publishRoomSnapshot(room: RoomRecord) {
    this.io.to(roomChannel(room.id)).emit("room:snapshot", { room });
  }

  public publishRoomMessages(
    roomId: string,
    messages: RoomMessageRecord[],
    roomVersion: number
  ) {
    if (messages.length === 0) {
      return;
    }
    this.io.to(roomChannel(roomId)).emit("room:messages", {
      roomId,
      roomVersion,
      messages
    });
  }
}
