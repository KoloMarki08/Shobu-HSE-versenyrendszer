/* KUMITE.js - Kumite verseny, ágrajz és pontozás (OLIMPIAI WKF VERZIÓ) */

// ==========================================
// 1. ÁGRAJZ GENERÁLÁSA (Professzionális Sorsolás)
// ==========================================
function generalKumite() {
    if (aktualisFelhasznalo.szerepkor !== 'admin') { alert("Csak admin generálhat ágrajzot!"); return; }
    var kivalasztottKategoria = document.getElementById('p-cat').value;
    if (kivalasztottKategoria.includes('Kata')) { alert("Ez Kata kategória, nem Kumite!"); return; }

    var jatekosok = [];
    for (var i = 0; i < adatok.versenyzok.length; i++) {
        if (adatok.versenyzok[i].kategoria === kivalasztottKategoria) jatekosok.push(adatok.versenyzok[i]);
    }
    if (jatekosok.length < 2) { alert("Kevés a versenyző ehhez a kategóriához! (Minimum 2 kell)"); return; }

    adatok.meccsek = [];
    var jatekosokSzama = jatekosok.length;
    var agrajzMerete = Math.pow(2, Math.ceil(Math.log2(jatekosokSzama)));
    var maxKor = Math.log2(agrajzMerete);

    var seed = [1];
    for (var i = 0; i < maxKor; i++) {
        var nextSeed = [];
        var sum = seed.length * 2 + 1;
        for (var j = 0; j < seed.length; j++) { nextSeed.push(seed[j]); nextSeed.push(sum - seed[j]); }
        seed = nextSeed;
    }

    // 1. Felépítjük a fát ÜRESEN (Ez rajzolja ki a Várakozó dobozokat előre!)
    for (var kor = 1; kor <= maxKor; kor++) {
        var korMeccsei = agrajzMerete / Math.pow(2, kor);
        for (var m = 0; m < korMeccsei; m++) {
            var nextKorIndex = Math.floor(m / 2);
            var nextId = (kor < maxKor) ? 'm' + (kor + 1) + '-' + nextKorIndex : null;
            adatok.meccsek.push({
                id: 'm' + kor + '-' + m, round: kor, kategoria: kivalasztottKategoria,
                aka: { nev: "", id: null }, shiro: { nev: "", id: null }, // Még senki nincs beosztva
                winner: null, scoreAka: 0, scoreShiro: 0, nextId: nextId
            });
        }
    }

    // 2. Beosztjuk az 1. körös versenyzőket és a BYE-okat
    var elsoKorok = adatok.meccsek.filter(m => m.round === 1);
    for (var k = 0; k < elsoKorok.length; k++) {
        var jatekosAka = jatekosok[seed[k * 2] - 1];
        var jatekosShiro = jatekosok[seed[k * 2 + 1] - 1];

        elsoKorok[k].aka = jatekosAka ? jatekosAka : { nev: "BYE", id: "BYE" };
        elsoKorok[k].shiro = jatekosShiro ? jatekosShiro : { nev: "BYE", id: "BYE" };

        if (elsoKorok[k].aka.nev === "BYE" && elsoKorok[k].shiro.nev === "BYE") {
            elsoKorok[k].winner = { nev: "BYE", id: "BYE" };
        } else if (elsoKorok[k].aka.nev !== "BYE" && elsoKorok[k].shiro.nev === "BYE") {
            elsoKorok[k].winner = elsoKorok[k].aka;
        } else if (elsoKorok[k].shiro.nev !== "BYE" && elsoKorok[k].aka.nev === "BYE") {
            elsoKorok[k].winner = elsoKorok[k].shiro;
        }
    }

    ellenorizTovabbjutasokat();
    if (vegrehajtMentes()) valtFul('bracket');
}

