---
name: Blog post seoTitle stored as empty string causes blank page title
description: seoTitle="" in DB bypasses ?? fallback to post.title, producing empty <title> and og:title
type: feedback
---

In `getBlogPostBySlug`, `generateMetadata` returns `title: post.seoTitle ?? post.title`. When seoTitle is stored as `""` (empty string, not null), the `??` operator passes it through unchanged, resulting in `<title> | Alex Kowalski</title>`.

**Why:** Prisma returns `""` instead of `null` when the admin form submits a blank seoTitle field. The `??` null coalescing operator does not treat `""` as nullish.
**How to apply:** The fix should use `||` instead of `??` for the title fallback, or normalize empty strings to null at the API/form level. Check same pattern in project detail page's generateMetadata too.
