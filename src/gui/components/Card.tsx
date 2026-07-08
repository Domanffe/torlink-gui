import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <span className="card-subtitle">{subtitle}</span>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
