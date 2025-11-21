import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buttonType, email, sessionId } = body;

    if (!buttonType) {
      return NextResponse.json({ 
        success: false, 
        message: 'Button type required' 
      }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const referrer = request.headers.get('referer') || undefined;

    // Find contact by email if provided
    let contactId = null;
    if (email) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email)
        .single();
      
      contactId = contact?.id || null;
    }

    // Log button click
    const { error } = await supabase
      .from('button_clicks')
      .insert({
        contact_id: contactId,
        button_type: buttonType,
        page_url: referrer,
        session_id: sessionId || request.cookies.get('session_id')?.value,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
      });

    if (error) {
      console.error('Track click error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to track click' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Click tracked' 
    }, { status: 200 });

  } catch (error) {
    console.error('Track Click API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred' 
    }, { status: 500 });
  }
}
