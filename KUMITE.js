/* ========================================================================= */
/* KUMITE.js - Okos Sorsolás (Egyenes kiesés ÉS Körmerkőzés + Bírói Panel)   */
/* ========================================================================= */

function generalKumite() {
    if (aktualisFelhasznalo.szerepkor !== 'admin') { alert("Csak admin generálhat ágrajzot!"); return; }
    var kumiteVersenyzok = adatok.versenyzok.filter(v => !v.kategoria.toLowerCase().includes('kata'));
    if (kumiteVersenyzok.length === 0) { alert("Nincs Kumite versenyző a rendszerben!"); return; }

    var egyediKategoriak = [...new Set(kumiteVersenyzok.map(v => v.kategoria))];
    adatok.meccsek = [];

    egyediKategoriak.forEach(katNev => { generalEgyediAgrajz(katNev); });
    ellenorizTovabbjutasokat();

    if (typeof mentsdAzAllapototMySQLbe === "function") mentsdAzAllapototMySQLbe();
    alert("Az összes Kumite kategória sikeresen legenerálva!");
    if (typeof valtFul === "function") valtFul('tatami');
}

function generalEgyediAgrajz(kategoriaNev) {
    var jatekosok = adatok.versenyzok.filter(v => v.kategoria === kategoriaNev);
    if (jatekosok.length < 2) return;

    if (jatekosok.length <= 5) {
        var jatekosokRR = [...jatekosok];
        if (jatekosokRR.length % 2 !== 0) jatekosokRR.push({ nev: "BYE", id: "BYE" });
        var numRounds = jatekosokRR.length - 1;
        var halfSize = jatekosokRR.length / 2;
        var matchIndex = 0;

        for (var r = 0; r < numRounds; r++) {
            for (var i = 0; i < halfSize; i++) {
                var aka = jatekosokRR[i];
                var shiro = jatekosokRR[jatekosokRR.length - 1 - i];

                if (aka.nev !== "BYE" && shiro.nev !== "BYE") {
                    adatok.meccsek.push({
                        id: 'rr' + (r + 1) + '-' + matchIndex + '-' + kategoriaNev,
                        round: r + 1, kategoria: kategoriaNev,
                        aka: aka, shiro: shiro, winner: null,
                        scoreAka: 0, scoreShiro: 0,
                        wazaariAka: 0, wazaariShiro: 0, ipponAka: 0, ipponShiro: 0, chuiAka: 0, chuiShiro: 0, gentenAka: 0, gentenShiro: 0,
                        nextId: null, isRoundRobin: true
                    });
                    matchIndex++;
                }
            }
            var last = jatekosokRR.pop();
            jatekosokRR.splice(1, 0, last);
        }
    } else {
        var agrajzMerete = Math.pow(2, Math.ceil(Math.log2(jatekosok.length)));
        var maxKor = Math.log2(agrajzMerete);
        var seed = [1];
        for (var i = 0; i < maxKor; i++) {
            var nextSeed = []; var sum = seed.length * 2 + 1;
            for (var j = 0; j < seed.length; j++) { nextSeed.push(seed[j]); nextSeed.push(sum - seed[j]); }
            seed = nextSeed;
        }

        for (var kor = 1; kor <= maxKor; kor++) {
            var korMeccsei = agrajzMerete / Math.pow(2, kor);
            for (var m = 0; m < korMeccsei; m++) {
                var nextId = (kor < maxKor) ? 'm' + (kor + 1) + '-' + Math.floor(m / 2) + '-' + kategoriaNev : null;
                adatok.meccsek.push({
                    id: 'm' + kor + '-' + m + '-' + kategoriaNev, round: kor, kategoria: kategoriaNev,
                    aka: { nev: "", id: null }, shiro: { nev: "", id: null }, winner: null,
                    scoreAka: 0, scoreShiro: 0,
                    wazaariAka: 0, wazaariShiro: 0, ipponAka: 0, ipponShiro: 0, chuiAka: 0, chuiShiro: 0, gentenAka: 0, gentenShiro: 0,
                    nextId: nextId, isRoundRobin: false
                });
            }
        }

        var elsoKorok = adatok.meccsek.filter(m => m.round === 1 && m.kategoria === kategoriaNev);
        for (var k = 0; k < elsoKorok.length; k++) {
            elsoKorok[k].aka = jatekosok[seed[k * 2] - 1] || { nev: "BYE", id: "BYE" };
            elsoKorok[k].shiro = jatekosok[seed[k * 2 + 1] - 1] || { nev: "BYE", id: "BYE" };

            if (elsoKorok[k].aka.nev === "BYE" && elsoKorok[k].shiro.nev === "BYE") elsoKorok[k].winner = { nev: "BYE", id: "BYE" };
            else if (elsoKorok[k].aka.nev !== "BYE" && elsoKorok[k].shiro.nev === "BYE") elsoKorok[k].winner = elsoKorok[k].aka;
            else if (elsoKorok[k].shiro.nev !== "BYE" && elsoKorok[k].aka.nev === "BYE") elsoKorok[k].winner = elsoKorok[k].shiro;
        }
    }
}

