import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const upstream = process.argv[2] ?? "/tmp/upstream";
const repoUrl = "https://github.com/wisdom-uae/pstack-skills-source.git";
const pstackDir = path.join(upstream, "pstack");
const pluginPath = path.join(pstackDir, "plugin.json");

const plugin = JSON.parse(fs.readFileSync(pluginPath, "utf8"));
const skillsRoot = path.join(pstackDir, "skills");
if (!fs.existsSync(skillsRoot)) throw new Error(`Missing upstream skills dir: ${skillsRoot}`);

/**
 * Skills whose upstream name collides with another TeamAI source get a prefix.
 * mattpocock/skills already publishes `tdd` and `teach`; TeamAI delivers skills
 * to agents by flat name, so the collision has to be broken here.
 */
const RENAMES = new Map([
  ["tdd", "pstack-tdd"],
  ["teach", "pstack-teach"],
]);

const upstreamNames = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort();

if (upstreamNames.length === 0) throw new Error("Upstream pstack/skills is empty");

const root = process.cwd();
fs.rmSync(path.join(root, "skills"), { recursive: true, force: true });

const published = [];
for (const name of upstreamNames) {
  const source = path.join(skillsRoot, name);
  if (!fs.existsSync(path.join(source, "SKILL.md"))) {
    throw new Error(`Upstream skill missing SKILL.md: skills/${name}`);
  }
  const destName = RENAMES.get(name) ?? name;
  const dest = path.join(root, "skills", destName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(source, dest, { recursive: true });
  published.push(destName);
}
published.sort();

// --- rewrite references to renamed skills -----------------------------------
const rewrites = [];
for (const [from, to] of RENAMES) {
  rewrites.push([new RegExp(`^name:[ \\t]*${from}[ \\t]*$`, "m"), `name: ${to}`]);
  rewrites.push([new RegExp(`\\.\\./${from}/SKILL\\.md`, "g"), `../${to}/SKILL.md`]);
  // Command forms: `/tdd`, `/tdd it`, and backticked variants.
  rewrites.push([new RegExp(`(^|[\\s(\`])/${from}(?![A-Za-z0-9_-])`, "gm"), `$1/${to}`]);
  rewrites.push([new RegExp(`\\*\\*${from}\\*\\*`, "g"), `**${to}**`]);
  rewrites.push([new RegExp(`\\bthe ${from} skill\\b`, "g"), `the ${to} skill`]);
}

function rewriteTree(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteTree(p);
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const before = fs.readFileSync(p, "utf8");
    let after = before;
    for (const [pattern, replacement] of rewrites) after = after.replace(pattern, replacement);
    if (after !== before) {
      fs.writeFileSync(p, after);
      console.log(`rewrote ${path.relative(root, p)}`);
    }
  }
}
rewriteTree(path.join(root, "skills"));

// --- docs (the guide that `poteto-help` links to) ---------------------------
const upstreamDocs = path.join(pstackDir, "docs");
fs.rmSync(path.join(root, "docs"), { recursive: true, force: true });
if (fs.existsSync(upstreamDocs)) {
  fs.cpSync(upstreamDocs, path.join(root, "docs"), { recursive: true });
  rewriteTree(path.join(root, "docs"));
}

// --- teamai.yaml ------------------------------------------------------------
const teamConfig = [
  "team: pstack-skills",
  "description: Public TeamAI mirror of pstack by Lauren Tan (MIT), synced from cursor/plugins",
  `repo: ${repoUrl}`,
  "provider: github",
  "publicSkills:",
  ...published.map((name) => `  - ${name}`),
  "",
].join("\n");
fs.writeFileSync(path.join(root, "teamai.yaml"), teamConfig);

// --- UPSTREAM.md ------------------------------------------------------------
const head = execFileSync("git", ["-C", upstream, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const upstreamFile = path.join(root, "UPSTREAM.md");
const previous = fs.existsSync(upstreamFile) ? fs.readFileSync(upstreamFile, "utf8") : "";
const previousHead = previous.match(/Commit: `([0-9a-f]{7,40})`/)?.[1];

if (previousHead !== head) {
  const version = plugin.version ?? "unknown";
  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    upstreamFile,
    [
      "# Upstream",
      "",
      "- Repository: https://github.com/cursor/plugins",
      "- Path: `pstack/`",
      `- Version: ${version}`,
      `- Commit: \`${head}\``,
      `- Synced: ${date}`,
      "",
      "Every directory under upstream `pstack/skills/` is mirrored.",
      "`tdd` and `teach` are published as `pstack-tdd` and `pstack-teach` to avoid",
      "colliding with the `mattpocock-skills` source; references to them are rewritten.",
      "The sync workflow rewrites this file when the upstream commit changes.",
      "",
    ].join("\n"),
  );
}

console.log(`Synced ${published.length} skills from ${head}`);
