import steak from '@/assets/steak.jpg'
import pasta from '@/assets/pasta.jpg'
import burger from '@/assets/burger.jpg'
import shrimp from '@/assets/shrimp.jpg'

export type MenuItem = { id: string; name: string; description: string; price: number; category: string; image?: string; badge?: string; portion?: string }

/** SAGE Cafe & Grill, F-7 Markaz — publicly listed details. */
export const restaurant = {
  name: 'SAGE Cafe & Grill',
  branch: 'F-7 Markaz, Islamabad',
  address: '1st Floor, 6-B Bhittai Road, F-7 Markaz, Islamabad',
  phone: '+92 51 2656544',
  phoneHref: 'tel:+92512656544',
  hours: 'Every day · 12:00 PM – 12:00 AM',
  since: 2010,
  rating: 4.4,
  reviewCount: '1,200+',
  mapsUrl: 'https://www.google.com/maps/place/SAGE+CAFE+%26+GRILL+F-7/@33.7192588,73.055222,17z',
}

export type Review = { name: string; text: string; source: string; rating: number }
export const reviews: Review[] = [
  { name: 'Nusrat Parveen', rating: 5, source: 'ChaloReview', text: 'My go-to place for pastas, burgers and general dine out really. The quality of food, vibes and hospitality is still unmatched.' },
  { name: 'Meha Abbas Gul', rating: 5, source: 'ChaloReview', text: 'Quantity 10/10, taste 10/10, ambiance 10/10. Best place for pastas!' },
  { name: 'Adeela', rating: 5, source: 'foodpanda', text: 'The best pasta in the town.' },
  { name: 'Misbah', rating: 5, source: 'foodpanda', text: 'The best pastas in town! Keep maintaining this high standard!' },
  { name: 'Bilal', rating: 4, source: 'foodpanda', text: 'Everything good as always.' },
]

export const categories = ['Popular', 'Steaks', 'Pasta', 'Burgers', 'Starters', 'Drinks & Desserts']

// Dish names come from SAGE's known specialities; prices are placeholders until the restaurant confirms them.
export const menuItems: MenuItem[] = [
  { id: 'tarragon-steak', name: 'Beef Tarragon Steak', description: 'Grilled tenderloin under a creamy tarragon sauce, with baked potato.', price: 2450, category: 'Steaks', image: steak, badge: 'Signature', portion: 'Single' },
  { id: 'chicken-parm', name: 'Chicken Parmesan Pasta', description: 'Crumbed chicken, marinara & melted mozzarella over creamy fettuccine.', price: 1890, category: 'Pasta', image: pasta, badge: 'Most loved', portion: 'Single' },
  { id: 'sage-burger', name: 'Sage Signature Burger', description: 'Double beef patty, melted cheddar and house sauce on brioche, with fries.', price: 1650, category: 'Burgers', image: burger, badge: 'Bestseller', portion: 'With fries' },
  { id: 'dynamite-shrimp', name: 'Dynamite Shrimp', description: 'Crispy shrimp tossed in spicy sriracha mayo, sesame and spring onion.', price: 1450, category: 'Starters', image: shrimp, badge: 'Crowd favourite', portion: 'Sharing' },
  { id: 'mexican-steak', name: 'Mexican Steak', description: 'Char-grilled steak with a smoky salsa and sautéed vegetables.', price: 2350, category: 'Steaks' },
  { id: 'shrimp-fettuccine', name: 'Shrimp Fettuccine', description: 'Shrimp in a rich, garlicky alfredo sauce.', price: 2150, category: 'Pasta' },
  { id: 'mac-cheese', name: "Mac 'n' Cheese", description: 'Baked, bubbling and extra cheesy.', price: 1350, category: 'Pasta' },
  { id: 'mozzarella-sticks', name: 'Mozzarella Sticks', description: 'Golden, stretchy, served with marinara.', price: 950, category: 'Starters' },
  { id: 'onion-rings', name: 'Onion Rings', description: 'Crisp beer-battered rings with dip.', price: 650, category: 'Starters' },
  { id: 'mint-margarita', name: 'Mint Margarita', description: 'Fresh mint, lime and crushed ice.', price: 550, category: 'Drinks & Desserts' },
  { id: 'peach-iced-tea', name: 'Peach Iced Tea', description: 'Brewed in-house, lightly sweet.', price: 550, category: 'Drinks & Desserts' },
]

export function cartTotal(cart: Record<string, number>) { return menuItems.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0) }
export function changeQuantity(cart: Record<string, number>, id: string, delta: number) {
  if (!menuItems.some(item => item.id === id)) return cart
  const next = { ...cart, [id]: Math.max(0, (cart[id] ?? 0) + delta) }
  if (next[id] === 0) delete next[id]
  return next
}
export const money = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`
