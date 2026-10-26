import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { convex, isConvexConfigured, convexSiteUrl } from "./lib/convex";
import { useServiceCatalogue } from "./hooks/useServiceCatalogue";
import AdminApp from "./admin/AdminApp";
import "./timada.css";
import { ServicePhotos } from "./components/ServicePhotos";
import { KidsMenu, sourceKidsSlugs } from "./components/KidsMenu";
import { PolicyContent, PMUContent } from "./components/StudioInformation";
import { Training } from "./components/Training";
const address = "1749 Brice Rd, Reynoldsburg, OH 43068";
const whatsapp =
  "https://wa.me/2349062288078?text=Hi%20Lamar%2C%20I%27m%20interested%20in%20working%20with%20you.";
const studioWhatsapp =
  "https://wa.me/16148431452?text=" +
  encodeURIComponent(
    "Hello Timadashouse Beauty, I would like to inquire about your beauty services and appointments.",
  );
function Header() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={scrolled ? "header is-scrolled" : "header"}>
      <Link to="/" className="brand">
        <img src="/brand/timada-logo.png" alt="Timadashouse Beauty" />
      </Link>
      <button
        aria-label="Toggle menu"
        className="menu-toggle"
        onClick={() => setMenu(!menu)}
      >
        ☰
      </button>
      <nav className={menu ? "opened" : ""}>
        <Link onClick={() => setMenu(false)} to="/#catalog">
          Services
        </Link>
        <Link onClick={() => setMenu(false)} to="/#experience">
          Experience
        </Link>
        <Link onClick={() => setMenu(false)} to="/#visit">
          Visit
        </Link>
        <Link onClick={() => setMenu(false)} to="/training">
          Training
        </Link>
        <Link onClick={() => setMenu(false)} to="/policies">
          Policies
        </Link>
        <Link onClick={() => setMenu(false)} to="/admin">
          Studio Login
        </Link>
        <Link
          onClick={() => setMenu(false)}
          className="nav-book"
          to="/appointment"
        >
          Book an appointment
        </Link>
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div>
        <img src="/brand/timada-logo.png" alt="Timadashouse Beauty" />
        <p>Come in looking good. Leave feeling BEAUTIFUL.</p>
      </div>
      <div>
        <small>THE STUDIO</small>
        <p>{address}</p>
        <p>Walk-ins welcome · Appointments available</p>
      </div>
      <div>
        <small>DISCOVER</small>
        <p>
          <Link to="/">Home</Link>
        </p>
        <p>
          <Link to="/appointment">Appointments</Link>
        </p>
        <p>
          <Link to="/policies">Booking policies</Link>
        </p>
        <p>
          <Link to="/training">Training sign-up</Link>
        </p>
        <p>
          <Link to="/pmu-care">PMU care & FAQ</Link>
        </p>
        <p>
          <Link to="/admin">Studio Login</Link>
        </p>
      </div>
      <div className="foot-bottom">
        © {new Date().getFullYear()} Timadashouse Beauty{" "}
        <a href={whatsapp} target="_blank" rel="noreferrer">
          Lamar
        </a>
      </div>
    </footer>
  );
}
function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="floating-actions">
      <a
        className="floating-action whatsapp-float"
        href={studioWhatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Timadashouse Beauty on WhatsApp"
        title="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16 .8A15.1 15.1 0 0 0 3 23.7L.9 31l7.5-2a15.2 15.2 0 1 0 7.6-28.2Zm0 27.5c-2.2 0-4.3-.6-6.1-1.6l-.4-.2-4.4 1.2 1.2-4.3-.3-.4a12.4 12.4 0 1 1 10 5.3Zm6.9-9.3c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.5.3-.9.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.7-.8.4-.6c.1-.2 0-.5 0-.7l-1.1-2.7c-.3-.7-.6-.6-.9-.6H9.8c-.3 0-.8.1-1.2.6-.4.4-1.5 1.5-1.5 3.5s1.6 4 1.8 4.2c.2.3 3.1 4.8 7.5 6.7 1.1.5 1.9.8 2.6.9 1.1.3 2.1.2 2.9.1.9-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z" />
        </svg>
      </a>
      <button
        type="button"
        className={"floating-action top-float" + (showTop ? " is-visible" : "")}
        aria-label="Return to top"
        title="Return to top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          })
        }
        tabIndex={showTop ? 0 : -1}
        aria-hidden={!showTop}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 14 7-7 7 7" />
          <path d="M12 7v12" />
        </svg>
      </button>
    </div>
  );
}
function RouteMetadata() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical)
      canonical.href =
        "https://www.timadashouseglam.com" +
        (pathname === "/" ? "/" : pathname);
    const og = document.querySelector<HTMLMetaElement>(
      'meta[property="og:url"]',
    );
    if (og) og.content = "https://www.timadashouseglam.com" + pathname;
    const titles: Record<string, string> = {
      "/training": "Training sign-up",
      "/appointment": "Book an appointment",
      "/policies": "Booking policies",
      "/pmu-care": "PMU care & FAQ",
      "/admin": "Studio login",
    };
    document.title =
      (titles[pathname] || "Braids, Lashes & PMU in Reynoldsburg, Ohio") +
      " | Timadashouse Beauty";
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content =
      pathname === "/admin" ? "noindex,nofollow" : "index,follow";
    if (hash) {
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <FloatingActions />
    </>
  );
}
const pillars = [
  [
    "Braiding",
    "Precision in every part. Beauty in every braid.",
    "braiding",
    "Knotless Braids",
  ],
  [
    "Lash Artistry",
    "Soft, full, or dramatic — entirely yours.",
    "lash",
    "Lash Extensions",
  ],
  [
    "Ombré Brows",
    "The art of beautifully defined brows.",
    "brows",
    "Ombré Brows",
  ],
  [
    "Lip Blush",
    "Your natural beauty, exquisitely enhanced.",
    "lips",
    "Lip Blush",
  ],
];
const heroSlides = [
  {
    src: "/images/art-of-beauty/braiding.webp",
    alt: "Elegant protective braids by Timadashouse Beauty",
    caption: "01 / THE BEAUTY ATELIER",
    kind: "photo",
  },
  {
    src: "/brand/timada-logo.png",
    alt: "Timadashouse Beauty studio logo",
    caption: "02 / TIMADASHOUSE BEAUTY",
    kind: "logo",
  },
];
function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((n) => (n + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);
  return (
    <div
      className="hero-visual hero-carousel"
      aria-label="Timadashouse Beauty photo and logo carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      {heroSlides.map((slide, i) => (
        <div
          key={slide.src}
          className={
            "hero-slide " +
            (slide.kind === "logo" ? "hero-logo-slide " : "") +
            (active === i ? "is-active" : "")
          }
          aria-hidden={active !== i}
        >
          <img
            className={slide.kind === "logo" ? "hero-slide-logo" : "hero-photo"}
            src={slide.src}
            alt={active === i ? slide.alt : ""}
          />
        </div>
      ))}
      <div className="hero-visual-caption">
        <span>{heroSlides[active].caption}</span>
        <span>CRAFTED WITH INTENTION</span>
      </div>
      <div
        className="hero-carousel-controls"
        role="group"
        aria-label="Choose hero slide"
      >
        {heroSlides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={
              "Show " +
              (slide.kind === "logo" ? "studio logo" : "beauty photograph")
            }
            aria-current={active === i ? "true" : undefined}
            className={active === i ? "is-active" : ""}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
export function Home() {
  const { services, notice } = useServiceCatalogue();
  const cats = [
    ...new Set(
      services
        .filter((s) => !sourceKidsSlugs.has(s.slug))
        .map((s) => s.category),
    ),
  ];
  return (
    <Layout>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow hero-overline">
              REYNOLDSBURG · OHIO <span className="small-line" />
            </span>
            <h1>
              Beauty, <em>beautifully</em>
              <br />
              redefined.
            </h1>
            <p>
              Lashes, braids, ombré brows & lip blush — intentional artistry for
              your most beautiful self.
            </p>
            <div className="hero-actions">
              <Link className="gold-button" to="/appointment">
                Book your experience
              </Link>
              <a href="#catalog" className="text-link">
                Explore our services
              </a>
            </div>
          </div>
          <HeroCarousel />
        </section>
        <section className="ethos" id="experience">
          <span className="eyebrow">THE TIMADASHOUSE ETHOS</span>
          <p>
            Considered details. Expert hands. A beauty experience as individual
            as you are.
          </p>
          <span className="section-rule" />
          Come in looking good. Leave feeling beautiful.
        </section>
        <section className="drinks">
          <span className="eyebrow">TIMADASHOUSE BEAUTY</span>
          <h2>Complimentary Drinks</h2>
          <p>Enjoy a little refreshment while we make you beautiful!</p>
          <p>Water • Juice • Soft Drinks • Tea & Coffee</p>
          <p>Beauty, comfort & confidence</p>
        </section>
        <section className="offer" id="services">
          <div className="offer-decoration" aria-hidden="true">
            BEAUTY / ARTISTRY / YOU
          </div>
          <span className="eyebrow">THE ART OF BEAUTY</span>
          <h2>
            Four disciplines.
            <br />
            <em>One beautiful you.</em>
          </h2>
          <div className="pillar-grid">
            {pillars.map(([title, desc, cls, category], i) => (
              <a
                key={title}
                href={"#" + category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className={"pillar " + cls}
              >
                <span>0{i + 1} / OUR SPECIALTIES</span>
                <div className="pillar-content">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <b>Explore services</b>
                </div>
              </a>
            ))}
          </div>
        </section>
        <section className="catalog" id="catalog">
          <span className="eyebrow">THE SERVICE MENU</span>
          <h2>
            Discover your <em>signature look.</em>
          </h2>
          {notice && (
            <p className="catalog-notice" role="status">
              {notice}
            </p>
          )}
          <nav className="catalog-index" aria-label="Service categories">
            {services.some((s) => sourceKidsSlugs.has(s.slug)) && (
              <a href="#kids-menu">KIDS’ BRAIDING &amp; STYLING MENU</a>
            )}
            {cats.map((c) => (
              <a
                href={"#" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                key={c}
              >
                {c}
              </a>
            ))}
          </nav>
          {cats.map((cat) => (
            <div
              className="category"
              id={cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
              key={cat}
            >
              <div className="category-heading">
                <h3>{cat}</h3>
                <span>Timadashouse Beauty</span>
              </div>
              {services
                .filter(
                  (s) => s.category === cat && !sourceKidsSlugs.has(s.slug),
                )
                .map((s) => (
                  <article className="service" key={s.slug}>
                    <div>
                      <h4>{s.name}</h4>
                      <ServicePhotos service={s} />
                      <p>{s.description}</p>
                      {s.duration && <small>{s.duration}</small>}
                    </div>
                    <div className="service-price">
                      {s.price === null
                        ? "Consultation required"
                        : `From $${s.price}`}
                      {s.outOfStock ? (
                        <span className="unavailable">
                          Currently unavailable
                        </span>
                      ) : (
                        <Link
                          to={
                            "/appointment?service=" + encodeURIComponent(s.slug)
                          }
                        >
                          Book
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          ))}
          <KidsMenu services={services} />
          <p className="price-note">
            Braiding prices may change with length, density, thickness and
            specialty hair. Human hair curls may incur additional fees. Prices
            shown are starting prices.
          </p>
        </section>
        <section className="cta" id="visit">
          <span className="eyebrow">YOUR BEAUTY DESTINATION</span>
          <h2>
            A little luxury.
            <br />
            <em>A lot of you.</em>
          </h2>
          <p>{address}</p>
          <p>Walk-ins welcome · Appointments available</p>
          <Link className="gold-button" to="/appointment">
            Reserve your appointment
          </Link>
        </section>
      </main>
    </Layout>
  );
}
function Appointment() {
  const { services, ready, notice } = useServiceCatalogue();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    serviceSlug: params.get("service") || "",
    date: "",
    time: "",
    notes: "",
    policyAccepted: false,
    requestId: crypto.randomUUID(),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [checking, setChecking] = useState(!!params.get("session_id"));
  const [requestSent, setRequestSent] = useState(false);
  const chosen = services.find((s) => s.slug === form.serviceSlug);
  const needsReview = !!chosen && (chosen.price === null || chosen.price < 50);
  useEffect(() => {
    const session = params.get("session_id");
    if (!session) return;
    let count = 0;
    const check = async () => {
      try {
        const res = await fetch(
          `${convexSiteUrl()}/timada-verify?session_id=${encodeURIComponent(session)}`,
        );
        const result = await res.json();
        if (result.status === "confirmed") {
          setReceipt(result);
          setChecking(false);
          return;
        }
      } catch {}
      if (++count < 15) setTimeout(check, 2000);
      else {
        setError(
          "Payment verification is taking longer than expected. Please contact the studio with your Stripe receipt.",
        );
        setChecking(false);
      }
    };
    check();
  }, [params]);
  const update = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isConvexConfigured || !ready) {
      setError(
        "Online booking is paused until the studio backend and live catalogue are connected.",
      );
      return;
    }
    if (!chosen || chosen.outOfStock) {
      setError("This service is currently unavailable.");
      return;
    }
    setBusy(true);
    try {
      if (needsReview) {
        await convex!.mutation(api.timada.requestBooking, form);
        setRequestSent(true);
        setBusy(false);
        return;
      }
      const res = await fetch(`${convexSiteUrl()}/timada-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok || !body.url)
        throw Error(body.error || "Checkout unavailable");
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start checkout");
      setBusy(false);
    }
  }
  return (
    <Layout>
      <main className="registration">
        <div className="registration-intro">
          <img src="/brand/timada-logo.png" alt="Timadashouse Beauty" />
          <span className="eyebrow">A BEAUTIFUL EXPERIENCE AWAITS</span>
          <h1>
            Book your <em>appointment.</em>
          </h1>
          <p>
            Welcome. Please complete the short form below to reserve your time
            with us.
          </p>
          <p>We look forward to seeing you.</p>
        </div>
        {notice && (
          <p className="catalog-notice" role="status">
            {notice}
          </p>
        )}
        {params.get("cancelled") && (
          <p role="status">
            Checkout was cancelled. Your appointment has not been confirmed.
          </p>
        )}
        {requestSent ? (
          <div className="booking-card" role="status">
            <h2>Booking request received.</h2>
            <p>
              The studio will contact you to confirm the service, final price
              and availability. No payment has been taken and your appointment
              is not confirmed yet.
            </p>
          </div>
        ) : receipt ? (
          <div className="booking-card">
            <h2>Timadashouse Beauty – Deposit Confirmed</h2>
            <p>Hello {receipt.name},</p>
            <p>
              Your $50 deposit has been verified. Please contact the studio to
              confirm availability for your requested time.
            </p>
            <p>
              <strong>Service:</strong> {receipt.service}
              <br />
              <strong>Date:</strong> {receipt.date}
              <br />
              <strong>Time:</strong> {receipt.time}
            </p>
            <p>
              <strong>Location:</strong> {address}
            </p>
            <p>
              Please arrive on time for your scheduled appointment. If you need
              to make any changes, kindly update your booking in advance.
            </p>
            <p>
              Thank you for choosing Timadashouse Beauty. We look forward to
              serving you!
            </p>
            <p>
              Best regards,
              <br />
              Timadashouse Beauty
            </p>
          </div>
        ) : checking ? (
          <div className="booking-card">
            Verifying your payment and booking…
          </div>
        ) : (
          <form className="booking-card" onSubmit={submit}>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@email.com"
                />
              </label>
              <label>
                Phone
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+1 614 555 0123"
                />
              </label>
              <label>
                Beauty service
                <select
                  required
                  value={form.serviceSlug}
                  onChange={(e) => update("serviceSlug", e.target.value)}
                >
                  <option value="">Choose a service</option>
                  {services
                    .filter((s) => !s.outOfStock)
                    .map((s) => (
                      <option value={s.slug} key={s.slug}>
                        {s.name} —{" "}
                        {s.price === null ? "Consultation" : `$${s.price}`}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Appointment date
                <input
                  required
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </label>
              <label>
                Preferred time (Ohio)
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </label>
            </div>
            <label>
              Notes / requests
              <textarea
                value={form.notes}
                maxLength={1000}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Style requests only. Please discuss medical details privately with your artist."
              />
            </label>
            <div className="deposit">
              <strong>
                {needsReview
                  ? "Booking request · studio review"
                  : "Booking deposit · $50.00 USD"}
              </strong>
              <p>
                {needsReview
                  ? "Submit your preferred time for studio review. No online payment is taken for consultation-priced services, services below $50 or add-ons. The studio will confirm your total and any applicable deposit before confirming your appointment."
                  : "Non-refundable $50 USD deposit, applied toward your service total. Remaining balance is paid at the salon. All times are Ohio time (America/New_York). The studio will confirm availability for your preferred time."}
              </p>
            </div>
            <label className="policy-check">
              <input
                type="checkbox"
                required
                checked={form.policyAccepted}
                onChange={(e) => update("policyAccepted", e.target.checked)}
              />
              <span>
                I have read and accept the{" "}
                <Link className="underline" to="/policies" target="_blank">
                  booking and cancellation policies
                </Link>
                , including the non-refundable $50 deposit. For PMU I will
                review the{" "}
                <Link className="underline" to="/pmu-care" target="_blank">
                  pre-care and consent information
                </Link>{" "}
                before treatment.
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              disabled={busy || !chosen || !ready}
              className="gold-button"
              type="submit"
            >
              {busy
                ? "Please wait…"
                : needsReview
                  ? "Submit booking request"
                  : "Continue to secure payment"}
            </button>
          </form>
        )}
      </main>
    </Layout>
  );
}
function Policies() {
  return (
    <Layout>
      <main className="policies-page">
        <PolicyContent />
      </main>
    </Layout>
  );
}
export function App() {
  const routed = (
    <BrowserRouter>
      <RouteMetadata />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/policies" element={<Policies />} />
        <Route
          path="/training"
          element={
            <Layout>
              <Training />
            </Layout>
          }
        />
        <Route
          path="/pmu-care"
          element={
            <Layout>
              <main className="policies-page">
                <PMUContent />
              </main>
            </Layout>
          }
        />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
  return convex ? (
    <ConvexAuthProvider client={convex}>{routed}</ConvexAuthProvider>
  ) : (
    routed
  );
}