function generalTatamiSorszamTerkepe(tatamiNev) {
    if (!tatamiNev) return {};
    var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === tatamiNev && !k.nev.toLowerCase().includes('kata'));
    tatamiKategoriak.sort((a, b) => {
        var korA = parseInt(a.min_kor || 0); var korB = parseInt(b.min_kor || 0);
        if (korA !== korB) return korA - korB;
        return a.nev.localeCompare(b.nev);
    });

    var tatamiMeccsek = [];
    tatamiKategoriak.forEach(kat => {
        if (adatok.meccsek) tatamiMeccsek = tatamiMeccsek.concat(adatok.meccsek.filter(m => m.kategoria === kat.nev && (m.aka.nev !== "BYE" || m.shiro.nev !== "BYE")));
    });

    tatamiMeccsek.sort((a, b) => {
        var catA = tatamiKategoriak.find(k => k.nev === a.kategoria); var catB = tatamiKategoriak.find(k => k.nev === b.kategoria);
        var korA = parseInt(catA.min_kor || 0); var korB = parseInt(catB.min_kor || 0);
        if (korA !== korB) return korA - korB;
        if (a.round !== b.round) return a.round - b.round;
        var catA_idx = tatamiKategoriak.indexOf(catA); var catB_idx = tatamiKategoriak.indexOf(catB);
        if (catA_idx !== catB_idx) return catA_idx - catB_idx;
        return parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]);
    });

    var sorszamTerkepe = {};
    for (var i = 0; i < tatamiMeccsek.length; i++) sorszamTerkepe[tatamiMeccsek[i].id] = i + 1;
    return sorszamTerkepe;
}

function generalTabella(katNev) {
    var meccsek = adatok.meccsek.filter(m => m.kategoria === katNev && m.isRoundRobin);
    var resztvevok = {};
    meccsek.forEach(m => {
        if (!resztvevok[m.aka.id]) resztvevok[m.aka.id] = { nev: m.aka.nev, id: m.aka.id, M: 0, Gy: 0, V: 0, P: 0, Pk: 0, Ippon: 0 };
        if (!resztvevok[m.shiro.id]) resztvevok[m.shiro.id] = { nev: m.shiro.nev, id: m.shiro.id, M: 0, Gy: 0, V: 0, P: 0, Pk: 0, Ippon: 0 };

        resztvevok[m.aka.id].Ippon += (m.ipponAka || 0);
        resztvevok[m.shiro.id].Ippon += (m.ipponShiro || 0);

        if (m.winner !== null && !m.kizartId) {
            resztvevok[m.aka.id].M++; resztvevok[m.shiro.id].M++;
            resztvevok[m.aka.id].Pk += (m.scoreAka - m.scoreShiro);
            resztvevok[m.shiro.id].Pk += (m.scoreShiro - m.scoreAka);
            if (m.winner.id === m.aka.id) { resztvevok[m.aka.id].Gy++; resztvevok[m.aka.id].P += 3; resztvevok[m.shiro.id].V++; }
            else if (m.winner.id === m.shiro.id) { resztvevok[m.shiro.id].Gy++; resztvevok[m.shiro.id].P += 3; resztvevok[m.aka.id].V++; }
        } else if (m.kizartId) {
            resztvevok[m.aka.id].M++; resztvevok[m.shiro.id].M++;
            if (m.aka.id === m.kizartId) { resztvevok[m.aka.id].V++; resztvevok[m.aka.id].Pk -= 2; resztvevok[m.shiro.id].Gy++; resztvevok[m.shiro.id].P += 3; resztvevok[m.shiro.id].Pk += 2; }
            else { resztvevok[m.shiro.id].V++; resztvevok[m.shiro.id].Pk -= 2; resztvevok[m.aka.id].Gy++; resztvevok[m.aka.id].P += 3; resztvevok[m.aka.id].Pk += 2; }
        }
    });

    return Object.values(resztvevok).sort((a, b) => {
        if (b.P !== a.P) return b.P - a.P;
        if (b.Pk !== a.Pk) return b.Pk - a.Pk;
        return b.Ippon - a.Ippon;
    });
}

function ellenorizTovabbjutasokat() {
    var valt = true;
    while (valt) {
        valt = false;
        for (var i = 0; i < adatok.meccsek.length; i++) {
            var m = adatok.meccsek[i];
            if (m.winner && m.winner.id && m.nextId && !m.isRoundRobin) {
                var k = adatok.meccsek.find(x => x.id === m.nextId);
                if (k) {
                    var isAka = (parseInt(m.id.split('-')[1]) % 2 === 0);
                    if (isAka) { if (k.aka.id !== m.winner.id) { k.aka = m.winner; valt = true; } }
                    else { if (k.shiro.id !== m.winner.id) { k.shiro = m.winner; valt = true; } }
                }
            }
        }
    }
}

