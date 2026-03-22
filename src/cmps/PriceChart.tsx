import { createChart, ColorType, LineSeries, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface DataPoint {
    time: UTCTimestamp;
    value: number;
}

export function PriceChart({ data, onHoverValue }: {
    data: { time: number; value: number }[]; onHoverValue?: (value: number | null) => void;
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMobile = window.innerWidth <= 650
    const chartHeight = isMobile ? 150 : 300
    useEffect(() => {
        if (!containerRef.current || !wrapperRef.current) return;

        const root = containerRef.current;
        const wrapper = wrapperRef.current;

        if (!data?.length) {
            const chart = createChart(root, {
                width: wrapper.clientWidth,
                height: chartHeight,
                handleScroll: false,
                handleScale: false,
                rightPriceScale: {
                    borderVisible: false,
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
                timeScale: {
                    borderVisible: false,
                    visible: false,
                },
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#919496',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    attributionLogo: false,
                },
                grid: {
                    vertLines: { visible: false },
                    horzLines: { visible: true, style: 4 },
                },
                crosshair: {
                    vertLine: { visible: false },
                    horzLine: { visible: false },
                },
                localization: {
                    priceFormatter: (price: number) => `${price.toFixed(1)}%`,
                },
            });

            const series = chart.addSeries(LineSeries, {
                color: 'transparent',
                lineWidth: 2,
                lastValueVisible: false,
                priceLineVisible: false,
            });

            const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
            series.setData([
                { time: (now - 3600) as UTCTimestamp, value: 0 },
                { time: now, value: 100 },
            ]);

            chart.timeScale().fitContent();

            const observer = new ResizeObserver((entries) => {
                chart.applyOptions({ width: entries[0].contentRect.width });
            });
            observer.observe(wrapper);

            return () => {
                chart.remove();
                observer.disconnect();
            };
        }

        const formattedData: DataPoint[] = [...data]
            .map(d => ({
                time: (typeof d.time === 'string'
                    ? Math.floor(new Date(d.time).getTime() / 1000)
                    : d.time) as UTCTimestamp,
                value: d.value * 100
            }))
            .sort((a, b) => a.time - b.time)
            .filter((v, i, self) => i === 0 || v.time > self[i - 1].time);

        if (!formattedData.length) return;

        const timeSpanSeconds = formattedData[formattedData.length - 1].time - formattedData[0].time;
        const timeSpanHours = timeSpanSeconds / 3600;

        const tickFormat = timeSpanHours <= 48
            ? (time: UTCTimestamp) => {
                const d = new Date(time * 1000);
                return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            }
            : (time: UTCTimestamp) => {
                const d = new Date(time * 1000);
                return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
            };

        const chart = createChart(root, {
            width: wrapper.clientWidth,
            height: chartHeight,
            handleScroll: false,
            handleScale: false,
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
                tickMarkFormatter: tickFormat,
            },
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#919496',
                fontSize: 11,
                fontFamily: 'inherit',
                attributionLogo: false,
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: true, style: 4 },
            },
            crosshair: {
                vertLine: { color: '#919496', style: 2, labelVisible: false },
                horzLine: { visible: false },
            },
            localization: {
                priceFormatter: (price: number) => `${price.toFixed(1)}%`,
            },
        });

        const series: ISeriesApi<'Line'> = chart.addSeries(LineSeries, {
            color: 'transparent',
            lineWidth: 2,
            lastValueVisible: false,
            priceLineVisible: false,
        });

        series.setData(formattedData);
        chart.timeScale().fitContent();

        const dpr = window.devicePixelRatio || 1;

        const overlay = document.createElement('canvas');
        overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;';
        overlay.width = wrapper.clientWidth * dpr;
        overlay.height = chartHeight * dpr;
        overlay.style.width = `${wrapper.clientWidth}px`;
        overlay.style.height = `${chartHeight}px`;
        root.appendChild(overlay);
        const ctx = overlay.getContext('2d')!;
        ctx.scale(dpr, dpr);

        const dot = document.createElement('div');
        dot.style.cssText = `
            position:absolute;
            width:8px;height:8px;
            background:#2962FF;
            border-radius:50%;
            pointer-events:none;
            transform:translate(-50%,-50%);
            z-index:10;
            display:none;
            box-shadow:0 0 0 3px rgba(41,98,255,0.25);
        `;
        root.appendChild(dot);

        const styleTag = document.createElement('style');
        styleTag.textContent = `
            @keyframes pulse-ring {
                0% { transform: scale(1); opacity: 0.7; }
                100% { transform: scale(3.5); opacity: 0; }
            }
            .pulse-core {
                position:absolute;
                inset:0;
                background:#2962FF;
                border-radius:50%;
            }
            .pulse-ring {
                position:absolute;
                inset:0;
                background:#2962FF;
                border-radius:50%;
                animation: pulse-ring 1.5s ease-out infinite;
            }
        `;
        document.head.appendChild(styleTag);

        const pulse = document.createElement('div');
        pulse.style.cssText = `
            position:absolute;
            width:8px;height:8px;
            border-radius:50%;
            pointer-events:none;
            transform:translate(-50%,-50%);
            z-index:9;
            display:none;
        `;
        pulse.innerHTML = `<div class="pulse-ring"></div><div class="pulse-core"></div>`;
        root.appendChild(pulse);

        let currentMouseX: number | null = null;
        let animationDone = false;

        function getChartPoints(): { x: number; y: number }[] {
            const points: { x: number; y: number }[] = [];
            for (const point of formattedData) {
                const x = chart.timeScale().timeToCoordinate(point.time);
                const y = series.priceToCoordinate(point.value);
                if (x !== null && y !== null) points.push({ x, y });
            }
            return points;
        }

        function drawChart(drawnUpTo: number, mouseX: number | null, isLastFrame = false) {
            ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);

            const blueEnd = mouseX !== null ? Math.min(mouseX, drawnUpTo) : drawnUpTo;

            ctx.beginPath();
            ctx.strokeStyle = '#2962FF';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            let started = false;
            let lastX: number | null = null;
            let lastY: number | null = null;
            for (const point of formattedData) {
                const x = chart.timeScale().timeToCoordinate(point.time);
                const y = series.priceToCoordinate(point.value);
                if (x === null || y === null) continue;
                if (x > blueEnd) break;
                if (!started) { ctx.moveTo(x, y); started = true; }
                else ctx.lineTo(x, y);
                lastX = x;
                lastY = y;
            }
            ctx.stroke();

            if (mouseX !== null && mouseX < drawnUpTo) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(145, 148, 150, 0.35)';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                started = false;
                for (const point of formattedData) {
                    const x = chart.timeScale().timeToCoordinate(point.time);
                    const y = series.priceToCoordinate(point.value);
                    if (x === null || y === null) continue;
                    if (x < mouseX) continue;
                    if (x > drawnUpTo) break;
                    if (!started) { ctx.moveTo(x, y); started = true; }
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            if (lastX !== null && lastY !== null) {
                pulse.style.left = `${lastX}px`;
                pulse.style.top = `${lastY}px`;
                if (!isLastFrame && mouseX === null) {
                    ctx.beginPath();
                    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#2962FF';
                    ctx.fill();
                }
            }
        }

        function animateFlash() {
            const points = getChartPoints();
            if (!points.length) return;
            const flashDuration = 500;
            const flashStart = performance.now();
            function flash(now: number) {
                const progress = Math.min((now - flashStart) / flashDuration, 1);
                const eased = 1 - Math.pow(1 - progress, 2);
                drawChart(overlay.width / dpr, currentMouseX, true);
                const flashX = eased * (overlay.width / dpr);
                const flashWidth = (overlay.width / dpr) * 0.08;
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    if (i === 0) ctx.moveTo(points[i].x, points[i].y);
                    else ctx.lineTo(points[i].x, points[i].y);
                }
                const grad = ctx.createLinearGradient(flashX - flashWidth, 0, flashX + flashWidth, 0);
                grad.addColorStop(0, 'rgba(41,98,255,0)');
                grad.addColorStop(0.3, 'rgba(120,180,255,1)');
                grad.addColorStop(0.5, 'rgba(255,255,255,1)');
                grad.addColorStop(0.7, 'rgba(120,180,255,1)');
                grad.addColorStop(1, 'rgba(41,98,255,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                ctx.restore();
                if (progress < 1) requestAnimationFrame(flash);
            }
            requestAnimationFrame(flash);
        }

        let animationFrame: number;
        const duration = 1000;
        const startTime = performance.now();
        pulse.style.display = 'none';

        function animate(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            if (progress < 1) {
                drawChart(eased * (overlay.width / dpr), currentMouseX, false);
                animationFrame = requestAnimationFrame(animate);
            } else {
                drawChart(overlay.width / dpr, currentMouseX, true);
                animationDone = true;
                if (currentMouseX === null) pulse.style.display = 'block';
                setTimeout(animateFlash, 500);
            }
        }

        animationFrame = requestAnimationFrame(animate);

        chart.subscribeCrosshairMove((param) => {
            if (!param.point) {
                currentMouseX = null;
                dot.style.display = 'none';
                if (animationDone) pulse.style.display = 'block';
                onHoverValue?.(null)
            } else {
                currentMouseX = param.point.x;
                pulse.style.display = 'none';
                const seriesData = param.seriesData.get(series);
                if (seriesData && 'value' in seriesData) {
                    onHoverValue?.(seriesData.value as number);
                    const y = series.priceToCoordinate(seriesData.value as number);
                    if (y !== null) {
                        dot.style.display = 'block';
                        dot.style.left = `${param.point.x}px`;
                        dot.style.top = `${y}px`;
                    }
                }
            }
            if (animationDone) drawChart(overlay.width / dpr, currentMouseX);
        });

        const observer = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width;
            const newDpr = window.devicePixelRatio || 1;
            overlay.width = w * newDpr;
            overlay.height = chartHeight * newDpr;
            overlay.style.width = `${w}px`;
            overlay.style.height = `${chartHeight}px`;
            ctx.scale(newDpr, newDpr);
            chart.applyOptions({ width: w });
            chart.timeScale().fitContent();
            if (animationDone) drawChart(w, currentMouseX);
        });
        observer.observe(wrapper);

        return () => {
            cancelAnimationFrame(animationFrame);
            chart.remove();
            overlay.remove();
            dot.remove();
            pulse.remove();
            styleTag.remove();
            observer.disconnect();
        };
    }, [data]);

    return (
        <div
            ref={wrapperRef}
            className="chart-wrapper-fixed"
            style={{ position: 'relative', width: '100%', height: chartHeight, overflow: 'hidden' }}
        >
            <div
                ref={containerRef}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
        </div>
    );
}