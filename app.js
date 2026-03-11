/* ============================================================
   STELLARIUM — app.js
   ============================================================ */

'use strict';

/* ── Constants ─────────────────────────────────────────── */
const GRADES  = ['中1','中2','中3','高1','高2','高3'];
const CLASSES = ['A','B','C','D','E'];

const CIV_LEVELS = [
  { lv:1, name:'原始文明',   range:'自分の1惑星のみ',         cost_炉:0,     cost_演:0,     cost_鋼:0,     cost_暗:0,  cum_炉:0,     cum_鋼:0,     cum_暗:0  },
  { lv:2, name:'航星文明',   range:'同一銀河内（4惑星）',     cost_炉:200,   cost_演:200,   cost_鋼:0,     cost_暗:0,  cum_炉:200,   cum_鋼:0,     cum_暗:0  },
  { lv:3, name:'銀河文明',   range:'同一銀河団の隣接銀河まで',cost_炉:500,   cost_演:500,   cost_鋼:0,     cost_暗:0,  cum_炉:700,   cum_鋼:0,     cum_暗:0  },
  { lv:4, name:'星間文明',   range:'同一銀河団の全銀河',      cost_炉:1300,  cost_演:1300,  cost_鋼:700,   cost_暗:0,  cum_炉:2000,  cum_鋼:700,   cum_暗:0  },
  { lv:5, name:'大星間文明', range:'隣接銀河団まで',          cost_炉:3500,  cost_演:3500,  cost_鋼:1300,  cost_暗:0,  cum_炉:5500,  cum_鋼:2000,  cum_暗:0  },
  { lv:6, name:'銀河団文明', range:'全銀河団に展開可能',      cost_炉:9500,  cost_演:9500,  cost_鋼:3000,  cost_暗:10, cum_炉:15000, cum_鋼:5000,  cum_暗:10 },
  { lv:7, name:'超銀河文明', range:'最高威信',                cost_炉:35000, cost_演:35000, cost_鋼:15000, cost_暗:50, cum_炉:50000, cum_鋼:20000, cum_暗:60 },
];

const PLANET_LV = [
  { lv:1, name:'開拓地',     mult:1.0,  cost_炉:0,    cost_演:0,    cost_鋼:0,    cost_暗:0, cum_炉:0,    cum_鋼:0,    cum_暗:0  },
  { lv:2, name:'集落',       mult:1.5,  cost_炉:500,  cost_演:500,  cost_鋼:0,    cost_暗:0, cum_炉:500,  cum_鋼:0,    cum_暗:0  },
  { lv:3, name:'都市',       mult:2.5,  cost_炉:500,  cost_演:500,  cost_鋼:0,    cost_暗:0, cum_炉:1000, cum_鋼:0,    cum_暗:0  },
  { lv:4, name:'惑星国家',   mult:4.0,  cost_炉:1200, cost_演:1200, cost_鋼:300,  cost_暗:0, cum_炉:2200, cum_鋼:300,  cum_暗:0  },
  { lv:5, name:'星間都市',   mult:6.0,  cost_炉:1800, cost_演:1800, cost_鋼:600,  cost_暗:0, cum_炉:4000, cum_鋼:900,  cum_暗:0  },
  { lv:6, name:'恒星文明圏', mult:8.0,  cost_炉:2500, cost_演:2500, cost_鋼:1600, cost_暗:5, cum_炉:6500, cum_鋼:2500, cum_暗:5  },
  { lv:7, name:'超銀河都市', mult:10.0, cost_炉:3500, cost_演:3500, cost_鋼:2500, cost_暗:5, cum_炉:10000,cum_鋼:5000, cum_暗:10 },
];

const SOLDIER_LV = [
  { lv:1, name:'民兵',       power:1  },
  { lv:2, name:'正規兵',     power:2  },
  { lv:3, name:'精鋭兵',     power:4  },
  { lv:4, name:'機械兵',     power:8  },
  { lv:5, name:'強化機械兵', power:16 },
  { lv:6, name:'量子兵',     power:32 },
  { lv:7, name:'超空間兵',   power:64 },
];

const PLANET_TYPES = [
  { key:'炉', label:'炉晶特化型', output: { 炉晶:100, 演晶:0,  鋼材:0  } },
  { key:'演', label:'演晶特化型', output: { 炉晶:0,   演晶:100, 鋼材:0  } },
  { key:'資', label:'資源型',     output: { 炉晶:40,  演晶:40,  鋼材:20 } },
  { key:'要', label:'要塞型',     output: { 炉晶:0,   演晶:0,   鋼材:60 } },
  { key:'未', label:'未開拓型',   output: null },
];

