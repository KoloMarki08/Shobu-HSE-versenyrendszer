/* KATA.js - Kata pontozási és forduló-kezelési logika, junior stílusban! */

// ==========================================
// 1. KATA VERSENY INDÍTÁSA
// ==========================================
function inditKataVerseny() {
    if (aktualisFelhasznalo.szerepkor !== 'admin') {
        alert("Csak Admin indíthatja el!");
        return;
    }

    var kategoriaSelect = document.getElementById('p-cat');
    var kivalasztottKategoria = kategoriaSelect.value;

    var kataKategoriaE = kivalasztottKategoria.includes("Kata");
    if (kataKategoriaE === false) {
        alert("Ez nem Kata kategória!");
        return;
    }

    var osszesJatekos = adatok.versenyzok;
    var jatekosokKategoriaban = [];
    
    for (var i = 0; i < osszesJatekos.length; i++) {
        var aktualisJatekos = osszesJatekos[i];
        if (aktualisJatekos.kategoria === kivalasztottKategoria) {
            jatekosokKategoriaban.push(aktualisJatekos);
        }
    }

    if (jatekosokKategoriaban.length === 0) {
        alert("Nincs nevező ebben a kategóriában!");
        return;
    }

    var elsoForduloJatekosok = [];
    for (var j = 0; j < jatekosokKategoriaban.length; j++) {
        var jatekos = jatekosokKategoriaban[j];
        var jatekosPontszamokkal = {
            azonosito: jatekos.azonosito,
            nev: jatekos.nev,
            klub: jatekos.klub,
            kategoria: jatekos.kategoria,
            pontszamok: [0, 0, 0, 0, 0], // 5 bíró pontszámai, kezdetben nulla
            osszesitett: 0, // Ide jön a 3 középső összege
            kiesettMin: 0,  // Itt tároljuk a legkisebb eldobottat
            kiesettMax: 0   // Itt tároljuk a legnagyobb eldobottat
        };
        elsoForduloJatekosok.push(jatekosPontszamokkal);
    }

    var kataAdatbazis = {
        kategoria: kivalasztottKategoria, 
        elsoFordulo: elsoForduloJatekosok,      
        masodikFordulo: [],                 
        aktivFordulo: 1              
    };

    var kataDataJson = JSON.stringify(kataAdatbazis);
    localStorage.setItem('iko_kata_db', kataDataJson);

    rajzolKata();
    valtFul('kata');
}

// ==========================================
// 2. BEVITEL FORMÁZÁSA (Pl. 75 -> 7.5)
// ==========================================
function formazKataBevitel(bevitelMezo, jatekosIndex, biroIndex) {
    var bemenetErtek = bevitelMezo.value;

    // Kicserélünk mindent, ami nem szám, a semmire (töröljük a betűket)
    var csakSzamok = bemenetErtek.replace(/\D/g, '');
    var bemenetHossz = csakSzamok.length;
    
    // Ha beírtak két számot, teszünk közé egy pontot
    if (bemenetHossz === 2) {
        var elsoSzamjegy = csakSzamok[0];
        var masodikSzamjegy = csakSzamok[1];
        var formazottErtek = elsoSzamjegy + "." + masodikSzamjegy;
        
        bevitelMezo.value = formazottErtek;
        
        // Szólunk a másik függvénynek, hogy számoljon!
        frissitKataPontszam(jatekosIndex, biroIndex, formazottErtek);
        
        // Automatikusan ugrunk a következő dobozra
        var kovetkezoBemenet = bevitelMezo.nextElementSibling;
        if (kovetkezoBemenet !== null) {
            kovetkezoBemenet.focus();
        }
    } else {
        bevitelMezo.value = csakSzamok;
    }
}

