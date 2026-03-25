/* ========================================================================= */
/* SORSOLAS.js - Okos Sorsolás (Kiemelés, Drag&Drop, Meccs Sorrend Csere)    */
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

    var kiemeltek = jatekosok.filter(v => String(v.kiemelt) === "1");
    var tobbiek = jatekosok.filter(v => String(v.kiemelt) !== "1");

    if (!adatok.kategoriaTipusok) adatok.kategoriaTipusok = {};
    var tipusBeallitas = adatok.kategoriaTipusok[kategoriaNev] || "auto";
    var isKormerkozes = false;

    if (tipusBeallitas === "rr") isKormerkozes = true;
    else if (tipusBeallitas === "ek") isKormerkozes = false;
    else isKormerkozes = (jatekosok.length <= 5);

    if (isKormerkozes) {
        // --- KÖRMÉRKŐZÉS ---
        for (let i = tobbiek.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tobbiek[i], tobbiek[j]] = [tobbiek[j], tobbiek[i]];
        }
        var jatekosokRR = kiemeltek.concat(tobbiek);
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

        // AZONOS DOJO SZÉTVÁLASZTÁSA (KÉSŐBBI KÖRBE RAKÁS)
        for (let r = 1; r <= Math.floor(numRounds / 2); r++) {
            let matchesInRound = adatok.meccsek.filter(m => m.kategoria === kategoriaNev && m.round === r);
            let hasSameDojo = matchesInRound.some(m => m.aka && m.shiro && m.aka.klub && m.shiro.klub && m.aka.klub === m.shiro.klub && m.aka.nev !== 'BYE' && m.shiro.nev !== 'BYE');
            if (hasSameDojo) {
                let targetRound = numRounds - r + 1;
                adatok.meccsek.forEach(m => {
                    if (m.kategoria === kategoriaNev) {
                        if (m.round === r) m.round = targetRound;
                        else if (m.round === targetRound) m.round = r;
                    }
                });
            }
        }

    } else {
        // --- EGYENES KIESÉS ---
        var agrajzMerete = Math.pow(2, Math.ceil(Math.log2(jatekosok.length)));
        var maxKor = Math.log2(agrajzMerete);
        var M = agrajzMerete / 2;

        var matchPriority = [];
        if (M === 1) matchPriority = [0];
        else if (M === 2) matchPriority = [0, 1];
        else if (M === 4) matchPriority = [0, 3, 1, 2];
        else if (M === 8) matchPriority = [0, 7, 3, 4, 1, 6, 2, 5];
        else if (M === 16) matchPriority = [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
        else if (M === 32) matchPriority = [0, 31, 15, 16, 7, 24, 8, 23, 3, 28, 12, 19, 4, 27, 11, 20, 1, 30, 14, 17, 6, 25, 9, 22, 2, 29, 13, 18, 5, 26, 10, 21];
        else { for (let i = 0; i < M; i++) matchPriority.push(i); }

        var numByes = agrajzMerete - jatekosok.length;
        var byeSlots = new Set();
        for (let i = 0; i < numByes; i++) {
            let matchIdx = matchPriority[i];
            if (matchIdx < M / 2) byeSlots.add(matchIdx * 2 + 1);
            else byeSlots.add(matchIdx * 2);
        }

        var availableSlots = [];
        for (let i = 0; i < agrajzMerete; i++) { if (!byeSlots.has(i)) availableSlots.push(i); }

        var jatekosokTeljes = new Array(agrajzMerete).fill(null);
        var maradek = [...tobbiek];

        if (kiemeltek.length > 2) { for (let i = 2; i < kiemeltek.length; i++) maradek.push(kiemeltek[i]); }

        for (let i = maradek.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [maradek[i], maradek[j]] = [maradek[j], maradek[i]];
        }

        if (kiemeltek.length > 0) { let slot = availableSlots.shift(); jatekosokTeljes[slot] = kiemeltek[0]; }
        if (kiemeltek.length > 1) { let slot = availableSlots.pop(); jatekosokTeljes[slot] = kiemeltek[1]; }
        for (let i = 0; i < availableSlots.length; i++) { jatekosokTeljes[availableSlots[i]] = maradek.shift(); }

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
            elsoKorok[k].aka = jatekosokTeljes[k * 2] || { nev: "BYE", id: "BYE" };
            elsoKorok[k].shiro = jatekosokTeljes[k * 2 + 1] || { nev: "BYE", id: "BYE" };

            if (elsoKorok[k].aka.nev === "BYE" && elsoKorok[k].shiro.nev === "BYE") elsoKorok[k].winner = { nev: "BYE", id: "BYE" };
            else if (elsoKorok[k].aka.nev !== "BYE" && elsoKorok[k].shiro.nev === "BYE") elsoKorok[k].winner = elsoKorok[k].aka;
            else if (elsoKorok[k].shiro.nev !== "BYE" && elsoKorok[k].aka.nev === "BYE") elsoKorok[k].winner = elsoKorok[k].shiro;
        }
    }
}

