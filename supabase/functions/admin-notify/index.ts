import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gmailUser = Deno.env.get("GMAIL_USER")!;
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, target_user_id, ad_title, email } = body;

    // Find user by email
    if (type === "find_user_by_email") {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const found = users?.find((u: any) => u.email === email);
      if (!found) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ user_id: found.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target user email
    let targetEmail = "";
    if (target_user_id) {
      const { data: { user: targetUser } } = await supabase.auth.admin.getUserById(target_user_id);
      targetEmail = targetUser?.email || "";
    }

    const sendEmail = async (to: string, subject: string, htmlBody: string) => {
      // Use SMTP via Gmail
      const response = await fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Fallback: use a simple fetch to send via the existing edge function pattern
      // Actually, let's use a direct SMTP approach via gmail
      const emailPayload = {
        to,
        subject,
        html: htmlBody,
      };

      // Send via Deno's built-in capabilities using Gmail SMTP
      const encoder = new TextEncoder();
      const credentials = btoa(`${gmailUser}:${gmailAppPassword}`);
      
      // Use Gmail API via HTTP
      const boundary = "boundary_" + Date.now();
      const rawEmail = [
        `From: Klik Usluge <${gmailUser}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlBody,
      ].join("\r\n");

      const encodedMessage = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Use nodemailer-like approach with fetch to Gmail SMTP relay
      // For simplicity, we'll use the same pattern as the existing send-otp function
      const smtpResponse = await fetch(`https://api.mailgun.net/v3/sandbox.mailgun.org/messages`, {
        method: "POST",
      }).catch(() => null);

      // Direct approach: connect to smtp.gmail.com
      const conn = await Deno.connectTls({
        hostname: "smtp.gmail.com",
        port: 465,
      });

      const read = async () => {
        const buf = new Uint8Array(1024);
        const n = await conn.read(buf);
        return new TextDecoder().decode(buf.subarray(0, n || 0));
      };

      const write = async (cmd: string) => {
        await conn.write(encoder.encode(cmd + "\r\n"));
        return await read();
      };

      await read(); // greeting
      await write("EHLO localhost");
      await write(`AUTH LOGIN`);
      await write(btoa(gmailUser));
      await write(btoa(gmailAppPassword));
      await write(`MAIL FROM:<${gmailUser}>`);
      await write(`RCPT TO:<${to}>`);
      await write("DATA");
      await conn.write(encoder.encode(
        `From: Klik Usluge <${gmailUser}>\r\n` +
        `To: ${to}\r\n` +
        `Subject: ${subject}\r\n` +
        `MIME-Version: 1.0\r\n` +
        `Content-Type: text/html; charset=UTF-8\r\n` +
        `\r\n` +
        htmlBody +
        `\r\n.\r\n`
      ));
      await read();
      await write("QUIT");
      conn.close();
    };

    if (type === "ad_deleted" && targetEmail) {
      await sendEmail(
        targetEmail,
        "Vaš oglas je uklonjen - Klik Usluge",
        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#3b5998;">Klik Usluge - Obaveštenje</h2>
          <p>Poštovani,</p>
          <p>Vaš oglas <strong>"${ad_title || "Oglas"}"</strong> je uklonjen od strane administratora.</p>
          <p>Ukoliko smatrate da je došlo do greške, kontaktirajte nas putem kontakt stranice na sajtu.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:12px;color:#999;">Klik Usluge tim</p>
        </div>`
      );
    }

    if (type === "profile_deleted" && targetEmail) {
      await sendEmail(
        targetEmail,
        "Vaš nalog je uklonjen - Klik Usluge",
        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#3b5998;">Klik Usluge - Obaveštenje</h2>
          <p>Poštovani,</p>
          <p>Vaš nalog na platformi Klik Usluge je uklonjen od strane administratora.</p>
          <p>Ukoliko smatrate da je došlo do greške, kontaktirajte nas putem email adrese.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:12px;color:#999;">Klik Usluge tim</p>
        </div>`
      );
    }

    if (type === "delete_auth_user" && target_user_id) {
      await supabase.auth.admin.deleteUser(target_user_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin notify error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
