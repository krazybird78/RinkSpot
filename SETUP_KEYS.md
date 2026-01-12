# 🔧 RinkSpot API Key Setup

The map requires an API token.

## Instructions
1.  **Create a file** named `.env.local` in the `rinkspot` folder.
2.  **Paste** the content below into it.
3.  **Fill in** your Mapbox token (and Supabase keys if you have them).
4.  **Restart** the server (`Ctrl+C` then `npm run dev`).

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoia3JhenliaXJkIiwiYSI6ImNtazBlYnE1NTA5ankzZHB2bG9mYXdrdmcifQ.HN-Brm6K59sr_4H82Ahwew
NEXT_PUBLIC_SUPABASE_URL=https://cseegadvrvtdjbnyjuss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZWVnYWR2cnZ0ZGpibnlqdXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTY0NDksImV4cCI6MjA4MzEzMjQ0OX0.XSbhs27UxiMaDwTuvII8GslkB6kjauClQKTWXVP0e4I
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```
