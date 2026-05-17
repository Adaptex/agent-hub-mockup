#!/usr/bin/env node
/**
 * agentHub.mjs — CLI tool for Agent Hub
 * Usage:
 *   node agentHub.mjs list
 *   node agentHub.mjs create --name="Researcher" --color="#7dd3fc" --lede="..."
 *   node agentHub.mjs feed --agent=designer --part="Spacing" --quote="..."
 *   node agentHub.mjs export
 *   node agentHub.mjs reset
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const AGENTS_FILE = resolve(__dir, "agents.json");

const STAGE_NAMES = ["Seed", "Sprout", "Bloom", "Fruit"];
const STAGE_THRESHOLDS = [0, 10, 40, 100];

function calcStage(xp) {
  let s = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (xp >= STAGE_THRESHOLDS[i]) s = i;
  }
  return s;
}

function loadAgents() {
  if (!existsSync(AGENTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(AGENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveAgents(agents) {
  writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), "utf8");
}

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(3)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else if (a.startsWith("--")) args[a.slice(2)] = true;
  }
  return args;
}

function colorToHex(val) {
  if (!val) return "#88ccff";
  if (typeof val === "string" && val.startsWith("#")) return val;
  if (typeof val === "number") return "#" + val.toString(16).padStart(6, "0");
  return val;
}

function timeAgo(ts) {
  if (!ts) return "seed memory";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return h === 1 ? "1h ago" : `${h}h ago`;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const EMBER = "\x1b[38;2;255;154;60m";
const MINT = "\x1b[38;2;98;255;196m";
const CORAL = "\x1b[38;2;255;143;130m";
const VIOLET = "\x1b[38;2;200;180;255m";

function pad(str, len) {
  return String(str).padEnd(len);
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdList() {
  const agents = loadAgents();
  if (!agents.length) {
    console.log(`${DIM}No agents found. Run: node agentHub.mjs create --name="..."${RESET}`);
    return;
  }
  console.log(`\n${BOLD}${EMBER}Constellation Forge${RESET} — ${agents.length} agent${agents.length !== 1 ? "s" : ""}\n`);
  for (const a of agents) {
    const stage = STAGE_NAMES[Math.min(a.stage ?? calcStage(a.xp ?? 0), 3)];
    const learningCount = Array.isArray(a.learnings) ? a.learnings.length : 0;
    const status = a.status === "working" ? `${MINT}● working${RESET}` : `${DIM}○ idle${RESET}`;
    console.log(
      `  ${BOLD}${pad(a.name, 22)}${RESET}` +
      `${DIM}${pad(a.id, 20)}${RESET}` +
      `${status}  ` +
      `${VIOLET}${stage}${RESET}  ` +
      `${EMBER}${learningCount} learning${learningCount !== 1 ? "s" : ""}${RESET}  ` +
      `${DIM}${a.xp ?? 0} XP${RESET}`
    );
    if (a.lede) console.log(`  ${DIM}${a.lede}${RESET}`);
    console.log();
  }
}

function cmdCreate(args) {
  if (!args.name) {
    console.error(`${CORAL}Error: --name is required.${RESET}`);
    process.exit(1);
  }
  const agents = loadAgents();
  const id = (args.id || args.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  if (agents.find((a) => a.id === id)) {
    console.error(`${CORAL}Error: agent with id "${id}" already exists.${RESET}`);
    process.exit(1);
  }
  const agent = {
    id,
    name: args.name,
    short: args.short || id,
    color: colorToHex(args.color),
    status: "idle",
    stage: 0,
    xp: 0,
    lede: args.lede || "",
    learnings: [],
    specialization: args.spec ? args.spec.split(",").map((s) => s.trim()) : [],
    reliability: 0.5,
    executionHistory: [],
  };
  agents.push(agent);
  saveAgents(agents);
  console.log(`\n${MINT}✓ Created agent${RESET} ${BOLD}${agent.name}${RESET} ${DIM}(${agent.id})${RESET}`);
  console.log(`  Stage: ${VIOLET}${STAGE_NAMES[0]}${RESET}  XP: 0  Color: ${agent.color}\n`);
}

function cmdFeed(args) {
  if (!args.agent) { console.error(`${CORAL}Error: --agent=<id> is required.${RESET}`); process.exit(1); }
  if (!args.quote) { console.error(`${CORAL}Error: --quote="..." is required.${RESET}`); process.exit(1); }
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === args.agent || a.name.toLowerCase() === args.agent.toLowerCase());
  if (!agent) {
    console.error(`${CORAL}Error: agent "${args.agent}" not found.${RESET}`);
    process.exit(1);
  }
  const learning = {
    id: `learn-${Date.now()}-cli`,
    part: args.part || "General",
    quote: args.quote,
    timestamp: Date.now(),
    context: "cli",
  };
  if (!Array.isArray(agent.learnings)) agent.learnings = [];
  agent.learnings.push(learning);
  agent.xp = (agent.xp || 0) + 10;
  const prevStage = agent.stage;
  agent.stage = calcStage(agent.xp);
  saveAgents(agents);

  console.log(`\n${MINT}✓ Fed skill to${RESET} ${BOLD}${agent.name}${RESET}`);
  console.log(`  ${DIM}${learning.part}:${RESET} "${learning.quote}"`);
  console.log(`  XP: ${agent.xp}  Stage: ${VIOLET}${STAGE_NAMES[Math.min(agent.stage, 3)]}${RESET}`);
  if (agent.stage > prevStage) {
    console.log(`  ${EMBER}★ Stage promotion: ${STAGE_NAMES[Math.min(prevStage, 3)]} → ${STAGE_NAMES[Math.min(agent.stage, 3)]}${RESET}`);
  }
  console.log();
}

function cmdExport(args) {
  const agents = loadAgents();
  if (args.format === "csv") {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = ["id,name,stage,xp,learnings,reliability,status"];
    for (const a of agents) {
      lines.push([
        q(a.id), q(a.name),
        q(STAGE_NAMES[Math.min(a.stage ?? 0, 3)]),
        a.xp ?? 0,
        Array.isArray(a.learnings) ? a.learnings.length : 0,
        a.reliability ?? 0.5,
        q(a.status ?? "idle"),
      ].join(","));
    }
    console.log(lines.join("\n"));
  } else {
    console.log(JSON.stringify(agents, null, 2));
  }
}

function cmdReset() {
  if (!existsSync(AGENTS_FILE)) {
    console.log(`${DIM}Nothing to reset — agents.json not found.${RESET}`);
    return;
  }
  const agents = loadAgents();
  // Reset XP and learnings for all agents back to seed state
  const reset = agents.map((a) => ({ ...a, xp: 0, stage: 0, learnings: [], reliability: 0.5, executionHistory: [] }));
  saveAgents(reset);
  console.log(`${CORAL}✓ Reset all agents to Seed stage.${RESET}`);
}

function cmdHelp() {
  console.log(`
${BOLD}${EMBER}agentHub.mjs${RESET} — Agent Hub CLI

${BOLD}Commands:${RESET}
  ${MINT}list${RESET}                              List all agents
  ${MINT}create${RESET} --name="..." [options]    Create a new agent
  ${MINT}feed${RESET}   --agent=<id> --quote="..."  Feed a skill to an agent
  ${MINT}export${RESET} [--format=csv]            Export agents as JSON or CSV
  ${MINT}reset${RESET}                             Reset all agents to Seed stage

${BOLD}Create options:${RESET}
  --color="#hexcode"    Agent colour (default #88ccff)
  --lede="..."          Short bio
  --spec="a,b"          Comma-separated specializations
  --id="..."            Custom ID (default: slugified name)

${BOLD}Feed options:${RESET}
  --part="Category"     Skill category (default: General)

${BOLD}Examples:${RESET}
  node agentHub.mjs create --name="Researcher" --color="#7dd3fc" --spec="research,writing"
  node agentHub.mjs feed --agent=researcher --part="Sources" --quote="Prefer primary sources over aggregators."
  node agentHub.mjs list
  node agentHub.mjs export --format=csv
`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

const cmd = process.argv[2];
const args = parseArgs(process.argv);

switch (cmd) {
  case "list":    cmdList(); break;
  case "create":  cmdCreate(args); break;
  case "feed":    cmdFeed(args); break;
  case "export":  cmdExport(args); break;
  case "reset":   cmdReset(); break;
  case "help":
  case "--help":
  case "-h":      cmdHelp(); break;
  default:
    if (!cmd) cmdHelp();
    else { console.error(`${CORAL}Unknown command: ${cmd}${RESET}`); cmdHelp(); process.exit(1); }
}
