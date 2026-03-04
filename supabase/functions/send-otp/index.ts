import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email je obavezan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if email exists in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error listing users:', userError);
      return new Response(JSON.stringify({ error: 'Greška na serveru' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userExists = userData.users.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!userExists) {
      return new Response(JSON.stringify({ error: 'Ne postoji nalog sa ovom email adresom' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate 4-digit code
    const code = String(Math.floor(1000 + Math.random() * 9000));

    // Invalidate old codes for this email
    await supabase.from('otp_codes').update({ used: true }).eq('email', email.toLowerCase()).eq('used', false);

    // Store new code
    const { error: insertError } = await supabase.from('otp_codes').insert({
      email: email.toLowerCase(),
      code,
    });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(JSON.stringify({ error: 'Greška pri kreiranju koda' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email via Gmail SMTP using nodemailer
    const gmailUser = Deno.env.get('GMAIL_USER')!;
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')!;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    await transporter.sendMail({
      from: `"Klik Usluge" <${gmailUser}>`,
      to: email,
      subject: 'Klik Usluge - Kod za resetovanje lozinke',
      text: `Vaš kod za resetovanje lozinke je: ${code}\n\nKod važi 10 minuta.\n\nAko niste zatražili resetovanje lozinke, ignorišite ovaj email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px;">
          <h2 style="text-align: center; color: #1a1a2e; margin-bottom: 8px;">Klik Usluge</h2>
          <p style="text-align: center; color: #666; font-size: 14px;">Kod za resetovanje lozinke</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1a1a2e; background: #f0f0f5; padding: 16px 32px; border-radius: 12px; display: inline-block;">${code}</span>
          </div>
          <p style="text-align: center; color: #888; font-size: 13px;">Kod važi 10 minuta.</p>
          <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">Ako niste zatražili resetovanje lozinke, ignorišite ovaj email.</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-otp:', error);
    return new Response(JSON.stringify({ error: 'Greška pri slanju emaila' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
