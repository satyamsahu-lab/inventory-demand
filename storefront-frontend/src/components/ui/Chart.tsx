import { useEffect, useRef } from "react";

export function Chart(props: {
  option: any;
  className?: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let chart: any;
    let alive = true;
    const el = ref.current;
    if (!el) return;

    (async () => {
      const echarts = await import("echarts");
      if (!alive) return;
      chart = echarts.init(el);
      chart.setOption(props.option);
    })().catch(() => {});

    const onResize = () => chart?.resize?.();
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      chart?.dispose?.();
    };
  }, [props.option]);

  return (
    <div
      ref={ref}
      className={props.className}
      style={{ height: props.height ?? 320, width: "100%" }}
    />
  );
}