function rajzolAgrajz() {
    var tartalom = document.getElementById('bracket-view');
    if (!tartalom) return;
    tartalom.innerHTML = "";
    var sel = document.getElementById('p-cat');
    if (sel && sel.value !== "") {
        var fa = document.createElement('div'); fa.className = "agrajz-vilagos-tema";
        tartalom.appendChild(fa);
        var katObj = OSSZES_KATEGORIA.find(k => k.nev === sel.value);
        var sorszamTerkepe = (katObj && katObj.tatami) ? generalTatamiSorszamTerkepe(katObj.tatami) : {};
        rajzolEgyediAgrajz(sel.value, fa, sorszamTerkepe);
    }
}

function mutasdTatamiNezetet(tatamiNev, doNotSwitchTab) {
    if (!doNotSwitchTab && typeof valtFul === "function") valtFul('tatami');
    var tartalom = document.getElementById('tatami-content');
    if (!tartalom) return;
    tartalom.innerHTML = "<h2 style='color:white; font-size: 2rem; font-weight: 900; background:#CE1126; padding:10px 30px; border-radius:10px; margin-top:20px;'>" + tatamiNev + " - Küzdelmi Sorrend</h2>";

    var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === tatamiNev && !k.nev.toLowerCase().includes('kata'));
    tatamiKategoriak.sort((a, b) => {
        var korA = parseInt(a.min_kor || 0); var korB = parseInt(b.min_kor || 0);
        if (korA !== korB) return korA - korB;
        return a.nev.localeCompare(b.nev);
    });

    var sorszamTerkepe = generalTatamiSorszamTerkepe(tatamiNev);
    var van = false;

    tatamiKategoriak.forEach(kat => {
        if (adatok.meccsek && adatok.meccsek.some(m => m.kategoria === kat.nev)) {
            van = true;
            var w = document.createElement('div');
            w.style = "width:100%; max-width:1400px; background:white; padding:20px; border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5); margin-bottom: 20px;";
            w.innerHTML = "<h3 style='color:#1a1a1a; font-weight:900; font-size:1.5rem; border-bottom:2px solid #cbd5e1; padding-bottom:10px; margin-bottom:20px; text-align:center;'>" + kat.nev + "</h3>";
            var fa = document.createElement('div'); fa.className = "agrajz-vilagos-tema";
            w.appendChild(fa); tartalom.appendChild(w);
            rajzolEgyediAgrajz(kat.nev, fa, sorszamTerkepe);
        }
    });
    if (!van) tartalom.innerHTML += "<p style='color:white; font-size: 1.2rem;'>Ehhez a tatamihoz még nincsenek legenerálva Kumite ágrajzok!</p>";
}

