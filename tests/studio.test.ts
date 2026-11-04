/// <reference types="vite/client" />
import { afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { timadaServices } from "../shared/timadaCatalog";
import { isStudioEmail } from "../shared/adminPolicy";
import { validateAppointment } from "../shared/timadaBooking";
const modules = import.meta.glob("../convex/**/*.ts");
const booking = {
  name: "Test Customer",
  email: "test@example.com",
  phone: "6145550100",
  serviceSlug: "kids-cornrows-design",
  date: "2099-12-20",
  time: "14:00",
  notes: "",
  policyAccepted: true,
  requestId: "12345678-1234-1234-1234-123456789abc",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
async function setup(granted = true, email = "timadashouse@gmail.com") {
  const t = convexTest(schema, modules);
  const id = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email });
    if (granted)
      await ctx.db.insert("adminGrants", { userId, grantedAt: Date.now() });
    return userId;
  });
  return { t, client: t.withIdentity({ subject: `${id}|session` }) };
}
test("catalogue has 60 existing beauty services and all 21 supplied kids menu prices", () => {
  expect(timadaServices).toHaveLength(81);
  expect(
    timadaServices
      .filter((s) => s.slug.startsWith("kids-"))
      .map((s) => s.price),
  ).toEqual([
    45, 65, 120, 95, 80, 75, 100, 130, 55, 60, 75, 25, 30, 50, 15, 10, 12, 40,
    15, 50, 40,
  ]);
  expect(new Set(timadaServices.map((s) => s.slug)).size).toBe(81);
});
test("idempotent seed adds only missing services and preserves edits and unavailable state", async () => {
  const { t, client } = await setup();
  expect((await t.mutation(internal.seedTimada.run, {})).added).toBe(81);
  const row = (await client.query(api.timada.allServices, {})).find(
    (s) => s.slug === "kids-cornrows-design",
  )!;
  await client.mutation(api.timada.saveService, {
    slug: row.slug,
    name: "Edited",
    category: row.category,
    price: 80,
    duration: row.duration,
    description: row.description,
    active: false,
    outOfStock: true,
    creating: false,
  });
  expect(await t.mutation(internal.seedTimada.run, {})).toEqual({
    total: 81,
    added: 0,
    skipped: 81,
  });
  const saved = (await client.query(api.timada.allServices, {})).find(
    (s) => s.slug === row.slug,
  )!;
  expect(saved.name).toBe("Edited");
  expect(saved.outOfStock).toBe(true);
  expect(saved.price).toBe(80);
  expect(
    (await t.query(api.timada.listServices, {})).some(
      (s) => s.slug === row.slug,
    ),
  ).toBe(false);
});
test("email alone, anonymous callers, and nonstudio grants cannot access studio data or write", async () => {
  const { t, client } = await setup(false);
  await expect(t.query(api.timada.listBookings, {})).rejects.toThrow();
  await expect(client.query(api.timada.listBookings, {})).rejects.toThrow();
  await expect(client.query(api.training.list, {})).rejects.toThrow();
  await expect(client.query(api.products.listAll, {})).rejects.toThrow();
  await expect(
    client.mutation(api.timada.seed, { services: [] }),
  ).rejects.toThrow();
  const outsider = await setup(true, "outsider@example.com");
  await expect(
    outsider.client.query(api.timada.allServices, {}),
  ).rejects.toThrow();
  expect((await client.query(api.products.viewer, {}))?.isAdmin).toBe(false);
});
test("only the two approved email addresses are accepted", () => {
  expect(isStudioEmail(" Timadashouse@Yahoo.com ")).toBe(true);
  expect(isStudioEmail("timadashouse@gmail.com")).toBe(true);
  expect(isStudioEmail("other@gmail.com")).toBe(false);
});

