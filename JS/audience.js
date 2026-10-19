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

function ellenorizEdzoiMod() {
    const user = TatamiMaster.lekerBejelentkezes();
    const edzoPanel = document.getElementById('edzoiNevezesPanel');
    const badge = document.getElementById('loggedCoachBadge');
    const headerSub = document.getElementById('audienceHeaderSub');

    if (user && (user.role.toUpperCase() === 'COACH' || user.role.toUpperCase() === 'EDZO' || user.role.toUpperCase() === 'ADMIN')) {
        if (edzoPanel) edzoPanel.style.display = 'block';
        if (badge) {
            badge.style.display = 'inline-block';
            const nev = user.displayName || user.username;
            const klubInfo = user.club ? ` - ${user.club}` : '';
            const ovInfo = user.degree ? ` (${user.degree})` : '';
            badge.innerText = `👤 ${nev}${ovInfo}${klubInfo} [EDZŐ]`;
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
    } else {
        if (edzoPanel) edzoPanel.style.display = 'none';
    }
}

async function audienceAdatokBetoltese() {
    try {
        const [v, k, n, t, m] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches')
        ]);

        audVersenyzok = v;
        audKategoriak = k;
        audNevezesek = n;
        audTatamik = t;
        audMeccsek = m.sort((a, b) => a.matchOrder - b.matchOrder);

        // 1. Többszörös kategória-választó checkboxok frissítése (megőrizve a bepipáltakat!)
        frissitKategoriaCheckboxok();

        // 2. Legördülő menük frissítése
        frissitSelectMezo('audienceKategoriaSelect', audKategoriak.map(kat => ({
            val: kat.id, text: kat.name + ' (' + kat.matchType + ')'
        })));

        frissitSelectMezo('coachMasikKategoriaSelect', audKategoriak.map(kat => ({
            val: kat.id, text: kat.name + ' (' + kat.matchType + ')'
        })), '-- Válassz kategóriát! --');

        // Csapat Kata kategóriák (KATA típusú kategóriák)
        const kataKategoriak = audKategoriak.filter(kat => kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        frissitSelectMezo('teamKataKategoriaSelect', kataKategoriak.map(kat => ({
            val: kat.id, text: '🥋 ' + kat.name
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
    } catch (e) {
        console.error("Hiba az élő adatok lekérésekor:", e);
    }
}

function frissitKategoriaCheckboxok() {
    const cont = document.getElementById('coachUjKategoriaCheckboxes');
    if (!cont) return;

    // Megjegyezzük, mik voltak már bepipálva az 5 mp-es frissítés előtt
    const bepipaltIdk = Array.from(cont.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));

    cont.innerHTML = audKategoriak.map(kat => {
        const isKata = (kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        const jelzo = isKata ? '🧘 KATA' : '🥊 KUMITE';
        const checked = bepipaltIdk.includes(kat.id) ? 'checked' : '';
        return `
            <label class="kat-check-item">
                <input type="checkbox" class="coach-kat-cb" value="${kat.id}" ${checked}>
                <span><strong>${kat.name}</strong> <small style="color:#666;">[${jelzo}]</small></span>
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
    const nev = document.getElementById('coachUjNev').value.trim();
    const klub = document.getElementById('coachUjKlub').value.trim() || "Shobu HSE";
    const ov = document.getElementById('coachUjOv').value.trim() || "10. kyu";
    const suly = parseInt(document.getElementById('coachUjSuly').value) || 60;
    const szulEv = parseInt(document.getElementById('coachUjSzulEv').value) || 2008;

    const kijeloltKatIdk = Array.from(document.querySelectorAll('.coach-kat-cb:checked')).map(cb => parseInt(cb.value));

    if (!nev || kijeloltKatIdk.length === 0) {
        alert("⚠️ Kérlek add meg a versenyző nevét, és pipálj be legalább 1 kategóriát (pl. Kata és/vagy Kumite)!");
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

        // Minden bepipált kategóriába benevezzük!
        for (let katId of kijeloltKatIdk) {
            await TatamiMaster.apiSend('Registrations', 'POST', {
                competitorId: mentettVersenyzo.id,
                categoryId: katId
            });
        }

        alert(`✔ ${nev} sikeresen regisztrálva és benevezve ${kijeloltKatIdk.length} db kategóriába!`);
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
    const csapatNev = document.getElementById('teamKataCsapatNev').value.trim();
    const tag1Id = parseInt(document.getElementById('teamTag1Select').value);
    const tag2Id = parseInt(document.getElementById('teamTag2Select').value);
    const tag3Id = parseInt(document.getElementById('teamTag3Select').value);
    const katId = parseInt(document.getElementById('teamKataKategoriaSelect').value);

    if (!csapatNev || !tag1Id || !tag2Id || !katId) {
        alert("⚠️ Kérlek adj meg egy csapatnevet, válassz ki legalább 2 csapattagot és a Kata / Team Kata kategóriát!");
        return;
    }

    const tagIdk = [tag1Id, tag2Id, tag3Id].filter(Boolean);
    const egyediTagIdk = [...new Set(tagIdk)];
    if (egyediTagIdk.length !== tagIdk.length) {
        alert("⛔ Ugyanazt a versenyzőt nem választhatod ki kétszer ugyanazon csapaton belül!");
        return;
    }

    const tagObjektumok = egyediTagIdk.map(id => audVersenyzok.find(v => v.id === id)).filter(Boolean);
    const tagNevek = tagObjektumok.map(v => v.name.split(' ')[0] || v.name).join(', ');
    const klubNev = tagObjektumok[0]?.club || "Shobu HSE";
    const teljesCsapatMegnevezes = `${csapatNev} (${tagNevek})`;

    // Létrehozzuk a csapat-entitást és benevezzük a Team Kata kategóriába
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

        alert(`🥋 "${teljesCsapatMegnevezes}" sikeresen benevezve a kategóriába!`);
        audienceAdatokBetoltese();
    }
}

// =========================================================
// 3. MEGLÉVŐ VERSENYZŐ UTÓLAGOS NEVEZÉSE TOVÁBBI KATEGÓRIÁBA
// =========================================================
async function coachMeglevoNevezes() {
    const versId = parseInt(document.getElementById('coachMeglevoVersenyzoSelect').value);
    const katId = parseInt(document.getElementById('coachMasikKategoriaSelect').value);

    if (!versId || !katId) {
        alert("⚠️ Válaszd ki a versenyzőt és a kategóriát is!");
        return;
    }

    // VÉDELEM: Ellenőrizzük, hogy nincs-e már benevezve pontosan ebbe a kategóriába
    const marBenneVan = audNevezesek.some(n => n.competitorId === versId && n.categoryId === katId);
    if (marBenneVan) {
        alert("⛔ Ez a versenyző már szerepel ebben a kategóriában! (Másik kategóriába ettől függetlenül benevezheted.)");
        return;
    }

    const res = await TatamiMaster.apiSend('Registrations', 'POST', {
        competitorId: versId,
        categoryId: katId
    });

    if (res.ok) {
        alert("✔ A versenyző sikeresen benevezve a további kategóriába!");
        audienceAdatokBetoltese();
    }
}

// =========================================================
// ÉLŐ TATAMI KÁRTYÁK ÉS ÁGRAJZOK MEGJELENÍTÉSE
// =========================================================
function nevKereso(id) {
    let v = audVersenyzok.find(x => x.id === id);
    return v ? (v.name + ' <small>(' + v.club + ')</small>') : 'Várakozik...';
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
        html += '<div style="background: #222; color: white; padding: 12px 18px; font-size: 1.2rem; font-weight: bold;">' + t.name + '</div>';
        html += '<div style="padding: 18px;">';

        if (aktualis) {
            let kat = audKategoriak.find(k => k.id === aktualis.categoryId);
            let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
            let isDonto = (isKata && TatamiMaster.isKataDontoMeccs(aktualis.id));

            html += '<div style="margin-bottom: 15px;">';
            html += '<span class="live-badge">' + (isKata ? 'MOST KATÁZIK' : 'MOST KÜZD') + ' (#' + aktualis.matchOrder + ')</span> ';
            html += '<small style="color:#666; font-weight:bold;">' + (kat ? kat.name : '') + (isDonto ? ' [TOP 6 DÖNTŐ]' : '') + '</small>';

            if (isKata) {
                html += '<div style="margin-top: 8px; font-size: 1.1rem;"><strong style="color:#dc3545;">🥋 ' + nevKereso(aktualis.competitor1Id) + '</strong></div>';
            } else {
                html += '<div style="margin-top: 8px; font-size: 1.05rem;"><strong style="color:#dc3545;">🔴 ' + nevKereso(aktualis.competitor1Id) + '</strong><br>vs.<br><strong>⚪ ' + nevKereso(aktualis.competitor2Id) + '</strong></div>';
            }
            html += '</div>';
        } else {
            html += '<p style="color: #888; margin-bottom: 15px;">Jelenleg nincs aktív mérkőzés a tatamin.</p>';
        }

        if (felkeszul) {
            let felkKat = audKategoriak.find(k => k.id === felkeszul.categoryId);
            let isFelkKata = (felkKat && felkKat.matchType && felkKat.matchType.toUpperCase() === 'KATA');

            html += '<div style="border-top: 1px solid #eee; padding-top: 12px;">';
            html += '<span class="prep-badge">FELKÉSZÜL (#' + felkeszul.matchOrder + ')</span> ';
            html += '<small style="color:#666;">' + (felkKat ? felkKat.name : '') + '</small>';

            if (isFelkKata) {
                html += '<div style="margin-top: 6px; font-size: 0.95rem;">🥋 ' + nevKereso(felkeszul.competitor1Id) + '</div>';
            } else {
                html += '<div style="margin-top: 6px; font-size: 0.95rem;">🔴 ' + nevKereso(felkeszul.competitor1Id) + ' vs. ⚪ ' + nevKereso(felkeszul.competitor2Id) + '</div>';
            }
            html += '</div>';
        }

        html += '</div></div>';
    }

    document.getElementById('audienceTatamiGrid').innerHTML = html;
}

function audienceAgrajzFrissites() {
    const select = document.getElementById('audienceKategoriaSelect');
    const container = document.getElementById('audienceBracketContainer');
    if (!select || !container) return;

    const katId = parseInt(select.value);
    if (!katId) return;

    const kivalasztottKat = audKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType && kivalasztottKat.matchType.toUpperCase() === 'KATA');
    let katMeccsek = audMeccsek.filter(m => m.categoryId === katId).sort((a, b) => a.id - b.id);

    if (katMeccsek.length === 0) {
        container.innerHTML = '<p style="margin-top:15px; color:#666;">A kategória sorsolása még nem történt meg.</p>';
        return;
    }

    if (isKata) {
        const kataTarolo = TatamiMaster.lekerKataEredmenyek();
        let selejtezoMeccsek = katMeccsek.filter(m => !TatamiMaster.isKataDontoMeccs(m.id));
        let dontoMeccsek = katMeccsek.filter(m => TatamiMaster.isKataDontoMeccs(m.id));

        function epitsAudienceKataTabla(meccsTomb, cim, isSelejtezoTabla) {
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

            let tHtml = '<h3 style="margin-top: 20px; margin-bottom: 10px; color: #222;">' + cim + '</h3>';
            tHtml += '<div style="overflow-x: auto;"><table class="data-table">';
            tHtml += '<tr><th>Helyezés</th><th>Versenyző / Csapat</th><th>B1 (Vezető)</th><th>B2</th><th>B3</th><th>B4</th><th>B5</th><th>Min (Kieső)</th><th>Max (Kieső)</th><th>ÖSSZPONTSZÁM</th><th>Státusz</th></tr>';

            for (let i = 0; i < teljesSorrend.length; i++) {
                let item = teljesSorrend[i];
                let vNev = item.versenyzo
                    ? ('<strong>' + item.versenyzo.name + '</strong> <small>(' + item.versenyzo.club + ' - ' + (item.versenyzo.belt || '') + ')</small>')
                    : '-';

                let ujrakatazas = false;
                if (item.kesz) {
                    if (i > 0 && teljesSorrend[i - 1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i - 1]) === 0) ujrakatazas = true;
                    if (i < teljesSorrend.length - 1 && teljesSorrend[i + 1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i + 1]) === 0) ujrakatazas = true;
                }

                let top6Jeloles = (isSelejtezoTabla && item.kesz && i < 6);
                let eremJel = (!isSelejtezoTabla && item.kesz && i === 0) ? '🥇 1.' : ((!isSelejtezoTabla && item.kesz && i === 1) ? '🥈 2.' : ((!isSelejtezoTabla && item.kesz && i === 2) ? '🥉 3.' : (item.kesz ? (i + 1) + '.' : '-')));
                let sorStilus = top6Jeloles ? 'background-color: #e8f5e9;' : (!isSelejtezoTabla && item.kesz && i < 3 ? 'background-color: #fffef0;' : '');

                tHtml += '<tr style="' + sorStilus + '">';
                tHtml += '<td><strong>' + eremJel + '</strong></td>';
                tHtml += '<td>' + vNev + (top6Jeloles ? ' <span style="background:#28a745;color:white;padding:2px 6px;border-radius:4px;font-size:0.75rem;">TOP 6 DÖNTŐS</span>' : '') + '</td>';

                for (let b = 0; b < 5; b++) {
                    let p = (item.pontok && item.pontok[b] !== undefined && item.pontok[b] !== null) ? item.pontok[b] : '-';
                    let st = (b === item.minIdx || b === item.maxIdx) ? 'text-decoration: line-through; color: #999;' : 'font-weight: bold;';
                    tHtml += '<td style="' + st + '">' + p + '</td>';
                }

                tHtml += '<td style="color: #666;">' + (item.kesz ? item.minErtek.toFixed(1) : '-') + '</td>';
                tHtml += '<td style="color: #666;">' + (item.kesz ? item.maxErtek.toFixed(1) : '-') + '</td>';
                tHtml += '<td style="font-size: 1.25rem; font-weight: bold; color: #dc3545;">' + (item.kesz ? item.osszeg.toFixed(1) : '-') + '</td>';
                tHtml += '<td>' + (ujrakatazas
                    ? '<span style="background:#dc3545;color:white;padding:3px 6px;border-radius:4px;font-weight:bold;">⚠️ ÚJRAKATÁZÁS!</span>'
                    : (item.kesz ? '<span style="color:green;font-weight:bold;">✔ Értékelve</span>' : '⏳ Rajtszám: #' + item.meccs.matchOrder)) + '</td>';
                tHtml += '</tr>';
            }
            tHtml += '</table></div>';
            return tHtml;
        }

        let html = '<p style="font-size: 0.85rem; color: #555; margin-top: 10px;">ℹ️ <em>Kata szabály: Az 5 bírói pontszámból a legmagasabb és a legalacsonyabb kiesik, a középső 3 összege adja a pontszámot. A selejtező legjobb 6 versenyzője (Top 6) a döntőben 0 pontról indulva újra katázik!</em></p>';
        if (dontoMeccsek.length > 0) {
            html += epitsAudienceKataTabla(dontoMeccsek, '🏆 KATA DÖNTŐ (TOP 6)', false);
        }
        html += epitsAudienceKataTabla(selejtezoMeccsek, '📋 1. Kör: Selejtező Ranglista (Top 6 jut a döntőbe)', true);
        container.innerHTML = html;
        return;
    }

    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();

    let jelmagyarazatHtml = '<div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px 15px; border-radius: 6px; margin-top: 15px; font-size: 0.85rem; display: flex; gap: 15px; flex-wrap: wrap;">';
    jelmagyarazatHtml += '<strong>📌 Győzelmi Jelmagyarázat:</strong>';
    for (let kulcs in TatamiMaster.WIN_TYPES) {
        let wt = TatamiMaster.WIN_TYPES[kulcs];
        jelmagyarazatHtml += '<span><strong style="color:#dc3545;">[' + wt.rovid + ']</strong> = ' + wt.cimke + (wt.pont ? ' <em>(' + wt.pont + 'p)</em>' : '') + '</span>';
    }
    jelmagyarazatHtml += '</div>';

    let fordulok = [];
    let osszes = katMeccsek.length;
    let isAgrajz = (osszes === 3 || osszes === 7 || osszes === 15 || osszes === 31);

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

    let html = jelmagyarazatHtml + '<div class="bracket-wrapper">';
    for (let r = 0; r < fordulok.length; r++) {
        let korCim = isAgrajz
            ? (r === fordulok.length - 1 ? "🏆 Döntő" : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló"))
            : "Körmérkőzések";

        html += '<div class="bracket-round"><h4>' + korCim + '</h4>';
        for (let m of fordulok[r]) {
            let isBye = (m.isFinished && !m.competitor2Id);
            let akaWinner = (m.isFinished && m.winnerId === m.competitor1Id) ? "winner" : "";
            let shiroWinner = (m.isFinished && m.winnerId === m.competitor2Id) ? "winner" : "";
            let shiroSzoveg = isBye ? "" : nevKereso(m.competitor2Id);

            let reszlet = kumiteAdatok[m.id];
            let modKod = isBye ? '' : (reszlet && reszlet.winType ? reszlet.winType : 'HANTEI');
            let modRovid = (modKod && TatamiMaster.WIN_TYPES[modKod]) ? TatamiMaster.WIN_TYPES[modKod].rovid : modKod;
            let modCimke = (modKod && TatamiMaster.WIN_TYPES[modKod]) ? TatamiMaster.WIN_TYPES[modKod].cimke : '';

            let akaJelzes = akaWinner ? (modRovid ? '<strong>[' + modRovid + ']</strong> 🏆' : '🏆') : '';
            let shiroJelzes = shiroWinner ? (modRovid ? '<strong>[' + modRovid + ']</strong> 🏆' : '🏆') : '';

            html += '<div class="bracket-match ' + (m.isFinished ? 'finished' : '') + '" title="' + (m.isFinished ? modCimke : '') + '">';
            html += '<div style="background:#eee; padding: 4px 10px; font-size:0.8rem; font-weight:bold; display:flex; justify-content:space-between;"><span>Mérkőzés #' + m.matchOrder + '</span><span>' + (m.isFinished ? modCimke : '') + '</span></div>';
            html += '<div class="bracket-fighter aka ' + akaWinner + '"><span>🔴 ' + nevKereso(m.competitor1Id) + '</span><span>' + akaJelzes + '</span></div>';
            html += '<div class="bracket-fighter shiro ' + shiroWinner + '"><span>' + (shiroSzoveg ? '⚪ ' + shiroSzoveg : '&nbsp;') + '</span><span>' + shiroJelzes + '</span></div>';
            html += '</div>';
        }
        html += '</div>';
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
        html += '<h3 style="margin-top: 25px; margin-bottom: 10px;">📊 Körmérkőzés Élő Tabella</h3>';
        html += '<table class="data-table"><tr><th>Helyezés</th><th>Versenyző</th><th>Győzelmek</th><th>Súlyozott Pontszám</th><th>Győzelmek részletezése</th></tr>';
        for (let i = 0; i < tabella.length; i++) {
            let v = audVersenyzok.find(x => x.id === tabella[i].id);
            let erem = (i === 0) ? '🥇 1.' : (i === 1 ? '🥈 2.' : (i === 2 ? '🥉 3.' : (i + 1) + '.'));
            html += '<tr>';
            html += '<td><strong>' + erem + '</strong></td>';
            html += '<td><strong>' + (v ? v.name + ' (' + v.club + ')' : '#' + tabella[i].id) + '</strong></td>';
            html += '<td><strong>' + tabella[i].gyozelem + ' db</strong></td>';
            html += '<td style="color:#dc3545; font-weight:bold; font-size:1.1rem;">' + tabella[i].pont + ' pont</td>';
            html += '<td>' + (tabella[i].modok.length > 0 ? tabella[i].modok.join(', ') : '-') + '</td>';
            html += '</tr>';
        }
        html += '</table>';
    }

    container.innerHTML = html;
}