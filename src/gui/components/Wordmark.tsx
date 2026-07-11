import { FlameIcon, UiIcon } from "../icons";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  return (
    <div className={`wordmark wordmark--${size}`} aria-label="torlink">
      <span className="wordmark-bolt" aria-hidden>
        <UiIcon icon={FlameIcon} size={iconSize} />
      </span>
      <span className="wordmark-text">torlink</span>
    </div>
  );
}
