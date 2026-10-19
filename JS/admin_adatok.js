let globalVersenyzok = [];
let globalKategoriak = [];
let globalNevezesek = [];
let globalTatamik = [];
let globalMerkozesek = [];
let draggedMatchId = null;

window.onload = function() {
    mindenAdatFrissitese();
};

async function mindenAdatFrissitese() {
    try {
        const [v, k, n, t, m] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches')
        ]);

        globalVersenyzok = Array.isArray(v) ? v : [];
        globalKategoriak = Array.isArray(k) ? k : [];
        globalNevezesek  = Array.isArray(n) ? n : [];
        globalTatamik    = Array.isArray(t) ? t : [];
        globalMerkozesek = Array.isArray(m) ? m.sort((a, b) => a.matchOrder - b.matchOrder) : [];

        frissitAdminKpiEsCheckboxok();
        versenyzokBetoltese();
        kategoriakBetoltese();
        nevezesekBetoltese();
        tatamikBetoltese();
        merkozesekBetoltese();
        rajzolAgrajz();
    } catch (e) {
        console.error("Hiba az admin adatok betöltésekor:", e);
    }
}

function frissitAdminKpiEsCheckboxok() {
    const elV = document.getElementById('kpiVersenyzok');
    const elK = document.getElementById('kpiKategoriak');
    const elN = document.getElementById('kpiNevezesek');
    const elM = document.getElementById('kpiMeccsek');

    if (elV) elV.innerText = globalVersenyzok.length;
    if (elK) elK.innerText = globalKategoriak.length;
    if (elN) elN.innerText = globalNevezesek.length;
    if (elM) {
        const keszDb = globalMerkozesek.filter(m => m.isFinished).length;
        elM.innerText = `${keszDb} / ${globalMerkozesek.length}`;
    }

    const cbCont = document.getElementById('adminUjVersenyzoKatCheckboxes');
    if (cbCont) {
        const bepipalt = Array.from(cbCont.querySelectorAll('input:checked')).map(c => parseInt(c.value));
        cbCont.innerHTML = globalKategoriak.map(k => `
            <label class="kat-check-item">
                <input type="checkbox" class="admin-uj-kat-cb" value="${k.id}" ${bepipalt.includes(k.id) ? 'checked' : ''}>
                <span><strong>${k.name}</strong> <small style="color:#64748b;">[${k.matchType}]</small></span>
            </label>
        `).join('');
    }
}

// =========================================================
// 1. FÜL: VERSENYZŐK BETÖLTÉSE ÉS FELVÉTELE
// =========================================================
function versenyzokBetoltese() {
    const tbody = document.getElementById('versenyzokTbody');
    if (!tbody) return;

    const kereso = (document.getElementById('adminVersenyzoKereso')?.value || '').toLowerCase().trim();
    const szurt = globalVersenyzok.filter(v =>
        !kereso ||
        (v.name && v.name.toLowerCase().includes(kereso)) ||
        (v.club && v.club.toLowerCase().includes(kereso)) ||
        (v.belt && v.belt.toLowerCase().includes(kereso))
    );

    if (szurt.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px;">Nincs megjeleníthető versenyző.</td></tr>`;
    } else {
        let html = "";
        for (let v of szurt) {
            const nevezettKatNevek = globalNevezesek
                .filter(n => n.competitorId === v.id)
                .map(n => {
                    const kat = globalKategoriak.find(k => k.id === n.categoryId);
                    return kat ? `<span style="background:#e2e8f0;padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:600;display:inline-block;margin:2px;">${kat.name}</span>` : '';
                }).join(' ') || '<em style="color:#94a3b8;">Nincs nevezve</em>';

            html += `<tr>
                <td><strong>#${v.id}</strong></td>
                <td><strong>${v.name}</strong></td>
                <td>${v.club || '-'}</td>
                <td><span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.85rem;">${v.belt || '-'}</span></td>
                <td><strong>${v.weight} kg</strong></td>
                <td>${v.birthYear}</td>
                <td>${nevezettKatNevek}</td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-outline-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztVersenyzoTeljes(${v.id})">✏️ Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Competitors', ${v.id})">🗑️</button>
                </td>
            </tr>`;
        }
        tbody.innerHTML = html;
    }

    // Nevezési legördülő frissítése
    const nevSel = document.getElementById('ujNevezesVersenyzo');
    if (nevSel) {
        nevSel.innerHTML = '<option value="">-- Válassz versenyzőt! --</option>' +
            globalVersenyzok.map(v => `<option value="${v.id}">${v.name} (${v.club} - ${v.weight}kg)</option>`).join('');
    }
}