function rajzolEgyediAgrajz(katNev, celDiv, sorszamTerkepe) {
    if (!adatok.meccsek) return;
    var meccsek = adatok.meccsek.filter(m => m.kategoria === katNev);
    if (meccsek.length === 0) return;

    var isRR = meccsek[0].isRoundRobin;
    var szerkE = (aktualisFelhasznalo !== null && (aktualisFelhasznalo.szerepkor === 'admin' || aktualisFelhasznalo.szerepkor === 'judge'));

    if (isRR) {
        var tabella = generalTabella(katNev);
        var tabHtml = '<div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 2px solid #cbd5e1; width: 100%;">';
        tabHtml += '<h4 style="margin: 0 0 10px 0; color: #1a1a1a; font-weight:bold;">🏆 Tabella (Körmerkőzés)</h4>';

        // JAVÍTVA: A betűk GARANTÁLTAN feketék maradnak minden cellában!
        tabHtml += '<table style="width:100%; text-align:left; border-collapse: collapse; font-size: 14px; background: white;">';
        tabHtml += '<tr style="border-bottom: 2px solid #94a3b8;"><th style="color: #000 !important; padding-bottom:5px;">Versenyző</th><th style="color: #000 !important;">M</th><th style="color: #000 !important;">Gy</th><th style="color: #000 !important;">V</th><th style="color: #000 !important;">Pontkül.</th><th style="color:#CE1126 !important; font-weight:900;">Pont</th></tr>';
        tabella.forEach(t => {
            tabHtml += '<tr style="border-bottom: 1px solid #e2e8f0; line-height: 2.5;"><td style="color: #000 !important; font-weight: bold;">' + t.nev + '</td><td style="color: #000 !important;">' + t.M + '</td><td style="color: #000 !important;">' + t.Gy + '</td><td style="color: #000 !important;">' + t.V + '</td><td style="color: #000 !important;">' + (t.Pk > 0 ? '+' : '') + t.Pk + '</td><td style="color:#CE1126 !important; font-weight:900;">' + t.P + '</td></tr>';
        });
        tabHtml += '</table></div>';

        var listaContainer = document.createElement('div');
        listaContainer.style = "display: flex; flex-direction: column; width: 100%;";
        listaContainer.innerHTML += tabHtml;

        var meccsDobozoK = '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
        meccsek.sort((a, b) => a.round - b.round).forEach(m => {
            var aktivE = (m.winner === null && m.aka.nev !== "BYE" && m.shiro.nev !== "BYE" && m.aka.id !== null && m.shiro.id !== null);
            var katt = (aktivE && szerkE) ? 'onclick="nyitBiroiPanelt(\'' + m.id + '\')"' : "";
            var aktSorszam = (typeof sorszamTerkepe === 'object' && sorszamTerkepe[m.id]) ? 'MECCS #' + sorszamTerkepe[m.id] : 'KÖR ' + m.round;
            var szamHtml = '<div style="text-align:center; font-size:11px; font-weight:900; color:#1a1a1a; background:#e2e8f0; border-radius:4px; padding:2px; margin-bottom:4px; border:1px solid #cbd5e1;">' + aktSorszam + '</div>';

            meccsDobozoK += '<div class="meccs-doboza match-wrapper" style="margin-bottom: 10px;"><div class="kartya-tarolo">' + szamHtml + keszitKartyat(m.aka, 'aka', m, katt) + keszitKartyat(m.shiro, 'shiro', m, katt) + '</div></div>';
        });
        listaContainer.innerHTML += meccsDobozoK + '</div>';
        celDiv.appendChild(listaContainer);

    } else {
        var maxKor = 1; meccsek.forEach(m => { if (m.round > maxKor) maxKor = m.round; });
        for (var kor = 1; kor <= maxKor; kor++) {
            var kM = meccsek.filter(m => m.round === kor).sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
            if (kM.length === 0) continue;
            var oszlop = document.createElement('div'); oszlop.className = "fordulok-oszlopa round-column";
            kM.forEach((m, idx) => {
                if (m.aka.nev === "BYE" && m.shiro.nev === "BYE") { oszlop.innerHTML += '<div class="meccs-doboza match-wrapper" style="visibility: hidden;"></div>'; return; }
                var isTop = (idx % 2 === 0);
                var kapcsHtml = m.nextId ? '<div class="' + (isTop ? "vonal-le" : "vonal-fel") + '"></div>' : "";
                var aktivE = (m.winner === null && m.aka.nev !== "BYE" && m.shiro.nev !== "BYE" && m.aka.id !== null && m.shiro.id !== null);
                var katt = (aktivE && szerkE) ? 'onclick="nyitBiroiPanelt(\'' + m.id + '\')"' : "";

                var aktSorszam = (typeof sorszamTerkepe === 'object' && sorszamTerkepe[m.id]) ? 'MECCS #' + sorszamTerkepe[m.id] : 'KÖR ' + m.round;
                var szamHtml = "";
                if (m.aka.nev !== "BYE" || m.shiro.nev !== "BYE") {
                    szamHtml = '<div style="text-align:center; font-size:11px; font-weight:900; color:#1a1a1a; background:#e2e8f0; border-radius:4px; padding:2px; margin-bottom:4px; border:1px solid #cbd5e1;">' + aktSorszam + '</div>';
                }

                oszlop.innerHTML += '<div class="meccs-doboza match-wrapper"><div class="kartya-tarolo">' + szamHtml + keszitKartyat(m.aka, 'aka', m, katt) + keszitKartyat(m.shiro, 'shiro', m, katt) + '</div>' + kapcsHtml + '</div>';
            });
            celDiv.appendChild(oszlop);
        }
    }
}

function keszitKartyat(v, o, m, katt) {
    if (v !== null && v.nev === "BYE") return '<div class="versenyzo-kartya player-card" style="visibility:hidden;"></div>';
    if (v === null || v.id === null || v.nev === "") return '<div class="versenyzo-kartya ures-kartya player-card empty-slot"><div class="szines-csik color-strip ' + (o === 'aka' ? 'szines-csik-kek' : 'szines-csik-piros') + '"></div><div class="varakozas-szoveg">Várakozás...</div></div>';
    var h = '<div class="versenyzo-kartya player-card ' + (m.winner && m.winner.id === v.id ? 'gyoztes-kartya winner-card ' : '') + katt.replace('onclick', 'class="kattinthat-kartya clickable" onclick') + '" ' + katt + '>';
    h += '<div class="szines-csik color-strip ' + (o === 'shiro' ? 'szines-csik-piros shiro-strip' : 'szines-csik-kek aka-strip') + '"></div>';
    h += '<div class="kartya-belso-tartalom card-content"><div class="kartya-nev card-name" style="color: black !important;">[' + v.id + '] ' + v.nev + '</div><div class="kartya-klub card-details" style="color: #4b5563 !important;">' + (v.klub || '') + '</div></div>';

    if (m.scoreAka > 0 || m.scoreShiro > 0 || m.winner || m.kizartId) {
        var pont = (o === 'aka' ? m.scoreAka : m.scoreShiro);
        var waz = (o === 'aka' ? (m.wazaariAka || 0) : (m.wazaariShiro || 0));
        var csillag = (waz >= 2) ? '<sup style="font-size: 0.8em; color: #CE1126; font-weight: 900;">*</sup>' : '';
        if (m.kizartId && m.kizartId === v.id) {
            pont = '0';
            csillag = '<sup style="font-size: 1.2em; color: #CE1126; font-weight: 900;">-</sup>';
        }
        h += '<div class="kartya-pontszam">' + pont + csillag + '</div>';
    }
    h += '</div>'; return h;
}