// =========================================================================
// 1. DRAG & DROP LOGIKA: JÁTÉKOSOK CSERÉJE (Egyenes Kieséshez)
// =========================================================================
var mozgatottKard = null;
function kartyatMegfog(e, meccsId, oldal) {
    mozgatottKard = { meccsId: meccsId, oldal: oldal };
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
}
function kartyatHuz(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}
function kartyatLeejt(e, celMeccsId, celOldal) {
    e.preventDefault(); e.stopPropagation();
    if (!mozgatottKard || (mozgatottKard.meccsId === celMeccsId && mozgatottKard.oldal === celOldal)) return;

    var m1 = adatok.meccsek.find(m => m.id === mozgatottKard.meccsId);
    var m2 = adatok.meccsek.find(m => m.id === celMeccsId);

    if (m1 && m2 && !m1.isRoundRobin) {
        var csereEmber = m1[mozgatottKard.oldal];
        m1[mozgatottKard.oldal] = m2[celOldal];
        m2[celOldal] = csereEmber;

        ellenorizTovabbjutasokat();
        if (typeof mentsdAzAllapototMySQLbe === "function") mentsdAzAllapototMySQLbe();

        var aktivS = document.querySelector("section:not(.hidden)");
        if (aktivS && aktivS.id === 'tab-bracket') rajzolAgrajz();
        if (aktivS && aktivS.id === 'tab-tatami') {
            var c = document.getElementById('tatami-content').querySelector('h2');
            if (c) mutasdTatamiNezetet(c.innerText.split(' -')[0], true);
        }
    }
    mozgatottKard = null;
}

// =========================================================================
// 2. DRAG & DROP LOGIKA: MECCSEK CSERÉJE (Körmérkőzéshez)
// =========================================================================
var mozgatottMeccsId = null;
function meccsetMegfog(e, meccsId) {
    mozgatottMeccsId = meccsId;
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
}
function meccsetHuz(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}
function meccsetLeejt(e, celMeccsId) {
    e.preventDefault(); e.stopPropagation();
    if (!mozgatottMeccsId || mozgatottMeccsId === celMeccsId) return;

    var m1 = adatok.meccsek.find(m => m.id === mozgatottMeccsId);
    var m2 = adatok.meccsek.find(m => m.id === celMeccsId);

    if (m1 && m2 && m1.isRoundRobin && m2.isRoundRobin) {
        var tempRound = m1.round;
        m1.round = m2.round;
        m2.round = tempRound;

        if (typeof mentsdAzAllapototMySQLbe === "function") mentsdAzAllapototMySQLbe();

        var aktivS = document.querySelector("section:not(.hidden)");
        if (aktivS && aktivS.id === 'tab-bracket') rajzolAgrajz();
        if (aktivS && aktivS.id === 'tab-tatami') {
            var c = document.getElementById('tatami-content').querySelector('h2');
            if (c) mutasdTatamiNezetet(c.innerText.split(' -')[0], true);
        }
    }
    mozgatottMeccsId = null;
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
        if (!resztvevok[m.aka.id] && m.aka.nev !== "BYE") resztvevok[m.aka.id] = { nev: m.aka.nev, id: m.aka.id, M: 0, Gy: 0, V: 0, P: 0, Pk: 0, Ippon: 0 };
        if (!resztvevok[m.shiro.id] && m.shiro.nev !== "BYE") resztvevok[m.shiro.id] = { nev: m.shiro.nev, id: m.shiro.id, M: 0, Gy: 0, V: 0, P: 0, Pk: 0, Ippon: 0 };

        if (resztvevok[m.aka.id]) resztvevok[m.aka.id].Ippon += (m.ipponAka || 0);
        if (resztvevok[m.shiro.id]) resztvevok[m.shiro.id].Ippon += (m.ipponShiro || 0);

        if (m.winner !== null && m.winner.nev !== "BYE" && !m.kizartId) {
            if (resztvevok[m.aka.id]) resztvevok[m.aka.id].M++;
            if (resztvevok[m.shiro.id]) resztvevok[m.shiro.id].M++;

            if (resztvevok[m.aka.id]) resztvevok[m.aka.id].Pk += (m.scoreAka - m.scoreShiro);
            if (resztvevok[m.shiro.id]) resztvevok[m.shiro.id].Pk += (m.scoreShiro - m.scoreAka);

            if (m.winner.id === m.aka.id && resztvevok[m.aka.id]) { resztvevok[m.aka.id].Gy++; resztvevok[m.aka.id].P += 3; if (resztvevok[m.shiro.id]) resztvevok[m.shiro.id].V++; }
            else if (m.winner.id === m.shiro.id && resztvevok[m.shiro.id]) { resztvevok[m.shiro.id].Gy++; resztvevok[m.shiro.id].P += 3; if (resztvevok[m.aka.id]) resztvevok[m.aka.id].V++; }
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

            var isByeMatch = (m.aka.nev === "BYE" || m.shiro.nev === "BYE");
            var taroloStyle = (isByeMatch && !szerkE) ? 'display: flex; flex-direction: column; justify-content: center; min-height: 95px;' : '';

            // ÚJ: Meccs húzása Körmérkőzésnél
            var matchDragEvents = szerkE ? ` draggable="true" ondragstart="meccsetMegfog(event, '${m.id}')" ondragover="meccsetHuz(event)" ondrop="meccsetLeejt(event, '${m.id}')" ` : "";

            meccsDobozoK += '<div class="meccs-doboza match-wrapper" style="margin-bottom: 10px; cursor: grab;" ' + matchDragEvents + '><div class="kartya-tarolo" style="' + taroloStyle + '">' + szamHtml + keszitKartyat(m.aka, 'aka', m, katt, false) + keszitKartyat(m.shiro, 'shiro', m, katt, false) + '</div></div>';
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

                var isByeMatch = (m.aka.nev === "BYE" || m.shiro.nev === "BYE");
                var taroloStyle = (isByeMatch && !szerkE) ? 'display: flex; flex-direction: column; justify-content: center; min-height: 95px;' : '';

                oszlop.innerHTML += '<div class="meccs-doboza match-wrapper"><div class="kartya-tarolo" style="' + taroloStyle + '">' + szamHtml + keszitKartyat(m.aka, 'aka', m, katt, szerkE) + keszitKartyat(m.shiro, 'shiro', m, katt, szerkE) + '</div>' + kapcsHtml + '</div>';
            });
            celDiv.appendChild(oszlop);
        }
    }
}

