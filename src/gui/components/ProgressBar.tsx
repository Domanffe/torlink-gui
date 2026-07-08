export function ProgressBar({ pct, paused }: { pct: number; paused?: boolean }) {
  const width = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`progress-track${paused ? " progress-track--paused" : ""}`}
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-thumb" style={{ width: `${width}%` }} />
    </div>
  );
}
