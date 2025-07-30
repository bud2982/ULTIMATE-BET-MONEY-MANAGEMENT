import { loadStripe } from '@stripe/stripe-js';

// Carica Stripe con la publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default stripePromise;

// Configurazione per i piani
export const STRIPE_PLANS = {
  monthly: {
    priceId: 'price_monthly',
    amount: 1200, // €12.00 in centesimi
    name: 'Piano Mensile',
    period: 'month'
  },
  semester: {
    priceId: 'price_semester', 
    amount: 6000, // €60.00 in centesimi
    name: 'Piano Semestrale',
    period: '6months'
  },
  annual: {
    priceId: 'price_annual',
    amount: 11000, // €110.00 in centesimi
    name: 'Piano Annuale', 
    period: 'year'
  }
} as const;

export type StripePlanId = keyof typeof STRIPE_PLANS;