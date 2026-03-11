/* ============================================================
   STELLARIUM — app.js  v3
   ============================================================ */
'use strict';

/* ── Constants ─────────────────────────────────────────── */
const GRADES  = ['中1','中2','中3','高1','高2','高3'];
const CLASSES = ['A','B','C','D','E'];

// 惑星番号ごとの固定タイプ
// 1=資源型, 2=炉晶特化, 3=演晶特化, 4=要塞/未開拓
// 未開拓型: 〇-3-4 と 〇-6-4 (全5銀河団 × 2 = 10個)
const UNEXPLORED_IDS = new Set(
  [1,2,3,4,5].flatMap(c => [`${c}-3-4`, `${c}-6-4`])
);

function getPlanetType(pid) {
  if (UNEXPLORED_IDS.has(pid)) return '未';
  const n = parseInt(pid.split('-')[2]);
  return { 1:'資', 2:'炉', 3:'演', 4:'要' }[n] || '資';
}

const TYPE_LABEL = { 炉:'炉晶特化', 演:'演晶特化', 資:'資源型', 要:'要塞型', 未:'未開拓型' };

const PLANET_BASE = {
  炉: { 炉晶:100, 演晶:0,  鋼材:0  },
  演: { 炉晶:0,   演晶:100, 鋼材:0  },
  資: { 炉晶:40,  演晶:40,  鋼材:20 },
  要: { 炉晶:0,   演晶:0,   鋼材:60 },
  未: null,
};

const CIV = [
  { lv:1, name:'原始文明',   range:'自分の1惑星のみ',          cum_炉:0,     cum_鋼:0,     cum_暗:0  },
  { lv:2, name:'航星文明',   range:'同一銀河内（4惑星）',      cum_炉:200,   cum_鋼:0,     cum_暗:0  },
  { lv:3, name:'銀河文明',   range:'同一銀河団の隣接銀河まで', cum_炉:700,   cum_鋼:0,     cum_暗:0  },
  { lv:4, name:'星間文明',   range:'同一銀河団の全銀河',       cum_炉:2000,  cum_鋼:700,   cum_暗:0  },
  { lv:5, name:'大星間文明', range:'隣接銀河団まで',           cum_炉:5500,  cum_鋼:2000,  cum_暗:0  },
  { lv:6, name:'銀河団文明', range:'全銀河団に展開可能',       cum_炉:15000, cum_鋼:5000,  cum_暗:10 },
  { lv:7, name:'超銀河文明', range:'最高威信',                 cum_炉:50000, cum_鋼:20000, cum_暗:60 },
];

const PLV = [
  { lv:1, name:'開拓地',     mult:1.0  },
  { lv:2, name:'集落',       mult:1.5  },
  { lv:3, name:'都市',       mult:2.5  },
  { lv:4, name:'惑星国家',   mult:4.0  },
  { lv:5, name:'星間都市',   mult:6.0  },
  { lv:6, name:'恒星文明圏', mult:8.0  },
  { lv:7, name:'超銀河都市', mult:10.0 },
];

const SLVS = [
  { lv:1, name:'民兵',       power:1  },
  { lv:2, name:'正規兵',     power:2  },
  { lv:3, name:'精鋭兵',     power:4  },
  { lv:4, name:'機械兵',     power:8  },
  { lv:5, name:'強化機械兵', power:16 },
  { lv:6, name:'量子兵',     power:32 },
  { lv:7, name:'超空間兵',   power:64 },
];

/* ── State ─────────────────────────────────────────────── */
let state = {
  day: 1,
  selectedId: null,
  planets: {},          // key="c-g-n", val={owner:id|null, lv:1-7}
  alliances: [],
  nextId: 1,
  insertOrder: 0,
};

function initPlanets() {
  for (let c=1;c<=5;c++) for (let g=1;g<=6;g++) for (let n=1;n<=4;n++)
    state.planets[`${c}-${g}-${n}`] = { owner:null, lv:1 };
}

/* ── Planet helpers ─────────────────────────────────────── */
function planetOutput(pid) {
  const p = state.planets[pid];
  if (!p) return {炉晶:0,演晶:0,鋼材:0,暗黒:0};
  const t = getPlanetType(pid);
  if (t==='未' && p.lv<6) return {炉晶:0,演晶:0,鋼材:0,暗黒:0};
  const base = PLANET_BASE[t] ?? {炉晶:0,演晶:0,鋼材:0};
  const m = PLV[p.lv-1].mult * (t==='未'&&p.lv>=6 ? 1.5 : 1);
  return { 炉晶:Math.round((base.炉晶||0)*m), 演晶:Math.round((base.演晶||0)*m),
           鋼材:Math.round((base.鋼材||0)*m), 暗黒:0 };
}