const UPPER_SKILLS = [
  { no:1,  icon:'⭐', name:'万象の恵み',   desc:'全資源獲得量×1.5（永久）',                             tier:'上位' },
  { no:2,  icon:'👑', name:'帝国宣言',     desc:'連合上限人数を80名に拡張（永久）',                      tier:'上位' },
  { no:3,  icon:'💎', name:'全蔵の恵み',   desc:'開始時に炉晶400/演晶400/鋼材200/暗黒2でスタート',       tier:'上位' },
  { no:4,  icon:'🌟', name:'星の加護（上）',desc:'終了時にリーダーへ付与されるすべての数値に掛ける。1位なら×5倍', tier:'上位' },
  { no:5,  icon:'⚡', name:'覇者の証',     desc:'同盟・戦争関係にある連合の数Nだけ全資源獲得量と戦力に+0.1N倍バフ（永久・関係数に連動）', tier:'上位' },
];
const LOWER_SKILLS = [
  { no:6,  icon:'🔥', name:'炉晶の恵み',   desc:'炉晶獲得量×2（永久）',           tier:'下位' },
  { no:7,  icon:'💠', name:'演晶の恵み',   desc:'演晶獲得量×2（永久）',           tier:'下位' },
  { no:8,  icon:'⚙️', name:'鋼材の恵み',   desc:'鋼材獲得量×2（永久）',           tier:'下位' },
  { no:9,  icon:'🌑', name:'暗黒の恵み',   desc:'暗黒物質獲得量×2（永久）',       tier:'下位' },
  { no:10, icon:'🏰', name:'大連合令',     desc:'連合上限人数を60名に拡張（永久）',tier:'下位' },
  { no:11, icon:'📦', name:'炉晶の蔵',     desc:'開始時に炉晶600個でスタート',    tier:'下位' },
  { no:12, icon:'📦', name:'演晶の蔵',     desc:'開始時に演晶600個でスタート',    tier:'下位' },
  { no:13, icon:'📦', name:'鋼材の蔵',     desc:'開始時に鋼材300個でスタート',    tier:'下位' },
  { no:14, icon:'📦', name:'暗黒の蔵',     desc:'開始時に暗黒物質3個でスタート',  tier:'下位' },
  { no:15, icon:'✨', name:'星の加護（下）',desc:'終了時にリーダーへ付与されるすべての数値に掛ける。上位50%以内なら×1.5倍', tier:'下位' },
];

/* ── State ─────────────────────────────────────────────── */
let state = {
  day: 1,
  selectedId: null,
  alliances: [],     // array of Alliance objects
  nextAllianceId: 1,
  nextPlanetId: 1,
};

/* ── Alliance factory ──────────────────────────────────── */
function makeAlliance(grade, cls) {
  return {
    id:      state.nextAllianceId++,
    grade,                        // e.g. '高2'
    cls,                          // e.g. 'A'
    name:    `${grade}${cls}クラス連合`,
    leader:  '',
    members: 40,
    civLv:   1,
    res:     { 炉晶:0, 演晶:0, 鋼材:0, 暗黒:0 },
    planets: [],
    soldiers:{ 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 },
    allies:  [],      // { targetId, type:'normal'|'vassal'|'secret'|'war', targetName }
    notes:   '',
  };
}

function makePlanet(name, type, lv) {
  return { id: state.nextPlanetId++, name, type, lv: parseInt(lv) };
}

/* ── Helpers ───────────────────────────────────────────── */
const h = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const byId = id => document.getElementById(id);

