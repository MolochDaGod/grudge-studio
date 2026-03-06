/* ============================================
   GRUDGE STUDIO — AI Agents Chat
   7 agents · puter.ai.chat() · slash commands
   ============================================ */
(function () {
  'use strict';

  /* ---------- agents ---------- */
  const AGENTS = {
    code: {
      icon: '💻', name: 'Code Agent',
      system: 'You are the Grudge Studio Code Agent. You help write game code, debug issues, review pull requests, and suggest architecture improvements for the Grudge Warlords ecosystem. Use JavaScript, Node.js, Three.js, and Puter SDK knowledge. Be concise and provide code samples.',
    },
    art: {
      icon: '🎨', name: 'Art Agent',
      system: 'You are the Grudge Studio Art Agent. You advise on pixel art, sprite sheets, UI/UX design, animation, and visual effects for the Grudge Warlords game. Reference the ObjectStore asset library when relevant. Give specific technical art direction.',
    },
    lore: {
      icon: '📜', name: 'Lore Agent',
      system: 'You are the Grudge Studio Lore Agent. You create and maintain the lore for Grudge Warlords — factions, islands, NPCs, quests, world history. The game features Warriors, Mages, Rangers, and Worges across medieval island worlds with a Piglin invasion storyline. Write immersive content.',
    },
    balance: {
      icon: '⚖️', name: 'Balance Agent',
      system: 'You are the Grudge Studio Balance Agent. You analyze and tune game balance — combat damage, healing, class abilities, item stats, economy, progression curves. The game has 4 classes (Warrior, Mage, Ranger, Worge), 17 weapon types, 6 armor sets, shields, relics, and capes. Provide data-driven suggestions.',
    },
    qa: {
      icon: '🧪', name: 'QA Agent',
      system: 'You are the Grudge Studio QA Agent. You help write test plans, identify edge cases, report bugs, and verify fixes. Focus on functional testing, performance, and cross-browser compatibility for web-based game systems.',
    },
    mission: {
      icon: '🗺️', name: 'Mission Agent',
      system: 'You are the Grudge Studio Mission Agent. You design quests, mission chains, daily events, and crew progression content. The game features crew systems (3-5 members, daily rotations), faction leveling, harvesting professions, and AI companion missions. Create engaging mission structures.',
    },
    director: {
      icon: '🎬', name: 'Director Agent',
      system: 'You are the Grudge Studio Director Agent — the lead coordinator. You orchestrate the other agents, prioritize tasks, plan sprints, and make high-level design decisions. You have knowledge of all game systems. Give strategic, actionable guidance.',
    },
  };

  const agentKeys = Object.keys(AGENTS);

  /* ---------- state ---------- */
  let activeAgent = 'code';
  const histories = {};
  agentKeys.forEach(k => { histories[k] = []; });

  /* ---------- DOM ---------- */
  const agentList    = document.getElementById('agentList');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput    = document.getElementById('chatInput');
  const chatSendBtn  = document.getElementById('chatSendBtn');

  /* ---------- render agent list ---------- */
  function renderAgentList() {
    agentList.innerHTML = agentKeys.map(k => {
      const a = AGENTS[k];
      return `<div class="agent-item${k === activeAgent ? ' active' : ''}" data-agent="${k}">
        <span class="agent-icon">${a.icon}</span> ${a.name}
      </div>`;
    }).join('');
    agentList.querySelectorAll('.agent-item').forEach(el => {
      el.addEventListener('click', () => switchAgent(el.dataset.agent));
    });
  }

  function switchAgent(key) {
    activeAgent = key;
    renderAgentList();
    renderChat();
  }

  /* ---------- render chat ---------- */
  function renderChat() {
    const msgs = histories[activeAgent];
    if (msgs.length === 0) {
      const a = AGENTS[activeAgent];
      chatMessages.innerHTML = `<div class="chat-msg assistant">${a.icon} <b>${a.name}</b> ready. Ask me anything or type <code>/help</code></div>`;
    } else {
      chatMessages.innerHTML = msgs.map(m =>
        `<div class="chat-msg ${m.role}">${m.content}</div>`
      ).join('');
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /* ---------- send ---------- */
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';

    /* slash commands */
    if (text.startsWith('/')) {
      handleCommand(text);
      return;
    }

    pushMsg('user', text);
    pushMsg('assistant', '⏳ thinking…');
    renderChat();

    try {
      const agent = AGENTS[activeAgent];
      const messages = histories[activeAgent]
        .filter(m => m.role !== 'system')
        .slice(-20)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      // remove the placeholder
      histories[activeAgent].pop();

      const resp = await puter.ai.chat([
        { role: 'system', content: agent.system },
        ...messages,
      ]);

      const reply = typeof resp === 'string' ? resp
        : resp?.message?.content || resp?.text || JSON.stringify(resp);

      pushMsg('assistant', reply);
      log(`Chat with ${agent.name}`);
    } catch (e) {
      histories[activeAgent].pop(); // remove placeholder if still there
      pushMsg('assistant', '❌ Error: ' + (e.message || e));
    }
    renderChat();
  }

  function pushMsg(role, content) {
    histories[activeAgent].push({ role, content });
  }

  /* ---------- commands ---------- */
  function handleCommand(text) {
    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === '/help') {
      pushMsg('assistant',
        'Commands:\n' +
        '  /agent <name>  — switch agent (code, art, lore, balance, qa, mission, director)\n' +
        '  /agents        — list all agents\n' +
        '  /clear         — clear chat history\n' +
        '  /pipeline <msg> — send message to ALL agents sequentially\n' +
        '  /help          — show this help'
      );
    } else if (cmd === '/agent' && parts[1]) {
      const key = parts[1].toLowerCase();
      if (AGENTS[key]) { switchAgent(key); return; }
      else pushMsg('assistant', `Unknown agent "${parts[1]}". Try: ${agentKeys.join(', ')}`);
    } else if (cmd === '/agents') {
      pushMsg('assistant', agentKeys.map(k => `${AGENTS[k].icon} ${AGENTS[k].name} (/${k})`).join('\n'));
    } else if (cmd === '/clear') {
      histories[activeAgent] = [];
    } else if (cmd === '/pipeline') {
      const msg = parts.slice(1).join(' ');
      if (msg) runPipeline(msg);
      else pushMsg('assistant', 'Usage: /pipeline <message>');
    } else {
      pushMsg('assistant', `Unknown command: ${cmd}. Type /help`);
    }
    renderChat();
  }

  async function runPipeline(msg) {
    pushMsg('assistant', `🔄 Running pipeline across ${agentKeys.length} agents…`);
    renderChat();

    for (const key of agentKeys) {
      const agent = AGENTS[key];
      try {
        const resp = await puter.ai.chat([
          { role: 'system', content: agent.system },
          { role: 'user', content: msg },
        ]);
        const reply = typeof resp === 'string' ? resp
          : resp?.message?.content || resp?.text || JSON.stringify(resp);
        pushMsg('assistant', `${agent.icon} **${agent.name}**:\n${reply}`);
      } catch (e) {
        pushMsg('assistant', `${agent.icon} ${agent.name}: ❌ ${e.message || e}`);
      }
      renderChat();
    }
    pushMsg('assistant', '✅ Pipeline complete');
    renderChat();
    log('Pipeline executed');
  }

  /* ---------- events ---------- */
  chatSendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  /* ---------- helpers ---------- */
  function log(msg) {
    if (window.GrudgeStudio) window.GrudgeStudio.logActivity('[AI] ' + msg);
  }

  /* ---------- boot ---------- */
  renderAgentList();
  renderChat();
})();
