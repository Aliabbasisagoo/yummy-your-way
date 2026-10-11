import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Flame, Leaf, Loader2, MapPin, Minus, Phone, Plus, Search, ShoppingBag, Sparkles, Star, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { categories, menuItems, money, cartTotal, changeQuantity, restaurant, reviews, type MenuItem } from '@/lib/menu'
import { placeOrder } from '@/lib/orders.functions'
import interior from '@/assets/sage-interior.jpg'
import steak from '@/assets/steak.jpg'
import pasta from '@/assets/pasta.jpg'
import burger from '@/assets/burger.jpg'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'SAGE Cafe & Grill F-7 Islamabad — Steaks, Pasta & Burgers' },
    { name: 'description', content: 'SAGE Cafe & Grill on Bhittai Road, F-7 Markaz, Islamabad. Open daily 12 PM – 12 AM. Famous for chicken parmesan, tarragon steak and burgers. Order online.' },
    { property: 'og:title', content: 'SAGE Cafe & Grill — F-7 Markaz, Islamabad' },
    { property: 'og:description', content: 'Steaks, pastas and burgers loved by Islamabad since 2010. Rated 4.4★ by 1,200+ diners.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
})

const PICKUP = `Pick-up · ${restaurant.branch}`

function Brand() {
  return <div className="brand"><div className="brand-seal"><Leaf /></div><div><div className="brand-name">SAGE</div><div className="brand-subtitle">Cafe & Grill · F-7</div></div></div>
}

function useTilt(max = 10) {
  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5
    e.currentTarget.style.transform = `rotateY(${x * max}deg) rotateX(${-y * max}deg)`
  }
  const onMouseLeave = (e: MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = '' }
  return { onMouseMove, onMouseLeave }
}

function Hero({ onMenu }: { onMenu: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const [embers, setEmbers] = useState<{ left: number; dur: number; delay: number }[]>([])
  useEffect(() => { setEmbers(Array.from({ length: 22 }, () => ({ left: Math.random() * 100, dur: 6 + Math.random() * 8, delay: -Math.random() * 12 }))) }, [])
  const move = (e: MouseEvent<HTMLElement>) => {
    const x = e.clientX / window.innerWidth - .5, y = e.clientY / window.innerHeight - .5
    if (stageRef.current) stageRef.current.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 16}deg)`
    if (bgRef.current) bgRef.current.style.transform = `translateZ(-200px) scale(1.25) translate(${x * -20}px, ${y * -20}px)`
  }
  return <section className="hero3d" onMouseMove={move}>
    <div ref={bgRef} className="hero3d-bg" style={{ backgroundImage: `url(${interior})` }} />
    {embers.map((e, i) => <span key={i} className="ember" style={{ left: `${e.left}%`, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s` }} />)}
    <div className="site-width hero3d-inner">
      <div>
        <div className="eyebrow">Since {restaurant.since} · Bhittai Road, F-7 Markaz</div>
        <h1>Grilled with fire.<br /><em>Served with soul.</em></h1>
        <p>Islamabad’s favourite spot for chicken parmesan, tarragon steak and big, juicy burgers.</p>
        <div className="hero-ctas"><Button size="lg" onClick={onMenu}>Order now <ArrowRight /></Button><Button size="lg" variant="outline" asChild><a href={restaurant.phoneHref}><Phone />Reserve a table</a></Button></div>
        <div className="hero-meta"><div><strong>{restaurant.rating}★</strong>{restaurant.reviewCount} reviews</div><div><strong>12–12</strong>Open every day</div><div><strong>F-7</strong>Markaz, Islamabad</div></div>
      </div>
      <div className="stage" ref={stageRef} aria-hidden="true">
        <div className="ring" /><div className="ring r2" />
        <div className="plate"><img src={steak} alt="" width={1024} height={768} /></div>
        <div className="plate small p2"><img src={pasta} alt="" width={1024} height={768} /></div>
        <div className="plate small p3"><img src={burger} alt="" width={1024} height={768} /></div>
      </div>
    </div>
  </section>
}