test("booking validates real calendar dates, times, details and affirmative policy acceptance", () => {
  expect(() =>
    validateAppointment({ ...booking, date: "2099-02-31" }),
  ).toThrow();
  expect(() =>
    validateAppointment({ ...booking, date: "2099-12-20x" }),
  ).toThrow();
  expect(() => validateAppointment({ ...booking, time: "25:00" })).toThrow();
  expect(() =>
    validateAppointment({ ...booking, policyAccepted: false }),
  ).toThrow();
  expect(() => validateAppointment({ ...booking, phone: "" })).toThrow();
  expect(() =>
    validateAppointment({ ...booking, date: "2000-01-01" }),
  ).toThrow();
  expect(validateAppointment(booking).policyAccepted).toBe(true);
});
test("booking charges server-fixed deposit, deduplicates requests and rejects low price/hidden/unavailable services", async () => {
  const { t, client } = await setup();
  await t.mutation(internal.seedTimada.run, {});
  const first = await t.mutation(internal.timada.createPending, booking),
    second = await t.mutation(internal.timada.createPending, booking);
  expect(second.id).toBe(first.id);
  expect((await t.run((ctx) => ctx.db.get(first.id)))?.amountCents).toBe(5000);
  await expect(
    t.mutation(internal.timada.createPending, { ...booking, name: "Changed" }),
  ).rejects.toThrow();
  await expect(
    t.mutation(internal.timada.createPending, {
      ...booking,
      requestId: crypto.randomUUID(),
      serviceSlug: "kids-simple-cornrows",
    }),
  ).rejects.toThrow();
  const row = (await client.query(api.timada.allServices, {})).find(
    (s) => s.slug === booking.serviceSlug,
  )!;
  await client.mutation(api.timada.saveService, {
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    duration: row.duration,
    description: row.description,
    active: true,
    outOfStock: true,
    creating: false,
  });
  await expect(
    t.mutation(internal.timada.createPending, {
      ...booking,
      requestId: crypto.randomUUID(),
    }),
  ).rejects.toThrow();
  expect(
    (await t.query(api.timada.listServices, {})).find(
      (s) => s.slug === row.slug,
    )?.outOfStock,
  ).toBe(true);
});
test("Stripe checkout ignores client amount and uses a stable idempotency key; redirect alone never confirms", async () => {
  const { t } = await setup();
  await t.mutation(internal.seedTimada.run, {});
  vi.stubEnv("SITE_URL", "https://www.timadashouseglam.com");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
  const stripe = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "cs_test_abcdefghijk",
        url: "https://checkout.stripe.com/c/pay/test",
      }),
      { status: 200 },
    ),
  );
  vi.stubGlobal("fetch", stripe);
  const response = await t.fetch("/timada-checkout", {
    method: "POST",
    headers: { origin: "https://www.timadashouseglam.com" },
    body: JSON.stringify({ ...booking, amount: 1 }),
  });
  expect(response.status).toBe(200);
  const params = new URLSearchParams(stripe.mock.calls[0][1].body);
  expect(params.get("line_items[0][price_data][unit_amount]")).toBe("5000");
  expect(stripe.mock.calls[0][1].headers["Idempotency-Key"]).toMatch(
    /^timada-/,
  );
  const verify = await t.fetch("/timada-verify?session_id=cs_test_abcdefghijk");
  expect((await verify.json()).status).toBe("pending");
  const wrongOrigin = await t.fetch("/timada-checkout", {
    method: "POST",
    headers: { origin: "https://evil.example" },
    body: JSON.stringify(booking),
  });
  expect(wrongOrigin.status).toBe(403);
});
async function signed(
  t: ReturnType<typeof convexTest>,
  event: unknown,
  secret = "whsec_test_secret",
  timestamp = Math.floor(Date.now() / 1000),
) {
  const raw = JSON.stringify(event),
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  const signature = Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${timestamp}.${raw}`),
      ),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  return t.fetch("/timada-stripe-webhook", {
    method: "POST",
    headers: {
      "stripe-signature": `t=${timestamp},v1=invalid,v1=${signature}`,
    },
    body: raw,
  });
}
test("webhook requires signed, current, matching $50 USD payment and handles duplicates and attachment race", async () => {
  const { t, client } = await setup();
  await t.mutation(internal.seedTimada.run, {});
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret");
  const b = await t.mutation(internal.timada.createPending, booking);
  const event = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_signedabcdefgh",
        mode: "payment",
        payment_status: "paid",
        amount_total: 5000,
        currency: "usd",
        metadata: { bookingId: b.id },
        payment_intent: "pi_test",
      },
    },
  };
  expect((await signed(t, event)).status).toBe(503);
  await t.mutation(internal.timada.attachSession, {
    id: b.id,
    sessionId: event.data.object.id,
  });
  expect((await signed(t, event, "wrong")).status).toBe(400);
  expect((await signed(t, event, "whsec_test_secret", 1)).status).toBe(400);
  expect(
    (
      await signed(t, {
        ...event,
        data: { object: { ...event.data.object, amount_total: 1 } },
      })
    ).status,
  ).toBe(400);
  expect((await signed(t, event)).status).toBe(200);
  expect((await signed(t, event)).status).toBe(200);
  const rows = await client.query(api.timada.listBookings, {});
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("confirmed");
  expect(rows[0].policyAcceptedAt).toBeGreaterThan(0);
  await client.mutation(api.timada.updateBooking, {
    id: b.id,
    date: booking.date,
    time: booking.time,
    status: "cancelled",
    studioNotes: "Agreed with customer",
  });
  await signed(t, event);
  expect((await client.query(api.timada.listBookings, {}))[0].status).toBe(
    "cancelled",
  );
});
test("training registration is separate from appointments, deduplicates and remains admin-only", async () => {
  const { t, client } = await setup();
  const registration = {
    name: "Student",
    email: "student@example.com",
    phone: "6145550100",
    course: "Braiding",
    experience: "Beginner",
    message: "Interested in a class",
    consent: true,
    website: "",
  };
  await expect(
    t.mutation(api.training.register, { ...registration, consent: false }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.training.register, { ...registration, website: "spam" }),
  ).rejects.toThrow();
  expect(await t.mutation(api.training.register, registration)).toEqual({
    received: true,
  });
  await expect(
    t.mutation(api.training.register, registration),
  ).rejects.toThrow();
  const rows = await client.query(api.training.list, {});
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("new");
  await client.mutation(api.training.update, {
    id: rows[0]._id,
    status: "contacted",
  });
  expect((await client.query(api.training.list, {}))[0].status).toBe(
    "contacted",
  );
  expect(await client.query(api.timada.listBookings, {})).toEqual([]);
});
test("anonymous ImageKit signing route is disabled and authenticated action requires studio grant", async () => {
  const { t, client } = await setup(false);
  expect((await t.fetch("/imagekit-auth")).status).toBe(403);
  await expect(client.action(api.imagekit.uploadAuth, {})).rejects.toThrow();
});

test("public password signup cannot claim an allowlisted email through public signup", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.action(api.auth.signIn, {
      provider: "password",
      params: {
        email: "timadashouse@gmail.com",
        password: "Test-password-only-123!",
        flow: "signUp",
        ownerProvisioned: true,
      },
    }),
  ).rejects.toThrow();
  expect(await t.run((ctx) => ctx.db.query("adminGrants").collect())).toEqual(
    [],
  );
});

test("every menu service has an online booking path; low-price and consultation requests never create a charge", async () => {
  const { t, client } = await setup();
  await t.mutation(internal.seedTimada.run, {});
  expect(
    await t.mutation(api.timada.requestBooking, {
      ...booking,
      serviceSlug: "kids-simple-cornrows",
    }),
  ).toEqual({ received: true });
  await t.mutation(api.timada.requestBooking, {
    ...booking,
    requestId: crypto.randomUUID(),
    serviceSlug: "jumbo-knotless",
  });
  const rows = await client.query(api.timada.listBookings, {});
  expect(rows).toHaveLength(2);
  expect(
    rows.every(
      (r) =>
        r.status === "requested" && r.amountCents === 0 && !r.stripeSessionId,
    ),
  ).toBe(true);
  await expect(
    t.mutation(api.timada.requestBooking, {
      ...booking,
      requestId: crypto.randomUUID(),
    }),
  ).rejects.toThrow();
  await expect(
    client.mutation(api.timada.updateBooking, {
      id: rows[0]._id,
      date: booking.date,
      time: booking.time,
      status: "confirmed",
      studioNotes: "",
    }),
  ).rejects.toThrow();
});

test("PMU and policy pages render selectable source wording without supplied-image embeds or image links", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { MemoryRouter } = await import("react-router-dom");
  const { PMUContent, PolicyContent } =
    await import("../src/components/StudioInformation");
  for (const component of [PMUContent, PolicyContent]) {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(component)),
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("/references/");
    expect(html).not.toMatch(/href="[^"]*\.(jpg|jpeg|png)/);
  }
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, null, createElement(PMUContent)),
  );
  expect(html).toContain(
    "Keep the brow area completely dry for the first 10 days.",
  );
  expect(html).toContain("CLIENT CANDIDACY + CONTRAINDICATIONS");
  expect(html).toContain("HOW LONG DOES THIS LAST?");
});

test("the extracted kids menu preserves every source name, all four headings and exact price markers", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { MemoryRouter } = await import("react-router-dom");
  const { KidsMenu, kidsMenuGroups } =
    await import("../src/components/KidsMenu");
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(KidsMenu, { services: timadaServices }),
    ),
  );
  for (const group of kidsMenuGroups)
    expect(html).toContain(group.title.replace(/&/g, "&amp;"));
  for (const s of timadaServices.filter((s) => s.slug.startsWith("kids-"))) {
    expect(html).toContain(s.name.replace(/&/g, "&amp;").replace(/’/g, "’"));
  }
  expect(html.match(/>Book<\/a>/g) || []).toHaveLength(21);
  expect(html).toContain("$25</span>");
  expect(html).toContain("$30</span>");
  expect(html).toContain("$45+</span>");
  expect(html).toContain("$130+</span>");
  expect(html).toContain("BOOK YOUR STYLE TODAY!");
  expect(html).toContain(
    "Prices may vary based on hair length, size, and design.",
  );
  expect(html).not.toContain("<img");
});

test("unseeded studio shows the full menu; initialized hidden/deleted catalogues remain authoritative", async () => {
  const { t, client } = await setup();
  const initial = await t.query(api.timada.catalog, {});
  expect(initial.initialized).toBe(false);
  expect(initial.services).toHaveLength(81);
  await t.mutation(internal.seedTimada.run, {});
  for (const s of await client.query(api.timada.allServices, {}))
    await t.run((ctx) => ctx.db.patch(s._id, { active: false }));
  const hidden = await t.query(api.timada.catalog, {});
  expect(hidden.initialized).toBe(true);
  expect(hidden.services).toEqual([]);
  await t.run(async (ctx) => {
    for (const s of await ctx.db.query("timadaServices").collect())
      await ctx.db.delete(s._id);
  });
  expect((await t.query(api.timada.catalog, {})).services).toEqual([]);
});

test("homepage renders all 60 original services before the 21 kids services with category navigation and Book links", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { MemoryRouter } = await import("react-router-dom");
  const { Home } = await import("../src/App");
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, null, createElement(Home)),
  );
  expect(html).toContain('aria-label="Service categories"');
  expect(html.match(/href="\/appointment\?service=/g) || []).toHaveLength(81);
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
  for (const service of timadaServices)
    expect(html).toContain(escape(service.name));
  expect(html.indexOf('id="knotless-braids"')).toBeLessThan(
    html.indexOf('id="kids-menu"'),
  );
  expect(html).toContain('href="#kids-menu"');
  expect(html).toContain("Complimentary Drinks");
  expect(html).toContain(
    "Enjoy a little refreshment while we make you beautiful!",
  );
});

test('deployment owner can create an approved password account with a server-owned admin grant',async()=>{
 const t=convexTest(schema,modules)
 const created=await t.action(internal.adminAccounts.provision,{email:'Timadashouse@Gmail.com',password:'Private-test-password-123!'})
 expect(created.email).toBe('timadashouse@gmail.com')
 const account=await t.run(ctx=>ctx.db.query('authAccounts').withIndex('providerAndAccountId',q=>q.eq('provider','password').eq('providerAccountId',created.email)).unique())
 expect(account?.secret).toBeTruthy();expect(account?.secret).not.toBe('Private-test-password-123!')
 const client=t.withIdentity({subject:`${created.userId}|session`})
 expect((await client.query(api.products.viewer,{}))?.isAdmin).toBe(true)
 await expect(t.action(internal.adminAccounts.provision,{email:'outsider@example.com',password:'Private-test-password-123!'})).rejects.toThrow()
 await expect(t.action(internal.adminAccounts.provision,{email:'timadashouse@yahoo.com',password:'short'})).rejects.toThrow()
 await expect(t.action(api.auth.signIn,{provider:'password',params:{email:created.email,password:'wrong-password-123',flow:'signIn'}})).rejects.toThrow()
})

test('service main and gallery images persist, reach the public catalogue and survive seeds and older edits',async()=>{
 const {t,client}=await setup();await t.mutation(internal.seedTimada.run,{})
 const service=timadaServices.find(s=>s.slug==='kids-cornrows-design')!
 const write={...service,active:true,outOfStock:false,creating:false}
 const photos={image:'https://ik.imagekit.io/studio/service.jpg',imageFileId:'main-file',images:[{url:'https://ik.imagekit.io/studio/detail.jpg',fileId:'detail-file'}]}
 await client.mutation(api.timada.saveService,{...write,...photos})
 let live=(await t.query(api.timada.catalog,{})).services.find(s=>s.slug===service.slug)!
 expect(live).toMatchObject(photos)
 await t.mutation(internal.seedTimada.run,{})
 await client.mutation(api.timada.saveService,{...write,name:'Updated service'})
 const saved=(await client.query(api.timada.allServices,{})).find(s=>s.slug===service.slug)!
 expect(saved).toMatchObject(photos)
 await client.mutation(api.timada.saveService,{...write,image:'',images:[]})
 live=(await t.query(api.timada.catalog,{})).services.find(s=>s.slug===service.slug)!
 expect(live.image).toBe('');expect(live.images).toEqual([]);expect(live.imageFileId).toBeUndefined()
})
test('service images reject unsafe URLs, oversized galleries and unauthorized writes',async()=>{
 const {t,client}=await setup();await t.mutation(internal.seedTimada.run,{})
 const service=timadaServices[0],write={...service,active:true,outOfStock:false,creating:false}
 await expect(client.mutation(api.timada.saveService,{...write,image:'javascript:alert(1)'})).rejects.toThrow()
 await expect(client.mutation(api.timada.saveService,{...write,images:Array.from({length:9},()=>({url:'https://example.com/photo.jpg'}))})).rejects.toThrow()
 await expect(t.mutation(api.timada.saveService,{...write,image:'https://example.com/photo.jpg'})).rejects.toThrow()
})
test('public service photos render main and gallery thumbnails for beauty and kids services without adding source reference images',async()=>{
 const {createElement}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server'),{MemoryRouter}=await import('react-router-dom')
 const {ServicePhotos}=await import('../src/components/ServicePhotos'),{KidsMenu}=await import('../src/components/KidsMenu')
 const service={...timadaServices.find(s=>s.slug==='kids-cornrows-design')!,image:'https://example.com/main.jpg',images:[{url:'https://example.com/gallery.jpg'}]}
 const html=renderToStaticMarkup(createElement(ServicePhotos,{service}))
 expect((html.match(/<img /g)||[])).toHaveLength(2);expect(html).toContain('View Cornrows with Design photo 1')
 const kids=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(KidsMenu,{services:[service]})))
 expect(kids).toContain('https://example.com/main.jpg');expect(kids).toContain('https://example.com/gallery.jpg');expect(kids).not.toContain('/references/')
})
