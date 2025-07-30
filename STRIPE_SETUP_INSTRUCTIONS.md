# 🔑 Istruzioni Configurazione Stripe - Ultimate Bet Money Management

## ✅ **Configurazione Completata**

Il sistema è stato configurato per supportare i pagamenti Stripe reali. Ecco cosa è stato fatto:

### 📁 **File Modificati/Creati**
- ✅ `.env` - Placeholder per chiavi Stripe
- ✅ `client/src/lib/stripe.ts` - Configurazione Stripe frontend
- ✅ `client/src/components/StripeCheckoutForm.tsx` - Form di pagamento
- ✅ `client/src/pages/subscribe.tsx` - Pagina abbonamento aggiornata
- ✅ `client/src/pages/subscription-success.tsx` - Pagina successo
- ✅ `server/routes.ts` - API Stripe backend
- ✅ `vite.config.ts` - Configurazione variabili d'ambiente

## 🔧 **Prossimi Passi per Attivare Stripe**

### **1. Sostituire le Chiavi nel file `.env`**

Apri il file `.env` e sostituisci i placeholder con le tue chiavi reali:

```bash
# Stripe Configuration (per pagamenti)
STRIPE_SECRET_KEY=sk_test_51ABC123... # La tua Secret Key
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123... # La tua Publishable Key  
STRIPE_WEBHOOK_SECRET=whsec_ABC123... # Il tuo Webhook Secret
```

### **2. Creare i Price IDs in Stripe Dashboard**

Vai su https://dashboard.stripe.com/products e crea 3 prodotti:

#### **Piano Mensile**
- Nome: "Piano Mensile Ultimate Bet"
- Prezzo: €12.00 ogni mese
- Price ID: `price_monthly`

#### **Piano Semestrale**  
- Nome: "Piano Semestrale Ultimate Bet"
- Prezzo: €60.00 ogni 6 mesi
- Price ID: `price_semester`

#### **Piano Annuale**
- Nome: "Piano Annuale Ultimate Bet"  
- Prezzo: €110.00 ogni 12 mesi
- Price ID: `price_annual`

### **3. Configurare Webhook**

1. Vai su https://dashboard.stripe.com/webhooks
2. Clicca "Add endpoint"
3. URL: `https://tuodominio.com/api/stripe-webhook`
4. Eventi da selezionare:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia il "Signing secret" nel file `.env`

### **4. Aggiornare Price IDs nel Codice**

Se i tuoi Price IDs sono diversi, aggiorna questi file:

**`server/routes.ts` (linea ~402):**
```javascript
const plans = {
  monthly: { priceId: 'price_1ABC123...', amount: 1200, name: 'Piano Mensile', period: 'month' },
  semester: { priceId: 'price_1DEF456...', amount: 6000, name: 'Piano Semestrale', period: '6months' },
  annual: { priceId: 'price_1GHI789...', amount: 11000, name: 'Piano Annuale', period: 'year' }
};
```

**`client/src/lib/stripe.ts` (linea ~6):**
```javascript
export const STRIPE_PLANS = {
  monthly: { priceId: 'price_1ABC123...', amount: 1200, name: 'Piano Mensile', period: 'month' },
  semester: { priceId: 'price_1DEF456...', amount: 6000, name: 'Piano Semestrale', period: '6months' },
  annual: { priceId: 'price_1GHI789...', amount: 11000, name: 'Piano Annuale', period: 'year' }
};
```

## 🧪 **Testing**

### **Modalità Test (Consigliata)**
1. Usa chiavi `sk_test_` e `pk_test_`
2. Usa carte di test Stripe:
   - Successo: `4242 4242 4242 4242`
   - Fallimento: `4000 0000 0000 0002`

### **Modalità Produzione**
1. Sostituisci con chiavi `sk_live_` e `pk_live_`
2. Testa con carte reali (piccoli importi)

## 🔄 **Flusso di Pagamento**

1. **Utente** → Seleziona piano su `/pricing`
2. **Redirect** → `/subscribe?plan=monthly`
3. **Backend** → Crea subscription Stripe
4. **Frontend** → Mostra Stripe Elements
5. **Pagamento** → Elaborato da Stripe
6. **Successo** → Redirect a `/subscription-success`
7. **Webhook** → Aggiorna database utente

## 🛡️ **Sicurezza**

- ✅ Chiavi segrete solo nel backend
- ✅ Webhook signature verification
- ✅ HTTPS obbligatorio in produzione
- ✅ Validazione lato server

## 📊 **Monitoraggio**

Dopo l'attivazione, monitora:
- Dashboard Stripe per transazioni
- Logs server per errori
- Webhook delivery status
- Database per sincronizzazione utenti

## 🆘 **Troubleshooting**

### **Errore: "Demo Mode Active"**
- Verifica che `STRIPE_SECRET_KEY` sia configurata
- Riavvia il server dopo aver modificato `.env`

### **Errore: "Invalid Price ID"**
- Verifica che i Price IDs esistano in Stripe
- Controlla che corrispondano nel codice

### **Webhook non funziona**
- Verifica URL webhook in Stripe Dashboard
- Controlla che `STRIPE_WEBHOOK_SECRET` sia corretto
- Testa con Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

## 🎯 **Stato Attuale**

- ✅ **Codice**: Pronto per produzione
- ⚠️ **Chiavi**: Da configurare
- ⚠️ **Price IDs**: Da creare in Stripe
- ⚠️ **Webhook**: Da configurare
- ✅ **UI/UX**: Completa e funzionale

Una volta completati questi passi, il sistema di pagamenti sarà completamente funzionale! 🚀