export interface PieceMap {
  total: number;
  /** 0 pending, 1 active, 2 done, 3 partial/checking */
  states: number[];
}

const CELL_CLASS = ["pending", "active", "done", "partial"] as const;

export function TorrentProgress({
  pct,
  paused,
  pieceMap,
}: {
  pct: number;
  paused?: boolean;
  pieceMap?: PieceMap;
}) {
  const width = Math.min(100, Math.max(0, pct));
  const hasPieces = pieceMap && pieceMap.states.length > 0;

  return (
    <div
      className={`torrent-progress${paused ? " torrent-progress--paused" : ""}`}
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {hasPieces ? (
        <div className="piece-map" aria-hidden>
          {pieceMap.states.map((s, i) => (
            <span
              key={i}
              className={`piece-cell piece-cell--${CELL_CLASS[s] ?? "pending"}`}
            />
          ))}
        </div>
      ) : null}
      <div className={`progress-track${paused ? " progress-track--paused" : ""}`}>
        <div className="progress-thumb" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
