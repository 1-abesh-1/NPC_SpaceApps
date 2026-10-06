import { formatBox } from "../utils/box";
import { LABEL_STYLE, REGION_STYLE } from "../config";

export default function Toolbar({ drawing, box, onToggleDrawing, onClear }) {
  return (
    <header className="toolbar">
      <h1 className="toolbar__title">FireCalendar</h1>
      <button
        className={`btn ${drawing ? "btn--active" : ""}`}
        onClick={onToggleDrawing}
      >
        {drawing ? "Drag on the globe to draw" : "Draw a box"}
      </button>
      <button className="btn" onClick={onClear} disabled={!box}>
        Clear
      </button>
      

      <div className="toolbar__legend">
       <span className="toolbar__legend-item">
  <span
    className="toolbar__dot"
    style={{ background: "green" }}
  />
  data available
</span>
<br />

<span className="toolbar__legend-item">
  <span
    className="toolbar__dot"
    style={{ background: "orange" }}
  />
  data not available
</span>
      </div>
    </header>
  );
}