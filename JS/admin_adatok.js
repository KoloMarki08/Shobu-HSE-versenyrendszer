let globalVersenyek = [];
let globalVersenyzok = [];
let globalKategoriak = [];
let globalNevezesek = [];
let globalTatamik = [];
let globalMerkozesek = [];
let draggedMatchId = null;

window.onload = function() {
    const datumInput = document.getElementById('adminUjVersenyDatum');
    if (datumInput && !datumInput.value) {
        datumInput.value = new Date().toISOString().split('T')[0];
    }
    mindenAdatFrissitese();
};

function toggleNevezesZarolas() {
    const jelenlegLezarva = TatamiMaster.isNevezesLezarva();
    if (!jelenlegLezarva) {
        if (!confirm("NEVEZÉS LEZÁRÁSA:\n\nBiztosan lezárod a nevezést? A lezárás után sem az edzők, sem az admin felületen nem lehet új versenyzőt vagy új nevezést rögzíteni (amíg újra meg nem nyitod).")) {
            return;
        }
        TatamiMaster.setNevezesLezarva(true);
        TatamiMaster.toast("A nevezés sikeresen LEZÁRVA! Új nevezések fogadása leállítva.");
    } else {
        TatamiMaster.setNevezesLezarva(false);
        TatamiMaster.toast("A nevezés újra MEGNYITVA! Új versenyzők és nevezések ismét rögzíthetők.");
    }
    frissitNevezesZarolasUI();
}

function frissitNevezesZarolasUI() {
    const lezarva = TatamiMaster.isNevezesLezarva();
    const headerBtn = document.getElementById('btnNevezesZarolasHeader');
    if (headerBtn) {
        if (lezarva) {
            headerBtn.className = 'btn btn-danger';
            headerBtn.innerHTML = `${TatamiMaster.icon('unlock', 16)} Nevezés Megnyitása (LEZÁRVA)`;
        } else {
            headerBtn.className = 'btn btn-outline';
            headerBtn.innerHTML = `${TatamiMaster.icon('lock', 16)} Nevezés Lezárása (NYITVA)`;
        }
    }

    document.querySelectorAll('.nevezes-zarolas-bar').forEach(bar => {
        bar.style.borderColor = lezarva ? '#991B1B' : '#E4E0D7';
        bar.style.background = lezarva ? '#FAF5F5' : '#FAF8F5';
    });

    document.querySelectorAll('.nevezes-zarolas-status').forEach(st => {
        if (lezarva) {
            st.innerHTML = `
                <span style="background:#991B1B;color:#FAF8F5;padding:4px 10px;border-radius:6px;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:5px;">
                    ${TatamiMaster.icon('lock', 14)} NEVEZÉS LEZÁRVA
                </span>
                <span style="color:#991B1B;font-weight:600;">Új versenyzők és nevezések leadása jelenleg zárolva van (edzői és admin felületen is).</span>
            `;
        } else {
            st.innerHTML = `
                <span style="background:#18181B;color:#FAF8F5;padding:4px 10px;border-radius:6px;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:5px;">
                    ${TatamiMaster.icon('unlock', 14)} NEVEZÉS NYITVA
                </span>
                <span style="color:#52525B;">Az edzők és az adminisztrátor szabadon adhatnak le új egyéni és csapat nevezéseket.</span>
            `;
        }
    });

    document.querySelectorAll('.nevezes-zarolas-btn').forEach(btn => {
        if (lezarva) {
            btn.className = 'btn btn-outline-green nevezes-zarolas-btn';
            btn.innerHTML = `${TatamiMaster.icon('unlock', 15)} Nevezés Újranyitása`;
        } else {
            btn.className = 'btn btn-danger nevezes-zarolas-btn';
            btn.innerHTML = `${TatamiMaster.icon('lock', 15)} Nevezés Lezárása Most`;
        }
    });

    ['adminVersenyzoNevezesForm', 'adminUtolagosNevezesForm'].forEach(formId => {
        const formEl = document.getElementById(formId);
        if (formEl) {
            formEl.style.opacity = lezarva ? '0.82' : '1';
            formEl.style.pointerEvents = lezarva ? 'none' : 'auto';
            formEl.querySelectorAll('input, select, button').forEach(el => {
                el.disabled = lezarva;
            });
        }
    });
}

let osszesVersenyStatCache = { competitors: [], categories: [], matches: [] };

async function mindenAdatFrissitese() {
    try {
        // 1. Először a versenyek listáját kérjük le, hogy az aktív verseny ID biztosan érvényes legyen
        const vers = await TatamiMaster.apiGet('Tournaments');
        globalVersenyek = Array.isArray(vers) ? vers : [];

        // 2. Lekérjük az aktuálisan kiválasztott (szerkesztés alatt álló) versenyhez tartozó adatokat,
        // valamint a globális összesítést a Versenyek táblázat statisztikai oszlopához
        const [v, k, n, t, m, allV, allK, allM] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches'),
            TatamiMaster.apiGet('Competitors', { mindenVerseny: true }),
            TatamiMaster.apiGet('Categories', { mindenVerseny: true }),
            TatamiMaster.apiGet('Matches', { mindenVerseny: true })
        ]);

        globalVersenyzok = Array.isArray(v) ? v : [];
        globalKategoriak = Array.isArray(k) ? k : [];
        globalNevezesek  = Array.isArray(n) ? n : [];
        globalTatamik    = Array.isArray(t) ? t : [];
        globalMerkozesek = Array.isArray(m) ? m.sort((a, b) => a.matchOrder - b.matchOrder) : [];

        // Automatikus öngyógyító takarítás: ha egy korábbi súlybontás után bent maradt az üres (0 fős) alap kategória
        // vagy duplikált súlycsoport keletkezett, automatikusan letisztítjuk
        const tisztitott = await tisztitFelbontottEsDuplikaltKategoriakat();
        if (tisztitott) {
            const [frissK, frissN, frissAllK] = await Promise.all([
                TatamiMaster.apiGet('Categories'),
                TatamiMaster.apiGet('Registrations'),
                TatamiMaster.apiGet('Categories', { mindenVerseny: true })
            ]);
            globalKategoriak = Array.isArray(frissK) ? frissK : [];
            globalNevezesek  = Array.isArray(frissN) ? frissN : [];
            osszesVersenyStatCache = {
                competitors: Array.isArray(allV) ? allV : [],
                categories: Array.isArray(frissAllK) ? frissAllK : [],
                matches: Array.isArray(allM) ? allM : []
            };
        } else {
            osszesVersenyStatCache = {
                competitors: Array.isArray(allV) ? allV : [],
                categories: Array.isArray(allK) ? allK : [],
                matches: Array.isArray(allM) ? allM : []
            };
        }

        frissitAdminAktivVersenyBar();
        frissitAdminKpiEsCheckboxok();
        versenyekAdminBetoltese();
        versenyzokBetoltese();
        kategoriakBetoltese();
        nevezesekBetoltese();
        tatamikBetoltese();
        merkozesekBetoltese();
        rajzolAgrajz();
        frissitNevezesZarolasUI();
    } catch (e) {
        console.error("Hiba az admin adatok betöltésekor:", e);
    }
}

function frissitAdminAktivVersenyBar() {
    const sel = document.getElementById('adminAktivVersenySelect');
    const meta = document.getElementById('adminAktivVersenyMeta');
    const eloLink = document.getElementById('adminAktivVersenyEloLink');
    const aktId = TatamiMaster.lekerAktualisVersenyId();
    const autoVerseny = TatamiMaster.keresLegaktualisabbVerseny(globalVersenyek);
    const autoId = autoVerseny ? autoVerseny.id : aktId;

    if (sel) {
        if (globalVersenyek.length === 0) {
            sel.innerHTML = `<option value="1">Nincs még létrehozott verseny</option>`;
        } else {
            sel.innerHTML = globalVersenyek.map(v => {
                const datum = v.date ? new Date(v.date).toLocaleDateString('hu-HU') : '';
                const autoJel = (v.id === autoId) ? ' [AKTUÁLIS]' : '';
                return `<option value="${v.id}" ${v.id === aktId ? 'selected' : ''}>#${v.id} – ${TatamiMaster.escapeHtml(v.name)} (${datum})${autoJel}</option>`;
            }).join('');
        }
    }

    const aktVerseny = globalVersenyek.find(v => v.id === aktId) || globalVersenyek[0];
    if (aktVerseny && meta) {
        const datumSzoveg = aktVerseny.date ? new Date(aktVerseny.date).toLocaleDateString('hu-HU') : '-';
        const statuszSzoveg = TatamiMaster.escapeHtml(aktVerseny.status || 'ÉLŐ / NYITVA');
        const szervezoSzoveg = TatamiMaster.escapeHtml(aktVerseny.organizer || 'Shobu HSE');
        const lezarva = TatamiMaster.isNevezesLezarva(aktVerseny.id);
        const isAutoAktualis = (aktVerseny.id === autoId);

        const autoStatusHtml = isAutoAktualis
            ? `<span style="background:#18181B;color:#FAF8F5;padding:4px 9px;border-radius:6px;font-weight:700;font-size:0.75rem;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('check', 12)} AUTOMATIKUSAN AKTUÁLIS</span>`
            : `<button type="button" class="btn btn-outline-green" style="padding:4px 9px;font-size:0.76rem;" onclick="adminValtsAutomatikusVersenyre()">${TatamiMaster.icon('refresh', 12)} Vissza az aktuális versenyre</button>`;

        meta.innerHTML = `
            ${autoStatusHtml}
            <span style="background:#F3F0EA;border:1px solid #CFC9BC;color:#18181B;padding:4px 9px;border-radius:6px;font-weight:700;font-size:0.78rem;">
                ${statuszSzoveg}
            </span>
            <span>${TatamiMaster.icon('calendar', 14)} <strong>${datumSzoveg}</strong></span>
            <span>&bull; ${TatamiMaster.icon('user', 14)} Szervező: <strong>${szervezoSzoveg}</strong></span>
            <span style="color:${lezarva ? '#991B1B' : '#18181B'};font-weight:700;">
                &bull; ${lezarva ? `${TatamiMaster.icon('lock', 13)} Nevezés lezárva` : `${TatamiMaster.icon('unlock', 13)} Nevezés nyitva`}
            </span>
        `;
    }

    if (eloLink) {
        eloLink.href = `audience.html?versenyId=${aktId}`;
    }
}

