import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, ctaType, timestamp } = body;

    // Validate input
    if (!name || !email || !ctaType) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const referrer = request.headers.get('referer') || undefined;

    // Upsert contact (create or update if exists)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        email,
        name,
        company,
        source: 'modal',
        user_agent: userAgent,
        ip_address: ipAddress,
        updated_at: new Date(timestamp || Date.now()).toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (contactError && contactError.code !== '23505') { // Ignore unique constraint violations
      console.error('Contact upsert error:', contactError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save contact' 
      }, { status: 500 });
    }

    const contactId = contact?.id;

    // Log button click event
    const { error: clickError } = await supabase
      .from('button_clicks')
      .insert({
        contact_id: contactId,
        button_type: ctaType,
        page_url: referrer,
        session_id: request.cookies.get('session_id')?.value,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
      });

    if (clickError) {
      console.error('Button click error:', clickError);
    }

    // Log conversion event
    const { error: conversionError } = await supabase
      .from('conversion_events')
      .insert({
        contact_id: contactId,
        event_type: 'modal_form_submit',
        event_data: {
          cta_type: ctaType,
          timestamp: timestamp || new Date().toISOString(),
        },
      });

    if (conversionError) {
      console.error('Conversion event error:', conversionError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contact saved successfully',
      contactId: contactId 
    }, { status: 200 });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred' 
    }, { status: 500 });
  }
}
