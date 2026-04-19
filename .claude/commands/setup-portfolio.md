# /setup-portfolio

Interactively gather the owner's real personal information and write it into `src/lib/mock-data.ts`, replacing all placeholder content.

## What this skill does

Asks the owner for each piece of portfolio data section by section, confirms the complete picture, then rewrites `src/lib/mock-data.ts` with real values and commits the result.

## Instructions for Claude

Work through the following sections **one at a time** in the conversation. Ask all questions in a section before moving on. Keep questions short and direct. Accept "skip" or blank answers for optional fields — use a sensible placeholder rather than leaving the field empty.

After collecting all sections, show a summary of what will be written, ask for confirmation, then edit the file and commit.

---

### Section 1 — Personal Info (OWNER object)

Ask these questions:
1. **Full name** — what should appear as your name on the portfolio?
2. **Professional tagline** — one line that appears under your name (e.g. "Software Engineer. I also build robots."). Keep it punchy, ≤ 80 chars.
3. **Bio** — 2–3 short paragraphs about yourself. Ask for them one at a time:
   - Para 1: What you do and your main technical focus
   - Para 2: Technical background — languages, tools, domains you work in
   - Para 3: What you do outside pure engineering (open source, writing, side projects) — optional
4. **Email address** — shown in Contact section
5. **GitHub URL** — full URL e.g. `https://github.com/yourhandle`
6. **LinkedIn URL** — full URL e.g. `https://linkedin.com/in/yourhandle` (or skip)
7. **Location** — city, country (e.g. "Warsaw, Poland")

---

### Section 2 — Skills

Ask:
1. What are your main **programming languages**? (comma-separated list)
2. What **frameworks and libraries** do you use most? (comma-separated)
3. Do you have **robotics/embedded** skills? If yes, list them (ROS2, Arduino, etc.) — or skip
4. What **tools and infrastructure** do you work with? (Docker, Git, databases, CI/CD, etc.)
5. Any other skill category worth adding? (e.g. "Machine Learning", "Cloud") — name the category and list skills, or skip

Build the SKILLS array from these answers. Keep each list to 6–8 items max; prioritise strongest skills.

---

### Section 3 — Work Experience

Tell the owner: "I'll ask about each job in reverse chronological order (most recent first). Type 'done' when you have no more entries to add."

For each entry ask:
1. Company name
2. Job title / role
3. Employment type: Full-time / Part-time / Contract / Internship / Volunteer
4. Start date (month + year, e.g. "Jan 2023")
5. End date — or is this your current role? (type "present" if current)
6. One-sentence description of what you built or achieved — include concrete tech and a metric if possible

Collect up to 5 entries. Stop when they type "done" or after 5.

Format the period as `"Jan 2023 — Present"` or `"Jun 2021 — Dec 2022"`.

---

### Section 4 — Robotics & Hardware Highlights

These are the 4 highlight cards in the Robotics section. If the owner has no robotics work, ask whether to keep generic cards, replace with software specialisms, or remove the section.

If they have robotics/hardware work, ask for up to 4 highlight areas:
- Area name (e.g. "Autonomous Systems", "Computer Vision")
- One-sentence description (what you built, what tools/methods)
- Pick an emoji icon that fits (suggest a few: 🤖 ⚡ 👁️ 🔧 🦾 📡 🧠 🔬)

If they want to replace with non-robotics cards (e.g. "Backend Engineering", "DevOps"), take the same inputs.

---

### Section 5 — Mock Projects (optional)

Note to owner: "You have 11 real GitHub projects already imported into the database. These mock projects only show up in preview/mock mode — you can skip this section."

If they want to update them anyway, ask for up to 3 entries:
- Project title
- One-sentence summary with tech + outcome
- Tech tags (comma-separated)
- Type: SOFTWARE / ROBOTICS / HARDWARE / RESEARCH
- GitHub URL (optional)
- Live URL (optional)

If they say skip, keep the existing mock projects or replace with minimal placeholders.

---

### Section 6 — Confirmation & Write

Before writing, display a compact summary:

```
OWNER
  name:      <value>
  tagline:   <value>
  email:     <value>
  github:    <value>
  linkedin:  <value>
  location:  <value>

SKILLS      <N categories, N total skills>
EXPERIENCE  <N entries>
ROBOTICS    <N highlight cards>
PROJECTS    <kept mock / N updated>
```

Ask: "Does this look right? Type 'yes' to write or point out what to change."

---

### Writing the file

Once confirmed:

1. Read the current `src/lib/mock-data.ts`
2. Rewrite it completely — keep all TypeScript types and export names exactly as they are, replace all placeholder values with the collected data
3. Keep the top comment block intact
4. Do NOT change `BLOG_POSTS` — leave as-is (owner manages posts via admin panel)
5. Run `npx tsc --noEmit` to verify no type errors
6. Commit:
   ```
   git add src/lib/mock-data.ts
   git commit -m "chore(public): fill in real owner information and portfolio content"
   ```
7. Push
8. Confirm: "Done — `src/lib/mock-data.ts` updated and pushed. Restart the dev server (`npm run dev`) to see the changes live."