function ownedPids(aid) {
  return Object.entries(state.planets).filter(([,v])=>v.owner===aid).map(([k])=>k);
}

/* ── Alliance factory ──────────────────────────────────── */
function newAlliance(name) {
  return {
    id:      state.nextId++,
    name:    name || `連合${state.nextId}`,
    leader:  '',
    members: 40,
    civLv:   1,
    res:     {炉晶:0,演晶:0,鋼材:0,暗黒:0},
    soldiers:{1:0,2:0,3:0,4:0,5:0,6:0,7:0},
    allies:  [],
    notes:   '',
    order:   state.insertOrder++,
  };
}

/* ── Calc ───────────────────────────────────────────────── */
function dailyTotal(aid) {
  const t={炉晶:0,演晶:0,鋼材:0,暗黒:0};
  ownedPids(aid).forEach(pid=>{ const o=planetOutput(pid); Object.keys(t).forEach(k=>t[k]+=o[k]||0); });
  return t;
}

function score(a) {
  const pids=ownedPids(a.id);
  if(!pids.length) return 0;
  return pids.reduce((s,pid)=>s+(state.planets[pid]?.lv||1),0) * pids.length;
}

function totalRes(a) { return Object.values(a.res).reduce((s,v)=>s+v,0); }

function soldierPower(a) { return SLVS.reduce((s,sl)=>s+sl.power*(a.soldiers[sl.lv]||0),0); }

function ranked() {
  return [...state.alliances].sort((a,b)=>{ const d=score(b)-score(a); return d||totalRes(b)-totalRes(a); });
}
function rankOf(id) { return ranked().findIndex(x=>x.id===id)+1; }
function ordered()  { return [...state.alliances].sort((a,b)=>a.order-b.order); }

/* ── Helpers ───────────────────────────────────────────── */
const h   = s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const $   = id=>document.getElementById(id);
const qs  = sel=>document.querySelector(sel);

function toast(msg,dur=2600) {
  const el=$('toast'); el.textContent=msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),dur);
}

