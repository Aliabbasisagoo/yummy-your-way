import Sentiment from 'sentiment'

export type ReviewCategory = 'positive' | 'neutral' | 'negative'
export type AnalyzedReview = { id: string; text: string; score: number; category: ReviewCategory; createdAt: string }

export function categorize(score: number): ReviewCategory {
  if (score > 1) return 'positive'
  if (score < -1) return 'negative'
  return 'neutral'
}

let engine: Sentiment | null = null
export function analyzeReview(text: string): { score: number; category: ReviewCategory } {
  engine ??= new Sentiment()
  const score = engine.analyze(text).score
  return { score, category: categorize(score) }
}
