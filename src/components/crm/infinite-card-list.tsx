"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Key,
} from "react";
import { cn } from "@/lib/utils";

type InfiniteCardListProps<T> = {
  items: T[];
  initialVisible?: number;
  pageSize?: number;
  className?: string;
  getItemKey: (item: T, index: number) => Key;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  listRole?: "list" | "none";
};

export function InfiniteCardList<T>({
  items,
  initialVisible = 12,
  pageSize = 12,
  className,
  getItemKey,
  renderItem,
  empty = null,
  listRole = "list",
}: InfiniteCardListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(initialVisible, items.length),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((v) => Math.min(v + pageSize, items.length));
  }, [items.length, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= items.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length, loadMore, visibleCount]);

  if (items.length === 0) {
    return <>{empty}</>;
  }

  const slice = items.slice(0, Math.min(visibleCount, items.length));

  return (
    <div className={cn("space-y-3", className)}>
      <ul className="space-y-3" role={listRole === "none" ? undefined : listRole}>
        {slice.map((item, index) => (
          <li key={getItemKey(item, index)} className="list-none">
            {renderItem(item, index)}
          </li>
        ))}
      </ul>
      {visibleCount < items.length ? (
        <div
          ref={sentinelRef}
          className="h-px w-full shrink-0"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
