import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVATION_THRESHOLD = 50;
const MIN_SCROLL_UP_THRESHOLD = 10;

export function useAutoScroll(dependencies: readonly unknown[]) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousScrollTop = useRef<number | null>(null);
  const isAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const rafId = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Don't scroll if we're already essentially at the bottom
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAlreadyAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 2;
    if (isAlreadyAtBottom && isAutoScrollRef.current) return;

    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      rafId.current = null;
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = Math.abs(scrollHeight - scrollTop - clientHeight);

    const isScrollingUp =
      previousScrollTop.current !== null
        ? scrollTop < previousScrollTop.current
        : false;

    const scrollUpDistance =
      previousScrollTop.current !== null
        ? previousScrollTop.current - scrollTop
        : 0;

    const isDeliberateScrollUp =
      isScrollingUp && scrollUpDistance > MIN_SCROLL_UP_THRESHOLD;

    if (isDeliberateScrollUp) {
      isAutoScrollRef.current = false;
    } else {
      isAutoScrollRef.current = distanceFromBottom < ACTIVATION_THRESHOLD;
    }

    // Only update state (and re-render) when button visibility actually changes
    const shouldShowButton = !isAutoScrollRef.current;
    setShowScrollButton((prev) => (prev !== shouldShowButton ? shouldShowButton : prev));

    previousScrollTop.current = scrollTop;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      previousScrollTop.current = el.scrollTop;
    }
  }, []);

  useEffect(() => {
    if (isAutoScrollRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom, ...dependencies]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll]);

  return {
    containerRef,
    scrollToBottom,
    showScrollButton,
  };
}