// ==========================================
// 3. PONTSZÁMOK, ÖSSZEG ÉS HOLTVERSENY KEZELÉSE
// ==========================================
function frissitKataPontszam(jatekosIndex, biroIndex, ertek) {
    var kataDataJson = localStorage.getItem('iko_kata_db');
    var kataData = JSON.parse(kataDataJson);

    var jatekosokLista = [];
    if (kataData.aktivFordulo === 1) {
        jatekosokLista = kataData.elsoFordulo;
    } else {
        jatekosokLista = kataData.masodikFordulo;
    }

    // Beírjuk a bíró pontját a tömbbe
    var pontszamSzamkent = parseFloat(ertek);
    if (isNaN(pontszamSzamkent)) {
        pontszamSzamkent = 0; 
    }
    jatekosokLista[jatekosIndex].pontszamok[biroIndex] = pontszamSzamkent;

    var pontszamok = jatekosokLista[jatekosIndex].pontszamok;
    var osszeg = 0;
    var nullasBirokSzama = 0; 
    
    for (var i = 0; i < pontszamok.length; i++) {
        osszeg = osszeg + pontszamok[i];
        if (pontszamok[i] === 0) {
            nullasBirokSzama = nullasBirokSzama + 1;
        }
    }

    // Ha mind az 5 bíró adott pontot:
    if (nullasBirokSzama === 0) {
        var legkisebbPontszam = pontszamok[0];
        for (var j = 1; j < pontszamok.length; j++) {
            if (pontszamok[j] < legkisebbPontszam) {
                legkisebbPontszam = pontszamok[j];
            }
        }

        var legnagyobbPontszam = pontszamok[0];
        for (var k = 1; k < pontszamok.length; k++) {
            if (pontszamok[k] > legnagyobbPontszam) {
                legnagyobbPontszam = pontszamok[k];
            }
        }

        var veglegesOsszeg = osszeg - legkisebbPontszam - legnagyobbPontszam;
        var kerekitettVeglegesOsszeg = Math.round(veglegesOsszeg * 100) / 100;

        // Eltároljuk az értékeket a játékosnál
        jatekosokLista[jatekosIndex].osszesitett = kerekitettVeglegesOsszeg;
        jatekosokLista[jatekosIndex].kiesettMin = legkisebbPontszam;
        jatekosokLista[jatekosIndex].kiesettMax = legnagyobbPontszam;

    } else {
        jatekosokLista[jatekosIndex].osszesitett = 0;
        jatekosokLista[jatekosIndex].kiesettMin = 0;
        jatekosokLista[jatekosIndex].kiesettMax = 0;
    }

    // --- TELJES HOLTVERSENY ELLENŐRZÉSE ---
    // Megnézzük, hogy az egész csoportban mindenkinek megvan-e már az 5 pontja
    var mindenkiKesz = true;
    for (var m = 0; m < jatekosokLista.length; m++) {
        if (jatekosokLista[m].osszesitett === 0) {
            mindenkiKesz = false;
        }
    }

    // Ha vége a körnek, ellenőrizzük, van-e abszolút döntetlen!
    if (mindenkiKesz === true) {
        for (var a = 0; a < jatekosokLista.length - 1; a++) {
            for (var b = a + 1; b < jatekosokLista.length; b++) {
                var ember1 = jatekosokLista[a];
                var ember2 = jatekosokLista[b];

                // Ha a pont, a min, ÉS a max is teljesen ugyanaz
                if (ember1.osszesitett === ember2.osszesitett &&
                    ember1.kiesettMin === ember2.kiesettMin &&
                    ember1.kiesettMax === ember2.kiesettMax &&
                    ember1.osszesitett > 0) {

                    alert("⚠️ ABSZOLÚT DÖNTETLEN!\n\n" + ember1.nev + " és " + ember2.nev + " pontjai teljesen megegyeznek (Összeg, Min és Max is).\nÚjra kell katázniuk, a pontjaikat töröltük!");

                    // Pontok törlése mindkét embernél
                    ember1.pontszamok = [0, 0, 0, 0, 0];
                    ember1.osszesitett = 0;
                    ember1.kiesettMin = 0;
                    ember1.kiesettMax = 0;

                    ember2.pontszamok = [0, 0, 0, 0, 0];
                    ember2.osszesitett = 0;
                    ember2.kiesettMin = 0;
                    ember2.kiesettMax = 0;
                }
            }
        }
    }

    var frissitettKataDataJson = JSON.stringify(kataData);
    localStorage.setItem('iko_kata_db', frissitettKataDataJson);

    rajzolKata();
}

