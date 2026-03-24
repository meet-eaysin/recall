import React, { useEffect, useRef, useState } from 'react';

const ACTIVATION_THRESHOLD = 50;
const MIN_SCROLL_UP_THRESHOLD = 10;

export function useAutoScroll(
  dependencies: React.DependencyList,
  externalRef?: React.RefObject<HTMLDivElement | null>,
) {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const containerRef = externalRef || internalRef;
  const previousScrollTop = useRef<number | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = React.useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'auto',
    });
  }, []);

  const handleScroll = React.useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    const distanceFromBottom = Math.abs(
      scrollHeight - scrollTop - clientHeight,
    );

    const isScrollingUp = previousScrollTop.current
      ? scrollTop < previousScrollTop.current
      : false;

    const scrollUpDistance = previousScrollTop.current
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
    previousScrollTop.current =
      window.scrollY || document.documentElement.scrollTop;
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoScroll, scrollToBottom, ...dependencies]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleScroll, handleTouchStart]);

  return {
    containerRef,
    scrollToBottom,
    handleScroll: undefined,
    shouldAutoScroll,
    handleTouchStart: undefined,
  };
}
