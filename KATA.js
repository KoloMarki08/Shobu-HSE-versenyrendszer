/* ========================================================================= */
/* KATA.js - Formagyakorlat verseny kezelése, 2 Fordulós Döntő rendszer (WKF)*/
/* ========================================================================= */

// 1. KATA LISTA GENERÁLÁSA
function generalKata() {
    if (aktualisFelhasznalo.szerepkor !== 'admin') {
        alert("Csak admin generálhatja le a listát!");
        return;
    }

    var kivalasztottKategoria = document.getElementById('p-cat').value;
    
    if (kivalasztottKategoria.includes('Kumite')) {
        alert("Ez Kumite kategória, nem Kata!");
        return;
    }

    var jatekosok = [];
    for (var i = 0; i < adatok.versenyzok.length; i++) {
        if (adatok.versenyzok[i].kategoria === kivalasztottKategoria) {
            jatekosok.push(adatok.versenyzok[i]);
        }
    }

    if (jatekosok.length === 0) {
        alert("Nincs versenyző ebben a kategóriában!");
        return;
    }

    if (!adatok.kata) adatok.kata = {};
    
    // Létrehozzuk az alap adatszerkezetet az 1. és 2. fordulónak is!
    if (!adatok.kata[kivalasztottKategoria]) {
        adatok.kata[kivalasztottKategoria] = [];
        for (var j = 0; j < jatekosok.length; j++) {
            adatok.kata[kivalasztottKategoria].push({
                versenyzo: jatekosok[j],
                pontok: ["", "", "", "", ""],      // 1. Forduló bírói
                osszpont: 0,                       // 1. Forduló összpont
                pontokDonto: ["", "", "", "", ""], // 2. Forduló (Döntő) bírói
                osszpontDonto: 0                   // 2. Forduló összpont
            });
        }
    } else {
        // Visszamenőleges frissítés, ha már van mentett adatbázisod, de nincs még Döntő része
        for (var k = 0; k < adatok.kata[kivalasztottKategoria].length; k++) {
            if (!adatok.kata[kivalasztottKategoria][k].pontokDonto) {
                adatok.kata[kivalasztottKategoria][k].pontokDonto = ["", "", "", "", ""];
                adatok.kata[kivalasztottKategoria][k].osszpontDonto = 0;
            }
        }
    }

    rajzolKata();
    valtFul('kata');
}

