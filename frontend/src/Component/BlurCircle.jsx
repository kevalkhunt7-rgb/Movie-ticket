import React from "react";

/**
 * BlurCircle — a decorative ambient glow orb.
 *
 * Props:
 *  color      — Tailwind bg class, e.g. "bg-amber-500/30"  (default: "bg-amber-800/30")
 *  size       — number (px) or Tailwind w/h class string    (default: 232)
 *  blur       — Tailwind blur class                         (default: "blur-3xl")
 *  top/left/right/bottom — CSS position values              (default: "auto")
 *  className  — extra classes for overrides
 *  animate    — boolean, gentle float animation             (default: false)
 *  style      — inline style overrides
 */
const BlurCircle = ({
  color = "bg-amber-800/30",
  size = 232,
  blur = "blur-3xl",
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
  className = "",
  animate = false,
  style = {},
}) => {
  const sizeStyle =
    typeof size === "number"
      ? { width: size, height: size }
      : {};

  const sizeClass =
    typeof size === "string" ? size : "";

  return (
    <div
      aria-hidden="true"
      className={[
        "absolute -z-10 rounded-full pointer-events-none",
        color,
        blur,
        sizeClass,
        animate ? "animate-float" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        top,
        left,
        right,
        bottom,
        aspectRatio: "1 / 1",
        ...sizeStyle,
        ...style,
      }}
    />
  );
};

export default BlurCircle;


/* ─── Usage examples ──────────────────────────────────────────────────────────

  // Amber glow, top-left
  <BlurCircle color="bg-amber-600/30" top={-60} left={-40} size={280} />

  // Blue glow, bottom-right, animated float
  <BlurCircle color="bg-blue-700/25" bottom={-80} right={-60} size={320} animate />

  // Purple glow, custom blur
  <BlurCircle color="bg-violet-500/20" top="20%" left="50%" blur="blur-2xl" size={180} />

─────────────────────────────────────────────────────────────────────────────── */


/* ─── Add to your global CSS (e.g. index.css / globals.css) ───────────────────

  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(6px, -10px) scale(1.03); }
    66%       { transform: translate(-4px, 6px) scale(0.97); }
  }

  .animate-float {
    animation: float 8s ease-in-out infinite;
  }

─────────────────────────────────────────────────────────────────────────────── */