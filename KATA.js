/* kata.js - Kata pontozási és forduló-kezelési logika, egyszerű, "junior" stílusban megírva */

// Kata verseny inicializálása: ellenőrzések és adatok előkészítése
function inicializalKataVersenyt() {
    // 1. lépés: Ellenőrizzük, hogy admin-e a felhasználó
    // Csak admin indíthat kata versenyt
    if (aktualisFelhasznalo.szerepkor !== 'admin') {
        alert("Csak Admin!");
        return; // Ha nem admin, kilépünk a függvényből
    }

    // 2. lépés: Kiolvassuk a kiválasztott kategóriát
    var kategoriaSelect = document.getElementById('p-cat');
    var kivalasztottKategoria = kategoriaSelect.value;

    // 3. lépés: Ellenőrizzük, hogy Kata típusú-e a kategória
    // A kategória nevében szerepelnie kell a "Kata" szónak
    var kataKategoriaE = kivalasztottKategoria.includes("Kata");
    if (!kataKategoriaE) {
        alert("Nem Kata!");
        return; // Ha nem Kata kategória, kilépünk
    }

    // 4. lépés: Kiszűrjük azokat a játékosokat, akik ebben a kategóriában neveztek
    var osszesJatekos = adatok.players;
    var jatekosokKategoriaban = [];
    
    for (var i = 0; i < osszesJatekos.length; i++) {
        var aktualisJatekos = osszesJatekos[i];
        if (aktualisJatekos.cat === kivalasztottKategoria) {
            jatekosokKategoriaban.push(aktualisJatekos);
        }
    }

    // 5. lépés: Ellenőrizzük, hogy van-e legalább egy nevezett játékos
    var jatekosokSzama = jatekosokKategoriaban.length;
    if (jatekosokSzama === 0) {
        alert("Üres!");
        return; // Ha nincs játékos, kilépünk
    }

    // 6. lépés: Előkészítjük az első forduló játékosait
    // Minden játékosnak 5 pontszáma lesz (5 bíró), kezdetben mind 0
    var elsoForduloJatekosok = [];
    for (var j = 0; j < jatekosokKategoriaban.length; j++) {
        var jatekos = jatekosokKategoriaban[j];
        var jatekosPontszamokkal = {
            id: jatekos.id,
            name: jatekos.name,
            dojo: jatekos.dojo,
            cat: jatekos.cat,
            scores: [0, 0, 0, 0, 0], // 5 bíró pontszámai
            total: 0 // Összesített pontszám (később számoljuk)
        };
        elsoForduloJatekosok.push(jatekosPontszamokkal);
    }

    // 7. lépés: Létrehozzuk a kata verseny adatstruktúráját
    // Ez egy objektum, ami tartalmazza a kategóriát, az első és második forduló játékosait
    var kataData = {
        category: kivalasztottKategoria, // Melyik kategória
        round1: elsoForduloJatekosok,      // Első forduló játékosai
        round2: [],                 // Második forduló játékosai (még üres)
        activeRound: 1              // Melyik forduló aktív (1 = első, 2 = második)
    };

    // 8. lépés: Elmentjük a localStorage-ba, hogy később is elérhető legyen
    var kataDataJson = JSON.stringify(kataData);
    localStorage.setItem('iko_kata_db', kataDataJson);

    // 9. lépés: Megjelenítjük a kata pontozási felületet és átváltunk a kata fülre
    rajzolKata();
    valtFul('kata');
}

