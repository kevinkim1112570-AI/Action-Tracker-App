// Supabase Edge Function: lets an admin (profiles.is_admin = true) add a user
// with a username and initial password. Deployed to the project as "create-user".
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

// Users sign in with a username; Supabase Auth needs an email, so we map it.
const EMAIL_DOMAIN = "example.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Use POST." });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Who is calling? Must be a signed-in admin.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller?.user) return reply(401, { error: "Please sign in again." });

  const { data: me } = await admin
    .from("profiles").select("is_admin").eq("id", caller.user.id).single();
  if (!me?.is_admin) return reply(403, { error: "Only admins can add users." });

  let body: { username?: string; password?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request." }); }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!/^[a-z0-9_.-]{2,30}$/.test(username)) {
    return reply(400, { error: "Username must be 2–30 characters: letters, numbers, dot, dash or underscore." });
  }
  if (password.length < 6) return reply(400, { error: "Password must be at least 6 characters." });

  // The database trigger creates the matching profiles row.
  const { error } = await admin.auth.admin.createUser({
    email: `${username}@${EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (error) {
    const taken = /already|exists|registered/i.test(error.message);
    return reply(taken ? 409 : 400, { error: taken ? "That username is already taken." : error.message });
  }
  return reply(200, { username });
});
