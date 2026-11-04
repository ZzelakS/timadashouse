import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const mock = vi.hoisted(() => ({ watchQuery: vi.fn() }));
vi.mock("../src/lib/convex", () => ({
  isConvexConfigured: true,
  convex: { watchQuery: mock.watchQuery },
}));
import { useServiceCatalogue } from "../src/hooks/useServiceCatalogue";
import { timadaServices } from "../shared/timadaCatalog";
let root: ReactTestRenderer | undefined;
let changed: () => void, result: unknown, failure: Error | undefined;
let stopped: ReturnType<typeof vi.fn>;
function Harness() {
  const state = useServiceCatalogue();
  return createElement("output", null, JSON.stringify(state));
}
function read() {
  return JSON.parse(root!.root.findByType("output").children.join(""));
}
beforeEach(() => {
  result = undefined;
  failure = undefined;
  stopped = vi.fn();
  mock.watchQuery.mockReturnValue({
    onUpdate: (callback: () => void) => {
      changed = callback;
      return stopped;
    },
    localQueryResult: () => {
      if (failure) throw failure;
      return result;
    },
  });
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  vi.clearAllMocks();
});
test("missing backend function cannot crash the menu and cannot enable payment", () => {
  act(() => {
    root = create(createElement(Harness));
  });
  failure = new Error("Could not find public function for 'timada:catalog'");
  expect(() => act(() => changed())).not.toThrow();
  expect(read().services).toHaveLength(81);
  expect(read().ready).toBe(false);
  expect(read().notice).toContain("online booking is paused");
});
test("live catalogue updates replace reference data and preserve an intentionally empty menu", () => {
  act(() => {
    root = create(createElement(Harness));
  });
  result = {
    initialized: true,
    services: [{ ...timadaServices[0], outOfStock: true }],
  };
  act(() => changed());
  expect(read().ready).toBe(true);
  expect(read().services[0].outOfStock).toBe(true);
  result = { initialized: true, services: [] };
  act(() => changed());
  expect(read().services).toEqual([]);
  expect(read().notice).toBe("");
});
test("unseeded reference menu remains visible with booking paused; failure retains last confirmed visibility", () => {
  act(() => {
    root = create(createElement(Harness));
  });
  result = { initialized: false, services: timadaServices };
  act(() => changed());
  expect(read().services).toHaveLength(81);
  expect(read().ready).toBe(false);
  result = { initialized: true, services: [] };
  act(() => changed());
  failure = new Error("Network lost");
  act(() => changed());
  expect(read().services).toEqual([]);
  expect(read().ready).toBe(false);
});
test("cleans up its live subscription on unmount", () => {
  act(() => {
    root = create(createElement(Harness));
  });
  act(() => root!.unmount());
  root = undefined;
  expect(stopped).toHaveBeenCalledOnce();
});
