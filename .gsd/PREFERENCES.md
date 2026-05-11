---
version: 1
unique_milestone_ids: true
models:
  research: claude-3-5-sonnet-latest
  planning: claude-3-5-sonnet-latest
  execution: claude-3-5-sonnet-latest
  completion: claude-3-5-sonnet-latest
verification_commands:
  - npm run lint
verification_auto_fix: true
verification_max_retries: 2
git:
  isolation: branch
  milestone_resquash: true
---
