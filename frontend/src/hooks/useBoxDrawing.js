import { useEffect, useState } from "react";
import { isTooSmall, makeBox } from "../utils/box";

// While `enabled`, dragging on the globe draws a rectangle instead of rotating it.
// Returns the box being dragged right now (null when not dragging).
// When the drag ends, onBoxComplete(box) is called with the final box.
export function useBoxDrawing({ globeRef, containerRef, enabled, onBoxComplete }) {
  const [draftBox, setDraftBox] = useState(null);

  useEffect(() => {
    const globe = globeRef.current;
    const container = containerRef.current;
    if (!globe || !container) return;

    // Turn off globe rotation while drawing.
    globe.controls().enabled = !enabled;
    if (!enabled) return;

    let startPoint = null;
    let latestBox = null;

    // Screen position -> { lat, lng } on the globe (null if the mouse is off the globe).
    const pointerToCoords = (event) => {
      const rect = container.getBoundingClientRect();
      return globe.toGlobeCoords(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handleDown = (event) => {
      startPoint = pointerToCoords(event);
      if (startPoint) container.setPointerCapture(event.pointerId);
    };

    const handleMove = (event) => {
      if (!startPoint) return;
      const current = pointerToCoords(event);
      if (!current) return;
      latestBox = makeBox(startPoint, current);
      setDraftBox(latestBox);
    };

    const handleUp = () => {
      if (!startPoint) return;
      startPoint = null;
      setDraftBox(null);
      if (latestBox && !isTooSmall(latestBox)) onBoxComplete(latestBox);
      latestBox = null;
    };

    container.addEventListener("pointerdown", handleDown);
    container.addEventListener("pointermove", handleMove);
    container.addEventListener("pointerup", handleUp);

    return () => {
      container.removeEventListener("pointerdown", handleDown);
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerup", handleUp);
      globe.controls().enabled = true;
    };
  }, [enabled, globeRef, containerRef, onBoxComplete]);

  return draftBox;
}
