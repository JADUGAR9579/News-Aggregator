import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiWifiOff } from "react-icons/fi";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import Loader from "./components/common/Loader.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { KEYBOARD_SHORTCUTS } from "./utils/constants.js";
import { isOnline } from "./utils/helpers.js";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * App
 * Root layout shell: persistent Navbar + Footer, routed page content in between.
 * Wrapped in Suspense to support route-level code splitting (React.lazy pages).
 *
 * Also owns the global keyboard-shortcut listener:
 *  - "/"   focuses search (dispatches a DOM event Navbar listens for, since
 *          the visible search input differs between desktop and mobile)
 *  - "t"   toggles light/dark theme
 *  - "g h" navigates home
 *  - "g b" navigates to bookmarks
 * Shortcuts are ignored while the user is typing in a form field.
 */
function App() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const pendingGRef = useRef(false);
  const gTimerRef = useRef(null);
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isEditing =
        EDITABLE_TAGS.has(target?.tagName) || target?.isContentEditable;
      if (isEditing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (pendingGRef.current) {
        pendingGRef.current = false;
        clearTimeout(gTimerRef.current);
        if (event.key === "h") {
          event.preventDefault();
          navigate("/");
        } else if (event.key === "b") {
          event.preventDefault();
          navigate("/bookmarks");
        }
        return;
      }

      if (event.key === "g") {
        pendingGRef.current = true;
        gTimerRef.current = setTimeout(() => {
          pendingGRef.current = false;
        }, 800);
        return;
      }

      if (event.key === KEYBOARD_SHORTCUTS.FOCUS_SEARCH) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("shortcut:focus-search"));
        return;
      }

      if (event.key === KEYBOARD_SHORTCUTS.TOGGLE_THEME) {
        toggleTheme();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimerRef.current);
    };
  }, [navigate, toggleTheme]);

  return (
    <div className="flex min-h-screen flex-col bg-muted-light dark:bg-surface-dark">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      {!online && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
        >
          <FiWifiOff aria-hidden="true" />
          You&rsquo;re offline. Showing previously loaded content where available.
        </div>
      )}
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Suspense fallback={<Loader fullScreen label="Loading page..." />}>
          <AppRoutes />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
