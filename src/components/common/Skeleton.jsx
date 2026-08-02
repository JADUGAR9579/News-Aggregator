import { memo } from "react";

/**
 * Skeleton
 * Loading placeholder shown while article data is being fetched.
 *
 * @param {object} props
 * @param {"card"|"list"|"featured"|"text"} [props.variant]
 * @param {number} [props.count] - how many skeleton items to render
 */
function Skeleton({ variant = "card", count = 1 }) {
  const items = Array.from({ length: count });

  if (variant === "featured") {
    return (
      <div className="skeleton h-80 w-full sm:h-96" aria-hidden="true" />
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        {items.map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton h-16 w-24 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className="space-y-2" aria-hidden="true">
        {items.map((_, i) => (
          <div key={i} className="skeleton h-3 w-full" />
        ))}
      </div>
    );
  }

  // default: card
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {items.map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl">
          <div className="skeleton h-44 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(Skeleton);
