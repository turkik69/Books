
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secret = Deno.env.get("THAWANI_SECRET_KEY");
    const mode = Deno.env.get("THAWANI_MODE") === "live" ? "live" : "test";

    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "supabase_config_missing" }, 500);
    if (!secret) return json({ error: "payment_config_missing" }, 503);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: "unauthorized" }, 401);

    const body = await req.json();
    const orderId = String(body.order_id || "");
    if (!orderId) return json({ error: "order_id_required" }, 400);

    const { data: order, error: orderError } = await admin.from("orders")
      .select("id,buyer_id,payment_session_id,payment_status,order_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) return json({ error: "order_not_found" }, 404);
    if (order.buyer_id !== user.id) return json({ error: "forbidden" }, 403);

    if (order.payment_status === "paid") {
      return json({ paid: true, status: order.order_status });
    }
    if (!order.payment_session_id) return json({ error: "payment_session_missing" }, 409);

    const thawaniBase = mode === "live" ? "https://checkout.thawani.om" : "https://uatcheckout.thawani.om";
    const resp = await fetch(
      thawaniBase + "/api/v1/checkout/session/" + encodeURIComponent(order.payment_session_id),
      { headers: { "Content-Type": "application/json", "thawani-api-key": secret } },
    );
    const payload = await resp.json().catch(() => ({}));
    const paymentStatus = String(payload?.data?.payment_status || "").toLowerCase();

    if (!resp.ok || !payload?.success) {
      return json({ error: "payment_verification_failed", detail: payload?.description }, 502);
    }

    if (paymentStatus !== "paid") {
      return json({ paid: false, payment_status: paymentStatus || "unknown" });
    }

    const paymentReference = String(
      payload?.data?.invoice || payload?.data?.payment_id || order.payment_session_id
    );

    const { data: paidOrder, error: markError } = await admin.rpc("mark_order_paid_internal", {
      p_order_id: order.id,
      p_payment_reference: paymentReference,
    });

    if (markError) return json({ error: "payment_commit_failed", detail: markError.message }, 500);

    return json({ paid: true, status: paidOrder.order_status });
  } catch (e) {
    return json({ error: "server_error", detail: String(e?.message || e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