// Bemeneti mező formázása: csak számokat engedünk be, és automatikusan pontot teszünk közé
function formazKataBevitel(bevitelMezo, jatekosIndex, biroIndex) {
    // 1. lépés: Kiolvassuk a beírt értéket
    var bemenetErtek = bemenet.value;

    // 2. lépés: Eltávolítjuk az összes nem-szám karaktert (betűk, szóközök, stb.)
    // A replace(/\D/g, '') azt jelenti: cserélj le minden nem-szám karaktert üres stringre
    // \D = minden karakter, ami NEM szám (0-9)
    // g = "global", azaz az összes előfordulást cseréljük le, nem csak az elsőt
    var csakSzamok = bemenetErtek.replace(/\D/g, '');

    // 3. lépés: Ha pontosan 2 számjegyet írtak be, formázzuk "X.Y" formátumra
    // Például: "75" -> "7.5"
    var bemenetHossz = csakSzamok.length;
    
    if (bemenetHossz === 2) {
        // Két számjegy esetén: első számjegy + pont + második számjegy
        var elsoSzamjegy = csakSzamok[0];
        var masodikSzamjegy = csakSzamok[1];
        var formazottErtek = elsoSzamjegy + "." + masodikSzamjegy;
        
        // Beállítjuk a formázott értéket a mezőbe
        bemenet.value = formazottErtek;
        
        // Frissítjük a pontszámot az adatbázisban
        frissitKataPontszam(jatekosIndex, biroIndex, formazottErtek);
        
        // Automatikusan átugrik a következő mezőre (ha van)
        var kovetkezoBemenet = bemenet.nextElementSibling;
        if (kovetkezoBemenet) {
            kovetkezoBemenet.focus();
        }
    } else {
        // Ha nem 2 számjegy, csak a számokat hagyjuk meg (de nem formázzuk)
        bemenet.value = csakSzamok;
    }
}

// Kata pontozási táblázat megjelenítése
function rajzolKata() {
    // 1. lépés: Betöltjük a kata adatokat a localStorage-ból
    var kataAdatJson = localStorage.getItem('iko_kata_db');
    
    // Ha nincs adat, kilépünk
    if (!kataAdatJson) {
        return;
    }
    
    var kataData = JSON.parse(kataAdatJson);

    // 2. lépés: Megkeressük a tárolót, ahova a tartalmat írni fogjuk
    var tartalom = document.getElementById('kata-content');
    tartalom.innerHTML = ""; // Ürítjük a tárolót

    // 3. lépés: Ellenőrizzük, hogy van-e első forduló adat
    if (!kataData || !kataData.round1) {
        return; // Ha nincs adat, kilépünk
    }

    // 4. lépés: Meghatározzuk, hogy ki szerkesztheti a pontszámokat
    // Admin és bíró szerkeszthet, mások csak nézhetik
    var felhasznaloSzerepkor = jelenlegiFelhasznalo.szerepkor;
    var szerkeszthetoE = (felhasznaloSzerepkor === 'admin' || felhasznaloSzerepkor === 'judge');

    // 5. lépés: CSS osztályok beállítása a szerkeszhetőség alapján
    var bevitelOsztaly;
    if (szerkeszthetoE) {
        bevitelOsztaly = "score-input border bg-white"; // Szerkeszthető: fehér háttér, szegély
    } else {
        bevitelOsztaly = "score-input bg-gray-100 disabled"; // Csak olvasható: szürke háttér
    }

    // 6. lépés: Fejléc HTML létrehozása
    var kategoriaNev = kataData.category;
    var fejlecHtml = '<h2 class="text-xl font-bold mb-4 border-b pb-2">Kata: ' + kategoriaNev + '</h2>';
    tartalom.innerHTML += fejlecHtml;

    // 7. lépés: Meghatározzuk, melyik forduló adatait kell megjeleníteni
    var aktivFordulo = kataData.activeRound;
    var megjelenitendoJatekosok;
    if (aktivFordulo === 1) {
        megjelenitendoJatekosok = kataData.round1; // Első forduló játékosai
    } else {
        megjelenitendoJatekosok = kataData.round2; // Második forduló játékosai
    }

    // 8. lépés: Táblázat HTML kezdete
    var tablaHtml = '<div class="bg-white border rounded shadow">';

    // 9. lépés: Végigmegyünk minden játékoson és létrehozzuk a sorokat
    for (var i = 0; i < megjelenitendoJatekosok.length; i++) {
        var jatekos = megjelenitendoJatekosok[i];
        var jatekosNeve = jatekos.name;

        // 10. lépés: 5 bemeneti mező létrehozása (5 bíró pontszámai)
        var bevitelMezokHtml = "";
        for (var j = 0; j < 5; j++) {
            var pontszamErtek = jatekos.scores[j] || ''; // Ha nincs érték, üres string
            var letiltottAttr = szerkeszthetoE ? '' : 'disabled'; // Ha nem szerkeszthető, disabled attribútum
            
            var bevitelHtml = '<input type="text" maxlength="2" class="' + bevitelOsztaly + '" value="' + pontszamErtek + '" ' + letiltottAttr + ' oninput="formazKataBevitel(this, ' + i + ', ' + j + ')">';
            bevitelMezokHtml += bevitelHtml;
        }

        // 11. lépés: Egy sor HTML létrehozása: név + 5 bemeneti mező + összesített pontszám
        var osszesitettPontszam = jatekos.total;
        var sorHtml = '<div class="flex items-center border-b p-2">';
        sorHtml += '<div class="flex-1 font-bold text-sm">' + jatekosNeve + '</div>';
        sorHtml += bevitelMezokHtml;
        sorHtml += '<div class="w-16 text-center font-bold ml-2 border-l">' + osszesitettPontszam + '</div>';
        sorHtml += '</div>';
        
        tablaHtml += sorHtml;
    }

    // 12. lépés: Táblázat HTML zárása
    tablaHtml += '</div>';
    tartalom.innerHTML += tablaHtml;

    // 13. lépés: Ha admin vagyunk és az első forduló aktív, megjelenítjük a "TOP 6 Továbbjut" gombot
    if (jelenlegiFelhasznalo.szerepkor === 'admin' && aktivFordulo === 1) {
        var gombHtml = '<button onclick="befejezElsoKataFordulot()" class="mt-4 bg-zinc-800 text-white w-full py-2 rounded">TOP 6 Továbbjut</button>';
        tartalom.innerHTML += gombHtml;
    }
}

