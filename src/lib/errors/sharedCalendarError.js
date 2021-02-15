export default class SharedCalendarError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SharedCalendarError';
  }
}
