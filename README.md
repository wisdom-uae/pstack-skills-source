# pstack skills mirror

Public TeamAI mirror of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (poteto), MIT licensed.

This repository exists so the `wisdom-uae` team can consume pstack as a review-gated TeamAI source instead of every member installing it locally. `teamai-team` subscribes to it via:

```yaml
sources:
  - name: pstack-skills
    repo: https://github.com/wisdom-uae/pstack-skills-source.git
```

TeamAI reads `teamai.yaml` here for `publicSkills`, then delivers each skill from `skills/<name>/SKILL.md` to the member's agent directories. Nothing in this repository is hand-edited: [`.github/workflows/sync-upstream.yml`](.github/workflows/sync-upstream.yml) proposes upstream changes daily, and a human merges them.

## What's in here

| Path | Content |
|---|---|
| `skills/<name>/` | 56 skills, copied verbatim from upstream `pstack/skills/` |
| `docs/guide/` | The pstack guide, copied from upstream `pstack/docs/`; `skills/poteto-help` links into it |
| `teamai.yaml` | `publicSkills` list read by TeamAI |
| `UPSTREAM.md` | The upstream version and commit this mirror is synced to |
| `scripts/sync-upstream.mjs` | Copies and rewrites; run by the workflow |
| `THIRD_PARTY_NOTICES.md` | Upstream license |

## Renames

TeamAI delivers skills to agents by flat name, so two sources cannot both publish `tdd` or `teach`. `mattpocock-skills` owns those names; this mirror publishes them as:

| Upstream | Here |
|---|---|
| `tdd` | `pstack-tdd` |
| `teach` | `pstack-teach` |

The sync script rewrites the frontmatter `name`, the `../<skill>/SKILL.md` links, and the `/tdd` `/teach` command forms wherever they appear. Nothing else about those skills changes.

## Cursor dependency

pstack is built for Cursor. `poteto-mode`, `how`, `why`, `pstack-teach`, `swarm` and `arena` start Cursor subagents with per-role models, so parts of them do not work in other harnesses. The skills are delivered as-is; expect those skills to be partially inert outside Cursor.

## Licenses

pstack is MIT, copyright Lauren Tan. Full text in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
