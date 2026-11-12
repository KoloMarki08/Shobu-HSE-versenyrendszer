let audVersenyek = [];
let audVersenyzok = [];
let audKategoriak = [];
let audNevezesek = [];
let audTatamik = [];
let audMeccsek = [];

let utolsoSzolitasAllapotMap = {}; // Kulcs: "compId_matchId" -> "MOST" | "FELKESZUL"
let audFrissitesIdozito = null;

window.onload = function() {
    ellenorizEdzoiMod();
    audienceAdatokBetoltese();

    // Valós idejű frissítés: ha a bírói pultnál változik az óra / pontszám / hosszabbítás, azonnal újrarajzoljuk a kártyákat!
    TatamiMaster.on('liveTatamiFrissult', function() {
        rajzolTatamiKartyak();
        frissitMikorKuzdokPanel();
    });

    // Ha bármelyik gépen új nevezés, sorsolás, továbbjutás vagy meccslezárás történik, késleltetés nélkül frissítünk!
    TatamiMaster.on('liveAdatValtozott', function() {
        if (audFrissitesIdozito) clearTimeout(audFrissitesIdozito);
        audFrissitesIdozito = setTimeout(() => {
            audienceAdatokBetoltese();
        }, 220);
    });

    TatamiMaster.on('liveKapcsolatValtozott', function(st) {
        const badge = document.getElementById('audienceLiveSyncBadge');
        if (!badge) return;
        const ok = st && st.connected;
        badge.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${ok ? '#22C55E' : '#F59E0B'};display:inline-block;"></span><span>${ok ? 'ÉLŐ SZINKRON AKTÍV' : 'AUTOMATIKUS FRISSÍTÉS'}</span>`;
    });

    // Biztonsági háttérfrissítés 4 másodpercenként arra az esetre is, ha offline hálózaton szakadozna a Wi-Fi
    setInterval(audienceAdatokBetoltese, 4000);
};

function lekerKovetettVersenyzoIdk() {
    const vId = TatamiMaster.lekerAktualisVersenyId();
    const tomb = TatamiMaster.safeJsonParse('tatamiKovetettVersenyzok_' + vId, []);
    return Array.isArray(tomb) ? tomb.map(x => parseInt(x)).filter(Boolean) : [];
}

function mentKovetettVersenyzoIdk(idTomb) {
    const vId = TatamiMaster.lekerAktualisVersenyId();
    const egyedi = [...new Set(idTomb.map(x => parseInt(x)).filter(Boolean))];
    localStorage.setItem('tatamiKovetettVersenyzok_' + vId, JSON.stringify(egyedi));
}

function toggleVersenyzoKovetes(compId) {
    const id = parseInt(compId);
    if (!id) return;
    let lista = lekerKovetettVersenyzoIdk();
    const vObj = audVersenyzok.find(v => v.id === id);
    const nev = vObj ? vObj.name : ('#' + id);

    if (lista.includes(id)) {
        lista = lista.filter(x => x !== id);
        mentKovetettVersenyzoIdk(lista);
        TatamiMaster.toast(`${nev} eltávolítva a követett versenyzők közül.`, "figyelem");
    } else {
        lista.push(id);
        mentKovetettVersenyzoIdk(lista);
        TatamiMaster.toast(`${nev} kitűzve a követett versenyzők közé!`);
    }
    frissitMikorKuzdokPanel();
}