function Carousel({ onAdd }: { onAdd: (id: string) => void }) {
  const items = menuItems.filter(i => i.image)
  const [index, setIndex] = useState(0)
  const step = 32
  const radius = 560
  return <section className="section"><div className="site-width" style={{ textAlign: 'center' }}>
    <div className="section-kicker">Signature plates</div><h2 className="section-title">The dishes Islamabad keeps coming back for</h2>
    <div className="carousel3d"><div className="carousel3d-track" style={{ transform: `translateZ(-${radius}px) rotateY(${-index * step}deg)` }}>
      {items.map((item, i) => <article key={item.id} className="c3d-card" style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)`, filter: index === i ? 'none' : 'brightness(.55)' }}>
        <img src={item.image} alt={item.name} width={1024} height={768} loading="lazy" />
        <div className="c3d-body" style={{ textAlign: 'left' }}><h3>{item.name}</h3><p>{item.description}</p><div className="c3d-foot">{money(item.price)}<Button size="sm" onClick={() => onAdd(item.id)}><Plus />Add</Button></div></div>
      </article>)}
    </div></div>
    <div className="carousel-controls"><Button variant="outline" size="icon" aria-label="Previous dish" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))}><ChevronLeft /></Button><Button variant="outline" size="icon" aria-label="Next dish" disabled={index === items.length - 1} onClick={() => setIndex(i => Math.min(items.length - 1, i + 1))}><ChevronRight /></Button></div>
  </div></section>
}

function Reviews() {
  const tilt = useTilt(12)
  return <section className="section" style={{ background: 'var(--secondary)' }}><div className="site-width">
    <div className="section-kicker">What diners say</div><h2 className="section-title">“The best pastas in town.”</h2>
    <div className="rating-badge"><strong>{restaurant.rating}★</strong>from {restaurant.reviewCount} reviews across Google, foodpanda & more</div>
    <div className="reviews-grid">{reviews.map(r => <figure key={r.name} className="review-card tilt" {...tilt}>
      <div className="stars" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: r.rating }, (_, i) => <Star key={i} />)}</div>
      <blockquote>“{r.text}”</blockquote><footer><span>{r.name}</span><span>via {r.source}</span></footer>
    </figure>)}</div>
  </div></section>
}

function Visit() {
  return <section className="section" id="visit"><div className="site-width">
    <div className="section-kicker">Visit us</div><h2 className="section-title">Find SAGE in F-7 Markaz</h2>
    <div className="visit-grid">
      <div className="visit-card">
        <div className="visit-row"><MapPin /><div>{restaurant.address}<br /><a href={restaurant.mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a></div></div>
        <div className="visit-row"><Clock /><div>{restaurant.hours}</div></div>
        <div className="visit-row"><Phone /><a href={restaurant.phoneHref}>{restaurant.phone}</a></div>
        <div className="visit-row"><Sparkles /><div>Dine-in, takeaway & delivery. Second branch in I-8 Markaz.</div></div>
      </div>
      <div className="map-frame"><iframe title="SAGE Cafe & Grill on the map" loading="lazy" src="https://www.google.com/maps?q=33.7192588,73.055222&z=17&output=embed" /></div>
    </div>
  </div></section>
}

function Index() {
  const [category, setCategory] = useState('Popular')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [mode, setMode] = useState('Delivery')
  const [location, setLocation] = useState('Select your location')
  const [draftLocation, setDraftLocation] = useState('')
  const [locationOpen, setLocationOpen] = useState(false)
  const [basketOpen, setBasketOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState<{ orderRef: string; receipt: string } | null>(null)
  const [orderError, setOrderError] = useState('')
  const sendOrder = useServerFn(placeOrder)
  const menuRef = useRef<HTMLElement>(null)
  const tilt = useTilt(8)
  const total = cartTotal(cart)
  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const update = (id: string, delta: number) => setCart(previous => changeQuantity(previous, id, delta))
  const locationMissing = location === 'Select your location'
  const closeCheckout = () => {
    setCheckoutOpen(false)
    if (placed) { setCart({}); setPlaced(null); setCustomerName(''); setCustomerPhone(''); setNote(''); setOrderError('') }
  }
  const submitOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (placing || locationMissing) return
    const digits = customerPhone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) { setOrderError('Enter a valid phone number, e.g. 0300 1234567.'); return }
    setPlacing(true); setOrderError('')
    try {
      const result = await sendOrder({ data: { cart, mode: mode as 'Delivery' | 'Pick-Up', locationName: location, customerName, customerPhone, note } })
      if (result.ok) setPlaced({ orderRef: result.orderRef, receipt: result.receipt })
      else setOrderError(result.error)
    } catch (error) {
      console.error(error)
      setOrderError('Something went wrong while sending your order. Please call the restaurant to place it.')
    } finally { setPlacing(false) }
  }
  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: 'smooth' })
  const filtered = menuItems.filter(item => (category === 'Popular' ? Boolean(item.badge) : item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()))
  const modeButtons = <div className="order-modes">{['Delivery', 'Pick-Up'].map(type => <Button key={type} type="button" variant={mode === type ? 'default' : 'ghost'} onClick={() => setMode(type)}>{type === 'Delivery' ? <Truck /> : <ShoppingBag />}{type}</Button>)}</div>
  const basket = <div className="basket"><div className="basket-title"><ShoppingBag /><h2>Your order</h2><span>{count} {count === 1 ? 'item' : 'items'}</span></div>
    {count === 0 ? <div className="basket-empty"><ShoppingBag /><h3>Hungry?</h3><p>Add a steak, a pasta or a burger<br />to get started.</p></div> : <div className="cart-list">{menuItems.filter(item => cart[item.id]).map(item => <div className="cart-item" key={item.id}><div><h3>{item.name}</h3><p>{money(item.price * (cart[item.id] ?? 0))}</p></div><div className="quantity"><Button variant="outline" size="icon" aria-label={`Remove one ${item.name}`} onClick={() => update(item.id, -1)}><Minus /></Button><span>{cart[item.id]}</span><Button variant="outline" size="icon" aria-label={`Add one ${item.name}`} onClick={() => update(item.id, 1)}><Plus /></Button></div></div>)}</div>}
    <div className="basket-footer"><div><span>Subtotal</span><strong>{money(total)}</strong></div><Button disabled={!count} onClick={() => { setBasketOpen(false); setCheckoutOpen(true) }}>Review order <ArrowRight /></Button></div></div>
  const foodCard = (item: MenuItem) => <article className="food-card tilt" key={item.id} {...tilt}><div className="food-image"><img src={item.image} alt={item.name} width={1024} height={768} loading="lazy" />{item.badge && <span className="food-badge"><Flame />{item.badge}</span>}</div><div className="food-content"><h3>{item.name}</h3><p className="food-description">{item.description}</p><div className="food-bottom"><div className="food-price"><small>{item.portion}</small>{money(item.price)}</div><Button variant="outline" size="icon" aria-label={`Add ${item.name}`} onClick={() => update(item.id, 1)}><Plus /></Button></div></div></article>
  const line = (item: MenuItem) => <div className="menu-line" key={item.id}><div><h3>{item.name}</h3><p>{item.description}</p></div><div>{money(item.price)}<Button variant="outline" size="icon" aria-label={`Add ${item.name}`} onClick={() => update(item.id, 1)}><Plus /></Button></div></div>

  return <>
    <header className="header"><div className="site-width header-inner"><Brand /><div className="header-actions"><Button variant="ghost" className="location-button" onClick={() => setLocationOpen(true)}><MapPin size={20} /><div><small>{mode === 'Delivery' ? 'DELIVERING TO' : 'PICK UP FROM'}</small><strong>{location}</strong></div><ChevronDown size={14} /></Button><a href={restaurant.phoneHref} className="phone-link"><Phone />{restaurant.phone}</a><Button variant="outline" onClick={() => setBasketOpen(true)}><ShoppingBag />Basket {count > 0 && `(${count})`}</Button></div></div></header>
    <Hero onMenu={scrollToMenu} />
    <Carousel onAdd={id => update(id, 1)} />
    <main className="site-width menu-area" ref={menuRef}><div className="menu-toolbar"><div><h2 className="section-heading">The full menu</h2><p className="section-subtitle">Steaks, pastas, burgers & more — made fresh in F-7.</p><p className="price-note">Prices shown are indicative; the restaurant confirms your total on call.</p></div><label className="search-box"><Search /><input aria-label="Search menu" placeholder="Search steaks, pasta, burgers..." value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <nav className="categories" aria-label="Menu categories">{categories.map(name => <Button key={name} variant={category === name ? 'default' : 'outline'} onClick={() => setCategory(name)}>{name === 'Popular' && <Flame />}{name}</Button>)}</nav>
      <div className="menu-layout"><div><div className="menu-heading"><Flame /><h2>{category === 'Popular' ? 'House favourites' : category}</h2><span>{filtered.length} dishes</span></div>{filtered.length ? <><div className="food-grid">{filtered.filter(item => item.image).map(foodCard)}</div>{filtered.filter(item => !item.image).map(line)}</> : <div className="no-results">No dishes found. Try another search.</div>}
        {category === 'Popular' && !search && <section className="lower-menu"><div className="menu-heading"><Sparkles /><h2>Sides & sips</h2></div>{menuItems.filter(item => ['Starters', 'Drinks & Desserts'].includes(item.category) && !item.image).map(line)}</section>}</div>{basket}</div>
    </main>
    <Reviews />
    <Visit />
    <footer className="footer"><div className="site-width"><div className="footer-top"><Brand /><div className="footer-contact"><strong>Grilled with fire. Served with soul.</strong>{restaurant.address}<br /><a href={restaurant.phoneHref}>{restaurant.phone}</a> · {restaurant.hours}</div></div><div className="footer-bottom"><span>© 2026 SAGE Cafe & Grill. All rights reserved.</span><span>F-7 Markaz · I-8 Markaz</span></div></div></footer>
    {count > 0 && <Button className="mobile-basket" onClick={() => setBasketOpen(true)}><span><ShoppingBag className="inline mr-2" />View basket · {count} items</span><strong>{money(total)}</strong></Button>}
    <Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogTitle>{mode === 'Delivery' ? 'Where shall we deliver?' : 'Pick up from SAGE F-7'}</DialogTitle><DialogDescription>Delivery and pick-up from our F-7 Markaz kitchen.</DialogDescription><form className="modal-form" onSubmit={event => { event.preventDefault(); setLocation(mode === 'Pick-Up' ? PICKUP : `${draftLocation}, Islamabad`); setLocationOpen(false) }}>{modeButtons}{mode === 'Delivery' ? <label>Area or delivery address<input required minLength={3} placeholder="e.g. House 12, Street 5, F-6/3" value={draftLocation} onChange={event => setDraftLocation(event.target.value)} /></label> : <p className="checkout-note">{restaurant.address}</p>}<Button type="submit">Confirm location <ArrowRight /></Button></form></DialogContent></Dialog>
    <Dialog open={basketOpen} onOpenChange={setBasketOpen}><DialogContent><DialogTitle>Your SAGE basket</DialogTitle><DialogDescription>Your picks, all in one place.</DialogDescription>{basket}</DialogContent></Dialog>
    <Dialog open={checkoutOpen} onOpenChange={open => open ? setCheckoutOpen(true) : closeCheckout()}><DialogContent><DialogTitle>{placed ? 'Your order is with the restaurant' : 'Almost there'}</DialogTitle><DialogDescription>{count} {count === 1 ? 'item' : 'items'} · {money(total)}</DialogDescription>
      {placed ? <div className="modal-form"><div className="order-sent"><CheckCircle2 /><div><strong>Order {placed.orderRef} has been sent</strong><span>The kitchen received your receipt on WhatsApp and will ring {customerPhone} to confirm the total and the time.</span></div></div><pre className="receipt">{placed.receipt}</pre><Button variant="outline" onClick={closeCheckout}>Back to menu</Button></div> : (
      <form className="modal-form" onSubmit={submitOrder}><p className="checkout-note">{mode === 'Delivery' ? `Delivering to ${location}` : location}</p><label>Your name<input required minLength={2} maxLength={80} placeholder="e.g. Ali Khan" value={customerName} onChange={event => setCustomerName(event.target.value)} /></label><label>Phone number<input required type="tel" placeholder="0300 1234567" value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} /></label><label>Anything we should know?<textarea rows={2} maxLength={300} placeholder="Steak medium-well, extra sauce…" value={note} onChange={event => setNote(event.target.value)} /></label>{locationMissing && <p className="checkout-error">Tell us where to deliver first — tap the location at the top of the page.</p>}{orderError && <p className="checkout-error">{orderError}</p>}<Button type="submit" disabled={placing || locationMissing}>{placing ? <Loader2 className="animate-spin" /> : <Phone />}{placing ? 'Sending…' : 'Send order on WhatsApp'}</Button><Button type="button" variant="outline" onClick={closeCheckout}>Back to menu</Button></form>)}
    </DialogContent></Dialog>
  </>
}
