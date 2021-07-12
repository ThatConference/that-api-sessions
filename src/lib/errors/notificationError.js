export default class NotificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotificationError';
  }
}
