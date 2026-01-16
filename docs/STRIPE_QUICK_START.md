# 🚀 Quick Start - Stripe Payment Testing

## 5-Minute Setup

### 1️⃣ Get Stripe Test Keys (1 min)

1. Go to: https://dashboard.stripe.com/register
2. Sign up for a free account
3. Click **Developers** → **API keys** in dashboard
4. Toggle to **Test mode** (top right)
5. Copy these keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2️⃣ Configure Backend (1 min)

Edit `server/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET  # (optional for local testing)
```

### 3️⃣ Configure Frontend (1 min)

Edit `client/.env`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### 4️⃣ Start Servers (1 min)

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5️⃣ Test Payment (1 min)

1. Open: http://localhost:5173
2. Scan QR / Add items to cart
3. Submit order → Request bill
4. Select **"Credit/Debit Card"**
5. Enter test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/34`
   - **CVC**: `123`
   - **Name**: `Test Customer`
6. Click **"Pay"**
7. ✅ Success!

---

## 🧪 Test Cards Cheat Sheet

| Card                  | Result               | Use Case       |
| --------------------- | -------------------- | -------------- |
| `4242 4242 4242 4242` | ✅ Success            | Happy path     |
| `4000 0000 0000 0002` | ❌ Declined           | Error handling |
| `4000 0000 0000 9995` | ❌ Insufficient funds | Specific error |
| `4000 0027 6000 3184` | 🔐 3D Secure          | Auth flow      |

**All test cards**: Any future expiry (e.g., `12/34`) + any CVC (e.g., `123`)

---

## 🔧 Webhook Setup (Optional for Local Testing)

### Option A: Use Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5000/api/payments/webhook

# Copy the signing secret shown (starts with whsec_)
# Add to server/.env as STRIPE_WEBHOOK_SECRET
```

### Option B: Skip Webhooks

- Webhooks are optional for basic testing
- Payment confirmation works without webhooks
- Webhooks provide real-time status updates

---

## ✅ Verification

### Backend Running:
```bash
curl http://localhost:5000/health
# Should return: {"success": true, "message": "..."}
```

### Frontend Running:
- Open: http://localhost:5173
- No console errors

### Payment Working:
- Create order → Request bill → Pay with test card
- Should see "Payment successful!" message
- Order status changes to "paid"

---

## 🐛 Quick Troubleshooting

| Problem                    | Solution                                            |
| -------------------------- | --------------------------------------------------- |
| "Webhook signature failed" | Restart server after adding `STRIPE_WEBHOOK_SECRET` |
| "No such payment_intent"   | Make sure using **test** keys (sk_**test**_xxx)     |
| CORS error                 | Check `CLIENT_URL` in `server/.env`                 |
| Payment not updating order | Enable webhooks or check backend logs               |

---

## 📚 Full Documentation

See [STRIPE_INTEGRATION_TESTING.md](./STRIPE_INTEGRATION_TESTING.md) for:
- Complete setup guide
- Architecture diagrams
- All test scenarios
- Production deployment steps

---

**Ready to test?** → Follow the 5-minute setup above! 🚀