/* ── Starfield ─────────────────────────────────────────── */
function initStarfield() {
  const cv=$('starfield-canvas'), ctx=cv.getContext('2d');
  let stars=[];
  const init=()=>{
    cv.width=innerWidth; cv.height=innerHeight;
    stars=Array.from({length:200},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,
      r:Math.random()*1.4+.2,o:Math.random()*.8+.1,d:(Math.random()-.5)*.015}));
  };
  const draw=()=>{
    ctx.clearRect(0,0,cv.width,cv.height);
    stars.forEach(s=>{
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,225,255,${s.o})`; ctx.fill();
      s.o+=s.d;
      if(s.o<.05){s.o=.05;s.d*=-1;} if(s.o>.92){s.o=.92;s.d*=-1;}
    });
    requestAnimationFrame(draw);
  };
  addEventListener('resize',init); init(); draw();
}

/* ── Navigation ────────────────────────────────────────── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  $('page-'+page).classList.add('active');
  const map={alliances:0,ranking:1,planets:2,battle:3,rules:4};
  document.querySelectorAll('.nav-btn')[map[page]]?.classList.add('active');
  if(page==='ranking') renderRanking();
  if(page==='planets') renderPlanetsPage();
  if(page==='battle')  initBattle();
}

function changeDay(d) {
  state.day=Math.max(1,Math.min(7,state.day+d));
  $('day-badge').textContent='DAY '+state.day;
  const b=$('galactic-war-badge');
  if(state.day===7){ b.classList.add('visible'); toast('🌌 最終日！銀河大戦争が自動発動します',4000); }
  else b.classList.remove('visible');
}

/* ============================================================
   ALLIANCE LIST
   ============================================================ */
function renderAllianceList() {
  const wrap=$('alliance-list-scroll');
  const list=ordered();
  wrap.innerHTML = list.map(a=>{
    const pids=ownedPids(a.id);
    const sel=a.id===state.selectedId?' selected':'';
    return `<div class="ai${sel}" onclick="selectA(${a.id})">
      <span class="ai-name">${h(a.name)}</span>
      <span class="ai-meta">Lv${a.civLv} · 👥${a.members} · ${pids.length}惑星</span>
      <span class="ai-score">${score(a).toLocaleString()}</span>
    </div>`;
  }).join('');
}

function selectA(id) {
  state.selectedId=id;
  renderAllianceList();
  renderDetail();
  showPage('alliances');
}

/* ============================================================
   ALLIANCE DETAIL
   ============================================================ */
function renderDetail() {
  const panel=$('alliance-detail-panel');
  const a=state.alliances.find(x=>x.id===state.selectedId);
  if(!a){
    panel.innerHTML=`<div class="empty-state"><div class="empty-icon">🌌</div><div>左のリストから連合を選択</div></div>`;
    return;
  }
  const pids=ownedPids(a.id);
  const daily=dailyTotal(a.id);
  const tp=soldierPower(a);
  const sc=score(a);
  const rk=rankOf(a.id);
  const dArr=[daily.炉晶,daily.演晶,daily.鋼材,daily.暗黒];
  const resKeys=['炉晶','演晶','鋼材','暗黒'];
  const resIc={炉晶:'🔥',演晶:'💠',鋼材:'⚙️',暗黒:'🌑'};
  const resCl={炉晶:'r炉',演晶:'r演',鋼材:'r鋼',暗黒:'r暗'};

  panel.innerHTML=`
  <div class="det-wrap">

    <!-- ① HEADER STRIP (全幅・コンパクト) -->
    <div class="det-header-strip">

      <!-- 連合名・基本情報 -->
      <div class="det-name-block">
        <div class="det-name">${h(a.name)}</div>
        <div class="det-sub">
          リーダー: <b>${h(a.leader)||'未設定'}</b>
          &ensp;👥<b>${a.members}</b>人
          &ensp;文明Lv<b>${a.civLv}</b> ${h(CIV[a.civLv-1].name)}
          <button onclick="openEditA(${a.id})" class="btn-sm" style="margin-left:6px">✎</button>
        </div>
      </div>

      <!-- KPI（2×2グリッド）+ 資源（2×2グリッド）+ 付与ボタン -->
      <div class="det-right-header">

        <div class="det-kpi-grid">
          <div class="kpi"><span class="kpi-v" style="color:var(--gold)">${sc.toLocaleString()}</span><span class="kpi-l">SCORE</span></div>
          <div class="kpi"><span class="kpi-v">#${rk}</span><span class="kpi-l">順位</span></div>
          <div class="kpi"><span class="kpi-v" style="color:var(--green)">${pids.length}</span><span class="kpi-l">惑星数</span></div>
          <div class="kpi"><span class="kpi-v">${tp.toLocaleString()}</span><span class="kpi-l">総戦闘力</span></div>
        </div>

        <div class="det-res-grid">
          ${resKeys.map((k,i)=>`
            <div class="res-row-item">
              <span class="res-row-lbl">${resIc[k]}<span class="res-row-name">${k}</span></span>
              <input class="num-inp ${resCl[k]}" type="number" min="0" value="${a.res[k]}"
                onclick="this.select()" oninput="setResInp(${a.id},'${k}',this)"
                onkeydown="numKey(event)" style="width:70px;font-size:13px" />
              <span class="res-row-daily">+${dArr[i]}/日</span>
            </div>`).join('')}
        </div>

        <div class="det-grant-col">
          <button class="btn-grant" onclick="grantRes(${a.id})">📅<br>資源<br>付与</button>
          <button class="btn-grant accent2" onclick="grantSoldiers(${a.id})">⚔️<br>兵士<br>付与</button>
        </div>

      </div><!-- /det-right-header -->
    </div><!-- /det-header-strip -->

    <!-- ② BODY -->
    <div class="det-body">

      <div class="det-body-left">

        <!-- 文明Lv + 兵士 を横2列 -->
        <div class="det-two-col">

          <div class="det-two-pane">
            <div class="det-section-title">文明レベル</div>
            <div class="civ-compact-list">
              ${CIV.map(c=>{
                const cur=a.civLv===c.lv;
                const cost=c.lv===1?'初期':`炉・演×${c.cum_炉.toLocaleString()}${c.cum_鋼?` 鋼×${c.cum_鋼.toLocaleString()}`:''}${c.cum_暗?` 暗×${c.cum_暗}`:''}`;
                return `<div class="civ-compact${cur?' cur':''}">
                  <span class="ccl-lv">Lv${c.lv}</span>
                  <span class="ccl-name">${h(c.name)}</span>
                  <button class="ccl-btn${cur?' cur':''}" ${cur?'disabled':''} onclick="setCiv(${a.id},${c.lv})" title="${cost}">${cur?'◆':'設定'}</button>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="det-two-pane">
            <div class="det-section-title">兵士</div>
            <div class="soldiers-compact">
              ${SLVS.map(sl=>`
                <div class="sc-row">
                  <span class="sc-lv">Lv${sl.lv}</span>
                  <span class="sc-name">${h(sl.name)}</span>
                  <span class="sc-pw">×${sl.power}</span>
                  <input class="num-inp" type="number" min="0" value="${a.soldiers[sl.lv]||0}"
                    onclick="this.select()" oninput="setSoldierInp(${a.id},${sl.lv},this)"
                    onkeydown="numKey(event)" style="width:52px;font-size:12px" />
                </div>`).join('')}
            </div>
          </div>

        </div><!-- /det-two-col -->

        <!-- 外交 + メモ を横2列 -->
        <div class="det-two-col" style="margin-top:8px;flex:1;min-height:0">

          <div class="det-two-pane">
            <div class="det-section-title">外交</div>
            <div class="diplo-tags" style="margin-bottom:5px">
              ${!a.allies.length?'<span class="dim">なし</span>'
                :a.allies.map(al=>{
                  const lb={normal:'通常',vassal:'属国',secret:'🤫秘密',war:'⚔️宣戦'}[al.type];
                  return `<span class="diplo-tag dt-${al.type}" onclick="removeDiplo(${a.id},${al.targetId})" title="クリックで削除">
                    ${lb} ${h(al.targetName)} ✕</span>`;
                }).join('')}
            </div>
            <div class="diplo-add-row">
              ${['normal','vassal','secret','war'].map(t=>{
                const lb={normal:'通常',vassal:'属国',secret:'秘密協定',war:'宣戦'}[t];
                return `<button class="btn-sm" onclick="openDiplo(${a.id},'${t}')">＋${lb}</button>`;
              }).join('')}
            </div>
          </div>

          <div class="det-two-pane" style="display:flex;flex-direction:column">
            <div class="det-section-title">メモ</div>
            <textarea class="notes-area" style="flex:1;min-height:60px" placeholder="メモ..." oninput="setNote(${a.id},this.value)">${h(a.notes)}</textarea>
          </div>

        </div><!-- /det-two-col -->

        <!-- 削除ボタン（一番下） -->
        <button class="btn-danger" onclick="deleteA(${a.id})" style="margin-top:8px;width:100%">連合を削除</button>

      </div><!-- /det-body-left -->

      <!-- 惑星グリッド -->
      <div class="det-body-right">
        <div class="det-section-title">
          惑星 (${pids.length}/120)
          <span class="dim" style="font-size:9px;font-weight:400;margin-left:6px">クリックで取得／解放 ／ 自分の惑星はLv変更可</span>
        </div>
        ${renderPlanetGrid(a)}
      </div>

    </div><!-- /det-body -->
  </div>`;
}

/* ── Planet quick grid ──────────────────────────────────── */
function renderPlanetGrid(a) {
  const allPids=[];
  for(let c=1;c<=5;c++) for(let g=1;g<=6;g++) for(let n=1;n<=4;n++) allPids.push(`${c}-${g}-${n}`);

  const cells=allPids.map(pid=>{
    const p=state.planets[pid];
    const type=getPlanetType(pid);
    const lv=p?.lv||1;
    const ownerId=p?.owner||null;
    const owner=ownerId?state.alliances.find(x=>x.id===ownerId):null;
    const isMine=ownerId===a.id;
    const isTaken=ownerId!==null&&!isMine;
    const tc={炉:'var(--res-炉)',演:'var(--res-演)',資:'var(--res-鋼)',要:'var(--accent3)',未:'var(--res-暗)'}[type];

    let cls='pgcell'+(isMine?' mine':isTaken?' taken':' free');
    const clickAttr=isTaken?'':isMine
      ?`onclick="releasePlanet('${pid}',${a.id})"`
      :`onclick="claimPlanet('${pid}',${a.id})"`;
    const tip=isMine?`${pid} Lv${lv} ─ 自分（クリックで解放）`
      :isTaken?`${pid} Lv${lv} ─ ${owner?.name||'?'} 所有`
      :`${pid} ─ クリックで取得`;

    // 自分の惑星にLv変更セレクト
    const lvSel=isMine
      ?`<select class="pg-lv-sel" onclick="event.stopPropagation()" onchange="setPlanetLvGrid('${pid}',this.value,${a.id})">
          ${PLV.map(l=>`<option value="${l.lv}"${lv===l.lv?' selected':''}>${l.lv}</option>`).join('')}
        </select>`
      :`<span class="pg-lv">${isTaken?`Lv${lv}`:''}</span>`;

    const ownLabel=isMine?'◆':isTaken?(owner?.name?owner.name.slice(0,5):'?'):'';

    return `<div class="${cls}" ${clickAttr} title="${h(tip)}" style="--tc:${tc}">
      <div class="pg-top-row">
        <span class="pg-id">${pid}</span>
        ${lvSel}
      </div>
      <div class="pg-own">${ownLabel}</div>
    </div>`;
  });

  return `<div class="planet-qgrid">${cells.join('')}</div>
    <div class="pg-legend">
      <span style="color:var(--green)">◆自分</span>
      <span style="color:var(--text-dim)">■他所有</span>
      <span>□空き</span>
      &ensp;
      <span style="color:var(--res-炉)">■炉</span>
      <span style="color:var(--res-演)">■演</span>
      <span style="color:var(--res-鋼)">■資</span>
      <span style="color:var(--accent3)">■要</span>
      <span style="color:var(--res-暗)">■未</span>
    </div>`;
}

function claimPlanet(pid, aid) {
  const p=state.planets[pid];
  if(!p||p.owner!==null) return;
  p.owner=aid;
  renderDetail(); renderAllianceList();
  toast(`惑星 ${pid} を取得しました`);
}

function releasePlanet(pid, aid) {
  const p=state.planets[pid];
  if(!p||p.owner!==aid) return;
  p.owner=null;
  renderDetail(); renderAllianceList();
  toast(`惑星 ${pid} を解放しました`);
}

function setPlanetLvGrid(pid, lv, aid) {
  const p=state.planets[pid]; if(!p) return;
  p.lv=parseInt(lv);
  const a=state.alliances.find(x=>x.id===aid);
  if(a && p.lv>a.civLv) toast(`⚠️ 惑星Lv(${p.lv})が文明Lv(${a.civLv})を超えています`);
  renderDetail(); renderAllianceList();
}

/* ============================================================
   MUTATIONS
   ============================================================ */
function setResInp(id,key,inp) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  a.res[key]=Math.max(0,parseInt(inp.value)||0);
  renderAllianceList();
}

function adjRes(id,key,d) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  a.res[key]=Math.max(0,(a.res[key]||0)+d);
  renderDetail(); renderAllianceList();
}

function setSoldierInp(id,lv,inp) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  a.soldiers[lv]=Math.max(0,parseInt(inp.value)||0);
}

function adjSoldier(id,lv,d) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  a.soldiers[lv]=Math.max(0,(a.soldiers[lv]||0)+d);
  renderDetail();
}