// Pontszám frissítése: amikor egy bíró pontszámot ad
function frissitKataPontszam(jatekosIndex, biroIndex, ertek) {
    // 1. lépés: Betöltjük a kata adatokat
    var kataDataJson = localStorage.getItem('iko_kata_db');
    var kataData = JSON.parse(kataDataJson);

    // 2. lépés: Meghatározzuk, melyik forduló aktív
    var aktivFordulo = kataData.activeRound;
    var jatekosokLista;
    if (aktivFordulo === 1) {
        jatekosokLista = kataData.round1;
    } else {
        jatekosokLista = kataData.round2;
    }

    // 3. lépés: Frissítjük a konkrét bíró pontszámát
    // jatekosIndex = játékos indexe, biroIndex = bíró indexe (0-4)
    var pontszamSzamkent = parseFloat(ertek);
    if (isNaN(pontszamSzamkent)) {
        pontszamSzamkent = 0; // Ha nem szám, 0-ra állítjuk
    }
    jatekosokLista[jatekosIndex].scores[biroIndex] = pontszamSzamkent;

    // 4. lépés: Kiszámoljuk az összesített pontszámot
    // A kata pontszámítás szabálya: összeadjuk az 5 pontszámot, majd kivonjuk a legkisebbet és a legnagyobbat
    var pontszamok = jatekosokLista[jatekosIndex].scores;
    
    // Összeadjuk az összes pontszámot
    var osszeg = 0;
    for (var i = 0; i < pontszamok.length; i++) {
        osszeg = osszeg + pontszamok[i];
    }

    // Megkeressük a legkisebb pontszámot
    var legkisebbPontszam = pontszamok[0];
    for (var j = 1; j < pontszamok.length; j++) {
        if (pontszamok[j] < legkisebbPontszam) {
            legkisebbPontszam = pontszamok[j];
        }
    }

    // Megkeressük a legnagyobb pontszámot
    var legnagyobbPontszam = pontszamok[0];
    for (var k = 1; k < pontszamok.length; k++) {
        if (pontszamok[k] > legnagyobbPontszam) {
            legnagyobbPontszam = pontszamok[k];
        }
    }

    // Kivonjuk a legkisebbet és a legnagyobbat az összegből
    var osszegMinMaxNelkul = osszeg - legkisebbPontszam - legnagyobbPontszam;

    // Kerekítjük 1 tizedesjegyre (Math.round szorozva 10-el, majd osztva 10-el)
    var kerekitettOsszesitett = Math.round(osszegMinMaxNelkul * 10) / 10;

    // Beállítjuk az összesített pontszámot
    jatekosokLista[jatekosIndex].total = kerekitettOsszesitett;

    // 5. lépés: Elmentjük a frissített adatokat
    var frissitettKataDataJson = JSON.stringify(kataData);
    localStorage.setItem('iko_kata_db', frissitettKataDataJson);

    // 6. lépés: Újra megjelenítjük a táblázatot (frissített pontszámokkal)
    rajzolKata();
}

