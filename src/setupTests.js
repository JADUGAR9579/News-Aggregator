import "@testing-library/jest-dom";

// Mock matchMedia for components/hooks that check prefers-color-scheme
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom doesn't implement IntersectionObserver at all. NewsGrid uses it for
// the infinite-scroll sentinel, so any test rendering NewsGrid (directly or
// via a page) needs this stub to exist -- it never fires callbacks (no test
// here needs to simulate an actual scroll intersection), it just needs to
// not throw when constructed/observed/disconnected.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = IntersectionObserverStub;
