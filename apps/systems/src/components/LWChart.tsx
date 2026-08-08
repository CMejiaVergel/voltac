"use client";
import { useEffect, useRef } from "react";

interface LWChartDataPoint {
  time: string;
  value: number;
  color?: string;
}

interface LWChartProps {
  data: LWChartDataPoint[];
  type?: "area" | "line" | "histogram" | "bar";
  color?: string;
  height?: number;
  negativeColor?: string;
}

export function LWChart({ data, type = "area", color = "#2563eb", height = 200, negativeColor = "#ef4444" }: LWChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;
    let chart: any;

    import("lightweight-charts").then(({ createChart, ColorType }) => {
      if (!containerRef.current) return;

      chart = createChart(containerRef.current, {
        height,
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#94a3b8",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(128,128,128,0.07)" },
          horzLines: { color: "rgba(128,128,128,0.07)" },
        },
        timeScale: { borderColor: "rgba(128,128,128,0.15)", timeVisible: true, fixLeftEdge: true, fixRightEdge: true },
        rightPriceScale: { borderColor: "rgba(128,128,128,0.15)" },
        crosshair: { mode: 1 },
        handleScroll: { mouseWheel: false, pressedMouseMove: true },
        handleScale: { mouseWheel: false, pinch: true },
      });

      const sortedData = [...data].sort((a, b) => a.time.localeCompare(b.time));

      if (type === "area") {
        const s = chart.addAreaSeries({
          lineColor: color,
          topColor: color + "50",
          bottomColor: color + "00",
          lineWidth: 2,
          priceLineVisible: false,
        });
        s.setData(sortedData);
      } else if (type === "line") {
        const s = chart.addLineSeries({ color, lineWidth: 2, priceLineVisible: false });
        s.setData(sortedData);
      } else if (type === "histogram" || type === "bar") {
        const s = chart.addHistogramSeries({ color, priceLineVisible: false });
        // Color each bar based on sign if needed
        s.setData(sortedData.map(d => ({
          ...d,
          color: d.color || (d.value >= 0 ? color : negativeColor),
        })));
      }

      chart.timeScale().fitContent();
    });

    const obs = new ResizeObserver(() => {
      if (chart && containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);

    return () => {
      obs.disconnect();
      if (chart) chart.remove();
    };
  }, [data, type, color, height, negativeColor]);

  if (!data?.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-muted-foreground text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
