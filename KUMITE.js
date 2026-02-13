/* KUMITE.js - Kumite verseny, ágrajz és pontozás kezelése */

// ==========================================
// 1. ÁGRAJZ GENERÁLÁSA
// ==========================================
function generalKumite() {
    // Ellenőrizzük, hogy admin van-e belépve
    if (aktualisFelhasznalo.szerepkor !== 'admin') {
        alert("Csak admin generálhat ágrajzot!");
        return;
    }

    var kivalasztottKategoria = document.getElementById('p-cat').value;
    
    if (kivalasztottKategoria.includes('Kata')) {
        alert("Ez Kata kategória, nem Kumite!");
        return;
    }

    var jatekosok = [];
    
    // Kiválogatjuk azokat, akik ebbe a kategóriába neveztek
    for (var i = 0; i < adatok.versenyzok.length; i++) {
        var ember = adatok.versenyzok[i];
        if (ember.kategoria === kivalasztottKategoria) {
            jatekosok.push(ember);
        }
    }

    if (jatekosok.length < 2) {
        alert("Kevés a versenyző ehhez a kategóriához! (Minimum 2 kell)");
        return;
    }

    // Új ágrajzt kezdünk, töröljük az eddigi meccseket
    adatok.meccsek = [];

    // Kiszámoljuk, mekkora fa kell (2, 4, 8, 16...)
    var jatekosokSzama = jatekosok.length;
    var logErtek = Math.log2(jatekosokSzama);
    var felfeleKerekitve = Math.ceil(logErtek);
    var agrajzMerete = Math.pow(2, felfeleKerekitve);

    var pool = [];
    for (var j = 0; j < jatekosok.length; j++) {
        pool.push(jatekosok[j]);
    }

    // Feltöltjük "üres" (null) helyekkel, hogy kijöjjön a 2-es hatvány
    while (pool.length < agrajzMerete) {
        pool.push(null);
    }

    // Első kör meccseinek legenerálása
    for (var k = 0; k < agrajzMerete; k += 2) {
        var versenyzo1 = pool[k];
        var versenyzo2 = pool[k + 1];
        var meccsIndex = k / 2;

        var gyoztes = null;
        // Ha valakinek nincs ellenfele (BYE), az egyből nyer
        if (versenyzo1 !== null && versenyzo2 === null) {
            gyoztes = versenyzo1;
        } else if (versenyzo1 === null && versenyzo2 !== null) {
            gyoztes = versenyzo2;
        }

        var kovetkezoKorMeccsIndex = Math.floor(meccsIndex / 2);
        var kovetkezoMeccsId = 'm2-' + kovetkezoKorMeccsIndex;

        // "Junior" módszer: ha nincs játékos, berakunk egy "BYE" kamujátékost
        var ember1 = versenyzo1;
        if (ember1 === null) {
            ember1 = { nev: "BYE", azonosito: null };
        }

        var ember2 = versenyzo2;
        if (ember2 === null) {
            ember2 = { nev: "BYE", azonosito: null };
        }

        // Létrehozzuk a meccs objektumot (kevert angol-magyar a CSS/HTML miatt)
        var meccs = {
            id: 'm1-' + meccsIndex,
            round: 1,
            kategoria: kivalasztottKategoria,
            aka: ember1, 
            shiro: ember2,
            winner: gyoztes,
            scoreAka: 0,
            scoreShiro: 0,
            nextId: kovetkezoMeccsId
        };

        adatok.meccsek.push(meccs);
    }

    // Számoljuk ki, ki jutott tovább (pl. BYE miatti automatikus győztesek)
    ellenorizTovabbjutasokat();
    mentes();
    valtFul('bracket');
}