// ==========================================
// 4. KÉPERNYŐ KIRAJZOLÁSA ÉS HELYEZÉSEK
// ==========================================
function rajzolKata() {
    var kataAdatJson = localStorage.getItem('iko_kata_db');
    if (kataAdatJson === null) return;
    
    var kataData = JSON.parse(kataAdatJson);
    var tartalom = document.getElementById('kata-content');
    tartalom.innerHTML = ""; 

    if (kataData === null || kataData.elsoFordulo === undefined) return;

    var szerkeszthetoE = false;
    if (aktualisFelhasznalo.szerepkor === 'admin' || aktualisFelhasznalo.szerepkor === 'judge') {
        szerkeszthetoE = true;
    }

    var bevitelOsztaly = szerkeszthetoE ? "score-input border bg-white text-center w-12" : "score-input bg-gray-100 disabled text-center w-12"; 

    tartalom.innerHTML += '<h2 class="text-xl font-bold mb-4 border-b pb-2">Kata: ' + kataData.kategoria + '</h2>';

    var megjelenitendoJatekosok = [];
    if (kataData.aktivFordulo === 1) {
        megjelenitendoJatekosok = kataData.elsoFordulo; 
    } else {
        megjelenitendoJatekosok = kataData.masodikFordulo; 
    }

    // --- VÉGEREDMÉNY ELLENŐRZÉSE A 2. KÖRBEN ---
    var vegeVanE = false;
    var helyezesekListaja = [];

    if (kataData.aktivFordulo === 2) {
        var mindenkiPontozva = true;
        for (var e = 0; e < megjelenitendoJatekosok.length; e++) {
            if (megjelenitendoJatekosok[e].osszesitett === 0) {
                mindenkiPontozva = false;
            }
        }

        // Ha mindenkinek van végleges pontja, kiszámoljuk a helyezéseket!
        if (mindenkiPontozva === true && megjelenitendoJatekosok.length > 0) {
            vegeVanE = true;
            
            // Lemásoljuk a játékosokat a rendezéshez
            for (var m = 0; m < megjelenitendoJatekosok.length; m++) {
                helyezesekListaja.push(megjelenitendoJatekosok[m]);
            }
            
            // JUNIOR RENDEZÉS Szuper Erős Holtverseny Szabállyal!
            for (var r1 = 0; r1 < helyezesekListaja.length - 1; r1++) {
                for (var r2 = r1 + 1; r2 < helyezesekListaja.length; r2++) {
                    var csere = false;
                    var jatekos1 = helyezesekListaja[r1];
                    var jatekos2 = helyezesekListaja[r2];

                    if (jatekos1.osszesitett < jatekos2.osszesitett) {
                        csere = true;
                    } else if (jatekos1.osszesitett === jatekos2.osszesitett) {
                        // Ha egyenlő a pont, nézzük a MIN-t! (Akinek nagyobb, az nyer)
                        if (jatekos1.kiesettMin < jatekos2.kiesettMin) {
                            csere = true;
                        } else if (jatekos1.kiesettMin === jatekos2.kiesettMin) {
                            // Ha még a MIN is egyenlő, nézzük a MAX-ot!
                            if (jatekos1.kiesettMax < jatekos2.kiesettMax) {
                                csere = true;
                            }
                        }
                    }

                    if (csere === true) {
                        var tempHelyezes = helyezesekListaja[r1];
                        helyezesekListaja[r1] = helyezesekListaja[r2];
                        helyezesekListaja[r2] = tempHelyezes;
                    }
                }
            }
        }
    }
    // ------------------------------------------

    var tablaHtml = '<div class="bg-white border rounded shadow">';

    // Kirajzoljuk a játékosokat a képernyőre
    for (var i = 0; i < megjelenitendoJatekosok.length; i++) {
        var jatekos = megjelenitendoJatekosok[i];
        
        // Név és (Min/Max) kijelzése
        var nevKijelzes = jatekos.nev;
        if (jatekos.osszesitett > 0) {
            nevKijelzes += " <span class='text-xs text-gray-500 font-normal ml-2'>(Min: " + jatekos.kiesettMin + " | Max: " + jatekos.kiesettMax + ")</span>";
        }

        // Helyezés kiírása, ha vége van a 2. körnek
        if (vegeVanE === true) {
            var hanyadik = 0;
            for (var h = 0; h < helyezesekListaja.length; h++) {
                if (helyezesekListaja[h].azonosito === jatekos.azonosito) {
                    hanyadik = h + 1;
                }
            }
            
            if (hanyadik === 1) {
                nevKijelzes += " <span class='ml-2 text-yellow-500 font-black text-lg'>🏆 1. HELY</span>";
            } else if (hanyadik === 2) {
                nevKijelzes += " <span class='ml-2 text-gray-400 font-black'>🥈 2. HELY</span>";
            } else if (hanyadik === 3) {
                nevKijelzes += " <span class='ml-2 text-orange-600 font-black'>🥉 3. HELY</span>";
            } else {
                nevKijelzes += " <span class='ml-2 text-zinc-500 font-bold'>(" + hanyadik + ". hely)</span>";
            }
        }

        var bevitelMezokHtml = "";
        for (var j = 0; j < 5; j++) {
            var pontszamErtek = jatekos.pontszamok[j];
            if (pontszamErtek === 0) pontszamErtek = '';
            
            var letiltottAttr = (szerkeszthetoE === false) ? "disabled" : "";
            
            var bevitelHtml = '<input type="text" maxlength="2" class="' + bevitelOsztaly + ' mx-1" value="' + pontszamErtek + '" ' + letiltottAttr + ' oninput="formazKataBevitel(this, ' + i + ', ' + j + ')">';
            bevitelMezokHtml += bevitelHtml;
        }

        var osszesitettPontszam = jatekos.osszesitett;
        if (osszesitettPontszam === 0) {
            osszesitettPontszam = "-";
        }

        var sorHtml = '<div class="flex items-center border-b p-2">';
        sorHtml += '<div class="flex-1 font-bold text-sm">' + nevKijelzes + '</div>';
        sorHtml += bevitelMezokHtml;
        sorHtml += '<div class="w-16 text-center text-red-600 font-black ml-2 border-l">' + osszesitettPontszam + '</div>';
        sorHtml += '</div>';
        
        tablaHtml += sorHtml;
    }

    tablaHtml += '</div>';
    tartalom.innerHTML += tablaHtml;

    // Gomb a 2. kör indításához
    if (aktualisFelhasznalo.szerepkor === 'admin' && kataData.aktivFordulo === 1) {
        var gombHtml = '<button onclick="befejezElsoKataFordulot()" class="mt-4 bg-zinc-800 text-white w-full py-2 font-bold rounded hover:bg-red-600 transition">TOP 6 Továbbjut (Második kör indítása)</button>';
        tartalom.innerHTML += gombHtml;
    }
}

