import React, { useEffect, useRef, useState } from 'react';

const ACTIVATION_THRESHOLD = 50;
const MIN_SCROLL_UP_THRESHOLD = 10;

export function useAutoScroll(dependencies: React.DependencyList) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousScrollTop = useRef<number | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  const handleScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = Math.abs(scrollHeight - scrollTop - clientHeight);

    const isScrollingUp = previousScrollTop.current !== null
      ? scrollTop < previousScrollTop.current
      : false;

    const scrollUpDistance = previousScrollTop.current !== null
      ? previousScrollTop.current - scrollTop
      : 0;

    const isDeliberateScrollUp =
      isScrollingUp && scrollUpDistance > MIN_SCROLL_UP_THRESHOLD;

    if (isDeliberateScrollUp) {
      setShouldAutoScroll(false);
    } else {
      const isScrolledToBottom = distanceFromBottom < ACTIVATION_THRESHOLD;
      setShouldAutoScroll(isScrolledToBottom);
    }

    previousScrollTop.current = scrollTop;
  }, []);

  const handleTouchStart = React.useCallback(() => {
    setShouldAutoScroll(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      previousScrollTop.current = el.scrollTop;
    }
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoScroll, scrollToBottom, ...dependencies]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleScroll, handleTouchStart]);

  return {
    containerRef,
    scrollToBottom,
    shouldAutoScroll,
  };
}
