// components/Flag.tsx
// Uses flag-icons CSS library — no image requests, works on all platforms including Windows
export function Flag({ code, size = 18 }: { code: string; size?: number }) {
  return (
    <span
      className={`fi fi-${code}`}
      style={{
        width: size,
        height: Math.round(size * 0.75),
        borderRadius: 3,
        display: "inline-block",
        flexShrink: 0,
        verticalAlign: "middle",
        overflow: "hidden",
      }}
    />
  );
}