// =========================================================================
// BÍRÓI PANEL & OKOS IDŐZÍTŐ
// =========================================================================

var aktualisMeccs = null; var idozitoInterval = null; var ido = 120;

// JAVÍTVA: A motor most már kőkeményen számol
function getMeccsIdo(kategoriaNev, isHosszabbitas, isElodontoVagyDonto) {
    var n = kategoriaNev.toLowerCase();

    // Ha Hosszabbítás (Encho-Sen) van, akkor mindig mindenki 2 percet (120s) kap
    if (isHosszabbitas) {
        if (n.includes('8-9')) return 60;
        if (n.includes('10-11') || n.includes('12-13') || n.includes('35-44') || n.includes('45+') || n.includes('35+')) return 90;
        return 120;
    }

    // ALAPIDŐ (0. menet) beállítása:
    if (n.includes('8-9')) return 60;
    if (n.includes('10-11') || n.includes('12-13')) return 90;
    if (n.includes('14-15') || n.includes('16-17')) return 120;
    if (n.includes('35-44') || n.includes('45+') || n.includes('35+')) return 90;

    // Felnőtt (18-34) logika megerősítve további kulcsszavakkal!
    var isFelnott = (n.includes('18-34') || n.includes('felnott') || n.includes('felnőtt') || n.includes('senior') || n.includes('szenior') || n.includes('adult'));
    if (isFelnott) {
        if (isElodontoVagyDonto) return 180; // A Te rajzod szerint itt 3 percről indul!
        return 120; // Selejtezőben 2 percről!
    }

    return 120;
}

function nyitBiroiPanelt(id) {
    aktualisMeccs = adatok.meccsek.find(m => m.id === id);
    if (!aktualisMeccs) return;

    if (aktualisMeccs.wazaariAka === undefined) {
        aktualisMeccs.wazaariAka = 0; aktualisMeccs.wazaariShiro = 0;
        aktualisMeccs.ipponAka = 0; aktualisMeccs.ipponShiro = 0;
        aktualisMeccs.chuiAka = 0; aktualisMeccs.chuiShiro = 0;
        aktualisMeccs.gentenAka = 0; aktualisMeccs.gentenShiro = 0;
        aktualisMeccs.hosszabbitasok = 0;
    }

    var isElodontoVagyDonto = false;
    var cimKiegeszites = "";
    if (!aktualisMeccs.isRoundRobin) {
        if (aktualisMeccs.nextId === null) {
            isElodontoVagyDonto = true;
            cimKiegeszites = " (🏆 DÖNTŐ)";
        } else {
            var nextMatch = adatok.meccsek.find(x => x.id === aktualisMeccs.nextId);
            if (nextMatch && nextMatch.nextId === null) {
                isElodontoVagyDonto = true;
                cimKiegeszites = " (⚔️ ELŐDÖNTŐ)";
            }
        }
    }

    document.getElementById('match-title').innerText = aktualisMeccs.kategoria + cimKiegeszites;
    document.getElementById('aka-name').innerText = aktualisMeccs.aka.nev;
    document.getElementById('shiro-name').innerText = aktualisMeccs.shiro.nev;

    // --- SORSZÁM, FELKÉSZÜL ÉS KATEGÓRIAVÁLTÁS KISZÁMÍTÁSA ---
    var katObj = OSSZES_KATEGORIA.find(k => k.nev === aktualisMeccs.kategoria);
    var aktTatami = katObj ? katObj.tatami : null;
    var kovetkezoMeccs = null;

    if (aktTatami) {
        var sorszamTerkepe = generalTatamiSorszamTerkepe(aktTatami);

        // -------------------------------------------------------------
        // ÚJ: AZ AKTUÁLIS MECCS SORSZÁMÁNAK KIÍRÁSA KÖZÉPRE
        // -------------------------------------------------------------
        var aktSorszamSzoveg = sorszamTerkepe[aktualisMeccs.id] ? "MECCS #" + sorszamTerkepe[aktualisMeccs.id] : "KÖR " + aktualisMeccs.round;
        var currentMatchNumElem = document.getElementById('current-match-number');
        if (currentMatchNumElem) currentMatchNumElem.innerText = aktSorszamSzoveg;
        // -------------------------------------------------------------

        var tatamiMeccsek = [];
        var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === aktTatami && !k.nev.toLowerCase().includes('kata'));

        tatamiKategoriak.forEach(kat => {
            if (adatok.meccsek) {
                var katMeccsei = adatok.meccsek.filter(m =>
                    m.kategoria === kat.nev &&
                    m.winner === null &&
                    m.id !== aktualisMeccs.id &&
                    m.aka && m.aka.nev !== "BYE" && m.aka.id !== null &&
                    m.shiro && m.shiro.nev !== "BYE" && m.shiro.id !== null
                );
                tatamiMeccsek = tatamiMeccsek.concat(katMeccsei);
            }
        });

        tatamiMeccsek.sort((a, b) => {
            var sA = sorszamTerkepe[a.id] || 999999;
            var sB = sorszamTerkepe[b.id] || 999999;
            return sA - sB;
        });

        if (tatamiMeccsek.length > 0) kovetkezoMeccs = tatamiMeccsek[0];
    } else {
        // Ha valamiért nincs tatamihoz rendelve, akkor se legyen üres
        var currentMatchNumElem = document.getElementById('current-match-number');
        if (currentMatchNumElem) currentMatchNumElem.innerText = "KÖR " + aktualisMeccs.round;
    }

    var nextAkaElem = document.getElementById('next-aka-name');
    var nextShiroElem = document.getElementById('next-shiro-name');
    var warningElem = document.getElementById('next-category-warning');
    var nextCatNameElem = document.getElementById('next-category-name');

    if (kovetkezoMeccs) {
        if (nextAkaElem) nextAkaElem.innerText = kovetkezoMeccs.aka.nev;
        if (nextShiroElem) nextShiroElem.innerText = kovetkezoMeccs.shiro.nev;

        if (kovetkezoMeccs.kategoria !== aktualisMeccs.kategoria) {
            if (warningElem) warningElem.style.display = "block";
            if (nextCatNameElem) nextCatNameElem.innerText = kovetkezoMeccs.kategoria;
        } else {
            if (warningElem) warningElem.style.display = "none";
        }
    } else {
        if (nextAkaElem) nextAkaElem.innerText = "- Nincs több -";
        if (nextShiroElem) nextShiroElem.innerText = "- Nincs több -";
        if (warningElem) warningElem.style.display = "none";
    }

    frissitBiroiFeluletet();

    clearInterval(idozitoInterval);
    idozitoInterval = null;

    ido = getMeccsIdo(aktualisMeccs.kategoria, aktualisMeccs.hosszabbitasok > 0, isElodontoVagyDonto);
    frissitIdozitoFeluletet();

    var btn = document.getElementById('btn-timer');
    if (btn) btn.innerText = "START";

    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById('tab-referee').classList.remove('hidden');

    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
}

