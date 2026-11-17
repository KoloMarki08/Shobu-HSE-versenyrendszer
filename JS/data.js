let exVersenyzok = [];
let exKategoriak = [];
let exNevezesek = [];
let exTatamik = [];
let exMeccsek = [];

let extraLiveDebounce = null;

window.addEventListener('DOMContentLoaded', async function() {
    await extraAdatokBetoltese();

    if (window.TatamiMaster && typeof TatamiMaster.initLiveSync === 'function') {
        TatamiMaster.initLiveSync({ tatamiFigyeles: false });
        TatamiMaster.on('liveAdatValtozott', function() {
            if (extraLiveDebounce) clearTimeout(extraLiveDebounce);
            extraLiveDebounce = setTimeout(function() {
                const aktiv = document.activeElement;
                if (aktiv && (aktiv.tagName === 'INPUT' || aktiv.tagName === 'SELECT' || aktiv.tagName === 'TEXTAREA')) {
                    return;
                }
                extraAdatokBetoltese();
            }, 350);
        });
    }
});

async function extraAdatokBetoltese() {
    try {
        const [v, k, n, t, m] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches')
        ]);
        exVersenyzok = v;
        exKategoriak = k;
        exNevezesek = n;
        exTatamik = t;
        exMeccsek = m.sort((a, b) => (a.tatamiId - b.tatamiId) || (a.matchOrder - b.matchOrder));

        if (document.getElementById('pageKategoriak')) initKategoriakPage();
        if (document.getElementById('pageEredmenyek')) initEredmenyekPage();
        if (document.getElementById('pageNevezes')) initNevezesPage();
        if (document.getElementById('pageTatami')) initTatamiPage();
        if (typeof initDedikaltKataPage === 'function' && document.getElementById('pageKata')) initDedikaltKataPage();
        if (typeof initDedikaltKumitePage === 'function' && document.getElementById('pageKumite')) initDedikaltKumitePage();
        if (typeof initDedikaltKiemelesPage === 'function' && document.getElementById('pageKiemeles')) initDedikaltKiemelesPage();
    } catch (e) {
        console.error("Hiba az adatok betöltésekor:", e);
    }
}

// Övfokozat szövegből (pl. "4. kyu", "1. dan") numerikus kyu-számot csinál (Dan = 0)
function parseKyuSzam(beltStr) {
    if (!beltStr) return 10;
    let s = beltStr.toLowerCase().trim();
    if (s.includes('dan')) return 0;
    let szam = parseInt(s.replace(/[^0-9]/g, ''));
    return isNaN(szam) ? 10 : szam;
}

// 1. KATEGORIAK.HTML - KATA KYU-BONTÓ (A/B/C) & SÚLYBONTÓ
function initKategoriakPage() {
    const kataKatok = exKategoriak.filter(k => k.matchType && k.matchType.toUpperCase() === 'KATA');
    const kumiteKatok = exKategoriak.filter(k => !k.matchType || k.matchType.toUpperCase() === 'KUMITE');

    let kataOpt = '<option value="">-- Válassz Kata kategóriát! --</option>';
    for (let k of kataKatok) {
        let db = exNevezesek.filter(n => n.categoryId === k.id).length;
        kataOpt += `<option value="${k.id}">${k.name} (${db} nevezett)</option>`;
    }
    document.getElementById('kyuBontoKatSelect').innerHTML = kataOpt;

    let kumiteOpt = '<option value="">-- Válassz Kumite kategóriát! --</option>';
    for (let k of kumiteKatok) {
        let db = exNevezesek.filter(n => n.categoryId === k.id).length;
        kumiteOpt += `<option value="${k.id}">${k.name} (${db} nevezett)</option>`;
    }
    document.getElementById('sulyBontoKatSelect').innerHTML = kumiteOpt;

    let tablaHtml = '<table class="data-table"><tr><th>ID</th><th>Kategória neve</th><th>Típus</th><th>Nem</th><th>Korcsoport</th><th>Indulók száma és Övfokozataik</th></tr>';
    for (let k of exKategoriak) {
        let nevezettek = exNevezesek.filter(n => n.categoryId === k.id)
                                    .map(n => exVersenyzok.find(v => v.id === n.competitorId))
                                    .filter(Boolean);
        let indulokInfo = nevezettek.map(v => `${v.name} <small>(${v.belt || '-'}, ${v.weight}kg)</small>`).join(', ') || '<em>Még nincs induló</em>';
        let isKata = k.matchType === 'KATA';
        tablaHtml += `<tr>
            <td>${k.id}</td>
            <td><strong>${k.name}</strong></td>
            <td><span style="background:${isKata ? '#F3F0EA' : '#18181B'};color:${isKata ? '#18181B' : '#FFFFFF'};border:1px solid #D4CFC5;padding:2px 8px;border-radius:4px;font-weight:bold;font-size:0.78rem;">${k.matchType}</span></td>
            <td>${k.gender}</td>
            <td>${k.minAge} - ${k.maxAge} év</td>
            <td><strong>${nevezettek.length} fő:</strong> ${indulokInfo}</td>
        </tr>`;
    }
    tablaHtml += '</table>';
    document.getElementById('kategoriakOsszesitoContainer').innerHTML = tablaHtml;
}

