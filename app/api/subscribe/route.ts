import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
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
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        email,
        name: email.split('@')[0], // Temporary name from email
        source: 'subscription_form',
        user_agent: userAgent,
        ip_address: ipAddress,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (contactError && contactError.code !== '23505') {
      console.error('Contact upsert error:', contactError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save contact' 
      }, { status: 500 });
    }

    const contactId = contact?.id;

    // Create or update subscription
    const { error: subscriptionError } = await supabase
      .from('email_subscriptions')
      .upsert({
        contact_id: contactId,
        email,
        subscribed: true,
        unsubscribed_at: null,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to subscribe' 
      }, { status: 500 });
    }

    // Log conversion event
    const { error: conversionError } = await supabase
      .from('conversion_events')
      .insert({
        contact_id: contactId,
        event_type: 'email_subscription',
        event_data: { source: 'final_cta_section' },
      });

    if (conversionError) {
      console.error('Conversion event error:', conversionError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed!' 
    }, { status: 200 });

  } catch (error) {
    console.error('Subscribe API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred' 
    }, { status: 500 });
  }
}
