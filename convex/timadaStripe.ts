import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateAppointment } from "../shared/timadaBooking";
import { parseCustomer } from "../shared/checkout";
const site = () =>
  (process.env.SITE_URL || "https://www.timadashouseglam.com").replace(
    /\/$/,
    "",
  );
const headers = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": site(),
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  Vary: "Origin",
  "Cache-Control": "no-store",
});
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: headers() });
const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export const checkout = httpAction(async (ctx, req) => {
  if (req.headers.get("origin") !== site())
    return respond({ error: "Invalid origin" }, 403);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key)
    return respond(
      { error: "Online payment is unavailable. Please contact the studio." },
      503,
    );
  try {
    const raw = await req.text();
    if (raw.length > 6000) return respond({ error: "Request too large" }, 413);
    const data: unknown = JSON.parse(raw);
    const details = validateAppointment(data);
    const requestId = (data as Record<string, unknown>).requestId;
    if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/.test(requestId))
      return respond({ error: "Invalid request. Reload and try again." }, 400);
    const booking = await ctx.runMutation(internal.timada.createPending, {
      ...details,
      requestId,
    });
    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${site()}/appointment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site()}/appointment?cancelled=1`,
      customer_email: details.email,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "5000",
      "line_items[0][price_data][product_data][name]": `Timadashouse Beauty — ${booking.serviceName} deposit`,
      "line_items[0][quantity]": "1",
      "metadata[bookingId]": String(booking.id),
      "payment_intent_data[metadata][bookingId]": String(booking.id),
    });
    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": `timada-${booking.id}`,
        },
        body: params,
      },
    );
    const session = await response.json();
    if (
      !response.ok ||
      typeof session.id !== "string" ||
      typeof session.url !== "string" ||
      !session.url.startsWith("https://checkout.stripe.com/")
    )
      return respond(
        { error: "Payment setup failed. Please contact the studio or retry." },
        502,
      );
    await ctx.runMutation(internal.timada.attachSession, {
      id: booking.id,
      sessionId: session.id,
    });
    return respond({ url: session.url });
  } catch {
    return respond(
      {
        error:
          "Unable to begin checkout. Check details, policies and service availability. Reload if you changed a previous request.",
      },
      400,
    );
  }
});

export const productCheckout = httpAction(async (ctx, req) => {
  if (req.headers.get("origin") !== site()) return respond({ error: "Invalid origin" }, 403);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return respond({ error: "Online payment is unavailable. Please contact the studio." }, 503);
  try {
    const raw = await req.text();
    if (raw.length > 12000) return respond({ error: "Request too large" }, 413);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const requestId = body.requestId;
    if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/.test(requestId)) return respond({ error: "Invalid order reference" }, 400);
    const customer = parseCustomer(body.customer, true);
    if (!Array.isArray(body.items)) return respond({ error: "Your cart is empty" }, 400);
    const items = body.items.map((item) => {
      if (!item || typeof item !== "object") throw new Error("Invalid cart item");
      const line = item as Record<string, unknown>;
      if (typeof line.productId !== "string" || typeof line.quantity !== "number" || !Number.isInteger(line.quantity)) throw new Error("Invalid cart item");
      return { productId: line.productId, quantity: line.quantity, ...(typeof line.length === "string" ? { length: line.length } : {}) };
    });
    const order = await ctx.runMutation(internal.timadaOrders.createPending, { requestId, customer: JSON.stringify(customer), items });
    const params = new URLSearchParams({ mode: "payment", success_url: `${site()}/?order=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${site()}/?order=cancelled`, customer_email: customer.email, "metadata[kind]": "product", "metadata[orderId]": String(order.id), "payment_intent_data[metadata][kind]": "product", "payment_intent_data[metadata][orderId]": String(order.id) });
    order.items.forEach((item, index) => {
      params.set(`line_items[${index}][price_data][currency]`, "usd");
      params.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
      params.set(`line_items[${index}][price_data][product_data][name]`, `${item.name}${item.length ? ` · ${item.length}` : ""}`);
      params.set(`line_items[${index}][quantity]`, String(item.quantity));
    });
    const shippingIndex = order.items.length;
    params.set(`line_items[${shippingIndex}][price_data][currency]`, "usd");
    params.set(`line_items[${shippingIndex}][price_data][unit_amount]`, String(order.shippingCents));
    params.set(`line_items[${shippingIndex}][price_data][product_data][name]`, "Shipping");
    params.set(`line_items[${shippingIndex}][quantity]`, "1");
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `timada-order-${order.id}` }, body: params });
    const session = await response.json();
    if (!response.ok || typeof session.id !== "string" || typeof session.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) return respond({ error: "Payment setup failed. Please contact the studio or retry." }, 502);
    await ctx.runMutation(internal.timadaOrders.attachSession, { id: order.id, sessionId: session.id });
    return respond({ url: session.url });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Unable to begin product checkout" }, 400);
  }
});

export const verify = httpAction(async (ctx, req) => {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId || !/^cs_[A-Za-z0-9_]{8,250}$/.test(sessionId))
    return respond({ error: "Invalid session" }, 400);
  const booking = await ctx.runQuery(internal.timada.getBySession, {
    sessionId,
  });
  if (!booking) return respond({ status: "pending" }, 404);
  // Session ids are bearer receipts. Never return email, phone or notes here.
  return respond({
    status: booking.status,
    ...(booking.status === "confirmed"
      ? {
          name: booking.name,
          service: booking.serviceName,
          date: booking.date,
          time: booking.time,
        }
      : {}),
  });
});
export const webhook = httpAction(async (ctx, req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature)
    return new Response("Unauthorized", { status: 401 });

  const raw = await req.text();
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const t = Number(timestamp);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300)
    return new Response("Stale signature", { status: 400 });

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = hex(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${raw}`),
    ),
  );
  if (!parts.some((p) => p.startsWith("v1=") && equal(p.slice(3), digest)))
    return new Response("Invalid signature", { status: 400 });

  try {
    const event = JSON.parse(raw);
    const session = event.data?.object;
    const successfulEvents = [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ];
    const unsuccessfulEvents = [
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ];

    // Acknowledge unrelated events; this endpoint is subscribed only to
    // Checkout Session lifecycle events in Stripe.
    if (
      !successfulEvents.includes(event.type) &&
      !unsuccessfulEvents.includes(event.type)
    )
      return respond({ received: true });

    if (session?.metadata?.kind === "product") {
      if (session.mode !== "payment" || typeof session.id !== "string" || typeof session.metadata?.orderId !== "string") return new Response("Invalid product Checkout Session", { status: 400 });
      const order = await ctx.runQuery(internal.timadaOrders.getBySession, { sessionId: session.id });
      if (!order) return new Response("Product order not yet attached; retry", { status: 503 });
      if (String(order._id) !== session.metadata.orderId || session.currency !== "usd" || session.amount_total !== order.amountCents) return new Response("Product order mismatch", { status: 400 });
      if (successfulEvents.includes(event.type)) {
        if (session.payment_status !== "paid") return respond({ received: true, awaitingPayment: true });
        await ctx.runMutation(internal.timadaOrders.markPaid, { sessionId: session.id, paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : undefined });
      } else {
        await ctx.runMutation(internal.timadaOrders.cancelPending, { sessionId: session.id });
      }
      return respond({ received: true, order: true });
    }

    if (
      session?.mode !== "payment" ||
      session.amount_total !== 5000 ||
      session.currency !== "usd" ||
      typeof session.id !== "string" ||
      typeof session.metadata?.bookingId !== "string"
    )
      return new Response("Invalid Checkout Session details", { status: 400 });

    const booking = await ctx.runQuery(internal.timada.getBySession, {
      sessionId: session.id,
    });
    // Stripe may deliver the webhook before checkout attaches the session.
    // Ask Stripe to retry rather than losing the event.
    if (!booking)
      return new Response("Booking not yet attached; retry", { status: 503 });
    if (String(booking._id) !== session.metadata.bookingId)
      return new Response("Booking mismatch", { status: 400 });

    if (successfulEvents.includes(event.type)) {
      if (session.payment_status !== "paid")
        return respond({ received: true, awaitingPayment: true });

      await ctx.runMutation(internal.timada.confirm, {
        sessionId: session.id,
        paymentIntent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined,
      });
    } else {
      // Failed and expired Checkout Sessions must not remain indefinitely
      // in the pending queue. The mutation only cancels still-pending bookings.
      await ctx.runMutation(internal.timada.cancelPending, {
        sessionId: session.id,
      });
    }

    return respond({ received: true });
  } catch {
    return new Response("Webhook processing failed; retry", { status: 500 });
  }
});
export const options = httpAction(
  async () => new Response(null, { status: 204, headers: headers() }),
);
