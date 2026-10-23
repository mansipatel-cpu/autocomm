import { logger } from '../utils/logger.js';

/**
 * Token Bucket Rate Limiter with Request Queue & 429 Backoff
 * Rule 2: Respect the rate limit: 120 requests/min per API key. Queue and retry on HTTP 429 with backoff.
 */
export class RateLimiter {
  constructor(maxRequestsPerMinute = 120) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.intervalMs = 60000 / maxRequestsPerMinute; // 500ms between tokens for 120 req/min
    this.tokens = maxRequestsPerMinute;
    this.maxTokens = maxRequestsPerMinute;
    this.lastRefill = Date.now();
    this.queue = [];
    this.isProcessing = false;
    this.pausedUntil = 0;

    // Periodically refill tokens
    setInterval(() => this.refill(), 1000);
  }

  refill() {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const tokensToAdd = (elapsedMs / 60000) * this.maxRequestsPerMinute;
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async acquireToken() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();

      // Check if paused due to HTTP 429 rate limit backoff
      if (this.pausedUntil > now) {
        const waitTime = this.pausedUntil - now;
        logger.warn(`Rate limiter in backoff pause, waiting ${waitTime}ms...`);
        await new Promise((r) => setTimeout(r, waitTime));
      }

      this.refill();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        const resolve = this.queue.shift();
        resolve();
      } else {
        // Wait until next token is available
        const waitTime = Math.max(50, this.intervalMs);
        await new Promise((r) => setTimeout(r, waitTime));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Pause the queue when an external 429 Too Many Requests response is encountered
   * @param {number} backoffMs
   */
  handle429(backoffMs = 2000) {
    const targetPause = Date.now() + backoffMs;
    if (targetPause > this.pausedUntil) {
      this.pausedUntil = targetPause;
      logger.warn(`Rate limit 429 triggered from AutoComm API. Pausing request queue for ${backoffMs}ms`);
    }
  }
}

export const rateLimiter = new RateLimiter(120);
