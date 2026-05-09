# End-User Tester Memory Index

- [Milestone 4.12 Phase 1 — Public Surface Test Run](project_m412_phase1.md) — Findings from the first public surface walkthrough; known bugs and patterns
- [Recurring Console Noise](feedback_console_noise.md) — crxemulator hydration warning is extension artifact, not an app bug
- [Blog post seoTitle empty string bug](feedback_seotitle_empty_string.md) — seoTitle stored as "" not null causes ?? to produce empty page title
- [Sections hidden when DB empty](feedback_empty_state_sections.md) — Experience and Projects preview sections fully suppressed when no rows in DB, breaking nav anchors
- [Milestone 4.13 — Verification Results](project_m413_results.md) — A1/A2/A3/A4/Part C all PASS; one pre-existing P2 (admin table mobile clipping)
- [Milestone 4.14 Phase 3 — CV & GitHub Summarizer Test Results](project_m414_phase3_results.md) — 2 bugs: [object Object] in GH summarizer LLM prompt (P2), empty skill rows in CV preview (P3)
- [Milestone 4.14 Phase 4 — Agent Feature Test Results](project_m414_phase4_results.md) — 4 bugs: SI-C badges broken by dedup OW run (P2), BM Dev.to absent when empty (P3), INTERMEDIATE level fallback (P3), Draft link ?title ignored (P3)
- [Phase 5 Agent Feature Test Results](project_phase5_results.md) — Robotics News digest empty on first run (P2), GH Importer URL hallucination pre-existing (P2), Platform Sync all PASS
- [Milestone 5 Pre-Deployment Sign-Off](project_milestone5_presignoff.md) — Final walkthrough 2026-04-19; zero P1/P2 bugs; all 23 test points PASS; app is deployment-ready
- [Blog Pages — Logbook Redesign Audit Findings](project_blog_redesign_findings.md) — Old design classes (card, tag, section-heading, etc.) not migrated; affects /blog, /projects, and not-found pages
- [Milestone 6.5 — Admin Panel Audit Results](project_m65_results.md) — 2 new P2 bugs (CvEditor skill category mismatch, Experience no inline edit); 2 new P3 bugs; all CRUD and auth pass
- [Milestone 7.5 — Career Admin Panel Test Results](project_m75_career_panel_results.md) — 1 P2 (PATCH shallow-merge wipes nested config fields), 1 P3 (pipeline table doesn't show in-memory evaluate jobs); all flows PASS
