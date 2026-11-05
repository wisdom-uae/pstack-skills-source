# pstack skills mirror

Public TeamAI mirror of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (poteto), MIT licensed.

This repository exists so the `wisdom-uae` team can consume pstack as a review-gated TeamAI source instead of every member installing it locally. `teamai-team` subscribes to it via:

```yaml
sources:
  - name: pstack-skills
    repo: https://github.com/wisdom-uae/pstack-skills-source.git
```

TeamAI reads `teamai.yaml` here for `publicSkills`, then delivers each skill from `skills/<name>/SKILL.md` to the member's agent directories. `skills/`, `docs/` and `teamai.yaml` are never hand-edited: [`.github/workflows/sync-upstream.yml`](.github/workflows/sync-upstream.yml) proposes upstream changes daily, and a human merges them. `harness/` is the exception: it holds this mirror's own translations and the sync never touches it.

## What's in here

| Path | Content |
|---|---|
| `skills/<name>/` | 56 skills, copied verbatim from upstream `pstack/skills/` |
| `docs/guide/` | The pstack guide, copied from upstream `pstack/docs/`; `skills/poteto-help` links into it |
| `docs/harness/claude-code.md` | Upstream's Claude Code translation, copied with the rest of `docs/` |
| `harness/omp.md` | This mirror's OMP translation. Hand-written, so the sync keeps it (`docs/` is regenerated wholesale) |
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

## Harness dependency

pstack is built for Cursor: its skills name Cursor tools (`Task`, `AskQuestion`), Cursor subagent fields (`readonly`, `environment: "cloud"`, per-spawn `model`) and Cursor product features (Bugbot, Automations, `/loop`). The skills are delivered unchanged. Translations live beside them, one file per harness:

| Harness | Translation | Coverage |
|---|---|---|
| Claude Code | [`docs/harness/claude-code.md`](docs/harness/claude-code.md) (upstream) | full |
| OMP | [`harness/omp.md`](harness/omp.md) | full |
| Codex, other single-agent harnesses | [`harness/omp.md`](harness/omp.md), last section | degraded: no fan-out |

17 of the 56 skills need one: `architect`, `arena`, `automate-me`, `create-verification-skill`, `how`, `interrogate`, `maintain-verification-skill`, `make-bot-ui`, `no-comments`, `poteto-help`, `poteto-mode`, `recall`, `reflect`, `setup-pstack`, `show-me-your-work`, `swarm`, `why`. The other 39, including every `principle-*`, run as written.

The `teamai-team` repository carries the short form of the OMP table as an always-applied rule, `rules/pstack-harness.md`, so a member's session has the mapping without reading this repository.

## Licenses

pstack is MIT, copyright Lauren Tan. Full text in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
