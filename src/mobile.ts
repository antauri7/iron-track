/** Keep the workout viewport stable while preserving single-finger scrolling.
 * iOS system accessibility zoom remains controlled by the operating system.
 */
export function configureTouchViewport() {
  const preventGesture = (event: Event) => {
    if (event.cancelable) event.preventDefault();
  };
  const preventPinch = (event: TouchEvent) => {
    if (event.touches.length > 1 && event.cancelable) event.preventDefault();
  };
  document.addEventListener("gesturestart", preventGesture, { passive: false });
  document.addEventListener("gesturechange", preventGesture, {
    passive: false,
  });
  document.addEventListener("touchmove", preventPinch, { passive: false });
  return () => {
    document.removeEventListener("gesturestart", preventGesture);
    document.removeEventListener("gesturechange", preventGesture);
    document.removeEventListener("touchmove", preventPinch);
  };
}
