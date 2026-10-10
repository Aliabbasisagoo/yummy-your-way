import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, ChefHat, ChevronDown, Flame, Loader2, MapPin, Minus, Phone, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { categories, menuItems, money, cartTotal, changeQuantity, type MenuItem } from '@/lib/menu'
import { placeOrder } from '@/lib/orders.functions'
import feast from '@/assets/feast.jpg'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Anarkali Restaurant — Menu & Online Ordering' },
    { name: 'description', content: 'Explore Anarkali’s traditional karahi, smoky BBQ and fragrant biryani. Discover authentic Pakistani flavours in Rawalpindi.' },
    { property: 'og:title', content: 'Anarkali Restaurant — Authentic Flavors' },
    { property: 'og:description', content: 'Your favourite Pakistani dishes, freshly prepared. Browse the Anarkali menu and build your perfect feast.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
})

function Brand() {
  return <div className="brand"><div className="brand-seal"><ChefHat /></div><div><div className="brand-name">Anarkali</div><div className="brand-subtitle">Restaurant · Authentic flavors</div></div></div>
}

function Index() {
  const [category, setCategory] = useState('Popular')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [mode, setMode] = useState('Delivery')
  const [location, setLocation] = useState('Select your location')
  const [draftLocation, setDraftLocation] = useState('')
  const [city, setCity] = useState('Rawalpindi')
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
  const total = cartTotal(cart)
  const count = Object.values(cart).reduce((a,b) => a+b,0)
  const update = (id: string, delta: number) => setCart(previous => changeQuantity(previous,id,delta))
  const locationMissing = location === 'Select your location'
  const closeCheckout = () => {
    setCheckoutOpen(false)
    if (placed) { setCart({}); setPlaced(null); setCustomerName(''); setCustomerPhone(''); setNote(''); setOrderError('') }
  }
  const submitOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (placing || locationMissing) return
    setPlacing(true)
    setOrderError('')
    try {
      const result = await sendOrder({ data: { cart, mode: mode as 'Delivery' | 'Pick-Up', locationName: location, customerName, customerPhone, note } })
      if (result.ok) setPlaced({ orderRef: result.orderRef, receipt: result.receipt })
      else setOrderError(result.error)
    } catch (error) {
      console.error(error)
      setOrderError('Something went wrong while sending your order. Please call the restaurant to place it.')
    } finally {
      setPlacing(false)
    }
  }
  const filtered = menuItems.filter(item => (category === 'Popular' ? Boolean(item.badge) : item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()))
  const modeButtons = <div className="order-modes">{['Delivery','Pick-Up'].map(type => <Button key={type} variant={mode === type ? 'default' : 'ghost'} onClick={() => setMode(type)}>{type === 'Delivery' ? <Truck /> : <ShoppingBag />}{type}</Button>)}</div>
  const basket = <div className="basket"><div className="basket-title"><ShoppingBag /><h2>Your order</h2><span>{count} {count === 1 ? 'item' : 'items'}</span></div>
    {count === 0 ? <div className="basket-empty"><ShoppingBag /><h3>A little hungry?</h3><p>Your basket is waiting for<br />something delicious.</p></div> : <div className="cart-list">{menuItems.filter(item => cart[item.id]).map(item => <div className="cart-item" key={item.id}><div><h3>{item.name}</h3><p>{money(item.price * (cart[item.id] ?? 0))}</p></div><div className="quantity"><Button variant="outline" size="icon" aria-label={`Remove one ${item.name}`} onClick={() => update(item.id,-1)}><Minus /></Button><span>{cart[item.id]}</span><Button variant="outline" size="icon" aria-label={`Add one ${item.name}`} onClick={() => update(item.id,1)}><Plus /></Button></div></div>)}</div>}
    <div className="basket-footer"><div><span>Subtotal</span><strong>{money(total)}</strong></div><Button disabled={!count} onClick={() => {setBasketOpen(false);setCheckoutOpen(true)}}>Review order <ArrowRight /></Button></div></div>
  const foodCard = (item: MenuItem) => <article className="food-card" key={item.id}><div className="food-image"><img src={item.image} alt={item.name} width={944} height={704} loading="lazy" />{item.badge && <span className="food-badge"><Flame />{item.badge}</span>}</div><div className="food-content"><h3>{item.name}</h3><p className="food-description">{item.description}</p><div className="food-bottom"><div className="food-price"><small>{item.portion}</small>{money(item.price)}</div><Button variant="outline" size="icon" aria-label={`Add ${item.name}`} onClick={() => update(item.id,1)}><Plus /></Button></div></div></article>

  return <>
    <div className="announcement"><Utensils size={12} /><span>A taste of tradition. A feast to remember.</span></div>
    <header className="header"><div className="site-width header-inner"><Brand /><div className="header-actions"><Button variant="ghost" className="location-button" onClick={() => setLocationOpen(true)}><MapPin size={20} /><div><small>{mode === 'Delivery' ? 'DELIVERING TO' : 'PICK UP FROM'}</small><strong>{location}</strong></div><ChevronDown size={14} /></Button><a href="tel:03314944424" className="phone-link"><Phone />0331 4944424</a><Button variant="outline" onClick={() => setBasketOpen(true)}><ShoppingBag />Basket {count > 0 && `(${count})`}</Button></div></div></header>
    <section className="hero"><img src={feast} alt="A freshly prepared Pakistani feast with chicken karahi, naan and grilled kebabs" width={1600} height={800} fetchPriority="high" /><div className="site-width hero-inner"><div className="eyebrow">Rooted in tradition</div><h1>Anarkali Restaurant<br /><em>Authentic flavors.</em></h1><p>From our kitchen to your table.<br />The desi favourites you love, made with heart.</p><Button size="lg" onClick={() => menuRef.current?.scrollIntoView({behavior:'smooth'})}>Explore the menu <ArrowRight /></Button></div></section>
    <div className="service-strip"><div className="site-width service-inner"><div className="service-item"><MapPin /><strong>Rawalpindi & Islamabad</strong></div><div className="service-item"><ChefHat /><strong>Freshly prepared</strong><span>Every single time</span></div><div className="service-item"><ShieldCheck /><strong>Desi favourites</strong><span>Always authentic</span></div>{modeButtons}</div></div>
    <main className="site-width menu-area" ref={menuRef}><div className="menu-toolbar"><div><h2 className="section-heading">Something for every craving.</h2><p className="section-subtitle">Good food. Generous portions. The Anarkali way.</p></div><label className="search-box"><Search /><input aria-label="Search menu" placeholder="Search your favourite dish..." value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <nav className="categories" aria-label="Menu categories">{categories.map(name => <Button key={name} variant={category === name ? 'default' : 'outline'} onClick={() => setCategory(name)}>{name === 'Popular' && <Flame />}{name}</Button>)}</nav>
      <div className="menu-layout"><div><div className="menu-heading"><Flame /><h2>{category === 'Popular' ? 'The crowd favourites' : category}</h2><span>{category === 'Popular' ? 'Tried, loved & ordered again' : `${filtered.length} dishes`}</span></div>{filtered.length ? <><div className="food-grid">{filtered.filter(item => item.image).map(foodCard)}</div>{filtered.filter(item => !item.image).map(item => <div className="menu-line" key={item.id}><div><h3>{item.name}</h3><p>{item.description}</p></div><div>{money(item.price)}<Button variant="outline" size="icon" aria-label={`Add ${item.name}`} onClick={() => update(item.id,1)}><Plus /></Button></div></div>)}</> : <div className="no-results">No dishes found. Try another search.</div>}
      {category === 'Popular' && !search && <section className="lower-menu"><div className="menu-heading"><Sparkles /><h2>Complete your feast</h2></div>{menuItems.filter(item => item.category === 'Breads & Sides').map(item => <div className="menu-line" key={item.id}><div><h3>{item.name}</h3><p>{item.description}</p></div><div>{money(item.price)}<Button variant="outline" size="icon" aria-label={`Add ${item.name}`} onClick={() => update(item.id,1)}><Plus /></Button></div></div>)}</section>}</div>{basket}</div>
    </main>
    <footer className="footer"><div className="site-width"><div className="footer-top"><Brand /><div className="footer-contact"><strong>A little tradition, in every bite.</strong>Anarkali Restaurant, Commercial Market, Satellite Town, Rawalpindi.<br /><a href="tel:03314944424">0331 4944424</a> · <a href="mailto:anarkalirestaurant708@gmail.com">Get in touch</a></div></div><div className="footer-bottom"><span>© 2026 Anarkali Restaurant. All rights reserved.</span><span>Made fresh. Served with love.</span></div></div></footer>
    {count > 0 && <Button className="mobile-basket" onClick={() => setBasketOpen(true)}><span><ShoppingBag className="inline mr-2" />View basket · {count} items</span><strong>{money(total)}</strong></Button>}
    <Dialog open={locationOpen} onOpenChange={setLocationOpen}><DialogContent><DialogTitle>{mode === 'Delivery' ? 'Where shall we deliver?' : 'Choose your pick-up location'}</DialogTitle><DialogDescription>A delicious Anarkali feast starts here.</DialogDescription><form className="modal-form" onSubmit={event => {event.preventDefault();setLocation(mode === 'Pick-Up' ? 'Commercial Market' : `${draftLocation}, ${city}`);setLocationOpen(false)}}>{modeButtons}<label>City<select value={city} onChange={event => setCity(event.target.value)}><option>Rawalpindi</option><option>Islamabad</option></select></label>{mode === 'Delivery' ? <label>Area or delivery address<input required placeholder="Enter your area or address" value={draftLocation} onChange={event => setDraftLocation(event.target.value)} /></label> : <p className="checkout-note">Commercial Market, Satellite Town, Rawalpindi</p>}<Button type="submit">Confirm location <ArrowRight /></Button></form></DialogContent></Dialog>
    <Dialog open={basketOpen} onOpenChange={setBasketOpen}><DialogContent><DialogTitle>Your Anarkali basket</DialogTitle><DialogDescription>Your favourites, all in one place.</DialogDescription>{basket}</DialogContent></Dialog>
    <Dialog open={checkoutOpen} onOpenChange={open => open ? setCheckoutOpen(true) : closeCheckout()}><DialogContent><DialogTitle>{placed ? 'Your order is with the restaurant' : 'Your feast is almost ready'}</DialogTitle><DialogDescription>{count} {count === 1 ? 'item' : 'items'} · {money(total)}</DialogDescription>
      {placed ? <div className="modal-form"><div className="order-sent"><CheckCircle2 /><div><strong>Order {placed.orderRef} has been sent</strong><span>The kitchen received your receipt on WhatsApp and will ring {customerPhone} to confirm the total and the time.</span></div></div><pre className="receipt">{placed.receipt}</pre><Button variant="outline" onClick={closeCheckout}>Back to menu</Button></div> : (
      <form className="modal-form" onSubmit={submitOrder}><p className="checkout-note">{mode === 'Delivery' ? `Delivering to ${location}` : `Pick up from ${location}`}</p><label>Your name<input required minLength={2} maxLength={80} placeholder="e.g. Ali Khan" value={customerName} onChange={event => setCustomerName(event.target.value)} /></label><label>Phone number<input required type="tel" pattern="[-+0-9\s]{7,20}" placeholder="0300 1234567" value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} /></label><label>Anything we should know?<textarea rows={2} maxLength={300} placeholder="Extra spicy, no onions, arrive by 9pm…" value={note} onChange={event => setNote(event.target.value)} /></label>{locationMissing && <p className="checkout-error">Tell us where to deliver first — tap the location at the top of the page.</p>}{orderError && <p className="checkout-error">{orderError}</p>}<Button type="submit" disabled={placing || locationMissing}>{placing ? <Loader2 className="animate-spin" /> : <Phone />}{placing ? 'Sending…' : 'Send order on WhatsApp'}</Button><Button type="button" variant="outline" onClick={closeCheckout}>Back to menu</Button></form>)}
    </DialogContent></Dialog>
  </>
}
