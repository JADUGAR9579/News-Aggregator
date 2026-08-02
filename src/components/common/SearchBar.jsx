import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiClock, FiMic, FiMicOff } from "react-icons/fi";
import toast from "react-hot-toast";

/**
 * SearchBar
 * Controlled search input with a "recent searches" dropdown and optional
 * voice search (Web Speech API — Chrome/Edge/Safari; gracefully hides the
 * mic button in browsers without support, e.g. Firefox).
 * The debounce itself lives in the `useSearch` hook — this component
 * is purely presentational/controlled so it can be reused anywhere
 * (Navbar, Search page, Sidebar).
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {() => void} [props.onSubmit]
 * @param {() => void} [props.onClear]
 * @param {string[]} [props.history]
 * @param {(term: string) => void} [props.onRemoveHistoryItem]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.autoFocus]
 * @param {boolean} [props.enableVoice]
 * @param {string} [props.id]
 */
function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  history = [],
  onRemoveHistoryItem,
  placeholder = "Search news, topics, sources…",
  autoFocus = false,
  enableVoice = true,
  id = "site-search",
}) {
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const showHistory = focused && !value && history.length > 0;

  const SpeechRecognitionApi =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const voiceSupported = enableVoice && Boolean(SpeechRecognitionApi);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const handleVoiceSearch = () => {
    if (!voiceSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast.error("Couldn't hear that — try again");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onChange(transcript);
        onSubmit?.(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
    setFocused(false);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search news
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-primary-500 dark:border-gray-700 dark:bg-muted-dark">
        <FiSearch className="shrink-0 text-gray-400" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
          aria-label="Search news"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
          >
            <FiX size={16} />
          </button>
        )}
        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoiceSearch}
            aria-label={listening ? "Stop voice search" : "Search by voice"}
            aria-pressed={listening}
            className={`shrink-0 rounded-full p-1.5 transition-colors ${
              listening
                ? "animate-pulse bg-red-100 text-red-600 dark:bg-red-500/20"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
            }`}
          >
            {listening ? <FiMicOff size={16} /> : <FiMic size={16} />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-card-hover dark:border-gray-700 dark:bg-muted-dark"
          >
            {history.map((term) => (
              <li key={term} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    onChange(term);
                    onSubmit?.();
                  }}
                >
                  <FiClock className="text-gray-400" size={14} />
                  {term}
                </button>
                {onRemoveHistoryItem && (
                  <button
                    type="button"
                    aria-label={`Remove "${term}" from history`}
                    onClick={() => onRemoveHistoryItem(term)}
                    className="rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-white/10"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}

export default memo(SearchBar);
