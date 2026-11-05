# pstack in OMP

pstack skills use Cursor names. Read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

Same shape as [`claude-code.md`](claude-code.md): the skills stay Cursor-shaped, this file carries the translation. TeamAI members get the short version of this table as an always-applied rule, so a session that loads the team rules does not need to open this page.

Verified against omp 18.16.0 on 2026-11-05.

## Tools

| Cursor | OMP |
| --- | --- |
| `Task` | `task` |
| `AskQuestion` | `ask` with `questions[]` (each question needs 2-5 options; the UI adds "Other") |
| Open a todolist | `todo` |
| Run another pstack skill (`/name` or "the **name** skill") | `read skill://<name>`, or `/skill:<name>` in the TUI. Skills are not auto-invoked: 55 of 56 set `disable-model-invocation: true` |
| `Grep`, `Glob` | `grep`, `glob` |
| `Read` | `read` (`:50-80` range selectors on the path) |

## Subagent fields

| Cursor | OMP |
| --- | --- |
| `subagent_type: generalPurpose` | `agent: "task"` (the default when `agent` is omitted) |
| `poteto-agent`, `comment-sicko` | a custom agent file in `.omp/agents/<name>.md` or `~/.omp/agent/agents/<name>.md`, then `agent: "<name>"`. Verified: a project-local agent file is addressable from `task` |
| `readonly: true` | `agent: "scout"`. Its tool list is `read, find, grep, glob, ast_grep, web_search` (no `bash`), so it is read-only by construction. `reviewer` and `security-reviewer` are also read-only and take `bash` |
| `readonly: false` | `task`, `reviewer`, `sonic` |
| `environment: "cloud"` | No equivalent. Use a worktree, one writer per branch, and note the skip |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first |
| `run_in_background: true` | Omit. Spawns return immediately; collect with `wait`, and read `proc://` to inspect |
| `resume` | `write agent://<id>` messages a finished agent. Its transcript stays at `history://<id>` |
| `file_attachments` | List the paths in the brief |

`task` accepts a `tools` list of eval-defined tool names, run in the caller's kernel. It does not take `subagent_type`, `readonly`, or `environment`.

## Models

| Cursor | OMP |
| --- | --- |
| a per-spawn `model:` field | `task` rejects `model` for every agent except `seance` ("`model` is only accepted for the `seance` agent"). Bind models at the agent definition instead: `model:` in the agent file |
| `auto` or `inherit-parent` | omit `model` |
| `~/.cursor/rules/pstack-models.mdc` | `~/.omp/agent/rules/pstack-models.md` for the role lines, plus `task.agentModelOverrides` in `~/.omp/agent/config.yml` for the real binding |
| `<slug>:<thinking>` | the same string in an agent file, for example `model: ["opencode-go/deepseek-v4.1-flash:low"]`. Verified: the subagent ran on that model at `thinkingLevel: low` |

### Panels that need one model per seat

`arena`, `interrogate`, `architect` and `swarm` spawn seats on different models. In OMP, define one agent per seat and spawn by name. The parent keeps the role line.

```markdown
---
name: arena-a
description: Arena runner seat A. Candidate implementation only, no review.
tools: [read, edit, write, bash, grep, glob]
model: ["cursor/grok-4.7:xhigh"]
---
You are an arena candidate. Implement the task in your worktree, run the checks, report.
```

```markdown
---
name: arena-b
description: Arena runner seat B.
tools: [read, edit, write, bash, grep, glob]
model: ["opencode-go/deepseek-v4-pro:max"]
---
```

Then `task` once per seat with `agent: "arena-a"` / `agent: "arena-b"`. Seat count follows the role line's entry count, the same rule the skill states for Cursor. `task.agentModelOverrides` stays the catch-all for every role that does not need its own seat.

## setup-pstack

`setup-pstack` writes the Cursor rule. In OMP the equivalent is already in place and the skill does not apply:

- Role lines: `~/.omp/agent/rules/pstack-models.md`, with `alwaysApply: true` frontmatter.
- Model binding: `task.agentModelOverrides` in `~/.omp/agent/config.yml`, one line per agent type (`task`, `scout`, `reviewer`, `security-reviewer`, `sonic`).

