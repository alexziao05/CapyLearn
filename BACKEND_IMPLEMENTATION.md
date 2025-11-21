# Backend Implementation Guide for CapyLearn

## Overview
This guide outlines the steps to create a backend system for:
1. **Email Collection** - Store contact information from modal forms and subscription forms
2. **Button Click Tracking** - Track which CTAs users interact with
3. **Analytics** - Understand user behavior and conversion funnels

---

## Architecture Recommendation

### Tech Stack Options

#### Option 1: Next.js API Routes (Recommended for Quick Start)
- **Pros**: Same codebase, easy deployment, serverless
- **Cons**: Tied to Next.js hosting
- **Best for**: MVP, fast iteration

#### Option 2: Separate Backend (Express/FastAPI)
- **Pros**: More flexibility, easier to scale separately
- **Cons**: More infrastructure to manage
- **Best for**: Long-term scalability

#### Option 3: Serverless (Vercel Functions / AWS Lambda)
- **Pros**: Auto-scaling, pay per use
- **Cons**: Cold starts, vendor lock-in
- **Best for**: Variable traffic patterns

---

## Implementation Steps

### Phase 1: Database Setup

#### Step 1.1: Choose Database
**Options:**
- **PostgreSQL** (Recommended) - Relational, ACID compliant, great for structured data
- **MongoDB** - NoSQL, flexible schema
- **Supabase** - PostgreSQL with built-in auth, real-time, and APIs
- **Firebase** - Quick setup, real-time capabilities

**Recommendation:** Use **Supabase** or **PostgreSQL with Prisma ORM**

#### Step 1.2: Design Database Schema

```sql
-- Users/Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    source VARCHAR(100), -- 'modal', 'subscription_form'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100)
);

-- Button Clicks/Events Table
CREATE TABLE button_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id),
    button_type VARCHAR(100) NOT NULL, -- 'hero-get-started', 'pricing-free', etc.
    page_url TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Session tracking
    session_id VARCHAR(255),
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    referrer TEXT
);

-- Email Subscriptions Table (for the final CTA section)
CREATE TABLE email_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed BOOLEAN DEFAULT TRUE,
    subscription_type VARCHAR(50) DEFAULT 'newsletter',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP
);

-- Conversion Funnel Table (for analytics)
CREATE TABLE conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id),
    event_type VARCHAR(100), -- 'page_view', 'modal_open', 'form_submit', 'subscription'
    event_data JSONB, -- Flexible data storage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_button_clicks_contact_id ON button_clicks(contact_id);
CREATE INDEX idx_button_clicks_button_type ON button_clicks(button_type);
CREATE INDEX idx_button_clicks_clicked_at ON button_clicks(clicked_at);
CREATE INDEX idx_conversion_events_contact_id ON conversion_events(contact_id);
```

---

### Phase 2: Backend API Development

#### Step 2.1: Set Up Prisma (if using Next.js + PostgreSQL)

```bash
# Install dependencies
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init
```

**prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Contact {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  company       String?
  source        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  userAgent     String?
  ipAddress     String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  
  buttonClicks      ButtonClick[]
  emailSubscriptions EmailSubscription[]
  conversionEvents  ConversionEvent[]

  @@map("contacts")
}

model ButtonClick {
  id          String   @id @default(uuid())
  contactId   String?
  contact     Contact? @relation(fields: [contactId], references: [id])
  buttonType  String
  pageUrl     String?
  clickedAt   DateTime @default(now())
  sessionId   String?
  userAgent   String?
  ipAddress   String?
  referrer    String?

  @@map("button_clicks")
  @@index([contactId])
  @@index([buttonType])
  @@index([clickedAt])
}

model EmailSubscription {
  id                String    @id @default(uuid())
  contactId         String?
  contact           Contact?  @relation(fields: [contactId], references: [id])
  email             String    @unique
  subscribed        Boolean   @default(true)
  subscriptionType  String    @default("newsletter")
  subscribedAt      DateTime  @default(now())
  unsubscribedAt    DateTime?

  @@map("email_subscriptions")
}

model ConversionEvent {
  id         String   @id @default(uuid())
  contactId  String?
  contact    Contact? @relation(fields: [contactId], references: [id])
  eventType  String
  eventData  Json?
  createdAt  DateTime @default(now())

  @@map("conversion_events")
  @@index([contactId])
}
```

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init
```

#### Step 2.2: Create API Routes

