// src/utils.ts

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
import axios, { AxiosResponse } from 'axios';

/**
 * Fetches the given URL with axios.get, retrying up to `maxRetries` times
 * on network errors or HTTP 429 (rate limit), doubling the wait each time.
 *
 * @param url        full request URL
 * @param maxRetries how many times to retry before giving up
 * @param backoffMs  initial delay in ms before the first retry
 */
export async function requestWithRetry(
  url: string,
  maxRetries = 3,
  backoffMs = 500
): Promise<AxiosResponse> {
  try {
    return await axios.get(url);
  } catch (err: any) {
    const status = err.response?.status;

    // Retry on 429 or on no HTTP response (network error)
    if (maxRetries > 0 && (status === 429 || !err.response)) {
      // wait
      await delay(backoffMs);
      // try again, halving the remaining retries and doubling the delay
      return requestWithRetry(url, maxRetries - 1, backoffMs * 2);
    }

    // Otherwise, re-throw the error
    throw err;
  }
}