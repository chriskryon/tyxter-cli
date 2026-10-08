import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('listen command output', () => {
  it('keeps --from-now --json output as JSON Lines', async () => {
    const stateDir = await mkdtemp(join(tmpdir(), 'tyxter-listen-test-'));
    const server = createServer((request, response) => {
      if (!request.url?.startsWith('/v1/webhook-events/listen')) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        object: 'webhook_event_listen',
        data: [],
        has_more: false,
        next_cursor: 'cur_test',
      }));
    });

    try {
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing test server port.');
      const { stdout, stderr } = await execFileAsync(process.execPath, [
        '--import', 'tsx', 'src/main.ts', 'listen', '--from-now', '--json', '--once',
        '--api-url', `http://127.0.0.1:${address.port}`,
        '--api-key', 'tx_sandbox_test',
        '--forward-to', `http://127.0.0.1:${address.port}/webhook`,
        '--state-dir', stateDir,
      ], { timeout: 10_000 });

      expect(stderr).toBe('');
      const lines = stdout.trim().split(/\r?\n/).map((line) => JSON.parse(line));
      expect(lines.map((line) => line.object)).toEqual([
        'tyxter_cli_listen_checkpoint',
        'tyxter_cli_listen_start',
        'tyxter_cli_listen_batch',
      ]);
      expect(lines[0]).toMatchObject({ skipped: 0, cursor: 'cur_test' });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(stateDir, { recursive: true, force: true });
    }
  });
});