function inditsdHosszabbitast() {
    if (!aktualisMeccs) return;

    var isElodontoVagyDonto = false;
    if (!aktualisMeccs.isRoundRobin) {
        if (aktualisMeccs.nextId === null) isElodontoVagyDonto = true;
        else {
            var nextMatch = adatok.meccsek.find(x => x.id === aktualisMeccs.nextId);
            if (nextMatch && nextMatch.nextId === null) isElodontoVagyDonto = true;
        }
    }

    var n = aktualisMeccs.kategoria.toLowerCase();
    var isFelnott = (n.includes('18-34') || n.includes('felnott') || n.includes('felnőtt') || n.includes('senior') || n.includes('szenior') || n.includes('adult'));

    var maxHosszabbitas = 1;
    if (isFelnott && isElodontoVagyDonto) {
        maxHosszabbitas = 3; // 18-34 Elődöntő/Döntő: 3 db hosszabbítás
    }

    if ((aktualisMeccs.hosszabbitasok || 0) >= maxHosszabbitas) {
        alert("NINCS TÖBB HOSSZABBÍTÁS!\nElértétek a maximális keretet (" + maxHosszabbitas + " ráadás).\nMost már kötelező bírói döntést (Hantei) hozni!");
        return;
    }

    var hanyadik = (aktualisMeccs.hosszabbitasok || 0) + 1;
    var msg = "Biztosan elindítod a(z) " + hanyadik + ". hosszabbítást (Encho-Sen)?\nEz lenullázza az eddigi pontokat!";

    var biztos = confirm(msg);
    if (biztos) {
        aktualisMeccs.hosszabbitasok = (aktualisMeccs.hosszabbitasok || 0) + 1;
        aktualisMeccs.scoreAka = 0; aktualisMeccs.scoreShiro = 0;
        aktualisMeccs.wazaariAka = 0; aktualisMeccs.wazaariShiro = 0;
        aktualisMeccs.ipponAka = 0; aktualisMeccs.ipponShiro = 0;

        frissitBiroiFeluletet();

        ido = getMeccsIdo(aktualisMeccs.kategoria, true, isElodontoVagyDonto);
        clearInterval(idozitoInterval); idozitoInterval = null;
        document.getElementById('btn-timer').innerText = "START";
        frissitIdozitoFeluletet();
    }
}

function pontszamAdas(oldal, pont) {
    if (oldal === 'aka') {
        if (pont === 1) aktualisMeccs.wazaariAka = (aktualisMeccs.wazaariAka || 0) + 1;
        if (pont === 2) aktualisMeccs.ipponAka = (aktualisMeccs.ipponAka || 0) + 1;
        aktualisMeccs.scoreAka = Math.min(aktualisMeccs.scoreAka + pont, 2);
    } else {
        if (pont === 1) aktualisMeccs.wazaariShiro = (aktualisMeccs.wazaariShiro || 0) + 1;
        if (pont === 2) aktualisMeccs.ipponShiro = (aktualisMeccs.ipponShiro || 0) + 1;
        aktualisMeccs.scoreShiro = Math.min(aktualisMeccs.scoreShiro + pont, 2);
    }
    frissitBiroiFeluletet();
}

