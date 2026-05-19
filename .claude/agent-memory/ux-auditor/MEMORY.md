# UX Auditor Memory Index

- [Polling infinite-loop risk pattern](pattern_polling_no_timeout.md) — REVISED in Iter 2: browser setInterval fires independently of async callbacks; pollCountRef DOES increment every 3s. Real bug is overlapping in-flight fetches writing stale state. Timeout message renders correctly (functional setLogLines updater).
- [Pipeline table: service-down vs empty conflated](pattern_pipeline_empty_state.md) — REVISED in Iter 2: page.tsx calls career-ops directly (not the API route); "service down" UI IS reachable (career-ops returns 500 on corrupt pipeline.json). The /api/admin/career/pipeline route is orphaned dead code.
- [User Profile](user_profile.md) — Portfolio owner: programmer + robotics enthusiast, building to get hired; technical and detail-oriented
- [isFirstLoad guard bypassed by async fetch](pattern_firstload_guard_bypass.md) — useEffect watcher fires twice: once on initial render (guard fires, skips PATCH) and again when async config GET resolves (guard already consumed, spurious PATCH fires with server data)
- [Cancel-without-AbortController race](pattern_cancel_no_abort.md) — Cancel button clears evaluating state but stale POST fetch continues; if user resubmits before old POST resolves, old POST's pollStatus() overwrites pollRef.current and orphans the new job's interval
- [Career tab final synthesis (Iter 3)](../career-tab-review/iter3_ux_final.md) — 7 findings verified from source, 3 new findings; 3 CRITICAL, 3 HIGH; "Publish CV" is dead in all fresh environments
