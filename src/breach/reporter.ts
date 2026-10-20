// Reports the quest progress to the worker in the order and pace it accepts: steps 1..5, each at least 10 s after the
// previous one, then finish (at least 90 s after the start). Stages can be faster than that; reports then simply wait.
// Network failures are retried; the page reads `state` to show whether the reward is verified.

import { ApiError, questFinish, questStart, questStep } from './api';
import type { QuestRun } from './api';

const STEP_GAP_MS = 10_500;
const MIN_RUN_MS = 91_000;
const RETRIES = 8;

export type ReportState = 'starting' | 'running' | 'finishing' | 'verified' | 'failed';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class QuestReporter {
  run: QuestRun | null = null;
  state: ReportState = 'starting';
  error: string | null = null;
  private startedAt = 0;
  private lastAck = 0;
  private queue: Promise<void>;
  private listeners = new Set<() => void>();
  private stopped = false;

  constructor() {
    this.queue = this.begin();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(state: ReportState, error: string | null = this.error): void {
    this.state = state;
    this.error = error;
    this.listeners.forEach((l) => l());
  }

  private async begin(): Promise<void> {
    try {
      this.run = await this.withRetry(() => questStart());
      this.startedAt = Date.now();
      this.lastAck = this.startedAt;
      this.set('running', null);
    } catch (e) {
      this.set('failed', e instanceof ApiError ? e.code : 'server_error');
    }
  }

  /** Queues step `n` (1..5). */
  step(n: number): void {
    this.queue = this.queue.then(async () => {
      if (!this.run || this.state === 'failed' || this.stopped) return;
      await this.waitUntil(this.lastAck + STEP_GAP_MS);
      try {
        await this.withRetry(() => questStep(this.run!, n));
        this.lastAck = Date.now();
      } catch (e) {
        this.set('failed', e instanceof ApiError ? e.code : 'server_error');
      }
    });
  }

  /** Queues the finish; resolves when the run is verified (or failed). */
  finish(): Promise<void> {
    this.queue = this.queue.then(async () => {
      if (!this.run || this.state === 'failed' || this.stopped) return;
      this.set('finishing');
      await this.waitUntil(this.startedAt + MIN_RUN_MS);
      try {
        await this.withRetry(() => questFinish(this.run!));
        this.set('verified', null);
      } catch (e) {
        this.set('failed', e instanceof ApiError ? e.code : 'server_error');
      }
    });
    return this.queue;
  }

  stop(): void {
    this.stopped = true;
  }

  private async waitUntil(time: number): Promise<void> {
    const wait = time - Date.now();
    if (wait > 0) await sleep(wait);
  }

  /** Retries offline errors and "too early" answers (waiting as long as the worker says); other errors are final. */
  private async withRetry<T>(call: () => Promise<T>): Promise<T> {
    let last: unknown;
    for (let attempt = 0; attempt < RETRIES; attempt++) {
      if (this.stopped) break;
      try {
        return await call();
      } catch (e) {
        last = e;
        if (!(e instanceof ApiError)) throw e;
        if (e.code === 'too_early') await sleep((e.wait ?? 1000) + 400);
        else if (e.code === 'offline' || (e.status >= 500 && e.code !== 'not_configured')) await sleep(1500 * (attempt + 1));
        else throw e;
      }
    }
    throw last ?? new ApiError(0, 'offline');
  }
}
