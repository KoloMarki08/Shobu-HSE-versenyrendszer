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

function betoltSulySablon(hatarSzoveg) {
    const inp = document.getElementById('sulyHatarInput');
    if (inp) {
        inp.value = hatarSzoveg;
        elonezetSulyBontas();
    }
}

// Segédfüggvény: Súlyhatárok (pl. "50, 60, 70, 80, 90") alapján sávok generálása
function szamolSulySavok(katId, hatarSzoveg, autoOsszevonas) {
    const eredeti = globalKategoriak.find(k => k.id === katId);
    if (!eredeti) return [];

    // Kinyerjük és növekvő sorrendbe rendezzük a súlyhatárokat (pl. [50, 60, 70, 80, 90])
    const hatarok = hatarSzoveg.split(/[ ,;]+/)
        .map(x => parseFloat(x.replace('-', '').replace('+', '')))
        .filter(x => !isNaN(x) && x > 0)
        .sort((a, b) => a - b);

    const egyediHatarok = [...new Set(hatarok)];
    if (egyediHatarok.length === 0) return [];

    // Létrehozzuk a sávokat: -50kg, -60kg, ..., +90kg
    let savok = [];
    for (let i = 0; i < egyediHatarok.length; i++) {
        let minSuly = (i === 0) ? 0 : egyediHatarok[i - 1];
        let maxSuly = egyediHatarok[i];
        savok.push({
            cimke: `-${maxSuly} kg`,
            min: minSuly,
            max: maxSuly,
            nevezesek: [],
            eredetiEgyedulVolt: null
        });
    }
    // Utolsó nyitott (+X kg) sáv
    let utolsoHatar = egyediHatarok[egyediHatarok.length - 1];
    savok.push({
        cimke: `+${utolsoHatar} kg`,
        min: utolsoHatar,
        max: 999,
        nevezesek: [],
        eredetiEgyedulVolt: null
    });

    // Besoroljuk a kategóriába nevezett versenyzőket a súlyuk alapján
    const katNevezesek = globalNevezesek.filter(n => n.categoryId === katId);
    for (let nev of katNevezesek) {
        const v = globalVersenyzok.find(x => x.id === nev.competitorId);
        if (!v) continue;

        let celSav = savok.find(s => v.weight > s.min && v.weight <= s.max) || savok[0];
        celSav.nevezesek.push({ reg: nev, versenyzo: v });
    }

    // Megjelöljük, ha valaki eredetileg EGYEDÜL (1 fő) van a súlycsoportjában!
    for (let s of savok) {
        if (s.nevezesek.length === 1) {
            s.eredetiEgyedulVolt = s.nevezesek[0].versenyzo;
        }
    }

    // Ha be van pipálva az automatikus összevonás, az 1 fős súlycsoportot áttoljuk a következő (nehezebb) nem-üres sávba
    if (autoOsszevonas) {
        for (let i = 0; i < savok.length; i++) {
            if (savok[i].nevezesek.length === 1) {
                // Keresünk egy eggyel feljebb lévő sávot (vagy ha a legnehezebb sávban van egyedül, akkor eggyel lejjebb)
                let celIdx = -1;
                for (let j = i + 1; j < savok.length; j++) {
                    if (savok[j].nevezesek.length > 0) { celIdx = j; break; }
                }
                if (celIdx === -1) {
                    for (let j = i - 1; j >= 0; j--) {
                        if (savok[j].nevezesek.length > 0) { celIdx = j; break; }
                    }
                }
                if (celIdx !== -1) {
                    const athelyezett = savok[i].nevezesek.pop();
                    athelyezett.feljebbSorolvaHonnan = savok[i].cimke;
                    savok[celIdx].nevezesek.push(athelyezett);
                }
            }
        }
    }

    return savok;
}

