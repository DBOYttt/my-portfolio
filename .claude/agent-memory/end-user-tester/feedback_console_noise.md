---
name: Recurring Console Noise — crxemulator
description: The crxemulator hydration warning is injected by the Claude-in-Chrome extension, not the app
type: feedback
---

Every page visit produces a React hydration warning: "Warning: Extra attributes from the server: crxemulator at html". This is caused by the Claude-in-Chrome browser extension injecting a `crxemulator` attribute on the `<html>` element.

**Why:** Not an app bug — extension artifact. Filed in console warnings section but never as a bug.
**How to apply:** Filter out crxemulator messages when scanning console for app errors. Only flag as a warning in reports, never as a bug.