// ==========================================
// 2. TOVÁBBJUTÁSOK ELLENŐRZÉSE
// ==========================================
function ellenorizTovabbjutasokat() {
    var valtozasTortent = true;
    
    // Addig pörgetjük, amíg van olyan meccs, ami frissül
    while (valtozasTortent) {
        valtozasTortent = false;

        for (var i = 0; i < adatok.meccsek.length; i++) {
            var meccs = adatok.meccsek[i];
            
            // Ha van győztes és nem BYE (van azonosítója), ÉS van következő meccs ahova mehet
            if (meccs.winner && meccs.winner.azonosito !== null && meccs.nextId !== null) {
                
                // Megkeressük a következő meccset
                var kovetkezoMeccs = null;
                for (var j = 0; j < adatok.meccsek.length; j++) {
                    if (adatok.meccsek[j].id === meccs.nextId) {
                        kovetkezoMeccs = adatok.meccsek[j];
                        break;
                    }
                }

                // Ha még nincs ilyen meccs a tömbben, akkor csinálunk egyet
                if (kovetkezoMeccs === null) {
                    var kovetkezoKorSzama = meccs.round + 1;
                    var kovetkezoMeccsIdReszek = meccs.nextId.split('-');
                    var kovetkezoMeccsIndex = parseInt(kovetkezoMeccsIdReszek[1]);

                    var kovetkezoKovetkezoId = null;
                    // Csak maximum 5 körig megyünk el (ez a mi kis szabályunk most)
                    if (kovetkezoKorSzama <= 5) {
                        var kovetkezoKovetkezoIndex = Math.floor(kovetkezoMeccsIndex / 2);
                        kovetkezoKovetkezoId = 'm' + (kovetkezoKorSzama + 1) + '-' + kovetkezoKovetkezoIndex;
                    }

                    kovetkezoMeccs = {
                        id: meccs.nextId,
                        round: kovetkezoKorSzama,
                        kategoria: meccs.kategoria,
                        aka: { nev: "...", azonosito: null },
                        shiro: { nev: "...", azonosito: null },
                        winner: null,
                        scoreAka: 0,
                        scoreShiro: 0,
                        nextId: kovetkezoKovetkezoId
                    };

                    adatok.meccsek.push(kovetkezoMeccs);
                    valtozasTortent = true;
                }

                // Hova tegyük a győztest? (Páros vagy páratlan ág?)
                var aktualisMeccsIdReszek = meccs.id.split('-');
                var aktualisMeccsIndex = parseInt(aktualisMeccsIdReszek[1]);
                var parosIndexE = (aktualisMeccsIndex % 2 === 0);

                if (parosIndexE === true) {
                    // Páros -> AKA ág (kék)
                    if (kovetkezoMeccs.aka.azonosito !== meccs.winner.azonosito) {
                        kovetkezoMeccs.aka = meccs.winner;
                        valtozasTortent = true;
                    }
                } else {
                    // Páratlan -> SHIRO ág (piros)
                    if (kovetkezoMeccs.shiro.azonosito !== meccs.winner.azonosito) {
                        kovetkezoMeccs.shiro = meccs.winner;
                        valtozasTortent = true;
                    }
                }
            }
        }
    }
}

