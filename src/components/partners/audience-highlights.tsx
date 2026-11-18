import { isStale, type AudienceSnapshot, type MetricName, type Platform } from "@/lib/audience/contract";

const highlights: { platform: Platform; name: MetricName; label: string }[] = [
  { platform: "instagram", name: "views", label: "Instagram views" },
  { platform: "instagram", name: "reach", label: "Instagram accounts reached" },
  { platform: "facebook", name: "views", label: "Facebook content views" },
];
const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 2 });

export function AudienceHighlights({ snapshot }: { snapshot: AudienceSnapshot | null }) {
  const cells = highlights.flatMap(({ platform, name, label }) => {
    const channel = snapshot?.platforms.find(entry => entry.platform === platform);
    const metric = channel?.metrics.find(metric => metric.name === name);
    if (!channel || !metric?.period) return [];
    const days = (Date.parse(metric.period.end) - Date.parse(metric.period.start)) / 86_400_000;
    const period = Number.isInteger(days) ? days + "-day reporting period" : metric.period.start.slice(0,10) + " – " + metric.period.end.slice(0,10);
    return [<div key={label}><dt>{label}</dt><dd>{compact.format(metric.value)}</dd><dd>{period}{isStale(channel) ? " · Delayed update" : ""}</dd></div>];
  });
  return cells.length ? <dl className="audience-highlights" aria-label="Recent audience highlights">{cells}</dl> : null;
}