function keszitKartyat(v, o, m, katt, szerkE) {
    // Egyenes kiesésnél a kártyák húzogatása (Körmérkőzésnél false lesz a szerkE)
    var dragEvents = (szerkE && m.round === 1 && !m.isRoundRobin) ? ` draggable="true" ondragstart="kartyatMegfog(event, '${m.id}', '${o}')" ondragover="kartyatHuz(event)" ondrop="kartyatLeejt(event, '${m.id}', '${o}')" ` : "";

    if (v !== null && v.nev === "BYE") {
        if (szerkE) return '<div class="versenyzo-kartya player-card" style="opacity: 0.6; border: 2px dashed #94a3b8; cursor: grab;" ' + dragEvents + '><div class="szines-csik color-strip ' + (o === 'aka' ? 'szines-csik-kek' : 'szines-csik-piros') + '"></div><div class="kartya-belso-tartalom card-content"><div class="kartya-nev card-name" style="color: #64748b !important;">[ÜRES] Húzz ide embert!</div></div></div>';
        else return '<div class="versenyzo-kartya player-card" style="display:none;"></div>';
    }

    if (v === null || v.id === null || v.nev === "") return '<div class="versenyzo-kartya ures-kartya player-card empty-slot"><div class="szines-csik color-strip ' + (o === 'aka' ? 'szines-csik-kek' : 'szines-csik-piros') + '"></div><div class="varakozas-szoveg">Várakozás...</div></div>';

    var h = '<div class="versenyzo-kartya player-card ' + (m.winner && m.winner.id === v.id ? 'gyoztes-kartya winner-card ' : '') + (dragEvents ? ' cursor-grab' : '') + '" ' + katt + dragEvents + '>';
    h += '<div class="szines-csik color-strip ' + (o === 'shiro' ? 'szines-csik-piros shiro-strip' : 'szines-csik-kek aka-strip') + '"></div>';

    var kiemeltIkon = (String(v.kiemelt) === "1") ? " ⭐" : "";
    h += '<div class="kartya-belso-tartalom card-content"><div class="kartya-nev card-name" style="color: black !important;">[' + v.id + '] ' + v.nev + kiemeltIkon + '</div><div class="kartya-klub card-details" style="color: #4b5563 !important;">' + (v.klub || '') + '</div></div>';

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