async function kataKyuBontasVegrehajtas() {
    const katId = parseInt(document.getElementById('kyuBontoKatSelect').value);
    const bontasMod = document.getElementById('kyuBontasModSelect').value;

    if (!katId) { alert("Válassz ki egy Kata kategóriát a bontáshoz!"); return; }

    const eredetiKat = exKategoriak.find(k => k.id === katId);
    const katNevezesek = exNevezesek.filter(n => n.categoryId === katId);

    if (katNevezesek.length === 0) {
        alert("Ebben a Kata kategóriában még nincs benevezett versenyző!");
        return;
    }

    let csoportok = (bontasMod === 'ABC') ? [
        { utotag: ' - A kategória (2. kyu - Dan)', minKyu: 0, maxKyu: 2 },
        { utotag: ' - B kategória (6-3. kyu)',     minKyu: 3, maxKyu: 6 },
        { utotag: ' - C kategória (10-7. kyu)',    minKyu: 7, maxKyu: 12 }
    ] : [
        { utotag: ' - A kategória (5. kyu - Dan)', minKyu: 0, maxKyu: 5 },
        { utotag: ' - B kategória (10-6. kyu)',    minKyu: 6, maxKyu: 12 }
    ];

    const alapNev = eredetiKat.name.split(' - ')[0];
    eredetiKat.name = alapNev + csoportok[0].utotag;
    await TatamiMaster.apiSend('Categories/' + eredetiKat.id, 'PUT', eredetiKat);

    let atsorolvaOsszesen = 0;

    for (let i = 1; i < csoportok.length; i++) {
        let cs = csoportok[i];
        let erintettNevezesek = katNevezesek.filter(n => {
            let v = exVersenyzok.find(x => x.id === n.competitorId);
            let kyu = parseKyuSzam(v ? v.belt : '10. kyu');
            return kyu >= cs.minKyu && kyu <= cs.maxKyu;
        });

        const res = await TatamiMaster.apiSend('Categories', 'POST', {
            name: alapNev + cs.utotag,
            matchType: 'KATA',
            gender: eredetiKat.gender,
            minAge: eredetiKat.minAge,
            maxAge: eredetiKat.maxAge
        });

        if (res.ok) {
            const letrejottKat = await res.json();
            for (let nev of erintettNevezesek) {
                await TatamiMaster.apiSend('Registrations/' + nev.id, 'PUT', {
                    id: nev.id,
                    competitorId: nev.competitorId,
                    categoryId: letrejottKat.id
                });
                atsorolvaOsszesen++;
            }
        }
    }

    alert(`Kata Kyu-bontás kész! ${atsorolvaOsszesen} versenyző automatikusan átsorolva az övfokozata alapján!`);
    await extraAdatokBetoltese();
}