function toast(msg, dur = 2800) {
  const el = byId('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), dur);
}

function getPlanetBaseOutput(type) {
  const def = PLANET_TYPES.find(t => t.key === type);
  return def?.output ?? { 炉晶:0, 演晶:0, 鋼材:0 };
}

function getPlanetDailyOutput(planet) {
  if (planet.type === '未' && planet.lv < 6) return { 炉晶:0, 演晶:0, 鋼材:0, 暗黒:0 };
  const base = getPlanetBaseOutput(planet.type);
  const mult = PLANET_LV[planet.lv - 1].mult;
  // Lv6 未開拓型 → 自由にタイプ選択・産出×1.5 (simplified: output same as 資源型 × mult × 1.5)
  const factor = (planet.type === '未' && planet.lv >= 6) ? mult * 1.5 : mult;
  return {
    炉晶: Math.round((base.炉晶 || 0) * factor),
    演晶: Math.round((base.演晶 || 0) * factor),
    鋼材: Math.round((base.鋼材 || 0) * factor),
    暗黒: 0,
  };
}

function calcDailyTotal(alliance) {
  const tot = { 炉晶:0, 演晶:0, 鋼材:0, 暗黒:0 };
  alliance.planets.forEach(p => {
    const o = getPlanetDailyOutput(p);
    Object.keys(tot).forEach(k => { tot[k] += o[k] || 0; });
  });
  return tot;
}

function calcScore(alliance) {
  const n = alliance.planets.length;
  if (n === 0) return 0;
  const sumLv = alliance.planets.reduce((s, p) => s + p.lv, 0);
  return sumLv * n;
}

function calcTotalRes(alliance) {
  return Object.values(alliance.res).reduce((s, v) => s + v, 0);
}

function calcTotalSoldierPower(alliance) {
  return SOLDIER_LV.reduce((s, sl) => s + sl.power * (alliance.soldiers[sl.lv] || 0), 0);
}

function getRanked() {
  return [...state.alliances].sort((a, b) => {
    const ds = calcScore(b) - calcScore(a);
    if (ds !== 0) return ds;
    return calcTotalRes(b) - calcTotalRes(a);
  });
}

function getRankClass(rank, total) {
  if (rank === 1) return 'r1';
  if (rank <= 3) return 'r2';
  if (rank >= total - 2) return 'rbottom';
  return '';
}

/* ── Starfield ─────────────────────────────────────────── */
function initStarfield() {
  const canvas = byId('starfield-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function init() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.8 + 0.1,
      d: (Math.random() - 0.5) * 0.015,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,225,255,${s.o})`;
      ctx.fill();
      s.o += s.d;
      if (s.o < 0.05) { s.o = 0.05; s.d *= -1; }
      if (s.o > 0.92)  { s.o = 0.92; s.d *= -1; }
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', init);
  init(); draw();
}

/* ── Navigation ────────────────────────────────────────── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  byId('page-' + page).classList.add('active');
  const map = { alliances:0, ranking:1, battle:2, rules:3 };
  const btns = document.querySelectorAll('.nav-btn');
  if (btns[map[page]]) btns[map[page]].classList.add('active');

  if (page === 'ranking') { renderRanking(); const rd = byId('rank-day'); if(rd) rd.textContent = state.day; }
  if (page === 'battle')  initBattleCalc();
}

/* ── Day ───────────────────────────────────────────────── */
function changeDay(d) {
  state.day = Math.max(1, Math.min(7, state.day + d));
  byId('day-badge').textContent = 'DAY ' + state.day;
  const badge = byId('galactic-war-badge');
  if (state.day === 7) {
    badge.classList.add('visible');
    toast('🌌 最終日！第3・第4周期に銀河大戦争が自動発動します', 4000);
  } else {
    badge.classList.remove('visible');
  }
}

/* ============================================================
   ALLIANCE LIST & DETAIL RENDER
   ============================================================ */
function renderAllianceList() {
  const scroll = byId('alliance-list-scroll');
  const ranked = getRanked();
  const total  = ranked.length;

  scroll.innerHTML = ranked.map((a, i) => {
    const rank = i + 1;
    const rc   = getRankClass(rank, total);
    const sel  = a.id === state.selectedId ? ' selected' : '';
    return `
      <div class="alliance-item${sel}" onclick="selectAlliance(${a.id})">
        <div class="ai-top">
          <span class="ai-name">${h(a.name)}</span>
          <span class="ai-score">${calcScore(a).toLocaleString()}</span>
        </div>
        <div class="ai-meta">
          <span class="civ-lv-tag">Lv${a.civLv}</span>
          <span>${h(CIV_LEVELS[a.civLv - 1].name)}</span>
          <span style="margin-left:auto">${a.planets.length}惑星</span>
        </div>
        <div class="ai-res">
          <span class="res-pill r炉">炉${a.res.炉晶}</span>
          <span class="res-pill r演">演${a.res.演晶}</span>
          <span class="res-pill r鋼">鋼${a.res.鋼材}</span>
          <span class="res-pill r暗">暗${a.res.暗黒}</span>
        </div>
        ${rc ? `<span class="rank-badge ${rc}">#${rank}</span>` : `<span class="rank-badge text-dim" style="color:var(--text-dim)">#${rank}</span>`}
      </div>`;
  }).join('');
}

function selectAlliance(id) {
  state.selectedId = id;
  renderAllianceList();
  renderAllianceDetail();
  // make sure alliances page is visible
  showPage('alliances');
}

function renderAllianceDetail() {
  const panel = byId('alliance-detail-panel');
  const a = state.alliances.find(x => x.id === state.selectedId);

  if (!a) {
    panel.innerHTML = `<div class="detail-inner"><div class="empty-state">
      <div class="empty-icon">🌌</div>
      <div>左のリストから連合を選択してください</div>
    </div></div>`;
    return;
  }

  const ranked = getRanked();
  const rank   = ranked.findIndex(x => x.id === a.id) + 1;
  const total  = ranked.length;
  const rc     = getRankClass(rank, total);
  const score  = calcScore(a);
  const civ    = CIV_LEVELS[a.civLv - 1];
  const sumLv  = a.planets.reduce((s, p) => s + p.lv, 0);
  const daily  = calcDailyTotal(a);
  const tp     = calcTotalSoldierPower(a);

  panel.innerHTML = `<div class="detail-inner" id="detail-scroll">

    <!-- Header -->
    <div class="a-header-row">
      <div>
        <div class="a-title">${h(a.name)}</div>
        <div class="a-subtitle">リーダー: ${h(a.leader) || '未設定'} ／ ${a.members}名 ／ ${h(a.grade)}${h(a.cls)}クラス</div>
        <div class="a-subtitle mt-4">
          <button onclick="openEditAllianceModal(${a.id})" style="background:none;border:1px solid var(--border);color:var(--text-dim);font-size:10px;padding:2px 8px;border-radius:2px;cursor:pointer;">✎ 編集</button>
        </div>
      </div>
      <div class="a-right">
        <div class="civ-card">
          <div class="civ-lv-big">Lv${a.civLv}</div>
          <div class="civ-name-sm">${h(civ.name)}</div>
        </div>
        <div class="rank-card">
          <div class="rank-big ${rc}">#${rank}</div>
          <div class="rank-lbl">順位</div>
        </div>
      </div>
    </div>

    <!-- Score bar -->
    <div class="score-bar">
      <div>
        <div class="score-val">${score.toLocaleString()}</div>
        <div class="score-lbl">SCORE</div>
        <div class="score-formula">Σ発展Lv(${sumLv}) × 惑星数(${a.planets.length})</div>
      </div>
      <div class="daily-est">
        1日推定産出<br>
        <span style="color:var(--res-炉)">炉${daily.炉晶}</span>
        <span style="color:var(--res-演)">演${daily.演晶}</span>
        <span style="color:var(--res-鋼)">鋼${daily.鋼材}</span>
        <span style="color:var(--res-暗)">暗${daily.暗黒}</span>
      </div>
    </div>

    <!-- Resources -->
    <div class="sec-title">■ RESOURCES</div>
    <div class="res-grid">
      ${['炉晶','演晶','鋼材','暗黒'].map(k => {
        const icons = { 炉晶:'🔥', 演晶:'💠', 鋼材:'⚙️', 暗黒:'🌑' };
        return `<div class="res-card rc${k}">
          <div class="res-card-icon">${icons[k]}</div>
          <div class="res-card-lbl">${k}</div>
          <div class="res-card-val">${a.res[k]}</div>
          <input class="res-card-input" type="number" min="0" value="${a.res[k]}"
            onchange="setRes(${a.id},'${k}',this.value)" />
        </div>`;
      }).join('')}
    </div>

    <!-- Civilization Level -->
    <div class="sec-title">■ CIVILIZATION LEVEL</div>
    <div class="civ-upgrade-list">
      ${CIV_LEVELS.map(c => {
        const isCur = a.civLv === c.lv;
        const costStr = c.lv === 1 ? '初期文明'
          : `累積 炉晶×${c.cum_炉.toLocaleString()}${c.cum_鋼?` 鋼材×${c.cum_鋼.toLocaleString()}`:''}${c.cum_暗?` 暗黒×${c.cum_暗}`:''}`;
        return `<div class="civ-row${isCur?' current-lv':''}">
          <div class="civ-num">${c.lv}</div>
          <div>
            <div class="civ-info-name">${h(c.name)}</div>
            <div class="civ-info-cost">${costStr} ／ 範囲: ${h(c.range)}</div>
          </div>
          <button class="civ-set-btn${isCur?' is-current':''}" ${isCur?'disabled':''} onclick="setCivLv(${a.id},${c.lv})">
            ${isCur ? '◆ 現在' : '設定'}
          </button>
        </div>`;
      }).join('')}
    </div>

    <!-- Planets -->
    <div class="sec-title">■ PLANETS（${a.planets.length}惑星）</div>
    <div class="planet-grid">
      ${a.planets.map(p => renderPlanetCard(p, a)).join('')}
      <div class="add-planet-slot" onclick="openAddPlanetModal(${a.id})">＋</div>
    </div>

    <!-- Soldiers -->
    <div class="sec-title">■ SOLDIERS</div>
    <div class="soldiers-grid">
      ${SOLDIER_LV.map(sl => `
        <div class="soldier-card">
          <div class="soldier-lv">${sl.lv}</div>
          <div class="soldier-name">${h(sl.name)}</div>
          <div class="soldier-power">💪${sl.power}</div>
          <input class="soldier-input" type="number" min="0" value="${a.soldiers[sl.lv]||0}"
            onchange="setSoldier(${a.id},${sl.lv},this.value)" />
        </div>`).join('')}
    </div>
    <div class="total-power-row">
      <span class="total-power-label">総戦闘力：</span>
      <span class="total-power-val">${tp.toLocaleString()}</span>
    </div>

    <!-- Diplomacy -->
    <div class="sec-title">■ DIPLOMACY</div>
    <div class="diplo-tags">
      ${a.allies.length === 0
        ? '<span class="text-dim" style="font-size:11px">外交関係なし</span>'
        : a.allies.map(al => {
          const labels = { normal:'通常同盟', vassal:'属国同盟', secret:'🤫 秘密協定', war:'⚔️ 宣戦' };
          return `<span class="diplo-tag dt-${al.type}" onclick="removeDiplo(${a.id},${al.targetId})" title="クリックで削除">
            ${labels[al.type]} ${h(al.targetName)} ✕
          </span>`;
        }).join('')}
    </div>
    <div class="diplo-add-row">
      ${['normal','vassal','secret','war'].map(type => {
        const lbl = { normal:'通常同盟', vassal:'属国同盟', secret:'秘密協定', war:'宣戦布告' };
        return `<button class="diplo-add-btn" onclick="openDiploModal(${a.id},'${type}')">＋${lbl[type]}</button>`;
      }).join('')}
    </div>

    <!-- Notes -->
    <div class="sec-title">■ NOTES</div>
    <textarea class="notes-area" placeholder="メモ..." oninput="setNote(${a.id},this.value)">${h(a.notes)}</textarea>

    <!-- Actions -->
    <div class="action-row">
      <button class="btn-primary" onclick="grantDailyRes(${a.id})">📅 1日分の資源を付与</button>
      <button class="btn-primary" onclick="grantDailySoldiers(${a.id})">⚔️ 1日分の兵士を付与</button>
      <button class="btn-danger" onclick="deleteAlliance(${a.id})">削除</button>
    </div>
  </div>`;
}

function renderPlanetCard(p, a) {
  const lvInfo = PLANET_LV[p.lv - 1];
  const out    = getPlanetDailyOutput(p);
  const stars  = Array.from({ length: 7 }, (_, i) =>
    `<div class="star-dot${i < p.lv ? ' lit' : ''}"></div>`).join('');
  const outStr = Object.entries(out)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k[0]}:${v}`)
    .join(' ');
  // warn if planet lv > civ lv
  const warn = p.lv > a.civLv ? ' style="border-color:rgba(255,96,48,.6)"' : '';
  return `<div class="planet-card owned"${warn}>
    <div class="pc-top">
      <span class="pc-name">${h(p.name)}</span>
      <span class="type-badge tb${p.type}">${p.type}</span>
    </div>
    <div class="pc-stars">${stars}</div>
    <select class="pc-lv-select" onchange="setPlanetLv(${a.id},${p.id},this.value)">
      ${PLANET_LV.map(l =>
        `<option value="${l.lv}"${p.lv===l.lv?' selected':''}>${l.lv} ${l.name}(×${l.mult})</option>`
      ).join('')}
    </select>
    <div class="pc-output">${outStr || '産出なし'} /日</div>
    <button class="pc-del-btn" onclick="removePlanet(${a.id},${p.id})">削除</button>
  </div>`;
}

