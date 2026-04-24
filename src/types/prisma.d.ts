declare module "../../generated/prisma/client.js" {
  export class PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction<R>(fn: (tx: any) => Promise<R>): Promise<R>;
    user: any;
    character: any;
    room: any;
    roomPlayer: any;
    roomMessage: any;
    roomSummary: any;
    ruleChunk: any;
    session: any;
  }
}
