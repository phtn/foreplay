import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { after, beforeEach, test } from 'node:test'

import { handleResendWebhookRequest } from './route'

const WEBHOOK_SECRET = `whsec_${Buffer.from('foreplay-resend-webhook-test-secret').toString('base64')}`
const WEBHOOK_ID = 'msg_webhook_test'

const payload = JSON.stringify(
  {
    created_at: '2026-08-01T04:00:00.000Z',
    data: {
      created_at: '2026-08-01T04:00:00.000Z',
      email_id: 'email_test',
      from: 'Foreplay <hello@foreplay.pro>',
      subject: 'Webhook verification test',
      to: ['golfer@example.com']
    },
    type: 'email.delivered'
  },
  null,
  2
)

const originalEnvironment = {
  apiKey: process.env.RESEND_API_KEY_TEST,
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET
}

const routeDependencies = {
  handleEvent: async () => undefined,
  persistEvent: async () => undefined
}

const postWebhook = (request: Request) => handleResendWebhookRequest(request, routeDependencies)

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}

function signPayload(body: string, id: string, timestamp: string) {
  const signingKey = Buffer.from(WEBHOOK_SECRET.slice('whsec_'.length), 'base64')
  const signature = createHmac('sha256', signingKey).update(`${id}.${timestamp}.${body}`).digest('base64')

  return `v1,${signature}`
}

function createWebhookRequest(body = payload) {
  const timestamp = Math.floor(Date.now() / 1000).toString()

  return new Request('http://localhost/api/resend/webhooks', {
    body,
    headers: {
      'content-type': 'application/json',
      'svix-id': WEBHOOK_ID,
      'svix-signature': signPayload(body, WEBHOOK_ID, timestamp),
      'svix-timestamp': timestamp
    },
    method: 'POST'
  })
}

beforeEach(() => {
  process.env.RESEND_API_KEY_TEST = 're_webhook_test'
  process.env.RESEND_WEBHOOK_SECRET = WEBHOOK_SECRET
})

after(() => {
  restoreEnvironmentVariable('RESEND_API_KEY_TEST', originalEnvironment.apiKey)
  restoreEnvironmentVariable('RESEND_WEBHOOK_SECRET', originalEnvironment.webhookSecret)
})

test('accepts a webhook signed over the untouched request body', async () => {
  let persistedWebhookId: string | null = null
  const response = await handleResendWebhookRequest(createWebhookRequest(), {
    handleEvent: async () => undefined,
    persistEvent: async ({ webhookId }) => {
      persistedWebhookId = webhookId
    }
  })

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { received: true })
  assert.equal(persistedWebhookId, WEBHOOK_ID)
})

test('rejects a payload that does not match its signature', async () => {
  const request = createWebhookRequest()
  const tamperedRequest = new Request(request, { body: payload.replace('email.delivered', 'email.bounced') })
  const response = await postWebhook(tamperedRequest)

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Invalid webhook signature.', received: false })
})

test('rejects requests without all Resend signature headers', async () => {
  const response = await postWebhook(
    new Request('http://localhost/api/resend/webhooks', {
      body: payload,
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    })
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Missing webhook signature headers.', received: false })
})

test('fails closed when the webhook secret is not configured', async () => {
  delete process.env.RESEND_WEBHOOK_SECRET

  const response = await postWebhook(createWebhookRequest())

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'Webhook verification is not configured.', received: false })
})

test('rejects an oversized payload before reading the request body', async () => {
  const request = createWebhookRequest()
  request.headers.set('content-length', String(1024 * 1024 + 1))

  const response = await postWebhook(request)

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'Webhook payload is too large.', received: false })
})

test('asks Resend to retry when a verified event cannot be persisted', async () => {
  const response = await handleResendWebhookRequest(createWebhookRequest(), {
    handleEvent: async () => undefined,
    persistEvent: async () => {
      throw new Error('Convex unavailable')
    }
  })

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'Webhook processing failed.', received: false })
})
