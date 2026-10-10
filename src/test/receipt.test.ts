import { describe, expect, it } from 'vitest'

import { buildReceipt, makeOrderRef, orderLines, orderTotals } from '../lib/receipt'
import { money } from '../lib/menu'

const placedAt = new Date('2026-10-10T17:00:00Z')

describe('order receipt', () => {
  it('takes prices from the menu and ignores dishes that are not on it', () => {
    expect(orderLines({ karahi: 2, biryani: 1, 'not-a-dish': 5 })).toEqual([
      { id: 'karahi', name: 'Chicken Karahi', quantity: 2, unitPrice: 1450, lineTotal: 2900, portion: 'Half kg' },
      { id: 'biryani', name: 'Chicken Biryani', quantity: 1, unitPrice: 450, lineTotal: 450, portion: 'Single serving' },
    ])
  })

  it('totals the basket from menu prices', () => {
    expect(orderTotals({ karahi: 1, naan: 3 }).total).toBe(1750)
  })

  it('names the location, the customer and the amount owed', () => {
    const receipt = buildReceipt(
      {
        cart: { karahi: 1 },
        mode: 'Delivery',
        locationName: 'Satellite Town, Rawalpindi',
        customerName: 'Ali Khan',
        customerPhone: '0300 1234567',
      },
      'ANK-20261010-7KQ4',
      placedAt,
    )

    expect(receipt).toContain('ANK-20261010-7KQ4')
    expect(receipt).toContain('Type: Delivery')
    expect(receipt).toContain('Location: Satellite Town, Rawalpindi')
    expect(receipt).toContain('Customer: Ali Khan')
    expect(receipt).toContain('Phone: 0300 1234567')
    expect(receipt).toContain(`• 1 × Chicken Karahi (Half kg) — ${money(1450)}`)
    expect(receipt).toContain(`*Total: ${money(1450)}*`)
  })

  it('leaves out the phone number and the note when they were not given', () => {
    const receipt = buildReceipt(
      { cart: { naan: 2 }, mode: 'Pick-Up', locationName: 'Commercial Market', customerName: 'Sara' },
      'ANK-20261010-AAAA',
      placedAt,
    )

    expect(receipt).not.toContain('Phone:')
    expect(receipt).not.toContain('Note:')
    expect(receipt).toContain(`• 2 × Butter Naan — ${money(200)}`)
  })

  it('carries the customer note through to the restaurant', () => {
    const receipt = buildReceipt(
      { cart: { naan: 1 }, mode: 'Pick-Up', locationName: 'Commercial Market', customerName: 'Sara', note: 'Extra spicy' },
      'ANK-20261010-BBBB',
      placedAt,
    )

    expect(receipt).toContain('Note: Extra spicy')
  })

  it('makes a fresh reference for every order', () => {
    const refs = new Set(Array.from({ length: 200 }, () => makeOrderRef(placedAt)))
    expect(refs.size).toBeGreaterThan(190)
    expect([...refs][0]).toMatch(/^ANK-20261010-[A-Z2-9]{4}$/)
  })
})