/* ── Right summary panel ────────────────────────────────── */
function renderSummaryPanel() {
  const panel = byId('summary-inner');
  const a = state.alliances.find(x => x.id === state.selectedId);
  if (!a) {
    panel.innerHTML = '<div class="text-dim" style="font-size:11px;padding:8px">連合を選択してください</div>';
    return;
  }

  const daily = calcDailyTotal(a);
  const tp    = calcTotalSoldierPower(a);

  panel.innerHTML = `
    <div class="sec-title">本日推定産出</div>
    <div style="font-family:var(--font-mono);font-size:11px;line-height:2;margin-bottom:10px;">
      <div><span style="color:var(--res-炉)">恒星炉晶</span>  +${daily.炉晶}</div>
      <div><span style="color:var(--res-演)">演算結晶</span>  +${daily.演晶}</div>
      <div><span style="color:var(--res-鋼)">重力鋼材</span>  +${daily.鋼材}</div>
      <div><span style="color:var(--res-暗)">暗黒物質</span>  +${daily.暗黒}</div>
    </div>

    <div class="sec-title">スコア計算</div>
    <div style="font-family:var(--font-mono);font-size:11px;line-height:2;margin-bottom:10px;">
      <div>惑星数: ${a.planets.length}</div>
      <div>発展Lv合計: ${a.planets.reduce((s,p)=>s+p.lv,0)}</div>
      <div style="color:var(--gold);font-size:15px;font-weight:bold;">SCORE: ${calcScore(a).toLocaleString()}</div>
    </div>

    <div class="sec-title">兵力</div>
    <div style="font-family:var(--font-mono);font-size:11px;line-height:2;margin-bottom:10px;">
      ${SOLDIER_LV.map(sl =>
        a.soldiers[sl.lv] > 0
          ? `<div>Lv${sl.lv} ${h(sl.name)}: ${a.soldiers[sl.lv]}体 (${sl.power * a.soldiers[sl.lv]})</div>`
          : ''
      ).join('')}
      <div style="color:var(--gold)">総戦闘力: ${tp.toLocaleString()}</div>
    </div>

    <button class="daily-grant-btn" onclick="grantDailyRes(${a.id})">📅 1日分の資源を付与</button>
    <button class="daily-grant-btn" style="margin-top:6px;color:var(--accent);border-color:rgba(58,174,255,.28);background:rgba(58,174,255,.07);" onclick="grantDailySoldiers(${a.id})">⚔️ 1日分の兵士を付与</button>
  `;
}

