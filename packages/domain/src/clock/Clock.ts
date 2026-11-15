export interface Clock {
  now(): Date;
  iso(): string;
  epochMs(): number;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  iso(): string {
    return new Date().toISOString();
  }

  epochMs(): number {
    return Date.now();
  }
}

export class FakeClock implements Clock {
  private currentTime: Date;

  constructor(initialTime: Date | string = new Date('2026-11-15T08:00:00.000Z')) {
    this.currentTime = typeof initialTime === 'string' ? new Date(initialTime) : new Date(initialTime);
  }

  now(): Date {
    return new Date(this.currentTime);
  }

  iso(): string {
    return this.currentTime.toISOString();
  }

  epochMs(): number {
    return this.currentTime.getTime();
  }

  advanceMinutes(minutes: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + minutes * 60 * 1000);
  }

  advanceHours(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 60 * 60 * 1000);
  }

  advanceDays(days: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + days * 24 * 60 * 60 * 1000);
  }

  setTime(time: Date | string): void {
    this.currentTime = typeof time === 'string' ? new Date(time) : new Date(time);
  }
}
