(() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const endOverlay = document.getElementById("end-overlay");

  // Map Definitions with unique trajectories, aesthetics, and decorations
  const MAPS = {
    grass: {
      id: "grass",
      name: "Pradaria Verde",
      theme: "Floresta",
      icon: "🌲",
      tag: "Floresta Clássica",
      desc: "Trilha em zigue-zague com curvas suaves e excelente espaço para construir defensores.",
      difficulty: "Normal",
      difficultyBadge: "Normal",
      bgColor: "#357a38",
      pathColor: "#c4a574",
      pathBorder: "#8d6e4a",
      pathPoints: [
        { x: -20, y: -16 },
        { x: -20, y: 6 },
        { x: -10, y: 6 },
        { x: -10, y: -8 },
        { x: 2, y: -8 },
        { x: 2, y: 12 },
        { x: 14, y: 12 },
        { x: 14, y: -14 },
        { x: 20, y: -14 },
      ],
      decorations: [
        { x: -14, y: -12, type: "tree" },
        { x: -6, y: 14, type: "tree" },
        { x: 8, y: -2, type: "tree" },
        { x: 18, y: 8, type: "tree" },
        { x: -16, y: 14, type: "tree" },
        { x: 10, y: -16, type: "tree" },
        { x: -4, y: -14, type: "tree" },
        { x: 20, y: 16, type: "tree" },
        { x: -12, y: 2, type: "rock" },
        { x: 7, y: 7, type: "rock" },
        { x: 18, y: -6, type: "rock" },
        { x: -3, y: 9, type: "rock" },
      ],
    },
    ice: {
      id: "ice",
      name: "Pico Congelado",
      theme: "Gelo",
      icon: "❄️",
      tag: "Fase de Gelo",
      desc: "Descida em slalom alpino pelas geleiras com curvas escorregadias e ventos árticos.",
      difficulty: "Média",
      difficultyBadge: "Média",
      bgColor: "#d8eff8",
      pathColor: "#5cbfe2",
      pathBorder: "#155a80",
      pathPoints: [
        { x: -20, y: -14 },
        { x: -10, y: -14 },
        { x: -4, y: -6 },
        { x: -14, y: -1 },
        { x: -14, y: 7 },
        { x: -4, y: 7 },
        { x: 2, y: -1 },
        { x: 10, y: -8 },
        { x: 16, y: -8 },
        { x: 16, y: 5 },
        { x: 7, y: 14 },
        { x: 20, y: 14 },
      ],
      decorations: [
        { x: -16, y: -8, type: "snow-pine" },
        { x: -7, y: -10, type: "snow-pine" },
        { x: 8, y: -14, type: "snow-pine" },
        { x: -8, y: 2, type: "crystal" },
        { x: 11, y: 0, type: "crystal" },
        { x: 19, y: 10, type: "crystal" },
        { x: -18, y: 3, type: "snow-rock" },
        { x: -1, y: 13, type: "snow-rock" },
        { x: -9, y: 12, type: "snow-pine" },
        { x: 12, y: 10, type: "snow-rock" },
        { x: 4, y: -6, type: "snow-pine" },
        { x: -18, y: 12, type: "snow-pine" },
      ],
    },
    lava: {
      id: "lava",
      name: "Vulcão Ardente",
      theme: "Lava",
      icon: "🌋",
      tag: "Fase de Lava",
      desc: "Trilha espiral incandescente contornando a caldeira vulcânica com rios de magma fervente.",
      difficulty: "Desafio",
      difficultyBadge: "Desafio",
      bgColor: "#1b1416",
      pathColor: "#2d201e",
      pathBorder: "#ff4500",
      pathPoints: [
        { x: -20, y: 13 },
        { x: -9, y: 13 },
        { x: -9, y: -13 },
        { x: 15, y: -13 },
        { x: 15, y: 1 },
        { x: 5, y: 1 },
        { x: 5, y: -6 },
        { x: -3, y: -6 },
        { x: -3, y: 5 },
        { x: 9, y: 5 },
        { x: 9, y: 14 },
        { x: 20, y: 14 },
      ],
      decorations: [
        { x: 1, y: -2.5, type: "lava-pool", r: 2.2 },
        { x: -15, y: -5, type: "fumarole" },
        { x: -16, y: 7, type: "lava-rock" },
        { x: 3, y: -11, type: "lava-rock" },
        { x: 18, y: -6, type: "fumarole" },
        { x: 17, y: 9, type: "lava-rock" },
        { x: -4, y: 11, type: "lava-pool", r: 1.4 },
        { x: -15, y: -12, type: "lava-rock" },
        { x: 11, y: -2, type: "lava-rock" },
        { x: 3, y: 11, type: "fumarole" },
      ],
    },
  };

  // Precompute arc lengths for smooth and consistent bloon movement
  Object.values(MAPS).forEach((map) => {
    const pts = map.pathPoints;
    const segments = [];
    let totalLength = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segments.push({
        p1: pts[i],
        p2: pts[i + 1],
        len,
        startDist: totalLength,
        endDist: totalLength + len,
      });
      totalLength += len;
    }
    map.metrics = { segments, totalLength };
  });

  const PATH_WIDTH = 2.05;
  const PLACE_CLEARANCE = 1.45;
  const TOWER_RADIUS = 0.72;
  const FINAL_ROUND = 40;

  const BLOONS = {
    red: { name: "Vermelho", color: "#e53935", speed: 0.6, rbe: 1, children: [], scale: 0.42 },
    blue: { name: "Azul", color: "#1e88e5", speed: 0.8, rbe: 2, children: ["red"], scale: 0.45 },
    green: { name: "Verde", color: "#43a047", speed: 1.0, rbe: 3, children: ["blue"], scale: 0.48 },
    yellow: { name: "Amarelo", color: "#fdd835", speed: 1.25, rbe: 4, children: ["green"], scale: 0.5 },
    pink: { name: "Rosa", color: "#ec407a", speed: 1.5, rbe: 5, children: ["yellow"], scale: 0.52 },
    black: {
      name: "Preto",
      color: "#212121",
      speed: 1.1,
      rbe: 11,
      children: ["pink", "pink"],
      scale: 0.4,
      immune: ["explosion"],
    },
    white: {
      name: "Branco",
      color: "#f5f5f5",
      speed: 1.1,
      rbe: 11,
      children: ["pink", "pink"],
      scale: 0.4,
      immune: ["freeze"],
    },
    purple: {
      name: "Roxo",
      color: "#8e24aa",
      speed: 1.4,
      rbe: 11,
      children: ["pink", "pink"],
      scale: 0.5,
      immune: ["magic"],
    },
    lead: {
      name: "Chumbo",
      color: "#78909c",
      speed: 0.55,
      rbe: 23,
      children: ["black", "black"],
      scale: 0.5,
      immune: ["sharp"],
      hp: 1,
    },
    zebra: { name: "Zebra", color: "#eeeeee", speed: 1.1, rbe: 23, children: ["black", "white"], scale: 0.52 },
    rainbow: { name: "Arco-íris", color: "#ff6d00", speed: 1.3, rbe: 47, children: ["zebra", "zebra"], scale: 0.55 },
    ceramic: {
      name: "Cerâmica",
      color: "#bcaaa4",
      speed: 1.4,
      rbe: 104,
      children: ["rainbow", "rainbow"],
      scale: 0.62,
      hp: 10,
    },
    moab: {
      name: "MOAB",
      color: "#1565c0",
      speed: 0.4,
      rbe: 616,
      children: ["ceramic", "ceramic", "ceramic", "ceramic"],
      scale: 1.35,
      hp: 200,
      moab: true,
      immune: ["freeze"],
    },
    bfb: {
      name: "BFB",
      color: "#c62828",
      speed: 0.25,
      rbe: 3164,
      children: ["moab", "moab", "moab", "moab"],
      scale: 1.8,
      hp: 700,
      moab: true,
      immune: ["freeze"],
    },
  };

  const GROW_CHAIN = ["red", "blue", "green", "yellow", "pink"];

  const TOWER_DEFS = {
    dart: {
      name: "Atirador",
      desc: "Dardos perfurantes. Não estoura chumbo.",
      cost: 200,
      color: "#c62828",
      range: 5.4,
      cooldown: 0.82,
      damage: 1,
      pierce: 2,
      projectileSpeed: 60,
      damageType: "sharp",
      kind: "dart",
      upgrades: [
        { cost: 140, range: 1.2, pierce: 1, label: "Dardos afiados" },
        { cost: 220, cooldown: 0.62, label: "Mãos rápidas" },
        { cost: 380, damage: 2, detectCamo: true, label: "Besta (detecta camo)" },
      ],
    },
    tack: {
      name: "Pregos",
      desc: "Dispara 8 pregos ao redor. Curto alcance.",
      cost: 280,
      color: "#f9a825",
      range: 3.4,
      cooldown: 1.05,
      damage: 1,
      pierce: 1,
      projectileSpeed: 12,
      damageType: "sharp",
      kind: "tack",
      upgrades: [
        { cost: 160, range: 0.5, label: "Alcance extra" },
        { cost: 260, cooldown: 0.72, pierce: 1, label: "Mais pregos" },
        { cost: 450, damage: 2, label: "Lâminas" },
      ],
    },
    bomb: {
      name: "Bombardeiro",
      desc: "Explosão em área. Não afeta pretos.",
      cost: 525,
      color: "#37474f",
      range: 5.8,
      cooldown: 1.35,
      damage: 1,
      pierce: 1,
      projectileSpeed: 45,
      damageType: "explosion",
      splash: 1.6,
      kind: "bomb",
      upgrades: [
        { cost: 250, splash: 0.5, label: "Raio maior" },
        { cost: 400, cooldown: 0.95, label: "Canhão rápido" },
        { cost: 700, damage: 2, pierce: 2, label: "Míssil" },
      ],
    },
    ice: {
      name: "Gelo",
      desc: "Congela balões no raio. Brancos e MOABs resistem.",
      cost: 500,
      color: "#4fc3f7",
      range: 3.6,
      cooldown: 2.1,
      damage: 1,
      pierce: 99,
      damageType: "freeze",
      kind: "ice",
      upgrades: [
        { cost: 220, range: 0.7, label: "Círculo largo" },
        { cost: 320, cooldown: 1.5, label: "Refrigeração" },
        { cost: 800, slowFactor: 0.35, label: "Gelo profundo" },
      ],
    },
    wizard: {
      name: "Mago",
      desc: "Raio mágico. Estoura chumbo. Roxos resistem.",
      cost: 375,
      color: "#6a1b9a",
      range: 5.6,
      cooldown: 0.95,
      damage: 1,
      pierce: 3,
      projectileSpeed: 70,
      damageType: "magic",
      detectCamo: true,
      kind: "dart",
      upgrades: [
        { cost: 220, pierce: 2, label: "Raio largo" },
        { cost: 380, cooldown: 0.7, label: "Canalização" },
        { cost: 900, damage: 3, label: "Bola de fogo" },
      ],
    },
    super: {
      name: "Super",
      desc: "Disparo contínuo de alto custo.",
      cost: 2500,
      color: "#ffd54f",
      range: 7.2,
      cooldown: 0.12,
      damage: 1,
      pierce: 1,
      projectileSpeed: 80,
      damageType: "sharp",
      kind: "dart",
      upgrades: [
        { cost: 1000, range: 1.5, detectCamo: true, label: "Visão laser" },
        { cost: 1800, cooldown: 0.06, pierce: 2, label: "Rajada" },
        { cost: 4000, damage: 4, damageType: "magic", label: "Plasma (estoura chumbo)" },
      ],
    },
    sniper: {
      name: "Sniper",
      desc: "Alcance infinito. Dano alto e projétil perfurante.",
      cost: 450,
      color: "#5d4037",
      range: 999,
      cooldown: 1.8,
      damage: 2,
      pierce: 1,
      projectileSpeed: 999,
      damageType: "sharp",
      kind: "sniper",
      upgrades: [
        { cost: 320, damage: 1, pierce: 1, label: "Munição perfurante" },
        { cost: 550, cooldown: 1.2, detectCamo: true, label: "Míssil de busca" },
        { cost: 1200, damage: 4, damageType: "normal", label: "Anti-MOAB" },
      ],
    },
    ninja: {
      name: "Ninja",
      desc: "Shurikens rápidos. Detecta camuflagem automaticamente.",
      cost: 500,
      color: "#1b5e20",
      range: 4.2,
      cooldown: 0.65,
      damage: 1,
      pierce: 2,
      projectileSpeed: 75,
      damageType: "sharp",
      kind: "shuriken",
      detectCamo: true,
      upgrades: [
        { cost: 280, pierce: 1, cooldown: 0.55, label: "Técnica ninja" },
        { cost: 450, damage: 2, label: "Shurikens afiados" },
        { cost: 850, pierce: 3, range: 1.5, label: "Mestre ninja" },
      ],
    },
    alchemist: {
      name: "Alquimista",
      desc: "Ácido que estoura chumbo. Efeitos visuais de química.",
      cost: 550,
      color: "#7b1fa2",
      range: 4.8,
      cooldown: 0.85,
      damage: 1,
      pierce: 1,
      projectileSpeed: 55,
      damageType: "acid",
      kind: "acid",
      upgrades: [
        { cost: 300, pierce: 2, damage: 1, label: "Ácido mais forte" },
        { cost: 450, range: 1.2, label: "Bigger Pots" },
        { cost: 900, damage: 3, pierce: 3, label: "Perishing Pot" },
      ],
    },
  };

  const ROUNDS = [
    [{ t: "red", n: 20, gap: 0.45 }],
    [{ t: "red", n: 35, gap: 0.32 }],
    [
      { t: "red", n: 10, gap: 0.28 },
      { t: "blue", n: 5, gap: 0.4, wait: 0.6 },
      { t: "red", n: 15, gap: 0.28, wait: 0.5 },
    ],
    [
      { t: "red", n: 25, gap: 0.22 },
      { t: "blue", n: 18, gap: 0.28, wait: 0.4 },
    ],
    [
      { t: "blue", n: 12, gap: 0.3 },
      { t: "red", n: 5, gap: 0.25, wait: 0.3 },
      { t: "blue", n: 15, gap: 0.26, wait: 0.3 },
    ],
    [
      { t: "green", n: 4, gap: 0.45 },
      { t: "red", n: 15, gap: 0.22, wait: 0.4 },
      { t: "blue", n: 15, gap: 0.24, wait: 0.3 },
    ],
    [
      { t: "blue", n: 10, gap: 0.25 },
      { t: "green", n: 5, gap: 0.4, wait: 0.4 },
      { t: "red", n: 20, gap: 0.18, wait: 0.3 },
    ],
    [
      { t: "blue", n: 20, gap: 0.22 },
      { t: "green", n: 14, gap: 0.32, wait: 0.5 },
    ],
    [{ t: "green", n: 30, gap: 0.28 }],
    [{ t: "blue", n: 80, gap: 0.16 }],
    [
      { t: "yellow", n: 3, gap: 0.5 },
      { t: "green", n: 12, gap: 0.28, wait: 0.4 },
      { t: "blue", n: 10, gap: 0.22, wait: 0.3 },
    ],
    [
      { t: "green", n: 10, gap: 0.26 },
      { t: "yellow", n: 5, gap: 0.4, wait: 0.5 },
    ],
    [
      { t: "blue", n: 50, gap: 0.14 },
      { t: "green", n: 23, gap: 0.22, wait: 0.4 },
    ],
    [
      { t: "red", n: 18, gap: 0.12 },
      { t: "yellow", n: 9, gap: 0.3, wait: 0.5 },
      { t: "green", n: 10, gap: 0.22, wait: 0.3 },
    ],
    [
      { t: "yellow", n: 10, gap: 0.28 },
      { t: "pink", n: 5, gap: 0.4, wait: 0.5 },
      { t: "green", n: 12, gap: 0.22, wait: 0.3 },
    ],
    [{ t: "green", n: 40, gap: 0.16, wait: 0 }, { t: "yellow", n: 8, gap: 0.28, wait: 0.6 }],
    [{ t: "yellow", n: 12, gap: 0.18, mods: { regrow: true } }],
    [{ t: "green", n: 80, gap: 0.14 }],
    [
      { t: "pink", n: 15, gap: 0.26 },
      { t: "yellow", n: 9, gap: 0.22, wait: 0.3, mods: { regrow: true } },
    ],
    [{ t: "black", n: 6, gap: 0.55 }],
    [
      { t: "yellow", n: 40, gap: 0.16 },
      { t: "pink", n: 14, gap: 0.22, wait: 0.4 },
    ],
    [{ t: "white", n: 16, gap: 0.28 }],
    [
      { t: "black", n: 7, gap: 0.35 },
      { t: "white", n: 7, gap: 0.35, wait: 0.3 },
    ],
    [
      { t: "green", n: 1, gap: 0.4, mods: { camo: true } },
      { t: "blue", n: 20, gap: 0.2, wait: 0.5 },
    ],
    [
      { t: "yellow", n: 25, gap: 0.16, mods: { regrow: true } },
      { t: "purple", n: 10, gap: 0.35, wait: 0.5 },
    ],
    [
      { t: "pink", n: 23, gap: 0.18 },
      { t: "zebra", n: 4, gap: 0.55, wait: 0.6 },
    ],
    [
      { t: "red", n: 100, gap: 0.06 },
      { t: "yellow", n: 45, gap: 0.12, wait: 0.8 },
    ],
    [{ t: "lead", n: 6, gap: 0.55 }],
    [{ t: "yellow", n: 65, gap: 0.12, mods: { regrow: true } }],
    [{ t: "lead", n: 9, gap: 0.45 }],
    [
      { t: "black", n: 8, gap: 0.25 },
      { t: "zebra", n: 10, gap: 0.35, wait: 0.4 },
    ],
    [
      { t: "white", n: 20, gap: 0.2 },
      { t: "purple", n: 10, gap: 0.3, wait: 0.4 },
    ],
    [
      { t: "red", n: 20, gap: 0.12, mods: { camo: true } },
      { t: "yellow", n: 13, gap: 0.2, wait: 0.3, mods: { camo: true } },
    ],
    [
      { t: "yellow", n: 80, gap: 0.08 },
      { t: "zebra", n: 6, gap: 0.4, wait: 0.8 },
    ],
    [
      { t: "rainbow", n: 5, gap: 0.55 },
      { t: "pink", n: 35, gap: 0.12, wait: 0.4 },
      { t: "black", n: 30, gap: 0.16, wait: 0.3 },
    ],
    [
      { t: "pink", n: 80, gap: 0.08 },
      { t: "green", n: 20, gap: 0.18, wait: 0.4, mods: { camo: true, regrow: true } },
    ],
    [
      { t: "lead", n: 15, gap: 0.28 },
      { t: "zebra", n: 10, gap: 0.3, wait: 0.4 },
      { t: "white", n: 7, gap: 0.22, wait: 0.3, mods: { camo: true } },
    ],
    [
      { t: "ceramic", n: 2, gap: 1.1 },
      { t: "lead", n: 14, gap: 0.28, wait: 0.6 },
      { t: "pink", n: 42, gap: 0.1, wait: 0.3 },
    ],
    [
      { t: "rainbow", n: 18, gap: 0.28 },
      { t: "zebra", n: 20, gap: 0.2, wait: 0.4 },
    ],
    [{ t: "moab", n: 1, gap: 1 }],
  ];

  const state = {
    currentMap: "grass",
    selectedModalMap: "grass",
    lives: 150,
    cash: 650,
    pops: 0,
    round: 0,
    speed: 1,
    auto: false,
    playing: false,
    roundActive: false,
    placing: null,
    selected: null,
    bloons: [],
    towers: [],
    projectiles: [],
    spawnQueue: [],
    spawnTime: 0,
    particles: [],
    sandbox: false,
    nudgeMode: false,
    nudgeStep: 0.1,
  };

  // 2D viewport and camera
  let camera = { x: 0, y: 0, zoom: 20 };
  let pointer = { x: 0, y: 0 };
  let pan = { active: false, startX: 0, startY: 0 };

  // Audio
  const audio = { ctx: null };

  function beep(freq, dur, type = "square", vol = 0.04) {
    try {
      if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.ctx.createOscillator();
      const g = audio.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(audio.ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + dur);
      o.stop(audio.ctx.currentTime + dur);
    } catch (_) {}
  }

  function toast(text) {
    const el = document.getElementById("toast");
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 1600);
  }

  function rbeOf(type, mods = {}) {
    const def = BLOONS[type];
    let v = def.rbe;
    if (mods.fortified && def.hp) v += def.hp;
    return v;
  }

  // Bloons TD 6 precision: Floating point error correction
  function preciseAdd(a, b) {
    const result = a + b;
    // Prevent floating point overflow by checking for extreme values
    if (!isFinite(result)) {
      return a; // Return original if overflow
    }
    return result;
  }

  function preciseSubtract(a, b) {
    const result = a - b;
    if (!isFinite(result)) {
      return a;
    }
    return result;
  }

  function preciseMultiply(a, b) {
    const result = a * b;
    if (!isFinite(result)) {
      return 0;
    }
    return result;
  }

  function preciseDivide(a, b) {
    if (Math.abs(b) < 0.0001) return 0; // Prevent division by zero
    const result = a / b;
    if (!isFinite(result)) {
      return 0;
    }
    return result;
  }

  // Map and Path Functions
  function getCurrentMap() {
    return MAPS[state.currentMap] || MAPS.grass;
  }

  function getPointOnPath(progress) {
    const map = getCurrentMap();
    const pts = map.pathPoints;
    const { segments, totalLength } = map.metrics;

    if (progress <= 0) return { x: pts[0].x, y: pts[0].y };
    if (progress >= 1) return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };

    const targetDist = progress * totalLength;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (targetDist <= seg.endDist || i === segments.length - 1) {
        const segT = seg.len > 0 ? (targetDist - seg.startDist) / seg.len : 0;
        return {
          x: seg.p1.x + (seg.p2.x - seg.p1.x) * segT,
          y: seg.p1.y + (seg.p2.y - seg.p1.y) * segT,
        };
      }
    }
    return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  function distToPath(x, y) {
    const map = getCurrentMap();
    const pts = map.pathPoints;
    let min = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
      if (d < min) min = d;
    }
    return min;
  }

  function initCanvas() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }

  function worldToScreen(x, y) {
    const screenX = (x - camera.x) * camera.zoom + canvas.width / 2;
    const screenY = (y - camera.y) * camera.zoom + canvas.height / 2;
    return { x: screenX, y: screenY };
  }

  function screenToWorld(screenX, screenY) {
    const worldX = (screenX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (screenY - canvas.height / 2) / camera.zoom + camera.y;
    return { x: worldX, y: worldY };
  }

  function drawPath(now = 0) {
    const map = getCurrentMap();
    const pts = map.pathPoints;
    if (!pts || pts.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 1. Map-specific background aura / glow
    if (map.id === "lava") {
      ctx.shadowColor = "#ff3d00";
      ctx.shadowBlur = 18 + Math.sin(now * 3) * 6;
      ctx.strokeStyle = "#ff3d00";
      ctx.lineWidth = (PATH_WIDTH + 0.85) * camera.zoom;
      ctx.beginPath();
      const s0 = worldToScreen(pts[0].x, pts[0].y);
      ctx.moveTo(s0.x, s0.y);
      for (let i = 1; i < pts.length; i++) {
        const p = worldToScreen(pts[i].x, pts[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (map.id === "ice") {
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#155a80";
      ctx.lineWidth = (PATH_WIDTH + 0.45) * camera.zoom;
      ctx.beginPath();
      const s0 = worldToScreen(pts[0].x, pts[0].y);
      ctx.moveTo(s0.x, s0.y);
      for (let i = 1; i < pts.length; i++) {
        const p = worldToScreen(pts[i].x, pts[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. Base path body
    ctx.strokeStyle = map.id === "lava" ? "#ff6d00" : map.pathColor;
    ctx.lineWidth = PATH_WIDTH * camera.zoom;
    ctx.beginPath();
    const start = worldToScreen(pts[0].x, pts[0].y);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < pts.length; i++) {
      const point = worldToScreen(pts[i].x, pts[i].y);
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    // 3. Inner track / texture
    if (map.id === "grass") {
      ctx.strokeStyle = "#8d6e4a";
      ctx.lineWidth = (PATH_WIDTH * 0.6) * camera.zoom;
      ctx.stroke();
      // Pebble line
      ctx.strokeStyle = "rgba(245, 230, 200, 0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (map.id === "ice") {
      // Shimmering ice core
      ctx.strokeStyle = "#b3e5fc";
      ctx.lineWidth = (PATH_WIDTH * 0.55) * camera.zoom;
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = (PATH_WIDTH * 0.22) * camera.zoom;
      ctx.stroke();
    } else if (map.id === "lava") {
      // Dark scorched basalt road with magma fissures
      ctx.strokeStyle = "#271b19";
      ctx.lineWidth = (PATH_WIDTH * 0.72) * camera.zoom;
      ctx.stroke();
      // Molten magma vein down the middle
      ctx.strokeStyle = "#ffab00";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawGround(now = 0) {
    const map = getCurrentMap();
    const pts = map.pathPoints;

    // Ground base
    if (map.id === "grass") {
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      grad.addColorStop(0, "#3e8e41");
      grad.addColorStop(1, "#285e2b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (map.id === "ice") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#eaf6fc");
      grad.addColorStop(0.5, "#d4ecf7");
      grad.addColorStop(1, "#c1e2f3");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ice sheen patches on snow
      ctx.fillStyle = "rgba(179, 229, 252, 0.35)";
      const icePatches = [
        { x: -14, y: 3, rx: 4, ry: 2.5 },
        { x: 5, y: -9, rx: 5, ry: 3 },
        { x: 12, y: 7, rx: 4.5, ry: 2.8 },
      ];
      icePatches.forEach((p) => {
        const sc = worldToScreen(p.x, p.y);
        ctx.beginPath();
        ctx.ellipse(sc.x, sc.y, p.rx * camera.zoom, p.ry * camera.zoom, 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (map.id === "lava") {
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 80,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      grad.addColorStop(0, "#23181a");
      grad.addColorStop(1, "#140e10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Glowing magma fissures in the ground
      const fissureAlpha = 0.35 + Math.sin(now * 2) * 0.15;
      ctx.strokeStyle = `rgba(255, 61, 0, ${fissureAlpha})`;
      ctx.lineWidth = 2.5;
      const fissures = [
        [{ x: -18, y: -10 }, { x: -13, y: -8 }, { x: -12, y: -4 }],
        [{ x: 8, y: -10 }, { x: 12, y: -7 }, { x: 13, y: -3 }],
        [{ x: -8, y: 8 }, { x: -5, y: 12 }, { x: 0, y: 11 }],
        [{ x: 7, y: 9 }, { x: 12, y: 11 }, { x: 17, y: 13 }],
      ];
      fissures.forEach((f) => {
        ctx.beginPath();
        const p0 = worldToScreen(f[0].x, f[0].y);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < f.length; i++) {
          const pi = worldToScreen(f[i].x, f[i].y);
          ctx.lineTo(pi.x, pi.y);
        }
        ctx.stroke();
      });
    }

    // Draw map-specific decorations
    map.decorations.forEach((dec) => {
      const screen = worldToScreen(dec.x, dec.y);
      const size = camera.zoom * 0.85;

      switch (dec.type) {
        case "tree": {
          ctx.fillStyle = "#5d4037";
          ctx.fillRect(screen.x - size * 0.14, screen.y + size * 0.3, size * 0.28, size * 0.45);

          ctx.fillStyle = "#1b5e20";
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, size * 0.65, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#2e7d32";
          ctx.beginPath();
          ctx.arc(screen.x - size * 0.12, screen.y - size * 0.15, size * 0.48, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "rock": {
          ctx.fillStyle = "#78909c";
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, size * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#b0bec5";
          ctx.beginPath();
          ctx.arc(screen.x - size * 0.1, screen.y - size * 0.1, size * 0.22, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "snow-pine": {
          // Pine tree with snow blanket
          ctx.fillStyle = "#4e342e";
          ctx.fillRect(screen.x - size * 0.12, screen.y + size * 0.5, size * 0.24, size * 0.35);

          // Tier 3
          ctx.fillStyle = "#1b4d3e";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size * 0.1);
          ctx.lineTo(screen.x - size * 0.7, screen.y + size * 0.55);
          ctx.lineTo(screen.x + size * 0.7, screen.y + size * 0.55);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(screen.x - size * 0.65, screen.y + size * 0.55);
          ctx.lineTo(screen.x, screen.y + size * 0.42);
          ctx.lineTo(screen.x + size * 0.65, screen.y + size * 0.55);
          ctx.lineTo(screen.x + size * 0.55, screen.y + size * 0.62);
          ctx.lineTo(screen.x - size * 0.55, screen.y + size * 0.62);
          ctx.closePath();
          ctx.fill();

          // Tier 2
          ctx.fillStyle = "#1b4d3e";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size * 0.55);
          ctx.lineTo(screen.x - size * 0.52, screen.y + size * 0.08);
          ctx.lineTo(screen.x + size * 0.52, screen.y + size * 0.08);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(screen.x - size * 0.48, screen.y + size * 0.08);
          ctx.lineTo(screen.x, screen.y - size * 0.02);
          ctx.lineTo(screen.x + size * 0.48, screen.y + size * 0.08);
          ctx.lineTo(screen.x + size * 0.38, screen.y + size * 0.15);
          ctx.lineTo(screen.x - size * 0.38, screen.y + size * 0.15);
          ctx.closePath();
          ctx.fill();

          // Tier 1 (top)
          ctx.fillStyle = "#1b4d3e";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size);
          ctx.lineTo(screen.x - size * 0.35, screen.y - size * 0.4);
          ctx.lineTo(screen.x + size * 0.35, screen.y - size * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size);
          ctx.lineTo(screen.x - size * 0.2, screen.y - size * 0.55);
          ctx.lineTo(screen.x + size * 0.2, screen.y - size * 0.55);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case "crystal": {
          // Shimmering cyan ice crystal
          const glint = (Math.sin(now * 3 + dec.x * 2) + 1) / 2;
          ctx.save();
          ctx.shadowColor = "#00e5ff";
          ctx.shadowBlur = 8 + glint * 8;

          ctx.fillStyle = "#00b0ff";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size * 0.9);
          ctx.lineTo(screen.x - size * 0.35, screen.y + size * 0.3);
          ctx.lineTo(screen.x, screen.y + size * 0.45);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#80d8ff";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size * 0.9);
          ctx.lineTo(screen.x, screen.y + size * 0.45);
          ctx.lineTo(screen.x + size * 0.35, screen.y + size * 0.3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + glint * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size * 0.85);
          ctx.lineTo(screen.x - size * 0.08, screen.y + size * 0.1);
          ctx.lineTo(screen.x, screen.y + size * 0.35);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }

        case "snow-rock": {
          ctx.fillStyle = "#78909c";
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, size * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(screen.x, screen.y - size * 0.18, size * 0.36, Math.PI * 0.9, Math.PI * 2.1);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case "lava-pool": {
          // Bubbling molten lava pool
          const r = (dec.r || 2.2) * camera.zoom;
          ctx.save();
          ctx.shadowColor = "#ff3d00";
          ctx.shadowBlur = 18;

          // Basalt crust rim
          ctx.fillStyle = "#2d1a1c";
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, r * 1.18, 0, Math.PI * 2);
          ctx.fill();

          // Liquid magma gradient
          const poolGrad = ctx.createRadialGradient(screen.x, screen.y, r * 0.15, screen.x, screen.y, r);
          poolGrad.addColorStop(0, "#fff59d");
          poolGrad.addColorStop(0.3, "#ff9100");
          poolGrad.addColorStop(0.7, "#ff3d00");
          poolGrad.addColorStop(1, "#b71c1c");
          ctx.fillStyle = poolGrad;
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Bubbles
          const b1 = (Math.sin(now * 3 + dec.x) + 1) / 2;
          ctx.fillStyle = "rgba(255, 235, 59, 0.85)";
          ctx.beginPath();
          ctx.arc(screen.x - r * 0.3, screen.y - r * 0.2, r * 0.22 * b1, 0, Math.PI * 2);
          ctx.fill();

          const b2 = (Math.cos(now * 2.5 + dec.y) + 1) / 2;
          ctx.beginPath();
          ctx.arc(screen.x + r * 0.35, screen.y + r * 0.25, r * 0.18 * b2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case "fumarole": {
          ctx.fillStyle = "#372728";
          ctx.beginPath();
          ctx.moveTo(screen.x - size * 0.5, screen.y + size * 0.4);
          ctx.lineTo(screen.x - size * 0.25, screen.y - size * 0.35);
          ctx.lineTo(screen.x + size * 0.25, screen.y - size * 0.35);
          ctx.lineTo(screen.x + size * 0.5, screen.y + size * 0.4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#ff6d00";
          ctx.beginPath();
          ctx.ellipse(screen.x, screen.y - size * 0.35, size * 0.24, size * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "lava-rock": {
          ctx.fillStyle = "#261e20";
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y - size * 0.5);
          ctx.lineTo(screen.x + size * 0.45, screen.y);
          ctx.lineTo(screen.x + size * 0.3, screen.y + size * 0.42);
          ctx.lineTo(screen.x - size * 0.4, screen.y + size * 0.38);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "#ff5722";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(screen.x - size * 0.1, screen.y - size * 0.3);
          ctx.lineTo(screen.x + size * 0.05, screen.y + size * 0.1);
          ctx.lineTo(screen.x - size * 0.15, screen.y + size * 0.3);
          ctx.stroke();
          break;
        }
      }
    });

    // Draw Entrance and Exit Portals
    const startPortal = worldToScreen(pts[0].x, pts[0].y);
    const endPortal = worldToScreen(pts[pts.length - 1].x, pts[pts.length - 1].y);
    const pRadius = camera.zoom * 0.95;

    ctx.save();
    if (map.id === "ice") {
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(startPortal.x, startPortal.y, pRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startPortal.x, startPortal.y, pRadius * 0.65, now * 2, now * 2 + Math.PI * 1.3);
      ctx.stroke();

      ctx.shadowColor = "#3f51b5";
      ctx.strokeStyle = "#5c6bc0";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(endPortal.x, endPortal.y, pRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (map.id === "lava") {
      ctx.shadowColor = "#ff9100";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "#ff9100";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(startPortal.x, startPortal.y, pRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#ffd600";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(startPortal.x, startPortal.y, pRadius * 0.6, -now * 3, -now * 3 + Math.PI * 1.5);
      ctx.stroke();

      ctx.shadowColor = "#d50000";
      ctx.strokeStyle = "#b71c1c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(endPortal.x, endPortal.y, pRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#66bb6a";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(startPortal.x, startPortal.y, pRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#ef5350";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(endPortal.x, endPortal.y, pRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Ambient Weather Particle System
  const ambientParticles = [];
  function initAmbientWeather() {
    ambientParticles.length = 0;
    for (let i = 0; i < 45; i++) {
      ambientParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5 + 1.2,
        speedY: Math.random() * 40 + 25,
        speedX: Math.random() * 20 - 10,
        angle: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }
  }

  function drawAmbientWeather(dt, now) {
    if (!ambientParticles.length) initAmbientWeather();
    const map = getCurrentMap();

    ctx.save();
    for (const p of ambientParticles) {
      p.angle += dt * 1.8;

      if (map.id === "ice") {
        // Falling snowflakes drifting gently
        p.y += p.speedY * dt * 0.9;
        p.x += Math.sin(p.angle) * 22 * dt;
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (map.id === "lava") {
        // Rising glowing embers and fire sparks
        p.y -= p.speedY * dt * 1.4;
        p.x += Math.sin(p.angle) * 18 * dt;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const flicker = (Math.sin(now * 5 + p.angle) + 1) / 2;
        ctx.fillStyle = `rgba(255, ${Math.floor(100 + flicker * 90)}, 20, ${p.alpha * (0.6 + flicker * 0.4)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Grassland drifting pollen / leaves
        p.y += p.speedY * dt * 0.4;
        p.x += (Math.cos(p.angle) * 15 + 15) * dt;
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.fillStyle = `rgba(180, 235, 140, ${p.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawBloon(bloon) {
    const def = BLOONS[bloon.type];
    const screen = worldToScreen(bloon.x, bloon.y);
    const radius = def.scale * camera.zoom * 1.5;

    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw knot
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y + radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Special visual effects
    if (bloon.mods.camo) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (bloon.type === "zebra") {
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (bloon.mods.fortified) {
      ctx.strokeStyle = "#455a64";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 1.1, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawTower(tower) {
    const def = TOWER_DEFS[tower.type];
    const screen = worldToScreen(tower.x, tower.y);
    const size = camera.zoom * 0.8;

    // Draw base
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Draw body
    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Tower-specific visuals
    if (tower.type === "wizard") {
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y - size * 0.8);
      ctx.lineTo(screen.x - size * 0.25, screen.y - size * 0.4);
      ctx.lineTo(screen.x + size * 0.25, screen.y - size * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    if (tower.type === "sniper") {
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(screen.x - size * 0.15, screen.y - size * 0.5, size * 0.3, size * 0.6);
    }

    if (tower.type === "ninja") {
      ctx.fillStyle = "#1b5e20";
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y - size * 0.7);
      ctx.lineTo(screen.x - size * 0.3, screen.y - size * 0.3);
      ctx.lineTo(screen.x + size * 0.3, screen.y - size * 0.3);
      ctx.closePath();
      ctx.fill();
    }

    if (tower.type === "super") {
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y - size * 0.6);
      ctx.lineTo(screen.x - size * 0.4, screen.y + size * 0.2);
      ctx.lineTo(screen.x + size * 0.4, screen.y + size * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    // Draw selection indicator
    if (state.selected === tower) {
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, size * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Draw range
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, tower.range * camera.zoom, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawProjectile(proj) {
    const screen = worldToScreen(proj.x, proj.y);
    const radius = camera.zoom * 0.15;

    ctx.fillStyle = proj.color || "#ffcc80";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw projectile trail for visibility
    if (proj.energy || proj.plasma) {
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawParticle(particle) {
    const screen = worldToScreen(particle.x, particle.y);
    const radius = particle.size * camera.zoom;

    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawGhost(type) {
    if (!state.placing) return;
    const def = TOWER_DEFS[state.placing];
    const screen = worldToScreen(pointer.x, pointer.y);
    const size = camera.zoom * 0.8;

    const canPlaceHere = canPlace(pointer.x, pointer.y);
    ctx.fillStyle = canPlaceHere ? "rgba(129, 199, 132, 0.5)" : "rgba(229, 115, 73, 0.5)";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function spawnBloon(type, mods, progress = 0, origin = type) {
    const def = BLOONS[type];
    const pos = getPointOnPath(progress);
    const bloon = {
      id: Math.random().toString(36).slice(2),
      type,
      mods: { camo: !!mods.camo, regrow: !!mods.regrow, fortified: !!mods.fortified },
      progress,
      x: pos.x,
      y: pos.y,
      hp: (def.hp || 1) * (mods.fortified && def.hp ? 2 : 1),
      slowUntil: 0,
      lastHit: performance.now() / 1000,
      origin,
      immune: new Set(def.immune || []),
    };
    state.bloons.push(bloon);
    return bloon;
  }

  function removeBloon(bloon) {
    const i = state.bloons.indexOf(bloon);
    if (i >= 0) state.bloons.splice(i, 1);
  }

  function popFx(x, y, color) {
    for (let i = 0; i < 4; i++) {
      state.particles.push({
        x: x + (Math.random() - 0.5) * 0.5,
        y: y + (Math.random() - 0.5) * 0.5,
        color,
        size: 0.15,
        life: 0.25,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
      });
    }
    beep(420 + Math.random() * 180, 0.05, "triangle", 0.03);
  }

  function applyDamage(bloon, amount, damageType) {
    if (!bloon || !state.bloons.includes(bloon)) return 0;
    if (bloon.immune.has(damageType)) return 0;
    if (damageType === "freeze") {
      bloon.slowUntil = performance.now() / 1000 + 1.6;
      bloon.lastHit = performance.now() / 1000;
    }
    let leftover = amount;
    let pops = 0;
    const current = bloon;
    while (leftover > 0 && current.hp > 0) {
      current.hp -= 1;
      leftover -= 1;
      pops += 1;
      state.pops += 1;
      state.cash += 1;
    }
    if (current.hp > 0) {
      current.lastHit = performance.now() / 1000;
      return pops;
    }
    const def = BLOONS[current.type];
    const pos = { x: current.x, y: current.y };
    const progress = current.progress;
    const mods = { ...current.mods };
    const origin = current.origin;
    popFx(pos.x, pos.y, def.color);
    removeBloon(current);
    const kids = def.children;
    if (!kids.length) return pops;
    const spawned = [];
    kids.forEach((k, idx) => {
      const child = spawnBloon(k, mods, Math.min(0.999, progress + idx * 0.0015), origin);
      spawned.push(child);
    });
    if (leftover > 0 && spawned[0]) pops += applyDamage(spawned[0], leftover, damageType);
    return pops;
  }

  function canPlace(x, y) {
    if (Math.hypot(x, y) > 26) return false;
    if (distToPath(x, y) < PLACE_CLEARANCE) return false;
    for (const t of state.towers) {
      if (Math.hypot(t.x - x, t.y - y) < TOWER_RADIUS * 2.1) return false;
    }
    const map = getCurrentMap();
    for (const dec of map.decorations) {
      const rad = dec.r || (dec.type === "lava-pool" ? 2.4 : dec.type === "fumarole" ? 1.5 : 1.1);
      if (Math.hypot(dec.x - x, dec.y - y) < rad) return false;
    }
    return true;
  }

  function createTower(type, x, y) {
    const def = TOWER_DEFS[type];
    const tower = {
      type,
      x,
      y,
      range: def.range,
      cooldown: def.cooldown,
      timer: 0,
      damage: def.damage,
      pierce: def.pierce,
      projectileSpeed: def.projectileSpeed,
      damageType: def.damageType,
      kind: def.kind,
      splash: def.splash || 0,
      detectCamo: !!def.detectCamo,
      spent: def.cost,
      tier: 0,
      targetMode: "first",
      slowFactor: 0.45,
      bobOffset: Math.random() * Math.PI * 2,
    };
    state.towers.push(tower);
    return tower;
  }

  function upgradeTower(tower) {
    const def = TOWER_DEFS[tower.type];
    const next = def.upgrades[tower.tier];
    if (!next) return;
    if (!state.sandbox && state.cash < next.cost) {
      toast("Dinheiro insuficiente");
      return;
    }
    if (!state.sandbox) {
      state.cash -= next.cost;
      tower.spent += next.cost;
    }
    tower.tier += 1;
    if (next.range) tower.range += next.range;
    if (next.cooldown) tower.cooldown = next.cooldown;
    if (next.damage) tower.damage = next.damage;
    if (next.pierce) tower.pierce += next.pierce;
    if (next.detectCamo) tower.detectCamo = true;
    if (next.splash) tower.splash += next.splash;
    if (next.slowFactor) tower.slowFactor = next.slowFactor;
    if (next.damageType) tower.damageType = next.damageType;
    toast(next.label);
    beep(660, 0.08, "sine", 0.05);
    refreshInspect();
    updateHud();
  }

  function sellTower(tower) {
    const value = Math.floor(tower.spent * 0.7);
    state.cash += value;
    state.towers = state.towers.filter((t) => t !== tower);
    state.selected = null;
    document.getElementById("inspect").hidden = true;
    updateHud();
    beep(220, 0.1, "sawtooth", 0.04);
  }

  function pickTarget(tower, now) {
    const inRange = state.bloons.filter((b) => {
      if (b.mods.camo && !tower.detectCamo) return false;
      const dx = b.x - tower.x;
      const dy = b.y - tower.y;
      return dx * dx + dy * dy <= tower.range * tower.range;
    });
    if (!inRange.length) return null;
    if (tower.targetMode === "first") return inRange.sort((a, b) => b.progress - a.progress)[0];
    if (tower.targetMode === "last") return inRange.sort((a, b) => a.progress - b.progress)[0];
    if (tower.targetMode === "close") {
      return inRange.sort((a, b) => {
        const da = Math.hypot(a.x - tower.x, a.y - tower.y);
        const db = Math.hypot(b.x - tower.x, b.y - tower.y);
        return da - db;
      })[0];
    }
    return inRange.sort((a, b) => BLOONS[b.type].rbe - BLOONS[a.type].rbe || b.hp - a.hp)[0];
  }

  function fireDart(tower, target) {
    const origin = { x: tower.x, y: tower.y };
    
    // Simple direct aiming at current position - no prediction
    const dir = {
      x: target.x - origin.x,
      y: target.y - origin.y,
    };
    const length = Math.hypot(dir.x, dir.y);
    dir.x = (dir.x / length) || 0;
    dir.y = (dir.y / length) || 0;

    let color = "#ffcc80";
    let projectileType = "dart";

    if (tower.kind === "bomb") {
      color = "#111111";
      projectileType = "bomb";
    } else if (tower.kind === "sniper") {
      color = "#ff6f00";
      projectileType = "sniper";
    } else if (tower.kind === "shuriken") {
      color = "#81c784";
      projectileType = "shuriken";
    } else if (tower.kind === "acid") {
      color = "#9c27b0";
      projectileType = "acid";
    } else if (tower.type === "wizard") {
      color = "#9c27b0";
      projectileType = "energy";
    } else if (tower.type === "super") {
      if (tower.tier === 0) {
        color = "#ffd54f";
        projectileType = "dart";
      } else if (tower.tier === 1) {
        color = "#ffeb3b";
        projectileType = "laser";
      } else if (tower.tier === 2) {
        color = "#00bcd4";
        projectileType = "plasma";
      }
    }

    state.projectiles.push({
      x: origin.x,
      y: origin.y,
      dir,
      speed: tower.projectileSpeed,
      pierce: tower.pierce,
      damage: tower.damage,
      damageType: tower.damageType,
      splash: tower.splash,
      hit: new Set(),
      life: projectileType === "sniper" ? 0.3 : 2.0,
      shuriken: projectileType === "shuriken",
      acid: projectileType === "acid",
      energy: projectileType === "energy",
      laser: projectileType === "laser",
      plasma: projectileType === "plasma",
      color,
    });
  }

  function icePulse(tower) {
    // Add visual effect for ice pulse
    state.particles.push({
      x: tower.x,
      y: tower.y,
      color: "#b3e5fc",
      size: tower.range,
      life: 0.3,
      iceEffect: true,
    });
    
    for (const b of [...state.bloons]) {
      if (b.mods.camo && !tower.detectCamo) continue;
      const dx = b.x - tower.x;
      const dy = b.y - tower.y;
      if (dx * dx + dy * dy <= tower.range * tower.range) {
        applyDamage(b, tower.damage, tower.damageType);
        if (state.bloons.includes(b)) b.slowUntil = performance.now() / 1000 + 1.8;
      }
    }
  }

  function tackShot(tower) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };
      state.projectiles.push({
        x: tower.x,
        y: tower.y,
        dir,
        speed: 13,
        pierce: tower.pierce,
        damage: tower.damage,
        damageType: tower.damageType,
        splash: 0,
        hit: new Set(),
        life: 0.45,
        color: "#ffd54f",
      });
    }
  }

  function updateTowers(dt, now) {
    for (const tower of state.towers) {
      tower.timer -= dt;
      if (tower.timer > 0) continue;
      if (tower.kind === "ice") {
        const any = state.bloons.some((b) => {
          if (b.mods.camo && !tower.detectCamo) return false;
          const dx = b.x - tower.x;
          const dy = b.y - tower.y;
          return dx * dx + dy * dy <= tower.range * tower.range;
        });
        if (!any) continue;
        icePulse(tower);
        tower.timer = tower.cooldown;
        continue;
      }
      const target = pickTarget(tower, now);
      if (!target) continue;
      if (tower.kind === "tack") tackShot(tower);
      else fireDart(tower, target);
      tower.timer = tower.cooldown;
    }
  }

  function explode(pos, radius, damage, type, source) {
    for (const b of [...state.bloons]) {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      if (Math.hypot(dx, dy) <= radius) applyDamage(b, damage, type);
    }
  }

  function updateProjectiles(dt) {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      
      p.life -= dt;
      p.x += p.dir.x * p.speed * dt;
      p.y += p.dir.y * p.speed * dt;

      if (p.life <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Simple collision with generous hit boxes
      for (const b of [...state.bloons]) {
        if (p.hit.has(b.id)) continue;
        const hitR = BLOONS[b.type].moab ? 2.5 : 1.5; // Very generous hit radius
        
        const currentDist = Math.hypot(p.x - b.x, p.y - b.y);
        if (currentDist < hitR) {
          p.hit.add(b.id);
          if (p.splash) explode({ x: b.x, y: b.y }, p.splash, p.damage, p.damageType, p);
          else applyDamage(b, p.damage, p.damageType);
          p.pierce -= 1;
          if (p.pierce <= 0) {
            state.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updateBloons(dt, now) {
    const map = getCurrentMap();
    const speedScale = 122 / (map.metrics.totalLength || 122);
    for (const b of [...state.bloons]) {
      const def = BLOONS[b.type];
      let spd = def.speed * 0.085 * speedScale;
      if (now < b.slowUntil) spd *= 0.42;
      b.progress += spd * dt;
      
      if (b.progress >= 1) {
        if (!state.sandbox) {
          state.lives -= rbeOf(b.type, b.mods);
          removeBloon(b);
          beep(110, 0.18, "sawtooth", 0.06);
          if (state.lives <= 0) {
            state.lives = 0;
            endGame(false);
          }
        } else {
          removeBloon(b);
        }
        continue;
      }
      const pos = getPointOnPath(b.progress);
      b.x = pos.x;
      b.y = pos.y;
      if (b.mods.regrow && GROW_CHAIN.includes(b.type) && now - b.lastHit > 3) {
        const idx = GROW_CHAIN.indexOf(b.type);
        const originIdx = GROW_CHAIN.indexOf(b.origin);
        if (idx >= 0 && originIdx > idx) {
          b.type = GROW_CHAIN[idx + 1];
          const nd = BLOONS[b.type];
          b.lastHit = now - 1.6;
        }
      }
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      
      if (p.iceEffect) {
        p.size *= 1.05;
      } else if (p.velocity) {
        p.x += p.velocity.x * dt;
        p.y += p.velocity.y * dt;
        p.velocity.y -= dt * 3;
      }
      
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function queueRound(index) {
    const groups = ROUNDS[index];
    const q = [];
    let t = 0.4;
    for (const g of groups) {
      t += g.wait || 0;
      for (let i = 0; i < g.n; i++) {
        q.push({ time: t, type: g.t, mods: g.mods || {} });
        t += g.gap;
      }
    }
    state.spawnQueue = q;
    state.spawnTime = 0;
  }

  function previewRound(i) {
    const groups = ROUNDS[i];
    if (!groups) return "Fim";
    const parts = groups.map((g) => {
      const name = BLOONS[g.t].name.toLowerCase();
      const extras = [];
      if (g.mods?.camo) extras.push("camo");
      if (g.mods?.regrow) extras.push("regrow");
      return `${g.n} ${name}${extras.length ? " (" + extras.join(", ") + ")" : ""}`;
    });
    return "Próxima: " + parts.join(" · ");
  }

  function startRound() {
    if (state.roundActive || !state.playing) return;
    if (state.round >= FINAL_ROUND) {
      endGame(true);
      return;
    }
    queueRound(state.round);
    state.round += 1;
    state.roundActive = true;
    document.getElementById("btn-start").disabled = true;
    updateHud();
    beep(520, 0.1, "sine", 0.05);
  }

  function completeRound() {
    state.roundActive = false;
    state.cash += 100 + state.round;
    document.getElementById("btn-start").disabled = false;
    toast(`Rodada ${state.round} concluída`);
    updateHud();
    if (state.round >= FINAL_ROUND) endGame(true);
    else if (state.auto) setTimeout(() => state.playing && startRound(), 500);
  }

  function endGame(win) {
    state.playing = false;
    state.roundActive = false;
    endOverlay.classList.remove("hidden");
    document.getElementById("end-title").textContent = win ? "Vitória!" : "Os balões passaram";
    document.getElementById("end-text").textContent = win
      ? `Você defendeu a trilha até a rodada ${FINAL_ROUND}. Estouros: ${state.pops}.`
      : `Fim na rodada ${state.round}. Estouros: ${state.pops}.`;
  }

  function resetGame() {
    state.bloons = [];
    state.towers = [];
    state.projectiles = [];
    state.particles = [];
    Object.assign(state, {
      lives: 150,
      cash: 650,
      pops: 0,
      round: 0,
      speed: 1,
      auto: false,
      playing: true,
      roundActive: false,
      placing: null,
      selected: null,
      spawnQueue: [],
      spawnTime: 0,
      sandbox: false,
    });
    document.getElementById("inspect").hidden = true;
    document.getElementById("btn-start").disabled = false;
    document.getElementById("btn-auto").textContent = "Auto: off";
    document.querySelectorAll(".speed button").forEach((b) => b.classList.toggle("active", b.dataset.speed === "1"));
    endOverlay.classList.add("hidden");
    overlay.classList.add("hidden");
    updateHud();
  }

  function updateMapUi() {
    const curMap = getCurrentMap();
    const hudIcon = document.getElementById("hud-map-icon");
    const hudName = document.getElementById("hud-map-name");
    if (hudIcon) hudIcon.textContent = curMap.icon;
    if (hudName) hudName.textContent = curMap.name;

    // Synchronize active cards
    document.querySelectorAll("#start-stage-cards .stage-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.map === state.currentMap);
    });

    document.querySelectorAll("#modal-stage-cards .stage-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.map === (state.selectedModalMap || state.currentMap));
    });
  }

  function setStage(mapId, notify = true) {
    if (!MAPS[mapId]) return;
    state.currentMap = mapId;
    state.selectedModalMap = mapId;
    resetGame();
    updateMapUi();
    if (notify) toast(`Fase selecionada: ${MAPS[mapId].name}`);
  }

  function updateHud() {
    document.getElementById("stat-lives").textContent = state.sandbox ? "∞" : Math.max(0, state.lives);
    document.getElementById("stat-cash").textContent = state.sandbox ? "∞" : state.cash;
    document.getElementById("stat-round").textContent = state.sandbox ? "Sandbox" : `${state.round} / ${FINAL_ROUND}`;
    document.getElementById("stat-pops").textContent = state.pops;
    document.getElementById("wave-preview").textContent = state.sandbox ? "Modo Sandbox - Livre" : previewRound(state.round);
    document.querySelectorAll(".shop-card").forEach((btn) => {
      const cost = TOWER_DEFS[btn.dataset.type].cost;
      btn.style.opacity = state.sandbox || state.cash >= cost ? "1" : "0.45";
    });
    updateMapUi();
  }

  function refreshInspect() {
    const tower = state.selected;
    const box = document.getElementById("inspect");
    if (!tower) {
      box.hidden = true;
      document.getElementById("nudge-controls").hidden = true;
      document.getElementById("nudge-btn").classList.remove("active");
      return;
    }
    const def = TOWER_DEFS[tower.type];
    box.hidden = false;
    document.getElementById("inspect-name").textContent = `${def.name} ★${tower.tier}`;
    document.getElementById("inspect-desc").textContent = def.desc;
    document.getElementById("inspect-stats").innerHTML = `
      <div>Alcance: ${tower.range.toFixed(1)}</div>
      <div>Cadência: ${tower.cooldown.toFixed(2)}s</div>
      <div>Dano: ${tower.damage} · Pierce: ${tower.pierce}</div>
      <div>Tipo: ${tower.damageType}${tower.detectCamo ? " · camo" : ""}</div>
      <div>Posição: X: ${tower.x.toFixed(2)}, Y: ${tower.y.toFixed(2)}</div>
    `;
    document.getElementById("target-mode").value = tower.targetMode;
    const next = def.upgrades[tower.tier];
    const up = document.getElementById("upgrade-btn");
    if (!next) {
      up.textContent = "Máximo";
      up.disabled = true;
    } else {
      up.disabled = false;
      up.textContent = state.sandbox ? `Melhorar — ${next.label}` : `Melhorar $${next.cost} — ${next.label}`;
    }
    document.getElementById("sell-btn").textContent = state.sandbox ? "Vender" : `Vender $${Math.floor(tower.spent * 0.7)}`;
    
    // Update nudge mode UI
    const nudgeBtn = document.getElementById("nudge-btn");
    const nudgeControls = document.getElementById("nudge-controls");
    nudgeBtn.classList.toggle("active", state.nudgeMode);
    nudgeControls.hidden = !state.nudgeMode;
  }

  function buildShop() {
    const list = document.getElementById("shop-list");
    list.innerHTML = "";
    Object.entries(TOWER_DEFS).forEach(([id, def]) => {
      const btn = document.createElement("button");
      btn.className = "shop-card";
      btn.dataset.type = id;
      btn.innerHTML = `<span class="swatch" style="background:${def.color}"></span>
        <span><b>${def.name}</b><small>${def.desc}</small></span>
        <span class="price">$${def.cost}</span>`;
      btn.addEventListener("click", () => {
        if (!state.sandbox && state.cash < def.cost) {
          toast("Dinheiro insuficiente");
          return;
        }
        state.placing = id;
        state.selected = null;
        refreshInspect();
        document.querySelectorAll(".shop-card").forEach((c) => c.classList.toggle("active", c === btn));
      });
      list.appendChild(btn);
    });

    // Build bloon spawner for sandbox
    const bloonButtons = document.getElementById("bloon-buttons");
    bloonButtons.innerHTML = "";
    Object.entries(BLOONS).forEach(([id, def]) => {
      const btn = document.createElement("button");
      btn.className = "bloon-btn";
      btn.textContent = def.name;
      btn.style.borderColor = def.color;
      btn.addEventListener("click", () => {
        if (!state.sandbox) return;
        spawnBloon(id, {});
        toast(`${def.name} spawnado`);
      });
      bloonButtons.appendChild(btn);
    });
  }

  function onPointerMove(e) {
    if (pan.active) {
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      pan.startX = e.clientX;
      pan.startY = e.clientY;
      camera.x -= dx / camera.zoom;
      camera.y -= dy / camera.zoom;
      return;
    }
    const world = screenToWorld(e.clientX, e.clientY);
    pointer.x = world.x;
    pointer.y = world.y;
  }

  function onPointerDown(e) {
    if (e.button === 2 || e.button === 1) {
      pan.active = true;
      pan.startX = e.clientX;
      pan.startY = e.clientY;
      return;
    }
    if (e.button !== 0) return;
    const world = screenToWorld(e.clientX, e.clientY);
    if (state.placing) {
      if (!canPlace(world.x, world.y)) {
        toast("Não dá para construir aqui");
        return;
      }
      const def = TOWER_DEFS[state.placing];
      if (!state.sandbox && state.cash < def.cost) return;
      if (!state.sandbox) state.cash -= def.cost;
      createTower(state.placing, world.x, world.y);
      state.placing = null;
      document.querySelectorAll(".shop-card").forEach((c) => c.classList.remove("active"));
      updateHud();
      beep(300, 0.07, "square", 0.04);
      return;
    }
    const clicked = state.towers.find((t) => Math.hypot(t.x - world.x, t.y - world.y) < 0.9);
    state.selected = clicked || null;
    refreshInspect();
  }

  function onPointerUp() {
    pan.active = false;
  }

  function onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    camera.zoom = Math.max(5, Math.min(50, camera.zoom * zoomFactor));
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      state.placing = null;
      state.nudgeMode = false;
      if (state.selected) refreshInspect();
    }
    if (e.key === " " && state.playing) {
      e.preventDefault();
      startRound();
    }
    
    // Nudge mode keyboard controls
    if (state.nudgeMode && state.selected) {
      const step = state.nudgeStep;
      let newX = state.selected.x;
      let newY = state.selected.y;
      
      switch(e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newY += step;
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newY -= step;
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newX -= step;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newX += step;
          e.preventDefault();
          break;
        default:
          return;
      }
      
      if (canPlace(newX, newY)) {
        state.selected.x = newX;
        state.selected.y = newY;
        refreshInspect();
        beep(200, 0.05, "sine", 0.03);
      } else {
        toast("Não pode mover para essa posição");
        beep(100, 0.1, "sawtooth", 0.04);
      }
    }
  }

  function bindUi() {
    document.getElementById("btn-play").onclick = () => {
      overlay.classList.add("hidden");
      state.playing = true;
      if (audio.ctx?.resume) audio.ctx.resume();
      beep(440, 0.12, "sine", 0.05);
    };
    document.getElementById("btn-retry").onclick = resetGame;
    document.getElementById("btn-start").onclick = startRound;
    document.getElementById("btn-auto").onclick = (e) => {
      state.auto = !state.auto;
      e.target.textContent = state.auto ? "Auto: on" : "Auto: off";
      if (state.auto && !state.roundActive) startRound();
    };
    document.getElementById("btn-sandbox").onclick = (e) => {
      state.sandbox = !state.sandbox;
      e.target.classList.toggle("active", state.sandbox);
      document.getElementById("bloon-spawner").hidden = !state.sandbox;
      if (state.sandbox) {
        toast("Modo Sandbox ativado");
        state.auto = false;
        document.getElementById("btn-auto").textContent = "Auto: off";
      } else {
        toast("Modo Sandbox desativado");
      }
      updateHud();
    };
    document.querySelectorAll(".speed button").forEach((btn) => {
      btn.onclick = () => {
        state.speed = Number(btn.dataset.speed);
        document.querySelectorAll(".speed button").forEach((b) => b.classList.toggle("active", b === btn));
      };
    });
    document.getElementById("upgrade-btn").onclick = () => state.selected && upgradeTower(state.selected);
    document.getElementById("sell-btn").onclick = () => state.selected && sellTower(state.selected);
    document.getElementById("target-mode").onchange = (e) => {
      if (state.selected) state.selected.targetMode = e.target.value;
    };
    document.getElementById("nudge-btn").onclick = () => {
      if (!state.selected) return;
      state.nudgeMode = !state.nudgeMode;
      refreshInspect();
      if (state.nudgeMode) {
        toast("Modo Nudge ativado - use setas para ajustar");
      } else {
        toast("Modo Nudge desativado");
      }
    };
    document.querySelectorAll(".nudge-controls button").forEach((btn) => {
      btn.onclick = () => {
        if (!state.selected || !state.nudgeMode) return;
        const dir = btn.dataset.dir;
        const step = state.nudgeStep;
        
        let newX = state.selected.x;
        let newY = state.selected.y;
        
        switch(dir) {
          case "up": newY += step; break;
          case "down": newY -= step; break;
          case "left": newX -= step; break;
          case "right": newX += step; break;
        }
        
        // Check if new position is valid
        if (canPlace(newX, newY)) {
          state.selected.x = newX;
          state.selected.y = newY;
          refreshInspect();
          beep(200, 0.05, "sine", 0.03);
        } else {
          toast("Não pode mover para essa posição");
          beep(100, 0.1, "sawtooth", 0.04);
        }
      };
    });
    // Stage selection from initial overlay
    document.querySelectorAll("#start-stage-cards .stage-card").forEach((btn) => {
      btn.onclick = () => {
        const mapId = btn.dataset.map;
        if (!MAPS[mapId]) return;
        state.currentMap = mapId;
        state.selectedModalMap = mapId;
        updateMapUi();
        beep(360, 0.08, "triangle", 0.04);
      };
    });

    // Map selector button in top HUD
    const mapModal = document.getElementById("map-modal");
    const btnMapSelect = document.getElementById("btn-map-select");
    if (btnMapSelect && mapModal) {
      btnMapSelect.onclick = () => {
        state.selectedModalMap = state.currentMap;
        updateMapUi();
        mapModal.classList.remove("hidden");
      };
    }

    // Modal card selection
    document.querySelectorAll("#modal-stage-cards .stage-card").forEach((btn) => {
      btn.onclick = () => {
        const mapId = btn.dataset.map;
        if (!MAPS[mapId]) return;
        state.selectedModalMap = mapId;
        updateMapUi();
        beep(360, 0.08, "triangle", 0.04);
      };
    });

    // Modal buttons
    const btnModalCancel = document.getElementById("btn-modal-cancel");
    if (btnModalCancel && mapModal) {
      btnModalCancel.onclick = () => mapModal.classList.add("hidden");
    }

    const btnModalConfirm = document.getElementById("btn-modal-confirm");
    if (btnModalConfirm && mapModal) {
      btnModalConfirm.onclick = () => {
        mapModal.classList.add("hidden");
        if (state.selectedModalMap) {
          setStage(state.selectedModalMap, true);
        }
      };
    }

    // Change map button from game over screen
    const btnEndMap = document.getElementById("btn-end-map");
    if (btnEndMap && mapModal) {
      btnEndMap.onclick = () => {
        endOverlay.classList.add("hidden");
        state.selectedModalMap = state.currentMap;
        updateMapUi();
        mapModal.classList.remove("hidden");
      };
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
  }

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, 1/60) * state.speed;
    const now = performance.now() / 1000;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game world & ambient weather
    drawGround(now);
    drawPath(now);
    drawAmbientWeather(dt, now);
    
    if (state.playing) {
      if (state.roundActive) {
        state.spawnTime += dt;
        while (state.spawnQueue.length && state.spawnQueue[0].time <= state.spawnTime) {
          const s = state.spawnQueue.shift();
          spawnBloon(s.type, s.mods);
        }
        updateTowers(dt, now);
        updateProjectiles(dt);
        updateBloons(dt, now);
        if (!state.spawnQueue.length && !state.bloons.length) completeRound();
      }
      updateParticles(dt);
      
      // Draw game objects
      state.towers.forEach(drawTower);
      state.bloons.forEach(drawBloon);
      state.projectiles.forEach(drawProjectile);
      state.particles.forEach(drawParticle);
    }
    
    drawGhost();
  }

  initCanvas();
  buildShop();
  bindUi();
  updateHud();
  loop();
})();