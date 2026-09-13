import { StillMark } from "./still-mark";

export function Splash() {
  return (
    <div className="still-vignette flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <StillMark className="size-10" />
        <p className="font-display text-2xl font-medium tracking-tight text-fg">Still</p>
      </div>
    </div>
  );
}
