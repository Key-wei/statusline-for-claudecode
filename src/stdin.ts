import { StdinData } from './types';

/**
 * Read and parse Claude Code stdin JSON.
 * Claude Code pipes a JSON object via stdin on each statusline refresh.
 * Returns null if stdin is empty or invalid.
 */
export function readStdin(): Promise<StdinData | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const stdin = process.stdin;

    stdin.setEncoding('utf8');

    // If stdin is a TTY (interactive), no data will come
    if (stdin.isTTY) {
      resolve(null);
      return;
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 1000);

    stdin.on('data', (chunk: string | Buffer) => {
      chunks.push(Buffer.from(chunk));
    });

    stdin.on('end', () => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;

      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw) as StdinData);
      } catch {
        resolve(null);
      }
    });

    stdin.on('error', () => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    stdin.resume();
  });
}
