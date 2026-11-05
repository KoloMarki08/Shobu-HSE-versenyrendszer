let audVersenyek = [];
let audVersenyzok = [];
let audKategoriak = [];
let audNevezesek = [];
let audTatamik = [];
let audMeccsek = [];

window.onload = function() {
    ellenorizEdzoiMod();
    audienceAdatokBetoltese();
    setInterval(audienceAdatokBetoltese, 5000);
};

function frissitEdzoiNevezesZarolasUI() {
    const lezarva = TatamiMaster.isNevezesLezarva();
    const banner = document.getElementById('edzoiNevezesZarvaBanner');
    const urlapok = document.getElementById('edzoiNevezesUrlapok');
    const statusBadge = document.getElementById('edzoiNevezesStatusBadge');

    if (banner) {
        banner.style.display = lezarva ? 'flex' : 'none';
    }
    if (statusBadge) {
        statusBadge.innerHTML = lezarva
            ? `<span style="background:#991B1B;color:#FAF8F5;padding:5px 12px;border-radius:6px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">${TatamiMaster.icon('lock', 14)} NEVEZÉS LEZÁRVA</span>`
            : `<span style="background:#18181B;color:#FAF8F5;padding:5px 12px;border-radius:6px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">${TatamiMaster.icon('unlock', 14)} NEVEZÉS NYITVA</span>`;
    }
    if (urlapok) {
        urlapok.style.opacity = lezarva ? '0.45' : '1';
        urlapok.style.pointerEvents = lezarva ? 'none' : 'auto';
        urlapok.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = lezarva;
        });
    }
}

function ellenorizEdzoiMod() {
    const user = TatamiMaster.lekerBejelentkezes();
    const edzoPanel = document.getElementById('edzoiNevezesPanel');
    const badge = document.getElementById('loggedCoachBadge');
    const headerSub = document.getElementById('audienceHeaderSub');

    if (user && (user.role.toUpperCase() === 'COACH' || user.role.toUpperCase() === 'EDZO' || user.role.toUpperCase() === 'ADMIN')) {
        if (edzoPanel) edzoPanel.style.display = 'block';
        if (badge) {
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '6px';
            const nev = TatamiMaster.escapeHtml(user.displayName || user.username);
            const klubInfo = user.club ? ` - ${TatamiMaster.escapeHtml(user.club)}` : '';
            const ovInfo = user.degree ? ` (${TatamiMaster.escapeHtml(user.degree)})` : '';
            badge.innerHTML = `${TatamiMaster.icon('user', 14)} <span>${nev}${ovInfo}${klubInfo} [EDZŐ]</span>`;
        }
        if (headerSub) headerSub.innerText = 'EDZŐI NEVEZÉS & ÉLŐ KÖVETÉS';

        const klubInput = document.getElementById('coachUjKlub');
        if (klubInput && user.club && !klubInput.value) {
            klubInput.value = user.club;
        }
        const teamInput = document.getElementById('teamKataCsapatNev');
        if (teamInput && user.club && !teamInput.value) {
            teamInput.value = user.club + ' - A csapat';
        }
        frissitEdzoiNevezesZarolasUI();
    } else {
        if (edzoPanel) edzoPanel.style.display = 'none';
    }
}

async function audienceAdatokBetoltese() {
    try {
        // 1. Először a versenyek listáját töltjük be, hogy az aktív verseny ID biztosan érvényes legyen
        const vers = await TatamiMaster.apiGet('Tournaments');
        audVersenyek = Array.isArray(vers) ? vers : [];

        frissitEdzoiNevezesZarolasUI();

        // 2. Lekérjük az aktuálisan kiválasztott versenyhez tartozó adatokat
        const [v, k, n, t, m] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches')
        ]);

        audVersenyzok = Array.isArray(v) ? v : [];
        audKategoriak = Array.isArray(k) ? k : [];
        audNevezesek  = Array.isArray(n) ? n : [];
        audTatamik    = Array.isArray(t) ? t : [];
        audMeccsek    = Array.isArray(m) ? m.sort((a, b) => a.matchOrder - b.matchOrder) : [];

        frissitAudienceVersenyBar();

        // 3. Többszörös kategória-választó checkboxok frissítése (megőrizve a bepipáltakat!)
        frissitKategoriaCheckboxok();

        // 4. Legördülő menük frissítése
        frissitSelectMezo('audienceKategoriaSelect', audKategoriak.map(kat => ({
            val: kat.id, text: kat.name + ' (' + kat.matchType + ')'
        })));

        frissitSelectMezo('coachMasikKategoriaSelect', audKategoriak.map(kat => ({
            val: kat.id, text: kat.name + ' (' + kat.matchType + ')'
        })), '-- Válassz kategóriát! --');

        // Csapat Kata kategóriák (KATA típusú kategóriák)
        const kataKategoriak = audKategoriak.filter(kat => kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        frissitSelectMezo('teamKataKategoriaSelect', kataKategoriak.map(kat => ({
            val: kat.id, text: kat.name
        })), '-- Válassz Kata / Team Kata kategóriát! --');

        // Versenyző választók (egyéni + csapattagok)
        const versOpciok = audVersenyzok.map(vers => ({
            val: vers.id, text: vers.name + ' (' + vers.club + ')'
        }));
        frissitSelectMezo('coachMeglevoVersenyzoSelect', versOpciok, '-- Válassz versenyzőt! --');
        frissitSelectMezo('teamTag1Select', versOpciok, '-- 1. Csapattag --');
        frissitSelectMezo('teamTag2Select', versOpciok, '-- 2. Csapattag --');
        frissitSelectMezo('teamTag3Select', versOpciok, '-- 3. Csapattag (opcionális) --');

        rajzolTatamiKartyak();
        audienceAgrajzFrissites();
        rajzolAudienceVersenyzokTabla();
    } catch (e) {
        console.error("Hiba az élő adatok lekérésekor:", e);
    }
}