async function adminValtsAktivVersenyt(versenyId) {
    const numId = parseInt(versenyId);
    if (!numId) return;
    const celVerseny = globalVersenyek.find(v => v.id === numId);
    const nev = celVerseny ? celVerseny.name : ('Verseny #' + numId);

    TatamiMaster.mentAktualisVerseny(numId, nev, true);
    TatamiMaster.toast(`Átváltva a(z) „${nev}” verseny kezelésére! Minden adat és művelet erre a versenyre vonatkozik.`);
    await mindenAdatFrissitese();
}

async function adminValtsAutomatikusVersenyre() {
    const autoV = TatamiMaster.valasztdAutoAktualisVersenyt(globalVersenyek);
    if (autoV) {
        TatamiMaster.toast(`Automatikusan kiválasztva az éppen aktuális verseny: „${autoV.name}”`);
    }
    await mindenAdatFrissitese();
}

function ugorjVersenyekFulre() {
    const btn = document.querySelector(`.admin-tabs .tab-btn[onclick*="tab-versenyek"]`);
    if (btn) {
        btn.click();
    } else if (typeof openTab === 'function') {
        openTab({ currentTarget: document.querySelector('.admin-tabs .tab-btn') }, 'tab-versenyek');
    }
    setTimeout(() => {
        const inp = document.getElementById('adminUjVersenyNev');
        if (inp) inp.focus();
    }, 80);
}

