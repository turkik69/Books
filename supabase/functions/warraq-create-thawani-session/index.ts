
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
    const publishable = Deno.env.get("THAWANI_PUBLISHABLE_KEY");
    const mode = Deno.env.get("THAWANI_MODE") === "live" ? "live" : "test";
    const publicUrl = Deno.env.get("WARRAQ_PUBLIC_URL");

    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "supabase_config_missing" }, 500);
    if (!secret || !publishable || !publicUrl) return json({ error: "payment_config_missing" }, 503);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const bookId = String(body.book_id || "");
    const deliveryMethod = body.delivery_method === "home" ? "home" : "pickup";
    if (!bookId) return json({ error: "book_id_required" }, 400);

    const { data: order, error: orderError } = await userClient.rpc("create_order", {
      p_book_id: bookId,
      p_payment_method: "thawani",
      p_delivery_method: deliveryMethod,
    });

    if (orderError || !order) {
      return json({ error: "order_creation_failed", detail: orderError?.message }, 400);
    }

    const { data: book } = await admin.from("books").select("title").eq("id", order.book_id).single();

    const thawaniBase = mode === "live" ? "https://checkout.thawani.om" : "https://uatcheckout.thawani.om";
    const base = publicUrl.replace(/\/$/, "");
    const successUrl = base + "/?payment=success&order_id=" + encodeURIComponent(order.id);
    const cancelUrl = base + "/?payment=cancel&order_id=" + encodeURIComponent(order.id);

    const products = [{
      name: String(book?.title || "Warraq book").slice(0, 120),
      quantity: 1,
      unit_amount: Math.round(Number(order.book_price) * 1000),
    }];

    if (Number(order.delivery_fee) > 0) {
      products.push({
        name: deliveryMethod === "home" ? "Home delivery" : "Pickup service",
        quantity: 1,
        unit_amount: Math.round(Number(order.delivery_fee) * 1000),
      });
    }

    const paymentResp = await fetch(thawaniBase + "/api/v1/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", "thawani-api-key": secret },
      body: JSON.stringify({
        client_reference_id: order.id,
        mode: "payment",
        products,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { order_id: order.id, app: "warraq" },
      }),
    });

    const paymentJson = await paymentResp.json().catch(() => ({}));
    const sessionId = paymentJson?.data?.session_id || paymentJson?.data?.id;

    if (!paymentResp.ok || !paymentJson?.success || !sessionId) {
      await userClient.rpc("cancel_order", { p_order_id: order.id });
      return json({ error: "payment_session_failed", detail: paymentJson?.description }, 502);
    }

    const { error: saveError } = await admin.from("orders")
      .update({ payment_session_id: sessionId })
      .eq("id", order.id);

    if (saveError) {
      await userClient.rpc("cancel_order", { p_order_id: order.id });
      return json({ error: "payment_session_save_failed" }, 500);
    }

    return json({
      order_id: order.id,
      session_id: sessionId,
      checkout_url: thawaniBase + "/pay/" + sessionId + "?key=" + encodeURIComponent(publishable),
      mode,
    });
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
