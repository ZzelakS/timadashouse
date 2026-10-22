import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { timadaServices } from "../../shared/timadaCatalog";
import { convex, isConvexConfigured } from "../lib/convex";
export type StudioService = {
  slug: string;
  name: string;
  category: string;
  price: number | null;
  duration: string;
  description: string;
  image?: string;
  imageFileId?: string;
  images?: { url: string; fileId?: string }[];
  active?: boolean;
  outOfStock?: boolean;
};
type CatalogueState = {
  services: readonly StudioService[];
  ready: boolean;
  notice: string;
};
const unavailable =
  "Live service availability is unavailable. The reference menu is shown; online booking is paused while the studio connection is updated.";
export function useServiceCatalogue(): CatalogueState {
  const [state, setState] = useState<CatalogueState>({
    services: timadaServices,
    ready: false,
    notice: isConvexConfigured
      ? "Checking live service availability…"
      : "Online booking is not connected. The reference service menu is shown.",
  });
  useEffect(() => {
    if (!convex) return;
    let active = true,
      stop: (() => void) | undefined;
    const unavailableState = () => {
      if (active)
        setState((current) => ({
          ...current,
          ready: false,
          notice: unavailable,
        }));
    };
    try {
      const watched = convex.watchQuery(api.timada.catalog, {});
      const update = () => {
        if (!active) return;
        try {
          const result = watched.localQueryResult();
          if (result === undefined) return;
          setState({
            services: result.services,
            ready: result.initialized,
            notice: result.initialized
              ? ""
              : "The service menu is available. Online booking will open after the studio catalogue has been initialized.",
          });
        } catch {
          unavailableState();
        }
      };
      stop = watched.onUpdate(update);
      update();
    } catch {
      unavailableState();
    }
    return () => {
      active = false;
      stop?.();
    };
  }, []);
  return state;
}
