# Project conventions

Inside the Machine is an engineering visualization studio. This repository is its independently deployable public website. Its owner is an experienced full-stack engineer who will maintain the code.

## Implementation

- Optimize for human readability, descriptive names, and explicit, predictable architecture.
- Use strict TypeScript and meaningful interfaces; avoid `any`.
- Keep components focused and reasonably small. Do not create abstractions for one-off elements.
- Use Next.js App Router and Server Components by default. Add client code only for required interaction.
- Keep brand/contact/navigation/social values in `src/config/site.ts` and project metadata in `src/content/projects.ts`.
- Keep styles consistent with `src/app/globals.css`. Put shared colors, spacing, and other repeated values in CSS custom properties.
- Prefer simple CSS transitions over animation dependencies. Respect reduced motion.
- Add dependencies only when they solve a concrete need; avoid state libraries, databases, authentication, CMS, and API infrastructure in Phase 1.
- Comment non-obvious decisions rather than narrating the code.
- Preserve existing behavior and accessibility when extending features.

## Visual and content rules

- Preserve the restrained dark palette, Space Grotesk headings, Inter body copy, generous spacing, and subtle orange/cyan accents.
- Use original production assets. Do not invent technical illustrations, use stock/AI substitutes, or distort/carelessly crop supplied artwork.
- Preserve the hero's responsive `<picture>` strategy. Verify a fresh load requests only the appropriate desktop/mobile art direction.
- Missing portfolio media must produce graceful text rows, never broken images or fake links.
- Do not invent clients, metrics, staff counts, certifications, project details, or social/video URLs.
- Keep semantic headings, visible keyboard focus, accessible mobile navigation, image alt text, and adequate contrast.

## Scope and validation

- This is Phase 1. Future architecture may be supported, but do not implement Phase 2 without a separate request.
- Do not deploy, modify production services, or change Athena unless explicitly requested.
- Before delivery, run `npm run lint`, `npm run typecheck`, and `npm run build`; fix introduced failures.
- Check asset paths and inspect desktop and mobile in a browser when available. Only claim visual verification when the rendered result was actually inspected.
- Update the README when setup, maintenance, or architecture changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