// ==========================================
// 3. ÁGRAJZ RAJZOLÁSA
// ==========================================
function rajzolAgrajz() {
    var tartalom = document.getElementById('bracket-view');
    tartalom.innerHTML = "";

    if (adatok.meccsek.length === 0) {
        return;
    }

    // Megkeressük, hány körből áll a verseny
    var maxKor = 1;
    for (var i = 0; i < adatok.meccsek.length; i++) {
        if (adatok.meccsek[i].round > maxKor) {
            maxKor = adatok.meccsek[i].round;
        }
    }

    var bejelentkezettEmber = aktualisFelhasznalo;
    var szerkeszthetE = false;
    // Ha admin vagy judge, akkor kattinthat a meccsekre
    if (bejelentkezettEmber !== null) {
        if (bejelentkezettEmber.szerepkor === 'admin' || bejelentkezettEmber.szerepkor === 'judge') {
            szerkeszthetE = true;
        }
    }

    // Oszlopokat rajzolunk körönként
    for (var kor = 1; kor <= maxKor; kor++) {
        
        // Kigyűjtjük a meccseket, amik ehhez a körhöz tartoznak
        var korMeccsei = [];
        for (var j = 0; j < adatok.meccsek.length; j++) {
            if (adatok.meccsek[j].round === kor) {
                korMeccsei.push(adatok.meccsek[j]);
            }
        }

        // Sorba rendezzük őket az ID alapján
        korMeccsei.sort(function(a, b) {
            var aIndex = parseInt(a.id.split('-')[1]);
            var bIndex = parseInt(b.id.split('-')[1]);
            return aIndex - bIndex;
        });

        if (korMeccsei.length === 0) {
            continue;
        }

        // Csinálunk egy dobozt (oszlopot) a körnek
        var oszlop = document.createElement('div');
        oszlop.className = "round-column";

        // Végigmegyünk az oszlop meccsein
        for (var m = 0; m < korMeccsei.length; m++) {
            var meccs = korMeccsei[m];
            
            // Ha van azonosítója, akkor igazi versenyző, nem csak egy pötty "..."
            var versenyzo1 = null;
            if (meccs.aka.azonosito !== null) {
                versenyzo1 = meccs.aka;
            }

            var versenyzo2 = null;
            if (meccs.shiro.azonosito !== null) {
                versenyzo2 = meccs.shiro;
            }

            var kapcsoloHtml = "";
            if (meccs.nextId !== null) {
                kapcsoloHtml = '<div class="match-connector"></div>';
            }

            // Csak akkor indulhat a meccs, ha nincs még győztes, de van már két versenyző!
            var aktivE = false;
            if (meccs.winner === null && versenyzo1 !== null && versenyzo2 !== null) {
                // Nem lehetnek BYE-ok (mert azokat a gép automatikusan tovább is lövi a winnerbe)
                if (versenyzo1.nev !== "BYE" && versenyzo2.nev !== "BYE") {
                    aktivE = true;
                }
            }

            var kattintasAttributum = "";
            if (aktivE === true && szerkeszthetE === true) {
                kattintasAttributum = 'onclick="nyitBiroiPanelt(\'' + meccs.id + '\')"';
            }

            // Kártyák csinálása (HTML kód)
            var kartya1Html = keszitKartyat(versenyzo1, 'aka', meccs, szerkeszthetE, kattintasAttributum);
            var kartya2Html = keszitKartyat(versenyzo2, 'shiro', meccs, szerkeszthetE, kattintasAttributum);

            var meccsWrapperHtml = '<div class="match-wrapper">' + 
                                     kartya1Html + 
                                     kartya2Html + 
                                     kapcsoloHtml + 
                                   '</div>';

            oszlop.innerHTML += meccsWrapperHtml;
        }

        tartalom.appendChild(oszlop);
    }
}

// ==========================================
// 4. KÁRTYA GENERÁLÁSA
// ==========================================
function keszitKartyat(versenyzo, oldal, meccs, szerkeszthetE, kattintasAttributum) {
    if (versenyzo === null || versenyzo.azonosito === null) {
        return '<div class="player-card empty-slot"></div>';
    }

    var gyoztesE = false;
    if (meccs.winner !== null && meccs.winner.azonosito === versenyzo.azonosito) {
        gyoztesE = true;
    }

    var stilusOsztalyok = "";
    if (gyoztesE === true) {
        stilusOsztalyok += "winner-card ";
    }
    
    // Ha kattintható
    if (kattintasAttributum !== "") {
        stilusOsztalyok += "clickable ";
    }

    var kartyaSzine = "";
    if (oldal === 'shiro') {
        kartyaSzine = '#D32F2F'; // Piros
    } else {
        kartyaSzine = '#0047AB'; // Kék
    }

    var kartyaHtml = '<div class="player-card ' + stilusOsztalyok.trim() + '" ' + kattintasAttributum + '>';
    kartyaHtml += '<div class="color-strip ' + oldal + '-strip"></div>';
    kartyaHtml += '<div class="card-content">';
    kartyaHtml += '<div class="card-name" style="color:' + kartyaSzine + '">';
    
    // JAVÍTVA: Magyar "nev" változó a név megjelenítéséhez!
    kartyaHtml += '[' + versenyzo.azonosito + '] ' + versenyzo.nev;
    kartyaHtml += '</div>';
    kartyaHtml += '<div class="card-details">' + versenyzo.klub + '</div>';
    kartyaHtml += '</div>';

    // Ha van pontszám, rajzoljuk ki
    var vanPontszam = (meccs.scoreAka > 0 || meccs.scoreShiro > 0);
    if (vanPontszam === true) {
        var pontszamErtek = 0;
        if (oldal === 'aka') {
            pontszamErtek = meccs.scoreAka;
        } else {
            pontszamErtek = meccs.scoreShiro;
        }
        kartyaHtml += '<div style="position:absolute;right:10px;font-weight:bold">' + pontszamErtek + '</div>';
    }

    kartyaHtml += '</div>';
    return kartyaHtml;
}