function setCiv(id,lv) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  a.civLv=lv; renderDetail(); renderAllianceList();
  toast(`文明Lv${lv} ${CIV[lv-1].name}`);
}

function grantRes(id) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  const d=dailyTotal(a.id);
  Object.keys(d).forEach(k=>a.res[k]=(a.res[k]||0)+d[k]);
  renderDetail(); renderAllianceList();
  toast(`Day${state.day} 資源付与 ✓`);
}

function grantSoldiers(id) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  let n=0;
  ownedPids(a.id).forEach(pid=>{
    const t=getPlanetType(pid), p=state.planets[pid];
    if(t==='未'&&p.lv<6) return;
    a.soldiers[p.lv]=(a.soldiers[p.lv]||0)+1; n++;
  });
  renderDetail(); toast(`兵士付与 +${n}体 ✓`);
}

function setNote(id,val) {
  const a=state.alliances.find(x=>x.id===id); if(a) a.notes=val;
}

function deleteA(id) {
  if(!confirm('この連合を削除しますか？惑星は全て解放されます。')) return;
  Object.values(state.planets).forEach(p=>{ if(p.owner===id) p.owner=null; });
  state.alliances=state.alliances.filter(x=>x.id!==id);
  state.selectedId=null;
  renderDetail(); renderAllianceList();
  toast('連合を削除しました');
}

