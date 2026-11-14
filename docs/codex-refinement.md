# Codex experience refinement

AI-assisted by OpenAI Codex, 2026-11-14. This isolated clone belongs to the Codex refinement lane. The parent checkout is unchanged.

## Design

Geist and Geist Mono; deep navy, orange actions, blue flame light. The landing page pairs a seven-column introduction with a five-column interactive flame illustration. Analysis pairs an eight-column map with a four-column evidence panel. On narrow screens, both become one column. Motion patterns: a restrained flame morph on the landing page and short opacity/position transitions. Reduced motion disables automatic decorative animation.

The visitor first sees why gravity changes fire, then follows an explicit ISS, Moon Base, spacesuit journey. Analysis preserves the complete research tools but puts large tables behind labelled disclosures. Nearby rows are evidence coverage, never a safety certification. Missing solid-material pressure remains missing.

## Audit findings

- Landing page starts with a query box before teaching the question.
- Analysis opens with long explanations and two full tables.
- The proximity rule is elliptical, but the text says oxygen OR pressure.
- Well tested can be read as validated or safe.
- Hidden simulation continues doing GPU work.
- Assistant requests an endpoint that does not exist.
- Brief says no AI wrote its text despite AI-authored templates.
- Map pointer conversion ignores SVG letterboxing.
- Sim sliders cannot represent the 100 percent oxygen spacesuit preset.
- Simulation has no explicit distinction between a timed record illustration and measured test footage.

## Validation

Browser findings and final checks are recorded below after implementation. No new runtime library, dataset or external image is introduced. Original NASA rows and video narration stay intact.

## Implemented

- Dark default with persistent light mode, original CSS flame illustration, purposeful landing-page hierarchy.
- Four-step guided presentation from ISS to Moon Base to spacesuit, ending in the evidence brief.
- Exact probe inputs, fuel filtering, disclosures for long tables, clickable assistant sources and immediate navigation.
- Count labels describe nearby rows, not a safety assessment. Missing solid-material pressure is distinct from no nearby data. The normalized elliptical distance rule is stated accurately.
- One A4 page when the evidence brief is printed. AI-authored templates are disclosed.
- Simulation uses the original 256-cell reference resolution, reduced warm-up and suspension offscreen. Presets support 100% oxygen. Inverse burner-oxygen tests are excluded from cabin-atmosphere simulation, retained in Research tools. Timed outcome illustrations are labelled and CSS playback no longer loops unless requested.
- Learn exposes one chapter at a time with back/next, direct links, chapter selection, interactive checks, original captioned videos and pause on chapter changes.

## Verified locally

- 50 browser regression checks passed in installed headless Chrome, with zero JavaScript exceptions.
- Desktop, tablet and phone layouts at 1440, 768 and 375 pixels; light and dark themes; reduced motion; modal focus containment; exact numeric and keyboard probe input.
- NASA row counts, fuel-specific coverage, search/filter empty states, CSV provenance, map-to-lab transfer, gravity controls, pause, WebGL rendering and forced CSS fallback.
- Hidden lab activity flag and simulation clock remain stopped while another page is open.
- Chapter selection, browser history, formula sheet, interactive gravity lesson, six caption tracks.
- One-page A4 PDF verified with pypdf. White text on the orange primary fill has 5.50:1 contrast.
- The existing offline engine checks passed, including parser behavior, nearest-test logic and endpoint failure/timeout fallbacks. Node 24 strips TypeScript for these checks; no new package was installed.

Screenshots, the PDF and machine-readable browser results are in `.qa/` (gitignored). Checked in Chrome with Google Fonts blocked to verify the installed-font fallback. Other browser engines and real touch devices have not been tested. No live AI endpoint was connected, no deployment or push was performed, and this clone does not contain the parent's secret environment file.
