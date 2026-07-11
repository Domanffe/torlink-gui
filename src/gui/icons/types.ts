import type { SVGProps } from "react";

/** Scale stroke to match a 24×24 baseline on non-24 viewBoxes */
export function scaledStrokeWidth(
  strokeWidth: number,
  viewBoxSize: number,
): number {
  return strokeWidth * (viewBoxSize / 24);
}

export interface IconProps extends Omit<
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
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export type AnimatedIconProps = IconProps;