async function hozzadVersenyzo() {
    const nev = document.getElementById('ujVersenyzoNev').value.trim();
    const klub = document.getElementById('ujVersenyzoKlub').value.trim() || "Shobu HSE";
    const ov = document.getElementById('ujVersenyzoOv').value.trim() || "10. kyu";
    const suly = parseInt(document.getElementById('ujVersenyzoSuly').value) || 60;
    const szulEv = parseInt(document.getElementById('ujVersenyzoSzulEv').value) || 2008;

    if (!nev) {
        TatamiMaster.toast("⚠️ Add meg a versenyző nevét!", "figyelem");
        return;
    }

    const kijeloltKatIdk = Array.from(document.querySelectorAll('.admin-uj-kat-cb:checked')).map(cb => parseInt(cb.value));

    const res = await TatamiMaster.apiSend('Competitors', 'POST', {
        name: nev, club: klub, belt: ov, weight: suly, birthYear: szulEv
    });

    if (res.ok) {
        const mentett = await res.json();
        for (let katId of kijeloltKatIdk) {
            await TatamiMaster.apiSend('Registrations', 'POST', {
                competitorId: mentett.id,
                categoryId: katId
            });
        }

        document.getElementById('ujVersenyzoNev').value = '';
        document.getElementById('ujVersenyzoSuly').value = '';
        document.querySelectorAll('.admin-uj-kat-cb').forEach(cb => cb.checked = false);

        TatamiMaster.toast(`✔ ${nev} felvéve` + (kijeloltKatIdk.length > 0 ? ` és benevezve ${kijeloltKatIdk.length} kategóriába!` : '!'));
        await mindenAdatFrissitese();
    }
}

// =========================================================
// 2. FÜL: KATEGÓRIÁK BETÖLTÉSE ÉS SÚLYBONTÁS
// =========================================================
function kategoriakBetoltese() {
    const tbody = document.getElementById('kategoriakTbody');
    if (tbody) {
        let html = "";
        for (let k of globalKategoriak) {
            const indulokDb = globalNevezesek.filter(n => n.categoryId === k.id).length;
            const tipusBadge = (k.matchType && k.matchType.toUpperCase() === 'KATA')
                ? `<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.8rem;">🧘 KATA</span>`
                : `<span style="background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.8rem;">🥊 KUMITE</span>`;

            html += `<tr>
                <td><strong>#${k.id}</strong></td>
                <td><strong>${k.name}</strong></td>
                <td>${tipusBadge}</td>
                <td>${k.gender || 'Vegyes'}</td>
                <td>${k.minAge || 0} – ${k.maxAge || 99} év</td>
                <td><strong>${indulokDb} fő</strong></td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-outline-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztKategoriaTeljes(${k.id})">✏️ Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Categories', ${k.id})">🗑️</button>
                </td>
            </tr>`;
        }
        tbody.innerHTML = html || `<tr><td colspan="7" style="text-align:center;color:#64748b;">Még nincs kategória.</td></tr>`;
    }

    const opciok = '<option value="">-- Válassz kategóriát! --</option>' +
        globalKategoriak.map(k => `<option value="${k.id}">${k.name} (${k.matchType})</option>`).join('');

    ['ujNevezesKategoria', 'bontandoKategoriaSelect', 'sorsolasKategoriaSelect', 'agrajzKategoriaSelect'].forEach(selId => {
        const el = document.getElementById(selId);
        if (el) {
            const regi = el.value;
            el.innerHTML = opciok;
            if (regi) el.value = regi;
        }
    });
}