// Élő vizuális előnézet (jelzi, ki hol van, és pirossal kiemeli, ki lenne egyedül!)
function elonezetSulyBontas() {
    const cont = document.getElementById('sulyBontasElonezetContainer');
    const katId = parseInt(document.getElementById('bontandoKategoriaSelect')?.value);
    const hatarSzoveg = document.getElementById('sulyHatarInput')?.value || '';
    const autoOsszevonas = document.getElementById('autoOsszevonasCheckbox')?.checked;

    if (!cont) return;
    if (!katId || !hatarSzoveg.trim()) {
        cont.innerHTML = '';
        return;
    }

    const eredeti = globalKategoriak.find(k => k.id === katId);
    const savok = szamolSulySavok(katId, hatarSzoveg, autoOsszevonas);
    const aktivSavok = savok.filter(s => s.nevezesek.length > 0 || s.eredetiEgyedulVolt);

    if (aktivSavok.length === 0) {
        cont.innerHTML = `<div style="color:#dc2626;font-weight:700;padding:8px;">⚠️ Ebben a kategóriában jelenleg nincs benevezett versenyző!</div>`;
        return;
    }

    let html = `<div style="background:white;border:1px solid #cbd5e1;border-radius:8px;padding:12px;">
        <div style="font-weight:800;margin-bottom:8px;color:#0f172a;">📊 Súlybontási Előnézet: ${eredeti ? eredeti.name : ''}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">`;

    for (let s of aktivSavok) {
        const db = s.nevezesek.length;
        const egyedulMaradtMost = (db === 1);
        const voltEgyedulDeOsszevonva = (db === 0 && s.eredetiEgyedulVolt);

        let keretSzin = '#10b981'; // Zöld (2+ fő)
        let hatterSzin = '#f0fdf4';
        let statuszBadge = `<span style="background:#10b981;color:white;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:800;">✔ ${db} fő (Indítható)</span>`;

        if (egyedulMaradtMost) {
            keretSzin = '#e62e2d'; // Piros figyelmeztetés: EGYEDÜL VAN!
            hatterSzin = '#fef2f2';
            statuszBadge = `<span style="background:#e62e2d;color:white;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:800;">⚠️ EGYEDÜL VAN (1 fő)!</span>`;
        } else if (voltEgyedulDeOsszevonva) {
            keretSzin = '#f59e0b';
            hatterSzin = '#fffbeb';
            statuszBadge = `<span style="background:#f59e0b;color:#111;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:800;">↪ Átsorolva (1 fő volt)</span>`;
        }

        const nevekLista = s.nevezesek.map(x => {
            const extraJel = x.feljebbSorolvaHonnan
                ? ` <span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-size:0.72rem;font-weight:800;">[⚠️ ${x.feljebbSorolvaHonnan}-ban egyedül lett volna!]</span>`
                : '';
            return `<div>• <strong>${x.versenyzo.name}</strong> (${x.versenyzo.weight} kg, ${x.versenyzo.club})${extraJel}</div>`;
        }).join('');

        html += `<div style="border:2px solid ${keretSzin};background:${hatterSzin};border-radius:8px;padding:10px;font-size:0.84rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong style="font-size:0.95rem;">⚖️ ${s.cimke}</strong>
                ${statuszBadge}
            </div>
            ${voltEgyedulDeOsszevonva ? `<div style="color:#92400e;"><em>${s.eredetiEgyedulVolt.name} (${s.eredetiEgyedulVolt.weight} kg) egyedül lett volna itt, ezért átsorolva a szomszédos súlycsoportba!</em></div>` : nevekLista}
        </div>`;
    }

    html += `</div></div>`;
    cont.innerHTML = html;
}

