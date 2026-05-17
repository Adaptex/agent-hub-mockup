/* AgentDrawerShared — learnings list (edit/remove), workspace copy, toasts
 * Load after state-manager.js on any design page.
 */
(function () {
  const STAGES = [
    { stage: 0, xp: 0 },
    { stage: 1, xp: 10 },
    { stage: 2, xp: 40 },
    { stage: 3, xp: 100 },
  ];

  function injectStyles() {
    if (document.getElementById('drawer-shared-styles')) return;
    const s = document.createElement('style');
    s.id = 'drawer-shared-styles';
    s.textContent = `
      .learn-row-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .learn-row-btn {
        font-family: "JetBrains Mono", monospace;
        font-size: 9px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid rgba(128,128,128,0.35);
        background: transparent;
        color: inherit;
        opacity: 0.75;
        cursor: pointer;
      }
      .learn-row-btn:hover { opacity: 1; }
      .learn-row-btn--danger { border-color: rgba(220,80,80,0.45); color: #e88; }
      .learn-edit-form { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
      .learn-edit-input, .learn-edit-textarea {
        width: 100%;
        box-sizing: border-box;
        font-size: 13px;
        padding: 6px 8px;
        border-radius: 6px;
        border: 1px solid rgba(128,128,128,0.35);
        background: rgba(0,0,0,0.15);
        color: inherit;
        font-family: inherit;
      }
      .learn-edit-textarea { min-height: 56px; resize: vertical; }
      .agent-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(12px);
        z-index: 400;
        padding: 10px 18px;
        border-radius: 8px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.06em;
        background: rgba(10, 14, 24, 0.92);
        color: #e8e4dc;
        border: 1px solid rgba(255,255,255,0.12);
        opacity: 0;
        transition: opacity 0.2s, transform 0.25s;
        pointer-events: none;
        max-width: min(420px, 92vw);
        text-align: center;
      }
      .agent-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(s);
  }

  function hub() {
    return window._agentHub || null;
  }

  function timeAgo(ts) {
    if (window.StateManager && window.StateManager.timeAgo) return window.StateManager.timeAgo(ts);
    return 'Recently';
  }

  function xpProgress(agent) {
    const st = Math.min(agent.stage ?? 0, 3);
    const floor = STAGES[st].xp;
    const ceil = st < 3 ? STAGES[st + 1].xp : floor + 50;
    const xp = agent.xp ?? 0;
    const pct = st >= 3 ? 100 : Math.min(100, Math.round(((xp - floor) / Math.max(1, ceil - floor)) * 100));
    return { pct, floor, ceil, xp };
  }

  function showToast(msg) {
    injectStyles();
    let el = document.getElementById('agent-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agent-toast';
      el.className = 'agent-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), 2400);
  }

  function buildWorkspaceMarkdown(agent) {
    const stageNames = ['Seed', 'Sprout', 'Bloom', 'Fruit'];
    const st = Math.min(agent.stage ?? 0, 3);
    const specs = (agent.specialization || []).join(', ') || '—';
    const rel = Math.round((agent.reliability ?? 0.5) * 100);
    const lines = [
      `# Agent: ${agent.name}`,
      '',
      `- **ID:** \`${agent.id}\``,
      `- **Status:** ${agent.status || 'idle'}`,
      `- **Stage:** ${stageNames[st]} (${agent.xp ?? 0} XP)`,
      `- **Reliability:** ${rel}%`,
      `- **Specializations:** ${specs}`,
      '',
      '## Bio',
      agent.lede || '—',
      '',
      '## Skills / learnings',
    ];
    const ls = agent.learnings || [];
    if (!ls.length) {
      lines.push('_No learnings yet._');
    } else {
      ls.forEach((l) => {
        lines.push(`### ${l.part || 'General'}`);
        lines.push(`> ${(l.quote || '').replace(/\n/g, ' ')}`);
        lines.push('');
      });
    }
    lines.push('', '---', '_Exported from Agent Hub (Phase 0 mockup). Paste into your workspace or AGENTS.md._');
    return lines.join('\n');
  }

  async function copyForWorkspace(agent) {
    if (!agent) {
      showToast('Select an agent first');
      return false;
    }
    const text = buildWorkspaceMarkdown(agent);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied agent profile for workspace');
      return true;
    } catch (_) {
      showToast('Copy failed — check browser permissions');
      return false;
    }
  }

  function renderLearnings(container, agentId, opts) {
    if (!container) return;
    injectStyles();
    const h = opts?.hub || hub();
    const agent = h ? h.findAgent(agentId) : null;
    const emptyText = opts?.emptyText || 'No learnings yet — feed this agent a skill.';
    const onChanged = opts?.onChanged;

    container.innerHTML = '';
    if (!agent) return;

    const ls = agent.learnings || [];
    if (!ls.length) {
      const empty = document.createElement('div');
      empty.className = opts?.emptyClass || 'learn-row';
      empty.style.opacity = '0.5';
      empty.style.fontStyle = 'italic';
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }

    [...ls].reverse().forEach((learning) => {
      const row = document.createElement(opts?.rowTag || 'div');
      row.className = opts?.rowClass || 'learn-row';
      row.dataset.learningId = learning.id;

      const part = document.createElement('div');
      part.className = opts?.partClass || 'learn-part';
      part.textContent = learning.part || 'General';
      row.appendChild(part);

      if (opts?.quoteClass) {
        const quote = document.createElement('div');
        quote.className = opts.quoteClass;
        quote.textContent = learning.quote ? '"' + learning.quote + '"' : '';
        row.appendChild(quote);
      } else if (learning.quote) {
        row.appendChild(document.createTextNode(learning.quote));
      }

      const when = document.createElement('div');
      when.className = opts?.whenClass || 'learn-when';
      when.textContent = learning.timestamp ? timeAgo(learning.timestamp) : 'Recorded';
      row.appendChild(when);

      const actions = document.createElement('div');
      actions.className = 'learn-row-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'learn-row-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => showEditForm(row, agentId, learning, h, onChanged));

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'learn-row-btn learn-row-btn--danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        if (!h) return;
        if (!confirm('Remove this skill? XP will decrease by 10.')) return;
        h.removeLearning(agentId, learning.id);
        if (onChanged) onChanged();
      });

      actions.appendChild(editBtn);
      actions.appendChild(removeBtn);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  function showEditForm(row, agentId, learning, h, onChanged) {
    row.innerHTML = '';
    const form = document.createElement('div');
    form.className = 'learn-edit-form';

    const partIn = document.createElement('input');
    partIn.className = 'learn-edit-input';
    partIn.value = learning.part || '';
    partIn.placeholder = 'Category';
    partIn.setAttribute('aria-label', 'Skill category');

    const quoteIn = document.createElement('textarea');
    quoteIn.className = 'learn-edit-textarea';
    quoteIn.value = learning.quote || '';
    quoteIn.placeholder = 'Quote or rule';
    quoteIn.setAttribute('aria-label', 'Skill quote');

    const actions = document.createElement('div');
    actions.className = 'learn-row-actions';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'learn-row-btn';
    save.textContent = 'Save';
    save.addEventListener('click', () => {
      if (!h) return;
      const part = partIn.value.trim();
      const quote = quoteIn.value.trim();
      if (!part || !quote) {
        showToast('Category and quote are required');
        return;
      }
      h.updateLearning(agentId, learning.id, { part, quote });
      if (onChanged) onChanged();
    });

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'learn-row-btn';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => {
      if (onChanged) onChanged();
    });

    actions.appendChild(save);
    actions.appendChild(cancel);
    form.appendChild(partIn);
    form.appendChild(quoteIn);
    form.appendChild(actions);
    row.appendChild(form);
    partIn.focus();
  }

  window.AgentDrawerShared = {
    renderLearnings,
    copyForWorkspace,
    showToast,
    xpProgress,
    buildWorkspaceMarkdown,
  };
})();
