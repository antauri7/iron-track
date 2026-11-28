import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
export function ScrollToTop() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    scrollToTop();
  }, [location.key]);
  return null;
}
