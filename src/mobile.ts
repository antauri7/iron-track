/** Block interface zoom gestures, preserving single-finger scroll and controls.
 * OS-level accessibility zoom is controlled by iOS and cannot be disabled here.
 */
export function configureTouchViewport() {
  const options = { passive: false, capture: true } as const;
  const prevent = (event: Event) => {
    if (event.cancelable) event.preventDefault();
  };
  const preventPinch = (event: TouchEvent) => {
    if (event.touches.length > 1) prevent(event);
  };
  let lastTap: {
    time: number;
    x: number;
    y: number;
    target: EventTarget | null;
  } | null = null;
  const preventDoubleTap = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const now = Date.now();
    if (
      lastTap &&
      now - lastTap.time < 350 &&
      lastTap.target === event.target &&
      Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 30
    ) {
      prevent(event);
      lastTap = null;
    } else
      lastTap = {
        time: now,
        x: touch.clientX,
        y: touch.clientY,
        target: event.target,
      };
  };
  for (const type of [
    "gesturestart",
    "gesturechange",
    "gestureend",
    "dblclick",
  ])
    document.addEventListener(type, prevent, options);
  document.addEventListener("touchstart", preventPinch, options);
  document.addEventListener("touchmove", preventPinch, options);
  document.addEventListener("touchend", preventDoubleTap, options);
  return () => {
    for (const type of [
      "gesturestart",
      "gesturechange",
      "gestureend",
      "dblclick",
    ])
      document.removeEventListener(type, prevent, true);
    document.removeEventListener("touchstart", preventPinch, true);
    document.removeEventListener("touchmove", preventPinch, true);
    document.removeEventListener("touchend", preventDoubleTap, true);
  };
}