// ==========================================
// 5. TOVÁBBJUTÁS A 2. KÖRBE (TOP 6)
// ==========================================
function befejezElsoKataFordulot() {
    var kataAdatJson = localStorage.getItem('iko_kata_db');
    var kataAdat = JSON.parse(kataAdatJson);

    var elsoForduloMasolat = [];
    for (var i = 0; i < kataAdat.elsoFordulo.length; i++) {
        elsoForduloMasolat.push(kataAdat.elsoFordulo[i]);
    }

    // RENDEZÉS A HOLTVERSENY SZABÁLYOKKAL (Összeg -> Min -> Max)
    for (var j = 0; j < elsoForduloMasolat.length - 1; j++) {
        for (var k = j + 1; k < elsoForduloMasolat.length; k++) {
            var csere = false;
            var jatekosJ = elsoForduloMasolat[j];
            var jatekosK = elsoForduloMasolat[k];

            if (jatekosJ.osszesitett < jatekosK.osszesitett) {
                csere = true;
            } else if (jatekosJ.osszesitett === jatekosK.osszesitett) {
                if (jatekosJ.kiesettMin < jatekosK.kiesettMin) {
                    csere = true;
                } else if (jatekosJ.kiesettMin === jatekosK.kiesettMin) {
                    if (jatekosJ.kiesettMax < jatekosK.kiesettMax) {
                        csere = true;
                    }
                }
            }

            if (csere === true) {
                var temp = elsoForduloMasolat[j];
                elsoForduloMasolat[j] = elsoForduloMasolat[k];
                elsoForduloMasolat[k] = temp;
            }
        }
    }

    var top6Versenyzok = [];
    var maxVersenyzok = 6;
    if (elsoForduloMasolat.length < maxVersenyzok) {
        maxVersenyzok = elsoForduloMasolat.length; 
    }
    
    for (var m = 0; m < maxVersenyzok; m++) {
        top6Versenyzok.push(elsoForduloMasolat[m]);
    }

    // --- FORDÍTOTT SORREND ---
    // A 6. helyezett megy a lista elejére (ő kezd a tatamin)
    var megforditottTop6 = [];
    for (var n = top6Versenyzok.length - 1; n >= 0; n--) {
        megforditottTop6.push(top6Versenyzok[n]);
    }

    var masodikForduloVersenyzoi = [];
    for (var p = 0; p < megforditottTop6.length; p++) {
        var versenyzo = megforditottTop6[p];
        var versenyzoMasodikFordulohoz = {
            azonosito: versenyzo.azonosito,
            nev: versenyzo.nev,
            klub: versenyzo.klub,
            kategoria: versenyzo.kategoria,
            pontszamok: [0, 0, 0, 0, 0], 
            osszesitett: 0,
            kiesettMin: 0,
            kiesettMax: 0
        };
        masodikForduloVersenyzoi.push(versenyzoMasodikFordulohoz);
    }

    kataAdat.masodikFordulo = masodikForduloVersenyzoi;
    kataAdat.aktivFordulo = 2;

    var frissitettKataAdatJson = JSON.stringify(kataAdat);
    localStorage.setItem('iko_kata_db', frissitettKataAdatJson);

    rajzolKata();
}