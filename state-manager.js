/* StateManager — Agent Hub state layer
 * Loaded as a classic script before the Three.js module.
 * Exposes window.StateManager.
 */
(function () {
  const STORAGE_KEY = 'agent-hub-v1';

  const STAGE_THRESHOLDS = [
    { stage: 0, xp: 0 },   // Seed
    { stage: 1, xp: 10 },  // Sprout
    { stage: 2, xp: 40 },  // Bloom
    { stage: 3, xp: 100 }, // Fruit
  ];

  function calcStage(xp) {
    let s = 0;
    for (const t of STAGE_THRESHOLDS) {
      if (xp >= t.xp) s = t.stage;
    }
    return s;
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 2) return 'Just now';
    if (m < 60) return `${m} minutes ago`;
    if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  }

  /* Migrate old {learningsList, learnings(count)} → new format */
  function migrate(agents) {
    return agents.map((a) => {
      const xp = typeof a.xp === 'number' ? a.xp : (a.learnings || 0) * 10;
      const learnings = Array.isArray(a.learnings)
        ? a.learnings
        : (a.learningsList || []).map((l, i) => ({
            id: `learn-seed-${a.id}-${i}`,
            part: l.part,
            quote: l.quote,
            timestamp: Date.now() - i * 86400000,
            context: 'seed',
          }));
      return {
        id: a.id,
        name: a.name,
        short: a.short || a.id,
        color: a.color,
        status: a.status || 'idle',
        stage: typeof a.stage === 'number' ? a.stage : calcStage(xp),
        xp,
        lede: a.lede || '',
        learnings,
        specialization: a.specialization || [],
        reliability: typeof a.reliability === 'number' ? a.reliability : 0.5,
        executionHistory: a.executionHistory || [],
      };
    });
  }

  class StateManager {
    constructor(seedAgents) {
      this._listeners = {};
      const stored = this._load();
      this._agents = stored ? migrate(stored) : migrate(seedAgents);
      this._save();
    }

    getAgents() {
      return this._agents;
    }

    findAgent(id) {
      return this._agents.find((a) => a.id === id) || null;
    }

    addLearning(agentId, { part, quote }) {
      const agent = this.findAgent(agentId);
      if (!agent) return null;
      const learning = {
        id: `learn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        part,
        quote,
        timestamp: Date.now(),
        context: 'user-fed',
      };
      agent.learnings.push(learning);
      const xpGain = 10;
      agent.xp += xpGain;
      const prevStage = agent.stage;
      agent.stage = calcStage(agent.xp);
      const promoted = agent.stage > prevStage;
      this._save();
      this.emit('learningAdded', { agentId, learning, xpGain, prevStage, newStage: agent.stage, promoted });
      return { learning, prevStage, newStage: agent.stage, promoted };
    }

    addAgent(config) {
      const id = config.id || `agent-${Date.now()}`;
      const agent = {
        id,
        name: config.name,
        short: config.short || config.name.toLowerCase().replace(/\s+/g, '-'),
        color: typeof config.color === 'string'
          ? (parseInt(config.color.replace('#', ''), 16) || 0x88ccff)
          : (config.color || 0x88ccff),
        status: 'idle',
        stage: 0,
        xp: 0,
        lede: config.lede || '',
        learnings: [],
        specialization: config.specialization || [],
        reliability: 0.5,
        executionHistory: [],
      };
      this._agents.push(agent);
      this._save();
      this.emit('agentAdded', { agent });
      return agent;
    }

    getTotalLearnings() {
      return this._agents.reduce((sum, a) => sum + a.learnings.length, 0);
    }

    getActiveCount() {
      return this._agents.filter((a) => a.status === 'working').length;
    }

    on(event, cb) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(cb);
    }

    emit(event, data) {
      (this._listeners[event] || []).forEach((cb) => cb(data));
    }

    _load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
      } catch (_) {
        return null;
      }
    }

    _save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._agents));
      } catch (e) {
        console.warn('[StateManager] localStorage write failed:', e);
      }
    }
  }

  StateManager.timeAgo = timeAgo;
  window.StateManager = StateManager;
})();