/* ── Alliance mutations ─────────────────────────────────── */
function setRes(id, key, val) {
  const a = state.alliances.find(x => x.id === id);
  if (!a) return;
  a.res[key] = Math.max(0, parseInt(val) || 0);
  renderAllianceList();
  renderSummaryPanel();
}

function setCivLv(id, lv) {
  const a = state.alliances.find(x => x.id === id);
  if (!a) return;
  a.civLv = lv;
  renderAll();
  toast(`${a.name} → 文明Lv${lv} ${CIV_LEVELS[lv-1].name}`);
}

function setSoldier(id, lv, val) {
  const a = state.alliances.find(x => x.id === id);
  if (!a) return;
  a.soldiers[lv] = Math.max(0, parseInt(val) || 0);
  // update total power display without full re-render
  const tpEl = document.querySelector('.total-power-val');
  if (tpEl) tpEl.textContent = calcTotalSoldierPower(a).toLocaleString();
  renderSummaryPanel();
}

function setPlanetLv(allianceId, planetId, lv) {
  const a = state.alliances.find(x => x.id === allianceId);
  if (!a) return;
  const p = a.planets.find(x => x.id === planetId);
  if (!p) return;
  p.lv = parseInt(lv);
  if (p.lv > a.civLv) toast(`⚠️ 惑星Lvが文明Lv(${a.civLv})を超えています`);
  renderAll();
}