// =========================================================
// 0. FÜL: VERSENYEK LÉTREHOZÁSA, PLAKÁT ÉS VERSENYKIÍRÁS
// =========================================================
function fajlBase64KonvertalasAdmin(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function szamolAdottVersenyStat(versenyId) {
    const map = TatamiMaster.lekerVersenyAdatMap();
    const alapId = map.alapVersenyId || 1;

    const vDb = osszesVersenyStatCache.competitors.filter(c =>
        TatamiMaster.lekerEntitasVersenyId('Competitors', c.id, alapId) === versenyId
    ).length;

    const kDb = osszesVersenyStatCache.categories.filter(cat =>
        TatamiMaster.lekerEntitasVersenyId('Categories', cat.id, alapId) === versenyId
    ).length;

    const mDb = osszesVersenyStatCache.matches.filter(m => {
        if (map.Matches && map.Matches[String(m.id)] !== undefined) {
            return parseInt(map.Matches[String(m.id)]) === versenyId;
        }
        return TatamiMaster.lekerEntitasVersenyId('Categories', m.categoryId, alapId) === versenyId;
    }).length;

    return { vDb, kDb, mDb };
}

function versenyekAdminBetoltese() {
    const tbody = document.getElementById('adminVersenyekTbody');
    if (!tbody) return;

    const mellekletek = TatamiMaster.lekerVersenyMellekletek();
    const aktVersenyId = TatamiMaster.lekerAktualisVersenyId();

    if (globalVersenyek.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#71717A;padding:20px;">Még nincs meghirdetett verseny az adatbázisban. Hozz létre egyet a fenti űrlappal!</td></tr>`;
        return;
    }

    let html = '';
    for (let v of globalVersenyek) {
        const isAktiv = (v.id === aktVersenyId);
        const datumSzoveg = v.date ? new Date(v.date).toLocaleDateString('hu-HU') : '-';
        const statuszSzoveg = TatamiMaster.escapeHtml(v.status || 'ÉLŐ / NYITVA');
        const isLezart = statuszSzoveg.toUpperCase().includes('LEZÁR');
        const extra = mellekletek[v.name] || {};
        const safeNameAttr = (v.name || '').replace(/'/g, "");
        const stat = szamolAdottVersenyStat(v.id);

        const plakatGomb = extra.plakat
            ? `<button class="btn btn-outline" style="padding:4px 9px;font-size:0.78rem;" onclick="mutatAdminPlakatNagyban('${safeNameAttr}')">${TatamiMaster.icon('image', 13)} Plakát</button>`
            : `<span style="color:#A1A1AA;font-size:0.8rem;">Nincs plakát</span>`;

        const kiirasGomb = extra.kiiras
            ? `<a href="${extra.kiiras}" download="${extra.kiirasNev || 'Versenykiiras.pdf'}" class="btn btn-outline" style="padding:4px 9px;font-size:0.78rem;">${TatamiMaster.icon('file', 13)} Kiírás letöltése</a>`
            : `<span style="color:#A1A1AA;font-size:0.8rem;">Nincs kiírás</span>`;

        const aktivGombHtml = isAktiv
            ? `<span style="background:#18181B;color:#FAF8F5;padding:5px 10px;border-radius:6px;font-weight:800;font-size:0.76rem;display:inline-flex;align-items:center;gap:5px;">${TatamiMaster.icon('check', 13)} AKTÍV (SZERKESZTÉS ALATT)</span>`
            : `<button class="btn btn-outline-green" style="padding:5px 10px;font-size:0.8rem;" onclick="adminValtsAktivVersenyt(${v.id})">${TatamiMaster.icon('check', 14)} Kiválasztás & Kezelés</button>`;

        html += `<tr style="${isAktiv ? 'background:#FAF8F5;outline:1.5px solid #18181B;' : ''}">
            <td><strong>#${v.id}</strong></td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    ${extra.plakat ? `<img src="${extra.plakat}" alt="Plakát" onclick="mutatAdminPlakatNagyban('${safeNameAttr}')" style="width:36px;height:48px;object-fit:cover;border-radius:4px;border:1px solid #CFC9BC;cursor:pointer;">` : ''}
                    <div>
                        <strong>${TatamiMaster.escapeHtml(v.name || '-')}</strong>
                        ${isAktiv ? `<div style="font-size:0.74rem;color:#52525B;font-weight:700;">Jelenleg kiválasztva az Admin Központban</div>` : ''}
                    </div>
                </div>
            </td>
            <td>${TatamiMaster.escapeHtml(v.organizer || '-')}</td>
            <td>${TatamiMaster.icon('calendar', 14)} ${datumSzoveg}</td>
            <td>
                <span style="background:${isLezart ? '#991B1B' : '#18181B'};color:#FAF8F5;padding:3px 9px;border-radius:6px;font-weight:700;font-size:0.78rem;">
                    ${statuszSzoveg}
                </span>
            </td>
            <td>
                <span style="background:#F3F0EA;border:1px solid #CFC9BC;padding:4px 9px;border-radius:6px;font-size:0.8rem;font-weight:700;color:#18181B;display:inline-block;">
                    ${stat.vDb} versenyző &bull; ${stat.kDb} kat. &bull; ${stat.mDb} meccs
                </span>
            </td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                    ${plakatGomb}
                    ${kiirasGomb}
                </div>
            </td>
            <td style="white-space:nowrap;">
                <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                    ${aktivGombHtml}
                    <a href="audience.html?versenyId=${v.id}" target="_blank" class="btn btn-outline-blue" style="padding:5px 10px;font-size:0.8rem;" title="Adott verseny élő nézői és edzői oldalának megnyitása">
                        ${TatamiMaster.icon('eye', 14)} Élő oldal
                    </a>
                    <button class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztVersenyTeljes(${v.id})">${TatamiMaster.icon('edit', 14)} Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Tournaments', ${v.id})" title="Verseny törlése">${TatamiMaster.icon('trash', 14)} Törlés</button>
                </div>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

async function letrehozAlapTatamikEsKategoriakVersenyhez(versenyId) {
    const alapTatamik = ['Tatami A', 'Tatami B', 'Tatami C'];
    for (let tNev of alapTatamik) {
        await TatamiMaster.apiSend('Tatamis', 'POST', { name: tNev }, { versenyId: versenyId });
    }

    const alapKategoriak = [
        { name: 'Gyermek Fiú Kata (8-11 év)',            matchType: 'KATA',   gender: 'Férfi', minAge: 8,  maxAge: 11 },
        { name: 'Gyermek Lány Kata (8-11 év)',           matchType: 'KATA',   gender: 'Női',   minAge: 8,  maxAge: 11 },
        { name: 'Serdülő & Ifjúsági Kata (12-15 év)',    matchType: 'KATA',   gender: 'Vegyes',minAge: 12, maxAge: 15 },
        { name: 'Junior & Felnőtt Kata (16+ év)',        matchType: 'KATA',   gender: 'Vegyes',minAge: 16, maxAge: 99 },
        { name: 'Gyermek Fiú Kumite Open (8-11 év)',     matchType: 'KUMITE', gender: 'Férfi', minAge: 8,  maxAge: 11 },
        { name: 'Serdülő Fiú Kumite Open (12-13 év)',    matchType: 'KUMITE', gender: 'Férfi', minAge: 12, maxAge: 13 },
        { name: 'Junior Férfi Kumite Open (16-17 év)',   matchType: 'KUMITE', gender: 'Férfi', minAge: 16, maxAge: 17 },
        { name: 'Felnőtt Férfi Kumite Open (18+ év)',    matchType: 'KUMITE', gender: 'Férfi', minAge: 18, maxAge: 99 },
        { name: 'Felnőtt Női Kumite Open (18+ év)',      matchType: 'KUMITE', gender: 'Női',   minAge: 18, maxAge: 99 }
    ];

    for (let kat of alapKategoriak) {
        await TatamiMaster.apiSend('Categories', 'POST', kat, { versenyId: versenyId });
    }
}

async function hozzadVersenyAdminbol() {
    const nevInput = document.getElementById('adminUjVersenyNev');
    const szervezoInput = document.getElementById('adminUjVersenySzervezo');
    const datumInput = document.getElementById('adminUjVersenyDatum');
    const statuszInput = document.getElementById('adminUjVersenyStatusz');
    const plakatInput = document.getElementById('adminUjVersenyPlakatFile');
    const kiirasInput = document.getElementById('adminUjVersenyKiirasFile');
    const alapStrukturaCb = document.getElementById('adminUjVersenyAlapStruktura');
    const azonnaliValtasCb = document.getElementById('adminUjVersenyAzonnaliValtas');

    const nev = (nevInput?.value || '').trim();
    const szervezo = (szervezoInput?.value || '').trim() || 'Shobu HSE';
    const datum = datumInput?.value;
    const statusz = statuszInput?.value || 'ÉLŐ / NYITVA';

    if (!nev) {
        TatamiMaster.toast("Add meg az új verseny megnevezését!", "figyelem");
        return;
    }

    const plakatFile = plakatInput?.files?.[0];
    const kiirasFile = kiirasInput?.files?.[0];

    const [plakatB64, kiirasB64] = await Promise.all([
        fajlBase64KonvertalasAdmin(plakatFile),
        fajlBase64KonvertalasAdmin(kiirasFile)
    ]);

    if (plakatB64 || kiirasB64) {
        TatamiMaster.mentVersenyMelleklet(nev, plakatB64, kiirasB64, kiirasFile ? kiirasFile.name : 'Versenykiiras.pdf');
    }

    const res = await TatamiMaster.apiSend('Tournaments', 'POST', {
        name: nev,
        date: datum ? new Date(datum).toISOString() : new Date().toISOString(),
        status: statusz,
        organizer: szervezo
    });

    if (res.ok) {
        let letrejottVerseny = null;
        try {
            letrejottVerseny = await res.json();
        } catch (e) {}

        if (letrejottVerseny && letrejottVerseny.id) {
            if (!alapStrukturaCb || alapStrukturaCb.checked) {
                await letrehozAlapTatamikEsKategoriakVersenyhez(letrejottVerseny.id);
            }
            if (!azonnaliValtasCb || azonnaliValtasCb.checked) {
                TatamiMaster.mentAktualisVerseny(letrejottVerseny.id, letrejottVerseny.name || nev);
            }
        }

        if (nevInput) nevInput.value = '';
        if (szervezoInput) szervezoInput.value = '';
        if (plakatInput) plakatInput.value = '';
        if (kiirasInput) kiirasInput.value = '';
        TatamiMaster.toast(`„${nev}” verseny létrehozva` + ((!azonnaliValtasCb || azonnaliValtasCb.checked) ? ' és kiválasztva szerkesztésre!' : '!'));
        await mindenAdatFrissitese();
    }
}

async function szerkesztVersenyTeljes(id) {
    const v = globalVersenyek.find(x => x.id === id);
    if (!v) return;

    const ujNev = prompt("Verseny megnevezése:", v.name);
    if (ujNev === null) return;
    const ujSzervezo = prompt("Szervező egyesület / Főrendező:", v.organizer || "");
    if (ujSzervezo === null) return;
    const regiDatum = v.date ? new Date(v.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const ujDatum = prompt("Verseny dátuma (ÉÉÉÉ-HH-NN):", regiDatum);
    if (ujDatum === null) return;
    const ujStatusz = prompt("Verseny státusza (ÉLŐ / NYITVA, NEVEZÉS ALATT, LEZÁRULT):", v.status || "ÉLŐ / NYITVA");
    if (ujStatusz === null) return;

    v.name = ujNev.trim() || v.name;
    v.organizer = ujSzervezo.trim() || v.organizer;
    v.date = ujDatum ? new Date(ujDatum).toISOString() : v.date;
    v.status = ujStatusz.trim() || v.status;

    const res = await TatamiMaster.apiSend('Tournaments/' + id, 'PUT', v);
    if (res.ok) {
        TatamiMaster.toast(`"${v.name}" adatai frissítve!`);
        await mindenAdatFrissitese();
    }
}

function mutatAdminPlakatNagyban(versenyNev) {
    const extra = TatamiMaster.lekerVersenyMellekletek()[versenyNev];
    if (!extra || !extra.plakat) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.86);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
        <img src="${extra.plakat}" style="max-width:90%;max-height:82vh;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,0.8);">
        <button class="btn btn-outline" style="margin-top:15px;padding:10px 24px;" onclick="this.parentElement.remove()">${TatamiMaster.icon('x', 16)} Bezárás</button>
    `;
    document.body.appendChild(modal);
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

    // Lépésről lépésre útmutató kártyák élő számlálóinak frissítése
    const stVers = document.getElementById('stepStatVersenyek');
    const stVerszok = document.getElementById('stepStatVersenyzok');
    const stKat = document.getElementById('stepStatKategoriak');
    const stNev = document.getElementById('stepStatNevezesek');
    const stMeccs = document.getElementById('stepStatMeccsek');
    const stAgrajz = document.getElementById('stepStatAgrajz');

    if (stVers) stVers.innerText = `${globalVersenyek.length} verseny`;
    if (stVerszok) stVerszok.innerText = `${globalVersenyzok.length} fő`;
    if (stKat) stKat.innerText = `${globalKategoriak.length} kat.`;
    if (stNev) stNev.innerText = `${globalNevezesek.length} nevezés`;
    if (stMeccs) stMeccs.innerText = `${globalMerkozesek.length} meccs`;
    if (stAgrajz) {
        stAgrajz.innerText = globalMerkozesek.length > 0 ? 'Nyomtatható' : 'Várakozik';
    }

    // Lenyitható (accordion) menüfülek fejléc-számlálóinak frissítése
    const accVers = document.getElementById('accBadgeVersenyek');
    const accVerszok = document.getElementById('accBadgeVersenyzok');
    const accKat = document.getElementById('accBadgeKategoriak');
    const accNev = document.getElementById('accBadgeNevezesek');
    const accTat = document.getElementById('accBadgeTatamik');
    const accAgrajz = document.getElementById('accBadgeAgrajz');

    if (accVers) accVers.innerText = `${globalVersenyek.length} verseny`;
    if (accVerszok) accVerszok.innerText = `${globalVersenyzok.length} fő`;
    if (accKat) accKat.innerText = `${globalKategoriak.length} kategória`;
    if (accNev) accNev.innerText = `${globalNevezesek.length} nevezés`;
    if (accTat) accTat.innerText = `${globalTatamik.length} tatami • ${globalMerkozesek.length} meccs`;
    if (accAgrajz) accAgrajz.innerText = globalMerkozesek.length > 0 ? `${globalKategoriak.length} kategória rajzolható` : 'Még nincs sorsolás';

    const cbCont = document.getElementById('adminUjVersenyzoKatCheckboxes');
    if (cbCont) {
        const bepipalt = Array.from(cbCont.querySelectorAll('input:checked')).map(c => parseInt(c.value));
        const lezarva = TatamiMaster.isNevezesLezarva();
        cbCont.innerHTML = globalKategoriak.map(k => `
            <label class="kat-check-item">
                <input type="checkbox" class="admin-uj-kat-cb" value="${k.id}" ${bepipalt.includes(k.id) ? 'checked' : ''} ${lezarva ? 'disabled' : ''}>
                <span><strong>${k.name}</strong> <small style="color:#52525B;">[${k.matchType}]</small></span>
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#71717A;padding:20px;">Nincs megjeleníthető versenyző.</td></tr>`;
    } else {
        let html = "";
        for (let v of szurt) {
            const nevezettKatNevek = globalNevezesek
                .filter(n => n.competitorId === v.id)
                .map(n => {
                    const kat = globalKategoriak.find(k => k.id === n.categoryId);
                    return kat ? `<span style="background:#F3F0EA;border:1px solid #E4E0D7;padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:600;display:inline-block;margin:2px;">${kat.name}</span>` : '';
                }).join(' ') || '<em style="color:#71717A;">Nincs nevezve</em>';

            html += `<tr>
                <td><strong>#${v.id}</strong></td>
                <td><strong>${v.name}</strong></td>
                <td>${v.club || '-'}</td>
                <td><span style="background:#F3F0EA;color:#18181B;border:1px solid #CFC9BC;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.84rem;">${v.belt || '-'}</span></td>
                <td><strong>${v.weight} kg</strong></td>
                <td>${v.birthYear}</td>
                <td>${nevezettKatNevek}</td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztVersenyzoTeljes(${v.id})">${TatamiMaster.icon('edit', 14)} Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Competitors', ${v.id})" title="Versenyző törlése">${TatamiMaster.icon('trash', 14)} Törlés</button>
                </td>
            </tr>`;
        }
        tbody.innerHTML = html;
    }

    const nevSel = document.getElementById('ujNevezesVersenyzo');
    if (nevSel) {
        nevSel.innerHTML = '<option value="">-- Válassz versenyzőt! --</option>' +
            globalVersenyzok.map(v => `<option value="${v.id}">${v.name} (${v.club} - ${v.weight}kg)</option>`).join('');
    }
}

async function hozzadVersenyzo() {
    if (TatamiMaster.isNevezesLezarva()) {
        TatamiMaster.toast("A nevezés le van zárva! Új versenyző felvételéhez előbb nyisd meg a nevezést.", "hiba");
        return;
    }

    const nev = document.getElementById('ujVersenyzoNev').value.trim();
    const klub = document.getElementById('ujVersenyzoKlub').value.trim() || "Shobu HSE";
    const ov = document.getElementById('ujVersenyzoOv').value.trim() || "10. kyu";
    const suly = parseInt(document.getElementById('ujVersenyzoSuly').value) || 60;
    const szulEv = parseInt(document.getElementById('ujVersenyzoSzulEv').value) || 2008;

    if (!nev) {
        TatamiMaster.toast("Add meg a versenyző nevét!", "figyelem");
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

        TatamiMaster.toast(`${nev} felvéve` + (kijeloltKatIdk.length > 0 ? ` és benevezve ${kijeloltKatIdk.length} kategóriába!` : '!'));
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
            const isKataKat = (k.matchType && k.matchType.toUpperCase() === 'KATA');
            const tipusBadge = isKataKat
                ? `<span style="background:#F3F0EA;color:#18181B;border:1px solid #CFC9BC;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('award', 13)} KATA</span>`
                : `<span style="background:#18181B;color:#FAF8F5;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('target', 13)} KUMITE</span>`;

            let formatumHint = '';
            if (!isKataKat && indulokDb >= 2) {
                formatumHint = TatamiMaster.isKumiteKormeccsLetszam(indulokDb)
                    ? ` <span style="background:#FAF8F5;border:1px solid #CFC9BC;color:#27272A;padding:2px 7px;border-radius:6px;font-size:0.75rem;font-weight:700;">Körmérkőzés</span>`
                    : ` <span style="background:#18181B;color:#FAF8F5;padding:2px 7px;border-radius:6px;font-size:0.75rem;font-weight:700;">Egyenes kiesés</span>`;
            }

            html += `<tr>
                <td><strong>#${k.id}</strong></td>
                <td><strong>${k.name}</strong></td>
                <td>${tipusBadge}</td>
                <td>${k.gender || 'Vegyes'}</td>
                <td>${k.minAge || 0} – ${k.maxAge || 99} év</td>
                <td><strong>${indulokDb} fő</strong>${formatumHint}</td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztKategoriaTeljes(${k.id})">${TatamiMaster.icon('edit', 14)} Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Categories', ${k.id})" title="Kategória törlése">${TatamiMaster.icon('trash', 14)} Törlés</button>
                </td>
            </tr>`;
        }
        tbody.innerHTML = html || `<tr><td colspan="7" style="text-align:center;color:#71717A;">Még nincs kategória.</td></tr>`;
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
        TatamiMaster.toast("Add meg a kategória nevét!", "figyelem");
        return;
    }

    const res = await TatamiMaster.apiSend('Categories', 'POST', {
        name: nev, matchType: tipus, gender: nem, minAge: minKor, maxAge: maxKor
    });
    if (res.ok) {
        document.getElementById('ujKategoriaNev').value = '';
        TatamiMaster.toast("Kategória létrehozva!");
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

function szamolSulySavok(katId, hatarSzoveg, autoOsszevonas) {
    const eredeti = globalKategoriak.find(k => k.id === katId);
    if (!eredeti) return [];

    const hatarok = hatarSzoveg.split(/[ ,;]+/)
        .map(x => parseFloat(x.replace('-', '').replace('+', '')))
        .filter(x => !isNaN(x) && x > 0)
        .sort((a, b) => a - b);

    const egyediHatarok = [...new Set(hatarok)];
    if (egyediHatarok.length === 0) return [];

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
    let utolsoHatar = egyediHatarok[egyediHatarok.length - 1];
    savok.push({
        cimke: `+${utolsoHatar} kg`,
        min: utolsoHatar,
        max: 999,
        nevezesek: [],
        eredetiEgyedulVolt: null
    });

    const katNevezesek = globalNevezesek.filter(n => n.categoryId === katId);
    for (let nev of katNevezesek) {
        const v = globalVersenyzok.find(x => x.id === nev.competitorId);
        if (!v) continue;

        let celSav = savok.find(s => v.weight > s.min && v.weight <= s.max) || savok[0];
        celSav.nevezesek.push({ reg: nev, versenyzo: v });
    }

    for (let s of savok) {
        if (s.nevezesek.length === 1) {
            s.eredetiEgyedulVolt = s.nevezesek[0].versenyzo;
        }
    }

    if (autoOsszevonas) {
        for (let i = 0; i < savok.length; i++) {
            if (savok[i].nevezesek.length === 1) {
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
        cont.innerHTML = `<div style="color:#991B1B;font-weight:700;padding:8px;display:flex;align-items:center;gap:6px;">${TatamiMaster.icon('alert', 16)} Ebben a kategóriában jelenleg nincs benevezett versenyző!</div>`;
        return;
    }

    let html = `<div style="background:white;border:1px solid #E4E0D7;border-radius:8px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
            <div style="font-weight:800;color:#18181B;display:flex;align-items:center;gap:6px;">${TatamiMaster.icon('chart', 16)} Súlybontási Előnézet: ${eredeti ? eredeti.name : ''}</div>
            <span style="font-size:0.78rem;color:#52525B;background:#F3F0EA;border:1px solid #E4E0D7;padding:3px 9px;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;gap:5px;">
                ${TatamiMaster.icon('trash', 13)} A felbontás után az eredeti „${eredeti ? eredeti.name : ''}” alap kategória automatikusan törlődik
            </span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">`;

    for (let s of aktivSavok) {
        const db = s.nevezesek.length;
        const egyedulMaradtMost = (db === 1);
        const voltEgyedulDeOsszevonva = (db === 0 && s.eredetiEgyedulVolt);

        let keretSzin = '#CFC9BC';
        let hatterSzin = '#FAF8F5';
        const kumiteModSzoveg = TatamiMaster.isKumiteKormeccsLetszam(db) ? 'Körmérkőzés' : 'Egyenes kiesés';
        let statuszBadge = `<span style="background:#18181B;color:#FAF8F5;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:700;">${TatamiMaster.icon('check', 12)} ${db} fő (${kumiteModSzoveg})</span>`;

        if (egyedulMaradtMost) {
            keretSzin = '#991B1B';
            hatterSzin = '#FAF5F5';
            statuszBadge = `<span style="background:#991B1B;color:white;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:700;">${TatamiMaster.icon('alert', 12)} EGYEDÜL VAN (1 fő)!</span>`;
        } else if (voltEgyedulDeOsszevonva) {
            keretSzin = '#A1A1AA';
            hatterSzin = '#F3F0EA';
            statuszBadge = `<span style="background:#52525B;color:#FAF8F5;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:700;">Átsorolva (1 fő volt)</span>`;
        }

        const nevekLista = s.nevezesek.map(x => {
            const extraJel = x.feljebbSorolvaHonnan
                ? ` <span style="background:#F3F0EA;color:#27272A;border:1px solid #CFC9BC;padding:1px 5px;border-radius:4px;font-size:0.72rem;font-weight:700;">[${x.feljebbSorolvaHonnan}-ban egyedül lett volna!]</span>`
                : '';
            return `<div>• <strong>${x.versenyzo.name}</strong> (${x.versenyzo.weight} kg, ${x.versenyzo.club})${extraJel}</div>`;
        }).join('');

        html += `<div style="border:1.5px solid ${keretSzin};background:${hatterSzin};border-radius:8px;padding:10px;font-size:0.84rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong style="font-size:0.95rem;display:inline-flex;align-items:center;gap:5px;">${TatamiMaster.icon('scale', 14)} ${s.cimke}</strong>
                ${statuszBadge}
            </div>
            ${voltEgyedulDeOsszevonva ? `<div style="color:#52525B;"><em>${s.eredetiEgyedulVolt.name} (${s.eredetiEgyedulVolt.weight} kg) egyedül lett volna itt, ezért átsorolva a szomszédos súlycsoportba!</em></div>` : nevekLista}
        </div>`;
    }

    html += `</div></div>`;
    cont.innerHTML = html;
}

let sulyBontasFolyamatban = false;

async function tisztitFelbontottEsDuplikaltKategoriakat() {
    let valtozott = false;

    // 1. Ha egy súlycsoport-kategória (pl. "... -70 kg" vagy "... +80 kg") duplikálódott volna,
    // az első példányt megtartjuk, a duplikált kategóriát és duplikált nevezéseit pedig eltávolítjuk
    const sulyKatCsoportok = {};
    for (let k of globalKategoriak) {
        if (!k || !k.name) continue;
        if (/\s[+-]\d+(\.\d+)?\s*kg$/i.test(k.name.trim())) {
            const kulcs = k.name.trim().toLowerCase();
            if (!sulyKatCsoportok[kulcs]) sulyKatCsoportok[kulcs] = [];
            sulyKatCsoportok[kulcs].push(k);
        }
    }

    for (let kulcs in sulyKatCsoportok) {
        const lista = sulyKatCsoportok[kulcs];
        if (lista.length > 1) {
            lista.sort((a, b) => a.id - b.id);
            const elsodleges = lista[0];
            const elsodlegesCompIds = new Set(
                globalNevezesek.filter(n => n.categoryId === elsodleges.id).map(n => n.competitorId)
            );

            for (let i = 1; i < lista.length; i++) {
                const dupKat = lista[i];
                const dupNevezesek = globalNevezesek.filter(n => n.categoryId === dupKat.id);
                for (let dn of dupNevezesek) {
                    if (!elsodlegesCompIds.has(dn.competitorId)) {
                        await TatamiMaster.apiSend('Registrations/' + dn.id, 'PUT', {
                            id: dn.id,
                            competitorId: dn.competitorId,
                            categoryId: elsodleges.id
                        });
                        elsodlegesCompIds.add(dn.competitorId);
                    } else {
                        await TatamiMaster.apiSend('Registrations/' + dn.id, 'DELETE', null, { csendes404: true });
                    }
                }
                const dupMeccsek = globalMerkozesek.filter(m => m.categoryId === dupKat.id);
                for (let dm of dupMeccsek) {
                    await TatamiMaster.apiSend('Matches/' + dm.id, 'DELETE', null, { csendes404: true });
                }
                await TatamiMaster.apiSend('Categories/' + dupKat.id, 'DELETE', null, { csendes404: true });
                valtozott = true;
            }
        }
    }

    // 2. Ha egy alap kategória (pl. "Kumite Men 45+ y.o." vagy "... Open") súlycsoportjai már létrejöttek
    // és az alap kategóriában 0 fő maradt, automatikusan töröljük a bent maradt üres alap kategóriát
    for (let k of globalKategoriak) {
        if (!k || !k.name) continue;
        if (/\s[+-]\d+(\.\d+)?\s*kg$/i.test(k.name.trim())) continue;

        const alapNev = k.name.replace(/\s+Open$/i, '').trim().toLowerCase();
        const vanMarSulycsoportja = globalKategoriak.some(masik => {
            if (!masik || masik.id === k.id || !masik.name) return false;
            const mNev = masik.name.trim().toLowerCase();
            return mNev.startsWith(alapNev + ' -') || mNev.startsWith(alapNev + ' +');
        });

        if (vanMarSulycsoportja) {
            const katNevezesek = globalNevezesek.filter(n => n.categoryId === k.id);
            if (katNevezesek.length === 0) {
                const regiMeccsek = globalMerkozesek.filter(m => m.categoryId === k.id);
                for (let rm of regiMeccsek) {
                    await TatamiMaster.apiSend('Matches/' + rm.id, 'DELETE', null, { csendes404: true });
                }
                await TatamiMaster.apiSend('Categories/' + k.id, 'DELETE', null, { csendes404: true });
                valtozott = true;
            }
        }
    }

    return valtozott;
}

async function sulycsoportBontas() {
    if (sulyBontasFolyamatban) return;

    const katId = parseInt(document.getElementById('bontandoKategoriaSelect').value);
    const hatarSzoveg = document.getElementById('sulyHatarInput').value;
    const autoOsszevonas = document.getElementById('autoOsszevonasCheckbox')?.checked;

    if (!katId || !hatarSzoveg.trim()) {
        TatamiMaster.toast("Válassz kategóriát és add meg a súlyhatárokat (pl. 50, 60, 70, 80, 90)!", "figyelem");
        return;
    }

    sulyBontasFolyamatban = true;
    try {
        // Frissítjük a szerverről az aktuális kategóriákat, nevezéseket és mérkőzéseket,
        // hogy soha ne dolgozzunk elavult memória-beli nevezés-azonosítókkal
        const [frissK, frissN, frissM] = await Promise.all([
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Matches')
        ]);
        globalKategoriak = Array.isArray(frissK) ? frissK : globalKategoriak;
        globalNevezesek  = Array.isArray(frissN) ? frissN : globalNevezesek;
        globalMerkozesek = Array.isArray(frissM) ? frissM : globalMerkozesek;

        const eredeti = globalKategoriak.find(k => k.id === katId);
        if (!eredeti) {
            TatamiMaster.toast("A kiválasztott alap kategória már fel lett bontva és törlésre került!", "figyelem");
            await mindenAdatFrissitese();
            return;
        }

        const savok = szamolSulySavok(katId, hatarSzoveg, autoOsszevonas).filter(s => s.nevezesek.length > 0);

        if (savok.length === 0) {
            // Ha az alap kategóriában már 0 fő van, mert a súlycsoportok már létrejöttek, töröljük az üres alap kategóriát
            const alapKatNevCheck = eredeti.name.replace(/\s+Open$/i, '').trim().toLowerCase();
            const marFelbontva = globalKategoriak.some(masik => {
                if (!masik || masik.id === eredeti.id || !masik.name) return false;
                const mNev = masik.name.trim().toLowerCase();
                return mNev.startsWith(alapKatNevCheck + ' -') || mNev.startsWith(alapKatNevCheck + ' +');
            });
            if (marFelbontva) {
                await TatamiMaster.apiSend('Categories/' + eredeti.id, 'DELETE', null, { csendes404: true });
                TatamiMaster.toast(`Az üresen maradt „${eredeti.name}” alap kategória törölve lett!`);
                const selectEl = document.getElementById('bontandoKategoriaSelect');
                if (selectEl) selectEl.value = '';
                document.getElementById('sulyBontasElonezetContainer').innerHTML = '';
                await mindenAdatFrissitese();
                return;
            }
            TatamiMaster.toast("Ebben a kategóriában nincs benevezett versenyző!", "figyelem");
            return;
        }

        const egyedulMaradok = savok.filter(s => s.nevezesek.length === 1);
        if (egyedulMaradok.length > 0) {
            const nevek = egyedulMaradok.map(s => `${s.nevezesek[0].versenyzo.name} (${s.nevezesek[0].versenyzo.weight}kg -> ${s.cimke})`).join('\n');
            if (!confirm(`FIGYELEM! Az alábbi versenyző(k) EGYEDÜL (ellenfél nélkül) maradnának a súlycsoportjukban:\n\n${nevek}\n\nBiztosan külön kategóriába hagyod őket?`)) {
                return;
            }
        }

        let letrejottDb = 0;
        const alapKatNev = eredeti.name.replace(/\s+Open$/i, '').trim();
        const atmozgatottRegIdk = new Set();

        for (let s of savok) {
            const ujKatNev = `${alapKatNev} ${s.cimke}`;
            let ujKat = globalKategoriak.find(k => k.name.trim().toLowerCase() === ujKatNev.trim().toLowerCase());

            if (!ujKat) {
                const ujKatRes = await TatamiMaster.apiSend('Categories', 'POST', {
                    name: ujKatNev,
                    matchType: eredeti.matchType,
                    gender: eredeti.gender,
                    minAge: eredeti.minAge,
                    maxAge: eredeti.maxAge
                });
                if (ujKatRes.ok) {
                    ujKat = await ujKatRes.json();
                }
            }

            if (ujKat && ujKat.id) {
                letrejottDb++;
                for (let item of s.nevezesek) {
                    // Átsoroljuk a meglévő nevezést az új súlycsoport-kategóriába (PUT)
                    const putRes = await TatamiMaster.apiSend('Registrations/' + item.reg.id, 'PUT', {
                        id: item.reg.id,
                        competitorId: item.versenyzo.id,
                        categoryId: ujKat.id
                    });
                    if (!putRes.ok) {
                        await TatamiMaster.apiSend('Registrations', 'POST', {
                            competitorId: item.versenyzo.id,
                            categoryId: ujKat.id
                        });
                        await TatamiMaster.apiSend('Registrations/' + item.reg.id, 'DELETE', null, { csendes404: true });
                    }
                    atmozgatottRegIdk.add(item.reg.id);
                }
            }
        }

        // Az alap kategória automatikus törlése a súlycsoport-felbontás után
        if (letrejottDb > 0) {
            const maradekNevezesek = globalNevezesek.filter(n => n.categoryId === eredeti.id && !atmozgatottRegIdk.has(n.id));
            for (let mn of maradekNevezesek) {
                await TatamiMaster.apiSend('Registrations/' + mn.id, 'DELETE', null, { csendes404: true });
            }
            const regiMeccsek = globalMerkozesek.filter(m => m.categoryId === eredeti.id);
            for (let rm of regiMeccsek) {
                await TatamiMaster.apiSend('Matches/' + rm.id, 'DELETE', null, { csendes404: true });
            }
            await TatamiMaster.apiSend('Categories/' + eredeti.id, 'DELETE', null, { csendes404: true });
        }

        TatamiMaster.toast(`Súlybontás kész! ${letrejottDb} db súlycsoport jött létre, az eredeti „${eredeti.name}” alap kategória törölve lett!`);
        const selectEl = document.getElementById('bontandoKategoriaSelect');
        if (selectEl) selectEl.value = '';
        document.getElementById('sulyBontasElonezetContainer').innerHTML = '';
        await mindenAdatFrissitese();
    } finally {
        sulyBontasFolyamatban = false;
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
            <td><strong>${v ? v.name : 'Ismeretlen (#' + n.competitorId + ')'}</strong> <small style="color:#52525B;">(${v ? v.club + ', ' + v.weight + 'kg' : ''})</small></td>
            <td><strong>${k ? k.name : 'Ismeretlen (#' + n.categoryId + ')'}</strong></td>
            <td>${k ? k.matchType : '-'}</td>
            <td>
                <button class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" onclick="torolElem('Registrations', ${n.id})">${TatamiMaster.icon('trash', 14)} Nevezés törlése</button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html || `<tr><td colspan="5" style="text-align:center;color:#71717A;">Nincs rögzített nevezés.</td></tr>`;
}

async function hozzadNevezes() {
    if (TatamiMaster.isNevezesLezarva()) {
        TatamiMaster.toast("A nevezés le van zárva! Új nevezéshez előbb nyisd meg a nevezést.", "hiba");
        return;
    }

    const versenyzoId = parseInt(document.getElementById('ujNevezesVersenyzo').value);
    const kategoriaId = parseInt(document.getElementById('ujNevezesKategoria').value);

    if (!versenyzoId || !kategoriaId) {
        TatamiMaster.toast("Válassz versenyzőt és kategóriát is!", "figyelem");
        return;
    }

    const marNevezve = globalNevezesek.some(n => n.competitorId === versenyzoId && n.categoryId === kategoriaId);
    if (marNevezve) {
        TatamiMaster.toast("Hiba: Ez a versenyző már szerepel ebben a kategóriában!", "hiba");
        return;
    }

    const res = await TatamiMaster.apiSend('Registrations', 'POST', { competitorId: versenyzoId, categoryId: kategoriaId });
    if (res.ok) {
        TatamiMaster.toast("Nevezés rögzítve!");
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
                    <strong style="font-size:1.1rem;display:inline-flex;align-items:center;gap:6px;">${TatamiMaster.icon('shield', 16)} ${t.name}</strong><br>
                    <small style="color:#52525B;">Beosztott mérkőzések: ${meccsDb} db</small>
                </div>
                <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Tatamis', ${t.id})" title="Tatami törlése">${TatamiMaster.icon('trash', 14)} Törlés</button>
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
    const formatSel = document.getElementById('sorsolasFormatumSelect');
    if (!cont) return;
    if (!katId) { cont.innerHTML = ''; return; }

    const kivalasztottKat = globalKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType && kivalasztottKat.matchType.toUpperCase() === 'KATA');

    const indulok = globalNevezesek.filter(n => n.categoryId === katId)
                                   .map(n => globalVersenyzok.find(v => v.id === n.competitorId))
                                   .filter(Boolean);

    if (indulok.length === 0) {
        cont.innerHTML = `<span style="color:#991B1B;font-weight:bold;">Nincs benevezett versenyző ebben a kategóriában!</span>`;
        return;
    }

    const isKormeccs = !isKata && TatamiMaster.isKumiteKormeccsLetszam(indulok.length);
    if (formatSel && !isKata) {
        formatSel.value = isKormeccs ? 'kormeccs' : 'egyenes';
    }

    const meccsSzamKormeccs = (indulok.length * (indulok.length - 1)) / 2;
    const szabalyBanner = isKata
        ? `<div style="margin-bottom:8px;padding:9px 14px;background:#FAF8F5;border:1px solid #CFC9BC;border-radius:8px;font-size:0.86rem;color:#18181B;display:flex;align-items:center;gap:8px;">
            ${TatamiMaster.icon('info', 15)}
            <span><strong>KATA kategória (${indulok.length} fő):</strong> A sorsolás pontozólapos rajtlistát készít (8+ főnél automatikus Top 6 döntővel).</span>
           </div>`
        : `<div style="margin-bottom:8px;padding:9px 14px;background:#FAF8F5;border:1.5px solid #18181B;border-radius:8px;font-size:0.86rem;color:#18181B;display:flex;align-items:center;gap:8px;">
            ${TatamiMaster.icon('info', 15)}
            <span><strong>Hivatalos Kyokushin Kumite szabály (${indulok.length} induló):</strong> ${
                isKormeccs
                    ? `<strong>5 fő vagy 5 fő alatt (${indulok.length} fő) &rarr; AUTOMATIKUS KÖRMÉRKŐZÉS</strong> (mindenki küzd mindenkivel, összesen ${meccsSzamKormeccs} mérkőzés).`
                    : `<strong>5 fő felett (${indulok.length} fő) &rarr; AUTOMATIKUS EGYENES KIESÉS</strong> (ágrajzos rendszer).`
            }</span>
           </div>`;

    cont.innerHTML = szabalyBanner +
        `<div style="margin-bottom:6px;font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:6px;">${TatamiMaster.icon('star', 14)} Kiemelt versenyzők bepipálása (opcionális):</div>` +
        `<div class="kat-checkbox-grid">` +
        indulok.map(v => `
            <label class="kat-check-item">
                <input type="checkbox" class="kiemelt-versenyzo-cb" value="${v.id}">
                <span>${v.name} <small style="color:#52525B;">(${v.club})</small></span>
            </label>
        `).join('') + `</div>`;
}

async function kategoriaSorsolasa() {
    const katId = parseInt(document.getElementById('sorsolasKategoriaSelect').value);
    const tatamiId = parseInt(document.getElementById('sorsolasTatamiSelect').value);
    const formatum = document.getElementById('sorsolasFormatumSelect').value;

    if (!katId || !tatamiId) {
        TatamiMaster.toast("Válassz kategóriát és tatamit is!", "figyelem");
        return;
    }

    const kivalasztottKat = globalKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType && kivalasztottKat.matchType.toUpperCase() === 'KATA');

    let indulok = globalNevezesek.filter(n => n.categoryId === katId)
                                 .map(n => globalVersenyzok.find(v => v.id === n.competitorId))
                                 .filter(Boolean);

    if (indulok.length === 0 || (!isKata && indulok.length < 2)) {
        TatamiMaster.toast("Hiba: Nincs elég benevezett versenyző a sorsoláshoz!", "hiba");
        return;
    }

    const meglevoKatMeccsek = globalMerkozesek.filter(m => m.categoryId === katId);
    if (meglevoKatMeccsek.length > 0) {
        if (!confirm(`Ebben a kategóriában már van ${meglevoKatMeccsek.length} db mérkőzés! Töröljük őket és újrasorsoljuk?`)) return;
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
    } else if (TatamiMaster.isKumiteKormeccsLetszam(rendezett.length) || formatum === 'kormeccs') {
        // Kyokushin Kumite szabály: 5 főnél vagy 5 fő alatt (2, 3, 4, 5 fő) körmérkőzés van!
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
    TatamiMaster.toast(`Sorsolás kész! (${generalt.length} mérkőzés létrehozva)`);
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
            ? `<span style="color:#18181B;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('check', 14)} Kész (${gy ? gy.name : 'Erőnyerő'})</span>`
            : `<span style="color:#52525B;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('clock', 14)} Várakozik</span>`;

        html += `<tr draggable="true" ondragstart="dragStart(event, ${m.id})" ondragover="dragOver(event)" ondrop="dropMatch(event, ${m.id})" style="cursor:grab;">
            <td><strong>#${m.matchOrder}</strong></td>
            <td>${tat ? tat.name : '-'}</td>
            <td><strong>${kat ? kat.name : '-'}</strong></td>
            <td style="color:#18181B;font-weight:700;">${v1 ? v1.name + ' <small style="color:#52525B;">(' + v1.club + ')</small>' : 'Várakozik...'}</td>
            <td>${isKata ? '<em>KATA EGYÉNI</em>' : (v2 ? v2.name + ' <small style="color:#52525B;">(' + v2.club + ')</small>' : (m.isFinished ? '<em>Erőnyerő</em>' : 'Várakozik...'))}</td>
            <td>${statuszHtml}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-outline" style="padding:4px 8px;font-size:0.8rem;" onclick="meccsUjranyitasaReset(${m.id})">${TatamiMaster.icon('refresh', 13)} Újranyitás</button>
                <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick="torolElem('Matches', ${m.id})" title="Mérkőzés törlése">${TatamiMaster.icon('trash', 13)} Törlés</button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html || `<tr><td colspan="7" style="text-align:center;color:#71717A;">Még nincs kisorsolt mérkőzés.</td></tr>`;
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
    if (!confirm("Biztosan törlöd az ÖSSZES kisorsolt mérkőzést?")) return;
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
        TatamiMaster.toast("Tétel törölve!");
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
        cont.innerHTML = '<p style="color:#71717A;">Ehhez a kategóriához még nincs kisorsolt ágrajz / rajtlista.</p>';
        return;
    }

    const nevKeres = (id) => {
        const v = globalVersenyzok.find(x => x.id === id);
        return v ? `${v.name} <small style="color:#52525B;">(${v.club})</small>` : 'Várakozik...';
    };

    if (isKata) {
        const kataTar = TatamiMaster.lekerKataEredmenyek();
        let sorok = katMeccsek.map(m => {
            const v = globalVersenyzok.find(x => x.id === m.competitor1Id);
            const er = kataTar[m.id] || { kesz: false, osszeg: 0 };
            return { m, v, er };
        });
        cont.innerHTML = `<table class="data-table"><thead><tr><th>Rajtszám</th><th>Versenyző</th><th>Klub</th><th>Összpontszám</th></tr></thead><tbody>` +
            sorok.map(s => `<tr><td>#${s.m.matchOrder}</td><td><strong>${s.v ? s.v.name : '-'}</strong></td><td>${s.v ? s.v.club : '-'}</td><td><strong style="color:#18181B;">${s.er.kesz ? s.er.osszeg.toFixed(1) : 'Várakozik'}</strong></td></tr>`).join('') +
            `</tbody></table>`;
        return;
    }

    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();
    let fordulok = [];
    let n = katMeccsek.length;
    let isAgrajz = TatamiMaster.isKumiteAgrajz(katMeccsek);

    if (isAgrajz) {
        let korMeret = (n + 1) / 2;
        let idx = 0;
        while (korMeret >= 1) {
            fordulok.push(katMeccsek.slice(idx, idx + korMeret));
            idx += korMeret;
            korMeret /= 2;
        }
    } else {
        fordulok.push(katMeccsek);
    }

    let formatumFejlec = isAgrajz
        ? `<div style="margin-bottom:12px;padding:10px 14px;background:#FAF8F5;border:1px solid #CFC9BC;border-radius:8px;font-size:0.86rem;color:#18181B;display:flex;align-items:center;gap:8px;">
            ${TatamiMaster.icon('git-branch', 15)}
            <span><strong>Lebonyolítási forma: Egyenes kieséses ágrajz</strong> (5 fő feletti Kumite kategória – összesen ${n} mérkőzés).</span>
           </div>`
        : `<div style="margin-bottom:12px;padding:10px 14px;background:#FAF8F5;border:1px solid #CFC9BC;border-radius:8px;font-size:0.86rem;color:#18181B;display:flex;align-items:center;gap:8px;">
            ${TatamiMaster.icon('refresh', 15)}
            <span><strong>Lebonyolítási forma: Körmérkőzés (Mindenki mindenkivel)</strong> – 5 fő vagy 5 fő alatti Kumite kategória (${n} mérkőzés + élő tabella).</span>
           </div>`;

    let html = formatumFejlec + `<div class="bracket-wrapper ${isAgrajz ? 'is-elimination' : ''}">`;
    fordulok.forEach((f, r) => {
        let korCim = isAgrajz
            ? (r === fordulok.length - 1 ? `${TatamiMaster.icon('trophy', 15)} Döntő` : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló"))
            : "Körmérkőzések (5 főig mindenki mindenkivel)";

        html += `<div class="bracket-round"><h4>${korCim}</h4><div class="bracket-round-matches">`;
        for (let m of f) {
            let isBye = (m.isFinished && !m.competitor2Id);
            let akaW = (m.isFinished && m.winnerId === m.competitor1Id) ? 'winner' : '';
            let shiroW = (m.isFinished && m.winnerId === m.competitor2Id) ? 'winner' : '';
            let reszlet = kumiteAdatok[m.id];
            let modRovid = (!isBye && reszlet && TatamiMaster.WIN_TYPES[reszlet.winType]) ? `<strong>[${TatamiMaster.WIN_TYPES[reszlet.winType].rovid}]</strong> ` : '';
            let modCimke = (!isBye && reszlet && TatamiMaster.WIN_TYPES[reszlet.winType]) ? TatamiMaster.WIN_TYPES[reszlet.winType].cimke : '';

            html += `
                <div class="bracket-slot">
                    <div class="bracket-match ${m.isFinished ? 'finished' : ''}">
                        <div style="background:#F3F0EA;border-bottom:1px solid #E4E0D7;padding:5px 12px;font-size:0.78rem;font-weight:700;color:#3F3F46;display:flex;justify-content:space-between;">
                            <span>Mérkőzés #${m.matchOrder}</span>
                            <span>${m.isFinished ? modCimke : ''}</span>
                        </div>
                        <div class="bracket-fighter aka ${akaW}">
                            <span><span class="fighter-tag aka-tag">AKA</span>${nevKeres(m.competitor1Id)}</span>
                            <span>${akaW ? modRovid + TatamiMaster.icon('trophy', 14) : ''}</span>
                        </div>
                        <div class="bracket-fighter shiro ${shiroW}">
                            <span>${m.competitor2Id ? '<span class="fighter-tag shiro-tag">SHIRO</span>' + nevKeres(m.competitor2Id) : '<em style="color:#71717A;">Erőnyerő</em>'}</span>
                            <span>${shiroW ? modRovid + TatamiMaster.icon('trophy', 14) : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        html += `</div></div>`;
    });
    html += `</div>`;

    if (!isAgrajz) {
        let stat = {};
        for (let m of katMeccsek) {
            [m.competitor1Id, m.competitor2Id].forEach(id => {
                if (id && !stat[id]) {
                    let vObj = globalVersenyzok.find(v => v.id === id);
                    stat[id] = { id: id, nev: vObj ? `${vObj.name} (${vObj.club})` : 'Ismeretlen', lejatszott: 0, gy: 0, v: 0, sulyPont: 0 };
                }
            });
            if (m.isFinished && m.winnerId) {
                let vesztesId = (m.winnerId === m.competitor1Id) ? m.competitor2Id : m.competitor1Id;
                let reszlet = kumiteAdatok[m.id];
                let modKod = (reszlet && reszlet.winType) ? reszlet.winType : 'HANTEI';
                let wt = TatamiMaster.WIN_TYPES[modKod] || { pont: 1 };
                if (stat[m.winnerId]) {
                    stat[m.winnerId].lejatszott++;
                    stat[m.winnerId].gy++;
                    stat[m.winnerId].sulyPont += wt.pont;
                }
                if (vesztesId && stat[vesztesId]) {
                    stat[vesztesId].lejatszott++;
                    stat[vesztesId].v++;
                }
            }
        }
        let tabella = Object.values(stat).sort((a, b) => (b.gy !== a.gy) ? (b.gy - a.gy) : (b.sulyPont - a.sulyPont));
        html += `<div style="margin-top:18px;background:#FAF8F5;padding:16px;border-radius:10px;border:1px solid #CFC9BC;">
            <h4 style="margin-top:0;margin-bottom:10px;color:#18181B;display:flex;align-items:center;gap:6px;">${TatamiMaster.icon('trophy', 16)} Körmérkőzés Élő Tabella (Sorrend: 1. Győzelmek száma, 2. Súlyozott pont: IPP/AWA/SIK/KIK=3p, WAZ=2p, HAN=1p)</h4>
            <table class="data-table" style="margin-bottom:0;">
                <thead><tr><th>Helyezés</th><th>Versenyző (Klub)</th><th>Meccs</th><th>Győzelem</th><th>Vereség</th><th>Súlyozott Pont</th></tr></thead>
                <tbody>` +
                tabella.map((t, idx) => `<tr style="${idx === 0 && t.gy > 0 ? 'background:#F3F0EA;font-weight:700;' : ''}">
                    <td><strong>${idx + 1}.</strong></td>
                    <td>${t.nev}</td>
                    <td>${t.lejatszott}</td>
                    <td style="font-weight:800;color:#18181B;">${t.gy}</td>
                    <td style="color:#52525B;">${t.v}</td>
                    <td><strong style="background:#18181B;color:#FAF8F5;padding:2px 9px;border-radius:6px;">${t.sulyPont} pt</strong></td>
                </tr>`).join('') +
            `</tbody></table></div>`;
    }

    cont.innerHTML = html;
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
        TatamiMaster.toast(`${v.name} adatai frissítve!`);
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
        TatamiMaster.toast(`Kategória frissítve!`);
        await mindenAdatFrissitese();
    }
}

async function meccsUjranyitasaReset(matchId) {
    const m = globalMerkozesek.find(x => x.id === matchId);
    if (!m) return;
    if (!confirm(`Biztosan újranyitod a #${m.matchOrder}. mérkőzést?`)) return;

    m.isFinished = false;
    m.winnerId = null;

    let kataTar = TatamiMaster.lekerKataEredmenyek();
    delete kataTar[matchId];
    localStorage.setItem('kataEredmenyek', JSON.stringify(kataTar));

    const res = await TatamiMaster.apiSend('Matches/' + matchId, 'PUT', m);
    if (res.ok) {
        TatamiMaster.toast(`Mérkőzés #${m.matchOrder} újranyitva!`);
        await mindenAdatFrissitese();
    }
}

// ============================================================================
// NAGY TESZT: TELJES ADATBÁZIS TÖRLÉS, ID=1 RESET ÉS SQL TESZTADATOK BETÖLTÉSE
// ============================================================================
async function nagyTesztAdatbazisReset() {
    if (!confirm("NAGY TESZT INDÍTÁSA:\n\nBiztosan törölsz minden jelenlegi adatot, visszaállítod az összes ID-t 1-re, és feltöltöd a rendszert a tiszta SQL tesztadatokkal?")) {
        return;
    }

    localStorage.removeItem('kataEredmenyek');
    localStorage.removeItem('kataDontoMeccsIdk');
    localStorage.removeItem('kumiteReszletek');
    localStorage.removeItem('tatamiAdatok');
    localStorage.removeItem('tatamiAdatok_1');
    localStorage.removeItem('tatamiAdatok_2');
    TatamiMaster.setNevezesLezarva(false);

    const res = await TatamiMaster.apiSend('Tournaments/reset-seed', 'POST', {});
    if (res.ok) {
        TatamiMaster.toast("Minden adat törölve, ID-k 1-re állítva, SQL tesztadatok betöltve!");
        await mindenAdatFrissitese();
    } else {
        TatamiMaster.toast("Hiba történt a tesztadatok visszaállításakor!", "hiba");
    }
}

// ============================================================================
// VERSENYNAPI TATAMI-MENETREND ÉS PIHENŐIDŐS ROTÁCIÓS MOTOR
// ============================================================================
function isNoiKategoria(kat) {
    if (!kat) return false;
    const g = (kat.gender || '').toLowerCase();
    const n = (kat.name || '').toLowerCase();
    return g.includes('girl') || g.includes('women') || g.includes('nő') || g.includes('lány') ||
           n.includes('girl') || n.includes('women') || n.includes('női') || n.includes('lány');
}

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

function bontKumiteMeccsekFordulokra(katMeccsek) {
    let rendezett = [...katMeccsek].sort((a, b) => a.id - b.id);
    let n = rendezett.length;

    if (TatamiMaster.isKumiteAgrajz(rendezett)) {
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

async function automatikusTatamiMenetrendRendezes(celTatamiId = null, csendes = false) {
    const frissMeccsek = await TatamiMaster.apiGet('Matches');
    if (!Array.isArray(frissMeccsek) || frissMeccsek.length === 0) {
        if (!csendes) TatamiMaster.toast("Nincs kisorsolt mérkőzés, amit rendezni lehetne!", "figyelem");
        return;
    }

    const erintettTatamik = celTatamiId
        ? globalTatamik.filter(t => t.id === celTatamiId)
        : globalTatamik;

    let frissitesiIgeretek = [];

    for (let tat of erintettTatamik) {
        const tatamiMeccsek = frissMeccsek.filter(m => m.tatamiId === tat.id);
        if (tatamiMeccsek.length === 0) continue;

        const katIdk = [...new Set(tatamiMeccsek.map(m => m.categoryId))];
        const tatamiKategoriak = katIdk
            .map(id => globalKategoriak.find(k => k.id === id))
            .filter(Boolean)
            .sort(kategoriaSorrendHasonlito);

        const kataKategoriak = tatamiKategoriak.filter(k => k.matchType && k.matchType.toUpperCase() === 'KATA');
        const kumiteKategoriak = tatamiKategoriak.filter(k => !k.matchType || k.matchType.toUpperCase() !== 'KATA');

        let vegsoTatamiSorrend = [];

        for (let kKat of kataKategoriak) {
            let kMeccsek = tatamiMeccsek
                .filter(m => m.categoryId === kKat.id)
                .sort((a, b) => a.id - b.id);
            vegsoTatamiSorrend.push(...kMeccsek);
        }

        let kategoriaForduloMap = [];
        let felnottDontok = [];

        for (let kumKat of kumiteKategoriak) {
            let mLista = tatamiMeccsek.filter(m => m.categoryId === kumKat.id);
            let fordulok = bontKumiteMeccsekFordulokra(mLista);
            let isFelnott = ((kumKat.minAge ?? 0) >= 18);

            if (isFelnott && fordulok.length > 1) {
                let utolsoFordulo = fordulok.pop();
                felnottDontok.push(...utolsoFordulo);
            }

            kategoriaForduloMap.push({
                kategoria: kumKat,
                fordulok: fordulok
            });
        }

        let maxForduloSzam = Math.max(0, ...kategoriaForduloMap.map(x => x.fordulok.length));
        for (let korIdx = 0; korIdx < maxForduloSzam; korIdx++) {
            for (let elem of kategoriaForduloMap) {
                if (elem.fordulok[korIdx]) {
                    vegsoTatamiSorrend.push(...elem.fordulok[korIdx]);
                }
            }
        }

        vegsoTatamiSorrend.push(...felnottDontok);

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
        TatamiMaster.toast("Tatami menetrend optimalizálva! (Kata Lányok->Fiúk, Kumite pihenős rotáció + Felnőtt döntők a végén!)");
    }
    await mindenAdatFrissitese();
}

async function osszesKategoriaAutomatikusSorsolasa() {
    if (globalTatamik.length === 0 || globalKategoriak.length === 0) {
        TatamiMaster.toast("Először töltsd be a tesztadatokat!", "figyelem");
        return;
    }

    if (!confirm("AUTOMATIKUS TELJES SORSOLÁS & MENETREND:\n\nKisorsoljuk az összes kategóriát a Tatami A, B, C pástokra (korosztályos elosztásban), és felépítsük a pihenőidős, rotációs menetrendet?")) {
        return;
    }

    for (let m of globalMerkozesek) {
        await TatamiMaster.apiSend('Matches/' + m.id, 'DELETE');
    }

    const tatA = globalTatamik[0];
    const tatB = globalTatamik[1] || tatA;
    const tatC = globalTatamik[2] || tatB;

    let sorszamMap = { [tatA.id]: 1, [tatB.id]: 1, [tatC.id]: 1 };

    const rendezettKat = [...globalKategoriak].sort(kategoriaSorrendHasonlito);

    for (let kat of rendezettKat) {
        const isKata = (kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        let indulok = globalNevezesek
            .filter(n => n.categoryId === kat.id)
            .map(n => globalVersenyzok.find(v => v.id === n.competitorId))
            .filter(Boolean);

        if (indulok.length === 0 || (!isKata && indulok.length < 2)) continue;

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
        } else if (TatamiMaster.isKumiteKormeccsLetszam(kevert.length)) {
            // 5 főnél vagy 5 fő alatt (2..5 fő) a Kumitében körmérkőzés van!
            for (let i = 0; i < kevert.length; i++) {
                for (let j = i + 1; j < kevert.length; j++) {
                    generalt.push({ categoryId: kat.id, tatamiId: tId, competitor1Id: kevert[i].id, competitor2Id: kevert[j].id, matchOrder: sorszamMap[tId]++, isFinished: false, winnerId: null });
                }
            }
        } else {
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

    await automatikusTatamiMenetrendRendezes(null, true);
    TatamiMaster.toast("Teljes sorsolás és pihenőidős tatami-menetrend elkészült!");
}
