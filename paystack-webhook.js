import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?deno-std=0.177.0";

serve(async (req) => {
  console.log("paystack-webhook called:", req.method);

  // Paystack sends POST only
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // 1. Env vars
    const supabaseUrl    = Deno.env.get("SUPABASE_URL");
    const serviceKey     = Deno.env.get("SERVICE_ROLE_KEY");
    const webhookSecret  = Deno.env.get("PAYSTACK_WEBHOOK_SECRET");

    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env vars");
    if (!webhookSecret) throw new Error("Missing PAYSTACK_WEBHOOK_SECRET");

    // 2. Read raw body for HMAC verification
    const rawBody = await req.text();

    // 3. Verify Paystack HMAC signature
    const paystackSig = req.headers.get("x-paystack-signature");
    if (!paystackSig) throw new Error("Missing x-paystack-signature header");

    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const msgData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const sigHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (sigHex !== paystackSig) {
      console.error("Signature mismatch — possible spoofed request");
      return new Response("Unauthorized", { status: 401 });
    }

    // 4. Parse event
    const event = JSON.parse(rawBody);
    console.log("Event type:", event.event);

    // Only handle successful charges
    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200 });
    }

    const data     = event.data;
    const reference = data?.reference;
    const metadata  = data?.metadata;
    const userId    = metadata?.user_id;
    const plan      = metadata?.plan;

    console.log("Reference:", reference, "| User:", userId, "| Plan:", plan);

    if (!reference || !userId || !plan) {
      console.error("Missing required metadata fields");
      return new Response("OK", { status: 200 }); // Always 200 to Paystack
    }

    if (!["pro", "enterprise"].includes(plan)) {
      console.error("Unknown plan:", plan);
      return new Response("OK", { status: 200 });
    }

    // 5. Connect to Supabase with service role
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 6. Check for duplicate — idempotency
    const { data: existing } = await supabase
      .from("payment_logs")
      .select("status")
      .eq("reference", reference)
      .maybeSingle();

    if (existing?.status === "completed") {
      console.log("Already processed:", reference);
      return new Response("OK", { status: 200 });
    }

    // 7. Log payment
    await supabase.from("payment_logs").upsert({
      user_id:   userId,
      reference,
      plan,
      amount:    data.amount,
      status:    "completed",
    }, { onConflict: "reference" });

    // 8. Grant access on profile
    const profileUpdate = plan === "pro"
      ? { is_pro: true }
      : { is_enterprise: true };

    const { error: profileErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileErr) {
      console.error("Profile update failed:", profileErr.message);
      // Still return 200 so Paystack doesn't retry endlessly
      return new Response("OK", { status: 200 });
    }

    console.log("Access granted:", plan, "→", userId);
    return new Response("OK", { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook error:", msg);
    // Always return 200 to Paystack — otherwise it retries
    return new Response("OK", { status: 200 });
  }
});
