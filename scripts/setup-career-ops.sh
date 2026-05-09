#!/usr/bin/env bash
set -e
git submodule update --init career-ops
cd career-ops
npm install
npx playwright install chromium --with-deps
[ -f config/profile.yml ] || cp config/profile.example.yml config/profile.yml 2>/dev/null || echo "WARN: config/profile.example.yml not found — create career-ops/config/profile.yml manually"
[ -f cv.md ] || cp cv.example.md cv.md 2>/dev/null || echo "WARN: cv.example.md not found — create career-ops/cv.md manually"
echo "career-ops ready. Fill in career-ops/config/profile.yml and career-ops/cv.md before running."