function pontTorles(oldal) {
    if (oldal === 'aka' && aktualisMeccs.scoreAka > 0) {
        aktualisMeccs.scoreAka--;
        if (aktualisMeccs.wazaariAka > 0) aktualisMeccs.wazaariAka--;
    } else if (oldal === 'shiro' && aktualisMeccs.scoreShiro > 0) {
        aktualisMeccs.scoreShiro--;
        if (aktualisMeccs.wazaariShiro > 0) aktualisMeccs.wazaariShiro--;
    }
    frissitBiroiFeluletet();
}

function buntetesAdas(oldal, tipus) {
    if (oldal === 'aka') {
        if (tipus === 'chui') { aktualisMeccs.chuiAka++; if (aktualisMeccs.chuiAka >= 3) { aktualisMeccs.chuiAka = 0; aktualisMeccs.gentenAka++; } }
        else if (tipus === 'genten') { aktualisMeccs.chuiAka = 0; aktualisMeccs.gentenAka++; }
        if (aktualisMeccs.gentenAka >= 2) {
            alert("AKA KIZÁRVA (Hansoku Make)!\nSHIRO nyert, és a kizárt versenyző jövőbeli meccseit is automatikusan nullázzuk!");
            aktualisMeccs.scoreShiro = Math.max(aktualisMeccs.scoreShiro, 2);
            aktualisMeccs.kizartOldal = 'aka';
        }
    } else {
        if (tipus === 'chui') { aktualisMeccs.chuiShiro++; if (aktualisMeccs.chuiShiro >= 3) { aktualisMeccs.chuiShiro = 0; aktualisMeccs.gentenShiro++; } }
        else if (tipus === 'genten') { aktualisMeccs.chuiShiro = 0; aktualisMeccs.gentenShiro++; }
        if (aktualisMeccs.gentenShiro >= 2) {
            alert("SHIRO KIZÁRVA (Hansoku Make)!\nAKA nyert, és a kizárt versenyző jövőbeli meccseit is automatikusan nullázzuk!");
            aktualisMeccs.scoreAka = Math.max(aktualisMeccs.scoreAka, 2);
            aktualisMeccs.kizartOldal = 'shiro';
        }
    }
    frissitBiroiFeluletet();
}

function befejezMeccset() {
    if (aktualisMeccs.kizartOldal) {
        aktualisMeccs.winner = (aktualisMeccs.kizartOldal === 'aka') ? aktualisMeccs.shiro : aktualisMeccs.aka;
        aktualisMeccs.kizartId = aktualisMeccs[aktualisMeccs.kizartOldal].id;

        var jovoMeccsek = adatok.meccsek.filter(m =>
            m.kategoria === aktualisMeccs.kategoria &&
            m.winner === null &&
            m.id !== aktualisMeccs.id &&
            (m.aka.id === aktualisMeccs.kizartId || m.shiro.id === aktualisMeccs.kizartId)
        );

        jovoMeccsek.forEach(m => {
            m.kizartId = aktualisMeccs.kizartId;
            if (m.aka.id === aktualisMeccs.kizartId) {
                m.scoreAka = 0; m.scoreShiro = 2; m.winner = m.shiro;
            } else {
                m.scoreShiro = 0; m.scoreAka = 2; m.winner = m.aka;
            }
        });
    } else if (aktualisMeccs.scoreAka === aktualisMeccs.scoreShiro) {
        var megerosites = confirm("Döntetlen az állás! Nyomj OK-t a Hantei (Bírói döntés) kiválasztásához!");
        if (!megerosites) return;
        var nyertes = prompt("Írd be a nyertes oldalát: 'aka' vagy 'shiro'");
        if (nyertes === 'aka') aktualisMeccs.winner = aktualisMeccs.aka;
        else if (nyertes === 'shiro') aktualisMeccs.winner = aktualisMeccs.shiro;
        else { alert("Érvénytelen válasz!"); return; }
    } else {
        aktualisMeccs.winner = aktualisMeccs.scoreAka > aktualisMeccs.scoreShiro ? aktualisMeccs.aka : aktualisMeccs.shiro;
    }

    if (!aktualisMeccs.isRoundRobin) ellenorizTovabbjutasokat();
    if (typeof mentsdAzAllapototMySQLbe === "function") mentsdAzAllapototMySQLbe();

    if (aktualisMeccs.nextId === null && aktualisMeccs.winner && !aktualisMeccs.isRoundRobin) {
        fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: aktualisMeccs.winner.id, helyezes: 1, pontszam: 0 }) });
    }

    if (aktualisMeccs.isRoundRobin) {
        var katMeccsek = adatok.meccsek.filter(m => m.kategoria === aktualisMeccs.kategoria);
        var mindKesz = katMeccsek.every(m => m.winner !== null);
        if (mindKesz) {
            var tabella = generalTabella(aktualisMeccs.kategoria);
            if (tabella[0]) fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: tabella[0].id, helyezes: 1, pontszam: tabella[0].P }) });
            if (tabella[1]) fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: tabella[1].id, helyezes: 2, pontszam: tabella[1].P }) });
            if (tabella[2]) fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: tabella[2].id, helyezes: 3, pontszam: tabella[2].P }) });
        }
    }

    rajzolAgrajz();

    // --- UGRÁS A KÖVETKEZŐRE ---
    var katObj = OSSZES_KATEGORIA.find(k => k.nev === aktualisMeccs.kategoria);
    var aktTatami = katObj ? katObj.tatami : null;
    var kovetkezoMeccsId = null;

    if (aktTatami) {
        mutasdTatamiNezetet(aktTatami, true);
        var sorszamTerkepe = generalTatamiSorszamTerkepe(aktTatami);
        var tatamiMeccsek = [];
        var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === aktTatami && !k.nev.toLowerCase().includes('kata'));

        tatamiKategoriak.forEach(kat => {
            if (adatok.meccsek) {
                var katMeccsei = adatok.meccsek.filter(m =>
                    m.kategoria === kat.nev &&
                    m.winner === null &&
                    m.id !== aktualisMeccs.id &&
                    m.aka && m.aka.nev !== "BYE" && m.aka.id !== null &&
                    m.shiro && m.shiro.nev !== "BYE" && m.shiro.id !== null
                );
                tatamiMeccsek = tatamiMeccsek.concat(katMeccsei);
            }
        });

        tatamiMeccsek.sort((a, b) => {
            var sA = sorszamTerkepe[a.id] || 999999;
            var sB = sorszamTerkepe[b.id] || 999999;
            return sA - sB;
        });

        if (tatamiMeccsek.length > 0) kovetkezoMeccsId = tatamiMeccsek[0].id;
    }

    if (kovetkezoMeccsId) {
        // Nincs alert, azonnal nyitja a következőt
        nyitBiroiPanelt(kovetkezoMeccsId);
    } else {
        document.body.style.overflow = "auto";
        document.getElementById('tab-referee').classList.add('hidden');
        document.getElementById('tab-tatami').classList.remove('hidden');
    }
}