function removeDiplo(aid,tid) {
  const a=state.alliances.find(x=>x.id===aid); if(!a) return;
  a.allies=a.allies.filter(x=>x.targetId!==tid);
  renderDetail();
}

/* numKey: Tab/Enter skip to next input */
function numKey(e) {
  if(e.key==='Enter'||e.key==='Tab') {
    e.preventDefault();
    const inputs=[...document.querySelectorAll('.num-inp')];
    const i=inputs.indexOf(e.target);
    if(i>=0 && inputs[i+1]) { inputs[i+1].focus(); inputs[i+1].select(); }
  }
}

/* ============================================================
   RANKING
   ============================================================ */
function renderRanking() {
  const list=ranked(), total=list.length;
  $('rank-tbody').innerHTML=list.map((a,i)=>{
    const pids=ownedPids(a.id);
    return `<tr onclick="selectA(${a.id})" style="cursor:pointer">
      <td style="text-align:center;font-family:var(--font-head);font-weight:900">${i+1}</td>
      <td>${h(a.name)}</td>
      <td><span class="civ-lv-tag">Lv${a.civLv}</span></td>
      <td style="font-family:var(--font-mono)">${pids.length}</td>
      <td style="font-family:var(--font-mono);color:var(--gold)">${score(a).toLocaleString()}</td>
      <td style="font-family:var(--font-mono);color:var(--res-炉)">${a.res.炉晶.toLocaleString()}</td>
      <td style="font-family:var(--font-mono);color:var(--res-演)">${a.res.演晶.toLocaleString()}</td>
      <td style="font-family:var(--font-mono);color:var(--res-鋼)">${a.res.鋼材.toLocaleString()}</td>
      <td style="font-family:var(--font-mono);color:var(--res-暗)">${a.res.暗黒.toLocaleString()}</td>
    </tr>`;
  }).join('');
}