// ==========================================
// 5. BÍRÓI PANEL LOGIKA
// ==========================================
var aktualisMeccs = null;
var idozitoInterval = null;
var ido = 120;

function nyitBiroiPanelt(azonosito) {
    aktualisMeccs = null;
    for (var i = 0; i < adatok.meccsek.length; i++) {
        if (adatok.meccsek[i].id === azonosito) {
            aktualisMeccs = adatok.meccsek[i];
            break;
        }
    }

    if (aktualisMeccs === null) {
        return;
    }

    // A magyar "nev" attribútummal iratjuk ki
    document.getElementById('ref-aka').innerText = aktualisMeccs.aka.nev;
    document.getElementById('ref-shiro').innerText = aktualisMeccs.shiro.nev;

    frissitBiroiFeluletet();

    // Időzítő reset
    if (idozitoInterval !== null) {
        clearInterval(idozitoInterval);
    }
    idozitoInterval = null;
    ido = 120;
    frissitIdozitoFeluletet();

    document.getElementById('btn-timer').innerText = "START";
    document.getElementById('tab-referee').classList.remove('hidden');
}

function pontszamAdas(kihez, pont) {
    if (kihez === 'aka') {
        aktualisMeccs.scoreAka += pont;
    } else {
        aktualisMeccs.scoreShiro += pont;
    }

    frissitBiroiFeluletet();

    // Szabály: ha valaki eléri a 2 pontot (Ippon), egyből nyer!
    if (aktualisMeccs.scoreAka >= 2) {
        setTimeout(function() {
            alert("GYŐZTES: AKA");
            befejezMeccset();
        }, 100);
    } else if (aktualisMeccs.scoreShiro >= 2) {
        setTimeout(function() {
            alert("GYŐZTES: SHIRO");
            befejezMeccset();
        }, 100);
    }
}

function nullazMeccsPontszamokat() {
    var biztos = confirm("Biztos nullázod a pontokat?");
    if (biztos === false) {
        return;
    }

    aktualisMeccs.scoreAka = 0;
    aktualisMeccs.scoreShiro = 0;

    frissitBiroiFeluletet();

    if (idozitoInterval !== null) {
        clearInterval(idozitoInterval);
    }
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
        
        idozitoInterval = setInterval(function() {
            ido--;
            frissitIdozitoFeluletet();
            
            if (ido <= 0) {
                clearInterval(idozitoInterval);
                idozitoInterval = null;
                alert("Lejárt az idő!");
                document.getElementById('btn-timer').innerText = "START";
            }
        }, 1000); // Ez mondja meg a gépnek, hogy 1 másodpercenként fusson
    }
}

function frissitIdozitoFeluletet() {
    var percek = Math.floor(ido / 60);
    var masodpercek = ido % 60;

    var masodpercFormazva = masodpercek.toString();
    if (masodpercek < 10) {
        masodpercFormazva = '0' + masodpercek;
    }

    var idozitoSzoveg = percek + ':' + masodpercFormazva;
    document.getElementById('timer').innerText = idozitoSzoveg;
}

function befejezMeccset() {
    // Ha döntetlen, még nem lehet vége
    if (aktualisMeccs.scoreAka === aktualisMeccs.scoreShiro) {
        alert("Döntetlen állásnál nem lehet befejezni a meccset!");
        return;
    }

    if (aktualisMeccs.scoreAka > aktualisMeccs.scoreShiro) {
        aktualisMeccs.winner = aktualisMeccs.aka;
    } else {
        aktualisMeccs.winner = aktualisMeccs.shiro;
    }

    ellenorizTovabbjutasokat();
    mentes();
    valtFul('bracket');
    
    document.getElementById('tab-referee').classList.add('hidden');
}

// Biztonsági Alias-ok, hátha a HTML oldalról még a régi angol nevekkel hívjuk őket
function score(kihez, pont) { pontszamAdas(kihez, pont); }
function updateRefUI() { frissitBiroiFeluletet(); }
function updateTimerUI() { frissitIdozitoFeluletet(); }
function toggleTimer() { kapcsolIdozitot(); }
function resetMatchScores() { nullazMeccsPontszamokat(); }
function endMatch() { befejezMeccset(); }
function openRef(azonosito) { nyitBiroiPanelt(azonosito); }