function removePlanet(allianceId, planetId) {
  const a = state.alliances.find(x => x.id === allianceId);
  if (!a) return;
  a.planets = a.planets.filter(x => x.id !== planetId);
  renderAll();
  toast('惑星を削除しました');
}

function grantDailyRes(id) {
  const a = state.alliances.find(x => x.id === id);
  if (!a) return;
  const d = calcDailyTotal(a);
  Object.keys(d).forEach(k => { a.res[k] = (a.res[k] || 0) + d[k]; });
  renderAll();
  toast(`Day${state.day} 資源付与 ✓`);
}

function grantDailySoldiers(id) {
  const a = state.alliances.find(x => x.id === id);
  if (!a) return;
  let count = 0;
  a.planets.forEach(p => {
    if (p.type === '未' && p.lv < 6) return;
    a.soldiers[p.lv] = (a.soldiers[p.lv] || 0) + 1;
    count++;
  });
  renderAll();
  toast(`兵士付与 +${count}体 ✓`);
}

function setNote(id, val) {
  const a = state.alliances.find(x => x.id === id);
  if (a) a.notes = val;
}

function deleteAlliance(id) {
  if (!confirm('この連合を削除しますか？')) return;
  state.alliances = state.alliances.filter(x => x.id !== id);
  state.selectedId = null;
  renderAll();
  toast('連合を削除しました');
}

function removeDiplo(allianceId, targetId) {
  const a = state.alliances.find(x => x.id === allianceId);
  if (!a) return;
  a.allies = a.allies.filter(x => x.targetId !== targetId);
  renderAll();
}

/* ── Render all ─────────────────────────────────────────── */
function renderAll() {
  renderAllianceList();
  renderAllianceDetail();
  renderSummaryPanel();
}

/* ============================================================
   RANKING PAGE
   ============================================================ */
function renderRanking() {
  const ranked = getRanked();
  const total  = ranked.length;
  const tbody  = byId('rank-tbody');

  tbody.innerHTML = ranked.map((a, i) => {
    const rank = i + 1;
    const rc   = getRankClass(rank, total);
    const rw   = getRewardBadge(rank, total);
    return `<tr onclick="selectAlliance(${a.id})">
      <td><span class="rk-num ${rc}">${rank}</span></td>
      <td class="rk-name">${h(a.name)}</td>
      <td class="rk-civ"><span class="civ-lv-tag">Lv${a.civLv}</span></td>
      <td class="rk-planets text-mono">${a.planets.length}</td>
      <td class="rk-score">${calcScore(a).toLocaleString()}</td>
      <td class="rk-res">${calcTotalRes(a).toLocaleString()}</td>
      <td>${rw}</td>
    </tr>`;
  }).join('');
}

