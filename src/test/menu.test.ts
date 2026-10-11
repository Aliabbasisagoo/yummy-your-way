import { describe, expect, it } from 'vitest'
import { cartTotal, changeQuantity } from '../lib/menu'
describe('basket calculations', () => {
  it('calculates a basket with multiple dishes', () => {
    expect(cartTotal({ 'tarragon-steak': 2, 'chicken-parm': 1 })).toBe(6790)
  })
  it('removes an item when its last portion is removed', () => {
    expect(changeQuantity({ 'sage-burger': 1 }, 'sage-burger', -1)).toEqual({})
  })
  it('never creates negative quantities', () => {
    expect(changeQuantity({}, 'sage-burger', -1)).toEqual({})
  })
})
