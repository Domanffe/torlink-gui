import type { SVGProps } from "react";

/** Scale stroke to match a 24×24 baseline on non-24 viewBoxes */
export function scaledStrokeWidth(
  strokeWidth: number,
  viewBoxSize: number,
): number {
  return strokeWidth * (viewBoxSize / 24);
}

export interface AnimatedIconProps extends Omit<
  SVGProps<SVGSVGElement>,
  | "ref"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
  | "values"
> {
  /** Icon size in pixels or CSS string */
  size?: number | string;
  /** Icon color (defaults to currentColor) */
  color?: string;
  /** SVG stroke width */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}
