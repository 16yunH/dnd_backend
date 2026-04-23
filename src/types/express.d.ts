declare global {
  namespace Express {
    interface Request {
      auth?: {
        token: string;
        userId: string;
      };
    }
  }
}

export {};
