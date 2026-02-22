/* KUMITE.js - Kumite verseny, Tatami Nézet és Okos Sorszámozás */

function generalKumite() {
    if (aktualisFelhasznalo.szerepkor !== 'admin') { alert("Csak admin generálhat ágrajzot!"); return; }
    var kivalasztottKategoria = document.getElementById('p-cat').value;
    if (kivalasztottKategoria.includes('Kata')) { alert("Ez Kata kategória!"); return; }

    var jatekosok = adatok.versenyzok.filter(v => v.kategoria === kivalasztottKategoria);
    if (jatekosok.length < 2) { alert("Kevés a versenyző!"); return; }

    if (!adatok.meccsek) adatok.meccsek = [];
    adatok.meccsek = adatok.meccsek.filter(m => m.kategoria !== kivalasztottKategoria);

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
            var nextId = (kor < maxKor) ? 'm' + (kor + 1) + '-' + Math.floor(m / 2) + '-' + kivalasztottKategoria : null;
            adatok.meccsek.push({
                id: 'm' + kor + '-' + m + '-' + kivalasztottKategoria, round: kor, kategoria: kivalasztottKategoria,
                aka: { nev: "", id: null }, shiro: { nev: "", id: null }, winner: null, scoreAka: 0, scoreShiro: 0, nextId: nextId
            });
        }
    }

    var elsoKorok = adatok.meccsek.filter(m => m.round === 1 && m.kategoria === kivalasztottKategoria);
    for (var k = 0; k < elsoKorok.length; k++) {
        elsoKorok[k].aka = jatekosok[seed[k * 2] - 1] || { nev: "BYE", id: "BYE" };
        elsoKorok[k].shiro = jatekosok[seed[k * 2 + 1] - 1] || { nev: "BYE", id: "BYE" };

        if (elsoKorok[k].aka.nev === "BYE" && elsoKorok[k].shiro.nev === "BYE") elsoKorok[k].winner = { nev: "BYE", id: "BYE" };
        else if (elsoKorok[k].aka.nev !== "BYE" && elsoKorok[k].shiro.nev === "BYE") elsoKorok[k].winner = elsoKorok[k].aka;
        else if (elsoKorok[k].shiro.nev !== "BYE" && elsoKorok[k].aka.nev === "BYE") elsoKorok[k].winner = elsoKorok[k].shiro;
    }

    ellenorizTovabbjutasokat();
    if (fetch('api.php?akcio=meccsMentes', { method: 'POST', body: JSON.stringify(adatok) }).catch(e => localStorage.setItem('iko_db', JSON.stringify(adatok)))) {
        rajzolAgrajz(); valtFul('bracket');
    }
}

function ellenorizTovabbjutasokat() {
    var valt = true;
    while (valt) {
        valt = false;
        for (var i = 0; i < adatok.meccsek.length; i++) {
            var m = adatok.meccsek[i];
            if (m.winner && m.winner.id && m.nextId) {
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
    var tartalom = document.getElementById('bracket-view'); tartalom.innerHTML = "";
    var sel = document.getElementById('p-cat');
    if (sel && sel.value !== "") rajzolEgyediAgrajz(sel.value, tartalom, 1);
}

// A TELJES TATAMI NÉZET RAJZOLÁSA (CSAK KUMITE)
function mutasdTatamiNezetet(tatamiNev) {
    valtFul('tatami');
    var tartalom = document.getElementById('tatami-content');
    tartalom.innerHTML = "<h2 style='color:white; font-size: 2rem; font-weight: 900; background:#CE1126; padding:10px 30px; border-radius:10px; margin-top:20px;'>" + tatamiNev + " - Küzdelmi Sorrend</h2>";

    var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === tatamiNev && k.tipus === 'KUMITE');
    tatamiKategoriak.sort((a, b) => adatok.versenyzok.filter(v => v.kategoria === b.nev).length - adatok.versenyzok.filter(v => v.kategoria === a.nev).length);

    var sorszam = 1; var van = false;
    tatamiKategoriak.forEach(kat => {
        if (adatok.meccsek && adatok.meccsek.some(m => m.kategoria === kat.nev)) {
            van = true;
            var w = document.createElement('div');
            w.style = "width:100%; max-width:1400px; background:white; padding:20px; border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5); margin-bottom: 20px;";
            w.innerHTML = "<h3 style='color:#1a1a1a; font-weight:900; font-size:1.5rem; border-bottom:2px solid #cbd5e1; padding-bottom:10px; margin-bottom:20px; text-align:center;'>" + kat.nev + "</h3>";
            var fa = document.createElement('div'); fa.className = "agrajz-vilagos-tema";
            w.appendChild(fa); tartalom.appendChild(w);

            sorszam = rajzolEgyediAgrajz(kat.nev, fa, sorszam);
        }
    });
    if (!van) tartalom.innerHTML += "<p style='color:white; font-size: 1.2rem;'>Ehhez a tatamihoz még nincsenek legenerálva Kumite ágrajzok!</p>";
}

function rajzolEgyediAgrajz(katNev, celDiv, sorszam) {
    if (!adatok.meccsek) return sorszam;
    var meccsek = adatok.meccsek.filter(m => m.kategoria === katNev);
    if (meccsek.length === 0) return sorszam;

    var maxKor = 1; meccsek.forEach(m => { if (m.round > maxKor) maxKor = m.round; });
    var szerkE = (aktualisFelhasznalo !== null && (aktualisFelhasznalo.szerepkor === 'admin' || aktualisFelhasznalo.szerepkor === 'judge'));

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

            var szamHtml = "";
            if (m.aka.nev !== "BYE" || m.shiro.nev !== "BYE") {
                szamHtml = '<div style="text-align:center; font-size:11px; font-weight:900; color:#1a1a1a; background:#e2e8f0; border-radius:4px; padding:2px; margin-bottom:4px; border:1px solid #cbd5e1;">MECCS #' + sorszam + '</div>';
                sorszam++;
            }
            oszlop.innerHTML += '<div class="meccs-doboza match-wrapper"><div class="kartya-tarolo">' + szamHtml + keszitKartyat(m.aka, 'aka', m, katt) + keszitKartyat(m.shiro, 'shiro', m, katt) + '</div>' + kapcsHtml + '</div>';
        });
        if (oszlop.innerHTML !== "") celDiv.appendChild(oszlop);
    }
    return sorszam;
}

