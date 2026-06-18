// Помилка з HTTP-статусом — кидається в сервісах, перетворюється у відповідь в errorHandler
export default class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
