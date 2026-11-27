# Inside the Machine

Public website for [insidethemachines.com](https://www.insidethemachines.com): a portfolio for an engineering visualization studio. Built with Next.js App Router, React, strict TypeScript, and Tailwind CSS. The homepage presents original turbocharger artwork, six original animation thumbnails with on-demand YouTube playback, social community links, the studio's perspective, and commercial collaboration opportunities. Separate work, partnerships, and audience-insights pages share the same design system.

No database, authentication, tracking analytics, or contact form is included. Optional audience statistics are read on the server through scoped Meta and YouTube adapters or an approved Athena aggregate endpoint. The portfolio player loads on demand.

## Local development

Use Node.js 24 LTS and npm (the project's `.nvmrc` records the Node major).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a different port: `npm run dev -- --port 3001`.

## Checks and production build

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

`typecheck` generates Next.js route types before checking TypeScript, so it works on a fresh checkout. `build` creates an optimized Node.js application. `start` serves it on all interfaces and respects the `PORT` environment variable. Inter and Space Grotesk are bundled as Latin variable WOFF2 files in `public/fonts`, loaded with `next/font/local`. Neither builds nor browsers need a Google Fonts connection. The files come from Fontsource variable packages, version 5.3.0; their SIL Open Font Licenses are included beside them.

The scripts explicitly use Next.js's supported Webpack builder: Turbopack's CSS worker failed to connect in the initial Windows environment. This keeps the normal development and build commands working here. ESLint 9 is retained because the current React and accessibility plugins declare compatibility through version 9.

## Structure

```text
src/
  app/                  Root layout, metadata, homepage composition, design tokens
  components/
    layout/             Header, mobile navigation, footer
    home/               Homepage sections, video gallery, cards, player dialog
  config/site.ts        Brand, URL, contact, navigation, verified social links
  content/projects.ts   Portfolio metadata
  types/project.ts      Project, thumbnail, and video metadata interfaces
public/
  images/hero/          Original desktop and mobile turbocharger WebP files
  images/thumbnails/    Six original 1080 × 1920 WebP thumbnails
  fonts/                Local variable fonts and their licenses
```

The header and video portfolio remain the only client interaction boundaries. The header handles its disclosure menu; `VideoPortfolio` owns the selected video and composes `VideoProjectCard` and `VideoPlayerDialog`. The surrounding sections and footer remain Server Components. Section anchors receive focus naturally, with sticky-header clearance supplied by CSS. Tailwind is available through PostCSS; shared styling and tokens live in `globals.css`.

## Routes and commercial content

| Route | Purpose |
| --- | --- |
| / | Hero, community, six selected videos, perspective, collaboration, contact |
| /work | Complete available portfolio |
| /partners | Studio/media offer, usage rights, selected work, audience overview |
| /partners/insights | Verified platform data, periods, freshness, unavailable states |

Navigation is centralized in site.ts and works from every route. The header remains free of social icons. Social links appear after the hero and in the footer. Reusable collaboration copy lives in src/content/collaborations.ts. Six current projects use category labels without unnecessary filter controls. Each route has its own canonical and social metadata.

## Audience statistics

See [audience integration](docs/audience-integration.md) for environment variables, the Athena audit, security boundaries, metric meanings, caching, and live checks. Direct Meta mode uses owner-authorized Inside the Machine credentials to read followers, supported account insights, and follower counts by country. The site shows each reported country's share of total followers, with the top five shown first and an expandable list for the rest. The website can use a restricted YouTube Data API key for public subscriber counts, all-time channel views, and public video rankings independently of Athena's OAuth connection. The insights page ranks individual public videos by lifetime views among eligible videos in up to 50 recent posts or uploads per platform. It shows three previews per platform, expandable to five. TikTok is temporarily hidden from the media-kit cards.

The optional Athena adapter accepts only approved aggregate snapshots. It does not expose Athena's private analytics API. Athena remains unchanged; the website deploys through its own independent service.

## Common edits

| Change                                                | File                                          |
| ----------------------------------------------------- | --------------------------------------------- |
| Brand name, site URL, email, navigation, social links | `src/config/site.ts`                          |
| Hero wording and image setup                          | `src/components/home/hero-section.tsx`        |
| Portfolio titles and media                            | `src/content/projects.ts`                     |
| About and contact copy                                | Corresponding files in `src/components/home/` |
| Colors, spacing, typography, responsive layout        | `src/app/globals.css`                         |
| Fonts and SEO metadata                                | `src/app/layout.tsx`                          |
| Browser tab icon for all pages                        | `src/app/favicon.ico`                         |

The favicon uses the studio artwork from `public/logo.png`, resized into 16, 32, and 48 px ICO frames. Next.js adds the favicon link across the site from the root app directory.

The four official Instagram, YouTube, Facebook, and TikTok URLs live in `siteConfig.socialLinks` in `src/config/site.ts`. Each entry has a platform, display label, and URL. Update URLs there, not in components. `SocialLinks` maps each platform to a recognizable Simple Icons mark from `react-icons/si`, rendered on the server. Links have 44px targets, accessible names, orange focus/hover feedback, and open in a new tab. The email remains the primary contact action and is used consistently for every `mailto:` link.

## Hero artwork

The selected cutaway turbocharger has two separately composed original production assets:

- `public/images/hero/turbo-cutaway-desktop.webp` — 2560 × 1440
- `public/images/hero/turbo-cutaway-mobile.webp` — 1200 × 1600

Optimized WebP copies come from the supplied hero-v2 production exports. The image content is unchanged. Desktop uses contain to preserve the mechanism and flows at wide screen ratios. Mobile trims only empty margins from the portrait composition, enlarging the subject below the HTML copy. No separate mobile render is needed. The optional supplementary engine render was not supplied and is not required.

One native picture with getImageProps selects mobile artwork below 768px and desktop from 768px. A single eager, high-priority image avoids duplicate preloads. Mobile sizes account for the 156% display width. A fresh load should request only the appropriate artwork; resizing across the breakpoint can legitimately fetch the other.

Inspect 320, 375, 390, 768, 1024, 1440, and 1920px viewports after changing artwork or layout. Do not claim browser or network verification from static markup checks alone.

## Portfolio content

Add or edit videos in `src/content/projects.ts`. Each project has a stable ID, title, thumbnail metadata, video provider/ID/aspect ratio, a category, and optional `featuredOrder`. The homepage selects the first six explicitly featured projects; /work shows the complete collection. Lower featured order values appear first. Keep supplied YouTube IDs exactly, including case, underscores, and hyphens. Shorts links and privacy-enhanced embed URLs are derived from the video ID rather than stored separately.

For example, the configured turbocharger project is:

```ts
{
  id: "turbocharger",
  title: "How a Turbocharger Works",
  category: "Turbocharging",
  thumbnail: {
    src: "/images/thumbnails/turbocharger.webp",
    alt: "How a Turbocharger Works — original animation thumbnail",
    width: 1080,
    height: 1920,
  },
  video: { provider: "youtube", id: "a4UdckKkf4U", aspectRatio: "9:16" },
  featuredOrder: 1,
}
```

Store new original thumbnails in `public/images/thumbnails/`. Use their actual dimensions. The section checks local files on the server; a missing thumbnail produces a text link to the real YouTube video. There are no empty image placeholders or dead links.

The gallery displays three columns from 1024px, two from 360px, and one below 360px. Thumbnails retain their complete 9:16 proportions and use lazy-loaded Next.js Image candidates. The current gallery/player are designed for Shorts. The video metadata can represent 16:9 for a later extension; no long-form UI, individual project pages, or interactive 3D features are implemented.

## Video dialog

Clicking a thumbnail mounts one `VideoPlayerDialog`. It uses the browser's native `<dialog>` and `showModal()`, making the background inert and providing native modal keyboard behavior. The Close button receives initial focus. Escape, the Close button, and the backdrop dismiss the dialog. Closing removes the iframe, restores body scrolling, and returns focus to the original thumbnail without scrolling it out of place. No dialog or iframe exists before interaction.

The iframe uses `youtube-nocookie.com` with native controls and fullscreen permission. Its referrer policy is `strict-origin-when-cross-origin`, not `no-referrer`. No YouTube SDK, third-party thumbnail, preconnect, or analytics script is loaded by the gallery. Autoplay is requested only after the visitor chooses a video; browser or provider policies may still require pressing YouTube's Play control. A visible **Watch on YouTube** link always opens the original Shorts URL in a new tab, including when embedding is unavailable.

The player is bounded by the viewport height. On short landscape screens, the title, Close button, and external link move beside it so they remain accessible. Native dialog behavior is documented by [W3C](https://www.w3.org/WAI/WCAG22/Techniques/html/H102); iframe constraints and parameters are documented by [YouTube](https://developers.google.com/youtube/player_parameters).

When testing changes, verify zero iframes before a click, one while open, and zero after closing. Check Escape, focus restoration, scroll locking, and the direct-video link on desktop, narrow portrait, and landscape screens.

## Development warning from browser extensions

If React reports extra `<body>` attributes named `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed`, Grammarly modified the document before hydration. Disable that extension for the local preview, or open the page in a browser profile without it. The application does not suppress hydration warnings or hide the Next.js development indicator. A Fast Refresh full-reload notice during edits is separate from this warning.

## Future Athena integration

`Project` is the portfolio content boundary. A future server-side Athena portfolio adapter can supply the same interface instead of the local array. The audience adapter is separate and described above. Keep remote fetching and validation outside presentation components, and keep credentials server-side. No public API routes, authentication, individual project pages, search, or Three.js are added. The website remains independently deployable from Athena.

## Railway deployment

The website runs as an independent Railway service connected to this repository. Node.js 24 is pinned in `package.json`; Railpack detects the build and start scripts. Deployment configuration:

- Production address: `https://www.insidethemachines.com`.
- Railway endpoint for DNS troubleshooting: `https://inside-the-machines-production.up.railway.app`.
- The apex domain `insidethemachines.com` forwards permanently to the `www` address through GoDaddy.
- Railway project/service: `inside-the-machines`, production environment, connected to `tamarme/inside-the-machines` on `main`.
- GitHub pushes to `main` trigger deployment. Railway checks `/` before routing traffic to a new deployment.
- GoDaddy retains DNS and email records; the `www` CNAME and Railway ownership TXT records connect the website. Do not replace mail-related DNS entries when changing website hosting.

The GitHub Railway App must include `tamarme/inside-the-machines` in its selected repositories for automatic deployments to work. Keep access scoped to selected repositories. In GoDaddy, `www` points to `8bxduurp.up.railway.app`; the apex uses permanent (301) forwarding to `https://www.insidethemachines.com`. Keep the Railway verification TXT record at `_railway-verify.www`. If moving to another Railway service, obtain its current DNS values from Railway before editing these records.

1. Create an independent Railway service connected to this repository.
2. Use Node.js 24 and `npm ci` for dependency installation.
3. Set the build command to `npm run build` and start command to `npm start`.
4. Allow Railway to supply `PORT`; the start script binds to `0.0.0.0`.
5. Use `/` for the HTTP health check. Configure the custom domain and DNS only at deployment time.

The standard Next.js server handles image optimization. No Vercel-only services or Athena deployment changes are required. The portfolio runs without application secrets. Optional audience statistics require server-only settings; see docs/audience-integration.md. Configure audience variables only on the independent website service.