// 2. KATA TÁBLÁZATOK RAJZOLÁSA (1. FORDULÓ ÉS DÖNTŐ)
function rajzolKata() {
    var kivalasztottKategoria = document.getElementById('p-cat').value;
    var tartalom = document.getElementById('kata-content'); 
    
    if (!tartalom) return; 
    tartalom.innerHTML = "";

    if (!adatok.kata || !adatok.kata[kivalasztottKategoria]) {
        tartalom.innerHTML = "<p style='color: #64748b; padding: 20px;'>Válassz egy Kata kategóriát a Nevezés fülön, és nyomd meg a 'Kata Panel' gombot!</p>";
        return;
    }

    var eredetiLista = adatok.kata[kivalasztottKategoria];

    // ==========================================
    // 1. FORDULÓ (SELEJTEZŐ) FELDOLGOZÁSA
    // ==========================================
    eredetiLista.sort(function(a, b) {
        return b.osszpont - a.osszpont;
    });

    for (var k = 0; k < eredetiLista.length; k++) {
        eredetiLista[k].helyezes1 = k + 1;
    }

    var szerkeszthetE = (aktualisFelhasznalo !== null && (aktualisFelhasznalo.szerepkor === 'admin' || aktualisFelhasznalo.szerepkor === 'judge'));

    var html = '<div class="kata-tabla-tarolo" style="margin-bottom: 40px;">';
    html += '<h3 style="background-color: #1e293b; color: white; padding: 12px; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em;">1. Forduló (Selejtező)</h3>';
    
    // 1. Forduló Fejléc
    html += '<div class="kata-sor" style="background-color: #f1f5f9; font-weight: bold; border-bottom: 2px solid #cbd5e1;">';
    html += '<div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px;">Helyezés | Versenyző Neve</div>';
    html += '<div class="kata-beviteli-mezok" style="justify-content: center; gap: 5px;">';
    html += '<span style="width: 3rem; text-align:center;">B1</span><span style="width: 3rem; text-align:center;">B2</span><span style="width: 3rem; text-align:center;">B3</span><span style="width: 3rem; text-align:center;">B4</span><span style="width: 3rem; text-align:center;">B5</span>';
    html += '</div>';
    html += '<div style="width: 60px; text-align: right; font-weight: 900; color: #64748b;">ÖSSZ</div>';
    html += '</div>';

    // 1. Forduló Sorok
    for (var i = 0; i < eredetiLista.length; i++) {
        var adat = eredetiLista[i];
        var v = adat.versenyzo;
        var hely = adat.helyezes1;
        
        var sorStilus = "border-bottom: 1px solid #e5e7eb;";
        var nevStilus = "";

        // A továbbjutó Top 6 halványzöld kiemelést kap az 1. fordulóban
        if (hely <= 6 && adat.osszpont > 0) {
            sorStilus += " background-color: #f0fdf4;"; 
            nevStilus = "font-weight: bold; color: #15803d;";
        }
        if (hely === 6 && eredetiLista.length > 6) {
            sorStilus += " border-bottom: 3px dashed #15803d;"; // Továbbjutás vágóvonala
        }

        html += '<div class="kata-sor" style="' + sorStilus + '">';
        html += '<div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px; ' + nevStilus + '">';
        html += hely + '. [' + v.id + '] ' + v.nev + ' <span style="font-size: 0.8em; color: #94a3b8;">(' + v.klub + ')</span></div>';
        
        html += '<div class="kata-beviteli-mezok">';
        for (var b = 0; b < 5; b++) {
            var ertek = adat.pontok[b] || "";
            var readonly = szerkeszthetE ? "" : "readonly";
            // Az 1. forduló mezői (fordulo = 1)
            html += '<input type="number" step="0.1" min="5.0" max="8.5" class="score-input score-input-1" ';
            html += 'value="' + ertek + '" ' + readonly + ' ';
            html += 'oninput="okosKataPontBeiras(this, \'' + kivalasztottKategoria + '\', \'' + v.id + '\', ' + b + ', 1)" ';
            html += 'onblur="veglegesitMezot(this, \'' + kivalasztottKategoria + '\', \'' + v.id + '\', ' + b + ', 1)">';
        }
        html += '</div>';
        
        html += '<div style="width: 60px; text-align: right; font-weight: 900; font-size: 1.2rem; color: #0f172a;">' + adat.osszpont.toFixed(1) + '</div>';
        html += '</div>';
    }
    html += '</div>';

    // ==========================================
    // 2. FORDULÓ (DÖNTŐ - TOP 6) FELDOLGOZÁSA
    // ==========================================
    var top6 = eredetiLista.slice(0, 6);
    
    // Döntős sorbarendezés
    var dontosok = top6.slice(); 
    dontosok.sort(function(a, b) {
        if (b.osszpontDonto !== a.osszpontDonto) {
            return b.osszpontDonto - a.osszpontDonto; // Döntős pontszám alapján csökkenő
        } else {
            return a.helyezes1 - b.helyezes1; // Fallback: 1. hely elöl, 6. hátul
        }
    });

    for (var d = 0; d < dontosok.length; d++) {
        dontosok[d].helyezesDonto = d + 1; // 1., 2., 3. hely a Döntőben
    }

    // ITT A VARÁZSLAT: Megfordítjuk a sorrendet! (6. helyezett megy felülre)
    dontosok.reverse();

    html += '<div class="kata-tabla-tarolo" style="border: 2px solid #ca8a04; box-shadow: 0 10px 25px rgba(202, 138, 4, 0.2);">';
    html += '<h3 style="background-color: #ca8a04; color: white; padding: 12px; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em;">2. Forduló (Döntő - Top 6)</h3>';
    
    html += '<div class="kata-sor" style="background-color: #fefce8; font-weight: bold; border-bottom: 2px solid #fde047;">';
    html += '<div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px;">Végső Hely. | Versenyző Neve</div>';
    html += '<div class="kata-beviteli-mezok" style="justify-content: center; gap: 5px;">';
    html += '<span style="width: 3rem; text-align:center;">B1</span><span style="width: 3rem; text-align:center;">B2</span><span style="width: 3rem; text-align:center;">B3</span><span style="width: 3rem; text-align:center;">B4</span><span style="width: 3rem; text-align:center;">B5</span>';
    html += '</div>';
    html += '<div style="width: 60px; text-align: right; font-weight: 900; color: #ca8a04;">DÖNTŐ</div>';
    html += '</div>';

    // Döntő Sorok
    for (var m = 0; m < dontosok.length; m++) {
        var adatDonto = dontosok[m];
        var vDonto = adatDonto.versenyzo;
        var helyDonto = adatDonto.helyezesDonto; 
        
        var sorStilusDonto = "border-bottom: 1px solid #e5e7eb;";
        var nevStilusDonto = "";

        // Csak akkor kap érmes színezést, ha már kapott döntős pontot!
        if (adatDonto.osszpontDonto > 0) {
            if (helyDonto === 1) { nevStilusDonto = "color: #ca8a04; font-weight: 900;"; sorStilusDonto += " background-color: #fefce8;"; } // Arany
            else if (helyDonto === 2) { nevStilusDonto = "color: #64748b; font-weight: 900;"; sorStilusDonto += " background-color: #f8fafc;"; } // Ezüst
            else if (helyDonto === 3) { nevStilusDonto = "color: #b45309; font-weight: 900;"; sorStilusDonto += " background-color: #fff7ed;"; } // Bronz
        }

        // Vágóvonal az 1. helyezett alatt (aki a fordított sorrend miatt legalul van!)
        if (helyDonto === 1) {
            sorStilusDonto += " border-bottom: 3px dashed #ca8a04;";
        }

        html += '<div class="kata-sor" style="' + sorStilusDonto + '">';
        html += '<div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px; ' + nevStilusDonto + '">';
        html += helyDonto + '. [' + vDonto.id + '] ' + vDonto.nev + ' <span style="font-size: 0.8em; color: #94a3b8;">(1. körös helyezés: ' + adatDonto.helyezes1 + '.)</span></div>';
        
        html += '<div class="kata-beviteli-mezok">';
        for (var bd = 0; bd < 5; bd++) {
            var ertekDonto = adatDonto.pontokDonto[bd] || "";
            var readonlyDonto = szerkeszthetE ? "" : "readonly";
            // A 2. forduló mezői (fordulo = 2)
            html += '<input type="number" step="0.1" min="5.0" max="8.5" class="score-input score-input-2" ';
            html += 'value="' + ertekDonto + '" ' + readonlyDonto + ' ';
            html += 'oninput="okosKataPontBeiras(this, \'' + kivalasztottKategoria + '\', \'' + vDonto.id + '\', ' + bd + ', 2)" ';
            html += 'onblur="veglegesitMezot(this, \'' + kivalasztottKategoria + '\', \'' + vDonto.id + '\', ' + bd + ', 2)">';
        }
        html += '</div>';
        
        html += '<div style="width: 60px; text-align: right; font-weight: 900; font-size: 1.2rem; color: #0f172a;">' + adatDonto.osszpontDonto.toFixed(1) + '</div>';
        html += '</div>';
    }
    html += '</div>';

    tartalom.innerHTML = html;
}

