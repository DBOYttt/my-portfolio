FROM node:22-slim

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Playwright + chromium system deps
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install career-ops deps
COPY career-ops/package*.json ./career-ops/
RUN cd career-ops && npm install --omit=dev
COPY career-ops ./career-ops

# Install server deps
COPY career-ops-server/package*.json ./career-ops-server/
RUN cd career-ops-server && npm install
COPY career-ops-server ./career-ops-server

# Output volume mount point
RUN mkdir -p /app/cv_output

# Pre-approve Claude Code Write + Bash + Read within the career-ops working directory.
# Required because generate jobs run in non-interactive -p mode and cannot prompt for approval.
RUN mkdir -p /app/career-ops/.claude && \
    printf '{"permissions":{"allow":["Bash(*)","Write(/app/career-ops/output/*)","Read(/app/career-ops/*)"]}}\n' \
    > /app/career-ops/.claude/settings.json

EXPOSE 4200
CMD ["npx", "--yes", "tsx", "career-ops-server/server.ts"]
