/* AgentModals — modal forms for knowledge feeding and agent creation
 * Loaded as a classic script after state-manager.js.
 * Exposes window.AgentModals.
 * Calls window.StateManager methods and fires custom events the main
 * module script listens to via hub.on().
 */
(function () {
  const SKILL_CATEGORIES = [
    "Spacing", "Tone", "Motion", "Naming", "Story", "Metaphor",
    "Depth", "Focus", "Density", "Flows", "Accessibility", "Performance",
    "Architecture", "Testing", "Research", "Other",
  ];

  const SPECIALIZATIONS = [
    { id: "design", label: "Design" },
    { id: "coding", label: "Coding" },
    { id: "testing", label: "Testing" },
    { id: "writing", label: "Writing" },
    { id: "research", label: "Research" },
    { id: "naming", label: "Naming" },
    { id: "typography", label: "Typography" },
  ];

  /* ---- Shared modal infrastructure ---- */

  function injectStyles() {
    if (document.getElementById("agent-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "agent-modal-styles";
    style.textContent = `
      .agent-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(2, 3, 8, 0.78);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .agent-modal-overlay.open { opacity: 1; }

      .agent-modal {
        background: #0a0f1e;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 28px 32px 24px;
        width: min(480px, 92vw);
        max-height: 88vh;
        overflow-y: auto;
        box-shadow: 0 24px 64px rgba(0,0,0,0.6);
        transform: translateY(12px);
        transition: transform 0.25s cubic-bezier(0.22,1,0.36,1);
      }
      .agent-modal-overlay.open .agent-modal { transform: translateY(0); }

      .modal-title {
        font-family: "Syne", sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #f6f0e8;
        margin-bottom: 6px;
      }
      .modal-sub {
        font-size: 13px;
        color: #a8b0c4;
        margin-bottom: 22px;
        font-family: "JetBrains Mono", monospace;
      }

      .modal-field { margin-bottom: 16px; }
      .modal-label {
        display: block;
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a8b0c4;
        margin-bottom: 6px;
      }
      .modal-input,
      .modal-select,
      .modal-textarea {
        width: 100%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px;
        color: #f6f0e8;
        font-family: "Newsreader", Georgia, serif;
        font-size: 14px;
        padding: 9px 12px;
        outline: none;
        transition: border-color 0.15s;
        box-sizing: border-box;
      }
      .modal-input:focus,
      .modal-select:focus,
      .modal-textarea:focus {
        border-color: rgba(255, 154, 60, 0.6);
      }
      .modal-select option { background: #0a0f1e; }
      .modal-textarea { resize: vertical; min-height: 80px; }

      .modal-color-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .modal-color-swatch {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.15s, border-color 0.15s;
      }
      .modal-color-swatch:hover { transform: scale(1.15); }
      .modal-color-swatch.selected { border-color: #fff; transform: scale(1.15); }

      .modal-spec-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .modal-spec-chip {
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.15);
        background: transparent;
        color: #a8b0c4;
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: 0.08em;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
      }
      .modal-spec-chip.selected {
        background: rgba(255, 154, 60, 0.2);
        border-color: rgba(255, 154, 60, 0.5);
        color: #ffc56d;
      }

      .modal-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 24px;
      }
      .modal-btn {
        padding: 9px 20px;
        border-radius: 8px;
        border: none;
        font-family: "Syne", sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s, transform 0.15s;
      }
      .modal-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      .modal-btn-primary { background: #ff9a3c; color: #050810; }
      .modal-btn-ghost {
        background: transparent;
        color: #a8b0c4;
        border: 1px solid rgba(255,255,255,0.12);
      }

      .modal-error {
        color: #ff8f82;
        font-size: 12px;
        font-family: "JetBrains Mono", monospace;
        margin-top: 6px;
        display: none;
      }
      .modal-error.visible { display: block; }

      @media (prefers-reduced-motion: reduce) {
        .agent-modal-overlay, .agent-modal { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function createOverlay(id) {
    let overlay = document.getElementById(id);
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = id;
    overlay.className = "agent-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay(overlay);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeOverlay(overlay);
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function openOverlay(overlay, label) {
    overlay.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-label", label);
    overlay.classList.add("open");
    const firstInput = overlay.querySelector("input, select, textarea, button");
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }

  function closeOverlay(overlay) {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  /* ---- Feed Skill Modal ---- */

  function buildFeedModal() {
    const overlay = createOverlay("feed-modal");
    overlay.innerHTML = `
      <div class="agent-modal">
        <div class="modal-title">Feed a skill</div>
        <div class="modal-sub" id="feed-modal-sub">Teaching · <span id="feed-agent-name">—</span></div>

        <div class="modal-field">
          <label class="modal-label" for="feed-category">Skill category</label>
          <select class="modal-select" id="feed-category">
            ${SKILL_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>

        <div class="modal-field">
          <label class="modal-label" for="feed-quote">What did this agent learn?</label>
          <textarea class="modal-textarea" id="feed-quote" placeholder="e.g. Prefer optical centering over mathematical center for hero blocks." maxlength="280"></textarea>
          <div class="modal-error" id="feed-error">Please enter a learning before submitting.</div>
        </div>

        <div class="modal-actions">
          <button type="button" class="modal-btn modal-btn-ghost" id="feed-cancel">Cancel</button>
          <button type="button" class="modal-btn modal-btn-primary" id="feed-submit">Feed skill</button>
        </div>
      </div>
    `;

    overlay.querySelector("#feed-cancel").addEventListener("click", () => closeOverlay(overlay));
    overlay.querySelector("#feed-submit").addEventListener("click", () => submitFeed());
    overlay.querySelector("#feed-quote").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitFeed();
    });

    return overlay;
  }

  let _feedAgentId = null;

  function openFeedModal(agentId) {
    if (!window.StateManager) return;
    injectStyles();
    _feedAgentId = agentId;

    let overlay = document.getElementById("feed-modal");
    if (!overlay) overlay = buildFeedModal();

    const hub = window._agentHub;
    const agent = hub ? hub.findAgent(agentId) : null;
    const nameEl = overlay.querySelector("#feed-agent-name");
    if (nameEl && agent) nameEl.textContent = agent.name;

    overlay.querySelector("#feed-quote").value = "";
    overlay.querySelector("#feed-error").classList.remove("visible");

    openOverlay(overlay, "Feed skill to agent");
  }

  function submitFeed() {
    const overlay = document.getElementById("feed-modal");
    const quote = overlay.querySelector("#feed-quote").value.trim();
    const part = overlay.querySelector("#feed-category").value;
    const errorEl = overlay.querySelector("#feed-error");

    if (!quote) {
      errorEl.classList.add("visible");
      overlay.querySelector("#feed-quote").focus();
      return;
    }
    errorEl.classList.remove("visible");

    const hub = window._agentHub;
    if (hub && _feedAgentId) {
      hub.addLearning(_feedAgentId, { part, quote });
    }
    closeOverlay(overlay);
  }

  /* ---- Create Agent Modal ---- */

  const PALETTE = [
    { hex: "#c8b4ff", label: "Violet" },
    { hex: "#ff9a4a", label: "Ember" },
    { hex: "#62ffc4", label: "Mint" },
    { hex: "#ff8f82", label: "Coral" },
    { hex: "#7dd3fc", label: "Sky" },
    { hex: "#fde68a", label: "Gold" },
    { hex: "#f0abfc", label: "Lilac" },
    { hex: "#6ee7b7", label: "Sage" },
  ];

  let _selectedColor = PALETTE[0].hex;
  let _selectedSpecs = [];

  function buildCreateModal() {
    const overlay = createOverlay("create-modal");
    overlay.innerHTML = `
      <div class="agent-modal">
        <div class="modal-title">Summon a new agent</div>
        <div class="modal-sub">It starts as a Seed and grows with every skill you feed it.</div>

        <div class="modal-field">
          <label class="modal-label" for="create-name">Agent name</label>
          <input class="modal-input" id="create-name" type="text" placeholder="e.g. Researcher" maxlength="40" autocomplete="off" />
          <div class="modal-error" id="create-error">Please give this agent a name.</div>
        </div>

        <div class="modal-field">
          <label class="modal-label">Colour</label>
          <div class="modal-color-row" id="create-color-row">
            ${PALETTE.map((p, i) =>
              `<button type="button" class="modal-color-swatch${i === 0 ? " selected" : ""}"
                style="background:${p.hex}" data-hex="${p.hex}"
                aria-label="${p.label}" title="${p.label}"></button>`
            ).join("")}
          </div>
        </div>

        <div class="modal-field">
          <label class="modal-label" for="create-lede">Short bio <span style="opacity:0.5">(optional)</span></label>
          <input class="modal-input" id="create-lede" type="text" placeholder="What does this agent do best?" maxlength="120" autocomplete="off" />
        </div>

        <div class="modal-field">
          <label class="modal-label">Specializations <span style="opacity:0.5">(optional)</span></label>
          <div class="modal-spec-row" id="create-spec-row">
            ${SPECIALIZATIONS.map((s) =>
              `<button type="button" class="modal-spec-chip" data-id="${s.id}">${s.label}</button>`
            ).join("")}
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="modal-btn modal-btn-ghost" id="create-cancel">Cancel</button>
          <button type="button" class="modal-btn modal-btn-primary" id="create-submit">Summon agent</button>
        </div>
      </div>
    `;

    /* Color swatches */
    _selectedColor = PALETTE[0].hex;
    overlay.querySelector("#create-color-row").addEventListener("click", (e) => {
      const swatch = e.target.closest(".modal-color-swatch");
      if (!swatch) return;
      overlay.querySelectorAll(".modal-color-swatch").forEach((s) => s.classList.remove("selected"));
      swatch.classList.add("selected");
      _selectedColor = swatch.dataset.hex;
    });

    /* Specialization chips */
    _selectedSpecs = [];
    overlay.querySelector("#create-spec-row").addEventListener("click", (e) => {
      const chip = e.target.closest(".modal-spec-chip");
      if (!chip) return;
      const id = chip.dataset.id;
      if (_selectedSpecs.includes(id)) {
        _selectedSpecs = _selectedSpecs.filter((s) => s !== id);
        chip.classList.remove("selected");
      } else {
        _selectedSpecs.push(id);
        chip.classList.add("selected");
      }
    });

    overlay.querySelector("#create-cancel").addEventListener("click", () => closeOverlay(overlay));
    overlay.querySelector("#create-submit").addEventListener("click", () => submitCreate());
    overlay.querySelector("#create-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitCreate();
    });

    return overlay;
  }

  function openCreateModal() {
    injectStyles();
    _selectedColor = PALETTE[0].hex;
    _selectedSpecs = [];

    let overlay = document.getElementById("create-modal");
    if (!overlay) overlay = buildCreateModal();

    /* Reset form */
    overlay.querySelector("#create-name").value = "";
    overlay.querySelector("#create-lede").value = "";
    overlay.querySelector("#create-error").classList.remove("visible");
    overlay.querySelectorAll(".modal-color-swatch").forEach((s, i) => s.classList.toggle("selected", i === 0));
    overlay.querySelectorAll(".modal-spec-chip").forEach((c) => c.classList.remove("selected"));

    openOverlay(overlay, "Create new agent");
  }

  function submitCreate() {
    const overlay = document.getElementById("create-modal");
    const name = overlay.querySelector("#create-name").value.trim();
    const errorEl = overlay.querySelector("#create-error");

    if (!name) {
      errorEl.classList.add("visible");
      overlay.querySelector("#create-name").focus();
      return;
    }
    errorEl.classList.remove("visible");

    const hub = window._agentHub;
    if (hub) {
      hub.addAgent({
        name,
        color: _selectedColor,
        lede: overlay.querySelector("#create-lede").value.trim(),
        specialization: [..._selectedSpecs],
      });
    }
    closeOverlay(overlay);
  }

  window.AgentModals = { openFeedModal, openCreateModal };
})();
