import { endpointUrl, type FetchLike, readFailure } from './http.js';
import {
  WebhookListenSessionResponseSchema,
  type WebhookListenSessionResponse,
} from './schemas.js';

export interface CreateWebhookListenSessionOptions {
  readonly apiUrl: string;
  readonly apiKey: string;
  readonly ttlSeconds?: number;
  readonly reason?: string;
  readonly fetchFn?: FetchLike;
}

export interface DisableWebhookListenSessionOptions {
  readonly apiUrl: string;
  readonly apiKey: string;
  readonly listenSessionId: string;
  readonly fetchFn?: FetchLike;
}

export async function createWebhookListenSession(
  options: CreateWebhookListenSessionOptions,
): Promise<WebhookListenSessionResponse> {
  const fetchFn = options.fetchFn ?? fetch;
  const body: Record<string, unknown> = {};
  if (options.ttlSeconds !== undefined) body.ttl_seconds = options.ttlSeconds;
  if (options.reason) body.reason = options.reason;

  const response = await fetchFn(endpointUrl(options.apiUrl, '/v1/webhook-events/listen-sessions'), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) await readFailure(response, 'webhook listen session create');
  return WebhookListenSessionResponseSchema.parse(await response.json());
}

export async function disableWebhookListenSession(
  options: DisableWebhookListenSessionOptions,
): Promise<WebhookListenSessionResponse> {
  const fetchFn = options.fetchFn ?? fetch;
  const response = await fetchFn(
    endpointUrl(
      options.apiUrl,
      `/v1/webhook-events/listen-sessions/${encodeURIComponent(options.listenSessionId)}`,
    ),
    {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        accept: 'application/json',
      },
    },
  );
  if (!response.ok) await readFailure(response, 'webhook listen session disable');
  return WebhookListenSessionResponseSchema.parse(await response.json());
}