// ==========================================
// 2. TOVÁBBJUTÁSOK ELLENŐRZÉSE
// ==========================================
function ellenorizTovabbjutasokat() {
    var valtozasTortent = true;

    while (valtozasTortent) {
        valtozasTortent = false;

        for (var i = 0; i < adatok.meccsek.length; i++) {
            var meccs = adatok.meccsek[i];

            if (meccs.winner !== null && meccs.winner.id !== null && meccs.nextId !== null) {
                var kovetkezoMeccs = null;
                for (var j = 0; j < adatok.meccsek.length; j++) {
                    if (adatok.meccsek[j].id === meccs.nextId) {
                        kovetkezoMeccs = adatok.meccsek[j];
                        break;
                    }
                }

                if (kovetkezoMeccs !== null) {
                    var aktualisMeccsIndex = parseInt(meccs.id.split('-')[1]);
                    var isAka = (aktualisMeccsIndex % 2 === 0);

                    if (isAka) {
                        if (kovetkezoMeccs.aka.id !== meccs.winner.id) {
                            kovetkezoMeccs.aka = meccs.winner;
                            valtozasTortent = true;
                        }
                    } else {
                        if (kovetkezoMeccs.shiro.id !== meccs.winner.id) {
                            kovetkezoMeccs.shiro = meccs.winner;
                            valtozasTortent = true;
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 3. ÁGRAJZ RAJZOLÁSA ÉS VONALAZÁSA
// ==========================================
function rajzolAgrajz() {
    var tartalom = document.getElementById('bracket-view');
    tartalom.innerHTML = "";

    if (adatok.meccsek.length === 0) return;

    var maxKor = 1;
    for (var i = 0; i < adatok.meccsek.length; i++) {
        if (adatok.meccsek[i].round > maxKor) {
            maxKor = adatok.meccsek[i].round;
        }
    }

    var szerkeszthetE = false;
    if (aktualisFelhasznalo !== null && (aktualisFelhasznalo.szerepkor === 'admin' || aktualisFelhasznalo.szerepkor === 'judge')) {
        szerkeszthetE = true;
    }

    for (var kor = 1; kor <= maxKor; kor++) {
        var korMeccsei = [];
        for (var j = 0; j < adatok.meccsek.length; j++) {
            if (adatok.meccsek[j].round === kor) korMeccsei.push(adatok.meccsek[j]);
        }

        korMeccsei.sort(function (a, b) {
            return parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]);
        });

        if (korMeccsei.length === 0) continue;

        var oszlop = document.createElement('div');
        oszlop.className = "fordulok-oszlopa round-column";

        for (var m = 0; m < korMeccsei.length; m++) {
            var meccs = korMeccsei[m];

            // Ha a meccs csak BYE vs BYE (Üres Erőnyerő ág), beteszünk egy láthatatlan kitöltőt,
            // hogy a vonalak és a távolságok matematikailag tökéletesek maradjanak!
            if (meccs.aka.nev === "BYE" && meccs.shiro.nev === "BYE") {
                oszlop.innerHTML += '<div class="meccs-doboza match-wrapper" style="visibility: hidden;"></div>';
                continue;
            }

            // Kiszámoljuk, hogy a vonalnak lefelé vagy felfelé kell-e kanyarodnia
            var isTop = (m % 2 === 0);
            var connectorClass = isTop ? "vonal-le" : "vonal-fel";
            var kapcsoloHtml = "";

            // Csak akkor rajzolunk kimenő vonalat, ha van következő meccs (a Döntőből nem megy ki vonal)
            if (meccs.nextId !== null) {
                kapcsoloHtml = '<div class="' + connectorClass + '"></div>';
            }

            var aktivE = false;
            if (meccs.winner === null && meccs.aka.nev !== "BYE" && meccs.shiro.nev !== "BYE" && meccs.aka.id !== null && meccs.shiro.id !== null) {
                aktivE = true;
            }

            var kattintasAttributum = "";
            if (aktivE === true && szerkeszthetE === true) {
                kattintasAttributum = 'onclick="nyitBiroiPanelt(\'' + meccs.id + '\')"';
            }

            var kartya1Html = keszitKartyat(meccs.aka, 'aka', meccs, kattintasAttributum);
            var kartya2Html = keszitKartyat(meccs.shiro, 'shiro', meccs, kattintasAttributum);

            // A kártyákat beletesszük egy extra tárolóba, hogy a vonalak mögöttük szépen fussanak
            var meccsWrapperHtml = '<div class="meccs-doboza match-wrapper">' +
                '<div class="kartya-tarolo">' + kartya1Html + kartya2Html + '</div>' +
                kapcsoloHtml +
                '</div>';
            oszlop.innerHTML += meccsWrapperHtml;
        }

        if (oszlop.innerHTML !== "") {
            tartalom.appendChild(oszlop);
        }
    }
}

// ==========================================
// 4. KÁRTYA GENERÁLÁSA
// ==========================================
function keszitKartyat(versenyzo, oldal, meccs, kattintasAttributum) {
    // Ha Erőnyerő (BYE) hely, a kártya láthatatlan
    if (versenyzo !== null && versenyzo.nev === "BYE") {
        return '<div class="versenyzo-kartya player-card" style="visibility:hidden;"></div>';
    }

    // Ha ez egy jövőbeli meccs (Várakozás)
    if (versenyzo === null || versenyzo.id === null || versenyzo.nev === "") {
        var szin = (oldal === 'aka') ? 'szines-csik-kek' : 'szines-csik-piros';
        return '<div class="versenyzo-kartya ures-kartya player-card empty-slot"><div class="szines-csik color-strip ' + szin + '"></div><div class="varakozas-szoveg">Várakozás...</div></div>';
    }

    // Normál kártya (kicsi, letisztult stílus)
    var stilusOsztalyok = "versenyzo-kartya player-card ";
    var gyoztesE = (meccs.winner !== null && meccs.winner.id === versenyzo.id);

    // Zöld kiemelés a győztesnek (A Bajnoknak is ez fog világítani a végén!)
    if (gyoztesE) stilusOsztalyok += "gyoztes-kartya winner-card ";
    if (kattintasAttributum !== "") stilusOsztalyok += "kattinthat-kartya clickable ";

    var csikOsztaly = (oldal === 'shiro') ? "szines-csik-piros shiro-strip" : "szines-csik-kek aka-strip";

    var kartyaHtml = '<div class="' + stilusOsztalyok.trim() + '" ' + kattintasAttributum + '>';
    kartyaHtml += '<div class="szines-csik color-strip ' + csikOsztaly + '"></div>';
    kartyaHtml += '<div class="kartya-belso-tartalom card-content">';
    kartyaHtml += '<div class="kartya-nev card-name">[' + versenyzo.id + '] ' + versenyzo.nev + '</div>';
    kartyaHtml += '<div class="kartya-klub card-details">' + versenyzo.klub + '</div>';
    kartyaHtml += '</div>';

    var vanPontszam = (meccs.scoreAka > 0 || meccs.scoreShiro > 0);
    if (vanPontszam === true) {
        var pontszamErtek = (oldal === 'aka') ? meccs.scoreAka : meccs.scoreShiro;
        kartyaHtml += '<div class="kartya-pontszam">' + pontszamErtek + '</div>';
    }

    kartyaHtml += '</div>';
    return kartyaHtml;
}

// ==========================================
// 5. BÍRÓI PANEL LOGIKA ÉS 6. ADATBÁZIS MENTÉS
// ==========================================
var aktualisMeccs = null;
var idozitoInterval = null;
var ido = 120;

function nyitBiroiPanelt(azonosito) {
    aktualisMeccs = adatok.meccsek.find(m => m.id === azonosito) || null;
    if (aktualisMeccs === null) return;
    document.getElementById('ref-aka').innerText = aktualisMeccs.aka.nev;
    document.getElementById('ref-shiro').innerText = aktualisMeccs.shiro.nev;
    frissitBiroiFeluletet();
    if (idozitoInterval !== null) clearInterval(idozitoInterval);
    idozitoInterval = null;
    ido = 120;
    frissitIdozitoFeluletet();
    document.getElementById('btn-timer').innerText = "START";
    document.getElementById('tab-referee').classList.remove('hidden');
}

function pontszamAdas(kihez, pont) {
    if (kihez === 'aka') {
        aktualisMeccs.scoreAka = Math.min(aktualisMeccs.scoreAka + pont, 2);
    } else {
        aktualisMeccs.scoreShiro = Math.min(aktualisMeccs.scoreShiro + pont, 2);
    }
    frissitBiroiFeluletet();

    if (aktualisMeccs.scoreAka === 2) {
        setTimeout(function () { alert("GYŐZTES: AKA"); befejezMeccset(); }, 100);
    } else if (aktualisMeccs.scoreShiro === 2) {
        setTimeout(function () { alert("GYŐZTES: SHIRO"); befejezMeccset(); }, 100);
    }
}

function nullazMeccsPontszamokat() {
    if (!confirm("Biztos nullázod a pontokat?")) return;
    aktualisMeccs.scoreAka = 0;
    aktualisMeccs.scoreShiro = 0;
    frissitBiroiFeluletet();
    if (idozitoInterval !== null) clearInterval(idozitoInterval);
    idozitoInterval = null;
    ido = 120;
    frissitIdozitoFeluletet();
}

function frissitBiroiFeluletet() {
    document.getElementById('score-aka').innerText = aktualisMeccs.scoreAka;
    document.getElementById('score-shiro').innerText = aktualisMeccs.scoreShiro;
}

function kapcsolIdozitot() {
    if (idozitoInterval !== null) {
        clearInterval(idozitoInterval);
        idozitoInterval = null;
        document.getElementById('btn-timer').innerText = "START";
    } else {
        document.getElementById('btn-timer').innerText = "STOP";
        idozitoInterval = setInterval(function () {
            ido--;
            frissitIdozitoFeluletet();
            if (ido <= 0) {
                clearInterval(idozitoInterval);
                idozitoInterval = null;
                alert("Lejárt az idő!");
                document.getElementById('btn-timer').innerText = "START";
            }
        }, 1000);
    }
}

function frissitIdozitoFeluletet() {
    var percek = Math.floor(ido / 60);
    var masodpercek = ido % 60;
    document.getElementById('timer').innerText = percek + ':' + (masodpercek < 10 ? '0' : '') + masodpercek;
}

function befejezMeccset() {
    if (aktualisMeccs.scoreAka === aktualisMeccs.scoreShiro) {
        alert("Döntetlen állásnál nem lehet befejezni a meccset!");
        return;
    }
    aktualisMeccs.winner = (aktualisMeccs.scoreAka > aktualisMeccs.scoreShiro) ? aktualisMeccs.aka : aktualisMeccs.shiro;
    ellenorizTovabbjutasokat();
    if (vegrehajtMentes()) {
        valtFul('bracket');
        document.getElementById('tab-referee').classList.add('hidden');
    }
}

function vegrehajtMentes() {
    fetch('api.php?akcio=meccsMentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adatok)
    }).catch(function () {
        localStorage.setItem('iko_db', JSON.stringify(adatok));
    });
    return true;
}