**app/api/contact/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, ctaType, timestamp } = body;

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Upsert contact (create or update if exists)
    const contact = await prisma.contact.upsert({
      where: { email },
      update: {
        name,
        company,
        updatedAt: new Date(timestamp),
        userAgent,
        ipAddress,
      },
      create: {
        name,
        email,
        company,
        source: 'modal',
        userAgent,
        ipAddress,
      },
    });

    // Log button click event
    await prisma.buttonClick.create({
      data: {
        contactId: contact.id,
        buttonType: ctaType,
        pageUrl: request.headers.get('referer') || undefined,
        sessionId: request.cookies.get('session_id')?.value,
        userAgent,
        ipAddress,
      },
    });

    // Log conversion event
    await prisma.conversionEvent.create({
      data: {
        contactId: contact.id,
        eventType: 'modal_form_submit',
        eventData: {
          ctaType,
          timestamp,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Contact saved successfully',
      contactId: contact.id 
    }, { status: 200 });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save contact' 
    }, { status: 500 });
  }
}
```

**app/api/subscribe/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email address' 
      }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Create or update contact
    const contact = await prisma.contact.upsert({
      where: { email },
      update: {
        source: 'subscription_form',
        updatedAt: new Date(),
      },
      create: {
        email,
        name: email.split('@')[0], // Temporary name from email
        source: 'subscription_form',
        userAgent,
        ipAddress,
      },
    });

    // Create subscription
    await prisma.emailSubscription.upsert({
      where: { email },
      update: {
        subscribed: true,
        unsubscribedAt: null,
      },
      create: {
        contactId: contact.id,
        email,
        subscribed: true,
      },
    });

    // Log conversion event
    await prisma.conversionEvent.create({
      data: {
        contactId: contact.id,
        eventType: 'email_subscription',
        eventData: { source: 'final_cta_section' },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed!' 
    }, { status: 200 });

  } catch (error) {
    console.error('Subscribe API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to subscribe' 
    }, { status: 500 });
  }
}
```

**app/api/track-click/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buttonType, email, sessionId } = body;

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Find contact by email if provided
    let contactId = null;
    if (email) {
      const contact = await prisma.contact.findUnique({
        where: { email },
      });
      contactId = contact?.id || null;
    }

    // Log button click
    await prisma.buttonClick.create({
      data: {
        contactId,
        buttonType,
        pageUrl: request.headers.get('referer') || undefined,
        sessionId: sessionId || request.cookies.get('session_id')?.value,
        userAgent,
        ipAddress,
        referrer: request.headers.get('referer') || undefined,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Click tracked' 
    }, { status: 200 });

  } catch (error) {
    console.error('Track Click API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to track click' 
    }, { status: 500 });
  }
}
```

---

### Phase 3: Frontend Integration

#### Step 3.1: Update ContactModal Component

**app/page.tsx (ContactModal):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...formData, 
        ctaType, 
        timestamp: new Date().toISOString() 
      })
    });

    const data = await response.json();

    if (data.success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({ name: '', email: '', company: '' });
      }, 2000);
    } else {
      alert('Failed to submit. Please try again.');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    alert('An error occurred. Please try again.');
  }
};
```

#### Step 3.2: Add Click Tracking Utility

**lib/analytics.ts:**
```typescript
export const trackButtonClick = async (buttonType: string, email?: string) => {
  try {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }

    await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        buttonType, 
        email,
        sessionId 
      })
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.error('Click tracking error:', error);
  }
};
```

#### Step 3.3: Update Button Click Handlers

**Example in HeroSection:**
```typescript
import { trackButtonClick } from '@/lib/analytics';

<Button 
  onClick={() => {
    trackButtonClick('hero-get-started');
    openModal('hero-get-started');
  }}
>
  Get Started Free
</Button>
```

#### Step 3.4: Update Subscription Form

**In FinalCTASection:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      setSubmitted(true);
    } else {
      alert('Failed to subscribe. Please try again.');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    alert('An error occurred. Please try again.');
  }
};
```

---

### Phase 4: Analytics Dashboard

#### Step 4.1: Create Analytics API

**app/api/analytics/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authentication check (add your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Total contacts
    const totalContacts = await prisma.contact.count();

    // New contacts in date range
    const newContacts = await prisma.contact.count({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }
    });

    // Button click analytics
    const buttonClicks = await prisma.buttonClick.groupBy({
      by: ['buttonType'],
      _count: true,
      where: {
        clickedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      },
      orderBy: {
        _count: {
          buttonType: 'desc'
        }
      }
    });

    // Conversion funnel
    const modalOpens = await prisma.buttonClick.count({
      where: {
        clickedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }
    });

    const formSubmits = await prisma.conversionEvent.count({
      where: {
        eventType: 'modal_form_submit',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }
    });

    const subscriptions = await prisma.emailSubscription.count({
      where: {
        subscribedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }
    });

    // Top sources
    const topSources = await prisma.contact.groupBy({
      by: ['source'],
      _count: true,
      orderBy: {
        _count: {
          source: 'desc'
        }
      }
    });

    return NextResponse.json({
      summary: {
        totalContacts,
        newContacts,
        modalOpens,
        formSubmits,
        subscriptions,
        conversionRate: modalOpens > 0 ? (formSubmits / modalOpens * 100).toFixed(2) : 0,
      },
      buttonClicks: buttonClicks.map(b => ({
        buttonType: b.buttonType,
        count: b._count,
      })),
      topSources: topSources.map(s => ({
        source: s.source,
        count: s._count,
      })),
    }, { status: 200 });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics' 
    }, { status: 500 });
  }
}
```

