# Milestone 1 — local demo verification

Verified on 2026-11-17, Windows, Node 24.21.0. The implementation checkpoint is complete for the browser demo. Android and iOS have not been run, so this is not a claim of tested native support.

## Implemented

The welcome screen leads directly into a local marketplace with five navigation destinations. Thirty fictional listings have bilingual descriptions, BDT prices, category/condition/neighborhood filters, debounced search, stable pagination, photo details, seller profiles, saves, and fixture deep links.

The selling journey validates four steps, preserves new/edit drafts, restores them after reload, and supports publishing, editing, marking sold, and removal. Browser photos are resized, re-encoded without original metadata, and persisted as IndexedDB blobs. Native photo picking is deferred; bundled photos keep the core demo journey usable without it.

Chats have sample history, deterministic labeled replies, unread counts, paginated history, pending/sent/failed delivery states, and retry IDs. Reset clears demo state and photo blobs. Notification events are explicitly simulated. Theme and English/Bangla preferences persist independently.

## Executed checks

| Check | Actual result |
| --- | --- |
| Strict TypeScript | Passed, `npm run typecheck` |
| ESLint | Passed, `npm run lint` |
| Unit/integration tests | 11 passed, `npm test` |
| Production Expo web export | Passed, `npm run export:web` |
| Browser tests | 8 passed across desktop 1440×1000 and mobile web 390×844 |
| Visual inspection | Welcome, desktop feed, mobile feed, light/dark screenshots inspected; mobile overflow corrected |
| Expo dependency check | Reported up to date using the local SDK manifest; CLI warned that offline validation is less reliable |
| Hosted CI | Configuration written; not run on GitHub |
| Android/iOS simulator or device | Not run |
| Public Vercel deployment | Not performed |
| Supabase/RLS/realtime tests | Not applicable yet; no live adapter or database exists |

Browser verification used Playwright 1.59.1 and the already-installed Chromium executable from local revision 1228. The configurable executable override is specific to this environment; normal CI installs Playwright's matching Chromium. No Safari, Firefox, mobile operating-system browser, or screen-reader support is claimed from these results.

The browser tests exercised:

- Welcome → category filter → save → Saved → details → simulated reply.
- Draft restoration, publishing, editing, marking sold, deleting, deep-link reload, and Reset demo.
- A failed optimistic save and a failed message followed by a retry without duplication.
- Persisted dark mode and Bangla with reduced-motion preference and no document-wide horizontal overflow.
- Actual browser file selection, image compression/blob persistence, and local saves while the browser context is offline.

Unit tests additionally cover lost-acknowledgement retries, cross-conversation ID reuse rejection, storage failures, pagination, notification suppression, and a reset during a pending send. Local ownership checks are not substitutes for future database RLS tests.

## Measured export size

The final web JavaScript bundle is 1,923,015 bytes uncompressed and 465,586 bytes with local gzip compression. The six bundled JPEGs total 853,941 bytes. These are artifact measurements, not a production network or device-performance benchmark. The later performance milestone should measure slow-network startup and native scrolling on real devices.

## Manual review steps

1. Run `npm run export:web` and `npm run preview`, then open http://127.0.0.1:4173.
2. Choose Explore demo. Search `chair` or `বেতের`, combine neighborhood/condition/price filters, and change sorting. Clear filters and load another page.
3. Save an item. Open Saved and its detail screen. Share a fixture link and open it in a fresh browser context.
4. Message its seller. Observe Pending followed by Sent locally and a Simulated reply.
5. In Profile, arm Fail next save or Fail next message, then navigate within the app to try that action. Failure controls are session-local and clear on a full page reload.
6. Fill the Sell form. On the photo step, use a demo photo or upload a JPEG, PNG, or WebP under 10 MB. Wait for the draft-saved indicator, reload, and restore.
7. Publish, edit, mark sold, and delete your listing. Confirm that another seller's listing offers no ownership controls.
8. Save another seller's item, then use Profile → Simulate a saved item selling. Open Notifications and observe its Simulated label and Sold status.
9. Change theme and language, reload, then Reset demo. Verify listings/chats/saves reset while preferences remain.

## Deliberate limits at this checkpoint

No backend credentials are needed or used. The live button explains the upcoming milestone rather than silently falling back or pretending to authenticate. Native gallery/camera, upload progress/retry, live caching, cold offline browser loading, location, haptics, native push, and platform permission handling remain in their later milestones. Native document-file persistence is implemented but untested and not crash-atomic.

The supplied GitHub workflow and Vercel configuration are prepared, not deployed. Next: milestone 2, with Supabase authentication, SQL migrations/seeds, storage and authorization policies, and two-user security tests.