function frissitBiroiFeluletet() {
    // JAVÍTVA: A verseny.html-ben lévő ID-khoz igazítva
    if (document.getElementById('aka-score'))
        document.getElementById('aka-score').innerText = aktualisMeccs.scoreAka;

    if (document.getElementById('shiro-score'))
        document.getElementById('shiro-score').innerText = aktualisMeccs.scoreShiro;

    var akaPen = document.getElementById('aka-penalties');
    if (akaPen) akaPen.innerHTML = "Chui: " + (aktualisMeccs.chuiAka || 0) + " | Genten: " + (aktualisMeccs.gentenAka || 0);

    var shiroPen = document.getElementById('shiro-penalties');
    if (shiroPen) shiroPen.innerHTML = "Chui: " + (aktualisMeccs.chuiShiro || 0) + " | Genten: " + (aktualisMeccs.gentenShiro || 0);
}

function nullazMeccsPontszamokat() {
    if (confirm("Biztos nullázod a pontokat és büntetéseket?")) {
        aktualisMeccs.scoreAka = 0; aktualisMeccs.scoreShiro = 0;
        aktualisMeccs.wazaariAka = 0; aktualisMeccs.wazaariShiro = 0;
        aktualisMeccs.ipponAka = 0; aktualisMeccs.ipponShiro = 0;
        aktualisMeccs.chuiAka = 0; aktualisMeccs.chuiShiro = 0;
        aktualisMeccs.gentenAka = 0; aktualisMeccs.gentenShiro = 0;
        delete aktualisMeccs.kizartOldal; delete aktualisMeccs.kizartId;
        aktualisMeccs.hosszabbitasok = 0;
        frissitBiroiFeluletet(); clearInterval(idozitoInterval); idozitoInterval = null;

        var isElodontoVagyDonto = false;
        if (!aktualisMeccs.isRoundRobin) {
            if (aktualisMeccs.nextId === null) isElodontoVagyDonto = true;
            else {
                var nextMatch = adatok.meccsek.find(x => x.id === aktualisMeccs.nextId); if (nextMatch && nextMatch.nextId === null) isElodontoVagyDonto = true;
            }
        }
        ido = getMeccsIdo(aktualisMeccs.kategoria, false, isElodontoVagyDonto);
        frissitIdozitoFeluletet();
    }
}

function kapcsolIdozitot() {
    if (idozitoInterval) {
        clearInterval(idozitoInterval); idozitoInterval = null; document.getElementById('btn-timer').innerText = "START";
    }
    else {
        document.getElementById('btn-timer').innerText = "STOP";
        idozitoInterval = setInterval(() => {
            ido--; frissitIdozitoFeluletet();
            if (ido <= 0) { clearInterval(idozitoInterval); idozitoInterval = null; alert("Idő!"); document.getElementById('btn-timer').innerText = "START"; }
        }, 1000);
    }
}
function frissitIdozitoFeluletet() {
    document.getElementById('timer').innerText = Math.floor(ido / 60) + ':' + (ido % 60 < 10 ? '0' : '') + ido % 60;
}