#### Step 4.2: Create Simple Dashboard Page

**app/admin/dashboard/page.tsx:**
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${prompt('Enter admin password:')}`,
          }
        });
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!analytics) return <div>Failed to load analytics</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">CapyLearn Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Contacts</h3>
          <p className="text-3xl font-bold">{analytics.summary.totalContacts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Modal Opens</h3>
          <p className="text-3xl font-bold">{analytics.summary.modalOpens}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Conversion Rate</h3>
          <p className="text-3xl font-bold">{analytics.summary.conversionRate}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Button Clicks</h2>
        <div className="space-y-2">
          {analytics.buttonClicks.map((btn: any) => (
            <div key={btn.buttonType} className="flex justify-between">
              <span>{btn.buttonType}</span>
              <span className="font-bold">{btn.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Top Sources</h2>
        <div className="space-y-2">
          {analytics.topSources.map((source: any) => (
            <div key={source.source} className="flex justify-between">
              <span>{source.source || 'Unknown'}</span>
              <span className="font-bold">{source.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 5: Environment Setup

**.env.local:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/capylearn"

# Admin
ADMIN_SECRET="your-super-secret-admin-password-here"

# Optional: Email service (for sending welcome emails)
RESEND_API_KEY="your-resend-api-key"
SENDGRID_API_KEY="your-sendgrid-api-key"
```

---

### Phase 6: Email Integration (Optional)

#### Step 6.1: Set Up Resend or SendGrid

```bash
npm install resend
# or
npm install @sendgrid/mail
```

**lib/email.ts:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'CapyLearn <hello@capylearn.com>',
      to: email,
      subject: 'Welcome to CapyLearn! 🎉',
      html: `
        <h1>Hi ${name}!</h1>
        <p>Thanks for joining CapyLearn. You're now part of a community learning AI through practical projects.</p>
        <p>Your first project will arrive in 2 days!</p>
        <a href="https://capylearn.com">Visit CapyLearn</a>
      `
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}
```

**Add to contact API:**
```typescript
import { sendWelcomeEmail } from '@/lib/email';

// After creating contact
await sendWelcomeEmail(contact.email, contact.name);
```

---

### Phase 7: Deployment Checklist

1. **Environment Variables**
   - [ ] Set DATABASE_URL in production
   - [ ] Set ADMIN_SECRET
   - [ ] Set email API keys (if using)

2. **Database**
   - [ ] Run migrations: `npx prisma migrate deploy`
   - [ ] Verify database connection

3. **Security**
   - [ ] Add rate limiting to API routes
   - [ ] Implement CSRF protection
   - [ ] Add proper authentication for admin dashboard
   - [ ] Sanitize all user inputs

4. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Add logging (Winston, Pino)
   - [ ] Monitor database performance

5. **GDPR Compliance**
   - [ ] Add privacy policy
   - [ ] Implement data deletion endpoint
   - [ ] Add consent checkboxes
   - [ ] Create unsubscribe mechanism

---

## Quick Start Commands

```bash
# Install dependencies
npm install prisma @prisma/client

# Initialize database
npx prisma init
npx prisma migrate dev --name init
npx prisma generate

# Run development server
npm run dev

# View database
npx prisma studio
```

---

## Cost Estimates

**Monthly Costs (for 1,000 users):**
- Vercel Hosting: $0-20
- PostgreSQL (Supabase Free Tier): $0
- PostgreSQL (Supabase Pro): $25
- Email Service (Resend): $0-20
- Total: **$0-65/month**

---

## Next Steps

1. Set up database
2. Create API routes
3. Update frontend to use APIs
4. Test thoroughly
5. Deploy to production
6. Monitor and iterate

---

## Support Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Docs](https://supabase.com/docs)
- [Resend Docs](https://resend.com/docs)

---

**Need help?** This is a comprehensive guide - start with Phase 1 and work your way through. Each phase builds on the previous one.
