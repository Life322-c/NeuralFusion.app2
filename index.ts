// supabase/functions/verify-payment/index.ts
// NeuralFusion™ — Server-side Paystack Payment Verification
// Deploy: supabase functions deploy verify-payment
// Requires env var: PAYSTACK_SECRET_KEY (set in Supabase Dashboard → Edge Functions → Secrets)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tryneuralFusion.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── 1. Parse & validate request body ─────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body?.reference || typeof body.reference !== "string") {
      return json({ error: "Missing or invalid payment reference" }, 400);
    }

    const { reference, plan } = body as { reference: string; plan: "pro" | "enterprise" };

    if (!["pro", "enterprise"].includes(plan)) {
      return json({ error: "Invalid plan type" }, 400);
    }

    // ── 2. Authenticate the calling user via their JWT ────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Use the anon client to verify the JWT
    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return json({ error: "Unauthorized — invalid session" }, 401);
    }

    // ── 3. Verify the transaction with Paystack (server-side) ─────────────────
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paystackRes.ok) {
      console.error("Paystack API error:", paystackRes.status);
      return json({ error: "Payment verification failed" }, 502);
    }

    const paystackData = await paystackRes.json();

    // ── 4. Validate transaction status and amount ─────────────────────────────
    if (!paystackData.status || paystackData.data?.status !== "success") {
      return json({ error: "Transaction was not successful" }, 402);
    }

    const tx = paystackData.data;

    // Validate the email matches the logged-in user (prevents reference reuse)
    if (tx.customer?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      console.error("Email mismatch:", tx.customer?.email, "vs", user.email);
      return json({ error: "Transaction email does not match account" }, 403);
    }

    // Validate amount paid (amounts are in kobo: NGN × 100)
    const EXPECTED_AMOUNTS: Record<string, number> = {
      pro: 4900 * 100,        // ₦4,900 in kobo — update to match your actual price
      enterprise: 0,           // Enterprise is contact-based; set to 0 to skip amount check
    };

    const expectedKobo = EXPECTED_AMOUNTS[plan];
    if (expectedKobo > 0 && tx.amount < expectedKobo) {
      console.error(`Amount mismatch: paid ${tx.amount}, expected ${expectedKobo}`);
      return json({ error: "Insufficient payment amount" }, 402);
    }

    // ── 5. Guard against reference reuse (idempotency) ────────────────────────
    // Use the service-role client for privileged writes
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: existingTx } = await supabase
      .from("payment_transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (existingTx) {
      // Already processed — return success without re-applying (idempotent)
      return json({ success: true, message: "Already processed" }, 200);
    }

    // ── 6. Record the transaction ─────────────────────────────────────────────
    await supabase.from("payment_transactions").insert({
      user_id:   user.id,
      reference: reference,
      plan:      plan,
      amount:    tx.amount,
      currency:  tx.currency,
      paid_at:   tx.paid_at,
    });

    // ── 7. Grant plan access (server-side, RLS-bypassed via service key) ──────
    const profileUpdate: Record<string, boolean> = {};
    if (plan === "pro")        profileUpdate.is_pro = true;
    if (plan === "enterprise") profileUpdate.is_enterprise = true;

    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return json({ error: "Failed to activate plan" }, 500);
    }

    return json({ success: true, plan }, 200);

  } catch (err) {
    console.error("verify-payment error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
