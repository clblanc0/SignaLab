const STORAGE_KEY = "signalab-agent-state-v1";

const agents = [
  {
    id: "scout",
    name: "Discovery Scout",
    job: "Turns a mission into people, organizations, communities, and search angles.",
    output: "Candidate targets and source queries"
  },
  {
    id: "qualifier",
    name: "Relevance Analyst",
    job: "Scores targets by fit, access, urgency, and learning value.",
    output: "Priority rationale and next action"
  },
  {
    id: "outreach",
    name: "Outreach Strategist",
    job: "Creates concise human-reviewed email, LinkedIn, and referral drafts.",
    output: "Manual-send outreach drafts"
  },
  {
    id: "learning",
    name: "Sector Learning Synthesizer",
    job: "Captures market signals, open questions, and briefing notes.",
    output: "Sector brief entries"
  }
];

const starterState = {
  targets: [
    {
      id: crypto.randomUUID(),
      name: "Alyssa Morgan",
      organization: "Cedar Health Labs",
      role: "Director of Innovation",
      sector: "Digital health",
      channel: "Email",
      reason: "Evaluates early-stage tools that improve patient intake, operational analytics, and care team workflows.",
      fit: 5,
      access: 3,
      urgency: 4,
      status: "Research"
    },
    {
      id: crypto.randomUUID(),
      name: "Marcus Reed",
      organization: "Gridline Ventures",
      role: "Platform Partner",
      sector: "Climate infrastructure",
      channel: "Warm referral",
      reason: "Works with portfolio companies selling into utilities, logistics, and industrial operations.",
      fit: 4,
      access: 4,
      urgency: 3,
      status: "Shortlist"
    },
    {
      id: crypto.randomUUID(),
      name: "Priya Nair",
      organization: "Midwest Manufacturing Council",
      role: "Program Lead",
      sector: "Advanced manufacturing",
      channel: "LinkedIn manual",
      reason: "Runs operator roundtables and could validate pain points across several industrial buyer groups.",
      fit: 4,
      access: 3,
      urgency: 5,
      status: "Research"
    }
  ],
  drafts: [],
  notes: [
    {
      id: crypto.randomUUID(),
      sector: "Digital health",
      insight: "Operational buyers respond better to workflow savings than abstract AI positioning.",
      source: "Customer discovery synthesis"
    },
    {
      id: crypto.randomUUID(),
      sector: "Climate infrastructure",
      insight: "Partnership paths often run through consultants and platform teams, not only direct operators.",
      source: "Market scan"
    }
  ],
  runs: [],
  tasks: []
};

let state = loadState();

const views = document.querySelectorAll(".view");
const navItems = document.querySelectorAll(".nav-item");
const targetForm = document.querySelector("#targetForm");
const noteForm = document.querySelector("#noteForm");
const missionForm = document.querySelector("#missionForm");
const targetSearch = document.querySelector("#targetSearch");

document.querySelector("#seedDemo").addEventListener("click", () => {
  state = structuredClone(starterState);
  persist();
  render();
});

document.querySelector("#generateDrafts").addEventListener("click", () => {
  state.drafts = state.targets.map(createDraft);
  persist();
  render();
});

document.querySelector("#runDefaultMission").addEventListener("click", () => {
  runMission({
    sector: "Digital health",
    persona: "Innovation and operations leaders at regional health systems",
    goal: "Find customer discovery calls for a workflow intelligence product and identify partnership paths.",
    constraints: "Keep LinkedIn manual. Prefer warm referrals, operators, and people who can explain buying paths."
  });
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((nav) => nav.classList.remove("active"));
    views.forEach((view) => view.classList.remove("active"));
    item.classList.add("active");
    document.querySelector(`#${item.dataset.view}`).classList.add("active");
  });
});

targetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(targetForm);
  state.targets.push({
    id: crypto.randomUUID(),
    name: form.get("name").trim(),
    organization: form.get("organization").trim(),
    role: form.get("role").trim(),
    sector: form.get("sector").trim(),
    channel: form.get("channel"),
    reason: form.get("reason").trim(),
    fit: Number(form.get("fit")),
    access: Number(form.get("access")),
    urgency: Number(form.get("urgency")),
    status: "Research"
  });
  targetForm.reset();
  targetForm.fit.value = 4;
  targetForm.access.value = 3;
  targetForm.urgency.value = 3;
  persist();
  render();
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(noteForm);
  state.notes.push({
    id: crypto.randomUUID(),
    sector: form.get("sector").trim(),
    insight: form.get("insight").trim(),
    source: form.get("source").trim()
  });
  noteForm.reset();
  persist();
  render();
});

missionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(missionForm);
  runMission({
    sector: form.get("sector").trim(),
    persona: form.get("persona").trim(),
    goal: form.get("goal").trim(),
    constraints: form.get("constraints").trim()
  });
  missionForm.reset();
});

targetSearch.addEventListener("input", renderTargets);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return createEmptyState();
  }
  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return createEmptyState();
  }
}

function createEmptyState() {
  return { targets: [], drafts: [], notes: [], runs: [], tasks: [] };
}

function normalizeState(savedState) {
  return {
    targets: savedState.targets || [],
    drafts: savedState.drafts || [],
    notes: savedState.notes || [],
    runs: savedState.runs || [],
    tasks: savedState.tasks || []
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function scoreTarget(target) {
  const contextBonus = target.reason.length > 80 ? 8 : 0;
  return Math.round(target.fit * 10 + target.access * 7 + target.urgency * 8 + contextBonus);
}

function createDraft(target) {
  const subject = `Signalab <> ${target.organization || target.name}`;
  const linkedinNote = `Hi ${firstName(target.name)}, I am building Signalab and researching ${target.sector}. Your work as ${target.role || "a leader in the space"} stood out because ${target.reason.toLowerCase()} I would value a short perspective exchange if you are open to it.`;
  const email = [
    `Subject: ${subject}`,
    "",
    `Hi ${firstName(target.name)},`,
    "",
    `I am building Signalab and doing customer discovery around ${target.sector}. I came across your work${target.organization ? ` at ${target.organization}` : ""}, and it stood out because ${target.reason.toLowerCase()}`,
    "",
    "I am not trying to sell anything right now. I am trying to understand the real problems, buying paths, and partnership opportunities in this space.",
    "",
    "Would you be open to a 20 minute conversation next week?",
    "",
    "Best,",
    "Christian"
  ].join("\n");

  return {
    id: crypto.randomUUID(),
    targetId: target.id,
    name: target.name,
    channel: target.channel,
    linkedinNote,
    email
  };
}

function runMission(mission) {
  const run = createAgentRun(mission);
  state.runs.unshift(run);
  state.targets.push(...run.createdTargets);
  state.notes.push(...run.createdNotes);
  state.tasks.unshift(...run.tasks);
  state.drafts.push(...run.createdTargets.map(createDraft));
  persist();
  render();
  showView("agents");
}

function createAgentRun(mission) {
  const createdTargets = buildCandidateTargets(mission);
  const createdNotes = buildLearningNotes(mission, createdTargets);
  const tasks = buildMissionTasks(mission, createdTargets);
  const agentOutputs = [
    {
      agentId: "scout",
      summary: `Mapped ${mission.persona} into ${createdTargets.length} starter target profiles and ${searchAngles(mission).length} research angles.`,
      items: searchAngles(mission)
    },
    {
      agentId: "qualifier",
      summary: `Prioritized targets by buyer proximity, access path, and learning value for ${mission.sector}.`,
      items: createdTargets.map((target) => `${target.name}: score ${scoreTarget(target)} · ${target.reason}`)
    },
    {
      agentId: "outreach",
      summary: "Prepared manual-send outreach drafts and avoided automated LinkedIn actions.",
      items: createdTargets.map((target) => `${target.channel}: ${target.name}`)
    },
    {
      agentId: "learning",
      summary: `Created ${createdNotes.length} learning notes and open questions for future briefings.`,
      items: createdNotes.map((note) => note.insight)
    }
  ];

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    mission,
    agentOutputs,
    createdTargets,
    createdNotes,
    tasks
  };
}

function buildCandidateTargets(mission) {
  const sector = mission.sector;
  const persona = mission.persona;
  const templates = [
    {
      name: `${sector} Operator Interview Lead`,
      organization: "Target account to research",
      role: persona,
      channel: "Email",
      reason: `Likely to explain daily pain points, current workflows, buying triggers, and objections around ${mission.goal.toLowerCase()}`,
      fit: 5,
      access: 3,
      urgency: 4
    },
    {
      name: `${sector} Partnership Connector`,
      organization: "Industry association or accelerator",
      role: "Program, community, or platform lead",
      channel: "Warm referral",
      reason: `Can introduce multiple ${persona.toLowerCase()} and reveal which partnerships already have trust in the market.`,
      fit: 4,
      access: 4,
      urgency: 3
    },
    {
      name: `${sector} Public Voice`,
      organization: "Conference, podcast, newsletter, or LinkedIn community",
      role: "Speaker, writer, or practitioner",
      channel: "LinkedIn manual",
      reason: `Publishes opinions about ${sector}, making it easier to write a specific comment or manual connection note.`,
      fit: 4,
      access: 3,
      urgency: 4
    }
  ];

  return templates.map((target) => ({
    ...target,
    id: crypto.randomUUID(),
    sector,
    status: "Research"
  }));
}

function buildLearningNotes(mission, targets) {
  return [
    {
      id: crypto.randomUUID(),
      sector: mission.sector,
      insight: `Customer discovery should test whether ${mission.persona.toLowerCase()} feel urgent pain around: ${mission.goal}`,
      source: "Agent mission"
    },
    {
      id: crypto.randomUUID(),
      sector: mission.sector,
      insight: `Best early outreach paths for this mission: ${[...new Set(targets.map((target) => target.channel))].join(", ")}.`,
      source: "Agent mission"
    },
    {
      id: crypto.randomUUID(),
      sector: mission.sector,
      insight: `Open question: what budget owner, partner, or workflow system already controls adoption in ${mission.sector}?`,
      source: "Agent mission"
    }
  ];
}

function buildMissionTasks(mission, targets) {
  return [
    {
      id: crypto.randomUUID(),
      title: `Find 10 real ${mission.persona.toLowerCase()} names`,
      owner: "Discovery Scout",
      status: "Queued"
    },
    {
      id: crypto.randomUUID(),
      title: `Validate the top 3 ${mission.sector} pain hypotheses in calls`,
      owner: "Relevance Analyst",
      status: "Queued"
    },
    ...targets.map((target) => ({
      id: crypto.randomUUID(),
      title: `Review and personalize draft for ${target.name}`,
      owner: "Outreach Strategist",
      status: "Queued"
    }))
  ];
}

function searchAngles(mission) {
  return [
    `"${mission.sector}" "${mission.persona}" conference speaker`,
    `"${mission.sector}" "${mission.persona}" podcast`,
    `"${mission.sector}" association innovation program`,
    `"${mission.sector}" startup pilot partnership`,
    `"${mission.sector}" buyer pain points ${mission.goal.split(" ").slice(0, 4).join(" ")}`
  ];
}

function firstName(name) {
  return name.split(" ")[0] || name;
}

function render() {
  renderMetrics();
  renderAgents();
  renderRuns();
  renderFocus();
  renderTargets();
  renderDrafts();
  renderBrief();
}

function renderMetrics() {
  document.querySelector("#targetCount").textContent = state.targets.length;
  document.querySelector("#priorityCount").textContent = state.targets.filter((target) => scoreTarget(target) >= 78).length;
  document.querySelector("#draftCount").textContent = state.drafts.length;
  document.querySelector("#noteCount").textContent = state.notes.length;
  document.querySelector("#agentRunCount").textContent = state.runs.length;
}

function renderAgents() {
  document.querySelector("#agentRoster").innerHTML = agents.map((agent) => `
    <article class="agent-card">
      <div class="agent-icon">${escapeHtml(agent.name.slice(0, 1))}</div>
      <div>
        <h3>${escapeHtml(agent.name)}</h3>
        <p>${escapeHtml(agent.job)}</p>
        <span class="badge">${escapeHtml(agent.output)}</span>
      </div>
    </article>
  `).join("");
}

function renderRuns() {
  const history = document.querySelector("#runHistory");
  if (!state.runs.length) {
    history.className = "run-history empty-state";
    history.textContent = "Run a mission to see agent outputs.";
    return;
  }

  history.className = "run-history";
  history.innerHTML = state.runs.map((run) => `
    <article class="run-card">
      <div class="run-header">
        <div>
          <h3>${escapeHtml(run.mission.sector)} mission</h3>
          <p class="meta">${escapeHtml(formatDate(run.createdAt))} · ${escapeHtml(run.mission.persona)}</p>
        </div>
        <span class="badge hot">${run.createdTargets.length} targets</span>
      </div>
      <p>${escapeHtml(run.mission.goal)}</p>
      ${run.mission.constraints ? `<p class="meta">Constraints: ${escapeHtml(run.mission.constraints)}</p>` : ""}
      <div class="agent-output-grid">
        ${run.agentOutputs.map((output) => renderAgentOutput(output)).join("")}
      </div>
      <div class="task-list">
        <strong>Queued tasks</strong>
        ${run.tasks.map((task) => `
          <div class="task">
            <span>${escapeHtml(task.owner)}</span>
            <p>${escapeHtml(task.title)}</p>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function renderAgentOutput(output) {
  const agent = agents.find((item) => item.id === output.agentId);
  return `
    <section class="agent-output">
      <h4>${escapeHtml(agent?.name || output.agentId)}</h4>
      <p>${escapeHtml(output.summary)}</p>
      <ul>
        ${output.items.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderFocus() {
  const focusList = document.querySelector("#focusList");
  const topTargets = [...state.targets].sort((a, b) => scoreTarget(b) - scoreTarget(a)).slice(0, 4);
  if (!topTargets.length) {
    focusList.className = "focus-list empty-state";
    focusList.textContent = "Add targets to see prioritized actions.";
    return;
  }

  focusList.className = "focus-list";
  focusList.innerHTML = topTargets.map((target) => `
    <article class="focus-item">
      <div class="score">${scoreTarget(target)}</div>
      <div>
        <strong>${escapeHtml(target.name)}</strong>
        <p class="meta">${escapeHtml(target.role || "Unknown role")} ${target.organization ? `at ${escapeHtml(target.organization)}` : ""}</p>
        <p>${escapeHtml(nextAction(target))}</p>
      </div>
    </article>
  `).join("");
}

function renderTargets() {
  const list = document.querySelector("#targetList");
  const query = targetSearch.value.trim().toLowerCase();
  const targets = [...state.targets]
    .filter((target) => [target.name, target.organization, target.role, target.sector].join(" ").toLowerCase().includes(query))
    .sort((a, b) => scoreTarget(b) - scoreTarget(a));

  if (!targets.length) {
    list.innerHTML = `<div class="empty-state">No matching targets yet.</div>`;
    return;
  }

  list.innerHTML = targets.map((target) => `
    <article class="target-card">
      <div class="badge-row">
        <span class="badge ${scoreTarget(target) >= 78 ? "hot" : ""}">Score ${scoreTarget(target)}</span>
        <span class="badge">${escapeHtml(target.channel)}</span>
        <span class="badge">${escapeHtml(target.sector)}</span>
      </div>
      <div>
        <h3>${escapeHtml(target.name)}</h3>
        <p class="meta">${escapeHtml(target.role || "Unknown role")} ${target.organization ? `at ${escapeHtml(target.organization)}` : ""}</p>
      </div>
      <p>${escapeHtml(target.reason)}</p>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="draft" data-id="${target.id}">Draft</button>
        <button class="secondary-button" type="button" data-action="advance" data-id="${target.id}">${escapeHtml(target.status)}</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const target = state.targets.find((item) => item.id === button.dataset.id);
      if (!target) return;
      if (button.dataset.action === "draft") {
        state.drafts = state.drafts.filter((draft) => draft.targetId !== target.id);
        state.drafts.push(createDraft(target));
      } else {
        target.status = nextStatus(target.status);
      }
      persist();
      render();
    });
  });
}