Running the skill's detection step against OMP slugs produces a rule that `task` cannot honour, so skip it: `Skipped in OMP: setup-pstack. Agents bind models through config.yml, not through per-spawn slugs.`

## Paths

| Cursor | OMP |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.omp/skills/`, `~/.omp/agent/skills/` |
| `.cursor/rules/*.mdc`, always-applied rules | `.omp/rules/*.md` (project), `~/.omp/agent/rules/*.md` (user), or `AGENTS.md` for prose instructions |
| `.cursor/agents/`, `~/.cursor/agents/` | `.omp/agents/`, `~/.omp/agent/agents/` |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `history://<id>` for an agent's transcript; session files at `~/.omp/agent/sessions/<slug>/<session>.jsonl`, with each subagent's run beside it as `<id>.jsonl` |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy and never fetch it |

## Cursor-only features

OMP has no Cursor Automations, Bugbot, cloud agents, `/loop`, built-in `create-skill`, or `cursor-team-kit`. When a step needs one, put one line in your reply, `Skipped in OMP: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | OMP |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, `SendToUser` secret requests | Skip with the line. `make-bot-ui` therefore cannot run |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads: `pr://<n>`, `gh pr view <n> --comments`. Skip a step that starts, waits for, or configures Bugbot |
| Cursor cloud agents | Skip a step that needs the cloud agent itself, such as its dashboard status. `environment: "cloud"` becomes a local worktree |
| `/loop` | No built-in loop. Re-check with `wait` on the job, or a `bash` background job plus a wake; state that the cadence is manual |
| Cursor's `create-skill` | `manage_skill` for the managed library, or write `SKILL.md` yourself. Project skills: `.omp/skills/<name>/SKILL.md`, or `.omp/agents/<name>.md` for a subagent |
| `cursor-team-kit` (`/deslop`, `control-ui`, `control-cli`) | `unslop` for prose. For verification, drive the real surface: launch the app or CLI, exercise the feature, capture the output. Browser work can use the `browser` helpers |
| A built-in PR tool | Use the forge command the step gives, such as `gh pr create`. That is not a skip, so write no line |

## Skill-by-skill

The 39 skills that need no translation run as written. The 17 below need one or more rows above.

| Skill | What to translate |
| --- | --- |
| `how`, `why` | per-spawn `model:` → seat agents; `readonly: true` → `agent: "scout"`; `subagent_type` → `agent` |
| `interrogate`, `swarm` | same as above, plus `environment: "cloud"` → worktree. `interrogate`'s reviewer count still follows the role line |
| `arena` | seat agents, rubric and cross-judge unchanged. Candidates write in worktrees |
| `architect` | runner seats via `architect runners`, seat agents in place of `model:` |
| `poteto-mode` | `AskQuestion` → `ask`; Bugbot, `/loop`, cloud agents, `cursor-team-kit` → skip lines; transcripts → `history://` |
| `poteto-help` | product answers about Automations, Bugbot and `/loop`: describe them, then say which step is skipped here |
| `reflect` | fan-out via seat agents, `Bugbot` and `create-skill` → skip lines, transcripts → `history://` |
| `automate-me` | `AskQuestion` → `ask`, `create-skill` → `manage_skill`, mode skills go in `.omp/skills/<handle>-mode/SKILL.md`, mining reads `~/.omp/agent/sessions/<slug>/` |
| `recall`, `show-me-your-work` | transcript paths → `history://` and the OMP session layout |
| `create-verification-skill`, `maintain-verification-skill` | `.cursor/skills/verify-<app>/` → `.omp/skills/verify-<app>/` |
| `no-comments` | `subagent_type` → `agent` |
| `setup-pstack` | skip, see above |
| `make-bot-ui` | skip, its whole surface is Cursor Automations |

## Harnesses without subagents

Codex, and any other single-agent harness, can read the skills and follow the single-agent path. Every fan-out step (`swarm`, `arena`, `interrogate`, `reflect`, `architect`, `how`, `why`, `poteto-mode` orchestration) gets the skip line and the parent does the work serially. Never fake a fan-out: the diversity of models is the mechanism, and one model reviewing its own work does not reproduce it.