// Első forduló befejezése: TOP 6 játékos továbbjutása a második fordulóba
function befejezElsoFordulot() {
    // 1. lépés: Betöltjük a kata adatokat
    var kataAdatJson = localStorage.getItem('iko_kata_db');
    var kataAdat = JSON.parse(kataAdatJson);

    // 2. lépés: Másolatot készítünk az első forduló játékosairól
    // (Így nem módosítjuk az eredetit, amíg nem kell)
    var elsoForduloMasolat = [];
    for (var i = 0; i < kataAdat.elsoFordulo.length; i++) {
        elsoForduloMasolat.push(kataAdat.elsoFordulo[i]);
    }

    // 3. lépés: Rendezzük a játékosokat pontszám szerint csökkenő sorrendben
    // A legjobb pontszámú játékos lesz az első
    for (var j = 0; j < elsoForduloMasolat.length - 1; j++) {
        for (var k = j + 1; k < elsoForduloMasolat.length; k++) {
            if (elsoForduloMasolat[j].osszesitett < elsoForduloMasolat[k].osszesitett) {
                // Csere: ha a j-edik játékos pontszáma kisebb, mint a k-adiké, cseréljük meg őket
                var temp = elsoForduloMasolat[j];
                elsoForduloMasolat[j] = elsoForduloMasolat[k];
                elsoForduloMasolat[k] = temp;
            }
        }
    }

    // 4. lépés: Kiválasztjuk az első 6 játékost (TOP 6)
    var top6Versenyzok = [];
    var maxVersenyzok = 6;
    if (elsoForduloMasolat.length < maxVersenyzok) {
        maxVersenyzok = elsoForduloMasolat.length; // Ha kevesebb mint 6 játékos van, akkor annyit veszünk
    }
    
    for (var m = 0; m < maxVersenyzok; m++) {
        top6Versenyzok.push(elsoForduloMasolat[m]);
    }

    // 5. lépés: Megfordítjuk a sorrendet (a legrosszabb pontszámú lesz az első)
    // Ez azért kell, mert a második fordulóban fordított sorrendben jelennek meg
    var megforditottTop6 = [];
    for (var n = top6Versenyzok.length - 1; n >= 0; n--) {
        megforditottTop6.push(top6Versenyzok[n]);
    }

    // 6. lépés: Előkészítjük a második forduló játékosait
    // Minden játékosnak újra nullázzuk a pontszámait
    var masodikForduloVersenyzoi = [];
    for (var p = 0; p < megforditottTop6.length; p++) {
        var versenyzo = megforditottTop6[p];
        var versenyzoMasodikFordulohoz = {
            id: versenyzo.id,
            nev: versenyzo.nev,
            klub: versenyzo.klub,
            kategoria: versenyzo.kategoria,
            pontszamok: [0, 0, 0, 0, 0], // Újra 5 bíró, mind 0
            osszesitett: 0 // Újra 0 az összesített pontszám
        };
        masodikForduloVersenyzoi.push(versenyzoMasodikFordulohoz);
    }

    // 7. lépés: Beállítjuk a második forduló játékosait és aktívvá tesszük a második fordulót
    kataAdat.masodikFordulo = masodikForduloVersenyzoi;
    kataAdat.aktivFordulo = 2;

    // 8. lépés: Elmentjük a frissített adatokat
    var frissitettKataAdatJson = JSON.stringify(kataAdat);
    localStorage.setItem('iko_kata_db', frissitettKataAdatJson);

    // 9. lépés: Újra megjelenítjük a táblázatot (második fordulóval)
    rajzolKata();
}
