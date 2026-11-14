// Entry point for the browser build of the offline engine (public/offline/offline-answer.js, global FlashpointOffline).
// Rebuild after changing lib/evidence.ts or lib/offline-answer.ts:
//   npx esbuild@0.24.0 lib/offline-browser.ts --bundle --format=iife --global-name=FlashpointOffline --target=es2018 --outfile=public/offline/offline-answer.js
export * from "./evidence";
export * from "./offline-answer";
