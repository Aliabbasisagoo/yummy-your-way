import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Frown, Meh, Smile, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { analyzeReview, type AnalyzedReview, type ReviewCategory } from '@/lib/review-sense'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [
    { title: 'Admin · ReviewSense — SAGE Cafe & Grill' },
    { name: 'description', content: 'Analyze SAGE customer reviews and sort them into positive, neutral and negative.' },
    { property: 'og:title', content: 'ReviewSense — SAGE admin' },
    { property: 'og:description', content: 'Instant review sentiment analysis for SAGE Cafe & Grill.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: Admin,
})

const KEY = 'reviewsense.reviews'
const COLS: { key: ReviewCategory; label: string; Icon: typeof Smile }[] = [
  { key: 'positive', label: 'Positive', Icon: Smile },
  { key: 'neutral', label: 'Neutral', Icon: Meh },
  { key: 'negative', label: 'Negative', Icon: Frown },
]

function Admin() {
  const [text, setText] = useState('')
  const [reviews, setReviews] = useState<AnalyzedReview[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { try { setReviews(JSON.parse(localStorage.getItem(KEY) ?? '[]')) } catch { /* ignore */ } setLoaded(true) }, [])
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(reviews)) }, [reviews, loaded])

  const analyze = () => {
    const t = text.trim()
    if (!t) { toast.error('Please enter a review.'); return }
    const r = analyzeReview(t)
    setReviews(p => [{ id: `${Date.now()}-${p.length}`, text: t, ...r, createdAt: new Date().toISOString() }, ...p])
    setText('')
    toast.success(`Marked as ${r.category} (score ${r.score > 0 ? '+' : ''}${r.score})`)
  }

  return <div className="rs">
    <Toaster />
    <header className="rs-header"><div><h1>ReviewSense</h1><p>Instant review sentiment analysis</p></div><Button variant="outline" asChild><Link to="/"><ArrowLeft />Back to site</Link></Button></header>
    <section className="rs-card">
      <textarea rows={5} placeholder="Paste your review here..." value={text} onChange={e => setText(e.target.value)} aria-label="Review text" />
      <div className="rs-actions"><Button onClick={analyze}>Analyze Sentiment</Button><Button variant="outline" onClick={() => setText('')}>Clear</Button><Button variant="ghost" onClick={() => toast('CSV upload coming soon')}><Upload />Upload CSV</Button></div>
    </section>
    <section className="rs-summary">{COLS.map(c => <div key={c.key} className={`rs-card rs-stat rs-${c.key}`}><c.Icon /><div><small>Total {c.label}</small><strong>{reviews.filter(r => r.category === c.key).length}</strong></div></div>)}</section>
    <section className="rs-columns">{COLS.map(c => <div key={c.key}><h2 className={`rs-${c.key}`}><c.Icon />{c.label} Reviews</h2>
      {reviews.filter(r => r.category === c.key).map(r => <article key={r.id} className="rs-card rs-review">
        <p>{r.text}</p>
        <div className="rs-meta"><span className={`rs-badge rs-${c.key}`}>Score: {r.score > 0 ? '+' : ''}{r.score}</span><span>{new Date(r.createdAt).toLocaleDateString()}</span><Button variant="ghost" size="icon" aria-label="Delete review" onClick={() => setReviews(p => p.filter(x => x.id !== r.id))}><Trash2 /></Button></div>
      </article>)}
    </div>)}</section>
  </div>
}