function getRewardBadge(rank, total) {
  if (rank === 1)         return '<span class="reward-badge rw-1st">1位 +100,000PP / +300CP</span>';
  if (rank <= 3)          return '<span class="reward-badge rw-top3">2〜3位 +50,000PP / +200CP</span>';
  if (rank <= 10)         return '<span class="reward-badge rw-top10">4〜10位 +30,000PP / +100CP</span>';
  if (rank <= 20)         return '<span class="reward-badge rw-top20">11〜20位 +10,000PP</span>';
  if (rank === total)     return '<span class="reward-badge rw-last">最下位 −200CP ⚠️退学</span>';
  if (rank >= total - 9)  return '<span class="reward-badge rw-bottom">下位10位 −100CP ⚠️退学</span>';
  return '<span class="reward-badge" style="color:var(--text-dim);border:1px solid var(--border)">21位以下 +5,000PP</span>';
}

/* ============================================================
   BATTLE CALCULATOR
   ============================================================ */
function initBattleCalc() {
  buildBattleSide('atk');
  buildBattleSide('def');
  calcBattle();
}

function buildBattleSide(side) {
  const container = byId(`bt-${side}-soldiers`);
  container.innerHTML = SOLDIER_LV.map(sl => `
    <div class="bt-soldier-row">
      <div class="bt-lv-badge">${sl.lv}</div>
      <div class="bt-name">${h(sl.name)}</div>
      <div class="bt-power-tag">×${sl.power}</div>
      <input class="bt-input" id="bt-${side}-s${sl.lv}" type="number" min="0" value="0"
        oninput="calcBattle()" />
    </div>`).join('');
}

function calcBattle() {
  let atkRaw = 0, defRaw = 0;
  SOLDIER_LV.forEach(sl => {
    const av = parseInt(byId(`bt-atk-s${sl.lv}`)?.value || 0) || 0;
    const dv = parseInt(byId(`bt-def-s${sl.lv}`)?.value || 0) || 0;
    atkRaw += av * sl.power;
    defRaw += dv * sl.power;
  });
  const defAdj = defRaw * 1.5;

  byId('bt-atk-total').textContent = atkRaw.toLocaleString();
  byId('bt-def-total').textContent = defRaw.toLocaleString();
  byId('br-atk-power').textContent = atkRaw.toLocaleString();
  byId('br-def-power').textContent = defAdj.toFixed(1);

  const winnerEl   = byId('br-winner');
  const survivorEl = byId('br-survivors');

  if (atkRaw === 0 && defRaw === 0) {
    winnerEl.className = 'br-winner neutral';
    winnerEl.textContent = '数値を入力してください';
    survivorEl.textContent = '';
    return;
  }

  let winnerText, winnerClass, remainPower;
  if (atkRaw > defAdj) {
    remainPower = atkRaw - defAdj;
    winnerText  = '⚔️ 攻撃側勝利';
    winnerClass = 'atk-win';
  } else {
    remainPower = defAdj - atkRaw;
    winnerText  = '🛡️ 防衛側勝利';
    winnerClass = 'def-win';
  }

  winnerEl.className = `br-winner ${winnerClass}`;
  winnerEl.textContent = winnerText;
  survivorEl.textContent = '残存: ' + calcSurvivors(remainPower);
}

function calcSurvivors(power) {
  let rem = power;
  const parts = [];
  for (let i = SOLDIER_LV.length - 1; i >= 0; i--) {
    const sl = SOLDIER_LV[i];
    const cnt = Math.floor(rem / sl.power);
    if (cnt > 0) { parts.push(`${sl.name}×${cnt}`); rem -= cnt * sl.power; }
  }
  if (rem >= 0.5) parts.push(`民兵×${Math.round(rem)}`);
  return parts.length ? parts.join(' ') : '全滅';
}

/* ============================================================
   RULES PAGE
   ============================================================ */
function showRulesSection(key) {
  document.querySelectorAll('.rules-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.rules-section').forEach(el => el.classList.remove('active'));
  document.querySelector(`.rules-nav-item[data-key="${key}"]`)?.classList.add('active');
  byId('rules-' + key)?.classList.add('active');
}

/* ============================================================
   MODALS
   ============================================================ */

/* --- Add/Edit Alliance --- */
let _editAllianceId = null;

function openAddAllianceModal() {
  _editAllianceId = null;
  byId('modal-alliance-title').textContent = '✦ 連合を追加';
  byId('modal-a-grade').value   = '高2';
  byId('modal-a-class').value   = 'A';
  byId('modal-a-name').value    = '';
  byId('modal-a-leader').value  = '';
  byId('modal-a-members').value = '40';
  openModal('modal-alliance');
}

