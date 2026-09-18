
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secret = Deno.env.get("THAWANI_SECRET_KEY");
    const mode = Deno.env.get("THAWANI_MODE") === "live" ? "live" : "test";

    if (!supabaseUrl || !serviceKey || !secret) {
      return json({ ok: false, error: "server_config_missing" }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const data = body?.data || body || {};
    const metadata = data?.metadata || body?.metadata || {};

    const hintedSessionId = String(
      data?.session_id ||
      data?.id ||
      body?.session_id ||
      body?.checkout_session_id ||
      ""
    );

    const hintedOrderId = String(
      data?.client_reference_id ||
      body?.client_reference_id ||
      metadata?.order_id ||
      ""
    );

    const admin = createClient(supabaseUrl, serviceKey);

    let query = admin
      .from("orders")
      .select("id,payment_session_id,payment_status,order_status");

    if (hintedOrderId) {
      query = query.eq("id", hintedOrderId);
    } else if (hintedSessionId) {
      query = query.eq("payment_session_id", hintedSessionId);
    } else {
      return json({ ok: true, ignored: "no_order_hint" });
    }

    const { data: order } = await query.maybeSingle();
    if (!order?.payment_session_id) {
      return json({ ok: true, ignored: "order_not_found" });
    }

    const thawaniBase = mode === "live"
      ? "https://checkout.thawani.om"
      : "https://uatcheckout.thawani.om";

    const verifyResp = await fetch(
      thawaniBase + "/api/v1/checkout/session/" + encodeURIComponent(order.payment_session_id),
      {
        headers: {
          "Content-Type": "application/json",
          "thawani-api-key": secret,
        },
      },
    );

    const payload = await verifyResp.json().catch(() => ({}));
    if (!verifyResp.ok || !payload?.success) {
      return json({ ok: false, error: "provider_verification_failed" }, 502);
    }

    const paymentStatus = String(payload?.data?.payment_status || "").toLowerCase();

    if (paymentStatus === "paid") {
      const reference = String(
        payload?.data?.invoice ||
        payload?.data?.payment_id ||
        order.payment_session_id
      );

      const { error } = await admin.rpc("mark_order_paid_internal", {
        p_order_id: order.id,
        p_payment_reference: reference,
      });

      if (error) {
        return json({ ok: false, error: "payment_commit_failed" }, 500);
      }

      return json({ ok: true, paid: true });
    }

    if (["cancelled","canceled","failed","expired"].includes(paymentStatus)) {
      await admin.rpc("mark_order_failed_internal", {
        p_order_id: order.id,
        p_reason: "provider_" + paymentStatus,
      });
      return json({ ok: true, paid: false, payment_status: paymentStatus });
    }

    return json({ ok: true, paid: false, payment_status: paymentStatus || "unknown" });
  } catch (e) {
    return json({ ok: false, error: "server_error", detail: String(e?.message || e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
