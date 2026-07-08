export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`wordmark wordmark--${size}`} aria-label="torlink">
      <span className="wordmark-bolt" aria-hidden>
        ⚡
      </span>
      <span className="wordmark-text">torlink</span>
    </div>
  );
}