function openEditAllianceModal(id) {
  const a = state.alliances.find(x => x.id === id);
  if (!a) return;
  _editAllianceId = id;
  byId('modal-alliance-title').textContent = '✦ 連合を編集';
  byId('modal-a-grade').value   = a.grade;
  byId('modal-a-class').value   = a.cls;
  byId('modal-a-name').value    = a.name;
  byId('modal-a-leader').value  = a.leader;
  byId('modal-a-members').value = a.members;
  openModal('modal-alliance');
}

function submitAllianceModal() {
  const grade   = byId('modal-a-grade').value;
  const cls     = byId('modal-a-class').value;
  const name    = byId('modal-a-name').value.trim() || `${grade}${cls}クラス連合`;
  const leader  = byId('modal-a-leader').value.trim();
  const members = parseInt(byId('modal-a-members').value) || 40;

  if (_editAllianceId !== null) {
    const a = state.alliances.find(x => x.id === _editAllianceId);
    if (a) { a.grade = grade; a.cls = cls; a.name = name; a.leader = leader; a.members = members; }
    toast('連合情報を更新しました');
  } else {
    // prevent duplicate grade+class
    if (state.alliances.find(x => x.grade === grade && x.cls === cls)) {
      toast(`⚠️ ${grade}${cls}クラスは既に登録されています`);
      return;
    }
    const a = makeAlliance(grade, cls);
    a.name = name; a.leader = leader; a.members = members;
    state.alliances.push(a);
    state.selectedId = a.id;
    toast(`「${name}」を追加しました`);
  }

  closeModal('modal-alliance');
  renderAll();
}

/* --- Add Planet --- */
let _addPlanetAllianceId = null;

function openAddPlanetModal(allianceId) {
  _addPlanetAllianceId = allianceId;
  byId('modal-p-name').value  = '';
  byId('modal-p-type').value  = '炉';
  byId('modal-p-lv').value    = '1';
  openModal('modal-planet');
}

function submitPlanetModal() {
  const a = state.alliances.find(x => x.id === _addPlanetAllianceId);
  if (!a) return;
  const name = byId('modal-p-name').value.trim();
  if (!name) { toast('惑星名を入力してください'); return; }
  const type = byId('modal-p-type').value;
  const lv   = parseInt(byId('modal-p-lv').value);
  if (lv > a.civLv) toast(`⚠️ 惑星Lv(${lv})が文明Lv(${a.civLv})を超えています`);
  a.planets.push(makePlanet(name, type, lv));
  closeModal('modal-planet');
  renderAll();
  toast(`惑星「${name}」を追加しました`);
}

/* --- Diplomacy --- */
let _diploAllianceId = null;
let _diploType = null;

function openDiploModal(allianceId, type) {
  _diploAllianceId = allianceId;
  _diploType = type;
  const labels = { normal:'通常同盟', vassal:'属国同盟', secret:'秘密協定', war:'宣戦布告' };
  byId('modal-diplo-title').textContent = `✦ ${labels[type]}`;

  const a = state.alliances.find(x => x.id === allianceId);
  const opts = state.alliances
    .filter(x => x.id !== allianceId && !a.allies.find(al => al.targetId === x.id))
    .map(x => `<option value="${x.id}">${h(x.name)}</option>`)
    .join('');

  if (!opts) { toast('対象となる連合がありません'); return; }
  byId('modal-diplo-target').innerHTML = opts;
  openModal('modal-diplo');
}

function submitDiploModal() {
  const a = state.alliances.find(x => x.id === _diploAllianceId);
  const targetId = parseInt(byId('modal-diplo-target').value);
  const target   = state.alliances.find(x => x.id === targetId);
  if (!a || !target) return;

  if (_diploType === 'secret') {
    if (a.res.暗黒 < 2) { toast('⚠️ 暗黒物質が足りません（必要:2）'); return; }
    a.res.暗黒 -= 2;
  }

  a.allies.push({ targetId, type: _diploType, targetName: target.name });
  const labels = { normal:'通常同盟', vassal:'属国同盟', secret:'秘密協定（暗黒×2消費）', war:'宣戦布告' };
  closeModal('modal-diplo');
  renderAll();
  toast(`${a.name} ↔ ${target.name}: ${labels[_diploType]}`);
}

/* --- Generic modal helpers --- */
function openModal(id) {
  byId(id).classList.add('open');
}
function closeModal(id) {
  byId(id).classList.remove('open');
}

/* Close on backdrop click */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ── Init 30 alliances ──────────────────────────────────── */
function initAllAlliances() {
  GRADES.forEach(grade => {
    CLASSES.forEach(cls => {
      const a = makeAlliance(grade, cls);
      state.alliances.push(a);
    });
  });
}

/* ── Bootstrap ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initAllAlliances();
  showPage('alliances');
  renderAllianceList();
  renderSummaryPanel();
});