function ugorjVersenyzoIdobecslore(compId) {
    const id = parseInt(compId);
    if (!id) return;
    const lista = lekerKovetettVersenyzoIdk();
    if (!lista.includes(id)) {
        lista.push(id);
        mentKovetettVersenyzoIdk(lista);
    }
    const sel = document.getElementById('mikorKuzdokVersenyzoSelect');
    if (sel) sel.value = String(id);
    frissitMikorKuzdokPanel();
    const card = document.getElementById('mikorKuzdokCard');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function valasztMikorKuzdokDropdown(val) {
    const id = parseInt(val);
    if (!id) {
        frissitMikorKuzdokPanel();
        return;
    }
    const v = audVersenyzok.find(x => x.id === id);
    if (v) {
        const inp = document.getElementById('mikorKuzdokKereso');
        if (inp) inp.value = v.name;
    }
    frissitMikorKuzdokPanel();
}

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
        const vers = await TatamiMaster.apiGet('Tournaments');
        audVersenyek = Array.isArray(vers) ? vers : [];

        frissitEdzoiNevezesZarolasUI();

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
        frissitKategoriaCheckboxok();

        frissitSelectMezo('audienceKategoriaSelect', audKategoriak.map(kat => ({
            val: kat.id, text: kat.name + ' (' + kat.matchType + ')'
        })));

        frissitSelectMezo('coachMasikKategoriaSelect', audKategoriak.map(kat => ({
            val: kat.id, text: kat.name + ' (' + kat.matchType + ')'
        })), '-- Válassz kategóriát! --');

        const kataKategoriak = audKategoriak.filter(kat => kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        frissitSelectMezo('teamKataKategoriaSelect', kataKategoriak.map(kat => ({
            val: kat.id, text: kat.name
        })), '-- Válassz Kata / Team Kata kategóriát! --');

        const versOpciok = audVersenyzok.map(vers => ({
            val: vers.id, text: vers.name + ' (' + vers.club + ')'
        }));
        frissitSelectMezo('coachMeglevoVersenyzoSelect', versOpciok, '-- Válassz versenyzőt! --');
        frissitSelectMezo('teamTag1Select', versOpciok, '-- 1. Csapattag --');
        frissitSelectMezo('teamTag2Select', versOpciok, '-- 2. Csapattag --');
        frissitSelectMezo('teamTag3Select', versOpciok, '-- 3. Csapattag (opcionális) --');
        frissitSelectMezo('mikorKuzdokVersenyzoSelect', versOpciok, '-- Vagy válassz versenyzőt a listából --');

        rajzolTatamiKartyak();
        frissitMikorKuzdokPanel();
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
                <span><strong>${TatamiMaster.escapeHtml(kat.name)}</strong> <small style="color:#52525B;display:inline-flex;align-items:center;gap:3px;">[${jelzo}]</small></span>
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
        html += '<option value="' + e.val + '">' + TatamiMaster.escapeHtml(e.text) + '</option>';
    }
    sel.innerHTML = html;
    if (aktualis) sel.value = aktualis;
}

// =========================================================
// „MIKOR KÜZDÖK?” — ÉLŐ SZÓLÍTÁS- ÉS VÁRAKOZÁSI IDŐ BECSLŐ
// =========================================================
function szamolMeccsVarhatoIdoAdatok(celMeccs) {
    const tat = audTatamik.find(t => t.id === celMeccs.tatamiId);
    const tatNev = tat ? tat.name : ('Tatami #' + (celMeccs.tatamiId || '?'));
    const kat = audKategoriak.find(k => k.id === celMeccs.categoryId);
    const isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');

    if (celMeccs.isFinished) {
        return {
            statuszKod: 'KESZ',
            tatamiNev: tatNev,
            elotteDb: 0,
            becsultPerc: 0,
            varhatoIdopont: null,
            isKata: isKata,
            kategoria: kat
        };
    }

    // Az adott tatami összes még hátralévő (le nem zárt, nem erőnyerő) mérkőzése sorszám szerint
    const tatamiSor = audMeccsek.filter(m => {
        if (m.tatamiId !== celMeccs.tatamiId || m.isFinished) return false;
        const mKat = audKategoriak.find(k => k.id === m.categoryId);
        const mIsKata = (mKat && mKat.matchType && mKat.matchType.toUpperCase() === 'KATA');
        if (mIsKata) return m.competitor1Id !== null;
        // Későbbi ágrajz fordulós meccs is foglalja a helyet a sorszámban, ha már ki van sorsolva a tatamira
        return !(m.competitor1Id !== null && m.competitor2Id === null && m.winnerId !== null);
    }).sort((a, b) => a.matchOrder - b.matchOrder);

    const pozicio = tatamiSor.findIndex(m => m.id === celMeccs.id);

    // Ha még nincs ismert ellenfél egy későbbi fordulóban, de a sorszám alapján becsülhető:
    const elotteMeccsek = pozicio >= 0
        ? tatamiSor.slice(0, pozicio)
        : tatamiSor.filter(m => m.matchOrder < celMeccs.matchOrder);

    const elotteDb = elotteMeccsek.length;
    const liveTatami = TatamiMaster.lekerLiveTatamiAllapot(celMeccs.tatamiId);

    if (elotteDb === 0 && (isKata ? celMeccs.competitor1Id !== null : (celMeccs.competitor1Id !== null && celMeccs.competitor2Id !== null))) {
        return {
            statuszKod: 'MOST',
            tatamiNev: tatNev,
            elotteDb: 0,
            becsultPerc: 0,
            varhatoIdopont: 'MOST',
            liveTatami: liveTatami,
            isKata: isKata,
            kategoria: kat
        };
    }

    // Becsült másodpercek összegzése az előtte lévő meccsek valódi korcsoport-idejéből!
    let osszMp = 0;
    elotteMeccsek.forEach((m, idx) => {
        const mKat = audKategoriak.find(k => k.id === m.categoryId);
        if (idx === 0 && liveTatami && String(liveTatami.matchId) === String(m.id) && typeof liveTatami.remainingSeconds === 'number') {
            osszMp += Math.max(25, liveTatami.remainingSeconds + 30);
        } else {
            osszMp += TatamiMaster.becsulMeccsIdotartamMp(mKat);
        }
    });

    const becsultPerc = Math.max(1, Math.round(osszMp / 60));
    const varhatoDate = new Date(Date.now() + osszMp * 1000);
    const varhatoIdopont = varhatoDate.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

    const ellenfelIsmeretlen = !isKata && (!celMeccs.competitor1Id || !celMeccs.competitor2Id);

    return {
        statuszKod: ellenfelIsmeretlen ? 'FORDULORA_VAR' : (elotteDb === 1 ? 'FELKESZUL' : 'VARAKOZIK'),
        tatamiNev: tatNev,
        elotteDb: elotteDb,
        becsultPerc: becsultPerc,
        varhatoIdopont: varhatoIdopont,
        isKata: isKata,
        kategoria: kat
    };
}