function frissitAudienceVersenyBar() {
    const sel = document.getElementById('audienceVersenySelect');
    const nevEl = document.getElementById('audienceAktivVersenyNev');
    const statuszEl = document.getElementById('audienceAktivVersenyStatusz');
    const statPillEl = document.getElementById('audienceAktivVersenyStatPill');
    const metaEl = document.getElementById('audienceAktivVersenyMeta');
    const plakatBox = document.getElementById('audienceVersenyPlakatBox');

    const aktId = TatamiMaster.lekerAktualisVersenyId();
    const aktVerseny = audVersenyek.find(v => v.id === aktId) || audVersenyek[0];
    const autoVerseny = TatamiMaster.keresLegaktualisabbVerseny(audVersenyek);
    const autoId = autoVerseny ? autoVerseny.id : aktId;

    if (sel && document.activeElement !== sel) {
        if (audVersenyek.length === 0) {
            sel.innerHTML = `<option value="1">Nincs meghirdetett verseny</option>`;
        } else {
            sel.innerHTML = audVersenyek.map(v => {
                const datum = v.date ? new Date(v.date).toLocaleDateString('hu-HU') : '';
                const autoJel = (v.id === autoId) ? ' [AKTUÁLIS]' : '';
                return `<option value="${v.id}" ${v.id === aktId ? 'selected' : ''}>#${v.id} – ${TatamiMaster.escapeHtml(v.name)} (${datum})${autoJel}</option>`;
            }).join('');
        }
    }

    if (statPillEl) {
        statPillEl.innerHTML = `${TatamiMaster.icon('users', 13)} ${audVersenyzok.length} versenyző &bull; ${audKategoriak.length} kategória &bull; ${audMeccsek.length} mérkőzés`;
    }

    if (aktVerseny) {
        const tisztaNev = aktVerseny.name || ('Verseny #' + aktVerseny.id);
        const datumSzoveg = aktVerseny.date ? new Date(aktVerseny.date).toLocaleDateString('hu-HU') : '-';
        const szervezoSzoveg = TatamiMaster.escapeHtml(aktVerseny.organizer || 'Shobu HSE');
        const statuszSzoveg = aktVerseny.status || 'ÉLŐ / NYITVA';
        const isLezart = statuszSzoveg.toUpperCase().includes('LEZÁR') || TatamiMaster.isNevezesLezarva(aktVerseny.id);

        if (nevEl) nevEl.innerText = tisztaNev;
        if (statuszEl) {
            statuszEl.innerText = TatamiMaster.isNevezesLezarva(aktVerseny.id) ? 'NEVEZÉS LEZÁRVA' : statuszSzoveg;
            statuszEl.style.background = isLezart ? '#991B1B' : '#18181B';
        }

        const mellekletek = TatamiMaster.lekerVersenyMellekletek();
        const extra = mellekletek[aktVerseny.name] || {};
        const safeNameAttr = (aktVerseny.name || '').replace(/'/g, "");

        if (plakatBox) {
            if (extra.plakat) {
                plakatBox.style.display = 'block';
                plakatBox.innerHTML = `<img src="${extra.plakat}" alt="Plakát" onclick="mutatAudiencePlakatNagyban('${safeNameAttr}')" style="width:54px;height:74px;object-fit:cover;border-radius:6px;border:1px solid #CFC9BC;cursor:pointer;" title="Kattints a versenyplakát nagyításához">`;
            } else {
                plakatBox.style.display = 'none';
                plakatBox.innerHTML = '';
            }
        }

        if (metaEl) {
            const kiirasGomb = extra.kiiras
                ? `<a href="${extra.kiiras}" download="${extra.kiirasNev || 'Versenykiiras.pdf'}" class="btn btn-outline" style="padding:3px 9px;font-size:0.76rem;">${TatamiMaster.icon('file', 13)} Versenykiírás letöltése</a>`
                : '';
            const plakatGomb = extra.plakat
                ? `<button type="button" class="btn btn-outline" style="padding:3px 9px;font-size:0.76rem;" onclick="mutatAudiencePlakatNagyban('${safeNameAttr}')">${TatamiMaster.icon('image', 13)} Plakát megtekintése</button>`
                : '';

            metaEl.innerHTML = `
                <span>${TatamiMaster.icon('calendar', 14)} Dátum: <strong>${datumSzoveg}</strong></span>
                <span>&bull; ${TatamiMaster.icon('user', 14)} Szervező: <strong>${szervezoSzoveg}</strong></span>
                ${kiirasGomb}
                ${plakatGomb}
            `;
        }
    }
}

async function audienceValtsVersenyt(versenyId) {
    const numId = parseInt(versenyId);
    if (!numId) return;
    const celVerseny = audVersenyek.find(v => v.id === numId);
    const nev = celVerseny ? celVerseny.name : ('Verseny #' + numId);

    TatamiMaster.mentAktualisVerseny(numId, nev, true);

    const katSelect = document.getElementById('audienceKategoriaSelect');
    if (katSelect) katSelect.value = '';

    TatamiMaster.toast(`Átváltva a(z) „${nev}” verseny élő követésére és nevezési felületére!`);
    await audienceAdatokBetoltese();
}

function mutatAudiencePlakatNagyban(versenyNev) {
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

function frissitKategoriaCheckboxok() {
    const cont = document.getElementById('coachUjKategoriaCheckboxes');
    if (!cont) return;

    const bepipaltIdk = Array.from(cont.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
    const lezarva = TatamiMaster.isNevezesLezarva();

    cont.innerHTML = audKategoriak.map(kat => {
        const isKata = (kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        const jelzo = isKata ? `${TatamiMaster.icon('award', 13)} KATA` : `${TatamiMaster.icon('target', 13)} KUMITE`;
        const checked = bepipaltIdk.includes(kat.id) ? 'checked' : '';
        return `
            <label class="kat-check-item">
                <input type="checkbox" class="coach-kat-cb" value="${kat.id}" ${checked} ${lezarva ? 'disabled' : ''}>
                <span><strong>${kat.name}</strong> <small style="color:#52525B;display:inline-flex;align-items:center;gap:3px;">[${jelzo}]</small></span>
            </label>
        `;
    }).join('');
}

function frissitSelectMezo(selectId, elemek, alapSzoveg) {
    const sel = document.getElementById(selectId);
    if (!sel || document.activeElement === sel) return;

    const aktualis = sel.value;
    let html = alapSzoveg ? ('<option value="">' + alapSzoveg + '</option>') : '';
    for (let e of elemek) {
        html += '<option value="' + e.val + '">' + e.text + '</option>';
    }
    sel.innerHTML = html;
    if (aktualis) sel.value = aktualis;
}

// =========================================================
// 1. ÚJ EGYÉNI VERSENYZŐ FELVÉTELE (AKÁR TÖBB KATEGÓRIÁBA EGYSZERRE!)
// =========================================================
async function coachUjVersenyzoEsNevezes() {
    if (TatamiMaster.isNevezesLezarva()) {
        alert("A nevezés lezárult! Új versenyző vagy csapat benevezése már nem lehetséges.");
        return;
    }

    const nev = document.getElementById('coachUjNev').value.trim();
    const klub = document.getElementById('coachUjKlub').value.trim() || "Shobu HSE";
    const ov = document.getElementById('coachUjOv').value.trim() || "10. kyu";
    const suly = parseInt(document.getElementById('coachUjSuly').value) || 60;
    const szulEv = parseInt(document.getElementById('coachUjSzulEv').value) || 2008;

    const kijeloltKatIdk = Array.from(document.querySelectorAll('.coach-kat-cb:checked')).map(cb => parseInt(cb.value));

    if (!nev || kijeloltKatIdk.length === 0) {
        alert("Kérlek add meg a versenyző nevét, és pipálj be legalább 1 kategóriát (pl. Kata és/vagy Kumite)!");
        return;
    }

    const compRes = await TatamiMaster.apiSend('Competitors', 'POST', {
        name: nev,
        club: klub,
        belt: ov,
        weight: suly,
        birthYear: szulEv
    });

    if (compRes.ok) {
        const mentettVersenyzo = await compRes.json();

        for (let katId of kijeloltKatIdk) {
            await TatamiMaster.apiSend('Registrations', 'POST', {
                competitorId: mentettVersenyzo.id,
                categoryId: katId
            });
        }

        alert(`${nev} sikeresen regisztrálva és benevezve ${kijeloltKatIdk.length} db kategóriába!`);
        document.getElementById('coachUjNev').value = '';
        document.getElementById('coachUjSuly').value = '';
        document.querySelectorAll('.coach-kat-cb').forEach(cb => cb.checked = false);
        audienceAdatokBetoltese();
    }
}

// =========================================================
// 2. CSAPAT KATA (TEAM KATA) NEVEZÉSE MEGLÉVŐ VERSENYZŐKBŐL
// =========================================================
async function coachTeamKataNevezes() {
    if (TatamiMaster.isNevezesLezarva()) {
        alert("A nevezés lezárult! Új csapat benevezése már nem lehetséges.");
        return;
    }

    const csapatNev = document.getElementById('teamKataCsapatNev').value.trim();
    const tag1Id = parseInt(document.getElementById('teamTag1Select').value);
    const tag2Id = parseInt(document.getElementById('teamTag2Select').value);
    const tag3Id = parseInt(document.getElementById('teamTag3Select').value);
    const katId = parseInt(document.getElementById('teamKataKategoriaSelect').value);

    if (!csapatNev || !tag1Id || !tag2Id || !katId) {
        alert("Kérlek adj meg egy csapatnevet, válassz ki legalább 2 csapattagot és a Kata / Team Kata kategóriát!");
        return;
    }

    const tagIdk = [tag1Id, tag2Id, tag3Id].filter(Boolean);
    const egyediTagIdk = [...new Set(tagIdk)];
    if (egyediTagIdk.length !== tagIdk.length) {
        alert("Hiba: Ugyanazt a versenyzőt nem választhatod ki kétszer ugyanazon csapaton belül!");
        return;
    }

    const tagObjektumok = egyediTagIdk.map(id => audVersenyzok.find(v => v.id === id)).filter(Boolean);
    const tagNevek = tagObjektumok.map(v => v.name.split(' ')[0] || v.name).join(', ');
    const klubNev = tagObjektumok[0]?.club || "Shobu HSE";
    const teljesCsapatMegnevezes = `${csapatNev} (${tagNevek})`;

    const compRes = await TatamiMaster.apiSend('Competitors', 'POST', {
        name: teljesCsapatMegnevezes,
        club: klubNev,
        belt: "TEAM KATA",
        weight: 0,
        birthYear: tagObjektumok[0]?.birthYear || 2008
    });

    if (compRes.ok) {
        const mentettCsapat = await compRes.json();
        await TatamiMaster.apiSend('Registrations', 'POST', {
            competitorId: mentettCsapat.id,
            categoryId: katId
        });

        alert(`"${teljesCsapatMegnevezes}" sikeresen benevezve a kategóriába!`);
        audienceAdatokBetoltese();
    }
}

// =========================================================
// 3. MEGLÉVŐ VERSENYZŐ UTÓLAGOS NEVEZÉSE TOVÁBBI KATEGÓRIÁBA
// =========================================================
async function coachMeglevoNevezes() {
    if (TatamiMaster.isNevezesLezarva()) {
        alert("A nevezés lezárult! Új nevezés már nem adható le.");
        return;
    }

    const versId = parseInt(document.getElementById('coachMeglevoVersenyzoSelect').value);
    const katId = parseInt(document.getElementById('coachMasikKategoriaSelect').value);

    if (!versId || !katId) {
        alert("Válaszd ki a versenyzőt és a kategóriát is!");
        return;
    }

    const marBenneVan = audNevezesek.some(n => n.competitorId === versId && n.categoryId === katId);
    if (marBenneVan) {
        alert("Hiba: Ez a versenyző már szerepel ebben a kategóriában! (Másik kategóriába ettől függetlenül benevezheted.)");
        return;
    }

    const res = await TatamiMaster.apiSend('Registrations', 'POST', {
        competitorId: versId,
        categoryId: katId
    });

    if (res.ok) {
        alert("A versenyző sikeresen benevezve a további kategóriába!");
        audienceAdatokBetoltese();
    }
}

// =========================================================
// ÉLŐ TATAMI KÁRTYÁK ÉS ÁGRAJZOK MEGJELENÍTÉSE (MONOKRÓM)
// =========================================================
function nevKereso(id) {
    let v = audVersenyzok.find(x => x.id === id);
    return v ? (v.name + ' <small style="color:#52525B;">(' + v.club + ')</small>') : 'Várakozik...';
}

function rajzolTatamiKartyak() {
    let html = '';

    for (let t of audTatamik) {
        let varakozoMeccsek = audMeccsek.filter(m => {
            if (m.tatamiId !== t.id || m.isFinished) return false;
            let kat = audKategoriak.find(k => k.id === m.categoryId);
            let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
            return isKata ? (m.competitor1Id !== null) : (m.competitor1Id !== null && m.competitor2Id !== null);
        });

        let aktualis = varakozoMeccsek[0];
        let felkeszul = varakozoMeccsek[1];

        html += '<div class="tatami-live-card">';
        html += '<div style="background: #18181B; color: #FAF8F5; padding: 12px 18px; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">' + TatamiMaster.icon('shield', 16) + '<span>' + t.name + '</span></div>';
        html += '<div style="padding: 18px;">';

        if (aktualis) {
            let kat = audKategoriak.find(k => k.id === aktualis.categoryId);
            let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
            let isDonto = (isKata && TatamiMaster.isKataDontoMeccs(aktualis.id));

            html += '<div style="margin-bottom: 15px;">';
            html += '<span class="live-badge">' + TatamiMaster.icon('play', 11) + ' ' + (isKata ? 'MOST KATÁZIK' : 'MOST KÜZD') + ' (#' + aktualis.matchOrder + ')</span> ';
            html += '<small style="color:#52525B; font-weight:700; margin-left:4px;">' + (kat ? kat.name : '') + (isDonto ? ' [TOP 6 DÖNTŐ]' : '') + '</small>';

            if (isKata) {
                html += '<div style="margin-top: 10px; font-size: 1.05rem;"><strong style="color:#18181B; display:inline-flex; align-items:center; gap:6px;">' + TatamiMaster.icon('award', 16) + ' ' + nevKereso(aktualis.competitor1Id) + '</strong></div>';
            } else {
                html += '<div style="margin-top: 10px; font-size: 1rem; line-height: 1.6;"><strong style="color:#18181B;"><span class="fighter-tag aka-tag">AKA</span>' + nevKereso(aktualis.competitor1Id) + '</strong><br><span style="color:#71717A;font-size:0.82rem;font-weight:700;">VS.</span><br><strong style="color:#27272A;"><span class="fighter-tag shiro-tag">SHIRO</span>' + nevKereso(aktualis.competitor2Id) + '</strong></div>';
            }
            html += '</div>';
        } else {
            html += '<p style="color: #71717A; margin-bottom: 15px; font-size: 0.92rem;">Jelenleg nincs aktív mérkőzés a tatamin.</p>';
        }

        if (felkeszul) {
            let felkKat = audKategoriak.find(k => k.id === felkeszul.categoryId);
            let isFelkKata = (felkKat && felkKat.matchType && felkKat.matchType.toUpperCase() === 'KATA');

            html += '<div style="border-top: 1px solid #E4E0D7; padding-top: 12px;">';
            html += '<span class="prep-badge">' + TatamiMaster.icon('clock', 12) + ' FELKÉSZÜL (#' + felkeszul.matchOrder + ')</span> ';
            html += '<small style="color:#52525B; margin-left:4px;">' + (felkKat ? felkKat.name : '') + '</small>';

            if (isFelkKata) {
                html += '<div style="margin-top: 8px; font-size: 0.92rem; color:#27272A;">' + TatamiMaster.icon('award', 14) + ' ' + nevKereso(felkeszul.competitor1Id) + '</div>';
            } else {
                html += '<div style="margin-top: 8px; font-size: 0.92rem; color:#27272A;"><span class="fighter-tag aka-tag">AKA</span>' + nevKereso(felkeszul.competitor1Id) + ' <span style="color:#71717A;">vs.</span> <span class="fighter-tag shiro-tag">SHIRO</span>' + nevKereso(felkeszul.competitor2Id) + '</div>';
            }
            html += '</div>';
        }

        html += '</div></div>';
    }

    if (audTatamik.length === 0) {
        html = '<div class="pro-card" style="grid-column: 1 / -1; color: #52525B; text-align: center; padding: 20px;">Ehhez a versenyhez még nincs létrehozott tatami. Az adminisztrátor a Tatamik &amp; Sorsolás fülön adhat hozzá tatamit.</div>';
    }

    document.getElementById('audienceTatamiGrid').innerHTML = html;
}

function audienceAgrajzFrissites() {
    const select = document.getElementById('audienceKategoriaSelect');
    const container = document.getElementById('audienceBracketContainer');
    if (!select || !container) return;

    if (audKategoriak.length === 0) {
        container.innerHTML = '<p style="margin-top:15px; color:#52525B;">Ehhez a versenyhez még nincs meghirdetett kategória.</p>';
        return;
    }

    const katId = parseInt(select.value) || (audKategoriak[0] ? audKategoriak[0].id : 0);
    if (!katId) return;
    if (document.activeElement !== select) select.value = katId;

    const kivalasztottKat = audKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType && kivalasztottKat.matchType.toUpperCase() === 'KATA');
    let katMeccsek = audMeccsek.filter(m => m.categoryId === katId).sort((a, b) => a.id - b.id);

    if (katMeccsek.length === 0) {
        container.innerHTML = '<p style="margin-top:15px; color:#52525B;">A kategória sorsolása még nem történt meg.</p>';
        return;
    }

    if (isKata) {
        const kataTarolo = TatamiMaster.lekerKataEredmenyek();
        let selejtezoMeccsek = katMeccsek.filter(m => !TatamiMaster.isKataDontoMeccs(m.id));
        let dontoMeccsek = katMeccsek.filter(m => TatamiMaster.isKataDontoMeccs(m.id));

        function epitsAudienceKataTabla(meccsTomb, cim, ikonNev, isSelejtezoTabla) {
            let lista = meccsTomb.map(m => {
                let v = audVersenyzok.find(x => x.id === m.competitor1Id);
                let eredmeny = kataTarolo[m.id] || {
                    kesz: false, osszeg: 0, minErtek: 0, maxErtek: 0, vezetoBiro: 0,
                    pontok: ['-', '-', '-', '-', '-'], minIdx: -1, maxIdx: -1
                };
                return { meccs: m, versenyzo: v, ...eredmeny };
            });

            let lepontozottak = lista.filter(x => x.kesz).sort(TatamiMaster.kataSorrendHasonlito);
            let varakozok = lista.filter(x => !x.kesz);
            let teljesSorrend = lepontozottak.concat(varakozok);

            let tHtml = '<h3 style="margin-top: 22px; margin-bottom: 10px; color: #18181B; display:flex; align-items:center; gap:8px;">' + TatamiMaster.icon(ikonNev, 18) + '<span>' + cim + '</span></h3>';
            tHtml += '<div style="overflow-x: auto;"><table class="data-table">';
            tHtml += '<tr><th>Helyezés</th><th>Versenyző / Csapat</th><th>B1 (Vezető)</th><th>B2</th><th>B3</th><th>B4</th><th>B5</th><th>Min (Kieső)</th><th>Max (Kieső)</th><th>ÖSSZPONTSZÁM</th><th>Státusz</th></tr>';

            for (let i = 0; i < teljesSorrend.length; i++) {
                let item = teljesSorrend[i];
                let vNev = item.versenyzo
                    ? ('<strong>' + item.versenyzo.name + '</strong> <small style="color:#52525B;">(' + item.versenyzo.club + ' - ' + (item.versenyzo.belt || '') + ')</small>')
                    : '-';

                let ujrakatazas = false;
                if (item.kesz) {
                    if (i > 0 && teljesSorrend[i - 1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i - 1]) === 0) ujrakatazas = true;
                    if (i < teljesSorrend.length - 1 && teljesSorrend[i + 1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i + 1]) === 0) ujrakatazas = true;
                }

                let top6Jeloles = (isSelejtezoTabla && item.kesz && i < 6);
                let eremJel = (!isSelejtezoTabla && item.kesz && i < 3)
                    ? `${TatamiMaster.icon('medal', 15)} ${i + 1}.`
                    : (item.kesz ? (i + 1) + '.' : '-');
                let sorStilus = (top6Jeloles || (!isSelejtezoTabla && item.kesz && i < 3)) ? 'background-color: #FAF8F5;' : '';

                tHtml += '<tr style="' + sorStilus + '">';
                tHtml += '<td><strong>' + eremJel + '</strong></td>';
                tHtml += '<td>' + vNev + (top6Jeloles ? ' <span style="background:#18181B;color:#FAF8F5;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;">TOP 6 DÖNTŐS</span>' : '') + '</td>';

                for (let b = 0; b < 5; b++) {
                    let p = (item.pontok && item.pontok[b] !== undefined && item.pontok[b] !== null) ? item.pontok[b] : '-';
                    let st = (b === item.minIdx || b === item.maxIdx) ? 'text-decoration: line-through; color: #A1A1AA;' : 'font-weight: 700; color: #18181B;';
                    tHtml += '<td style="' + st + '">' + p + '</td>';
                }

                tHtml += '<td style="color: #71717A;">' + (item.kesz ? item.minErtek.toFixed(1) : '-') + '</td>';
                tHtml += '<td style="color: #71717A;">' + (item.kesz ? item.maxErtek.toFixed(1) : '-') + '</td>';
                tHtml += '<td style="font-size: 1.2rem; font-weight: 800; color: #18181B;">' + (item.kesz ? item.osszeg.toFixed(1) : '-') + '</td>';
                tHtml += '<td>' + (ujrakatazas
                    ? '<span style="background:#991B1B;color:white;padding:3px 8px;border-radius:4px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">' + TatamiMaster.icon('alert', 13) + ' ÚJRAKATÁZÁS!</span>'
                    : (item.kesz ? '<span style="color:#18181B;font-weight:700;display:inline-flex;align-items:center;gap:4px;">' + TatamiMaster.icon('check', 14) + ' Értékelve</span>' : '<span style="color:#52525B;display:inline-flex;align-items:center;gap:4px;">' + TatamiMaster.icon('clock', 13) + ' Rajtszám: #' + item.meccs.matchOrder + '</span>')) + '</td>';
                tHtml += '</tr>';
            }
            tHtml += '</table></div>';
            return tHtml;
        }

        let html = '<p style="font-size: 0.86rem; color: #52525B; margin-top: 12px; display:flex; align-items:center; gap:6px;">' + TatamiMaster.icon('info', 15) + ' <em>Kata szabály: Az 5 bírói pontszámból a legmagasabb és a legalacsonyabb kiesik, a középső 3 összege adja a pontszámot. A selejtező legjobb 6 versenyzője (Top 6) a döntőben 0 pontról indulva újra katázik!</em></p>';
        if (dontoMeccsek.length > 0) {
            html += epitsAudienceKataTabla(dontoMeccsek, 'KATA DÖNTŐ (TOP 6)', 'trophy', false);
        }
        html += epitsAudienceKataTabla(selejtezoMeccsek, '1. Kör: Selejtező Ranglista (Top 6 jut a döntőbe)', 'clipboard', true);
        container.innerHTML = html;
        return;
    }

    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();

    let jelmagyarazatHtml = '<div style="background: #FAF8F5; border: 1px solid #E4E0D7; padding: 12px 16px; border-radius: 8px; margin-top: 16px; font-size: 0.85rem; display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">';
    jelmagyarazatHtml += '<strong style="display:inline-flex;align-items:center;gap:6px;color:#18181B;">' + TatamiMaster.icon('pin', 15) + ' Győzelmi Jelmagyarázat:</strong>';
    for (let kulcs in TatamiMaster.WIN_TYPES) {
        let wt = TatamiMaster.WIN_TYPES[kulcs];
        jelmagyarazatHtml += '<span><strong style="color:#18181B;">[' + wt.rovid + ']</strong> = ' + wt.cimke + (wt.pont ? ' <em style="color:#52525B;">(' + wt.pont + 'p)</em>' : '') + '</span>';
    }
    jelmagyarazatHtml += '</div>';

    let fordulok = [];
    let osszes = katMeccsek.length;
    let isAgrajz = TatamiMaster.isKumiteAgrajz(katMeccsek);

    if (isAgrajz) {
        let korMeret = (osszes + 1) / 2;
        let idx = 0;
        while (korMeret >= 1) {
            fordulok.push(katMeccsek.slice(idx, idx + korMeret));
            idx += korMeret;
            korMeret /= 2;
        }
    } else {
        fordulok.push(katMeccsek);
    }

    let html = jelmagyarazatHtml + '<div class="bracket-wrapper ' + (isAgrajz ? 'is-elimination' : '') + '">';
    for (let r = 0; r < fordulok.length; r++) {
        let korCim = isAgrajz
            ? (r === fordulok.length - 1 ? `${TatamiMaster.icon('trophy', 15)} Döntő` : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló"))
            : "Körmérkőzések";

        html += '<div class="bracket-round"><h4>' + korCim + '</h4><div class="bracket-round-matches">';
        for (let m of fordulok[r]) {
            let isBye = (m.isFinished && !m.competitor2Id);
            let akaWinner = (m.isFinished && m.winnerId === m.competitor1Id) ? "winner" : "";
            let shiroWinner = (m.isFinished && m.winnerId === m.competitor2Id) ? "winner" : "";
            let shiroSzoveg = isBye ? "" : nevKereso(m.competitor2Id);

            let reszlet = kumiteAdatok[m.id];
            let modKod = isBye ? '' : (reszlet && reszlet.winType ? reszlet.winType : 'HANTEI');
            let modRovid = (modKod && TatamiMaster.WIN_TYPES[modKod]) ? TatamiMaster.WIN_TYPES[modKod].rovid : modKod;
            let modCimke = (modKod && TatamiMaster.WIN_TYPES[modKod]) ? TatamiMaster.WIN_TYPES[modKod].cimke : '';

            let akaJelzes = akaWinner ? (modRovid ? `<strong>[${modRovid}]</strong> ${TatamiMaster.icon('trophy', 14)}` : TatamiMaster.icon('trophy', 14)) : '';
            let shiroJelzes = shiroWinner ? (modRovid ? `<strong>[${modRovid}]</strong> ${TatamiMaster.icon('trophy', 14)}` : TatamiMaster.icon('trophy', 14)) : '';

            html += '<div class="bracket-slot"><div class="bracket-match ' + (m.isFinished ? 'finished' : '') + '" title="' + (m.isFinished ? modCimke : '') + '">';
            html += '<div style="background:#F3F0EA; border-bottom:1px solid #E4E0D7; padding: 5px 12px; font-size:0.78rem; font-weight:700; color:#3F3F46; display:flex; justify-content:space-between;"><span>Mérkőzés #' + m.matchOrder + '</span><span>' + (m.isFinished ? modCimke : '') + '</span></div>';
            html += '<div class="bracket-fighter aka ' + akaWinner + '"><span><span class="fighter-tag aka-tag">AKA</span>' + nevKereso(m.competitor1Id) + '</span><span>' + akaJelzes + '</span></div>';
            html += '<div class="bracket-fighter shiro ' + shiroWinner + '"><span>' + (shiroSzoveg ? '<span class="fighter-tag shiro-tag">SHIRO</span>' + shiroSzoveg : '<em style="color:#71717A;">Erőnyerő</em>') + '</span><span>' + shiroJelzes + '</span></div>';
            html += '</div></div>';
        }
        html += '</div></div>';
    }
    html += '</div>';

    if (!isAgrajz) {
        let stat = {};
        for (let m of katMeccsek) {
            if (m.competitor1Id && !stat[m.competitor1Id]) stat[m.competitor1Id] = { id: m.competitor1Id, gyozelem: 0, pont: 0, modok: [] };
            if (m.competitor2Id && !stat[m.competitor2Id]) stat[m.competitor2Id] = { id: m.competitor2Id, gyozelem: 0, pont: 0, modok: [] };

            if (m.isFinished && m.winnerId && stat[m.winnerId]) {
                let reszlet = kumiteAdatok[m.id];
                let modKod = reszlet && reszlet.winType ? reszlet.winType : 'HANTEI';
                let wt = TatamiMaster.WIN_TYPES[modKod] || TatamiMaster.WIN_TYPES['HANTEI'];
                stat[m.winnerId].gyozelem++;
                stat[m.winnerId].pont += wt.pont;
                stat[m.winnerId].modok.push(wt.rovid + ' (' + wt.cimke + ')');
            }
        }

        let tabella = Object.values(stat).sort((a, b) => (b.gyozelem - a.gyozelem) || (b.pont - a.pont));
        html += '<h3 style="margin-top: 25px; margin-bottom: 10px; display:flex; align-items:center; gap:8px; color:#18181B;">' + TatamiMaster.icon('chart', 18) + '<span>Körmérkőzés Élő Tabella</span></h3>';
        html += '<table class="data-table"><tr><th>Helyezés</th><th>Versenyző</th><th>Győzelmek</th><th>Súlyozott Pontszám</th><th>Győzelmek részletezése</th></tr>';
        for (let i = 0; i < tabella.length; i++) {
            let v = audVersenyzok.find(x => x.id === tabella[i].id);
            let erem = (i < 3) ? `${TatamiMaster.icon('medal', 15)} ${i + 1}.` : (i + 1) + '.';
            html += '<tr>';
            html += '<td><strong>' + erem + '</strong></td>';
            html += '<td><strong>' + (v ? v.name + ' (' + v.club + ')' : '#' + tabella[i].id) + '</strong></td>';
            html += '<td><strong>' + tabella[i].gyozelem + ' db</strong></td>';
            html += '<td style="color:#18181B; font-weight:800; font-size:1.08rem;">' + tabella[i].pont + ' pont</td>';
            html += '<td>' + (tabella[i].modok.length > 0 ? tabella[i].modok.join(', ') : '-') + '</td>';
            html += '</tr>';
        }
        html += '</table>';
    }

    container.innerHTML = html;
}

function rajzolAudienceVersenyzokTabla() {
    const cont = document.getElementById('audienceVersenyzokContainer');
    const dbEl = document.getElementById('audienceVersenyzokDb');
    if (dbEl) dbEl.innerText = audVersenyzok.length;
    if (!cont) return;

    const kereso = (document.getElementById('audienceVersenyzoKereso')?.value || '').toLowerCase().trim();
    const szurt = audVersenyzok.filter(v =>
        !kereso ||
        (v.name && v.name.toLowerCase().includes(kereso)) ||
        (v.club && v.club.toLowerCase().includes(kereso)) ||
        (v.belt && v.belt.toLowerCase().includes(kereso))
    );

    if (szurt.length === 0) {
        cont.innerHTML = `<p style="color:#71717A;margin:10px 0;">${audVersenyzok.length === 0 ? 'Erre a versenyre még nincs regisztrált versenyző.' : 'Nincs a keresésnek megfelelő versenyző ezen a versenyen.'}</p>`;
        return;
    }

    let html = `<div style="overflow-x:auto;"><table class="data-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Versenyző / Csapat neve</th>
                <th>Klub / Egyesület</th>
                <th>Övfokozat</th>
                <th>Súly</th>
                <th>Szül. év</th>
                <th>Benevezett Kategóriák (ezen a versenyen)</th>
            </tr>
        </thead>
        <tbody>`;

    for (let v of szurt) {
        const katPills = audNevezesek
            .filter(n => n.competitorId === v.id)
            .map(n => {
                const kat = audKategoriak.find(k => k.id === n.categoryId);
                return kat
                    ? `<span style="background:#F3F0EA;border:1px solid #CFC9BC;color:#18181B;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;display:inline-block;margin:2px;">${TatamiMaster.escapeHtml(kat.name)}</span>`
                    : '';
            }).join(' ') || '<em style="color:#71717A;">Még nincs kategóriába sorolva</em>';

        html += `<tr>
            <td><strong>#${v.id}</strong></td>
            <td><strong>${TatamiMaster.escapeHtml(v.name || '-')}</strong></td>
            <td>${TatamiMaster.escapeHtml(v.club || '-')}</td>
            <td><span style="background:#F3F0EA;border:1px solid #CFC9BC;padding:2px 7px;border-radius:6px;font-weight:700;font-size:0.8rem;">${TatamiMaster.escapeHtml(v.belt || '-')}</span></td>
            <td>${v.weight ? v.weight + ' kg' : '-'}</td>
            <td>${v.birthYear || '-'}</td>
            <td>${katPills}</td>
        </tr>`;
    }

    html += `</tbody></table></div>`;
    cont.innerHTML = html;
}