async function sulycsoportBontas() {
    const katId = parseInt(document.getElementById('bontandoKategoriaSelect').value);
    const hatarSzoveg = document.getElementById('sulyHatarInput').value;
    const autoOsszevonas = document.getElementById('autoOsszevonasCheckbox')?.checked;

    if (!katId || !hatarSzoveg.trim()) {
        TatamiMaster.toast("⚠️ Válassz kategóriát és add meg a súlyhatárokat (pl. 50, 60, 70, 80, 90)!", "figyelem");
        return;
    }

    const eredeti = globalKategoriak.find(k => k.id === katId);
    const savok = szamolSulySavok(katId, hatarSzoveg, autoOsszevonas).filter(s => s.nevezesek.length > 0);

    if (!eredeti || savok.length === 0) {
        TatamiMaster.toast("⚠️ Ebben a kategóriában nincs benevezett versenyző!", "figyelem");
        return;
    }

    // Ellenőrizzük, maradt-e 1 fős súlycsoport (ha a felhasználó kikapcsolta az automatikus összevonást)
    const egyedulMaradok = savok.filter(s => s.nevezesek.length === 1);
    if (egyedulMaradok.length > 0) {
        const nevek = egyedulMaradok.map(s => `${s.nevezesek[0].versenyzo.name} (${s.nevezesek[0].versenyzo.weight}kg -> ${s.cimke})`).join('\n');
        if (!confirm(`⚠️ FIGYELEM! Az alábbi versenyző(k) EGYEDÜL (ellenfél nélkül) maradnának a súlycsoportjukban:\n\n${nevek}\n\nBiztosan külön kategóriába hagyod őket? (Tipp: ha bepipálod az "Egyedül maradók automatikus feljebb léptetése" opciót, a gép összevonja őket!)`)) {
            return;
        }
    }

    let letrejottDb = 0;
    // Tisza alapnév (levágjuk a végéről a régi "Open" vagy "-XXkg" feliratot, ha volt)
    const alapKatNev = eredeti.name.replace(/\s+Open$/i, '').trim();

    for (let s of savok) {
        const ujKatRes = await TatamiMaster.apiSend('Categories', 'POST', {
            name: `${alapKatNev} ${s.cimke}`,
            matchType: eredeti.matchType,
            gender: eredeti.gender,
            minAge: eredeti.minAge,
            maxAge: eredeti.maxAge
        });

        if (ujKatRes.ok) {
            const ujKat = await ujKatRes.json();
            letrejottDb++;
            for (let item of s.nevezesek) {
                await TatamiMaster.apiSend('Registrations', 'POST', {
                    competitorId: item.versenyzo.id,
                    categoryId: ujKat.id
                });
                await TatamiMaster.apiSend('Registrations/' + item.reg.id, 'DELETE');
            }
        }
    }

    TatamiMaster.toast(`✔ Súlybontás kész! ${letrejottDb} db súlycsoport jött létre!`);
    document.getElementById('sulyBontasElonezetContainer').innerHTML = '';
    await mindenAdatFrissitese();
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
    await automatikusTatamiMenetrendRendezes(tatamiId, true);
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

// ============================================================================
// VERSENYNAPI TATAMI-MENETREND ÉS PIHENŐIDŐS ROTÁCIÓS MOTOR
// ============================================================================

// Segédfüggvény: Női kategória-e? (Lányok / Hölgyek prioritást kapnak azonos korosztályban!)
function isNoiKategoria(kat) {
    if (!kat) return false;
    const g = (kat.gender || '').toLowerCase();
    const n = (kat.name || '').toLowerCase();
    return g.includes('girl') || g.includes('women') || g.includes('nő') || g.includes('lány') ||
           n.includes('girl') || n.includes('women') || n.includes('női') || n.includes('lány');
}

// Kategóriák összehasonlítása: 1. Legfiatalabb korosztály (MinAge), 2. Lányok/Hölgyek -> Fiúk/Férfiak
function kategoriaSorrendHasonlito(katA, katB) {
    if (!katA || !katB) return 0;
    const korA = katA.minAge ?? 0;
    const korB = katB.minAge ?? 0;
    if (korA !== korB) return korA - korB;

    const noiA = isNoiKategoria(katA) ? 0 : 1;
    const noiB = isNoiKategoria(katB) ? 0 : 1;
    if (noiA !== noiB) return noiA - noiB;

    return (katA.id || 0) - (katB.id || 0);
}

// Egy Kumite kategória meccseinek szétbontása "Pihenőidős Fordulókra" (hogy senki ne küzdjön 2x egymás után!)
function bontKumiteMeccsekFordulokra(katMeccsek) {
    let rendezett = [...katMeccsek].sort((a, b) => a.id - b.id);
    let n = rendezett.length;

    // A) Egyenes kieséses ágrajz (3, 7, 15, 31 meccs)
    if (n === 3 || n === 7 || n === 15 || n === 31) {
        let fordulok = [];
        let korMeret = (n + 1) / 2;
        let idx = 0;
        while (korMeret >= 1) {
            fordulok.push(rendezett.slice(idx, idx + korMeret));
            idx += korMeret;
            korMeret /= 2;
        }
        return fordulok;
    }

    // B) Körmérkőzés (Round Robin) vagy egyedi meccslista:
    // Mohó (Greedy) csomagolás fordulókba úgy, hogy egy fordulón belül egyetlen versenyző se szerepeljen kétszer!
    let maradek = [...rendezett];
    let korok = [];

    while (maradek.length > 0) {
        let aktualisKor = [];
        let foglaltVersenyzok = new Set();

        for (let i = 0; i < maradek.length; i++) {
            let m = maradek[i];
            let v1 = m.competitor1Id;
            let v2 = m.competitor2Id;

            let v1Foglalt = (v1 && foglaltVersenyzok.has(v1));
            let v2Foglalt = (v2 && foglaltVersenyzok.has(v2));

            if (!v1Foglalt && !v2Foglalt) {
                aktualisKor.push(m);
                if (v1) foglaltVersenyzok.add(v1);
                if (v2) foglaltVersenyzok.add(v2);
                maradek.splice(i, 1);
                i--;
            }
        }
        korok.push(aktualisKor);
    }

    return korok;
}

// FŐ RENDEZŐ MOTOR: Tataminként felépíti a profi versenynapi menetrendet!
async function automatikusTatamiMenetrendRendezes(celTatamiId = null, csendes = false) {
    // Frissítjük a meccslistát a szerverről
    const frissMeccsek = await TatamiMaster.apiGet('Matches');
    if (!Array.isArray(frissMeccsek) || frissMeccsek.length === 0) {
        if (!csendes) TatamiMaster.toast("ℹ️ Nincs kisorsolt mérkőzés, amit rendezni lehetne!", "figyelem");
        return;
    }

    const erintettTatamik = celTatamiId
        ? globalTatamik.filter(t => t.id === celTatamiId)
        : globalTatamik;

    let frissitesiIgeretek = [];

    for (let tat of erintettTatamik) {
        const tatamiMeccsek = frissMeccsek.filter(m => m.tatamiId === tat.id);
        if (tatamiMeccsek.length === 0) continue;

        // Kigyűjtjük az ezen a tatamin szereplő kategóriákat
        const katIdk = [...new Set(tatamiMeccsek.map(m => m.categoryId))];
        const tatamiKategoriak = katIdk
            .map(id => globalKategoriak.find(k => k.id === id))
            .filter(Boolean)
            .sort(kategoriaSorrendHasonlito);

        const kataKategoriak = tatamiKategoriak.filter(k => k.matchType && k.matchType.toUpperCase() === 'KATA');
        const kumiteKategoriak = tatamiKategoriak.filter(k => !k.matchType || k.matchType.toUpperCase() !== 'KATA');

        let vegsoTatamiSorrend = [];

        // --------------------------------------------------------------------
        // 1. BLOKK: KATA (Korosztály növekvő, azon belül Lányok/Hölgyek -> Fiúk/Férfiak)
        // --------------------------------------------------------------------
        for (let kKat of kataKategoriak) {
            let kMeccsek = tatamiMeccsek
                .filter(m => m.categoryId === kKat.id)
                .sort((a, b) => a.id - b.id);
            vegsoTatamiSorrend.push(...kMeccsek);
        }

        // --------------------------------------------------------------------
        // 2. BLOKK: KUMITE ROTÁCIÓ (Fordulónként összefésülve, szünetekkel)
        // + A Felnőtt (18+) döntőket félretesszük a legvégére (Gála Finálé)!
        // --------------------------------------------------------------------
        let kategoriaForduloMap = [];
        let felnottDontok = [];

        for (let kumKat of kumiteKategoriak) {
            let mLista = tatamiMeccsek.filter(m => m.categoryId === kumKat.id);
            let fordulok = bontKumiteMeccsekFordulokra(mLista);
            let isFelnott = ((kumKat.minAge ?? 0) >= 18);

            // Ha felnőtt (18+) kategória és több fordulós, az utolsó fordulót (Döntőt) a legvégére tesszük!
            if (isFelnott && fordulok.length > 1) {
                let utolsoFordulo = fordulok.pop();
                felnottDontok.push(...utolsoFordulo);
            }

            kategoriaForduloMap.push({
                kategoria: kumKat,
                fordulok: fordulok
            });
        }

        // Körönként (Hullámonként) végigmegyünk a kategóriákon (Legfiatalabb Lányok -> Fiúk -> ...)
        let maxForduloSzam = Math.max(0, ...kategoriaForduloMap.map(x => x.fordulok.length));
        for (let korIdx = 0; korIdx < maxForduloSzam; korIdx++) {
            for (let elem of kategoriaForduloMap) {
                if (elem.fordulok[korIdx]) {
                    vegsoTatamiSorrend.push(...elem.fordulok[korIdx]);
                }
            }
        }

        // --------------------------------------------------------------------
        // 3. BLOKK: FELNŐTT (18+) DÖNTŐK A TATAMI MENETREND LEGSVÉGÉN!
        // --------------------------------------------------------------------
        vegsoTatamiSorrend.push(...felnottDontok);

        // Sorszámok (matchOrder = 1, 2, 3...) kiosztása és mentése a C# Backendbe
        for (let i = 0; i < vegsoTatamiSorrend.length; i++) {
            let meccs = vegsoTatamiSorrend[i];
            let ujSorszam = i + 1;
            if (meccs.matchOrder !== ujSorszam) {
                meccs.matchOrder = ujSorszam;
                frissitesiIgeretek.push(TatamiMaster.apiSend('Matches/' + meccs.id, 'PUT', meccs));
            }
        }
    }

    if (frissitesiIgeretek.length > 0) {
        await Promise.all(frissitesiIgeretek);
    }

    if (!csendes) {
        TatamiMaster.toast("🔄 Tatami menetrend optimalizálva! (Kata Lányok➔Fiúk, Kumite pihenős rotáció + Felnőtt döntők a végén!)");
    }
    await mindenAdatFrissitese();
}

// ============================================================================
// EGYKATTINTÁSOS TELJES VERSENY SORSOLÁS AZ SQL BEOSZTÁS ALAPJÁN (A, B, C TATAMI)
// ============================================================================
async function osszesKategoriaAutomatikusSorsolasa() {
    if (globalTatamik.length === 0 || globalKategoriak.length === 0) {
        TatamiMaster.toast("⚠️ Először töltsd be a tesztadatokat!", "figyelem");
        return;
    }

    if (!confirm("⚡ AUTOMATIKUS TELJES SORSOLÁS & MENETREND:\n\nKisorsoljuk az összes kategóriát a Tatami A, B, C pástokra (korosztályos elosztásban), és felépítsük a pihenőidős, rotációs menetrendet?")) {
        return;
    }

    // 1. Töröljük a korábbi meccseket
    for (let m of globalMerkozesek) {
        await TatamiMaster.apiSend('Matches/' + m.id, 'DELETE');
    }

    const tatA = globalTatamik[0];
    const tatB = globalTatamik[1] || tatA;
    const tatC = globalTatamik[2] || tatB;

    // 2. Kategóriák tatamira osztása pontosan a JO_shobu_system_adatbazis.sql (kategoria_tatami) szerint:
    // - 8-11 évesek (és 12-13 Kata) -> Tatami A
    // - 16-34 évesek -> Tatami B
    // - 12-15 éves Kumite (és 14-15 Kata) + 35+ Veteránok -> Tatami C
    let sorszamMap = { [tatA.id]: 1, [tatB.id]: 1, [tatC.id]: 1 };

    // Előre sorbarendezzük a kategóriákat (MinAge + Lányok -> Fiúk)
    const rendezettKat = [...globalKategoriak].sort(kategoriaSorrendHasonlito);

    for (let kat of rendezettKat) {
        const isKata = (kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        let indulok = globalNevezesek
            .filter(n => n.categoryId === kat.id)
            .map(n => globalVersenyzok.find(v => v.id === n.competitorId))
            .filter(Boolean);

        if (indulok.length === 0 || (!isKata && indulok.length < 2)) continue;

        // Tatami kiválasztása korosztály szerint
        let celTatami = tatA;
        const minAge = kat.minAge ?? 0;
        if (minAge <= 11 || (isKata && minAge <= 13)) {
            celTatami = tatA;
        } else if (minAge >= 16 && minAge <= 34) {
            celTatami = tatB;
        } else {
            celTatami = tatC;
        }

        let tId = celTatami.id;
        let kevert = [...indulok].sort(() => Math.random() - 0.5);
        let generalt = [];

        if (isKata) {
            for (let v of kevert) {
                generalt.push({ categoryId: kat.id, tatamiId: tId, competitor1Id: v.id, competitor2Id: null, matchOrder: sorszamMap[tId]++, isFinished: false, winnerId: null });
            }
        } else if (kevert.length <= 3) {
            // 3 főnél automatikusan Körmérkőzés!
            for (let i = 0; i < kevert.length; i++) {
                for (let j = i + 1; j < kevert.length; j++) {
                    generalt.push({ categoryId: kat.id, tatamiId: tId, competitor1Id: kevert[i].id, competitor2Id: kevert[j].id, matchOrder: sorszamMap[tId]++, isFinished: false, winnerId: null });
                }
            }
        } else {
            // 4+ főnél Egyenes kieséses ágrajz klub-szétválasztással
            let agrajzMeret = 2;
            while (agrajzMeret < kevert.length) agrajzMeret *= 2;
            let eronyerokSzama = agrajzMeret - kevert.length;
            let kuzdok = [...kevert];
            let elsoKor = [];

            let valodiDb = (kevert.length - eronyerokSzama) / 2;
            for (let i = 0; i < valodiDb; i++) {
                let aka = kuzdok.shift();
                let shiroIdx = kuzdok.findIndex(v => v.club !== aka.club);
                if (shiroIdx === -1) shiroIdx = 0;
                let shiro = kuzdok.splice(shiroIdx, 1)[0];
                elsoKor.push({ categoryId: kat.id, tatamiId: tId, competitor1Id: aka.id, competitor2Id: shiro.id, matchOrder: sorszamMap[tId]++, isFinished: false, winnerId: null });
            }
            while (kuzdok.length > 0) {
                let v = kuzdok.shift();
                elsoKor.push({ categoryId: kat.id, tatamiId: tId, competitor1Id: v.id, competitor2Id: null, matchOrder: sorszamMap[tId]++, isFinished: true, winnerId: v.id });
            }
            generalt.push(...elsoKor);
            let elozoKor = elsoKor;
            let korMeret = agrajzMeret / 4;
            while (korMeret >= 1) {
                let ujKor = [];
                for (let i = 0; i < korMeret; i++) {
                    let m1 = elozoKor[i * 2], m2 = elozoKor[i * 2 + 1];
                    ujKor.push({
                        categoryId: kat.id, tatamiId: tId,
                        competitor1Id: (m1 && m1.isFinished) ? m1.winnerId : null,
                        competitor2Id: (m2 && m2.isFinished) ? m2.winnerId : null,
                        matchOrder: sorszamMap[tId]++, isFinished: false, winnerId: null
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
    }

    // 3. Miután minden meccs létrejött, lefuttatjuk a pihenőidős, rotációs menetrend-optimalizálót!
    await automatikusTatamiMenetrendRendezes(null, true);
    TatamiMaster.toast("🏆 Teljes sorsolás és pihenőidős tatami-menetrend elkészült!");
}