function ellenorizKovetettSzolitasRiasztas(kovetettIdk) {
    if (!Array.isArray(kovetettIdk) || kovetettIdk.length === 0) return;

    for (const compId of kovetettIdk) {
        const vObj = audVersenyzok.find(v => v.id === compId);
        if (!vObj) continue;

        const erintettMeccsek = audMeccsek.filter(m => !m.isFinished && (m.competitor1Id === compId || m.competitor2Id === compId));
        for (const m of erintettMeccsek) {
            const info = szamolMeccsVarhatoIdoAdatok(m);
            const kulcs = `${compId}_${m.id}`;
            const elozo = utolsoSzolitasAllapotMap[kulcs];

            if ((info.statuszKod === 'MOST' || info.statuszKod === 'FELKESZUL') && elozo !== info.statuszKod) {
                utolsoSzolitasAllapotMap[kulcs] = info.statuszKod;
                if (elozo !== undefined) {
                    const uzenet = info.statuszKod === 'MOST'
                        ? `SZÓLÍTÁS: ${vObj.name} MOST LÉP TATAMIRA (${info.tatamiNev}, #${m.matchOrder}. meccs)!`
                        : `FELKÉSZÜL: ${vObj.name} a KÖVETKEZŐ mérkőzésen küzd (${info.tatamiNev}, #${m.matchOrder}. meccs)!`;
                    TatamiMaster.toast(uzenet, 'figyelem');
                }
            } else {
                utolsoSzolitasAllapotMap[kulcs] = info.statuszKod;
            }
        }
    }
}

