# CapyLearn Supabase Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (includes 500MB database, 2GB bandwidth)
3. Create a new project
   - Project name: `capylearn`
   - Database password: (save this securely)
   - Region: Choose closest to your users

### Step 2: Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (bottom right)
6. You should see: "Success. No rows returned"

### Step 3: Get API Keys
1. In Supabase dashboard, go to **Settings** > **API**
2. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

### Step 4: Configure Environment Variables
1. In your project root, create `.env.local` file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

### Step 5: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 6: Test It Out!
1. Go to [http://localhost:3000](http://localhost:3000)
2. Click any "Get Started" button
3. Fill out the modal form
4. Check Supabase dashboard > **Table Editor** > **contacts** table
5. You should see your entry! 🎉

---

## 📊 View Your Data

### Using Supabase Dashboard
1. Go to **Table Editor** in Supabase dashboard
2. View tables:
   - **contacts** - All user information
   - **button_clicks** - Track which buttons were clicked
   - **email_subscriptions** - Newsletter subscribers
   - **conversion_events** - User journey events

### Quick SQL Queries
Go to **SQL Editor** and try these:

**View all contacts:**
```sql
SELECT * FROM contacts ORDER BY created_at DESC;
```

**See which buttons get clicked most:**
```sql
SELECT button_type, COUNT(*) as clicks
FROM button_clicks
GROUP BY button_type
ORDER BY clicks DESC;
```

**Conversion rate:**
```sql
SELECT 
  (SELECT COUNT(*) FROM contacts WHERE source = 'modal') as modal_submissions,
  (SELECT COUNT(*) FROM button_clicks) as total_clicks,
  ROUND(
    (SELECT COUNT(*) FROM contacts WHERE source = 'modal')::numeric / 
    (SELECT COUNT(*) FROM button_clicks)::numeric * 100, 
    2
  ) as conversion_rate_percent;
```

**Recent activity:**
```sql
SELECT 
  c.name,
  c.email,
  bc.button_type,
  bc.clicked_at
FROM button_clicks bc
LEFT JOIN contacts c ON bc.contact_id = c.id
ORDER BY bc.clicked_at DESC
LIMIT 20;
```

---

## 🔐 Security Notes

### Row Level Security (RLS)
Your database is protected with RLS policies:
- ✅ **Anonymous users CAN**: Submit forms (insert data)
- ❌ **Anonymous users CANNOT**: View other users' data
- ✅ **Authenticated users CAN**: View all data (for admin dashboard)

### API Keys
- **anon key**: Safe to expose in frontend (limited permissions)
- **service_role key**: ⚠️ NEVER expose this! Only use server-side

---

## 📈 What's Being Tracked

### Contact Form (Modal)
When users fill out the modal:
- ✅ Name, email, company
- ✅ Which button they clicked (ctaType)
- ✅ Timestamp
- ✅ User agent (browser info)
- ✅ IP address
- ✅ Page URL

### Button Clicks
Every button click tracks:
- ✅ Button type (e.g., "hero-get-started")
- ✅ Session ID (unique per browser session)
- ✅ Page URL
- ✅ Referrer
- ✅ Timestamp

### Email Subscriptions
Newsletter signups track:
- ✅ Email address
- ✅ Subscription status
- ✅ Subscription type
- ✅ Timestamp

---

## 🎯 Next Steps

### 1. Add More Tracking (Optional)
Want to track more events? Add to `lib/analytics.ts`:
```typescript
export const trackEvent = async (eventType: string, eventData: any) => {
  await fetch('/api/track-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, eventData })
  });
};
```

### 2. Build Admin Dashboard
Create `app/admin/page.tsx` to visualize your data:
- Total contacts
- Button click breakdown
- Conversion funnel
- Recent activity

### 3. Set Up Email Notifications
Get notified when someone signs up:
1. Install Resend: `npm install resend`
2. Add webhook in Supabase: **Database** > **Webhooks**
3. Trigger on: `contacts` table INSERT
4. Send to: Your API endpoint

### 4. Export Data
Export contacts for email campaigns:
```sql
COPY (
  SELECT email, name, company, created_at 
  FROM contacts 
  WHERE source = 'subscription_form'
) TO '/tmp/subscribers.csv' WITH CSV HEADER;
```

Or use Supabase dashboard: **Table Editor** > Select table > **Export to CSV**

---

## 🐛 Troubleshooting

### "Failed to save contact"
- ✅ Check `.env.local` has correct Supabase URL and key
- ✅ Verify tables exist: Go to **Table Editor** in Supabase
- ✅ Check browser console for detailed error
- ✅ Verify RLS policies allow inserts: **Authentication** > **Policies**

### Can't see data in Supabase
- ✅ Make sure you ran the schema SQL (Step 2)
- ✅ Check you're looking at the right table
- ✅ Try refreshing the page
- ✅ Check if data was actually submitted (browser console)

### Environment variables not working
- ✅ File must be named exactly `.env.local` (not `.env.local.txt`)
- ✅ Must restart dev server after creating `.env.local`
- ✅ Variables must start with `NEXT_PUBLIC_` to be available in browser
- ✅ No spaces around `=` sign

### CORS errors
- ✅ Check Supabase **Settings** > **API** > **API Settings**
- ✅ Add your domain to allowed origins
- ✅ For local dev, `localhost:3000` should work by default

---

## 💰 Costs & Limits

### Free Tier (Perfect for starting)
- ✅ 500MB database storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Social auth included

### When to Upgrade ($25/month)
- 📊 > 500MB data (about 50,000 contacts)
- 🌐 > 2GB bandwidth
- 🔄 Need daily backups
- 📈 Need better performance

**Estimate**: Free tier handles ~10,000 form submissions/month easily

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

---

## ✅ Checklist

Before deploying to production:

- [ ] Create Supabase project
- [ ] Run schema SQL
- [ ] Add `.env.local` with keys
- [ ] Test form submission locally
- [ ] Verify data appears in Supabase
- [ ] Test button click tracking
- [ ] Set up production environment variables
- [ ] Add to `.gitignore`: `.env.local`
- [ ] Document your setup for team

---

**Need Help?** Check the Supabase Discord or create an issue on GitHub.

🎉 **You're all set!** Your landing page now has a fully functional backend.
