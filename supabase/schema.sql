-- CapyLearn Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100)
);

-- Button Clicks Table
CREATE TABLE button_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    button_type VARCHAR(100) NOT NULL,
    page_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session tracking
    session_id VARCHAR(255),
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    referrer TEXT
);

-- Email Subscriptions Table
CREATE TABLE email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed BOOLEAN DEFAULT TRUE,
    subscription_type VARCHAR(50) DEFAULT 'newsletter',
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Conversion Events Table
CREATE TABLE conversion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_button_clicks_contact_id ON button_clicks(contact_id);
CREATE INDEX idx_button_clicks_button_type ON button_clicks(button_type);
CREATE INDEX idx_button_clicks_clicked_at ON button_clicks(clicked_at);
CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX idx_conversion_events_contact_id ON conversion_events(contact_id);
CREATE INDEX idx_conversion_events_event_type ON conversion_events(event_type);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on contacts table
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE button_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for public form submissions)
CREATE POLICY "Allow anonymous inserts on contacts" ON contacts
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on button_clicks" ON button_clicks
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on email_subscriptions" ON email_subscriptions
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on conversion_events" ON conversion_events
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to read all data (for admin dashboard)
CREATE POLICY "Allow authenticated read on contacts" ON contacts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read on button_clicks" ON button_clicks
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read on email_subscriptions" ON email_subscriptions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read on conversion_events" ON conversion_events
    FOR SELECT TO authenticated
    USING (true);
