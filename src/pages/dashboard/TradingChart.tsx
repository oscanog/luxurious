import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

interface ChartProps {
  data: any[];
  update?: any;
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export const TradingChart = ({ 
  data, 
  update,
  colors: {
    backgroundColor = 'transparent',
    lineColor = '#2962FF',
    textColor = 'hsl(var(--muted-foreground))',
  } = {} 
}: ChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (seriesRef.current && update) {
      seriesRef.current.update(update);
    }
  }, [update]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'hsl(var(--border) / 0.3)' },
        horzLines: { color: 'hsl(var(--border) / 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: 'hsl(var(--border))',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(152 69% 42%)',
      downColor: 'hsl(0 84% 61%)',
      borderVisible: false,
      wickUpColor: 'hsl(152 69% 42%)',
      wickDownColor: 'hsl(0 84% 61%)',
    });

    candlestickSeries.setData(data);
    
    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, lineColor, textColor]);

  return <div ref={chartContainerRef} className="w-full" />;
};