async function hozzadKategoria() {
    const nev = document.getElementById('ujKategoriaNev').value.trim();
    const tipus = document.getElementById('ujKategoriaTipus').value;
    const nem = document.getElementById('ujKategoriaNem').value;
    const minKor = parseInt(document.getElementById('ujKategoriaMinKor').value) || 5;
    const maxKor = parseInt(document.getElementById('ujKategoriaMaxKor').value) || 99;

    if (!nev) {
        TatamiMaster.toast("⚠️ Add meg a kategória nevét!", "figyelem");
        return;
    }

    const res = await TatamiMaster.apiSend('Categories', 'POST', {
        name: nev, matchType: tipus, gender: nem, minAge: minKor, maxAge: maxKor
    });
    if (res.ok) {
        document.getElementById('ujKategoriaNev').value = '';
        TatamiMaster.toast("✔ Kategória létrehozva!");
        await mindenAdatFrissitese();
    }
}

async function sulycsoportBontas() {
    const katId = parseInt(document.getElementById('bontandoKategoriaSelect').value);
    const hatar = parseInt(document.getElementById('sulyHatarInput').value);
    if (!katId || isNaN(hatar)) {
        TatamiMaster.toast("⚠️ Válassz kategóriát és adj meg súlyhatárt (kg)!", "figyelem");
        return;
    }

    const eredeti = globalKategoriak.find(k => k.id === katId);
    const nevezettek = globalNevezesek.filter(n => n.categoryId === katId);
    if (!eredeti || nevezettek.length === 0) {
        TatamiMaster.toast("⚠️ Ebben a kategóriában nincs benevezett versenyző!", "figyelem");
        return;
    }

    const resA = await TatamiMaster.apiSend('Categories', 'POST', {
        name: `${eredeti.name} (-${hatar} kg)`, matchType: eredeti.matchType, gender: eredeti.gender, minAge: eredeti.minAge, maxAge: eredeti.maxAge
    });
    const resB = await TatamiMaster.apiSend('Categories', 'POST', {
        name: `${eredeti.name} (+${hatar} kg)`, matchType: eredeti.matchType, gender: eredeti.gender, minAge: eredeti.minAge, maxAge: eredeti.maxAge
    });

    if (resA.ok && resB.ok) {
        const katA = await resA.json();
        const katB = await resB.json();

        for (let nev of nevezettek) {
            const v = globalVersenyzok.find(x => x.id === nev.competitorId);
            if (v) {
                const celKatId = (v.weight <= hatar) ? katA.id : katB.id;
                await TatamiMaster.apiSend('Registrations', 'POST', { competitorId: v.id, categoryId: celKatId });
                await TatamiMaster.apiSend('Registrations/' + nev.id, 'DELETE');
            }
        }
        TatamiMaster.toast(`✔ Kategória sikeresen kettébontva ${hatar} kg-nál!`);
        await mindenAdatFrissitese();
    }
}