// 3. VILLÁM-KÖNYVELÉS (1. ÉS 2. FORDULÓRA IS)
function okosKataPontBeiras(mezo, kategoria, versenyzoId, biroIndex, fordulo) {
    mezo.value = mezo.value.replace(',', '.');
    var szoveg = mezo.value;

    if (szoveg.length === 2 && !szoveg.includes('.')) {
        var szam = parseInt(szoveg);
        mezo.value = (szam / 10).toFixed(1); 
    }

    if (mezo.value.length === 3) {
        var veglegesPont = parseFloat(mezo.value);
        if (veglegesPont < 5.0) veglegesPont = 5.0;
        if (veglegesPont > 8.5) veglegesPont = 8.5;
        
        mezo.value = veglegesPont.toFixed(1);
        
        // Megkeressük a versenyző pontos helyét a memóriában az ID alapján (Bugmentesítés)
        var valosIndex = adatok.kata[kategoria].findIndex(function(item) { return String(item.versenyzo.id) === String(versenyzoId); });
        if (valosIndex === -1) return;

        if (fordulo === 1) {
            adatok.kata[kategoria][valosIndex].pontok[biroIndex] = veglegesPont.toFixed(1);
        } else {
            adatok.kata[kategoria][valosIndex].pontokDonto[biroIndex] = veglegesPont.toFixed(1);
        }

        // Automatikus ugrás (Csak az aktuális forduló inputjait nézi, hogy ne ugorjon át a Döntőbe véletlenül!)
        var osztaly = '.score-input-' + fordulo;
        var osszesMezo = Array.from(document.querySelectorAll(osztaly));
        var index = osszesMezo.indexOf(mezo);
        
        if (index > -1 && index < osszesMezo.length - 1) {
            osszesMezo[index + 1].focus(); 
            setTimeout(function() { osszesMezo[index + 1].select(); }, 10);
        } else {
            mezo.blur(); 
        }

        szamolKataEredmeny(kategoria, valosIndex, fordulo);
    }
}