async function extraSulyBontas() {
    const katId = parseInt(document.getElementById('sulyBontoKatSelect').value);
    const hatar = parseInt(document.getElementById('extraSulyHatar').value);
    if (!katId || isNaN(hatar)) { alert("Válassz kategóriát és adj meg súlyhatárt!"); return; }

    const eredeti = exKategoriak.find(k => k.id === katId);
    const res = await TatamiMaster.apiSend('Categories', 'POST', {
        name: eredeti.name + " (+" + hatar + "kg)",
        matchType: eredeti.matchType,
        gender: eredeti.gender,
        minAge: eredeti.minAge,
        maxAge: eredeti.maxAge
    });

    if (res.ok) {
        const ujKat = await res.json();
        const nevezettek = exNevezesek.filter(n => n.categoryId === katId);
        let db = 0;
        for (let n of nevezettek) {
            let v = exVersenyzok.find(x => x.id === n.competitorId);
            if (v && v.weight >= hatar) {
                await TatamiMaster.apiSend('Registrations/' + n.id, 'PUT', { id: n.id, competitorId: n.competitorId, categoryId: ujKat.id });
                db++;
            }
        }
        alert(`Súlybontás kész! ${db} versenyző átsorolva a +${hatar}kg kategóriába.`);
        await extraAdatokBetoltese();
    }
}

// 2. EREDMENYEK.HTML - DOBOGÓSOK, KLUBRANGLISTA & SABLONOS OKLEVÉL
let eredmenyDobogosLista = [];

function initEredmenyekPage() {
    const user = TatamiMaster.lekerBejelentkezes();
    const sablonBtn = document.getElementById('eredmenyekSablonBtn');
    if (sablonBtn) {
        sablonBtn.style.display = (user && user.role && String(user.role).toUpperCase() === 'ADMIN') ? 'inline-flex' : 'none';
    }

    const esc = (s) => TatamiMaster.escapeHtml(s);
    const { kategoriaEredmenyek, klubLista } = TatamiMaster.szamolDobogosokEsKlubok(exKategoriak, exMeccsek, exVersenyzok);

    eredmenyDobogosLista = [];
    let dobogoHtml = '';

    for (let ke of kategoriaEredmenyek) {
        const kat = ke.kategoria;
        const katNev = esc(kat.name || '');
        dobogoHtml += `<div style="background:#FFFFFF;border:1px solid #E4E0D7;border-radius:10px;padding:18px;margin-bottom:15px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px 0;">
                <h3 style="margin:0;display:flex;align-items:center;gap:8px;color:#18181B;">${TatamiMaster.icon('trophy', 18)} ${katNev} (${esc(kat.matchType || '')})</h3>
                <button type="button" class="btn btn-outline-green" style="padding:5px 12px;font-size:0.84rem;" onclick="nyomtatKategoriaOklevelek(${kat.id})">
                    ${TatamiMaster.icon('print', 14)} Kategória okleveleinek nyomtatása
                </button>
            </div>
            <table class="data-table"><tr><th>Helyezés</th><th>Versenyző</th><th>Klub</th><th>Eredmény</th><th>Oklevél</th></tr>`;
        for (let d of ke.dobogosok) {
            if (!d.v) continue;
            const idx = eredmenyDobogosLista.length;
            eredmenyDobogosLista.push({
                categoryId: kat.id,
                nev: d.v.name,
                klub: d.v.club,
                kategoria: kat.name,
                helyezes: d.hely
            });
            let ikon = `${TatamiMaster.icon('medal', 15)} ${d.hely}. hely`;
            dobogoHtml += `<tr>
                <td><strong>${ikon}</strong></td>
                <td><strong>${esc(d.v.name || '')}</strong></td>
                <td>${esc(d.v.club || '')}</td>
                <td>${esc(d.extra || '')}</td>
                <td><button type="button" class="btn btn-outline-blue" style="padding:5px 12px;" onclick="nyomtatOklevelIndex(${idx})">${TatamiMaster.icon('print', 14)} Oklevél nyomtatása</button></td>
            </tr>`;
        }
        dobogoHtml += `</table></div>`;
    }

    document.getElementById('dobogosokContainer').innerHTML = dobogoHtml || '<p>Még nincs lezárt kategória.</p>';

    let kHtml = `<table class="data-table"><tr><th>Helyezés</th><th>Klub / Egyesület</th><th>${TatamiMaster.icon('medal', 14)} Arany (5p)</th><th>${TatamiMaster.icon('medal', 14)} Ezüst (3p)</th><th>${TatamiMaster.icon('medal', 14)} Bronz (1p)</th><th>Összpontszám</th></tr>`;
    for (let i = 0; i < klubLista.length; i++) {
        let k = klubLista[i];
        kHtml += `<tr>
            <td><strong>${i + 1}.</strong></td>
            <td><strong>${esc(k.klub || '')}</strong></td>
            <td>${k.arany} db</td>
            <td>${k.ezust} db</td>
            <td>${k.bronz} db</td>
            <td style="color:#18181B;font-weight:bold;font-size:1.15rem;">${k.pont} pont</td>
        </tr>`;
    }
    kHtml += '</table>';
    document.getElementById('klubRanglistaContainer').innerHTML = klubLista.length > 0 ? kHtml : '<p>Még nincs kiosztott érem.</p>';
}