function renderDrafts() {
  const list = document.querySelector("#draftList");
  if (!state.drafts.length) {
    list.className = "draft-list empty-state";
    list.textContent = "Add targets, then generate drafts.";
    return;
  }

  list.className = "draft-list";
  list.innerHTML = state.drafts.map((draft) => `
    <article class="draft">
      <h3>${escapeHtml(draft.name)} · ${escapeHtml(draft.channel)}</h3>
      <p class="meta">LinkedIn manual note</p>
      <pre>${escapeHtml(draft.linkedinNote)}</pre>
      <p class="meta">Email draft</p>
      <pre>${escapeHtml(draft.email)}</pre>
    </article>
  `).join("");
}

function renderBrief() {
  const list = document.querySelector("#briefList");
  if (!state.notes.length) {
    list.className = "brief-list empty-state";
    list.textContent = "Add learning notes to build a brief.";
    return;
  }

  const grouped = state.notes.reduce((groups, note) => {
    groups[note.sector] ||= [];
    groups[note.sector].push(note);
    return groups;
  }, {});

  list.className = "brief-list";
  list.innerHTML = Object.entries(grouped).map(([sector, notes]) => `
    <article class="brief-sector">
      <h3>${escapeHtml(sector)}</h3>
      <ul>
        ${notes.map((note) => `
          <li>
            ${escapeHtml(note.insight)}
            ${note.source ? `<span class="meta">Source: ${escapeHtml(note.source)}</span>` : ""}
          </li>
        `).join("")}
      </ul>
    </article>
  `).join("");
}

function nextAction(target) {
  if (target.channel === "LinkedIn manual") {
    return "Review their recent posts, then send a manual connection note or thoughtful comment.";
  }
  if (target.channel === "Warm referral") {
    return "Identify the shared contact and ask for a specific, low-friction introduction.";
  }
  if (target.channel === "Event intro") {
    return "Look for upcoming panels, talks, or community events where a contextual intro is natural.";
  }
  return "Draft a concise customer discovery email with one clear question and a 20 minute ask.";
}

function nextStatus(status) {
  const statuses = ["Research", "Shortlist", "Drafted", "Contacted", "Follow-up", "Closed"];
  const index = statuses.indexOf(status);
  return statuses[(index + 1) % statuses.length];
}

function showView(viewId) {
  navItems.forEach((nav) => nav.classList.toggle("active", nav.dataset.view === viewId));
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
