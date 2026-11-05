function initDedikaltKumitePage() {
    const sel = document.getElementById('kumiteHubSelect');
    const kumiteKatok = exKategoriak.filter(k => !k.matchType || k.matchType.toUpperCase() === 'KUMITE');
    if (sel && sel.options.length === 0) {
        sel.innerHTML = kumiteKatok.map(k => `<option value="${k.id}">${k.name}</option>`).join('');
    }
    rajzolDedikaltKumiteAgrajz();
}

function rajzolDedikaltKumiteAgrajz() {
    const katId = parseInt(document.getElementById('kumiteHubSelect')?.value);
    const cont = document.getElementById('kumiteHubContainer');
    if (!katId || !cont) return;

    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();
    let katMeccsek = exMeccsek.filter(m => m.categoryId === katId).sort((a, b) => a.id - b.id);
    if (katMeccsek.length === 0) {
        cont.innerHTML = '<p>Ehhez a Kumite kategóriához még nincs sorsolás.</p>';
        return;
    }

    let fordulok = [];
    let n = katMeccsek.length;
    let isAgrajz = TatamiMaster.isKumiteAgrajz(katMeccsek);
    if (isAgrajz) {
        let korMeret = (n + 1) / 2, idx = 0;
        while (korMeret >= 1) { fordulok.push(katMeccsek.slice(idx, idx + korMeret)); idx += korMeret; korMeret /= 2; }
    } else {
        fordulok.push(katMeccsek);
    }

    let html = `<div class="bracket-wrapper ${isAgrajz ? 'is-elimination' : ''}">`;
    fordulok.forEach((f, r) => {
        let cim = isAgrajz ? (r === fordulok.length - 1 ? `${TatamiMaster.icon('trophy', 15)} Döntő` : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló")) : "Körmérkőzések";
        html += `<div class="bracket-round"><h4>${cim}</h4><div class="bracket-round-matches">`;
        for (let m of f) {
            let isBye = (m.isFinished && !m.competitor2Id);
            let v1 = exVersenyzok.find(v => v.id === m.competitor1Id);
            let v2 = exVersenyzok.find(v => v.id === m.competitor2Id);
            let akaW = (m.isFinished && m.winnerId === m.competitor1Id) ? "winner" : "";
            let shiroW = (m.isFinished && m.winnerId === m.competitor2Id) ? "winner" : "";
            let reszlet = kumiteAdatok[m.id];
            let modRovid = (!isBye && reszlet && TatamiMaster.WIN_TYPES[reszlet.winType]) ? `[${TatamiMaster.WIN_TYPES[reszlet.winType].rovid}] ` : '';

            html += `<div class="bracket-slot"><div class="bracket-match ${m.isFinished ? 'finished' : ''}">
                <div style="background:#F3F0EA;border-bottom:1px solid #E4E0D7;padding:5px 12px;font-size:0.78rem;font-weight:700;color:#3F3F46;display:flex;justify-content:space-between;"><span>Mérkőzés #${m.matchOrder}</span><span>${m.isFinished && !isBye && reszlet && TatamiMaster.WIN_TYPES[reszlet.winType] ? TatamiMaster.WIN_TYPES[reszlet.winType].cimke : ''}</span></div>
                <div class="bracket-fighter aka ${akaW}"><span><span class="fighter-tag aka-tag">AKA</span> ${v1 ? v1.name + ' <small>(' + v1.club + ')</small>' : 'Várakozik...'}</span><span>${akaW ? '<strong>' + modRovid + '</strong>' + TatamiMaster.icon('check', 14) : ''}</span></div>
                <div class="bracket-fighter shiro ${shiroW}"><span>${isBye ? '<em style="color:#71717A;">Erőnyerő</em>' : '<span class="fighter-tag shiro-tag">SHIRO</span> ' + (v2 ? v2.name + ' <small>(' + v2.club + ')</small>' : 'Várakozik...')}</span><span>${shiroW ? '<strong>' + modRovid + '</strong>' + TatamiMaster.icon('check', 14) : ''}</span></div>
            </div></div>`;
        }
        html += '</div></div>';
    });
    html += '</div>';
    cont.innerHTML = html;
}
