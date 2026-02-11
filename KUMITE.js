function generateKumite() {
    if (currentUser.role !== 'admin') return;
    const cat = document.getElementById('p-cat').value;
    if (cat.includes('Kata')) { alert("Ez Kata kategória!"); return; }

    const players = data.players.filter(p => p.cat === cat);
    if (players.length < 2) { alert("Kevés versenyző!"); return; }

    data.matches = [];
    const size = Math.pow(2, Math.ceil(Math.log2(players.length)));
    let pool = [...players];
    while (pool.length < size) pool.push(null);

    for (let i = 0; i < size; i += 2) {
        const p1 = pool[i]; const p2 = pool[i + 1];
        const winner = (p1 && !p2) ? p1 : (!p1 && p2) ? p2 : null;
        data.matches.push({
            id: `m1-${i / 2}`, round: 1, cat: cat,
            aka: p1 || { name: "BYE", id: null }, shiro: p2 || { name: "BYE", id: null },
            winner: winner, scoreAka: 0, scoreShiro: 0,
            nextId: `m2-${Math.floor((i / 2) / 2)}`
        });
    }
    checkAdvancements(); save(); switchTab('bracket');
}

function checkAdvancements() {
    let changed = true;
    while (changed) {
        changed = false;
        data.matches.forEach(m => {
            if (m.winner && m.winner.id && m.nextId) {
                let nextM = data.matches.find(x => x.id === m.nextId);
                if (!nextM) {
                    const nextR = m.round + 1;
                    const nextIdx = parseInt(m.nextId.split('-')[1]);
                    const nextNextId = (nextR > 5) ? null : `m${nextR + 1}-${Math.floor(nextIdx / 2)}`;
                    nextM = {
                        id: m.nextId, round: nextR, cat: m.cat,
                        aka: { name: "...", id: null }, shiro: { name: "...", id: null },
                        winner: null, scoreAka: 0, scoreShiro: 0, nextId: nextNextId
                    };
                    data.matches.push(nextM); changed = true;
                }
                const prevIdx = parseInt(m.id.split('-')[1]);
                if (prevIdx % 2 === 0) {
                    if (!nextM.aka.id || nextM.aka.id !== m.winner.id) { nextM.aka = m.winner; changed = true; }
                } else {
                    if (!nextM.shiro.id || nextM.shiro.id !== m.winner.id) { nextM.shiro = m.winner; changed = true; }
                }
            }
        });
    }
}

function renderBracket() {
    const container = document.getElementById('bracket-view');
    container.innerHTML = "";
    if (data.matches.length === 0) return;
    const maxRound = Math.max(...data.matches.map(m => m.round));
    const canEdit = (currentUser.role === 'admin' || currentUser.role === 'judge');

    for (let r = 1; r <= maxRound; r++) {
        const matches = data.matches.filter(m => m.round === r)
            .sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
        if (matches.length === 0) continue;
        const col = document.createElement('div');
        col.className = "round-column";
        matches.forEach(m => {
            const p1 = m.aka.id ? m.aka : null;
            const p2 = m.shiro.id ? m.shiro : null;
            const connector = (m.nextId) ? `<div class="match-connector"></div>` : "";
            const active = !m.winner && p1 && p2;
            const clickAttr = (active && canEdit) ? `onclick="openRef('${m.id}')"` : "";
            col.innerHTML += `<div class="match-wrapper">${createCard(p1, 'aka', m, canEdit, clickAttr)}${createCard(p2, 'shiro', m, canEdit, clickAttr)}${connector}</div>`;
        });
        container.appendChild(col);
    }
}

function createCard(p, side, m, canEdit, attr) {
    if (!p || !p.id) return `<div class="player-card empty-slot"></div>`;
    const isWin = m.winner && m.winner.id === p.id;
    const style = `${isWin ? 'winner-card' : ''} ${(!m.winner && m.aka.id && m.shiro.id && canEdit) ? 'clickable' : ''}`;
    const clr = side === 'aka' ? '#0047AB' : '#D32F2F';
    return `<div class="player-card ${style}" ${attr}><div class="color-strip ${side}-strip"></div><div class="card-content"><div class="card-name" style="color:${clr}">[${p.id}] ${p.name}</div><div class="card-details">${p.dojo}</div></div>${(m.scoreAka > 0 || m.scoreShiro > 0) ? `<div style="position:absolute;right:10px;font-weight:bold">${side === 'aka' ? m.scoreAka : m.scoreShiro}</div>` : ''}</div>`;
}

let currMatch = null, timerInt = null, time = 120;
function openRef(id) {
    currMatch = data.matches.find(m => m.id === id);
    document.getElementById('ref-aka').innerText = currMatch.aka.name;
    document.getElementById('ref-shiro').innerText = currMatch.shiro.name;
    updateRefUI();
    clearInterval(timerInt); time = 120; updateTimerUI();
    document.getElementById('btn-timer').innerText = "START";
    document.getElementById('tab-referee').classList.remove('hidden');
}
function score(who, pt) {
    if (who === 'aka') currMatch.scoreAka += pt; else currMatch.scoreShiro += pt;
    updateRefUI();
    if (currMatch.scoreAka >= 2) { setTimeout(() => { alert("GYŐZTES: AKA"); endMatch(); }, 100); }
    else if (currMatch.scoreShiro >= 2) { setTimeout(() => { alert("GYŐZTES: SHIRO"); endMatch(); }, 100); }
}
function resetMatchScores() {
    if (!confirm("Reset?")) return;
    currMatch.scoreAka = 0; currMatch.scoreShiro = 0; updateRefUI();
    clearInterval(timerInt); time = 120; updateTimerUI();
}
function updateRefUI() { document.getElementById('score-aka').innerText = currMatch.scoreAka; document.getElementById('score-shiro').innerText = currMatch.scoreShiro; }
function toggleTimer() {
    if (timerInt) { clearInterval(timerInt); timerInt = null; document.getElementById('btn-timer').innerText = "START"; }
    else { document.getElementById('btn-timer').innerText = "STOP"; timerInt = setInterval(() => { time--; updateTimerUI(); if (time <= 0) clearInterval(timerInt); }, 1000); }
}
function updateTimerUI() { let m = Math.floor(time / 60), s = time % 60; document.getElementById('timer').innerText = `${m}:${s < 10 ? '0' + s : s}`; }
function endMatch() {
    if (currMatch.scoreAka === currMatch.scoreShiro) { alert("Döntetlen!"); return; }
    currMatch.winner = currMatch.scoreAka > currMatch.scoreShiro ? currMatch.aka : currMatch.shiro;
    checkAdvancements(); save(); switchTab('bracket'); document.getElementById('tab-referee').classList.add('hidden');
}