function nyitEredmenyekSablonSzerkeszto() {
    TatamiMaster.nyitOklevelSablonModal(null, () => {
        nyomtatOsszesOklevelet();
    });
}

function nyomtatOklevelIndex(idx) {
    const t = eredmenyDobogosLista[idx];
    if (!t) return;
    TatamiMaster.nyomtatOklevelek(TatamiMaster.lekerAktualisVersenyId(), [t]);
}

function nyomtatKategoriaOklevelek(categoryId) {
    const tetelek = eredmenyDobogosLista.filter(t => t.categoryId === categoryId);
    if (tetelek.length === 0) {
        TatamiMaster.toast('Ehhez a kategóriához még nincs lezárt dobogós.', 'figyelem');
        return;
    }
    TatamiMaster.nyomtatOklevelek(TatamiMaster.lekerAktualisVersenyId(), tetelek);
}

function nyomtatOsszesOklevelet() {
    if (eredmenyDobogosLista.length === 0) {
        TatamiMaster.toast('Még nincs lezárt kategória oklevélnyomtatáshoz.', 'figyelem');
        return;
    }
    TatamiMaster.nyomtatOklevelek(TatamiMaster.lekerAktualisVersenyId(), eredmenyDobogosLista);
}

function nyomtatOklevel(nev, klub, kategoria, helyezes) {
    TatamiMaster.nyomtatOklevelek(TatamiMaster.lekerAktualisVersenyId(), [{ nev, klub, kategoria, helyezes }]);
}

// 3. NEVEZES.HTML - GYORS MÉRLEGELŐ ÁLLOMÁS
function initNevezesPage() {
    const kereso = (document.getElementById('merlegKeresoInput')?.value || '').toLowerCase();
    let szurt = exVersenyzok.filter(v => v.name.toLowerCase().includes(kereso) || (v.club && v.club.toLowerCase().includes(kereso)));

    let html = '<table class="data-table"><tr><th>Név</th><th>Klub</th><th>Öv</th><th>Szül. év</th><th>Mérlegelt Súly (kg)</th><th>Nevezett Kategóriái</th></tr>';
    for (let v of szurt) {
        let katNevLista = exNevezesek.filter(n => n.competitorId === v.id)
                                     .map(n => exKategoriak.find(k => k.id === n.categoryId)?.name)
                                     .filter(Boolean).join(', ') || '<em>Nincs benevezve</em>';
        html += `<tr>
            <td><strong>${v.name}</strong></td>
            <td>${v.club}</td>
            <td>${v.belt}</td>
            <td>${v.birthYear}</td>
            <td>
                <input type="number" id="gyorsSuly_${v.id}" value="${v.weight}" style="width:75px;padding:5px;font-weight:bold;"> kg
                <button class="btn btn-outline-green" style="padding:4px 10px;" onclick="gyorsSulyMentes(${v.id})">${TatamiMaster.icon('check', 14)} Mentés</button>
            </td>
            <td>${katNevLista}</td>
        </tr>`;
    }
    html += '</table>';
    document.getElementById('gyorsMerlegeloContainer').innerHTML = html;
}

