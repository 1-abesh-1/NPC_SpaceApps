// Two sliders that move the globe: vertical = latitude (tilt), horizontal = longitude (spin).
export default function ViewSliders({ view, onChange }) {
  return (
    <>
      <input
        className="slider slider--vertical"
        type="range"
        min={-90}
        max={90}
        value={Math.round(view.lat)}
        onChange={(e) => onChange({ lat: Number(e.target.value) })}
        aria-label="Tilt globe"
      />
      <input
        className="slider slider--horizontal"
        type="range"
        min={-180}
        max={180}
        value={Math.round(view.lng)}
        onChange={(e) => onChange({ lng: Number(e.target.value) })}
        aria-label="Spin globe"
      />
    </>
  );
}
