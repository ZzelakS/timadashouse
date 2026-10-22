import { ServicePhotos, type ServicePhotoFields } from "./ServicePhotos";
import { Link } from "react-router-dom";
export const kidsMenuGroups = [
  {
    title: "BRAIDS & CORNROWS",
    slugs: [
      "kids-simple-cornrows",
      "kids-cornrows-design",
      "kids-box-small-medium",
      "kids-box-large",
      "kids-feed-in",
      "kids-goddess",
    ],
  },
  {
    title: "STYLES & MORE",
    slugs: [
      "kids-crochet",
      "kids-knotless",
      "kids-ponytail",
      "kids-twists",
      "kids-tribal",
    ],
  },
  {
    title: "WASH & PREP",
    slugs: [
      "kids-shampoo",
      "kids-blow-dry-detangle",
      "kids-blow-dry-straighten",
      "kids-deep-conditioning",
    ],
  },
  {
    title: "ADD-ONS & EXTRAS",
    slugs: [
      "kids-beads",
      "kids-synthetic-hair",
      "kids-gel-piece",
      "kids-trim",
      "kids-takedown-small",
      "kids-takedown-large",
    ],
  },
] as const;
export const sourceKidsSlugs = new Set<string>(
  kidsMenuGroups.flatMap((g) => [...g.slugs]),
);
type MenuService = ServicePhotoFields & {
  slug: string;
  name: string;
  price: number | null;
  active?: boolean;
  outOfStock?: boolean;
};
export function KidsMenu({ services }: { services: readonly MenuService[] }) {
  const visible = services.filter(
    (s) => sourceKidsSlugs.has(s.slug) && s.active !== false,
  );
  if (!visible.length) return null;
  return (
    <section className="kids-text-menu" id="kids-menu">
      <div className="kids-menu-intro">
        <p>TIMADAS</p>
        <p>HOUSE HAIR</p>
        <h2>KIDS’ BRAIDING &amp; STYLING MENU</h2>
      </div>
      {kidsMenuGroups.map((group) => {
        const rows = group.slugs.flatMap((slug) =>
          visible.filter((s) => s.slug === slug),
        );
        return rows.length ? (
          <div className="category" key={group.title}>
            <div className="category-heading">
              <h3>{group.title}</h3>
            </div>
            {rows.map((s) => (
              <article className="service" key={s.slug}>
                <div>
                  <h4>{s.name}</h4>
                  <ServicePhotos service={s} />
                </div>
                <div className="service-price">
                  <span>
                    {s.price === null
                      ? "Consultation required"
                      : `$${s.price}${s.slug === "kids-shampoo" || s.slug === "kids-blow-dry-detangle" ? "" : "+"}`}
                  </span>
                  {s.outOfStock ? (
                    <span className="unavailable">Currently unavailable</span>
                  ) : (
                    <Link
                      to={"/appointment?service=" + encodeURIComponent(s.slug)}
                    >
                      Book
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : null;
      })}
      <p>Prices may vary based on hair length, size, and design.</p>
      <Link className="gold-button" to="/appointment">
        BOOK YOUR STYLE TODAY!
      </Link>
    </section>
  );
}