function keszitKartyat(v, o, m, katt) {
    if (v !== null && v.nev === "BYE") return '<div class="versenyzo-kartya player-card" style="visibility:hidden;"></div>';
    if (v === null || v.id === null || v.nev === "") return '<div class="versenyzo-kartya ures-kartya player-card empty-slot"><div class="szines-csik color-strip ' + (o === 'aka' ? 'szines-csik-kek' : 'szines-csik-piros') + '"></div><div class="varakozas-szoveg">Várakozás...</div></div>';

    var h = '<div class="versenyzo-kartya player-card ' + (m.winner && m.winner.id === v.id ? 'gyoztes-kartya winner-card ' : '') + katt.replace('onclick', 'class="kattinthat-kartya clickable" onclick') + '" ' + katt + '>';
    h += '<div class="szines-csik color-strip ' + (o === 'shiro' ? 'szines-csik-piros shiro-strip' : 'szines-csik-kek aka-strip') + '"></div>';
    h += '<div class="kartya-belso-tartalom card-content"><div class="kartya-nev card-name">[' + v.id + '] ' + v.nev + '</div><div class="kartya-klub card-details">' + v.klub + '</div></div>';
    if (m.scoreAka > 0 || m.scoreShiro > 0) h += '<div class="kartya-pontszam">' + (o === 'aka' ? m.scoreAka : m.scoreShiro) + '</div>';
    h += '</div>'; return h;
}

var aktualisMeccs = null; var idozitoInterval = null; var ido = 120;
function nyitBiroiPanelt(id) {
    aktualisMeccs = adatok.meccsek.find(m => m.id === id); if (!aktualisMeccs) return;
    document.getElementById('ref-aka').innerText = aktualisMeccs.aka.nev; document.getElementById('ref-shiro').innerText = aktualisMeccs.shiro.nev;
    frissitBiroiFeluletet(); clearInterval(idozitoInterval); idozitoInterval = null; ido = 120; frissitIdozitoFeluletet();
    document.getElementById('btn-timer').innerText = "START"; document.getElementById('tab-referee').classList.remove('hidden');
}
function pontszamAdas(k, p) {
    if (k === 'aka') aktualisMeccs.scoreAka = Math.min(aktualisMeccs.scoreAka + p, 2); else aktualisMeccs.scoreShiro = Math.min(aktualisMeccs.scoreShiro + p, 2);
    frissitBiroiFeluletet();
    if (aktualisMeccs.scoreAka === 2) setTimeout(() => { alert("GYŐZTES: AKA"); befejezMeccset(); }, 100);
    else if (aktualisMeccs.scoreShiro === 2) setTimeout(() => { alert("GYŐZTES: SHIRO"); befejezMeccset(); }, 100);
}
function nullazMeccsPontszamokat() { if (confirm("Biztos nullázod?")) { aktualisMeccs.scoreAka = 0; aktualisMeccs.scoreShiro = 0; frissitBiroiFeluletet(); clearInterval(idozitoInterval); idozitoInterval = null; ido = 120; frissitIdozitoFeluletet(); } }
function frissitBiroiFeluletet() { document.getElementById('score-aka').innerText = aktualisMeccs.scoreAka; document.getElementById('score-shiro').innerText = aktualisMeccs.scoreShiro; }
function kapcsolIdozitot() {
    if (idozitoInterval) { clearInterval(idozitoInterval); idozitoInterval = null; document.getElementById('btn-timer').innerText = "START"; }
    else { document.getElementById('btn-timer').innerText = "STOP"; idozitoInterval = setInterval(() => { ido--; frissitIdozitoFeluletet(); if (ido <= 0) { clearInterval(idozitoInterval); idozitoInterval = null; alert("Idő!"); document.getElementById('btn-timer').innerText = "START"; } }, 1000); }
}
function frissitIdozitoFeluletet() { document.getElementById('timer').innerText = Math.floor(ido / 60) + ':' + (ido % 60 < 10 ? '0' : '') + ido % 60; }
function befejezMeccset() {
    if (aktualisMeccs.scoreAka === aktualisMeccs.scoreShiro) { alert("Döntetlen nem lehet!"); return; }
    aktualisMeccs.winner = aktualisMeccs.scoreAka > aktualisMeccs.scoreShiro ? aktualisMeccs.aka : aktualisMeccs.shiro;
    ellenorizTovabbjutasokat(); fetch('api.php?akcio=meccsMentes', { method: 'POST', body: JSON.stringify(adatok) }).catch(e => localStorage.setItem('iko_db', JSON.stringify(adatok)));
    rajzolAgrajz(); document.getElementById('tab-referee').classList.add('hidden');
}