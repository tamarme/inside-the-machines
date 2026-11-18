import { projects } from "@/content/projects";
import { metricLabels, type PlatformSnapshot, type TopContent } from "@/lib/audience/contract";
import { VideoThumbnail } from "./video-thumbnail";

const number = new Intl.NumberFormat("en-GB");
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

function VideoRow({ item, platform }: { item: TopContent; platform: PlatformSnapshot["platform"] }) {
  const project = projects.find(project => project.id === item.projectId ||
    platform === "youtube" && item.id === project.video.id);
  const href = item.platformUrl ?? (platform === "youtube" && project ? "https://www.youtube.com/shorts/" + project.video.id : undefined);
  const title = project?.title ?? item.title;
  if (!title) return null;
  const metric = item.metric;
  const period = metric.period ? date.format(new Date(metric.period.start)) + " – " + date.format(new Date(metric.period.end)) + " UTC" : "All time";
  const label = metric.sourceMetric === "post_media_view" ? "content views" : metricLabels[metric.name].toLowerCase();
  const body = <>
    <VideoThumbnail local={project?.thumbnail?.src} remote={item.thumbnailUrl}/>
    <span className="rank-copy"><strong>{title}</strong><span>{number.format(metric.value)} {label} · {period}</span></span>
  </>;
  return <li>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{body}<span className="rank-arrow" aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <div className="rank-row">{body}</div>}</li>;
}

export function RankedVideos({ snapshot }: { snapshot: PlatformSnapshot }) {
  const items = snapshot.topContent.filter(item => item.title || projects.some(p => p.id === item.projectId));
  if (!items.length) return <p className="rank-empty">Individual video statistics are unavailable.</p>;
  const rows = items.map(item => <VideoRow key={item.id ?? item.projectId} item={item} platform={snapshot.platform}/>);
  return <section className="ranked-videos">
    <h4>Top-performing videos</h4>
    {snapshot.rankingScope && <p>By lifetime {snapshot.platform === "facebook" ? "content views" : "views"} among eligible videos in the latest 50 {snapshot.platform === "youtube" ? "uploads" : "posts"}.</p>}
    <ol>{rows.slice(0, 3)}</ol>
    {rows.length > 3 && <details><summary>More videos ({rows.length - 3})</summary><ol start={4}>{rows.slice(3)}</ol></details>}
  </section>;
}
