let globalVersenyek = [];
let globalVersenyzok = [];
let globalKategoriak = [];
let globalNevezesek = [];
let globalTatamik = [];
let globalMerkozesek = [];
let draggedMatchId = null;

let adminLiveFrissitesTimer = null;

window.onload = function() {
    const datumInput = document.getElementById('adminUjVersenyDatum');
    if (datumInput && !datumInput.value) {
        datumInput.value = new Date().toISOString().split('T')[0];
    }
    mindenAdatFrissitese();

    // Valós idejű háttér-szinkronizáció: ha másik gépen (Edzői vagy Bírói pulton) változás történik,
    // automatikusan frissítjük az Admin Központot is (kivéve ha épp szövegmezőbe gépel az admin vagy húzza a sort)
    TatamiMaster.on('liveAdatValtozott', function() {
        if (draggedMatchId !== null) return;
        const aktElem = document.activeElement;
        const gepel = aktElem && ['INPUT', 'SELECT', 'TEXTAREA'].includes(aktElem.tagName);
        if (gepel) return;

        if (adminLiveFrissitesTimer) clearTimeout(adminLiveFrissitesTimer);
        adminLiveFrissitesTimer = setTimeout(() => {
            mindenAdatFrissitese();
        }, 350);
    });

    // Automatikus nevezési határidő ellenőrző (15 mp-enként frissíti a zárolási állapotot, ha lejárt az óra:perc határidő)
    setInterval(() => {
        frissitNevezesZarolasUI();
        frissitAdminAktivVersenyBar();
    }, 15000);
};

