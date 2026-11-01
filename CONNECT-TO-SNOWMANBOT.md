# Connect the website to SnowmanBot

The website is the **shop window**; your existing **SnowmanBot** Telegram bot is the
engine. The site reads your live published products from the bot and every
**Order** button opens the bot, where checkout + payment already happen (crypto /
bank / Stars). Nothing about how you run SnowmanBot changes — you still add
products and take payments exactly as you do today.

```
  Website (Netlify)  ──GET /api/products──►  SnowmanBot (Render)
   shows products                             Postgres: products, orders
        │                                      crypto / bank / Stars checkout
        └── "Order on Telegram" ──► t.me/yourbot?start=product_<id>
```

You set two things and deploy twice (once each side). ~10 minutes.

---

## Part 1 — SnowmanBot (add the product feed)

I added a small, **read-only** web API to your bot. Two additions in `bot.py`:

- `GET /api/products` — your published physical products as JSON (id, name, price, description).
- `GET /api/products/{id}/image` — each product's photo, straight from your database.
- Plus deep-link support so `t.me/yourbot?start=product_<id>` opens that exact product.

It reuses the web server your bot already runs for `/health`, reads your existing
Postgres, and changes nothing about products, orders, payments or the Telegram flow.

**Deploy it (your normal flow):**
1. In the `snowmanbot` folder, the updated file is **`bot.py`** (changes are also saved as `../snowmanbot-web-api.patch` for review).
2. Upload/replace `bot.py` in your GitHub repo (same as any SnowmanBot update), commit, and deploy the latest commit on Render.
3. Find your bot's **public URL** (Render dashboard → your service → the `onrender.com` URL).
4. Confirm it works — open in a browser:
   `https://YOUR-BOT.onrender.com/api/products` → you should see JSON of your published products.

> Only **published, physical** products appear (digital/Stars products stay Telegram-only). Publish a product in the admin bot and it shows up on the site automatically.

---

## Part 2 — Website (point it at your bot)

Open `helix-peptides/app.js` and set the two values at the top:

```js
const API_BASE     = "https://YOUR-BOT.onrender.com";  // your Render URL, no trailing slash
const TELEGRAM_BOT = "YourMainBotUsername";            // the customer bot's @username, no @
```

Then redeploy the site to Netlify (drag the folder to <https://app.netlify.com/drop>, or push to Git).

That's it. The catalog now shows your live products and prices with their photos,
and every **Order on Telegram** / **Shop on Telegram** button opens your bot.

---

## What the customer sees

1. Browses the website, sees your real products + prices.
2. Taps **Order on Telegram** on a product → your bot opens on that product.
3. Pays in Telegram (crypto / bank / Stars) exactly as today.
4. You manage products and orders in the SnowmanBot admin bot as usual.

---

## Notes

- **The `helix-admin-bot` folder (Firestore) is no longer needed.** SnowmanBot is now the single source of truth for products, orders and payments. You can ignore or delete that folder.
- **Before `API_BASE` is set**, the site shows a built-in demo catalog so it still previews. Once set, it shows your bot's real products (empty state if none are published yet).
- **Template copy:** the site keeps peptide-themed wording (the "researcher" age gate, "COA" mentions, the Research Hub, "for laboratory research use only"). If SnowmanBot sells other goods, tell me and I'll swap that copy to match — it's cosmetic and quick to change.
- **Security:** the API is read-only and exposes only already-public product info (name, price, description, photo). Orders, customers, payments and admin stay private inside the bot.
