// Розширюємо Express.Request полем, яке кладе middleware auth
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string };
    }
  }
}

export {};