/* ============================================================
   PLANETS PAGE
   ============================================================ */
function renderPlanetsPage() {
  buildOwnerFilter();
  const container=$('planets-map-inner');
  const fo=$('pf-owner')?.value||'all';
  const ft=$('pf-type')?.value||'all';
  const fl=$('pf-lv')?.value||'all';

  let total=0,owned=0;
  let html='';

  for(let c=1;c<=5;c++){
    let cHtml='';
    for(let g=1;g<=6;g++){
      let rHtml='';
      for(let n=1;n<=4;n++){
        const pid=`${c}-${g}-${n}`;
        const p=state.planets[pid];
        const type=getPlanetType(pid);
        const lv=p?.lv||1;
        const owner=p?.owner?state.alliances.find(x=>x.id===p.owner):null;
        total++; if(owner) owned++;

        if(fo==='unowned'&&owner) continue;
        if(fo!=='all'&&fo!=='unowned'&&(!owner||owner.id!==parseInt(fo))) continue;
        if(ft!=='all'&&type!==ft) continue;
        if(fl!=='all'&&lv!==parseInt(fl)) continue;

        const cls=owner?'planet-cell-owned':'planet-cell-empty';
        rHtml+=`<div class="planet-cell ${cls}" onclick="openPlanetModal('${pid}')">
          <div class="planet-cell-id">${pid}</div>
          <div class="planet-cell-type"><span class="type-badge tb${type}">${type}</span></div>
          <div class="planet-cell-lv">Lv${lv}</div>
          <div class="planet-cell-owner">${h(owner?.name||'—')}</div>
        </div>`;
      }
      if(!rHtml) continue;
      cHtml+=`<div class="galaxy-row">
        <div class="galaxy-label"><span class="galaxy-num">銀河${g}</span><span class="galaxy-grade">${GRADES[g-1]}</span></div>
        <div class="planet-row-cells">${rHtml}</div>
      </div>`;
    }
    if(!cHtml) continue;
    html+=`<div class="planet-cluster-block">
      <div class="cluster-title">🌌 銀河団 ${c} <span class="cluster-sub">クラス${CLASSES[c-1]}</span></div>
      ${cHtml}
    </div>`;
  }

  $('planet-stats').innerHTML=`総数: <b>${total}</b> 所有: <b style="color:var(--green)">${owned}</b> 空き: <b>${total-owned}</b>`;
  container.innerHTML=html||'<div class="dim" style="padding:24px">条件に一致する惑星がありません</div>';
}