function frissitMikorKuzdokPanel() {
    const keresoInp = document.getElementById('mikorKuzdokKereso');
    const kovetettSav = document.getElementById('mikorKuzdokKovetettSav');
    const cont = document.getElementById('mikorKuzdokEredmenyContainer');
    if (!cont) return;

    const kovetettIdk = lekerKovetettVersenyzoIdk();
    ellenorizKovetettSzolitasRiasztas(kovetettIdk);

    // Kitűzött (követett) versenyzők sávja
    if (kovetettSav) {
        if (kovetettIdk.length > 0) {
            const chipek = kovetettIdk.map(id => {
                const v = audVersenyzok.find(x => x.id === id);
                if (!v) return '';
                return `<span style="background:#18181B;color:#FAF8F5;padding:4px 10px;border-radius:999px;font-size:0.8rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
                    ${TatamiMaster.icon('pin', 13)}
                    <span>${TatamiMaster.escapeHtml(v.name)}</span>
                    <button type="button" onclick="toggleVersenyzoKovetes(${v.id})" style="background:none;border:none;color:#FAF8F5;cursor:pointer;padding:0;display:inline-flex;" title="Követés kikapcsolása">${TatamiMaster.icon('x', 13)}</button>
                </span>`;
            }).filter(Boolean).join(' ');

            kovetettSav.style.display = chipek ? 'flex' : 'none';
            kovetettSav.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#FAF8F5;border:1px solid #E4E0D7;padding:8px 12px;border-radius:8px;margin-bottom:12px;';
            kovetettSav.innerHTML = `<strong style="font-size:0.8rem;color:#52525B;">Követett versenyzők ezen a telefonon:</strong> ${chipek}`;
        } else {
            kovetettSav.style.display = 'none';
            kovetettSav.innerHTML = '';
        }
    }

    const kereso = (keresoInp ? keresoInp.value : '').toLowerCase().trim();

    // Megjelenítendő versenyzők: követettek + keresési találatok
    let celVersenyzok = [];
    if (kereso.length > 0) {
        celVersenyzok = audVersenyzok.filter(v =>
            (v.name && v.name.toLowerCase().includes(kereso)) ||
            (v.club && v.club.toLowerCase().includes(kereso))
        ).slice(0, 12);
    } else if (kovetettIdk.length > 0) {
        celVersenyzok = audVersenyzok.filter(v => kovetettIdk.includes(v.id));
    }

    if (celVersenyzok.length === 0) {
        if (kereso.length > 0) {
            cont.innerHTML = `<div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:8px;padding:14px;color:#52525B;font-size:0.9rem;">Nincs találat a(z) „<strong>${TatamiMaster.escapeHtml(kereso)}</strong>” keresésre ezen a versenyen.</div>`;
        } else {
            cont.innerHTML = `<div style="background:#FAF8F5;border:1px dashed #CFC9BC;border-radius:8px;padding:12px 16px;color:#52525B;font-size:0.88rem;display:flex;align-items:center;gap:8px;">
                ${TatamiMaster.icon('info', 16)}
                <span>Írd be fent a versenyző vagy az egyesület nevét (vagy válassz a legördülő listából), és tűzd ki a Követés gombbal!</span>
            </div>`;
        }
        return;
    }

    const kataTarolo = TatamiMaster.lekerKataEredmenyek();
    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();

    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;">`;

    for (const v of celVersenyzok) {
        const kovetve = kovetettIdk.includes(v.id);
        const meccsek = audMeccsek.filter(m => m.competitor1Id === v.id || m.competitor2Id === v.id)
            .sort((a, b) => (a.isFinished === b.isFinished ? a.matchOrder - b.matchOrder : (a.isFinished ? 1 : -1)));

        html += `<div style="background:#FAF8F5;border:1.5px solid ${kovetve ? '#18181B' : '#E4E0D7'};border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">`;
        html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;border-bottom:1px solid #E4E0D7;padding-bottom:8px;">
            <div>
                <strong style="font-size:1.05rem;color:#18181B;display:block;">${TatamiMaster.escapeHtml(v.name)}</strong>
                <span style="font-size:0.8rem;color:#52525B;font-weight:700;">${TatamiMaster.escapeHtml(v.club || '-')} &bull; ${TatamiMaster.escapeHtml(v.belt || '-')} ${v.weight ? '&bull; ' + v.weight + ' kg' : ''}</span>
            </div>
            <button type="button" class="${kovetve ? 'btn btn-danger' : 'btn btn-outline-blue'}" style="padding:5px 10px;font-size:0.78rem;" onclick="toggleVersenyzoKovetes(${v.id})">
                ${TatamiMaster.icon('pin', 13)} ${kovetve ? 'Kitűzve' : 'Követés'}
            </button>
        </div>`;

        if (meccsek.length === 0) {
            const nevKatok = audNevezesek.filter(n => n.competitorId === v.id).map(n => {
                const k = audKategoriak.find(x => x.id === n.categoryId);
                return k ? k.name : null;
            }).filter(Boolean);
            html += `<div style="font-size:0.86rem;color:#52525B;">
                ${nevKatok.length > 0
                    ? `Benevezve: <strong>${TatamiMaster.escapeHtml(nevKatok.join(', '))}</strong> — <em>A kategória sorsolása még nem készült el.</em>`
                    : `<em>Még nincs kisorsolt mérkőzése ezen a versenyen.</em>`}
            </div>`;
        } else {
            for (const m of meccsek) {
                const info = szamolMeccsVarhatoIdoAdatok(m);
                const katNev = info.kategoria ? info.kategoria.name : 'Kategória';
                const isAka = (m.competitor1Id === v.id);
                const ellenfelId = isAka ? m.competitor2Id : m.competitor1Id;
                const ellenfelObj = audVersenyzok.find(x => x.id === ellenfelId);
                const idoSzabaly = (!info.isKata && info.kategoria) ? TatamiMaster.lekerKumiteIdoSzabaly(info.kategoria) : null;

                let statuszBadge = '';
                let idoSor = '';
                let keretSzin = '#E4E0D7';

                if (info.statuszKod === 'MOST') {
                    keretSzin = '#991B1B';
                    statuszBadge = `<span style="background:#991B1B;color:#FAF8F5;padding:3px 9px;border-radius:5px;font-size:0.76rem;font-weight:800;">MOST A TATAMIN!</span>`;
                    const live = info.liveTatami;
                    idoSor = `<div style="color:#991B1B;font-weight:800;font-size:0.88rem;">Jelenleg zajlik a mérkőzés${live && live.timer ? ` (Óra: ${TatamiMaster.escapeHtml(live.timer)} • ${TatamiMaster.escapeHtml(live.roundLabel || 'ALAPIDŐ')})` : ''}!</div>`;
                } else if (info.statuszKod === 'FELKESZUL') {
                    keretSzin = '#18181B';
                    statuszBadge = `<span style="background:#18181B;color:#FAF8F5;padding:3px 9px;border-radius:5px;font-size:0.76rem;font-weight:800;">FELKÉSZÜL! (KÖVETKEZŐ)</span>`;
                    idoSor = `<div style="color:#18181B;font-weight:800;font-size:0.86rem;">1 mérkőzés van előtted &bull; Kb. ${info.becsultPerc} perc múlva (~${info.varhatoIdopont}) — Kérjük, állj a tatamihoz!</div>`;
                } else if (info.statuszKod === 'VARAKOZIK') {
                    statuszBadge = `<span style="background:#F3F0EA;border:1px solid #CFC9BC;color:#18181B;padding:3px 8px;border-radius:5px;font-size:0.75rem;font-weight:800;">VÁRAKOZIK</span>`;
                    idoSor = `<div style="color:#3F3F46;font-size:0.85rem;">Előtted lévő meccsek a tatamin: <strong>${info.elotteDb} db</strong> &bull; Várható kezdés: <strong>~${info.becsultPerc} perc múlva</strong> (kb. ${info.varhatoIdopont})</div>`;
                } else if (info.statuszKod === 'FORDULORA_VAR') {
                    statuszBadge = `<span style="background:#F3F0EA;border:1px solid #CFC9BC;color:#52525B;padding:3px 8px;border-radius:5px;font-size:0.75rem;font-weight:700;">ELLENFÉLRE VÁR</span>`;
                    idoSor = `<div style="color:#52525B;font-size:0.84rem;">Következő forduló (~${info.becsultPerc} perc múlva, kb. ${info.varhatoIdopont})</div>`;
                } else {
                    const gyozott = (m.winnerId === v.id);
                    if (info.isKata) {
                        const kEr = kataTarolo[m.id];
                        statuszBadge = `<span style="background:#E4E0D7;color:#18181B;padding:3px 8px;border-radius:5px;font-size:0.75rem;font-weight:800;">ÉRTÉKELVE${kEr && kEr.kesz ? ': ' + kEr.osszeg.toFixed(1) + ' p' : ''}</span>`;
                    } else {
                        const resz = kumiteAdatok[m.id];
                        const wt = (resz && resz.winType && TatamiMaster.WIN_TYPES[resz.winType]) ? ` [${TatamiMaster.WIN_TYPES[resz.winType].rovid}]` : '';
                        statuszBadge = gyozott
                            ? `<span style="background:#18181B;color:#FAF8F5;padding:3px 8px;border-radius:5px;font-size:0.75rem;font-weight:800;">GYŐZELEM${wt}</span>`
                            : `<span style="background:#E4E0D7;color:#52525B;padding:3px 8px;border-radius:5px;font-size:0.75rem;font-weight:700;">LEZÁRULT</span>`;
                    }
                }

                const ovEsEllenfelHtml = info.isKata
                    ? `<span style="font-size:0.84rem;color:#3F3F46;font-weight:700;">Egyéni / Csapat Kata bemutató${TatamiMaster.isKataDontoMeccs(m.id) ? ' [TOP 6 DÖNTŐ]' : ''}</span>`
                    : `<div style="font-size:0.85rem;color:#18181B;margin-top:2px;">
                        Felkötendő öv: <span class="fighter-tag ${isAka ? 'aka-tag' : 'shiro-tag'}">${isAka ? 'AKA (Piros)' : 'SHIRO (Fehér)'}</span>
                        &bull; Ellenfél: <strong>${ellenfelObj ? TatamiMaster.escapeHtml(ellenfelObj.name + ' (' + ellenfelObj.club + ')') : 'Még küzd az előző körben'}</strong>
                       </div>`;

                html += `<div style="background:#FFFFFF;border:1.5px solid ${keretSzin};border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;">
                        <span style="font-weight:800;font-size:0.86rem;color:#18181B;">
                            ${TatamiMaster.escapeHtml(info.tatamiNev)} &bull; #${m.matchOrder}. meccs &bull; ${TatamiMaster.escapeHtml(katNev)}
                        </span>
                        ${statuszBadge}
                    </div>
                    ${idoSzabaly ? `<div style="font-size:0.76rem;color:#52525B;font-weight:700;">Küzdőidő szabály: ${TatamiMaster.escapeHtml(idoSzabaly.teljesCimke)}</div>` : ''}
                    ${ovEsEllenfelHtml}
                    ${idoSor}
                </div>`;
            }
        }

        html += `</div>`;
    }

    html += `</div>`;
    cont.innerHTML = html;
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
// ÉLŐ TATAMI KÁRTYÁK VALÓS IDEJŰ ÓRÁVAL ÉS PONTSZÁMMAL
// =========================================================
function nevKereso(id) {
    let v = audVersenyzok.find(x => x.id === id);
    return v ? (TatamiMaster.escapeHtml(v.name) + ' <small style="color:#52525B;">(' + TatamiMaster.escapeHtml(v.club) + ')</small>') : 'Várakozik...';
}

function formazRovidBuntetes(b) {
    const p = parseInt(b) || 0;
    if (p === 0) return '0';
    if (p === 1) return '1 Chui';
    if (p === 2) return '2 Chui';
    if (p === 3) return '1 GENTEN';
    return 'SIKAKU';
}

function rajzolTatamiKartyak() {
    const gridEl = document.getElementById('audienceTatamiGrid');
    if (!gridEl) return;

    let html = '';
    const aktVersenyId = TatamiMaster.lekerAktualisVersenyId();

    for (let t of audTatamik) {
        let varakozoMeccsek = audMeccsek.filter(m => {
            if (m.tatamiId !== t.id || m.isFinished) return false;
            let kat = audKategoriak.find(k => k.id === m.categoryId);
            let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
            return isKata ? (m.competitor1Id !== null) : (m.competitor1Id !== null && m.competitor2Id !== null);
        });

        let aktualis = varakozoMeccsek[0];
        let felkeszul = varakozoMeccsek[1];

        // Valós idejű bírói pult állapot az adott tatamihoz
        const liveAdat = TatamiMaster.safeJsonParse('tatamiAdatok_' + t.id, null);
        const liveErvenyes = liveAdat && (!liveAdat.versenyId || parseInt(liveAdat.versenyId) === aktVersenyId);

        html += '<div class="tatami-live-card">';
        html += '<div style="background: #18181B; color: #FAF8F5; padding: 12px 18px; font-size: 1.08rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center; gap: 8px;">';
        html += '<span style="display:inline-flex;align-items:center;gap:8px;">' + TatamiMaster.icon('shield', 16) + '<span>' + TatamiMaster.escapeHtml(t.name) + '</span></span>';
        if (liveErvenyes && liveAdat.roundLabel) {
            const isOvertime = liveAdat.roundCode && liveAdat.roundCode !== 'ALAP' && liveAdat.roundCode !== 'KATA';
            html += `<span style="background:${isOvertime ? '#991B1B' : '#27272A'};color:#FAF8F5;border:1px solid rgba(255,255,255,0.25);padding:2px 9px;border-radius:999px;font-size:0.74rem;font-weight:800;">${TatamiMaster.escapeHtml(liveAdat.roundLabel)}</span>`;
        }
        html += '</div>';
        html += '<div style="padding: 18px;">';

        if (aktualis) {
            let kat = audKategoriak.find(k => k.id === aktualis.categoryId);
            let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
            let isDonto = (isKata && TatamiMaster.isKataDontoMeccs(aktualis.id));

            html += '<div style="margin-bottom: 15px;">';
            html += '<span class="live-badge">' + TatamiMaster.icon('play', 11) + ' ' + (isKata ? 'MOST KATÁZIK' : 'MOST KÜZD') + ' (#' + aktualis.matchOrder + ')</span> ';
            html += '<small style="color:#52525B; font-weight:700; margin-left:4px;">' + (kat ? TatamiMaster.escapeHtml(kat.name) : '') + (isDonto ? ' [TOP 6 DÖNTŐ]' : '') + '</small>';

            if (isKata) {
                html += '<div style="margin-top: 10px; font-size: 1.05rem;"><strong style="color:#18181B; display:inline-flex; align-items:center; gap:6px;">' + TatamiMaster.icon('award', 16) + ' ' + nevKereso(aktualis.competitor1Id) + '</strong></div>';
                if (liveErvenyes && liveAdat.mode === 'KATA') {
                    const sc = liveAdat.kataScores || ['-', '-', '-', '-', '-'];
                    html += `<div style="margin-top:10px;background:#FAF8F5;border:1px solid #E4E0D7;border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span style="font-size:0.8rem;color:#52525B;font-weight:700;">Élő bírói pontok: ${sc.map((p, idx) => `B${idx + 1}:${p || '-'}`).join(' | ')}</span>
                        <strong style="font-size:1.18rem;color:#18181B;">Össz: ${TatamiMaster.escapeHtml(liveAdat.kataTotal || '0.0')}</strong>
                    </div>`;
                }
            } else {
                html += '<div style="margin-top: 10px; font-size: 1rem; line-height: 1.6;"><strong style="color:#18181B;"><span class="fighter-tag aka-tag">AKA</span>' + nevKereso(aktualis.competitor1Id) + '</strong><br><span style="color:#71717A;font-size:0.82rem;font-weight:700;">VS.</span><br><strong style="color:#27272A;"><span class="fighter-tag shiro-tag">SHIRO</span>' + nevKereso(aktualis.competitor2Id) + '</strong></div>';

                // Élő Kumite Eredményjelző (Óra + Pontok + Büntetések + Korcsoport szabály)
                const idoSzab = TatamiMaster.lekerKumiteIdoSzabaly(kat);
                if (liveErvenyes && liveAdat.mode === 'KUMITE' && (!liveAdat.matchId || liveAdat.matchId === aktualis.id)) {
                    html += `<div style="margin-top:12px;background:#18181B;color:#FAF8F5;border-radius:9px;padding:10px 14px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;text-align:center;">
                        <div style="text-align:left;">
                            <div style="font-size:0.72rem;color:#FCA5A5;font-weight:800;">AKA</div>
                            <div style="font-size:1.55rem;font-weight:900;line-height:1;">${liveAdat.akaScore ?? 0}</div>
                            <div style="font-size:0.72rem;color:#A1A1AA;">Bünt.: ${formazRovidBuntetes(liveAdat.akaPenalties)}</div>
                        </div>
                        <div style="background:#27272A;border:1.5px solid #52525B;border-radius:8px;padding:6px 12px;">
                            <div style="font-size:1.45rem;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:1px;">${TatamiMaster.escapeHtml(liveAdat.timer || '02:00')}</div>
                            <div style="font-size:0.68rem;color:#E4E0D7;font-weight:700;">${TatamiMaster.escapeHtml(liveAdat.roundLabel || 'ALAPIDŐ')}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.72rem;color:#E4E0D7;font-weight:800;">SHIRO</div>
                            <div style="font-size:1.55rem;font-weight:900;line-height:1;">${liveAdat.shiroScore ?? 0}</div>
                            <div style="font-size:0.72rem;color:#A1A1AA;">Bünt.: ${formazRovidBuntetes(liveAdat.shiroPenalties)}</div>
                        </div>
                    </div>`;
                } else if (idoSzab) {
                    html += `<div style="margin-top:8px;font-size:0.78rem;color:#52525B;font-weight:700;">Időszabály: ${TatamiMaster.escapeHtml(idoSzab.teljesCimke)}</div>`;
                }
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
            html += '<small style="color:#52525B; margin-left:4px;">' + (felkKat ? TatamiMaster.escapeHtml(felkKat.name) : '') + '</small>';

            if (isFelkKata) {
                html += '<div style="margin-top: 8px; font-size: 0.92rem; color:#27272A;">' + TatamiMaster.icon('award', 14) + ' ' + nevKereso(felkeszul.competitor1Id) + '</div>';
            } else {
                html += '<div style="margin-top: 8px; font-size: 0.92rem; color:#27272A;"><span class="fighter-tag aka-tag">AKA</span>' + nevKereso(felkeszul.competitor1Id) + ' <span style="color:#71717A;">vs.</span> <span class="fighter-tag shiro-tag">SHIRO</span>' + nevKereso(felkeszul.competitor2Id) + '</div>';
            }
            html += '</div>';
        }

        if (varakozoMeccsek.length > 2) {
            html += `<div style="border-top:1px dashed #E4E0D7;margin-top:10px;padding-top:8px;font-size:0.78rem;color:#52525B;font-weight:700;">További várakozó mérkőzések ezen a tatamin: ${varakozoMeccsek.length - 2} db</div>`;
        }

        html += '</div></div>';
    }

    if (audTatamik.length === 0) {
        html = '<div class="pro-card" style="grid-column: 1 / -1; color: #52525B; text-align: center; padding: 20px;">Ehhez a versenyhez még nincs létrehozott tatami. Az adminisztrátor a Tatamik &amp; Sorsolás menüben adhat hozzá tatamit.</div>';
    }

    gridEl.innerHTML = html;
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
        container.innerHTML = TatamiMaster.epitsKataRanglistaHtml(katMeccsek, audVersenyzok);
        return;
    }

    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();
    const idoSzab = TatamiMaster.lekerKumiteIdoSzabaly(kivalasztottKat);

    let jelmagyarazatHtml = '<div style="background: #FAF8F5; border: 1px solid #E4E0D7; padding: 12px 16px; border-radius: 8px; margin-top: 16px; font-size: 0.85rem; display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">';
    if (idoSzab) {
        jelmagyarazatHtml += `<span style="background:#18181B;color:#FAF8F5;padding:3px 10px;border-radius:6px;font-weight:800;font-size:0.78rem;">${TatamiMaster.icon('clock', 13)} Küzdőidő: ${TatamiMaster.escapeHtml(idoSzab.teljesCimke)}</span>`;
    }
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
            html += '<td><strong>' + (v ? TatamiMaster.escapeHtml(v.name + ' (' + v.club + ')') : '#' + tabella[i].id) + '</strong></td>';
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

    const kovetettIdk = lekerKovetettVersenyzoIdk();
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
                <th>Benevezett Kategóriák</th>
                <th>Mikor küzd?</th>
            </tr>
        </thead>
        <tbody>`;

    for (let v of szurt) {
        const kovetve = kovetettIdk.includes(v.id);
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
            <td style="white-space:nowrap;">
                <button type="button" class="${kovetve ? 'btn btn-outline-green' : 'btn btn-outline-blue'}" style="padding:4px 9px;font-size:0.78rem;" onclick="ugorjVersenyzoIdobecslore(${v.id})">
                    ${TatamiMaster.icon('clock', 13)} ${kovetve ? 'Követve (Megnéz)' : 'Mikor küzd?'}
                </button>
            </td>
        </tr>`;
    }

    html += `</tbody></table></div>`;
    cont.innerHTML = html;
}
