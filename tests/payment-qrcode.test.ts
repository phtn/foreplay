import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PaymentQRCode } from '../app/admin/config/_contents/payment-qrcode'
import type { Id } from '../convex/_generated/dataModel'

test('payment QR export surface includes the destination details and generated QR', () => {
  const html = renderToStaticMarkup(
    createElement(PaymentQRCode, {
      paymentMethod: {
        _id: 'paymentMethod123' as Id<'paymentMethods'>,
        _creationTime: 1,
        kind: 'manual',
        label: 'BDO',
        bankOrEwallet: 'BDO',
        accountName: 'Seoul of Manila',
        accountNumber: '0000 1111 2222',
        qrCodeContent: '000201010211PAYMENT-DESTINATION',
        qrCodeImageUrl: null,
        isActive: true,
        createdAt: 1,
        updatedAt: 1
      }
    })
  )

  assert.match(html, /data-ticket-export-root/)
  assert.match(html, />Seoul of Manila</)
  assert.match(html, /BDO · 0000 1111 2222/)
  assert.match(
    html,
    /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" version="1\.1" viewBox="0 0 512 512"/
  )
  assert.match(html, />foreplay\.pro</)
    assert.match(html, />Download</)

  const qrSurface = html.match(/role="img"[^>]*class="([^"]*)"/)
  assert.ok(qrSurface)
  assert.match(qrSurface[1] ?? '', /border-slate-200/)
  assert.doesNotMatch(qrSurface[1] ?? '', /border-primary/)
})

test('payment QR preview degrades safely when saved content cannot be encoded', () => {
  const html = renderToStaticMarkup(
    createElement(PaymentQRCode, {
      paymentMethod: {
        _id: 'paymentMethod456' as Id<'paymentMethods'>,
        _creationTime: 1,
        kind: 'manual',
        label: 'Manual Payments',
        bankOrEwallet: 'Bank',
        accountName: 'Account holder',
        accountNumber: '1234',
        qrCodeContent: 'x'.repeat(10_000),
        qrCodeImageUrl: null,
        isActive: false,
        createdAt: 1,
        updatedAt: 1
      }
    })
  )

  assert.match(html, />QR unavailable</)
  assert.doesNotMatch(html, /<svg[^>]*width="512"/)
  assert.match(html, /<button[^>]*disabled/)
})