function nyitAdminQrPlakat(versenyId = null) {
    const celId = parseInt(versenyId) || TatamiMaster.lekerAktualisVersenyId();
    const vObj = globalVersenyek.find(v => v.id === celId) || null;
    TatamiMaster.nyitQrPlakatModal(vObj);
}

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
    const aktId = TatamiMaster.lekerAktualisVersenyId();
    const lezarva = TatamiMaster.isNevezesLezarva(aktId);
    const beallitas = TatamiMaster.lekerVersenyBeallitas(aktId);
    const hataridoStr = beallitas && beallitas.registrationDeadline ? TatamiMaster.formazNevezesiHatarido(beallitas.registrationDeadline) : '';
    const hataridoLejart = TatamiMaster.isNevezesiHataridoLejart(aktId);

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
        bar.style.borderColor = lezarva ? '#990000' : '#E4E0D7';
        bar.style.background = lezarva ? '#FAF5F5' : '#FAF8F5';
    });

    const hataridoExtraHtml = hataridoStr
        ? ` <span style="background:#FFFFFF;border:1px solid ${hataridoLejart ? '#990000' : '#CFC9BC'};color:${hataridoLejart ? '#990000' : '#18181B'};padding:2px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;">Nevezési határidő: ${TatamiMaster.escapeHtml(hataridoStr)}${hataridoLejart ? ' (LEJÁRT)' : ''}</span>`
        : '';

    document.querySelectorAll('.nevezes-zarolas-status').forEach(st => {
        if (lezarva) {
            st.innerHTML = `
                <span style="background:#990000;color:#FAF8F5;padding:4px 10px;border-radius:6px;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:5px;">
                    ${TatamiMaster.icon('lock', 14)} NEVEZÉS LEZÁRVA
                </span>
                <span style="color:#990000;font-weight:600;">Új versenyzők és nevezések leadása jelenleg zárolva van (edzői és admin felületen is).</span>${hataridoExtraHtml}
            `;
        } else {
            st.innerHTML = `
                <span style="background:#18181B;color:#FAF8F5;padding:4px 10px;border-radius:6px;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:5px;">
                    ${TatamiMaster.icon('unlock', 14)} NEVEZÉS NYITVA
                </span>
                <span style="color:#52525B;">Az edzők és az adminisztrátor szabadon adhatnak le új egyéni és csapat nevezéseket.</span>${hataridoExtraHtml}
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

    const formEl = document.getElementById('adminVersenyzoNevezesForm');
    if (formEl) {
        formEl.style.opacity = lezarva ? '0.82' : '1';
        formEl.style.pointerEvents = lezarva ? 'none' : 'auto';
        formEl.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = lezarva;
        });
    }
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
        globalMerkozesek = Array.isArray(m)
            ? m.sort((a, b) => (a.tatamiId - b.tatamiId) || (a.matchOrder - b.matchOrder) || (a.id - b.id))
            : [];

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

        const beallitas = TatamiMaster.lekerVersenyBeallitas(aktVerseny.id);
        const korSzabalySzoveg = (beallitas.ageRule === 'EUROPEAN')
            ? 'Európai szabály (születési év)'
            : 'Japán szabály (versenynapi életkor)';
        const hataridoSzoveg = beallitas.registrationDeadline
            ? ` &bull; Nevezési határidő: <strong>${TatamiMaster.escapeHtml(TatamiMaster.formazNevezesiHatarido(beallitas.registrationDeadline))}</strong>`
            : '';

        meta.innerHTML = `
            ${autoStatusHtml}
            <span style="background:#F3F0EA;border:1px solid #CFC9BC;color:#18181B;padding:4px 9px;border-radius:6px;font-weight:700;font-size:0.78rem;">
                ${statuszSzoveg}
            </span>
            <span>${TatamiMaster.icon('calendar', 14)} <strong>${datumSzoveg}</strong></span>
            <span>&bull; ${TatamiMaster.icon('user', 14)} Szervező: <strong>${szervezoSzoveg}</strong></span>
            <span>&bull; Korhatár: <strong>${korSzabalySzoveg}</strong>${hataridoSzoveg}</span>
            <span style="color:${lezarva ? '#990000' : '#18181B'};font-weight:700;">
                &bull; ${lezarva ? `${TatamiMaster.icon('lock', 13)} Nevezés lezárva` : `${TatamiMaster.icon('unlock', 13)} Nevezés nyitva`}
            </span>
        `;
    } else if (meta) {
        meta.innerHTML = `<span style="color:#71717A;font-weight:700;">Nincs aktív verseny — hozz létre egy újat az 1. Menüben!</span>`;
    }

    if (eloLink) {
        eloLink.href = globalVersenyek.length > 0 ? `audience.html?versenyId=${aktId}` : 'audience.html';
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
    if (typeof ugorjAdminTabra === 'function') {
        ugorjAdminTabra('tab-versenyek', true);
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
        const vBeallitas = TatamiMaster.lekerVersenyBeallitas(v.id);
        const hataridoInfoHtml = vBeallitas.registrationDeadline
            ? `<div style="font-size:0.74rem;color:${TatamiMaster.isNevezesiHataridoLejart(v.id) ? '#990000' : '#3F3F46'};font-weight:700;margin-top:2px;">Határidő: ${TatamiMaster.escapeHtml(TatamiMaster.formazNevezesiHatarido(vBeallitas.registrationDeadline))}</div>`
            : '';
        const korSzabalyInfoHtml = `<div style="font-size:0.72rem;color:#52525B;margin-top:1px;">${vBeallitas.ageRule === 'EUROPEAN' ? 'Európai szabály (szül. év)' : 'Japán szabály (versenynapi kor)'}</div>`;

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
            <td>${TatamiMaster.icon('calendar', 14)} ${datumSzoveg}${hataridoInfoHtml}${korSzabalyInfoHtml}</td>
            <td>
                <span style="background:${isLezart ? '#990000' : '#18181B'};color:#FAF8F5;padding:3px 9px;border-radius:6px;font-weight:700;font-size:0.78rem;">
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
                    <button type="button" class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;" onclick="nyitAdminQrPlakat(${v.id})" title="Nyomtatható A4 csarnok QR-plakát ehhez a versenyhez">
                        ${TatamiMaster.icon('qr', 14)} QR-Plakát
                    </button>
                    <button type="button" class="btn btn-outline-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="nyitAdminOklevelSablon(${v.id})" title="Oklevél sablon szerkesztése és nyomtatása ehhez a versenyhez">
                        ${TatamiMaster.icon('award', 14)} Oklevél Sablon
                    </button>
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
        { name: 'Ovis & Gyerek Csipeszharc (Vegyes, 4-7 év)', matchType: 'KUMITE', gender: 'Vegyes', minAge: 4, maxAge: 7 },
        { name: 'Gyerek 3,2,1 Fiú Kata (8-11 év)',      matchType: 'KATA',   gender: 'Férfi', minAge: 8,  maxAge: 11 },
        { name: 'Gyerek 3,2,1 Lány Kata (8-11 év)',     matchType: 'KATA',   gender: 'Női',   minAge: 8,  maxAge: 11 },
        { name: 'Serdülő & Ifjúsági Kata (12-15 év)',   matchType: 'KATA',   gender: 'Vegyes',minAge: 12, maxAge: 15 },
        { name: 'Junior, Felnőtt & Senior Kata (16+)',  matchType: 'KATA',   gender: 'Vegyes',minAge: 16, maxAge: 99 },
        { name: 'Gyerek 3,2,1 Kumite Open (8-11 év)',   matchType: 'KUMITE', gender: 'Férfi', minAge: 8,  maxAge: 11 },
        { name: 'Serdülő Kumite Open (12-13 év)',       matchType: 'KUMITE', gender: 'Férfi', minAge: 12, maxAge: 13 },
        { name: 'Ifjúsági Kumite Open (14-15 év)',      matchType: 'KUMITE', gender: 'Férfi', minAge: 14, maxAge: 15 },
        { name: 'Junior Kumite Open (16-17 év)',        matchType: 'KUMITE', gender: 'Férfi', minAge: 16, maxAge: 17 },
        { name: 'Felnőtt Férfi Kumite Open (18-34 év)', matchType: 'KUMITE', gender: 'Férfi', minAge: 18, maxAge: 34 },
        { name: 'Felnőtt Női Kumite Open (18-34 év)',   matchType: 'KUMITE', gender: 'Női',   minAge: 18, maxAge: 34 },
        { name: 'Senior Kumite Open (35+ év)',          matchType: 'KUMITE', gender: 'Férfi', minAge: 35, maxAge: 99 }
    ];

    for (let kat of alapKategoriak) {
        await TatamiMaster.apiSend('Categories', 'POST', kat, { versenyId: versenyId });
    }
}

async function hozzadVersenyAdminbol() {
    const nevInput = document.getElementById('adminUjVersenyNev');
    const szervezoInput = document.getElementById('adminUjVersenySzervezo');
    const datumInput = document.getElementById('adminUjVersenyDatum');
    const hataridoInput = document.getElementById('adminUjVersenyHatarido');
    const korSzabalyInput = document.getElementById('adminUjVersenyKorSzabaly');
    const statuszInput = document.getElementById('adminUjVersenyStatusz');
    const plakatInput = document.getElementById('adminUjVersenyPlakatFile');
    const kiirasInput = document.getElementById('adminUjVersenyKiirasFile');
    const alapStrukturaCb = document.getElementById('adminUjVersenyAlapStruktura');
    const azonnaliValtasCb = document.getElementById('adminUjVersenyAzonnaliValtas');

    const nev = (nevInput?.value || '').trim();
    const szervezo = (szervezoInput?.value || '').trim() || 'Shobu HSE';
    const datum = datumInput?.value;
    const hatarido = (hataridoInput?.value || '').trim();
    const korSzabaly = (korSzabalyInput?.value === 'EUROPEAN') ? 'EUROPEAN' : 'JAPAN';
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
        organizer: szervezo,
        registrationDeadline: hatarido,
        ageRule: korSzabaly
    });

    if (res.ok) {
        let letrejottVerseny = null;
        try {
            letrejottVerseny = await res.json();
        } catch (e) {}

        if (letrejottVerseny && letrejottVerseny.id) {
            TatamiMaster.mentVersenyBeallitas(letrejottVerseny.id, {
                registrationDeadline: hatarido,
                ageRule: korSzabaly,
                manualUnlockedAfterDeadline: false
            });
            if (!alapStrukturaCb || alapStrukturaCb.checked) {
                await letrehozAlapTatamikEsKategoriakVersenyhez(letrejottVerseny.id);
            }
            if (!azonnaliValtasCb || azonnaliValtasCb.checked) {
                TatamiMaster.mentAktualisVerseny(letrejottVerseny.id, letrejottVerseny.name || nev);
            }
        }

        if (nevInput) nevInput.value = '';
        if (szervezoInput) szervezoInput.value = '';
        if (hataridoInput) hataridoInput.value = '';
        if (plakatInput) plakatInput.value = '';
        if (kiirasInput) kiirasInput.value = '';
        TatamiMaster.toast(`„${nev}” verseny létrehozva` + ((!azonnaliValtasCb || azonnaliValtasCb.checked) ? ' és kiválasztva szerkesztésre!' : '!'));
        await mindenAdatFrissitese();
    }
}

function bezarVersenyEditModal() {
    const m = document.getElementById('tmVersenyEditModal');
    if (m) m.remove();
}

function szerkesztVersenyTeljes(id) {
    const v = globalVersenyek.find(x => x.id === id);
    if (!v) return;

    bezarVersenyEditModal();
    const esc = (s) => TatamiMaster.escapeHtml(s);
    const vBeallitas = TatamiMaster.lekerVersenyBeallitas(id);
    const regiDatum = v.date ? new Date(v.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const regiHatarido = vBeallitas.registrationDeadline || '';
    const regiKorSzabaly = vBeallitas.ageRule || 'JAPAN';
    const regiStatusz = v.status || 'ÉLŐ / NYITVA';

    const modal = document.createElement('div');
    modal.id = 'tmVersenyEditModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.onclick = (e) => { if (e.target === modal) bezarVersenyEditModal(); };

    modal.innerHTML = `
        <div style="background:#FFFFFF;border:1.5px solid #18181B;border-radius:12px;width:100%;max-width:580px;max-height:92vh;overflow-y:auto;padding:20px 18px;box-shadow:0 20px 45px rgba(0,0,0,0.28);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #E4E0D7;padding-bottom:10px;">
                <h3 style="margin:0;font-size:1.08rem;font-weight:800;color:#18181B;display:flex;align-items:center;gap:8px;">
                    ${TatamiMaster.icon('edit', 18)} Verseny Adatainak, Nevezési Határidejének és Szabályának Szerkesztése
                </h3>
                <button type="button" onclick="bezarVersenyEditModal()" style="background:transparent;border:none;cursor:pointer;color:#71717A;padding:4px;">
                    ${TatamiMaster.icon('x', 20)}
                </button>
            </div>
            <form onsubmit="event.preventDefault(); mentVersenyEditModal(${id});">
                <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px;">
                    <div>
                        <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">1. Verseny hivatalos megnevezése *</label>
                        <input type="text" id="editVersenyNev" class="form-control" value="${esc(v.name || '')}" required>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">2. Szervező egyesület / Főrendező *</label>
                        <input type="text" id="editVersenySzervezo" class="form-control" value="${esc(v.organizer || '')}">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div>
                            <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">3. Verseny dátuma (ÉÉÉÉ-HH-NN) *</label>
                            <input type="date" id="editVersenyDatum" class="form-control" value="${esc(regiDatum)}" required>
                        </div>
                        <div>
                            <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">4. Verseny állapota</label>
                            <select id="editVersenyStatusz" class="form-control">
                                <option value="ÉLŐ / NYITVA" ${regiStatusz === 'ÉLŐ / NYITVA' ? 'selected' : ''}>ÉLŐ / NYITVA</option>
                                <option value="NEVEZÉS ALATT" ${regiStatusz === 'NEVEZÉS ALATT' ? 'selected' : ''}>NEVEZÉS ALATT</option>
                                <option value="LEZÁRULT" ${regiStatusz === 'LEZÁRULT' ? 'selected' : ''}>LEZÁRULT</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                            <label style="font-size:0.8rem;font-weight:700;color:#27272A;">5. Nevezési határidő (Dátum és óra:perc – automatikus nevezéslezárás)</label>
                            <button type="button" class="btn btn-outline" style="padding:2px 8px;font-size:0.72rem;" onclick="document.getElementById('editVersenyHatarido').value=''">Határidő törlése</button>
                        </div>
                        <input type="datetime-local" id="editVersenyHatarido" class="form-control" value="${esc(regiHatarido)}">
                        <small style="color:#52525B;font-size:0.74rem;display:block;margin-top:3px;">Amint az óra eléri a megadott időpontot (pl. 12:00), a nevezés minden edzői és admin gépen automatikusan lezárul.</small>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">6. Korhatár-számítási szabályrendszer *</label>
                        <select id="editVersenyKorSzabaly" class="form-control">
                            <option value="JAPAN" ${regiKorSzabaly !== 'EUROPEAN' ? 'selected' : ''}>Japán szabály (Verseny napján betöltött pontos életkor: Év-Hó-Nap)</option>
                            <option value="EUROPEAN" ${regiKorSzabaly === 'EUROPEAN' ? 'selected' : ''}>Európai szabály (Csak születési év alapján: Verseny éve - Születési év)</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:10px;">
                    <button type="button" class="btn btn-outline" onclick="bezarVersenyEditModal()">Mégse</button>
                    <button type="submit" class="btn btn-outline-green" style="padding:9px 18px;">
                        ${TatamiMaster.icon('check', 16)} Verseny Beállításainak Mentése
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function mentVersenyEditModal(id) {
    const v = globalVersenyek.find(x => x.id === id);
    if (!v) return;

    const ujNev = (document.getElementById('editVersenyNev')?.value || '').trim();
    const ujSzervezo = (document.getElementById('editVersenySzervezo')?.value || '').trim();
    const ujDatum = (document.getElementById('editVersenyDatum')?.value || '').trim();
    const ujStatusz = (document.getElementById('editVersenyStatusz')?.value || '').trim();
    const ujHatarido = (document.getElementById('editVersenyHatarido')?.value || '').trim();
    const ujKorSzabaly = (document.getElementById('editVersenyKorSzabaly')?.value === 'EUROPEAN') ? 'EUROPEAN' : 'JAPAN';

    v.name = ujNev || v.name;
    v.organizer = ujSzervezo || v.organizer;
    if (ujDatum) v.date = new Date(ujDatum).toISOString();
    v.status = ujStatusz || v.status;
    v.registrationDeadline = ujHatarido;
    v.ageRule = ujKorSzabaly;

    TatamiMaster.mentVersenyBeallitas(id, {
        registrationDeadline: ujHatarido,
        ageRule: ujKorSzabaly,
        manualUnlockedAfterDeadline: false
    });

    const res = await TatamiMaster.apiSend('Tournaments/' + id, 'PUT', v);
    bezarVersenyEditModal();
    if (res && res.ok) {
        TatamiMaster.toast(`„${v.name}” adatai, nevezési határideje és korhatár-szabálya frissítve!`);
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
        frissitAdminKategoriaAjanlas(bepipalt);
    }
}

function lekerAdminUrlapSzulErtek() {
    const datumVal = (document.getElementById('ujVersenyzoSzulDatum')?.value || '').trim();
    const evVal = (document.getElementById('ujVersenyzoSzulEv')?.value || '').trim();
    return datumVal || evVal || '';
}

function szinkronizalAdminSzulDatum() {
    const datumInput = document.getElementById('ujVersenyzoSzulDatum');
    const evInput = document.getElementById('ujVersenyzoSzulEv');
    const korInfo = document.getElementById('ujVersenyzoKorInfo');
    const nyers = lekerAdminUrlapSzulErtek();
    const norm = TatamiMaster.normalizalSzulDatum(nyers);

    if (evInput && norm.birthYear) {
        evInput.value = String(norm.birthYear);
    }
    if (korInfo) {
        if (norm.birthYear) {
            const kor = TatamiMaster.szamolVersenyzoKor(nyers);
            const ref = TatamiMaster.lekerAktivVersenyDatumEsKorSzabaly();
            const szabNev = ref.ageRule === 'EUROPEAN' ? 'Európai szabály' : 'Japán szabály';
            korInfo.innerText = (kor !== null) ? `Versenynapon: ${kor} éves (${szabNev})` : '';
        } else {
            korInfo.innerText = '';
        }
    }
    frissitAdminKategoriaAjanlas();
}

function frissitAdminKategoriaAjanlas(meglevoBepipalt = null) {
    const cbCont = document.getElementById('adminUjVersenyzoKatCheckboxes');
    if (!cbCont) return;

    const bepipalt = Array.isArray(meglevoBepipalt)
        ? meglevoBepipalt
        : Array.from(cbCont.querySelectorAll('input:checked')).map(c => parseInt(c.value, 10));
    const lezarva = TatamiMaster.isNevezesLezarva();

    const sulyVal = document.getElementById('ujVersenyzoSuly')?.value || '';
    const szulVal = lekerAdminUrlapSzulErtek();
    const nemVal = document.getElementById('ujVersenyzoNem')?.value || '';
    const vanBemenet = Boolean(sulyVal || szulVal || nemVal);

    const ajanlas = vanBemenet
        ? TatamiMaster.ajanljKategoriakatVersenyzonek(globalKategoriak, szulVal, sulyVal, nemVal)
        : { ajanlottIds: [] };
    const ajanlottSet = new Set(ajanlas.ajanlottIds || []);

    const rendezett = [...globalKategoriak].sort((a, b) => {
        const aAj = ajanlottSet.has(a.id) ? 0 : 1;
        const bAj = ajanlottSet.has(b.id) ? 0 : 1;
        if (aAj !== bAj) return aAj - bAj;
        return a.id - b.id;
    });

    cbCont.innerHTML = rendezett.map(k => {
        const isAj = ajanlottSet.has(k.id);
        const isVegyes = TatamiMaster.isVegyesKategoria(k);
        const ajBadge = isAj
            ? ` <span style="background:#990000;color:#FAF8F5;padding:1px 6px;border-radius:4px;font-size:0.68rem;font-weight:800;">AJÁNLOTT</span>`
            : '';
        const vegyesBadge = isVegyes
            ? ` <span style="background:#18181B;color:#FAF8F5;padding:1px 6px;border-radius:4px;font-size:0.66rem;font-weight:700;">VEGYES</span>`
            : '';
        const extraStyle = isAj ? 'border-color:#990000;background:#FAF5F5;' : '';
        return `
            <label class="kat-check-item" style="${extraStyle}">
                <input type="checkbox" class="admin-uj-kat-cb" value="${k.id}" ${bepipalt.includes(k.id) ? 'checked' : ''} ${lezarva ? 'disabled' : ''}>
                <span><strong>${TatamiMaster.escapeHtml(k.name)}</strong> <small style="color:#52525B;">[${TatamiMaster.escapeHtml(k.matchType)}]</small>${vegyesBadge}${ajBadge}</span>
            </label>
        `;
    }).join('');
}

function alkalmazAdminAjanlottKategoriak() {
    const sulyVal = document.getElementById('ujVersenyzoSuly')?.value || '';
    const szulVal = lekerAdminUrlapSzulErtek();
    const nemVal = document.getElementById('ujVersenyzoNem')?.value || '';
    const ajanlas = TatamiMaster.ajanljKategoriakatVersenyzonek(globalKategoriak, szulVal, sulyVal, nemVal);
    if (!ajanlas.ajanlottIds || ajanlas.ajanlottIds.length === 0) {
        TatamiMaster.toast("Add meg a születési dátumot és/vagy testsúlyt az ajánláshoz!", "figyelem");
        return [];
    }
    frissitAdminKategoriaAjanlas(ajanlas.ajanlottIds);
    TatamiMaster.toast(`${ajanlas.ajanlottIds.length} ajánlott kategória automatikusan kijelölve!`);
    return ajanlas.ajanlottIds;
}

// =========================================================
// 1. FÜL: VERSENYZŐK BETÖLTÉSE ÉS FELVÉTELE
// =========================================================
let aktivVersenyzoSzuro = 'ALL';

function szamolKategoriaLetszamMap() {
    const map = {};
    for (const n of (globalNevezesek || [])) {
        map[n.categoryId] = (map[n.categoryId] || 0) + 1;
    }
    return map;
}

function allitVersenyzoSzuro(szuro) {
    aktivVersenyzoSzuro = szuro || 'ALL';
    versenyzokBetoltese();
}

function ugrasArvaPanelre() {
    const tabSec = document.getElementById('tab-versenyzok');
    if (tabSec && tabSec.style.display === 'none' && typeof toggleAccordionTab === 'function') {
        toggleAccordionTab('tab-versenyzok');
    }
    const panel = document.getElementById('arvaEsBesorolatlanPanel');
    if (panel && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function kovetkeztetKategoriaCimket(versenyzokLista) {
    const esc = (s) => s;
    const aktEv = new Date().getFullYear();
    const korok = [];
    let kataCount = 0;
    let totalKatCount = 0;
    let noiPont = 0;
    let ferfiPont = 0;

    for (const v of versenyzokLista) {
        const vKor = TatamiMaster.szamolVersenyzoKor(v);
        if (vKor !== null && vKor > 0) {
            korok.push(vKor);
        } else if (v.birthYear && Number(v.birthYear) > 1920) {
            korok.push(aktEv - Number(v.birthYear));
        }
        const vNevs = (globalNevezesek || []).filter(n => n.competitorId === v.id);
        for (const n of vNevs) {
            const k = (globalKategoriak || []).find(x => x.id === n.categoryId);
            if (!k) continue;
            totalKatCount++;
            if (k.matchType && k.matchType.toUpperCase() === 'KATA') kataCount++;
            const g = String(k.gender || k.name || '').toLowerCase();
            if (g.includes('lány') || g.includes('lany') || g.includes('nő') || g.includes('noi') || g.includes('girl') || g.includes('women')) {
                noiPont++;
            } else if (g.includes('fiú') || g.includes('fiu') || g.includes('férfi') || g.includes('ferfi') || g.includes('boy') || g.includes('men')) {
                ferfiPont++;
            }
        }
    }

    const matchType = (totalKatCount > 0 && kataCount === totalKatCount) ? 'KATA' : 'KUMITE';
    const gender = (noiPont > 0 && ferfiPont === 0) ? 'Női' : ((ferfiPont > 0 && noiPont === 0) ? 'Férfi' : 'Vegyes');
    const minAge = korok.length > 0 ? Math.max(5, Math.min(...korok)) : 6;
    const maxAge = korok.length > 0 ? Math.min(99, Math.max(...korok)) : 99;
    const nemSzoveg = gender === 'Női' ? ' Lány/Női' : (gender === 'Férfi' ? ' Fiú/Férfi' : '');
    const korSzoveg = korok.length > 0 ? ` (${minAge === maxAge ? minAge + ' év' : minAge + '-' + maxAge + ' év'})` : '';
    const javasoltNev = esc(`Összevont ${matchType === 'KATA' ? 'Kata' : 'Kumite'}${nemSzoveg}${korSzoveg}`);

    return { javasoltNev, matchType, gender, minAge, maxAge };
}

function frissitArvaOsszevonoJavaslat() {
    const inp = document.getElementById('osszevontKategoriaNevInput');
    if (!inp || inp.dataset.manualEdit === '1') return;

    const celIds = new Set(
        Array.from(document.querySelectorAll('.arva-osszevon-cb:checked'))
            .map(cb => parseInt(cb.value, 10))
            .filter(n => !isNaN(n))
    );
    const extraId = parseInt(document.getElementById('arvaPluszVersenyzoSelect')?.value || '', 10);
    if (!isNaN(extraId) && extraId > 0) celIds.add(extraId);

    const kivalasztottak = (globalVersenyzok || []).filter(v => celIds.has(v.id));
    if (kivalasztottak.length > 0) {
        const info = kovetkeztetKategoriaCimket(kivalasztottak);
        inp.value = info.javasoltNev;
    } else if (inp.value.startsWith('Összevont ')) {
        inp.value = '';
    }
}

async function takaritUresKategoriakat(katIdSet, atmozgatottRegIdk = new Set()) {
    for (const katId of katIdSet) {
        const maradtNev = (globalNevezesek || []).filter(n => n.categoryId === katId && !atmozgatottRegIdk.has(n.id));
        const vanMeccs = (globalMerkozesek || []).some(m => m.categoryId === katId);
        if (maradtNev.length === 0 && !vanMeccs) {
            await TatamiMaster.apiSend('Categories/' + katId, 'DELETE', null, { csendes404: true });
        }
    }
}

function frissitArvaEsBesorolatlanPanel(letszamMap = null) {
    const panel = document.getElementById('arvaEsBesorolatlanPanel');
    const katPanel = document.getElementById('arvaEsBesorolatlanPanelKat');
    const lMap = letszamMap || szamolKategoriaLetszamMap();
    const esc = (s) => TatamiMaster.escapeHtml(s);
    const aktEv = new Date().getFullYear();

    const erintettLista = [];
    for (const v of (globalVersenyzok || [])) {
        const vNevs = (globalNevezesek || []).filter(n => n.competitorId === v.id);
        const soloNevs = vNevs.filter(n => (lMap[n.categoryId] || 0) === 1);
        if (vNevs.length === 0 || soloNevs.length > 0) {
            erintettLista.push({ v, isUnassigned: vNevs.length === 0, soloNevs });
        }
    }

    if (katPanel) {
        if (erintettLista.length > 0) {
            katPanel.innerHTML = `<div style="background:#FAF5F5;border:1.5px solid #990000;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <div style="color:#18181B;font-size:0.9rem;">
                    <strong style="color:#990000;">${TatamiMaster.icon('alert', 15)} Figyelem: ${erintettLista.length} versenyzőnek nincs súlycsoportja / kategóriája vagy 1 fős kategóriában egyedül áll!</strong>
                    <div style="font-size:0.82rem;color:#52525B;margin-top:2px;">A 2. Menüben 1 kattintással áthelyezheted őket vagy összerakhatsz eltérő korú/súlyú versenyzőket közös kategóriába.</div>
                </div>
                <button type="button" class="btn btn-outline-blue" style="padding:7px 14px;font-size:0.84rem;" onclick="ugrasArvaPanelre()">Áthelyező &amp; Összevonó megnyitása</button>
            </div>`;
        } else {
            katPanel.innerHTML = '';
        }
    }

    if (!panel) return;

    if ((globalVersenyzok || []).length === 0) {
        panel.innerHTML = '';
        return;
    }

    if (erintettLista.length === 0) {
        panel.innerHTML = `<div style="background:#FAF8F5;border:1px solid #CFC9BC;border-radius:8px;padding:10px 14px;font-size:0.85rem;color:#27272A;display:flex;align-items:center;gap:8px;">
            ${TatamiMaster.icon('check', 15)} <span>Minden versenyző legalább 2 fős kategóriába van besorolva (nincs súlycsoport nélküli vagy egyedül álló induló).</span>
        </div>`;
        return;
    }

    const katOpciokHtml = (globalKategoriak || []).map(k => {
        const db = lMap[k.id] || 0;
        const tipus = (k.matchType || 'KUMITE').toUpperCase();
        return `<option value="${k.id}">${esc(k.name)} (${tipus}, ${k.minAge || '?'}-${k.maxAge || '?'} év, ${db} fő)</option>`;
    }).join('');

    const erintettIds = new Set(erintettLista.map(x => x.v.id));
    const tobbiVersenyzoOpciok = (globalVersenyzok || [])
        .filter(v => !erintettIds.has(v.id))
        .map(v => `<option value="${v.id}">${esc(v.name)} (${v.birthYear || '-'}, ${v.weight || 0} kg, ${esc(v.club || '-')})</option>`)
        .join('');

    const sorokHtml = erintettLista.map(item => {
        const v = item.v;
        const kor = TatamiMaster.szamolVersenyzoKor(v) || (v.birthYear ? (aktEv - Number(v.birthYear)) : 0);
        const szulSzoveg = TatamiMaster.formazSzulDatum(v);
        const elsoSoloReg = item.soloNevs[0] || null;
        const soloRegId = elsoSoloReg ? elsoSoloReg.id : 0;
        const soloKat = elsoSoloReg ? (globalKategoriak || []).find(k => k.id === elsoSoloReg.categoryId) : null;
        const allapotCimke = item.isUnassigned
            ? `<span style="background:#990000;color:#FAF8F5;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;">Nincs súlycsoportja / Nincs nevezve</span>`
            : `<span style="background:#FAF5F5;color:#990000;border:1px solid #990000;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;">1 fős: ${esc(soloKat ? soloKat.name : 'Ismeretlen')}</span>`;

        return `<tr>
            <td style="text-align:center;">
                <input type="checkbox" class="arva-osszevon-cb" value="${v.id}" data-reg-id="${soloRegId}" onchange="frissitArvaOsszevonoJavaslat()" style="width:16px;height:16px;accent-color:#18181B;cursor:pointer;">
            </td>
            <td><strong>${esc(v.name)}</strong> <small style="color:#52525B;">(${esc(v.club || '-')})</small></td>
            <td>${kor > 0 ? kor + ' év (' + esc(szulSzoveg) + ')' : esc(szulSzoveg)} &bull; <strong>${v.weight || 0} kg</strong> &bull; ${esc(v.belt || '-')}</td>
            <td>${allapotCimke}</td>
            <td style="white-space:nowrap;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <select id="gyorsCelKat_${v.id}" class="input-field" style="padding:5px 8px;font-size:0.82rem;min-width:190px;">
                        <option value="">-- Célkategória kiválasztása --</option>
                        ${katOpciokHtml}
                    </select>
                    <button type="button" class="btn btn-outline-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="gyorsAthelyezVersenyzo(${v.id}, ${soloRegId})">Áthelyezés</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    panel.innerHTML = `<div style="background:#FAF8F5;border:1.5px solid #990000;border-radius:10px;padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <div>
                <strong style="color:#990000;font-size:0.96rem;display:flex;align-items:center;gap:6px;">
                    ${TatamiMaster.icon('alert', 16)} Súlycsoport nélküli vagy 1 fős kategóriában egyedül álló versenyzők (${erintettLista.length} fő)
                </strong>
                <div style="font-size:0.82rem;color:#52525B;margin-top:2px;">
                    1) Átrakhatod egyesével a sor végén az <strong>„Áthelyezés”</strong> gombbal. &bull; 2) Pipálj be 2 vagy több versenyzőt (akár eltérő korcsoportból is, pl. 14 és 16 éves lány), és rakd össze őket egy közös kategóriába alul!
                </div>
            </div>
        </div>
        <div style="overflow-x:auto;background:#FFFFFF;border:1px solid #E4E0D7;border-radius:8px;margin-bottom:12px;">
            <table class="data-table" style="margin-bottom:0;">
                <thead>
                    <tr>
                        <th style="width:40px;text-align:center;">Jelöl</th>
                        <th>Versenyző (Klub)</th>
                        <th>Kor / Súly / Öv</th>
                        <th>Jelenlegi állapot</th>
                        <th>1 kattintásos áthelyezés</th>
                    </tr>
                </thead>
                <tbody>${sorokHtml}</tbody>
            </table>
        </div>
        <div style="background:#FFFFFF;border:1px solid #E4E0D7;border-radius:8px;padding:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
            <div style="flex:1.4;min-width:210px;">
                <label class="admin-field-label" for="osszevontKategoriaNevInput">Közös kategória neve (összevonáshoz)</label>
                <input type="text" id="osszevontKategoriaNevInput" class="input-field" placeholder="Pl. Összevont Kumite Lány (14-16 év)" oninput="this.dataset.manualEdit='1'">
            </div>
            <div style="flex:1.3;min-width:210px;">
                <label class="admin-field-label" for="osszevontCelKategoriaSelect">Vagy meglévő célkategória használata</label>
                <select id="osszevontCelKategoriaSelect" class="input-field">
                    <option value="">-- Új kategória létrehozása a fenti névvel --</option>
                    ${katOpciokHtml}
                </select>
            </div>
            ${tobbiVersenyzoOpciok ? `<div style="flex:1.2;min-width:200px;">
                <label class="admin-field-label" for="arvaPluszVersenyzoSelect">+ Társ hozzáadása a listából (opcionális)</label>
                <select id="arvaPluszVersenyzoSelect" class="input-field" onchange="frissitArvaOsszevonoJavaslat()">
                    <option value="">-- Csak a fent kipipáltak --</option>
                    ${tobbiVersenyzoOpciok}
                </select>
            </div>` : ''}
            <div>
                <button type="button" class="btn btn-outline-green" style="padding:10px 16px;font-size:0.88rem;" onclick="osszevonKijeloltVersenyzok()">
                    ${TatamiMaster.icon('check', 15)} Kijelöltek Összerakása Közös Kategóriába
                </button>
            </div>
        </div>
    </div>`;
}

async function gyorsAthelyezVersenyzo(versenyzoId, regiRegId = 0) {
    const sel = document.getElementById('gyorsCelKat_' + versenyzoId);
    const celKatId = parseInt(sel?.value || '', 10);
    if (!celKatId) {
        TatamiMaster.toast('Válassz egy célkategóriát az áthelyezéshez!', 'figyelem');
        return;
    }

    const v = (globalVersenyzok || []).find(x => x.id === versenyzoId);
    const celKat = (globalKategoriak || []).find(k => k.id === celKatId);
    const letszamMap = szamolKategoriaLetszamMap();
    const regiReg = regiRegId ? (globalNevezesek || []).find(n => n.id === regiRegId) : null;

    if (regiReg && regiReg.categoryId === celKatId) {
        TatamiMaster.toast('A versenyző már ebben a kategóriában szerepel!', 'figyelem');
        return;
    }

    const marBenne = (globalNevezesek || []).find(n => n.competitorId === versenyzoId && n.categoryId === celKatId);
    let ok = true;
    if (marBenne) {
        if (regiReg) {
            const delRes = await TatamiMaster.apiSend('Registrations/' + regiReg.id, 'DELETE', null, { csendes404: true });
            ok = delRes.ok;
        }
    } else if (regiReg) {
        const putRes = await TatamiMaster.apiSend('Registrations/' + regiReg.id, 'PUT', {
            id: regiReg.id,
            competitorId: versenyzoId,
            categoryId: celKatId
        });
        ok = putRes.ok;
    } else {
        const postRes = await TatamiMaster.apiSend('Registrations', 'POST', {
            competitorId: versenyzoId,
            categoryId: celKatId
        });
        ok = postRes.ok;
    }

    if (ok) {
        if (regiReg && (letszamMap[regiReg.categoryId] || 0) <= 1) {
            await takaritUresKategoriakat(new Set([regiReg.categoryId]), new Set([regiReg.id]));
        }
        TatamiMaster.toast(`${v ? v.name : '#' + versenyzoId} áthelyezve ide: ${celKat ? celKat.name : '#' + celKatId}`);
        await mindenAdatFrissitese();
    }
}

async function osszevonKijeloltVersenyzok() {
    const cbs = Array.from(document.querySelectorAll('.arva-osszevon-cb:checked'));
    const extraId = parseInt(document.getElementById('arvaPluszVersenyzoSelect')?.value || '', 10);
    const celKatSelVal = parseInt(document.getElementById('osszevontCelKategoriaSelect')?.value || '', 10);
    const egyediNev = (document.getElementById('osszevontKategoriaNevInput')?.value || '').trim();

    const selIds = [...new Set([
        ...cbs.map(cb => parseInt(cb.value, 10)).filter(n => !isNaN(n) && n > 0),
        ...(!isNaN(extraId) && extraId > 0 ? [extraId] : [])
    ])];

    if (!celKatSelVal && selIds.length < 2) {
        TatamiMaster.toast('Jelölj ki legalább 2 versenyzőt az összerakáshoz (vagy válassz meglévő célkategóriát)!', 'figyelem');
        return;
    }
    if (selIds.length === 0) {
        TatamiMaster.toast('Jelölj ki legalább 1 versenyzőt!', 'figyelem');
        return;
    }

    const kivalasztottak = (globalVersenyzok || []).filter(v => selIds.includes(v.id));
    const info = kovetkeztetKategoriaCimket(kivalasztottak);
    let celKatId = (!isNaN(celKatSelVal) && celKatSelVal > 0) ? celKatSelVal : 0;
    let celKatNev = '';

    if (!celKatId) {
        celKatNev = egyediNev || info.javasoltNev;
        const katRes = await TatamiMaster.apiSend('Categories', 'POST', {
            name: celKatNev,
            matchType: info.matchType,
            gender: info.gender,
            minAge: info.minAge,
            maxAge: info.maxAge
        });
        if (!katRes.ok) return;
        const letrejott = await katRes.json();
        celKatId = letrejott.id;
    } else {
        const meglevoKat = (globalKategoriak || []).find(k => k.id === celKatId);
        celKatNev = meglevoKat ? meglevoKat.name : ('#' + celKatId);
    }

    const letszamMap = szamolKategoriaLetszamMap();
    const kiuritettKatIdk = new Set();
    const atmozgatottRegIdk = new Set();

    for (const compId of selIds) {
        const marBenne = (globalNevezesek || []).some(n => n.competitorId === compId && n.categoryId === celKatId);
        if (marBenne) continue;

        const soloReg = (globalNevezesek || []).find(n => n.competitorId === compId && (letszamMap[n.categoryId] || 0) === 1 && n.categoryId !== celKatId);
        if (soloReg) {
            const putRes = await TatamiMaster.apiSend('Registrations/' + soloReg.id, 'PUT', {
                id: soloReg.id,
                competitorId: compId,
                categoryId: celKatId
            });
            if (putRes.ok) {
                kiuritettKatIdk.add(soloReg.categoryId);
                atmozgatottRegIdk.add(soloReg.id);
            }
        } else {
            await TatamiMaster.apiSend('Registrations', 'POST', {
                competitorId: compId,
                categoryId: celKatId
            });
        }
    }

    await takaritUresKategoriakat(kiuritettKatIdk, atmozgatottRegIdk);

    TatamiMaster.toast(`${selIds.length} versenyző összerakva a(z) „${celKatNev}” kategóriába!`);
    await mindenAdatFrissitese();
}

async function gyorsNevezesKategoriaValtas(nevezesId) {
    const reg = (globalNevezesek || []).find(n => n.id === nevezesId);
    const celKatId = parseInt(document.getElementById('nevAthelyezSelect_' + nevezesId)?.value || '', 10);
    if (!reg || !celKatId) {
        TatamiMaster.toast('Válassz új célkategóriát!', 'figyelem');
        return;
    }
    if (reg.categoryId === celKatId) {
        TatamiMaster.toast('A nevezés már ebben a kategóriában van!', 'figyelem');
        return;
    }
    const duplikalt = (globalNevezesek || []).some(n => n.competitorId === reg.competitorId && n.categoryId === celKatId && n.id !== nevezesId);
    if (duplikalt) {
        TatamiMaster.toast('Ez a versenyző már szerepel a kiválasztott kategóriában!', 'figyelem');
        return;
    }
    const res = await TatamiMaster.apiSend('Registrations/' + nevezesId, 'PUT', {
        id: nevezesId,
        competitorId: reg.competitorId,
        categoryId: celKatId
    });
    if (res.ok) {
        TatamiMaster.toast('Nevezés sikeresen áthelyezve!');
        await mindenAdatFrissitese();
    }
}

function versenyzokBetoltese() {
    const tbody = document.getElementById('versenyzokTbody');
    const letszamMap = szamolKategoriaLetszamMap();
    const esc = (s) => TatamiMaster.escapeHtml(s);

    const nincsKatDb = (globalVersenyzok || []).filter(v => !(globalNevezesek || []).some(n => n.competitorId === v.id)).length;
    const egyedulDb = (globalVersenyzok || []).filter(v =>
        (globalNevezesek || []).some(n => n.competitorId === v.id && (letszamMap[n.categoryId] || 0) === 1)
    ).length;

    const btnOsszes = document.getElementById('btnSzuroOsszes');
    const btnNincs = document.getElementById('btnSzuroNincsKat');
    const btnEgyedul = document.getElementById('btnSzuroEgyedul');
    if (btnOsszes) {
        btnOsszes.innerText = `Összes (${(globalVersenyzok || []).length})`;
        btnOsszes.style.background = aktivVersenyzoSzuro === 'ALL' ? '#18181B' : '';
        btnOsszes.style.color = aktivVersenyzoSzuro === 'ALL' ? '#FAF8F5' : '';
    }
    if (btnNincs) {
        btnNincs.innerText = `Nincs súlycsoportja / Nincs nevezve (${nincsKatDb})`;
        btnNincs.style.background = aktivVersenyzoSzuro === 'UNASSIGNED' ? '#990000' : '';
        btnNincs.style.color = aktivVersenyzoSzuro === 'UNASSIGNED' ? '#FAF8F5' : (nincsKatDb > 0 ? '#990000' : '');
    }
    if (btnEgyedul) {
        btnEgyedul.innerText = `Egyedül állók (${egyedulDb})`;
        btnEgyedul.style.background = aktivVersenyzoSzuro === 'SOLO' ? '#990000' : '';
        btnEgyedul.style.color = aktivVersenyzoSzuro === 'SOLO' ? '#FAF8F5' : (egyedulDb > 0 ? '#990000' : '');
    }

    frissitArvaEsBesorolatlanPanel(letszamMap);
    if (!tbody) return;

    const kereso = (document.getElementById('adminVersenyzoKereso')?.value || '').toLowerCase().trim();
    const szurt = globalVersenyzok.filter(v => {
        const egyezikSzoveg = !kereso ||
            (v.name && v.name.toLowerCase().includes(kereso)) ||
            (v.club && v.club.toLowerCase().includes(kereso)) ||
            (v.belt && v.belt.toLowerCase().includes(kereso));
        if (!egyezikSzoveg) return false;

        if (aktivVersenyzoSzuro === 'UNASSIGNED') {
            return !(globalNevezesek || []).some(n => n.competitorId === v.id);
        }
        if (aktivVersenyzoSzuro === 'SOLO') {
            return (globalNevezesek || []).some(n => n.competitorId === v.id && (letszamMap[n.categoryId] || 0) === 1);
        }
        return true;
    });

    if (szurt.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#71717A;padding:20px;">Nincs megjeleníthető versenyző.</td></tr>`;
    } else {
        let html = "";
        for (let v of szurt) {
            const nevezettKatNevek = globalNevezesek
                .filter(n => n.competitorId === v.id)
                .map(n => {
                    const kat = globalKategoriak.find(k => k.id === n.categoryId);
                    if (!kat) return '';
                    const db = letszamMap[kat.id] || 0;
                    if (db === 1) {
                        return `<span style="background:#FAF5F5;color:#990000;border:1.5px solid #990000;padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:700;display:inline-block;margin:2px;">${esc(kat.name)} (EGYEDÜL - 1 fő!)</span>`;
                    }
                    return `<span style="background:#F3F0EA;border:1px solid #E4E0D7;padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:600;display:inline-block;margin:2px;">${esc(kat.name)} (${db} fő)</span>`;
                }).join(' ') || '<span style="background:#FAF5F5;color:#990000;border:1px solid #DC2626;padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:700;display:inline-block;">Nincs nevezve / Nincs súlycsoportja</span>';

            html += `<tr>
                <td><strong>#${v.id}</strong></td>
                <td><strong>${esc(v.name)}</strong></td>
                <td>${esc(v.club || '-')}</td>
                <td><span style="background:#F3F0EA;color:#18181B;border:1px solid #CFC9BC;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.84rem;">${esc(v.belt || '-')}</span></td>
                <td><strong>${v.weight} kg</strong></td>
                <td>${esc(TatamiMaster.formazSzulDatumEsKor(v))}</td>
                <td>${nevezettKatNevek}</td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztVersenyzoTeljes(${v.id})">${TatamiMaster.icon('edit', 14)} Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Competitors', ${v.id})" title="Versenyző törlése">${TatamiMaster.icon('trash', 14)} Törlés</button>
                </td>
            </tr>`;
        }
        tbody.innerHTML = html;
    }
}

async function hozzadVersenyzo() {
    if (TatamiMaster.isNevezesLezarva()) {
        TatamiMaster.toast("A nevezés le van zárva (vagy lejárt a nevezési határidő)! Új versenyző felvételéhez előbb nyisd meg a nevezést.", "hiba");
        return;
    }

    const nev = document.getElementById('ujVersenyzoNev').value.trim();
    const klub = document.getElementById('ujVersenyzoKlub').value.trim() || "Shobu HSE";
    const ov = document.getElementById('ujVersenyzoOv').value.trim() || "10. kyu";
    const suly = parseInt(document.getElementById('ujVersenyzoSuly').value) || 60;
    const nyersSzul = lekerAdminUrlapSzulErtek() || '2008';
    const szulNorm = TatamiMaster.normalizalSzulDatum(nyersSzul);
    const szulEv = szulNorm.birthYear || 2008;
    const szulDatum = szulNorm.hasFullDate ? szulNorm.birthDate : '';
    const nem = document.getElementById('ujVersenyzoNem')?.value || '';

    if (!nev) {
        TatamiMaster.toast("Add meg a versenyző nevét!", "figyelem");
        return;
    }

    const kijeloltKatIdk = Array.from(document.querySelectorAll('.admin-uj-kat-cb:checked')).map(cb => parseInt(cb.value));

    const res = await TatamiMaster.apiSend('Competitors', 'POST', {
        name: nev, club: klub, belt: ov, weight: suly, birthYear: szulEv, birthDate: szulDatum, gender: nem
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
        const szulDatumEl = document.getElementById('ujVersenyzoSzulDatum');
        if (szulDatumEl) szulDatumEl.value = '';
        const szulEvEl = document.getElementById('ujVersenyzoSzulEv');
        if (szulEvEl) szulEvEl.value = '';
        const korInfoEl = document.getElementById('ujVersenyzoKorInfo');
        if (korInfoEl) korInfoEl.innerText = '';
        document.querySelectorAll('.admin-uj-kat-cb').forEach(cb => cb.checked = false);

        TatamiMaster.toast(`${nev} felvéve` + (kijeloltKatIdk.length > 0 ? ` és benevezve ${kijeloltKatIdk.length} kategóriába!` : '!'));
        await mindenAdatFrissitese();
    }
}

// =========================================================
// 1.1 TÖMEGES EXCEL / CSV NEVEZÉS IMPORTÁLÁS ÉS EXPORTÁLÁS
// =========================================================
function letoltMintaNevezesCsv() {
    const fejlec = ['Név', 'Klub', 'Övfokozat', 'Testsúly (kg)', 'Születési dátum (ÉÉÉÉ-HH-NN)', 'Nem', 'Kategória / Típus'];
    const mintaSorok = [
        ['Minta Bence', 'Shobu HSE', '4. kyu', '64', '2010-11-22', 'Férfi', 'KATA + KUMITE'],
        ['Kiss Anna', 'Budai Dojo', '6. kyu', '48', '2012-05-14', 'Női', 'KUMITE'],
        ['Nagy Gábor', 'Debreceni Kyokushin', '1. dan', '82', '1998-03-09', 'Férfi', 'KATA + KUMITE']
    ];
    return TatamiMaster.letoltCsvFajl('TATAMI_MASTER_nevezes_minta.csv', fejlec, mintaSorok);
}

async function importNevezesCsvSzovegbol(csvSzoveg) {
    if (TatamiMaster.isNevezesLezarva()) {
        TatamiMaster.toast("A nevezés le van zárva! Importáláshoz előbb nyisd meg a nevezést.", "hiba");
        return { felvettVersenyzo: 0, felvettNevezes: 0 };
    }
    const sorok = TatamiMaster.parseNevezesCsvSzoveg(csvSzoveg);
    if (sorok.length === 0) {
        TatamiMaster.toast("A CSV fájl nem tartalmaz érvényes versenyzői adatsorokat!", "figyelem");
        return { felvettVersenyzo: 0, felvettNevezes: 0 };
    }

    let felvettVersenyzo = 0;
    let felvettNevezes = 0;

    for (const sor of sorok) {
        const res = await TatamiMaster.apiSend('Competitors', 'POST', {
            name: sor.name,
            club: sor.club,
            belt: sor.belt,
            weight: sor.weight,
            birthYear: sor.birthYear,
            birthDate: sor.birthDate || '',
            gender: sor.gender || ''
        });
        if (!res || !res.ok) continue;
        const mentett = await res.json();
        felvettVersenyzo++;

        let celKatIds = [];
        const celSzoveg = String(sor.targetText || '').trim();
        const celLower = celSzoveg.toLowerCase();

        const direktKat = globalKategoriak.filter(k =>
            celLower && celLower !== 'kata' && celLower !== 'kumite' && celLower !== 'kata + kumite' &&
            (String(k.name || '').toLowerCase() === celLower || celLower.includes(String(k.name || '').toLowerCase()))
        );

        if (direktKat.length > 0) {
            celKatIds = direktKat.map(k => k.id);
        } else {
            const ajanlas = TatamiMaster.ajanljKategoriakatVersenyzonek(globalKategoriak, sor.birthDate || sor.birthYear, sor.weight, sor.gender);
            const csakKata = celLower.includes('kata') && !celLower.includes('kumite');
            const csakKumite = celLower.includes('kumite') && !celLower.includes('kata');
            if (csakKata) {
                celKatIds = ajanlas.kataIds;
            } else if (csakKumite) {
                celKatIds = ajanlas.kumiteIds;
            } else {
                celKatIds = ajanlas.ajanlottIds;
            }
        }

        for (const katId of celKatIds) {
            const regRes = await TatamiMaster.apiSend('Registrations', 'POST', {
                competitorId: mentett.id,
                categoryId: katId
            });
            if (regRes && regRes.ok) felvettNevezes++;
        }
    }

    await mindenAdatFrissitese();
    TatamiMaster.toast(`CSV import kész: ${felvettVersenyzo} versenyző és ${felvettNevezes} nevezés rögzítve!`);
    return { felvettVersenyzo, felvettNevezes };
}

async function inditTomegesCsvImport() {
    const inp = document.getElementById('csvImportFileInput');
    if (!inp || !inp.files || !inp.files[0]) {
        TatamiMaster.toast("Először válassz ki egy CSV / szöveges fájlt az importáláshoz!", "figyelem");
        return;
    }
    const file = inp.files[0];
    const szoveg = await file.text();
    await importNevezesCsvSzovegbol(szoveg);
    inp.value = '';
}

function exportVersenyzokCsv() {
    const fejlec = ['ID', 'Versenyző Neve', 'Klub / Egyesület', 'Övfokozat', 'Testsúly (kg)', 'Születési dátum / év', 'Kor a verseny napján', 'Nevezett Kategóriák'];
    const sorok = (globalVersenyzok || []).map(v => {
        const katNevek = (globalNevezesek || [])
            .filter(n => n.competitorId === v.id)
            .map(n => {
                const k = globalKategoriak.find(x => x.id === n.categoryId);
                return k ? `${k.name} [${k.matchType}]` : '';
            })
            .filter(Boolean)
            .join(' | ');
        const kor = TatamiMaster.szamolVersenyzoKor(v);
        return [
            v.id,
            v.name,
            v.club || '',
            v.belt || '',
            v.weight || '',
            TatamiMaster.formazSzulDatum(v),
            kor !== null ? `${kor} év` : '',
            katNevek || 'Nincs nevezve'
        ];
    });
    const vId = TatamiMaster.lekerAktualisVersenyId();
    return TatamiMaster.letoltCsvFajl(`TATAMI_MASTER_versenyzok_v${vId}.csv`, fejlec, sorok);
}

function exportMenetrendCsv() {
    const idopontMap = TatamiMaster.becsulMeccsTatamiIdopontok(globalTatamik, globalKategoriak, globalMerkozesek);
    const fejlec = ['Tatami', 'Meccs Sorszám', 'Kategória', 'Típus', 'AKA (Piros / Katázó)', 'AKA Klub', 'SHIRO (Fehér)', 'SHIRO Klub', 'Állapot', 'Győztes', 'Várható kezdés'];
    const rendezett = [...(globalMerkozesek || [])].sort((a, b) => (a.tatamiId - b.tatamiId) || (a.matchOrder - b.matchOrder) || (a.id - b.id));
    const sorok = rendezett.map(m => {
        const tat = globalTatamik.find(t => t.id === m.tatamiId);
        const kat = globalKategoriak.find(k => k.id === m.categoryId);
        const v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
        const v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);
        const gy = globalVersenyzok.find(v => v.id === m.winnerId);
        const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        const idoAdat = idopontMap[m.id];
        return [
            tat ? tat.name : `Tatami #${m.tatamiId}`,
            m.matchOrder,
            kat ? kat.name : '-',
            isKata ? (TatamiMaster.isKataDontoMeccs(m.id) ? 'KATA TOP 6 DÖNTŐ' : 'KATA SELEJTEZŐ') : 'KUMITE',
            v1 ? v1.name : 'Várakozik...',
            v1 ? (v1.club || '') : '',
            isKata ? '-' : (v2 ? v2.name : (m.isFinished ? 'Erőnyerő' : 'Várakozik...')),
            isKata ? '' : (v2 ? (v2.club || '') : ''),
            m.isFinished ? 'Kész' : 'Várakozik',
            m.isFinished ? (gy ? gy.name : 'Erőnyerő') : '-',
            m.isFinished ? 'Lezajlott' : (idoAdat ? `~${idoAdat.varhatoIdo}` : '-')
        ];
    });
    const vId = TatamiMaster.lekerAktualisVersenyId();
    return TatamiMaster.letoltCsvFajl(`TATAMI_MASTER_menetrend_v${vId}.csv`, fejlec, sorok);
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
                    <button type="button" class="btn btn-outline-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="nyomtatKategoriaAgrajz(${k.id})" title="Kategória ágrajzának és indulóinak tiszta nyomtatása">${TatamiMaster.icon('print', 14)} Nyomtatás</button>
                    <button class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;" onclick="szerkesztKategoriaTeljes(${k.id})">${TatamiMaster.icon('edit', 14)} Szerkesztés</button>
                    <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem;" onclick="torolElem('Categories', ${k.id})" title="Kategória törlése">${TatamiMaster.icon('trash', 14)} Törlés</button>
                </td>
            </tr>`;
        }
        tbody.innerHTML = html || `<tr><td colspan="7" style="text-align:center;color:#71717A;">Még nincs kategória.</td></tr>`;
    }

    const opciok = '<option value="">-- Válassz kategóriát! --</option>' +
        globalKategoriak.map(k => `<option value="${k.id}">${k.name} (${k.matchType})</option>`).join('');

    ['bontandoKategoriaSelect', 'sorsolasKategoriaSelect', 'agrajzKategoriaSelect'].forEach(selId => {
        const el = document.getElementById(selId);
        if (el) {
            const regi = el.value;
            el.innerHTML = opciok;
            if (regi) el.value = regi;
        }
    });

    const kyuSel = document.getElementById('kyuBontoKatSelectAdmin');
    if (kyuSel) {
        const regiKyu = kyuSel.value;
        const kataKatok = globalKategoriak.filter(k => k.matchType && k.matchType.toUpperCase() === 'KATA');
        kyuSel.innerHTML = '<option value="">-- Válassz Kata kategóriát! --</option>' +
            kataKatok.map(k => {
                const db = globalNevezesek.filter(n => n.categoryId === k.id).length;
                return `<option value="${k.id}">${k.name} (${db} fő)</option>`;
            }).join('');
        if (regiKyu) kyuSel.value = regiKyu;
    }
}

function kitoltCsipeszharcSablon(tipus = 'OVIS') {
    const nevEl = document.getElementById('ujKategoriaNev');
    const tipEl = document.getElementById('ujKategoriaTipus');
    const nemEl = document.getElementById('ujKategoriaNem');
    const minEl = document.getElementById('ujKategoriaMinKor');
    const maxEl = document.getElementById('ujKategoriaMaxKor');

    if (tipus === 'GYEREK') {
        if (nevEl) nevEl.value = 'Kisiskolás Csipeszharc (Vegyes - Fiú és Lány)';
        if (minEl) minEl.value = '6';
        if (maxEl) maxEl.value = '8';
    } else {
        if (nevEl) nevEl.value = 'Ovis Csipeszharc (Vegyes - Fiú és Lány)';
        if (minEl) minEl.value = '4';
        if (maxEl) maxEl.value = '6';
    }
    if (tipEl) tipEl.value = 'KUMITE';
    if (nemEl) nemEl.value = 'Vegyes';
    if (nevEl) nevEl.focus();
    TatamiMaster.toast("Vegyes Csipeszharc sablon betöltve! Kattints a „Kategória Hozzáadása” gombra a mentéshez.");
}

async function hozzadKategoria() {
    const nev = document.getElementById('ujKategoriaNev').value.trim();
    const tipus = document.getElementById('ujKategoriaTipus').value;
    const nem = document.getElementById('ujKategoriaNem').value;
    const minKor = parseInt(document.getElementById('ujKategoriaMinKor').value, 10);
    const maxKor = parseInt(document.getElementById('ujKategoriaMaxKor').value, 10);

    if (!nev) {
        TatamiMaster.toast("Add meg a kategória nevét!", "figyelem");
        return;
    }

    const res = await TatamiMaster.apiSend('Categories', 'POST', {
        name: nev,
        matchType: tipus,
        gender: nem || 'Vegyes',
        minAge: !isNaN(minKor) && minKor >= 0 ? minKor : 4,
        maxAge: !isNaN(maxKor) && maxKor > 0 ? maxKor : 99
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
        cont.innerHTML = `<div style="color:#990000;font-weight:700;padding:8px;display:flex;align-items:center;gap:6px;">${TatamiMaster.icon('alert', 16)} Ebben a kategóriában jelenleg nincs benevezett versenyző!</div>`;
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
            keretSzin = '#990000';
            hatterSzin = '#FAF5F5';
            statuszBadge = `<span style="background:#990000;color:white;padding:2px 7px;border-radius:10px;font-size:0.75rem;font-weight:700;">${TatamiMaster.icon('alert', 12)} EGYEDÜL VAN (1 fő)!</span>`;
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

async function kataKyuBontasVegrehajtasAdmin() {
    const katId = parseInt(document.getElementById('kyuBontoKatSelectAdmin')?.value);
    const bontasMod = document.getElementById('kyuBontasModSelectAdmin')?.value || 'ABC';

    if (!katId) {
        TatamiMaster.toast("Válassz ki egy Kata kategóriát a bontáshoz!", "figyelem");
        return;
    }

    const eredetiKat = globalKategoriak.find(k => k.id === katId);
    const katNevezesek = globalNevezesek.filter(n => n.categoryId === katId);
    if (!eredetiKat || katNevezesek.length === 0) {
        TatamiMaster.toast("Ebben a Kata kategóriában még nincs benevezett versenyző!", "hiba");
        return;
    }

    const alapCsoportok = (bontasMod === 'ABC') ? [
        { utotag: ' - A kategória (2. kyu - Dan)', minKyu: 0, maxKyu: 2 },
        { utotag: ' - B kategória (6-3. kyu)',     minKyu: 3, maxKyu: 6 },
        { utotag: ' - C kategória (10-7. kyu)',    minKyu: 7, maxKyu: 12 }
    ] : [
        { utotag: ' - A kategória (5. kyu - Dan)', minKyu: 0, maxKyu: 5 },
        { utotag: ' - B kategória (10-6. kyu)',    minKyu: 6, maxKyu: 12 }
    ];

    const aktivCsoportok = alapCsoportok.map(cs => ({
        ...cs,
        nevezesek: katNevezesek.filter(n => {
            const v = globalVersenyzok.find(x => x.id === n.competitorId);
            const kyu = TatamiMaster.parseKyuSzam(v ? v.belt : '10. kyu');
            return kyu >= cs.minKyu && kyu <= cs.maxKyu;
        })
    })).filter(cs => cs.nevezesek.length > 0);

    if (aktivCsoportok.length <= 1) {
        TatamiMaster.toast("Minden induló ugyanabba az övcsoportba esik, így nincs szükség bontásra.", "figyelem");
        return;
    }

    const alapNev = eredetiKat.name.split(' - ')[0];
    await TatamiMaster.apiSend('Categories/' + eredetiKat.id, 'PUT', {
        id: eredetiKat.id,
        name: alapNev + aktivCsoportok[0].utotag,
        matchType: eredetiKat.matchType || 'KATA',
        gender: eredetiKat.gender,
        minAge: eredetiKat.minAge,
        maxAge: eredetiKat.maxAge
    });

    let atsorolva = 0;
    for (let i = 1; i < aktivCsoportok.length; i++) {
        const cs = aktivCsoportok[i];
        const res = await TatamiMaster.apiSend('Categories', 'POST', {
            name: alapNev + cs.utotag,
            matchType: 'KATA',
            gender: eredetiKat.gender,
            minAge: eredetiKat.minAge,
            maxAge: eredetiKat.maxAge
        });
        if (res && res.ok) {
            const ujKat = await res.json();
            for (let nev of cs.nevezesek) {
                await TatamiMaster.apiSend('Registrations/' + nev.id, 'PUT', {
                    id: nev.id,
                    competitorId: nev.competitorId,
                    categoryId: ujKat.id
                });
                atsorolva++;
            }
        }
    }

    TatamiMaster.toast(`Kata Kyu-bontás kész! ${aktivCsoportok.length} övcsoport létrehozva (${atsorolva} fő átsorolva).`);
    const sel = document.getElementById('kyuBontoKatSelectAdmin');
    if (sel) sel.value = '';
    await mindenAdatFrissitese();
}

// =========================================================
// 3. FÜL: NEVEZÉSEK
// =========================================================
function nevezesekBetoltese() {
    const tbody = document.getElementById('nevezesekTbody');
    if (!tbody) return;

    const letszamMap = szamolKategoriaLetszamMap();
    const esc = (s) => TatamiMaster.escapeHtml(s);
    let html = "";
    for (let n of globalNevezesek) {
        const v = globalVersenyzok.find(x => x.id === n.competitorId);
        const k = globalKategoriak.find(x => x.id === n.categoryId);
        const db = k ? (letszamMap[k.id] || 0) : 0;
        const egyedulJelzes = (k && db === 1)
            ? ` <span style="background:#FAF5F5;color:#990000;border:1px solid #990000;padding:1px 6px;border-radius:8px;font-size:0.72rem;font-weight:700;">1 fő</span>`
            : '';

        const opciokHtml = (globalKategoriak || []).map(katOpt =>
            `<option value="${katOpt.id}" ${katOpt.id === n.categoryId ? 'selected' : ''}>${esc(katOpt.name)} (${letszamMap[katOpt.id] || 0} fő)</option>`
        ).join('');

        html += `<tr>
            <td>#${n.id}</td>
            <td><strong>${v ? esc(v.name) : 'Ismeretlen (#' + n.competitorId + ')'}</strong> <small style="color:#52525B;">(${v ? esc(v.club) + ', ' + v.weight + 'kg' : ''})</small></td>
            <td><strong>${k ? esc(k.name) : 'Ismeretlen (#' + n.categoryId + ')'}</strong>${egyedulJelzes}</td>
            <td>${k ? esc(k.matchType) : '-'}</td>
            <td style="white-space:nowrap;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <select id="nevAthelyezSelect_${n.id}" class="input-field" style="padding:4px 8px;font-size:0.8rem;min-width:170px;">${opciokHtml}</select>
                    <button type="button" class="btn btn-outline-blue" style="padding:4px 9px;font-size:0.78rem;" onclick="gyorsNevezesKategoriaValtas(${n.id})">Áthelyezés</button>
                    <button class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" onclick="torolElem('Registrations', ${n.id})">${TatamiMaster.icon('trash', 14)} Nevezés törlése</button>
                </div>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html || `<tr><td colspan="5" style="text-align:center;color:#71717A;">Nincs rögzített nevezés.</td></tr>`;
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
        const elozoTat = tatSel.value;
        tatSel.innerHTML = '<option value="">-- Válassz Tatamit! --</option>' +
            globalTatamik.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        if (elozoTat && globalTatamik.some(t => String(t.id) === elozoTat)) tatSel.value = elozoTat;
    }

    const szuroSel = document.getElementById('menetrendTatamiSzuroSelect');
    if (szuroSel) {
        const elozoSzuro = szuroSel.value;
        szuroSel.innerHTML = '<option value="ALL">Összes Tatami (csoportosítva)</option>' +
            globalTatamik.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        if (elozoSzuro && (elozoSzuro === 'ALL' || globalTatamik.some(t => String(t.id) === elozoSzuro))) {
            szuroSel.value = elozoSzuro;
        }
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
        cont.innerHTML = `<span style="color:#990000;font-weight:bold;">Nincs benevezett versenyző ebben a kategóriában!</span>`;
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
        `<div style="margin-bottom:6px;font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:6px;">${TatamiMaster.icon('star', 14)} Kiemelt versenyzők bepipálása (egyenes kiesésben ők lesznek az erőnyerők és külön ágra kerülnek; Katában a végén indulnak):</div>` +
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
        const torlendoIdk = new Set(meglevoKatMeccsek.map(rm => rm.id));
        const dontoIdk = TatamiMaster.lekerKataDontoMeccsIdk().filter(id => !torlendoIdk.has(id));
        localStorage.setItem('kataDontoMeccsIdk', JSON.stringify(dontoIdk));
        const kataTar = TatamiMaster.lekerKataEredmenyek();
        for (let rm of meglevoKatMeccsek) {
            delete kataTar[rm.id];
            await TatamiMaster.apiSend('Matches/' + rm.id, 'DELETE');
        }
        localStorage.setItem('kataEredmenyek', JSON.stringify(kataTar));
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
        generalt = TatamiMaster.generalEgyenesKiesesMeccsek(katId, tatamiId, kiemeltek, tobbiek, sorszam);
    }

    for (let m of generalt) {
        await TatamiMaster.apiSend('Matches', 'POST', m);
    }
    TatamiMaster.toast(`Sorsolás kész! (${generalt.length} mérkőzés létrehozva)`);
    await automatikusTatamiMenetrendRendezes(tatamiId, true);
    await mindenAdatFrissitese();
}

function epitsTisztaMeccsPayload(m) {
    return {
        id: m.id,
        categoryId: m.categoryId,
        tatamiId: m.tatamiId,
        competitor1Id: m.competitor1Id ?? null,
        competitor2Id: m.competitor2Id ?? null,
        matchOrder: m.matchOrder,
        isFinished: Boolean(m.isFinished),
        winnerId: m.winnerId ?? null
    };
}

function frissitTatamiTerhelesEloszto() {
    const kartyaCont = document.getElementById('tatamiTerhelesKartyak');
    const katSel = document.getElementById('athelyezendoKategoriaSelect');
    const tatSel = document.getElementById('celTatamiAthelyezesSelect');
    if (!kartyaCont || !katSel || !tatSel) return;

    const esc = (s) => TatamiMaster.escapeHtml(s);
    const terhelesMap = {};
    for (const t of globalTatamik) {
        terhelesMap[t.id] = { tatami: t, osszesDb: 0, hatralevoDb: 0, hatralevoMp: 0 };
    }

    const katHatralevoMap = new Map();
    for (const m of globalMerkozesek) {
        const kat = globalKategoriak.find(k => k.id === m.categoryId);
        const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        const isErvenyesMeccs = isKata || !(m.isFinished && m.competitor1Id !== null && m.competitor2Id === null);
        if (!isErvenyesMeccs) continue;

        if (terhelesMap[m.tatamiId]) {
            terhelesMap[m.tatamiId].osszesDb++;
        }
        if (!m.isFinished) {
            const mp = TatamiMaster.becsulMeccsIdotartamMp(kat);
            if (terhelesMap[m.tatamiId]) {
                terhelesMap[m.tatamiId].hatralevoDb++;
                terhelesMap[m.tatamiId].hatralevoMp += mp;
            }
            const kulcs = `${m.categoryId}_${m.tatamiId}`;
            if (!katHatralevoMap.has(kulcs)) {
                katHatralevoMap.set(kulcs, { categoryId: m.categoryId, tatamiId: m.tatamiId, db: 0, mp: 0 });
            }
            const rec = katHatralevoMap.get(kulcs);
            rec.db++;
            rec.mp += mp;
        }
    }

    kartyaCont.innerHTML = globalTatamik.map(t => {
        const info = terhelesMap[t.id] || { osszesDb: 0, hatralevoDb: 0, hatralevoMp: 0 };
        const perc = Math.round(info.hatralevoMp / 60);
        const liveTat = TatamiMaster.lekerLiveTatamiAllapot(t.id);
        const szunetJel = (liveTat && liveTat.statusBanner && liveTat.statusText)
            ? `<div style="margin-top:4px;font-size:0.74rem;font-weight:800;color:#990000;">${esc(liveTat.statusText)}</div>`
            : '';
        return `<div style="background:#FFFFFF;border:1px solid #E4E0D7;border-radius:8px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:#18181B;font-size:0.92rem;">${esc(t.name)}</strong>
                <span style="background:${info.hatralevoDb > 0 ? '#18181B' : '#E4E0D7'};color:${info.hatralevoDb > 0 ? '#FAF8F5' : '#3F3F46'};padding:2px 8px;border-radius:10px;font-size:0.74rem;font-weight:800;">
                    ${info.hatralevoDb} hátralévő meccs
                </span>
            </div>
            <div style="font-size:0.78rem;color:#52525B;margin-top:4px;">
                Becsült hátralévő idő: <strong>~${perc} perc</strong> (Összesen: ${info.osszesDb} meccs)
            </div>
            ${szunetJel}
        </div>`;
    }).join('');

    const opciok = Array.from(katHatralevoMap.values()).map(r => {
        const kat = globalKategoriak.find(k => k.id === r.categoryId);
        const tat = globalTatamik.find(t => t.id === r.tatamiId);
        const perc = Math.max(1, Math.round(r.mp / 60));
        return `<option value="${r.categoryId}" data-forras-tatami="${r.tatamiId}">${esc(kat ? kat.name : 'Kategória #' + r.categoryId)} — jelenleg: ${esc(tat ? tat.name : 'Tatami #' + r.tatamiId)} (${r.db} nyitott meccs, ~${perc} perc)</option>`;
    });

    katSel.innerHTML = opciok.length > 0
        ? opciok.join('')
        : '<option value="">Nincs áthelyezhető nyitott mérkőzés</option>';

    tatSel.innerHTML = globalTatamik.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
}

async function athelyezKategoriaMasikTatamira(katIdOpt = null, celTatIdOpt = null) {
    const katSel = document.getElementById('athelyezendoKategoriaSelect');
    const tatSel = document.getElementById('celTatamiAthelyezesSelect');
    const katId = parseInt(katIdOpt !== null ? katIdOpt : (katSel ? katSel.value : 0), 10);
    const celTatamiId = parseInt(celTatIdOpt !== null ? celTatIdOpt : (tatSel ? tatSel.value : 0), 10);

    if (!katId || !celTatamiId) {
        TatamiMaster.toast("Válassz ki egy áthelyezendő kategóriát és egy cél tatamit!", "figyelem");
        return 0;
    }

    const nyitottMeccsek = globalMerkozesek
        .filter(m => m.categoryId === katId && !m.isFinished && m.tatamiId !== celTatamiId)
        .sort((a, b) => (a.matchOrder - b.matchOrder) || (a.id - b.id));

    if (nyitottMeccsek.length === 0) {
        TatamiMaster.toast("A kiválasztott kategória nyitott mérkőzései már a cél tatamin vannak!", "figyelem");
        return 0;
    }

    const forrasTatamiIdk = Array.from(new Set(nyitottMeccsek.map(m => m.tatamiId)));
    const celTatamiMeglevo = globalMerkozesek.filter(m => m.tatamiId === celTatamiId);
    let kovSorszam = celTatamiMeglevo.length > 0
        ? Math.max(...celTatamiMeglevo.map(m => m.matchOrder || 0)) + 1
        : 1;

    for (const m of nyitottMeccsek) {
        m.tatamiId = celTatamiId;
        m.matchOrder = kovSorszam++;
        await TatamiMaster.apiSend('Matches/' + m.id, 'PUT', epitsTisztaMeccsPayload(m));
    }

    // Forrás tatami(k) sorszámainak újraszámozása lyukmentesen
    for (const fTatId of forrasTatamiIdk) {
        const maradek = globalMerkozesek
            .filter(m => m.tatamiId === fTatId)
            .sort((a, b) => (a.matchOrder - b.matchOrder) || (a.id - b.id));
        for (let i = 0; i < maradek.length; i++) {
            if (maradek[i].matchOrder !== i + 1) {
                maradek[i].matchOrder = i + 1;
                await TatamiMaster.apiSend('Matches/' + maradek[i].id, 'PUT', epitsTisztaMeccsPayload(maradek[i]));
            }
        }
    }

    const kat = globalKategoriak.find(k => k.id === katId);
    const celTat = globalTatamik.find(t => t.id === celTatamiId);
    await mindenAdatFrissitese();
    TatamiMaster.toast(`${kat ? kat.name : 'Kategória'} (${nyitottMeccsek.length} hátralévő meccs) áthelyezve ide: ${celTat ? celTat.name : 'Tatami #' + celTatamiId}!`);
    return nyitottMeccsek.length;
}

function merkozesekBetoltese() {
    frissitTatamiTerhelesEloszto();
    const tbody = document.getElementById('merkozesekTbody');
    if (!tbody) return;

    const szuroEl = document.getElementById('menetrendTatamiSzuroSelect');
    const szurtTatamiId = (szuroEl && szuroEl.value && szuroEl.value !== 'ALL') ? parseInt(szuroEl.value) : null;
    const lista = szurtTatamiId ? globalMerkozesek.filter(m => m.tatamiId === szurtTatamiId) : globalMerkozesek;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#71717A;">Még nincs kisorsolt mérkőzés.</td></tr>`;
        return;
    }

    const tatamiMeccsDb = {};
    const tatamiPozicio = {};
    for (let m of lista) {
        if (!tatamiMeccsDb[m.tatamiId]) tatamiMeccsDb[m.tatamiId] = [];
        tatamiPozicio[m.id] = tatamiMeccsDb[m.tatamiId].length;
        tatamiMeccsDb[m.tatamiId].push(m);
    }

    let html = "";
    let elozoTatamiId = null;

    for (let m of lista) {
        const tat = globalTatamik.find(t => t.id === m.tatamiId);
        const kat = globalKategoriak.find(k => k.id === m.categoryId);
        const v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
        const v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);
        const gy = globalVersenyzok.find(v => v.id === m.winnerId);
        const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        const isKataDonto = isKata && TatamiMaster.isKataDontoMeccs(m.id);

        if (!szurtTatamiId && m.tatamiId !== elozoTatamiId) {
            elozoTatamiId = m.tatamiId;
            const db = tatamiMeccsDb[m.tatamiId] ? tatamiMeccsDb[m.tatamiId].length : 0;
            html += `<tr class="tatami-group-row">
                <td colspan="7">${TatamiMaster.icon('shield', 14)} <strong>${tat ? tat.name : 'Tatami #' + m.tatamiId}</strong> &mdash; ${db} mérkőzés</td>
            </tr>`;
        }

        const poz = tatamiPozicio[m.id] ?? 0;
        const osszTatami = tatamiMeccsDb[m.tatamiId] ? tatamiMeccsDb[m.tatamiId].length : 1;
        const elso = poz === 0;
        const utolso = poz >= osszTatami - 1;

        const statuszHtml = m.isFinished
            ? `<span style="color:#18181B;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('check', 14)} Kész (${gy ? gy.name : 'Erőnyerő'})</span>`
            : `<span style="color:#52525B;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${TatamiMaster.icon('clock', 14)} Várakozik</span>`;

        const kataFazisBadge = isKata
            ? (isKataDonto
                ? ` <span style="background:#990000;color:#FAF8F5;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:800;margin-left:4px;">TOP 6 DÖNTŐ</span>`
                : ` <span style="background:#E4E0D7;color:#18181B;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;margin-left:4px;">SELEJTEZŐ</span>`)
            : '';

        html += `<tr class="draggable-row" data-match-id="${m.id}" draggable="true"
                     ondragstart="dragStart(event, ${m.id})"
                     ondragenter="dragEnter(event)"
                     ondragover="dragOver(event)"
                     ondrop="dropMatch(event, ${m.id})"
                     ondragend="dragEnd()">
            <td>
                <div class="order-cell-wrap">
                    <span class="drag-grip" title="Fogd meg a sort és húzd egy másik mérkőzésre">&#8942;&#8942;</span>
                    <strong>#${m.matchOrder}</strong>
                    <div class="order-step-group">
                        <button type="button" class="order-step-btn" draggable="false" onmousedown="event.stopPropagation()" onclick="mozgatMeccsSorrend(${m.id}, -1)" title="Előrébb hozás" ${elso ? 'disabled' : ''}>&#9650;</button>
                        <button type="button" class="order-step-btn" draggable="false" onmousedown="event.stopPropagation()" onclick="mozgatMeccsSorrend(${m.id}, 1)" title="Hátrébb sorolás" ${utolso ? 'disabled' : ''}>&#9660;</button>
                    </div>
                </div>
            </td>
            <td>${tat ? tat.name : '-'}</td>
            <td><strong>${kat ? kat.name : '-'}</strong>${kataFazisBadge}</td>
            <td style="color:#18181B;font-weight:700;">${v1 ? v1.name + ' <small style="color:#52525B;">(' + v1.club + ')</small>' : 'Várakozik...'}</td>
            <td>${isKata ? (isKataDonto ? '<strong style="color:#990000;">KATA TOP 6 DÖNTŐ</strong>' : '<em>KATA SELEJTEZŐ</em>') : (v2 ? v2.name + ' <small style="color:#52525B;">(' + v2.club + ')</small>' : (m.isFinished ? '<em>Erőnyerő</em>' : 'Várakozik...'))}</td>
            <td>${statuszHtml}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-outline" draggable="false" onmousedown="event.stopPropagation()" style="padding:4px 8px;font-size:0.8rem;" onclick="meccsUjranyitasaReset(${m.id})">${TatamiMaster.icon('refresh', 13)} Újranyitás</button>
                <button class="btn btn-danger" draggable="false" onmousedown="event.stopPropagation()" style="padding:4px 8px;font-size:0.8rem;" onclick="torolElem('Matches', ${m.id})" title="Mérkőzés törlése">${TatamiMaster.icon('trash', 13)} Törlés</button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

function dragStart(ev, matchId) {
    draggedMatchId = matchId;
    const row = ev.currentTarget;
    if (ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', String(matchId));
    }
    if (row) {
        requestAnimationFrame(() => row.classList.add('dragging'));
    }
}

function dragEnter(ev) {
    ev.preventDefault();
}

function dragOver(ev) {
    ev.preventDefault();
    const row = ev.currentTarget;
    if (!row) return;
    const targetId = parseInt(row.dataset.matchId);
    if (!targetId || targetId === draggedMatchId) {
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'none';
        return;
    }
    const m1 = globalMerkozesek.find(m => m.id === draggedMatchId);
    const m2 = globalMerkozesek.find(m => m.id === targetId);
    if (m1 && m2 && m1.tatamiId !== m2.tatamiId) {
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'none';
        return;
    }
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (!row.classList.contains('drag-over')) {
        document.querySelectorAll('#merkozesekTbody tr.drag-over').forEach(el => el.classList.remove('drag-over'));
        row.classList.add('drag-over');
    }
}

function dragEnd() {
    draggedMatchId = null;
    document.querySelectorAll('#merkozesekTbody tr.dragging, #merkozesekTbody tr.drag-over').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
}

async function dropMatch(ev, targetMatchId) {
    ev.preventDefault();
    const forrasId = draggedMatchId || (ev.dataTransfer ? parseInt(ev.dataTransfer.getData('text/plain')) : null);
    dragEnd();

    if (!forrasId || forrasId === targetMatchId) return;
    const m1 = globalMerkozesek.find(m => m.id === forrasId);
    const m2 = globalMerkozesek.find(m => m.id === targetMatchId);
    await cserelMeccsSorrendet(m1, m2);
}

async function mozgatMeccsSorrend(matchId, irany) {
    const m1 = globalMerkozesek.find(m => m.id === matchId);
    if (!m1) return;
    const tatamiLista = globalMerkozesek.filter(m => m.tatamiId === m1.tatamiId);
    const idx = tatamiLista.findIndex(m => m.id === matchId);
    const celIdx = idx + irany;
    if (idx === -1 || celIdx < 0 || celIdx >= tatamiLista.length) return;
    await cserelMeccsSorrendet(tatamiLista[idx], tatamiLista[celIdx]);
}

async function cserelMeccsSorrendet(m1, m2) {
    if (!m1 || !m2 || m1.id === m2.id) return;
    if (m1.tatamiId !== m2.tatamiId) {
        TatamiMaster.toast("Csak ugyanazon a tatamin belüli mérkőzések sorrendje cserélhető fel!", "figyelem");
        return;
    }

    const tatamiLista = globalMerkozesek.filter(m => m.tatamiId === m1.tatamiId);
    const vanDuplaSorszam = new Set(tatamiLista.map(x => x.matchOrder)).size < tatamiLista.length;
    const modositandok = [];

    if (!vanDuplaSorszam && m1.matchOrder !== m2.matchOrder) {
        const tempOrder = m1.matchOrder;
        m1.matchOrder = m2.matchOrder;
        m2.matchOrder = tempOrder;
        modositandok.push(m1, m2);
    } else {
        const idx1 = tatamiLista.findIndex(m => m.id === m1.id);
        const idx2 = tatamiLista.findIndex(m => m.id === m2.id);
        if (idx1 === -1 || idx2 === -1) return;

        const ujSorszamok = tatamiLista.map((_, i) => i + 1);
        const tmp = ujSorszamok[idx1];
        ujSorszamok[idx1] = ujSorszamok[idx2];
        ujSorszamok[idx2] = tmp;

        tatamiLista.forEach((meccs, i) => {
            if (meccs.matchOrder !== ujSorszamok[i]) {
                meccs.matchOrder = ujSorszamok[i];
                modositandok.push(meccs);
            }
        });
    }

    const valaszok = await Promise.all(
        modositandok.map(m => TatamiMaster.apiSend('Matches/' + m.id, 'PUT', epitsTisztaMeccsPayload(m)))
    );

    if (valaszok.some(r => !r || !r.ok)) {
        TatamiMaster.toast("Hiba történt a mérkőzés sorrendjének mentésekor!", "hiba");
    } else {
        TatamiMaster.toast(`Sorrend módosítva (#${m2.matchOrder} <-> #${m1.matchOrder})`);
    }
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
        cont.innerHTML = TatamiMaster.epitsKataRanglistaHtml(katMeccsek, globalVersenyzok);
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
        const sorrendben = [...katMeccsek].sort((a, b) => (a.matchOrder - b.matchOrder) || (a.id - b.id));
        fordulok.push(sorrendben);
    }

    let formatumFejlec = isAgrajz
        ? `<div class="tm-print-hide-note" style="margin-bottom:12px;padding:10px 14px;background:#FAF8F5;border:1px solid #CFC9BC;border-radius:8px;font-size:0.86rem;color:#18181B;display:flex;align-items:center;gap:8px;">
            ${TatamiMaster.icon('git-branch', 15)}
            <span><strong>Lebonyolítási forma: Egyenes kieséses ágrajz</strong> (5 fő feletti Kumite kategória – összesen ${n} mérkőzés).</span>
           </div>`
        : `<div class="tm-print-hide-note" style="margin-bottom:12px;padding:10px 14px;background:#FAF8F5;border:1px solid #CFC9BC;border-radius:8px;font-size:0.86rem;color:#18181B;display:flex;align-items:center;gap:8px;">
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
                        <div style="background:#F3F0EA;border-bottom:1px solid #E4E0D7;padding:5px 12px;font-size:0.78rem;font-weight:700;color:#3F3F46;display:flex;justify-content:space-between;align-items:center;gap:6px;">
                            <span>Mérkőzés #${m.matchOrder}</span>
                            <span style="display:inline-flex;align-items:center;gap:6px;">
                                <span>${m.isFinished ? modCimke : ''}</span>
                                ${(m.isFinished && !isBye) ? `<button type="button" class="btn btn-outline tm-print-hide-note" style="padding:1px 7px;font-size:0.7rem;" onclick="meccsUjranyitasaReset(${m.id})">Újranyitás</button>` : ''}
                            </span>
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
        html += `<div class="tm-rr-standings-wrap" style="margin-top:18px;background:#FAF8F5;padding:16px;border-radius:10px;border:1px solid #CFC9BC;">
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

function osszeallitKategoriaNyomtatoHtml(katId) {
    const kId = parseInt(katId, 10);
    const kat = (globalKategoriak || []).find(k => k.id === kId);
    if (!kat) return null;

    const esc = (s) => TatamiMaster.escapeHtml(s);
    const aktId = TatamiMaster.lekerAktualisVersenyId();
    const vObj = (globalVersenyek || []).find(v => v.id === aktId);
    const versenyNev = (vObj && vObj.name) ? vObj.name : TatamiMaster.lekerAktualisVersenyNev();

    const nevKatIdk = new Set((globalNevezesek || []).filter(n => n.categoryId === kId).map(n => n.competitorId));
    const katMeccsek = (globalMerkozesek || []).filter(m => m.categoryId === kId).sort((a, b) => a.id - b.id);
    for (const m of katMeccsek) {
        if (m.competitor1Id) nevKatIdk.add(m.competitor1Id);
        if (m.competitor2Id) nevKatIdk.add(m.competitor2Id);
    }

    const indulok = (globalVersenyzok || [])
        .filter(v => nevKatIdk.has(v.id))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'hu'));

    const isKata = (kat.matchType && kat.matchType.toUpperCase() === 'KATA');

    if (isKata) {
        const idopontMap = TatamiMaster.becsulMeccsTatamiIdopontok(globalTatamik, globalKategoriak, globalMerkozesek);
        const kataTarolo = TatamiMaster.lekerKataEredmenyek();
        const rendezettKata = [...katMeccsek].sort((a, b) => (a.matchOrder - b.matchOrder) || (a.id - b.id));

        let rowsHtml = '';
        if (rendezettKata.length > 0) {
            rowsHtml = rendezettKata.map((m, idx) => {
                const v = (globalVersenyzok || []).find(x => x.id === m.competitor1Id);
                const tat = (globalTatamik || []).find(t => t.id === m.tatamiId);
                const tatNev = tat ? tat.name : (m.tatamiId ? `Tatami #${m.tatamiId}` : 'Nincs tatami');
                const tInfo = idopontMap[m.id];
                const isDonto = TatamiMaster.isKataDontoMeccs(m.id);

                let mikorSzoveg = esc(tatNev);
                if (m.isFinished) {
                    const er = kataTarolo[m.id];
                    mikorSzoveg = `${esc(tatNev)} — Értékelve${er && er.kesz ? ' (' + Number(er.osszeg).toFixed(1) + ' p)' : ''}`;
                } else if (tInfo && tInfo.statuszKod === 'MOST') {
                    mikorSzoveg = `<strong>${esc(tInfo.tatamiNev)} — MOST lép tatamira</strong>`;
                } else if (tInfo) {
                    mikorSzoveg = `${esc(tInfo.tatamiNev)} &bull; <strong>kb. ${esc(tInfo.varhatoIdo)}</strong> <span style="color:#52525B;">(~${tInfo.becsultPerc} perc múlva, ${tInfo.elotteDb} előtte)</span>`;
                }

                return `<tr style="${idx % 2 === 1 ? 'background:#FAF8F5;' : ''}">
                    <td><strong>#${m.matchOrder || (idx + 1)}</strong>${isDonto ? ' <small>[DÖNTŐ]</small>' : ''}</td>
                    <td><strong>${v ? esc(v.name || '') : '-'}</strong></td>
                    <td>${v ? esc(v.club || '') : '-'}</td>
                    <td>${v && v.belt ? esc(v.belt) : '-'}</td>
                    <td>${mikorSzoveg}</td>
                </tr>`;
            }).join('');
        } else if (indulok.length > 0) {
            rowsHtml = indulok.map((v, idx) => `
                <tr style="${idx % 2 === 1 ? 'background:#FAF8F5;' : ''}">
                    <td><strong>${idx + 1}.</strong></td>
                    <td><strong>${esc(v.name || '')}</strong></td>
                    <td>${esc(v.club || '')}</td>
                    <td>${v.belt ? esc(v.belt) : '-'}</td>
                    <td style="color:#71717A;">Még nincs kisorsolva</td>
                </tr>`).join('');
        } else {
            rowsHtml = '<tr><td colspan="5" style="text-align:center;color:#71717A;">Nincs benevezett versenyző ebben a kategóriában.</td></tr>';
        }

        const kataHtml = `
            <div class="tm-cat-print-header">
                <div>
                    <div style="font-size:0.78rem;font-weight:700;color:#52525B;text-transform:uppercase;">${esc(versenyNev)}</div>
                    <h2 style="margin:2px 0 0 0;font-size:1.25rem;color:#18181B;">${esc(kat.name || '')}</h2>
                </div>
                <div style="text-align:right;font-size:0.82rem;font-weight:700;color:#27272A;">
                    KATA RAJT SORREND &bull; ${rendezettKata.length || indulok.length} fellépő
                </div>
            </div>
            <table class="data-table tm-kata-print-table" style="width:100%;">
                <thead>
                    <tr>
                        <th style="width:76px;">Sorrend</th>
                        <th>Versenyző</th>
                        <th>Klub / Egyesület</th>
                        <th style="width:82px;">Övfokozat</th>
                        <th>Mikor lép tatamira</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;

        return { html: kataHtml, orientacio: 'portrait' };
    }

    const isAgrajz = TatamiMaster.isKumiteAgrajz(katMeccsek);

    const sel = document.getElementById('agrajzKategoriaSelect');
    if (sel) sel.value = String(kId);
    rajzolAgrajz();
    const cont = document.getElementById('bracketContainer');
    let agrajzHtml = cont ? cont.innerHTML : '';

    if (katMeccsek.length === 0) {
        agrajzHtml = '<div style="padding:12px;border:1px dashed #CFC9BC;border-radius:8px;color:#52525B;font-size:0.86rem;">Ehhez a kategóriához még nem készült kisorsolt ágrajz / rajtlista.</div>';
    }

    const indulokHtml = indulok.length > 0
        ? `<div class="tm-cat-print-fighters-grid">
            ${indulok.map((v, i) => `
                <div class="tm-cat-print-fighter-item">
                    <span><strong>${i + 1}. ${esc(v.name || '')}</strong> <span style="color:#52525B;">(${esc(v.club || '')})</span></span>
                    <span style="color:#52525B;white-space:nowrap;">${v.weight ? esc(String(v.weight) + ' kg') : ''} ${v.belt ? esc(v.belt) : ''}</span>
                </div>`).join('')}
           </div>`
        : '<div style="color:#71717A;font-size:0.84rem;">Nincs benevezett versenyző ebben a kategóriában.</div>';

    let roundCount = 1;
    if (isAgrajz && katMeccsek.length > 0) {
        roundCount = Math.round(Math.log2(katMeccsek.length + 1));
    }
    const scaleStyle = (isAgrajz && roundCount >= 4)
        ? `zoom:${roundCount >= 5 ? '0.68' : '0.82'};`
        : '';

    const html = `
        <div class="tm-cat-print-header">
            <div>
                <div style="font-size:0.78rem;font-weight:700;color:#52525B;text-transform:uppercase;">${esc(versenyNev)}</div>
                <h2 style="margin:2px 0 0 0;font-size:1.25rem;color:#18181B;">${esc(kat.name || '')}</h2>
            </div>
            <div style="text-align:right;font-size:0.82rem;font-weight:700;color:#27272A;">
                ${esc(kat.matchType || 'KUMITE')} &bull; ${indulok.length} induló
            </div>
        </div>
        <div class="tm-cat-print-fighters">
            <div style="font-size:0.74rem;font-weight:800;text-transform:uppercase;color:#3F3F46;margin-bottom:4px;letter-spacing:0.5px;">Kategóriában induló versenyzők</div>
            ${indulokHtml}
        </div>
        <div style="${scaleStyle}">
            ${agrajzHtml}
        </div>
    `;

    return {
        html,
        orientacio: isAgrajz ? 'landscape' : 'portrait'
    };
}

function nyomtatKategoriaAgrajz(katIdOverride = null) {
    const sel = document.getElementById('agrajzKategoriaSelect');
    const katId = parseInt(katIdOverride || (sel && sel.value) || (globalKategoriak[0] ? globalKategoriak[0].id : 0), 10);
    if (!katId) {
        TatamiMaster.toast('Először válassz ki egy kategóriát a nyomtatáshoz!', 'figyelem');
        return;
    }

    const csomag = osszeallitKategoriaNyomtatoHtml(katId);
    if (!csomag) {
        TatamiMaster.toast('A kiválasztott kategória nem található!', 'hiba');
        return;
    }

    let pageStyle = document.getElementById('tmCategoryPageSizeStyle');
    if (!pageStyle) {
        pageStyle = document.createElement('style');
        pageStyle.id = 'tmCategoryPageSizeStyle';
        document.head.appendChild(pageStyle);
    }
    pageStyle.textContent = `@media print { @page { size: A4 ${csomag.orientacio}; margin: 8mm; } }`;

    let root = document.getElementById('tmCategoryPrintRoot');
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'tmCategoryPrintRoot';
    root.innerHTML = csomag.html;
    document.body.appendChild(root);

    document.body.classList.add('tm-printing-category-sheet');

    const cleanup = () => {
        document.body.classList.remove('tm-printing-category-sheet');
        const r = document.getElementById('tmCategoryPrintRoot');
        if (r) r.remove();
        const ps = document.getElementById('tmCategoryPageSizeStyle');
        if (ps) ps.remove();
        window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
        window.print();
        setTimeout(cleanup, 1200);
    }, 100);
}

async function nyitAdminOklevelSablon(versenyId) {
    const vObj = (globalVersenyek || []).find(v => v.id === versenyId) || null;
    TatamiMaster.nyitOklevelSablonModal(vObj, async (celVersenyId, celVersenyObj) => {
        await nyomtatAdminVersenyOsszesOklevel(celVersenyId, celVersenyObj);
    });
}

async function nyomtatAdminVersenyOsszesOklevel(versenyId, versenyObj = null) {
    const [k, m, v] = await Promise.all([
        TatamiMaster.apiGet('Categories', { versenyId }),
        TatamiMaster.apiGet('Matches', { versenyId }),
        TatamiMaster.apiGet('Competitors', { versenyId })
    ]);
    const { kategoriaEredmenyek } = TatamiMaster.szamolDobogosokEsKlubok(k, m, v);
    const lista = [];
    for (const ke of kategoriaEredmenyek) {
        for (const d of ke.dobogosok) {
            if (!d.v) continue;
            lista.push({
                nev: d.v.name,
                klub: d.v.club,
                kategoria: ke.kategoria.name,
                helyezes: d.hely
            });
        }
    }
    if (lista.length === 0) {
        TatamiMaster.toast('Ennél a versenynél még nincs lezárt dobogós eredmény oklevélnyomtatáshoz.', 'figyelem');
        return;
    }
    TatamiMaster.nyomtatOklevelek(versenyId, lista, versenyObj);
}

// =========================================================
// MÚLTBELI EMBERI HIBÁK KORREKCIÓJA (SZERKESZTÉS & RESET)
// =========================================================
function bezarVersenyzoEditModal() {
    const modal = document.getElementById('tmVersenyzoEditModal');
    if (modal) modal.remove();
}

function szerkesztVersenyzoTeljes(id) {
    const v = globalVersenyzok.find(x => x.id === id);
    if (!v) return;

    bezarVersenyzoEditModal();

    const esc = (s) => TatamiMaster.escapeHtml(s);
    const aktualisNevezesek = (globalNevezesek || []).filter(n => n.competitorId === id);
    const nevezettKatIdSet = new Set(aktualisNevezesek.map(n => n.categoryId));
    const elerhetoKategoriak = (globalKategoriak || []).filter(k =>
        !v.tournamentId || !k.tournamentId || k.tournamentId === v.tournamentId
    );

    const letszamMap = szamolKategoriaLetszamMap();
    const katCheckboxokHtml = elerhetoKategoriak.length
        ? elerhetoKategoriak.map(k => {
            const checkedAttr = nevezettKatIdSet.has(k.id) ? 'checked' : '';
            const db = letszamMap[k.id] || 0;
            const korInfo = (k.minAge || k.maxAge) ? ` • ${k.minAge || '?'}-${k.maxAge || '?'} év` : '';
            const letszamCimke = `${esc(k.matchType || 'KUMITE')}${korInfo} • ${db} fő${db === 1 ? ' (EGYEDÜL!)' : ''}`;
            return `<label style="display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid ${db === 1 ? '#FCA5A5' : '#E4E4E7'}; border-radius:6px; background:${db === 1 ? '#FEF2F2' : '#FAFAFA'}; cursor:pointer; font-size:0.86rem;">
                <input type="checkbox" class="edit-versenyzo-kat-cb" value="${k.id}" ${checkedAttr}>
                <span style="flex:1; font-weight:600; color:#18181B;">${esc(k.name)}</span>
                <span class="badge" style="font-size:0.72rem; ${db === 1 ? 'color:#990000;border-color:#990000;' : ''}">${letszamCimke}</span>
            </label>`;
        }).join('')
        : '<div style="color:#71717A; font-size:0.86rem;">Még nincs felvett kategória ehhez a versenyhez.</div>';

    const modal = document.createElement('div');
    modal.id = 'tmVersenyzoEditModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(24,24,27,0.55); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;';
    modal.onclick = (e) => { if (e.target === modal) bezarVersenyzoEditModal(); };

    modal.innerHTML = `
        <div style="background:#FFFFFF; border:1px solid #E4E4E7; border-radius:12px; width:100%; max-width:620px; max-height:90vh; overflow-y:auto; padding:18px 16px; box-shadow:0 20px 45px rgba(0,0,0,0.22);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #E4E4E7; padding-bottom:10px;">
                <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:#18181B; display:flex; align-items:center; gap:8px;">
                    ${TatamiMaster.icon('edit', 18)} Versenyző és Nevezések Szerkesztése
                </h3>
                <button type="button" onclick="bezarVersenyzoEditModal()" style="background:transparent; border:none; cursor:pointer; color:#71717A; padding:4px;" aria-label="Bezárás">
                    ${TatamiMaster.icon('x', 20)}
                </button>
            </div>
            <form onsubmit="event.preventDefault(); mentVersenyzoEsNevezesekModal(${id});">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap:12px; margin-bottom:14px;">
                    <div>
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Versenyző neve</label>
                        <input type="text" id="editVersenyzoNev" class="form-control" value="${esc(v.name || '')}" required>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Klub / Egyesület</label>
                        <input type="text" id="editVersenyzoKlub" class="form-control" value="${esc(v.club || '')}">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Övfokozat</label>
                        <input type="text" id="editVersenyzoOv" class="form-control" value="${esc(v.belt || '10. kyu')}" placeholder="pl. 4. kyu / 1. dan">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div>
                            <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Súly (kg)</label>
                            <input type="number" id="editVersenyzoSuly" class="form-control" value="${Number(v.weight) || 0}" min="10" max="200">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Születési év</label>
                            <input type="number" id="editVersenyzoEv" class="form-control" value="${Number(v.birthYear) || 2010}" min="1940" max="2026">
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Teljes születési dátum (Év-Hó-Nap – Japán szabályhoz)</label>
                        <input type="date" id="editVersenyzoSzulDatum" class="form-control" value="${esc(TatamiMaster.normalizalSzulDatum(v).birthDate || '')}" onchange="if(this.value){var y=parseInt(this.value.split('-')[0],10);if(y)document.getElementById('editVersenyzoEv').value=y;}">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#52525B; margin-bottom:4px;">Nem</label>
                        <select id="editVersenyzoNem" class="form-control">
                            <option value="" ${!v.gender ? 'selected' : ''}>Automatikus / Nincs megadva</option>
                            <option value="Férfi" ${v.gender === 'Férfi' ? 'selected' : ''}>Férfi / Fiú</option>
                            <option value="Női" ${v.gender === 'Női' ? 'selected' : ''}>Női / Lány</option>
                        </select>
                    </div>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:0.82rem; font-weight:700; color:#18181B; margin-bottom:6px;">Indulási Kategóriák (Pótnevezés / Módosítás)</label>
                    <div id="editVersenyzoKatCheckboxes" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap:8px; max-height:220px; overflow-y:auto; padding:8px; border:1px solid #E4E4E7; border-radius:8px; background:#F8FAFC;">
                        ${katCheckboxokHtml}
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; flex-wrap:wrap; gap:10px;">
                    <button type="button" class="btn btn-outline" onclick="bezarVersenyzoEditModal()">Mégse</button>
                    <button type="submit" id="editVersenyzoMentBtn" class="btn btn-success" style="display:inline-flex; align-items:center; gap:6px;">
                        ${TatamiMaster.icon('check', 16)} Adatok és Nevezések Mentése
                    </button>
                </div>
            </form>
        </div>`;

    document.body.appendChild(modal);
    const nevInput = document.getElementById('editVersenyzoNev');
    if (nevInput) nevInput.focus();
}

async function mentVersenyzoEsNevezesekModal(id) {
    const v = globalVersenyzok.find(x => x.id === id);
    if (!v) return;

    const nev = (document.getElementById('editVersenyzoNev')?.value || '').trim();
    if (!nev) {
        TatamiMaster.toast("A versenyző neve kötelező!", true);
        return;
    }
    const klub = (document.getElementById('editVersenyzoKlub')?.value || '').trim();
    const ov = (document.getElementById('editVersenyzoOv')?.value || '').trim();
    const suly = parseInt(document.getElementById('editVersenyzoSuly')?.value, 10);
    const szulDatumInput = (document.getElementById('editVersenyzoSzulDatum')?.value || '').trim();
    const evInput = parseInt(document.getElementById('editVersenyzoEv')?.value, 10);
    const szulNorm = TatamiMaster.normalizalSzulDatum(szulDatumInput || evInput, evInput);
    const ev = szulNorm.birthYear || (!isNaN(evInput) && evInput > 1900 ? evInput : v.birthYear);
    const nemInput = document.getElementById('editVersenyzoNem');
    const nem = nemInput ? nemInput.value.trim() : (v.gender || '');

    const mentBtn = document.getElementById('editVersenyzoMentBtn');
    if (mentBtn) mentBtn.disabled = true;

    const frissitett = Object.assign({}, v, {
        name: nev,
        club: klub || v.club,
        belt: ov || v.belt,
        weight: !isNaN(suly) && suly > 0 ? suly : v.weight,
        birthYear: ev,
        birthDate: szulNorm.hasFullDate ? szulNorm.birthDate : '',
        gender: nem
    });

    const res = await TatamiMaster.apiSend('Competitors/' + id, 'PUT', frissitett);
    if (!res.ok) {
        if (mentBtn) mentBtn.disabled = false;
        return;
    }

    const kivalasztottKatIds = new Set(
        Array.from(document.querySelectorAll('#editVersenyzoKatCheckboxes .edit-versenyzo-kat-cb:checked'))
            .map(cb => parseInt(cb.value, 10))
            .filter(n => !isNaN(n))
    );
    const aktualisNevezesek = (globalNevezesek || []).filter(n => n.competitorId === id);
    const meglevoKatIds = new Set(aktualisNevezesek.map(n => n.categoryId));

    let hibaDarab = 0;
    for (const nevSor of aktualisNevezesek) {
        if (!kivalasztottKatIds.has(nevSor.categoryId)) {
            const delRes = await TatamiMaster.apiSend('Registrations/' + nevSor.id, 'DELETE', null, { csendes404: true });
            if (!delRes.ok) hibaDarab++;
        }
    }
    for (const katId of kivalasztottKatIds) {
        if (!meglevoKatIds.has(katId)) {
            const addRes = await TatamiMaster.apiSend('Registrations', 'POST', { competitorId: id, categoryId: katId });
            if (!addRes.ok) hibaDarab++;
        }
    }

    bezarVersenyzoEditModal();
    if (hibaDarab > 0) {
        TatamiMaster.toast(`${frissitett.name} adatai mentve, de ${hibaDarab} nevezés módosítása sikertelen volt.`, true);
    } else {
        TatamiMaster.toast(`${frissitett.name} adatai és nevezései frissítve!`);
    }
    await mindenAdatFrissitese();
}

function bezarKategoriaEditModal() {
    const m = document.getElementById('tmKategoriaEditModal');
    if (m) m.remove();
}

function szerkesztKategoriaTeljes(id) {
    const k = globalKategoriak.find(x => x.id === id);
    if (!k) return;

    bezarKategoriaEditModal();
    const esc = (s) => TatamiMaster.escapeHtml(s);
    const isKata = (k.matchType && k.matchType.toUpperCase() === 'KATA');
    const isVegyes = TatamiMaster.isVegyesKategoria(k);
    const isNoi = !isVegyes && TatamiMaster.isNoiKategoria(k);
    const aktNem = isVegyes ? 'Vegyes' : (isNoi ? 'Női' : 'Férfi');

    const modal = document.createElement('div');
    modal.id = 'tmKategoriaEditModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.onclick = (e) => { if (e.target === modal) bezarKategoriaEditModal(); };

    modal.innerHTML = `
        <div style="background:#FFFFFF;border:1.5px solid #18181B;border-radius:12px;width:100%;max-width:520px;padding:20px 18px;box-shadow:0 20px 45px rgba(0,0,0,0.28);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #E4E0D7;padding-bottom:10px;">
                <h3 style="margin:0;font-size:1.05rem;font-weight:800;color:#18181B;display:flex;align-items:center;gap:8px;">
                    ${TatamiMaster.icon('edit', 18)} Kategória Szerkesztése (Nemek, Korhatár, Típus)
                </h3>
                <button type="button" onclick="bezarKategoriaEditModal()" style="background:transparent;border:none;cursor:pointer;color:#71717A;padding:4px;">
                    ${TatamiMaster.icon('x', 20)}
                </button>
            </div>
            <form onsubmit="event.preventDefault(); mentKategoriaEditModal(${id});">
                <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px;">
                    <div>
                        <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">Kategória megnevezése *</label>
                        <input type="text" id="editKategoriaNev" class="form-control" value="${esc(k.name || '')}" required>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div>
                            <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">Versenyszám típusa</label>
                            <select id="editKategoriaTipus" class="form-control">
                                <option value="KUMITE" ${!isKata ? 'selected' : ''}>KUMITE (Küzdelem / Csipeszharc)</option>
                                <option value="KATA" ${isKata ? 'selected' : ''}>KATA (Formagyakorlat)</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">Nemek szerinti bontás</label>
                            <select id="editKategoriaNem" class="form-control">
                                <option value="Férfi" ${aktNem === 'Férfi' ? 'selected' : ''}>Férfi / Fiú</option>
                                <option value="Női" ${aktNem === 'Női' ? 'selected' : ''}>Női / Lány</option>
                                <option value="Vegyes" ${aktNem === 'Vegyes' ? 'selected' : ''}>Vegyes (Fiú + Lány együtt)</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div>
                            <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">Alsó korhatár (év)</label>
                            <input type="number" id="editKategoriaMinKor" class="form-control" value="${k.minAge ?? 4}" min="2" max="99">
                        </div>
                        <div>
                            <label style="display:block;font-size:0.8rem;font-weight:700;color:#27272A;margin-bottom:4px;">Felső korhatár (év)</label>
                            <input type="number" id="editKategoriaMaxKor" class="form-control" value="${k.maxAge ?? 99}" min="2" max="99">
                        </div>
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:10px;">
                    <button type="button" class="btn btn-outline" onclick="bezarKategoriaEditModal()">Mégse</button>
                    <button type="submit" class="btn btn-outline-green" style="padding:9px 18px;">
                        ${TatamiMaster.icon('check', 16)} Kategória Mentése
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function mentKategoriaEditModal(id) {
    const k = globalKategoriak.find(x => x.id === id);
    if (!k) return;

    const ujNev = (document.getElementById('editKategoriaNev')?.value || '').trim();
    const ujTipus = (document.getElementById('editKategoriaTipus')?.value || '').trim();
    const ujNem = (document.getElementById('editKategoriaNem')?.value || '').trim();
    const ujMinKor = parseInt(document.getElementById('editKategoriaMinKor')?.value, 10);
    const ujMaxKor = parseInt(document.getElementById('editKategoriaMaxKor')?.value, 10);

    k.name = ujNev || k.name;
    k.matchType = (ujTipus.toUpperCase() === 'KATA') ? 'KATA' : 'KUMITE';
    k.gender = ujNem || k.gender || 'Vegyes';
    if (!isNaN(ujMinKor) && ujMinKor >= 0) k.minAge = ujMinKor;
    if (!isNaN(ujMaxKor) && ujMaxKor > 0) k.maxAge = ujMaxKor;

    const res = await TatamiMaster.apiSend('Categories/' + id, 'PUT', k);
    bezarKategoriaEditModal();
    if (res && res.ok) {
        TatamiMaster.toast(`Kategória frissítve!`);
        await mindenAdatFrissitese();
    }
}

async function meccsUjranyitasaReset(matchId, skipConfirm = false) {
    const m = globalMerkozesek.find(x => x.id === matchId);
    if (!m) return false;
    if (!skipConfirm && typeof confirm === 'function' && !confirm(`Biztosan újranyitod a #${m.matchOrder}. mérkőzést?`)) return false;

    const kat = globalKategoriak.find(k => k.id === m.categoryId);
    const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
    const regiGyoztesId = m.winnerId;

    if (!isKata && regiGyoztesId) {
        const katMeccsek = globalMerkozesek
            .filter(x => x.categoryId === m.categoryId)
            .sort((a, b) => a.id - b.id);
        if (TatamiMaster.isKumiteAgrajz(katMeccsek)) {
            let fordulok = [];
            let korMeret = (katMeccsek.length + 1) / 2;
            let idx = 0;
            while (korMeret >= 1) {
                fordulok.push(katMeccsek.slice(idx, idx + korMeret));
                idx += korMeret;
                korMeret /= 2;
            }
            for (let r = 0; r < fordulok.length - 1; r++) {
                const mIndex = fordulok[r].findIndex(x => x.id === m.id);
                if (mIndex !== -1) {
                    const kovMeccs = fordulok[r + 1][Math.floor(mIndex / 2)];
                    if (kovMeccs && !kovMeccs.isFinished) {
                        if (mIndex % 2 === 0 && kovMeccs.competitor1Id === regiGyoztesId) {
                            kovMeccs.competitor1Id = null;
                        } else if (mIndex % 2 !== 0 && kovMeccs.competitor2Id === regiGyoztesId) {
                            kovMeccs.competitor2Id = null;
                        }
                        await TatamiMaster.apiSend('Matches/' + kovMeccs.id, 'PUT', epitsTisztaMeccsPayload(kovMeccs));
                    }
                    break;
                }
            }
        }
    }

    m.isFinished = false;
    m.winnerId = null;

    let kataTar = TatamiMaster.lekerKataEredmenyek();
    delete kataTar[matchId];
    localStorage.setItem('kataEredmenyek', JSON.stringify(kataTar));

    const res = await TatamiMaster.apiSend('Matches/' + matchId, 'PUT', epitsTisztaMeccsPayload(m));
    if (res && res.ok) {
        TatamiMaster.toast(`Mérkőzés #${m.matchOrder} újranyitva!`);
        await mindenAdatFrissitese();
        return true;
    }
    return false;
}
const ujranyitLezartMeccsAdminbol = meccsUjranyitasaReset;

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

async function adatbazisTeljesLenullazas() {
    if (!confirm("FIGYELEM! ADATBÁZIS LENULLÁZÁSA (0-RA ÁLLÍTÁS):\n\nBiztosan törölsz MINDEN versenyt, kategóriát, versenyzőt, nevezést, tatamit, mérkőzést és élő eredményt?\n\n(A belépési felhasználói fiókok megmaradnak, de minden versenyadat véglegesen törlődik!)")) {
        return;
    }
    if (!confirm("Megerősítés: Valóban teljesen üres, 0 adatos adatbázissal szeretnél indulni?")) {
        return;
    }

    const res = await TatamiMaster.apiSend('Tournaments/reset-empty', 'POST', {});
    if (res.ok) {
        TatamiMaster.toast("Az adatbázis teljes versenyadata lenullázva (0 rekord)!");
        await mindenAdatFrissitese();
        ugorjVersenyekFulre();
    } else {
        TatamiMaster.toast("Hiba történt az adatbázis lenullázásakor!", "hiba");
    }
}

// ============================================================================
// VERSENYNAPI TATAMI-MENETREND ÉS PIHENŐIDŐS ROTÁCIÓS MOTOR
// ============================================================================
function isNoiKategoria(kat) {
    return TatamiMaster.isNoiKategoria(kat);
}

function kategoriaSorrendHasonlito(katA, katB) {
    return TatamiMaster.kategoriaSorrendHasonlito(katA, katB);
}

function bontKumiteMeccsekFordulokra(katMeccsek) {
    return TatamiMaster.bontKumiteMeccsekFordulokra(katMeccsek);
}

async function automatikusTatamiMenetrendRendezes(celTatamiId = null, csendes = false) {
    const frissMeccsek = await TatamiMaster.apiGet('Matches');
    if (!Array.isArray(frissMeccsek) || frissMeccsek.length === 0) {
        if (!csendes) TatamiMaster.toast("Nincs kisorsolt mérkőzés, amit rendezni lehetne!", "figyelem");
        return;
    }

    await TatamiMaster.rendezTatamiMenetrend(celTatamiId);

    if (!csendes) {
        TatamiMaster.toast("Tatami menetrend optimalizálva! (1. Kata korosztályonként: Lány->Fiú selejtező, majd Lány->Fiú döntő; 2. Kumite korosztályonként és kategóriánként rotálva!)");
    }
    await mindenAdatFrissitese();
}

async function osszesKategoriaAutomatikusSorsolasa() {
    if (globalTatamik.length === 0 || globalKategoriak.length === 0) {
        TatamiMaster.toast("Először töltsd be a tesztadatokat!", "figyelem");
        return;
    }

    if (!confirm("AUTOMATIKUS TELJES SORSOLÁS & MENETREND:\n\nKisorsoljuk az összes kategóriát a Tatami A, B, C pástokra (korosztályos elosztásban), és felépítsük a korosztályos Kata (Selejtező -> Döntő) + Kumite menetrendet?")) {
        return;
    }

    for (let m of globalMerkozesek) {
        await TatamiMaster.apiSend('Matches/' + m.id, 'DELETE');
    }
    localStorage.removeItem('kataDontoMeccsIdk');
    localStorage.removeItem('kataEredmenyek');
    localStorage.removeItem('kumiteReszletek');

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

        // Azonos korosztály Kata és Kumite számai ugyanarra a tatamira kerülnek:
        // Tatami A: 8-11 év (Gyerek) | Tatami B: 12-15 év (Serdülő & Ifjúsági) | Tatami C: 16+ év (Junior, Felnőtt, Senior)
        let celTatami = tatA;
        const minAge = kat.minAge ?? 0;
        if (minAge <= 11) {
            celTatami = tatA;
        } else if (minAge <= 15) {
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
            generalt = TatamiMaster.generalEgyenesKiesesMeccsek(kat.id, tId, [], kevert, sorszamMap[tId]);
            sorszamMap[tId] += generalt.length;
        }

        for (let m of generalt) {
            await TatamiMaster.apiSend('Matches', 'POST', m);
        }
    }

    await automatikusTatamiMenetrendRendezes(null, true);
    TatamiMaster.toast("Teljes sorsolás és korosztályos tatami-menetrend elkészült!");
}

