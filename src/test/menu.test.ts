import { describe, expect, it } from 'vitest'
import { cartTotal, changeQuantity } from '../lib/menu'
describe('basket calculations', () => {
  it('calculates a basket with multiple dishes', () => {
    expect(cartTotal({karahi:2,biryani:1})).toBe(3350)
  })
  it('removes an item when its last portion is removed', () => {
    expect(changeQuantity({karahi:1}, 'karahi', -1)).toEqual({})
  })
  it('never creates negative quantities', () => {
    expect(changeQuantity({}, 'karahi', -1)).toEqual({})
  })
})
