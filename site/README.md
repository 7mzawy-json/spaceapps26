# Flashpoint site

The website itself: plain HTML, CSS and JavaScript, no build step. Everything runs in the visitor's browser, including
the flame simulation (WebGL 2, with a CSS backup flame). Open to change by the team like everything else in the repo.

## Where each part came from

| Part | Source | What changed when it moved here |
|---|---|---|
| Look, dashboard, bar, light and dark mode, Map page, SI Assist page | `temp/design-master/` | Nothing in the pages. Two style fixes (below). |
| Resources page (investigations, test data, graph builder, relationships, tests table) | `temp/dashboard-draft/` | Its colours now come from the design master tokens, so it works in dark mode. The script is unchanged. |
| Sim page | `alanzim/flame-lab/` | Now `sim.html`, in a frame on the Sim page. Fonts, colours and panels follow the site; the simulation code is unchanged. |

The three source folders are left as they were.

Two fixes made while joining them:

- The card-to-bar animation used the class `ghost`, which also matched every `btn ghost` button ("Save as PDF", "Undo
  last change", "Open on PSI") and pinned them in place, unclickable. The animation's class is now `morph`.
- The logo style (`.mark`) is limited to the header and the bar, because the Resources charts also use `mark` for their dots.

## Files

```
index.html          the dashboard and the Map, SI Assist, Resources and Sim pages
sim.html            the flame lab; index.html loads it with ?embed (header hidden), and it also works on its own
assets/tokens.css   every colour, size and radius, light and dark (shared by both pages)
assets/site.css     styles for index.html
assets/app.js       script for index.html
```

It also reads, from outside this folder: `../data/tests.web.json` (NASA test rows), `../public/offline/offline-answer.js`
(the offline answers for SI Assist) and `../public/flames/` (the backup flame for sim.html).

## Run it

Start a web server in the **repo root** (the pages read `../data/`), then open `/site/`:

- macOS: `python3 -m http.server 8765`
- Windows (PowerShell): `python -m http.server 8765`

then http://localhost:8765/site/

## Deploy

Deploy the repo root as static files. The root `index.html` forwards visitors to `site/`. This works on Vercel, Azure
Static Web Apps or the GoDaddy/Porkbun hosting from the Space Apps global offers. The SI chat expects an endpoint at
`/api/chat`; until one exists, every question is answered by the offline rule-based mode, and the browser console shows
a failed request to `/api/chat` (expected).

## Checked (Sat Nov 14, in the Claude desktop browser)

- All four pages open from the cards and from the bar; no errors in the console apart from the expected `/api/chat`.
- Map: test dots, the evidence rating and the five nearest tests load. SI Assist: the chat moves the controls, Undo works.
- Resources: 24 investigations, filters, the graph builder and the tests table; "See its tests" jumps to the filtered data.
- Sim: the flame lab loads in its frame, the WebGL flame runs, and the frame grows to fit. Dark mode reaches it.
- Phone width (375 px): no sideways scrolling on any page.

Not checked: Safari, Firefox, a real phone, a screen reader.
