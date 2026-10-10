import karahi from '@/assets/karahi.jpg'
import biryani from '@/assets/biryani.jpg'
import bbq from '@/assets/bbq.jpg'
export type MenuItem = { id: string; name: string; description: string; price: number; category: string; image?: string; badge?: string; portion?: string }
export const categories = ['Popular', 'Karahi', 'BBQ', 'Rice & Biryani', 'Breads & Sides', 'Deals']
export const menuItems: MenuItem[] = [
  { id:'karahi', name:'Chicken Karahi', description:'Our signature tomato-based karahi, finished with fresh ginger & herbs.', price:1450, category:'Karahi', image:karahi, badge:'Bestseller', portion:'Half kg' },
  { id:'biryani', name:'Chicken Biryani', description:'Aromatic basmati rice layered with tender chicken & traditional spices.', price:450, category:'Rice & Biryani', image:biryani, badge:'A crowd favourite', portion:'Single serving' },
  { id:'bbq', name:'Anarkali BBQ Platter', description:'A smoky selection of chicken tikka & seekh kebabs, grilled to perfection.', price:1650, category:'BBQ', image:bbq, badge:'Chef’s special', portion:'Serves 2' },
  { id:'naan', name:'Butter Naan', description:'Fresh from the tandoor, brushed with butter.', price:100, category:'Breads & Sides' },
  { id:'raita', name:'Mint Raita', description:'Cooling yogurt with mint and a touch of roasted cumin.', price:150, category:'Breads & Sides' },
  { id:'deal', name:'The Family Feast', description:'Chicken karahi, BBQ platter, 4 butter naans & mint raita.', price:3450, category:'Deals', image:karahi, portion:'Serves 4' },
]
export function cartTotal(cart: Record<string,number>) { return menuItems.reduce((sum,item) => sum + item.price * (cart[item.id] ?? 0), 0) }
export function changeQuantity(cart: Record<string,number>, id: string, delta: number) {
  if (!menuItems.some(item => item.id === id)) return cart
  const next = { ...cart, [id]: Math.max(0, (cart[id] ?? 0) + delta) }
  if (next[id] === 0) delete next[id]
  return next
}
export const money = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`