function veglegesitMezot(mezo, kategoria, versenyzoId, biroIndex, fordulo) {
    if (mezo.value !== "") {
        var veglegesPont = parseFloat(mezo.value);
        var valosIndex = adatok.kata[kategoria].findIndex(function(item) { return String(item.versenyzo.id) === String(versenyzoId); });
        if (valosIndex === -1) return;

        if (isNaN(veglegesPont)) {
            mezo.value = "";
            if (fordulo === 1) adatok.kata[kategoria][valosIndex].pontok[biroIndex] = "";
            else adatok.kata[kategoria][valosIndex].pontokDonto[biroIndex] = "";
        } else {
            if (veglegesPont < 5.0) veglegesPont = 5.0;
            if (veglegesPont > 8.5) veglegesPont = 8.5;
            mezo.value = veglegesPont.toFixed(1);
            if (fordulo === 1) adatok.kata[kategoria][valosIndex].pontok[biroIndex] = veglegesPont.toFixed(1);
            else adatok.kata[kategoria][valosIndex].pontokDonto[biroIndex] = veglegesPont.toFixed(1);
        }
        szamolKataEredmeny(kategoria, valosIndex, fordulo);
    }
}

// 4. WKF MATEMATIKA
function szamolKataEredmeny(kategoria, versenyzoIndex, fordulo) {
    var pontok = (fordulo === 1) ? adatok.kata[kategoria][versenyzoIndex].pontok : adatok.kata[kategoria][versenyzoIndex].pontokDonto;
    var szamok = [];
    
    for (var i = 0; i < pontok.length; i++) {
        if (pontok[i] !== "") szamok.push(parseFloat(pontok[i]));
    }

    var osszeg = 0;
    if (szamok.length === 5) {
        szamok.sort(function(a, b){return a - b});
        osszeg = szamok[1] + szamok[2] + szamok[3]; // Eldobjuk a legkisebbet és legnagyobbat
    } else {
        for (var j = 0; j < szamok.length; j++) { osszeg += szamok[j]; }
    }

    if (fordulo === 1) adatok.kata[kategoria][versenyzoIndex].osszpont = osszeg;
    else adatok.kata[kategoria][versenyzoIndex].osszpontDonto = osszeg;
    
    localStorage.setItem('iko_kata_db', JSON.stringify(adatok.kata));

    if (window.kataTimeout) clearTimeout(window.kataTimeout);
    window.kataTimeout = setTimeout(function() {
        if (szamok.length === 5) {
            rajzolKata();
        }
    }, 500);
}

// Visszatöltés a memóriából
window.addEventListener('DOMContentLoaded', function() {
    var mentettKata = localStorage.getItem('iko_kata_db');
    if (mentettKata !== null) {
        if (!adatok.kata) adatok.kata = {};
        adatok.kata = JSON.parse(mentettKata);
    }
});