function buildOwnerFilter() {
  const sel=$('pf-owner'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML=`<option value="all">全連合</option><option value="unowned">無所属のみ</option>`
    +state.alliances.map(a=>`<option value="${a.id}">${h(a.name)}</option>`).join('');
  sel.value=cur||'all';
}

function openPlanetModal(pid) {
  const p=state.planets[pid];
  const type=getPlanetType(pid);
  const lv=p?.lv||1;
  const owner=p?.owner?state.alliances.find(x=>x.id===p.owner):null;
  const out=planetOutput(pid);
  const outStr=Object.entries(out).filter(([,v])=>v>0).map(([k,v])=>`${k}: ${v}`).join(' / ');

  $('mpd-title').textContent=`惑星 ${pid}`;
  $('mpd-type').textContent=TYPE_LABEL[type]||type;
  $('mpd-lv').textContent=`Lv${lv} ${PLV[lv-1].name}`;
  $('mpd-owner').textContent=owner?owner.name:'無所属';
  $('mpd-output').textContent=outStr||'産出なし';

  const osel=$('mpd-owner-sel');
  osel.innerHTML=`<option value="">無所属</option>`
    +state.alliances.map(a=>`<option value="${a.id}"${a.id===p?.owner?' selected':''}>${h(a.name)}</option>`).join('');

  const lsel=$('mpd-lv-sel');
  lsel.innerHTML=PLV.map(l=>`<option value="${l.lv}"${lv===l.lv?' selected':''}>${l.lv} ${l.name}（×${l.mult}）</option>`).join('');

  $('mpd-pid').value=pid;
  openModal('modal-planet-detail');
}

function submitPlanetModal() {
  const pid=$('mpd-pid').value, p=state.planets[pid]; if(!p) return;
  p.owner=$('mpd-owner-sel').value?parseInt($('mpd-owner-sel').value):null;
  p.lv=parseInt($('mpd-lv-sel').value);
  closeModal('modal-planet-detail');
  renderDetail(); renderAllianceList(); renderPlanetsPage();
  toast(`惑星 ${pid} を更新しました`);
}

/* ============================================================
   BATTLE CALC
   ============================================================ */
function initBattle() {
  ['atk','def'].forEach(side=>{
    const c=$(`bt-${side}-soldiers`);
    if(c.innerHTML.trim()) return;
    c.innerHTML=SLVS.map(sl=>`
      <div class="bt-row">
        <div class="bt-lv">${sl.lv}</div>
        <div class="bt-name">${h(sl.name)}</div>
        <div class="bt-pw">×${sl.power}</div>
        <div class="bt-inp-wrap">
          <button class="num-adj" onclick="adjBt('${side}',${sl.lv},-1)">−</button>
          <input class="num-inp bt-inp" id="bt-${side}-s${sl.lv}" type="number" min="0" value="0"
            onclick="this.select()" oninput="calcBattle()" onkeydown="numKey(event)" />
          <button class="num-adj" onclick="adjBt('${side}',${sl.lv},1)">＋</button>
        </div>
      </div>`).join('');
  });
  calcBattle();
}

function adjBt(side,lv,d) {
  const inp=$(`bt-${side}-s${lv}`); if(!inp) return;
  inp.value=Math.max(0,(parseInt(inp.value)||0)+d);
  calcBattle();
}

function calcBattle() {
  const bonus=parseFloat($('def-bonus-select')?.value??1.5);
  let atk=0,def=0;
  SLVS.forEach(sl=>{
    atk+=(parseInt($(`bt-atk-s${sl.lv}`)?.value)||0)*sl.power;
    def+=(parseInt($(`bt-def-s${sl.lv}`)?.value)||0)*sl.power;
  });
  const defAdj=def*bonus;
  $('bt-atk-total').textContent=atk.toLocaleString();
  $('bt-def-total').textContent=def.toLocaleString();
  $('br-atk').textContent=atk.toLocaleString();
  $('br-def').textContent=defAdj.toFixed(1);
  $('br-def-lbl').textContent=`防衛総力（×${bonus}補正済）`;

  const we=$('br-winner'), se=$('br-survivors');
  if(!atk&&!def){ we.className='br-winner neutral'; we.textContent='数値を入力してください'; se.textContent=''; return; }
  const atkWin=atk>defAdj;
  const rem=atkWin?atk-defAdj:defAdj-atk;
  we.className='br-winner '+(atkWin?'atk-win':'def-win');
  we.textContent=atkWin?'⚔️ 攻撃側勝利':'🛡️ 防衛側勝利';
  se.textContent='残存: '+survivorStr(rem);
}

function survivorStr(power) {
  let rem=power; const p=[];
  for(let i=SLVS.length-1;i>=0;i--){
    const sl=SLVS[i], n=Math.floor(rem/sl.power);
    if(n>0){ p.push(`${sl.name}×${n}`); rem-=n*sl.power; }
  }
  if(rem>=.5) p.push(`民兵×${Math.round(rem)}`);
  return p.length?p.join(' '):'全滅';
}

/* ============================================================
   RULES
   ============================================================ */
function showRules(key) {
  document.querySelectorAll('.rules-nav-item').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.rules-section').forEach(el=>el.classList.remove('active'));
  qs(`.rules-nav-item[data-key="${key}"]`)?.classList.add('active');
  $('rules-'+key)?.classList.add('active');
}

/* ============================================================
   MODALS
   ============================================================ */
let _editId=null;

function openAddA() {
  _editId=null;
  $('modal-a-title').textContent='✦ 連合を追加';
  $('modal-a-name').value='';
  $('modal-a-leader').value='';
  $('modal-a-members').value='40';
  openModal('modal-alliance');
  setTimeout(()=>$('modal-a-name').focus(),80);
}

function openEditA(id) {
  const a=state.alliances.find(x=>x.id===id); if(!a) return;
  _editId=id;
  $('modal-a-title').textContent='✦ 連合を編集';
  $('modal-a-name').value=a.name;
  $('modal-a-leader').value=a.leader;
  $('modal-a-members').value=a.members;
  openModal('modal-alliance');
  setTimeout(()=>$('modal-a-name').select(),80);
}

function submitA() {
  const name=$('modal-a-name').value.trim();
  const leader=$('modal-a-leader').value.trim();
  const members=Math.min(80,Math.max(10,parseInt($('modal-a-members').value)||40));
  if(!name){ toast('連合名を入力してください'); return; }
  if(_editId!==null){
    const a=state.alliances.find(x=>x.id===_editId);
    if(a){ a.name=name; a.leader=leader; a.members=members; }
    toast('連合情報を更新しました');
  } else {
    const a=newAlliance(name); a.leader=leader; a.members=members;
    state.alliances.push(a); state.selectedId=a.id;
    toast(`「${name}」を追加しました`);
  }
  closeModal('modal-alliance'); renderDetail(); renderAllianceList();
}

let _diploAid=null, _diploType=null;

function openDiplo(aid,type) {
  _diploAid=aid; _diploType=type;
  const lbl={normal:'通常同盟',vassal:'属国同盟',secret:'秘密協定（暗黒×2）',war:'宣戦布告'};
  $('modal-diplo-title').textContent=`✦ ${lbl[type]}`;
  const a=state.alliances.find(x=>x.id===aid);
  const opts=state.alliances
    .filter(x=>x.id!==aid&&!a.allies.find(al=>al.targetId===x.id))
    .map(x=>`<option value="${x.id}">${h(x.name)}</option>`).join('');
  if(!opts){ toast('対象となる連合がありません'); return; }
  $('modal-diplo-target').innerHTML=opts;
  openModal('modal-diplo');
}

function submitDiplo() {
  const a=state.alliances.find(x=>x.id===_diploAid);
  const tid=parseInt($('modal-diplo-target').value);
  const t=state.alliances.find(x=>x.id===tid);
  if(!a||!t) return;
  if(_diploType==='secret'){ if(a.res.暗黒<2){ toast('⚠️ 暗黒物質が足りません（必要:2）'); return; } a.res.暗黒-=2; }
  a.allies.push({targetId:tid,type:_diploType,targetName:t.name});
  closeModal('modal-diplo'); renderDetail();
  const lbl={normal:'通常同盟',vassal:'属国同盟',secret:'秘密協定',war:'宣戦布告'};
  toast(`${a.name} ↔ ${t.name}: ${lbl[_diploType]}`);
}

function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
document.addEventListener('click',e=>{ if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });

/* ── Modal keyboard ────────────────────────────────────── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  if(e.key==='Enter'&&e.target.tagName==='INPUT') {
    const modal=e.target.closest('.modal-box');
    if(modal) {
      const okBtn=modal.querySelector('.mb-ok');
      if(okBtn) okBtn.click();
    }
  }
});

/* ── Init 30 alliances ──────────────────────────────────── */
function initAllAlliances() {
  // A=銀河団1,B=2,C=3,D=4,E=5 / 中1=銀河1,...,高3=銀河6
  GRADES.forEach((grade,gi)=>{
    CLASSES.forEach((cls,ci)=>{
      const a=newAlliance(`${grade}${cls}クラス連合`);
      state.alliances.push(a);
      const pid=`${ci+1}-${gi+1}-1`;
      if(state.planets[pid]){ state.planets[pid].owner=a.id; state.planets[pid].lv=1; }
    });
  });
}

/* ── Bootstrap ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  initStarfield();
  initPlanets();
  initAllAlliances();
  showPage('alliances');
  renderAllianceList();
});
