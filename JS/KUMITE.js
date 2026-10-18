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
    let isAgrajz = (n === 3 || n === 7 || n === 15 || n === 31);
    if (isAgrajz) {
        let korMeret = (n + 1) / 2, idx = 0;
        while (korMeret >= 1) { fordulok.push(katMeccsek.slice(idx, idx + korMeret)); idx += korMeret; korMeret /= 2; }
    } else {
        fordulok.push(katMeccsek);
    }

    let html = '<div class="bracket-wrapper">';
    fordulok.forEach((f, r) => {
        let cim = isAgrajz ? (r === fordulok.length - 1 ? "🏆 Döntő" : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló")) : "Körmérkőzések";
        html += `<div class="bracket-round"><h4>${cim}</h4>`;
        for (let m of f) {
            let isBye = (m.isFinished && !m.competitor2Id);
            let v1 = exVersenyzok.find(v => v.id === m.competitor1Id);
            let v2 = exVersenyzok.find(v => v.id === m.competitor2Id);
            let akaW = (m.isFinished && m.winnerId === m.competitor1Id) ? "winner" : "";
            let shiroW = (m.isFinished && m.winnerId === m.competitor2Id) ? "winner" : "";
            let reszlet = kumiteAdatok[m.id];
            let modRovid = (!isBye && reszlet && TatamiMaster.WIN_TYPES[reszlet.winType]) ? `[${TatamiMaster.WIN_TYPES[reszlet.winType].rovid}] ` : '';

            html += `<div class="bracket-match ${m.isFinished ? 'finished' : ''}">
                <div class="bracket-fighter aka ${akaW}"><span>🔴 ${v1 ? v1.name + ' <small>(' + v1.club + ')</small>' : 'Várakozik...'}</span><span>${akaW ? '<strong>' + modRovid + '</strong>✔' : ''}</span></div>
                <div class="bracket-fighter shiro ${shiroW}"><span>${isBye ? '&nbsp;' : '⚪ ' + (v2 ? v2.name + ' <small>(' + v2.club + ')</small>' : 'Várakozik...')}</span><span>${shiroW ? '<strong>' + modRovid + '</strong>✔' : ''}</span></div>
            </div>`;
        }
        html += '</div>';
    });
    html += '</div>';
    cont.innerHTML = html;
}