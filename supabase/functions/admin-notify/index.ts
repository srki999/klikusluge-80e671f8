import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

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

    // Verify caller is admin or super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create a client with the user's auth context for getClaims
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check admin or super_admin role using service role client
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const callerRoles = (roleData || []).map((r: any) => r.role);
    if (!callerRoles.includes("admin") && !callerRoles.includes("super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, target_user_id, ad_title, email, user_ids } = body;

    // Get user emails in bulk
    if (type === "get_user_emails") {
      const emailMap: Record<string, string> = {};
      if (user_ids && Array.isArray(user_ids)) {
        for (const uid of user_ids) {
          const { data: { user: u } } = await supabase.auth.admin.getUserById(uid);
          if (u?.email) emailMap[uid] = u.email;
        }
      }
      return new Response(JSON.stringify({ emails: emailMap }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    if (type === "find_user_by_email") {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const found = users?.find((u: any) => u.email?.toLowerCase() === email?.toLowerCase());
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

    // Email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    // Get target user email
    let targetEmail = "";
    if (target_user_id) {
      const { data: { user: targetUser } } = await supabase.auth.admin.getUserById(target_user_id);
      targetEmail = targetUser?.email || "";
    }

    if (type === "ad_deleted" && targetEmail) {
      await transporter.sendMail({
        from: `"Klik Usluge" <${gmailUser}>`,
        to: targetEmail,
        subject: "Vaš oglas je uklonjen - Klik Usluge",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px;">
            <h2 style="text-align: center; color: #3b5998; margin-bottom: 16px;">Klik Usluge</h2>
            <p>Poštovani,</p>
            <p>Vaš oglas <strong>"${ad_title || "Oglas"}"</strong> je uklonjen od strane administratora.</p>
            <p>Ukoliko smatrate da je došlo do greške, kontaktirajte nas putem kontakt stranice na sajtu.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="font-size:12px;color:#999;text-align:center;">Klik Usluge tim</p>
          </div>
        `,
      });
    }

    if (type === "profile_deleted" && targetEmail) {
      await transporter.sendMail({
        from: `"Klik Usluge" <${gmailUser}>`,
        to: targetEmail,
        subject: "Vaš nalog je uklonjen - Klik Usluge",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px;">
            <h2 style="text-align: center; color: #3b5998; margin-bottom: 16px;">Klik Usluge</h2>
            <p>Poštovani,</p>
            <p>Vaš nalog na platformi Klik Usluge je uklonjen od strane administratora.</p>
            <p>Ukoliko smatrate da je došlo do greške, kontaktirajte nas putem email adrese.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="font-size:12px;color:#999;text-align:center;">Klik Usluge tim</p>
          </div>
        `,
      });
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
