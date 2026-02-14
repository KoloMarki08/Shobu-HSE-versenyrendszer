/* KUMITE.js - Kumite verseny, ágrajz és pontozás kezelése (Tisztított, Adatbázis-kész verzió) */

// ==========================================
// 1. ÁGRAJZ GENERÁLÁSA
// ==========================================
function generalKumite() {
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

    adatok.meccsek = [];

    var jatekosokSzama = jatekosok.length;
    var logErtek = Math.log2(jatekosokSzama);
    var felfeleKerekitve = Math.ceil(logErtek);
    var agrajzMerete = Math.pow(2, felfeleKerekitve);

    var pool = [];
    for (var j = 0; j < jatekosok.length; j++) {
        pool.push(jatekosok[j]);
    }

    while (pool.length < agrajzMerete) {
        pool.push(null);
    }

    for (var k = 0; k < agrajzMerete; k += 2) {
        var versenyzo1 = pool[k];
        var versenyzo2 = pool[k + 1];
        var meccsIndex = k / 2;

        var gyoztes = null;
        if (versenyzo1 !== null && versenyzo2 === null) {
            gyoztes = versenyzo1;
        } else if (versenyzo1 === null && versenyzo2 !== null) {
            gyoztes = versenyzo2;
        }

        var kovetkezoKorMeccsIndex = Math.floor(meccsIndex / 2);
        var kovetkezoMeccsId = 'm2-' + kovetkezoKorMeccsIndex;

        var ember1 = versenyzo1;
        if (ember1 === null) {
            ember1 = { nev: "BYE", azonosito: null };
        }

        var ember2 = versenyzo2;
        if (ember2 === null) {
            ember2 = { nev: "BYE", azonosito: null };
        }

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

    ellenorizTovabbjutasokat();
    
    // Elmentjük a meccseket
    var mentesKesz = vegrehajtMentes();
    if (mentesKesz) {
        valtFul('bracket');
    }
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
            
            if (meccs.winner && meccs.winner.azonosito !== null && meccs.nextId !== null) {
                var kovetkezoMeccs = null;
                for (var j = 0; j < adatok.meccsek.length; j++) {
                    if (adatok.meccsek[j].id === meccs.nextId) {
                        kovetkezoMeccs = adatok.meccsek[j];
                        break;
                    }
                }

                if (kovetkezoMeccs === null) {
                    var kovetkezoKorSzama = meccs.round + 1;
                    var kovetkezoMeccsIdReszek = meccs.nextId.split('-');
                    var kovetkezoMeccsIndex = parseInt(kovetkezoMeccsIdReszek[1]);

                    var kovetkezoKovetkezoId = null;
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

                var aktualisMeccsIdReszek = meccs.id.split('-');
                var aktualisMeccsIndex = parseInt(aktualisMeccsIdReszek[1]);
                var parosIndexE = (aktualisMeccsIndex % 2 === 0);

                if (parosIndexE === true) {
                    if (kovetkezoMeccs.aka.azonosito !== meccs.winner.azonosito) {
                        kovetkezoMeccs.aka = meccs.winner;
                        valtozasTortent = true;
                    }
                } else {
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

    var maxKor = 1;
    for (var i = 0; i < adatok.meccsek.length; i++) {
        if (adatok.meccsek[i].round > maxKor) {
            maxKor = adatok.meccsek[i].round;
        }
    }

    var bejelentkezettEmber = aktualisFelhasznalo;
    var szerkeszthetE = false;
    if (bejelentkezettEmber !== null) {
        if (bejelentkezettEmber.szerepkor === 'admin' || bejelentkezettEmber.szerepkor === 'judge') {
            szerkeszthetE = true;
        }
    }

    for (var kor = 1; kor <= maxKor; kor++) {
        var korMeccsei = [];
        for (var j = 0; j < adatok.meccsek.length; j++) {
            if (adatok.meccsek[j].round === kor) {
                korMeccsei.push(adatok.meccsek[j]);
            }
        }

        korMeccsei.sort(function(a, b) {
            var aIndex = parseInt(a.id.split('-')[1]);
            var bIndex = parseInt(b.id.split('-')[1]);
            return aIndex - bIndex;
        });

        if (korMeccsei.length === 0) {
            continue;
        }

        var oszlop = document.createElement('div');
        // JAVÍTVA: Magyar CSS osztály
        oszlop.className = "fordulok-oszlopa round-column"; 

        for (var m = 0; m < korMeccsei.length; m++) {
            var meccs = korMeccsei[m];
            
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
                // JAVÍTVA: Magyar CSS osztály
                kapcsoloHtml = '<div class="meccs-osszekoto-vonal match-connector"></div>';
            }

            var aktivE = false;
            if (meccs.winner === null && versenyzo1 !== null && versenyzo2 !== null) {
                if (versenyzo1.nev !== "BYE" && versenyzo2.nev !== "BYE") {
                    aktivE = true;
                }
            }

            var kattintasAttributum = "";
            if (aktivE === true && szerkeszthetE === true) {
                kattintasAttributum = 'onclick="nyitBiroiPanelt(\'' + meccs.id + '\')"';
            }

            var kartya1Html = keszitKartyat(versenyzo1, 'aka', meccs, szerkeszthetE, kattintasAttributum);
            var kartya2Html = keszitKartyat(versenyzo2, 'shiro', meccs, szerkeszthetE, kattintasAttributum);

            // JAVÍTVA: Magyar CSS osztály
            var meccsWrapperHtml = '<div class="meccs-doboza match-wrapper">' + 
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
// 4. KÁRTYA GENERÁLÁSA (Tisztított HTML)
// ==========================================
function keszitKartyat(versenyzo, oldal, meccs, szerkeszthetE, kattintasAttributum) {
    if (versenyzo === null || versenyzo.azonosito === null) {
        // Üres hely kártyája
        return '<div class="versenyzo-kartya ures-kartya player-card empty-slot"></div>';
    }

    var gyoztesE = false;
    if (meccs.winner !== null && meccs.winner.azonosito === versenyzo.azonosito) {
        gyoztesE = true;
    }

    var stilusOsztalyok = "versenyzo-kartya player-card ";
    if (gyoztesE === true) {
        stilusOsztalyok += "gyoztes-kartya winner-card ";
    }
    
    if (kattintasAttributum !== "") {
        stilusOsztalyok += "kattinthat-kartya clickable ";
    }

    var kartyaSzine = "";
    var csikOsztaly = "";
    if (oldal === 'shiro') {
        kartyaSzine = '#D32F2F'; // Piros
        csikOsztaly = "szines-csik-piros shiro-strip";
    } else {
        kartyaSzine = '#0047AB'; // Kék
        csikOsztaly = "szines-csik-kek aka-strip";
    }

    var kartyaHtml = '<div class="' + stilusOsztalyok.trim() + '" ' + kattintasAttributum + '>';
    kartyaHtml += '<div class="szines-csik color-strip ' + csikOsztaly + '"></div>';
    kartyaHtml += '<div class="kartya-belso-tartalom card-content">';
    kartyaHtml += '<div class="kartya-nev card-name" style="color:' + kartyaSzine + '">';
    kartyaHtml += '[' + versenyzo.azonosito + '] ' + versenyzo.nev;
    kartyaHtml += '</div>';
    kartyaHtml += '<div class="kartya-klub card-details">' + versenyzo.klub + '</div>';
    kartyaHtml += '</div>';

    var vanPontszam = (meccs.scoreAka > 0 || meccs.scoreShiro > 0);
    if (vanPontszam === true) {
        var pontszamErtek = 0;
        if (oldal === 'aka') {
            pontszamErtek = meccs.scoreAka;
        } else {
            pontszamErtek = meccs.scoreShiro;
        }
        kartyaHtml += '<div class="kartya-pontszam">' + pontszamErtek + '</div>';
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

    document.getElementById('ref-aka').innerText = aktualisMeccs.aka.nev;
    document.getElementById('ref-shiro').innerText = aktualisMeccs.shiro.nev;

    frissitBiroiFeluletet();

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
        aktualisMeccs.scoreAka = aktualisMeccs.scoreAka + pont;
        
        // Ha 2 fölé ment, visszavágjuk 2-re!
        if (aktualisMeccs.scoreAka > 2) {
            aktualisMeccs.scoreAka = 2;
        }
    } else {
        aktualisMeccs.scoreShiro = aktualisMeccs.scoreShiro + pont;
        
        // Ha 2 fölé ment, visszavágjuk 2-re!
        if (aktualisMeccs.scoreShiro > 2) {
            aktualisMeccs.scoreShiro = 2;
        }
    }

    frissitBiroiFeluletet();

    if (aktualisMeccs.scoreAka === 2) {
        setTimeout(function() {
            alert("GYŐZTES: AKA");
            befejezMeccset();
        }, 100);
    } else if (aktualisMeccs.scoreShiro === 2) {
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
        }, 1000); 
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
    var mentesKesz = vegrehajtMentes();
    if (mentesKesz) {
        valtFul('bracket');
        document.getElementById('tab-referee').classList.add('hidden');
    }
}

// ==========================================
// 6. ADATBÁZIS MENTÉS SEGÉD (A Pincér hívása)
// ==========================================
function vegrehajtMentes() {
    // 1. Megpróbáljuk elküldeni a MySQL-nek (ha majd lesz)
    fetch('api.php?akcio=meccsMentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adatok)
    })
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(eredmeny) {
        console.log("Ágrajz mentve az adatbázisba!");
    })
    .catch(function(hiba) {
        // 2. Ha nincs PHP (pl. GitHubon vagyunk), elmentjük a böngésző memóriájába!
        console.log("Offline mód: Ágrajz mentése a böngészőbe...");
        var szoveg = JSON.stringify(adatok);
        localStorage.setItem('iko_db', szoveg); 
    });

    return true; // Visszaadja, hogy "Kész vagyok", mehet tovább a folyamat
}