async function gyorsSulyMentes(id) {
    let v = exVersenyzok.find(x => x.id === id);
    let ujSuly = parseFloat(document.getElementById('gyorsSuly_' + id).value);
    if (!v || isNaN(ujSuly)) return;
    v.weight = ujSuly;
    await TatamiMaster.apiSend('Competitors/' + id, 'PUT', v);
    TatamiMaster.toast(`${v.name} mérlegelt súlya (${ujSuly} kg) elmentve!`);
    await extraAdatokBetoltese();
}

// 4. TATAMI.HTML - PÁSTSZÉLI FELVEZETŐ NÉZET
function initTatamiPage() {
    const sel = document.getElementById('pastTatamiSelect');
    if (sel && sel.options.length === 0) {
        sel.innerHTML = exTatamik.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
    const tatamiId = parseInt(sel.value);
    const meccsek = exMeccsek.filter(m => m.tatamiId === tatamiId && (m.competitor1Id || m.competitor2Id));

    let html = '<table class="data-table"><tr><th>Sorszám</th><th>Kategória</th><th>Küzdők / Katázó</th><th>Státusz</th></tr>';
    for (let m of meccsek) {
        let kat = exKategoriak.find(k => k.id === m.categoryId);
        let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        if (!isKata && m.isFinished && !m.competitor2Id) continue;

        let v1 = exVersenyzok.find(v => v.id === m.competitor1Id);
        let v2 = exVersenyzok.find(v => v.id === m.competitor2Id);
        let isKataDonto = isKata && TatamiMaster.isKataDontoMeccs(m.id);
        let kataCimke = isKata ? (isKataDonto ? ' <span style="background:#990000;color:#FAF8F5;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:800;">TOP 6 DÖNTŐ</span>' : ' <span style="background:#E4E0D7;color:#18181B;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;">SELEJTEZŐ</span>') : '';
        let parositas = isKata
            ? `${TatamiMaster.icon('award', 15)} <strong>${v1 ? v1.name + ' (' + v1.club + ')' : 'Várakozik...'}</strong>`
            : `<span style="color:#990000;font-weight:bold;"><span class="fighter-tag aka-tag">AKA</span> ${v1 ? v1.name + ' (' + v1.club + ')' : 'Várakozik...'}</span> vs. <strong><span class="fighter-tag shiro-tag">SHIRO</span> ${v2 ? v2.name + ' (' + v2.club + ')' : 'Várakozik...'}</strong>`;

        html += `<tr style="${m.isFinished ? 'opacity:0.55;background:#F3F0EA;' : ''}">
            <td><strong>#${m.matchOrder}</strong></td>
            <td>${kat ? kat.name : ''}${kataCimke}</td>
            <td>${parositas}</td>
            <td>${m.isFinished ? `<span style="color:#52525B;font-weight:bold;">${TatamiMaster.icon('check', 14)} Lezajlott</span>` : `<span style="background:#18181B;color:#FFFFFF;padding:3px 9px;border-radius:4px;font-weight:bold;font-size:0.8rem;">${TatamiMaster.icon('megaphone', 13)} Szólítandó</span>`}</td>
        </tr>`;
    }
    html += '</table>';
    document.getElementById('pastListaContainer').innerHTML = html;
}
