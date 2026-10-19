import { describe, expect, it } from 'vitest'
import { analyzeReview, categorize } from '@/lib/review-sense'

describe('review categorization', () => {
  it('score above 1 is positive', () => { expect(categorize(2)).toBe('positive') })
  it('score below -1 is negative', () => { expect(categorize(-2)).toBe('negative') })
  it('scores from -1 to 1 are neutral', () => {
    expect(categorize(1)).toBe('neutral'); expect(categorize(-1)).toBe('neutral'); expect(categorize(0)).toBe('neutral')
  })
  it('analyzes real text', () => {
    expect(analyzeReview('Amazing food, wonderful staff, loved it').category).toBe('positive')
    expect(analyzeReview('Terrible service, awful cold food, horrible').category).toBe('negative')
  })
})