// =========================================================
// 3. FÜL: NEVEZÉSEK
// =========================================================
function nevezesekBetoltese() {
    const tbody = document.getElementById('nevezesekTbody');
    if (!tbody) return;

    let html = "";
    for (let n of globalNevezesek) {
        const v = globalVersenyzok.find(x => x.id === n.competitorId);
        const k = globalKategoriak.find(x => x.id === n.categoryId);

        html += `<tr>
            <td>#${n.id}</td>
            <td><strong>${v ? v.name : 'Ismeretlen (#' + n.competitorId + ')'}</strong> <small>(${v ? v.club + ', ' + v.weight + 'kg' : ''})</small></td>
            <td><strong>${k ? k.name : 'Ismeretlen (#' + n.categoryId + ')'}</strong></td>
            <td>${k ? k.matchType : '-'}</td>
            <td>
                <button class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" onclick="torolElem('Registrations', ${n.id})">🗑️ Nevezés törlése</button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html || `<tr><td colspan="5" style="text-align:center;color:#64748b;">Nincs rögzített nevezés.</td></tr>`;
}

async function hozzadNevezes() {
    const versenyzoId = parseInt(document.getElementById('ujNevezesVersenyzo').value);
    const kategoriaId = parseInt(document.getElementById('ujNevezesKategoria').value);

    if (!versenyzoId || !kategoriaId) {
        TatamiMaster.toast("⚠️ Válassz versenyzőt és kategóriát is!", "figyelem");
        return;
    }

    const marNevezve = globalNevezesek.some(n => n.competitorId === versenyzoId && n.categoryId === kategoriaId);
    if (marNevezve) {
        TatamiMaster.toast("⛔ Ez a versenyző már szerepel ebben a kategóriában!", "hiba");
        return;
    }

    const res = await TatamiMaster.apiSend('Registrations', 'POST', { competitorId: versenyzoId, categoryId: kategoriaId });
    if (res.ok) {
        TatamiMaster.toast("✔ Nevezés rögzítve!");
        await mindenAdatFrissitese();
    }
}

// =========================================================
// 4. FÜL: TATAMIK, SORSOLÁS ÉS MÉRKŐZÉSEK
// =========================================================
function tatamikBetoltese() {
    const cont = document.getElementById('tatamikTbody');
    if (cont) {
        cont.innerHTML = globalTatamik.map(t => {
            const meccsDb = globalMerkozesek.filter(m => m.tatamiId === t.id).length;
            return `<div class="pro-card" style="margin-bottom:0;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <strong style="font-size:1.15rem;">🥋 ${t.name}</strong><br>
                    <small style="color:#64748b;">Beosztott mérkőzések: ${meccsDb} db</small>
                </div>
                <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Tatamis', ${t.id})">🗑️</button>
            </div>`;
        }).join('');
    }

    const tatSel = document.getElementById('sorsolasTatamiSelect');
    if (tatSel) {
        tatSel.innerHTML = '<option value="">-- Válassz Tatamit! --</option>' +
            globalTatamik.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
}

async function hozzadTatami() {
    const nev = document.getElementById('ujTatamiNev').value.trim();
    if (!nev) return;
    const res = await TatamiMaster.apiSend('Tatamis', 'POST', { name: nev });
    if (res.ok) {
        document.getElementById('ujTatamiNev').value = '';
        await mindenAdatFrissitese();
    }
}

function frissitKiemelesValaszto() {
    const katId = parseInt(document.getElementById('sorsolasKategoriaSelect')?.value);
    const cont = document.getElementById('kiemelesContainer');
    if (!cont) return;
    if (!katId) { cont.innerHTML = ''; return; }

    const indulok = globalNevezesek.filter(n => n.categoryId === katId)
                                   .map(n => globalVersenyzok.find(v => v.id === n.competitorId))
                                   .filter(Boolean);

    if (indulok.length === 0) {
        cont.innerHTML = `<span style="color:#dc2626;font-weight:bold;">Nincs benevezett versenyző ebben a kategóriában!</span>`;
        return;
    }

    cont.innerHTML = `<div style="margin-bottom:6px;font-size:0.85rem;font-weight:700;">⭐ Kiemelt versenyzők bepipálása (opcionális):</div>` +
        `<div class="kat-checkbox-grid">` +
        indulok.map(v => `
            <label class="kat-check-item">
                <input type="checkbox" class="kiemelt-versenyzo-cb" value="${v.id}">
                <span>${v.name} <small>(${v.club})</small></span>
            </label>
        `).join('') + `</div>`;
}

async function kategoriaSorsolasa() {
    const katId = parseInt(document.getElementById('sorsolasKategoriaSelect').value);
    const tatamiId = parseInt(document.getElementById('sorsolasTatamiSelect').value);
    const formatum = document.getElementById('sorsolasFormatumSelect').value;

    if (!katId || !tatamiId) {
        TatamiMaster.toast("⚠️ Válassz kategóriát és tatamit is!", "figyelem");
        return;
    }

    const kivalasztottKat = globalKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType && kivalasztottKat.matchType.toUpperCase() === 'KATA');

    let indulok = globalNevezesek.filter(n => n.categoryId === katId)
                                 .map(n => globalVersenyzok.find(v => v.id === n.competitorId))
                                 .filter(Boolean);

    if (indulok.length === 0 || (!isKata && indulok.length < 2)) {
        TatamiMaster.toast("⛔ Nincs elég benevezett versenyző a sorsoláshoz!", "hiba");
        return;
    }

    const meglevoKatMeccsek = globalMerkozesek.filter(m => m.categoryId === katId);
    if (meglevoKatMeccsek.length > 0) {
        if (!confirm(`⚠️ Ebben a kategóriában már van ${meglevoKatMeccsek.length} db mérkőzés! Töröljük őket és újrasorsoljuk?`)) return;
        for (let rm of meglevoKatMeccsek) {
            await TatamiMaster.apiSend('Matches/' + rm.id, 'DELETE');
        }
    }

    const kiemeltIdk = Array.from(document.querySelectorAll('.kiemelt-versenyzo-cb:checked')).map(cb => parseInt(cb.value));
    let kiemeltek = indulok.filter(v => kiemeltIdk.includes(v.id));
    let tobbiek = indulok.filter(v => !kiemeltIdk.includes(v.id)).sort(() => Math.random() - 0.5);
    let rendezett = kiemeltek.concat(tobbiek);

    const tatamiMeccsei = globalMerkozesek.filter(m => m.tatamiId === tatamiId && m.categoryId !== katId);
    let sorszam = tatamiMeccsei.length > 0 ? Math.max(...tatamiMeccsei.map(m => m.matchOrder)) + 1 : 1;
    let generalt = [];

    if (isKata) {
        let kataSorrend = tobbiek.concat(kiemeltek);
        for (let v of kataSorrend) {
            generalt.push({ categoryId: katId, tatamiId, competitor1Id: v.id, competitor2Id: null, matchOrder: sorszam++, isFinished: false, winnerId: null });
        }
    } else if (formatum === 'kormeccs') {
        for (let i = 0; i < rendezett.length; i++) {
            for (let j = i + 1; j < rendezett.length; j++) {
                generalt.push({ categoryId: katId, tatamiId, competitor1Id: rendezett[i].id, competitor2Id: rendezett[j].id, matchOrder: sorszam++, isFinished: false, winnerId: null });
            }
        }
    } else {
        let agrajzMeret = 2;
        while (agrajzMeret < rendezett.length) agrajzMeret *= 2;
        let eronyerokSzama = agrajzMeret - rendezett.length;
        let kuzdok = [...rendezett];
        let elsoKor = [];

        let valodiDb = (rendezett.length - eronyerokSzama) / 2;
        for (let i = 0; i < valodiDb; i++) {
            let aka = kuzdok.shift();
            let shiroIdx = kuzdok.findIndex(v => v.club !== aka.club);
            if (shiroIdx === -1) shiroIdx = 0;
            let shiro = kuzdok.splice(shiroIdx, 1)[0];
            elsoKor.push({ categoryId: katId, tatamiId, competitor1Id: aka.id, competitor2Id: shiro.id, matchOrder: sorszam++, isFinished: false, winnerId: null });
        }
        while (kuzdok.length > 0) {
            let v = kuzdok.shift();
            elsoKor.push({ categoryId: katId, tatamiId, competitor1Id: v.id, competitor2Id: null, matchOrder: sorszam++, isFinished: true, winnerId: v.id });
        }
        generalt.push(...elsoKor);
        let elozoKor = elsoKor;
        let korMeret = agrajzMeret / 4;
        while (korMeret >= 1) {
            let ujKor = [];
            for (let i = 0; i < korMeret; i++) {
                let m1 = elozoKor[i * 2], m2 = elozoKor[i * 2 + 1];
                ujKor.push({
                    categoryId: katId, tatamiId,
                    competitor1Id: (m1 && m1.isFinished) ? m1.winnerId : null,
                    competitor2Id: (m2 && m2.isFinished) ? m2.winnerId : null,
                    matchOrder: sorszam++, isFinished: false, winnerId: null
                });
            }
            generalt.push(...ujKor);
            elozoKor = ujKor;
            korMeret /= 2;
        }
    }

    for (let m of generalt) {
        await TatamiMaster.apiSend('Matches', 'POST', m);
    }
    TatamiMaster.toast(`🎲 Sorsolás kész! (${generalt.length} mérkőzés létrehozva)`);
    await mindenAdatFrissitese();
}

function merkozesekBetoltese() {
    const tbody = document.getElementById('merkozesekTbody');
    if (!tbody) return;

    let html = "";
    for (let m of globalMerkozesek) {
        const tat = globalTatamik.find(t => t.id === m.tatamiId);
        const kat = globalKategoriak.find(k => k.id === m.categoryId);
        const v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
        const v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);
        const gy = globalVersenyzok.find(v => v.id === m.winnerId);
        const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');

        const statuszHtml = m.isFinished
            ? `<span style="color:#10b981;font-weight:700;">✔ Kész (${gy ? gy.name : 'Erőnyerő'})</span>`
            : `<span style="color:#f59e0b;font-weight:700;">⏳ Várakozik</span>`;

        html += `<tr draggable="true" ondragstart="dragStart(event, ${m.id})" ondragover="dragOver(event)" ondrop="dropMatch(event, ${m.id})" style="cursor:grab;">
            <td><strong>#${m.matchOrder}</strong></td>
            <td>${tat ? tat.name : '-'}</td>
            <td><strong>${kat ? kat.name : '-'}</strong></td>
            <td style="color:#e62e2d;font-weight:700;">${v1 ? v1.name + ' <small>(' + v1.club + ')</small>' : 'Várakozik...'}</td>
            <td>${isKata ? '<em>KATA EGYÉNI</em>' : (v2 ? v2.name + ' <small>(' + v2.club + ')</small>' : (m.isFinished ? '<em>Erőnyerő</em>' : 'Várakozik...'))}</td>
            <td>${statuszHtml}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-outline" style="background:#f59e0b;color:#111;padding:4px 8px;font-size:0.8rem;" onclick="meccsUjranyitasaReset(${m.id})">🔄 Újranyitás</button>
                <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick="torolElem('Matches', ${m.id})">🗑️</button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html || `<tr><td colspan="7" style="text-align:center;color:#64748b;">Még nincs kisorsolt mérkőzés.</td></tr>`;
}

function dragStart(ev, matchId) { draggedMatchId = matchId; }
function dragOver(ev) { ev.preventDefault(); }
async function dropMatch(ev, targetMatchId) {
    ev.preventDefault();
    if (!draggedMatchId || draggedMatchId === targetMatchId) return;
    const m1 = globalMerkozesek.find(m => m.id === draggedMatchId);
    const m2 = globalMerkozesek.find(m => m.id === targetMatchId);
    if (!m1 || !m2) return;

    const tempOrder = m1.matchOrder;
    m1.matchOrder = m2.matchOrder;
    m2.matchOrder = tempOrder;

    await Promise.all([
        TatamiMaster.apiSend('Matches/' + m1.id, 'PUT', m1),
        TatamiMaster.apiSend('Matches/' + m2.id, 'PUT', m2)
    ]);
    await mindenAdatFrissitese();
}

async function osszesMerkozesTorlese() {
    if (!confirm("⚠️ Biztosan törlöd az ÖSSZES kisorsolt mérkőzést?")) return;
    for (let m of globalMerkozesek) {
        await TatamiMaster.apiSend('Matches/' + m.id, 'DELETE');
    }
    localStorage.removeItem('kataEredmenyek');
    localStorage.removeItem('kataDontoMeccsIdk');
    localStorage.removeItem('kumiteReszletek');
    await mindenAdatFrissitese();
}

async function torolElem(vegpont, id) {
    if (!confirm("Biztosan törlöd ezt a tételt?")) return;
    const res = await TatamiMaster.apiSend(`${vegpont}/${id}`, 'DELETE');
    if (res.ok) {
        TatamiMaster.toast("🗑️ Tétel törölve!");
        await mindenAdatFrissitese();
    }
}

// =========================================================
// 5. FÜL: ÁGRAJZ ÉS KATA RANGLISTA
// =========================================================
function rajzolAgrajz() {
    const sel = document.getElementById('agrajzKategoriaSelect');
    const cont = document.getElementById('bracketContainer');
    if (!sel || !cont) return;

    const katId = parseInt(sel.value) || (globalKategoriak[0] ? globalKategoriak[0].id : 0);
    if (!katId) { cont.innerHTML = '<p>Nincs kategória.</p>'; return; }
    sel.value = katId;

    const kat = globalKategoriak.find(k => k.id === katId);
    const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
    const katMeccsek = globalMerkozesek.filter(m => m.categoryId === katId).sort((a, b) => a.id - b.id);

    if (katMeccsek.length === 0) {
        cont.innerHTML = '<p style="color:#64748b;">Ehhez a kategóriához még nincs kisorsolt ágrajz / rajtlista.</p>';
        return;
    }

    const nevKeres = (id) => {
        const v = globalVersenyzok.find(x => x.id === id);
        return v ? `${v.name} <small>(${v.club})</small>` : 'Várakozik...';
    };

    if (isKata) {
        const kataTar = TatamiMaster.lekerKataEredmenyek();
        let sorok = katMeccsek.map(m => {
            const v = globalVersenyzok.find(x => x.id === m.competitor1Id);
            const er = kataTar[m.id] || { kesz: false, osszeg: 0 };
            return { m, v, er };
        });
        cont.innerHTML = `<table class="data-table"><thead><tr><th>Rajtszám</th><th>Versenyző</th><th>Klub</th><th>Összpontszám</th></tr></thead><tbody>` +
            sorok.map(s => `<tr><td>#${s.m.matchOrder}</td><td><strong>${s.v ? s.v.name : '-'}</strong></td><td>${s.v ? s.v.club : '-'}</td><td><strong style="color:#e62e2d;">${s.er.kesz ? s.er.osszeg.toFixed(1) : 'Várakozik'}</strong></td></tr>`).join('') +
            `</tbody></table>`;
        return;
    }

    cont.innerHTML = `<div class="bracket-wrapper"><div class="bracket-round">` +
        katMeccsek.map(m => `
            <div class="bracket-match">
                <div style="background:#f1f5f9;padding:4px 10px;font-size:0.78rem;font-weight:700;">Mérkőzés #${m.matchOrder}</div>
                <div class="bracket-fighter aka ${m.isFinished && m.winnerId === m.competitor1Id ? 'winner' : ''}"><span>🔴 ${nevKeres(m.competitor1Id)}</span><span>${m.isFinished && m.winnerId === m.competitor1Id ? '🏆' : ''}</span></div>
                <div class="bracket-fighter shiro ${m.isFinished && m.winnerId === m.competitor2Id ? 'winner' : ''}"><span>⚪ ${m.competitor2Id ? nevKeres(m.competitor2Id) : 'Erőnyerő'}</span><span>${m.isFinished && m.winnerId === m.competitor2Id ? '🏆' : ''}</span></div>
            </div>
        `).join('') + `</div></div>`;
}

// =========================================================
// MÚLTBELI EMBERI HIBÁK KORREKCIÓJA (SZERKESZTÉS & RESET)
// =========================================================
async function szerkesztVersenyzoTeljes(id) {
    const v = globalVersenyzok.find(x => x.id === id);
    if (!v) return;

    const ujNev = prompt("Versenyző neve:", v.name);
    if (ujNev === null) return;
    const ujKlub = prompt("Klub neve:", v.club);
    if (ujKlub === null) return;
    const ujOv = prompt("Övfokozat (pl. 4. kyu / 1. dan):", v.belt || "10. kyu");
    if (ujOv === null) return;
    const ujSuly = prompt("Mérlegelt súly (kg):", v.weight);
    if (ujSuly === null) return;
    const ujEv = prompt("Születési év:", v.birthYear);
    if (ujEv === null) return;

    v.name = ujNev.trim() || v.name;
    v.club = ujKlub.trim() || v.club;
    v.belt = ujOv.trim() || v.belt;
    v.weight = parseInt(ujSuly) || v.weight;
    v.birthYear = parseInt(ujEv) || v.birthYear;

    const res = await TatamiMaster.apiSend('Competitors/' + id, 'PUT', v);
    if (res.ok) {
        TatamiMaster.toast(`✔ ${v.name} adatai frissítve!`);
        await mindenAdatFrissitese();
    }
}

async function szerkesztKategoriaTeljes(id) {
    const k = globalKategoriak.find(x => x.id === id);
    if (!k) return;
    const ujNev = prompt("Kategória neve:", k.name);
    if (ujNev === null) return;
    const ujTipus = prompt("Típus (KUMITE vagy KATA):", k.matchType);
    if (ujTipus === null) return;

    k.name = ujNev.trim() || k.name;
    k.matchType = (ujTipus.trim().toUpperCase() === 'KATA') ? 'KATA' : 'KUMITE';

    const res = await TatamiMaster.apiSend('Categories/' + id, 'PUT', k);
    if (res.ok) {
        TatamiMaster.toast(`✔ Kategória frissítve!`);
        await mindenAdatFrissitese();
    }
}

async function meccsUjranyitasaReset(matchId) {
    const m = globalMerkozesek.find(x => x.id === matchId);
    if (!m) return;
    if (!confirm(`🔄 Biztosan újranyitod a #${m.matchOrder}. mérkőzést?`)) return;

    m.isFinished = false;
    m.winnerId = null;

    let kataTar = TatamiMaster.lekerKataEredmenyek();
    delete kataTar[matchId];
    localStorage.setItem('kataEredmenyek', JSON.stringify(kataTar));

    const res = await TatamiMaster.apiSend('Matches/' + matchId, 'PUT', m);
    if (res.ok) {
        TatamiMaster.toast(`🔄 Mérkőzés #${m.matchOrder} újranyitva!`);
        await mindenAdatFrissitese();
    }
}

// ============================================================================
// NAGY TESZT: TELJES ADATBÁZIS TÖRLÉS, ID=1 RESET ÉS SQL TESZTADATOK BETÖLTÉSE
// ============================================================================
async function nagyTesztAdatbazisReset() {
    if (!confirm("🚀 NAGY TESZT INDÍTÁSA:\n\nBiztosan törölsz minden jelenlegi adatot, visszaállítod az összes ID-t 1-re, és feltöltöd a rendszert a tiszta SQL tesztadatokkal?")) {
        return;
    }

    // 1. Helyi (localStorage) meccs- és kata-eredmények teljes takarítása
    localStorage.removeItem('kataEredmenyek');
    localStorage.removeItem('kataDontoMeccsIdk');
    localStorage.removeItem('kumiteReszletek');
    localStorage.removeItem('tatamiAdatok');
    localStorage.removeItem('tatamiAdatok_1');
    localStorage.removeItem('tatamiAdatok_2');

    // 2. C# Backend TRUNCATE + Seed végpont meghívása
    const res = await TatamiMaster.apiSend('Tournaments/reset-seed', 'POST', {});
    if (res.ok) {
        TatamiMaster.toast("🚀 Minden adat törölve, ID-k 1-re állítva, SQL tesztadatok betöltve!");
        await mindenAdatFrissitese();
    } else {
        TatamiMaster.toast("❌ Hiba történt a tesztadatok visszaállításakor!", "hiba");
    }
}