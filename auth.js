/* AUTH.js - Belépés és Két oldalas rendszer kezelése (PHP/MySQL kompatibilis!) */

// Ezt a függvényt hívja az index.html a zöld gombbal!
function bejelentkezesKezdolaprol() {
    var beirtNev = document.getElementById("login-user").value;
    var beirtJelszo = document.getElementById("login-pass").value;

    // 1. LÉPÉS: Megpróbálunk a MySQL-ből belépni az api.php segítségével
    var belepoAdatok = { felhasznalonev: beirtNev, jelszo: beirtJelszo };

    fetch('api.php?akcio=belepes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(belepoAdatok)
    })
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(szerverValasz) {
        // Ha a PHP azt mondja, hogy létezik a felhasználó a MySQL-ben
        if (szerverValasz.sikeres === true) {
            var szoveg = JSON.stringify(szerverValasz.felhasznalo);
            localStorage.setItem("shobu_bejelentkezve", szoveg);
            window.location.href = "verseny.html";
        } else {
            alert("Hibás felhasználónév vagy jelszó az adatbázisban!");
        }
    })
    .catch(function(hiba) {
        // 2. LÉPÉS (JUNIOR TRÜKK!): 
        // Ha hiba van (pl. GitHubon vagyunk, ahol nincs PHP szerver), 
        // nem fagyunk le, hanem használjuk a régi, beégetett FELHASZNALOK tömböt!
        console.log("Nincs PHP szerver! Vészhelyzeti belépés a teszt adatokkal...");

        var talaltFelhasznalo = null;

        for (var i = 0; i < FELHASZNALOK.length; i++) {
            var ember = FELHASZNALOK[i];
            if (ember.felhasznalonev === beirtNev && ember.jelszo === beirtJelszo) {
                talaltFelhasznalo = ember;
                break;
            }
        }

        if (talaltFelhasznalo !== null) {
            var szoveg = JSON.stringify(talaltFelhasznalo);
            localStorage.setItem("shobu_bejelentkezve", szoveg);
            window.location.href = "verseny.html";
        } else {
            alert("Hibás felhasználónév vagy jelszó!");
        }
    });
}

// Ezt a függvényt hívjuk meg a verseny.html betöltésekor
function ellenorizBejelentkezestVersenyOldalon() {
    var mentettEmberSzoveg = localStorage.getItem("shobu_bejelentkezve");
    
    if (mentettEmberSzoveg === null) {
        alert("Előbb be kell jelentkezned!");
        window.location.href = "index.html";
        return;
    }

    aktualisFelhasznalo = JSON.parse(mentettEmberSzoveg);
    document.getElementById("user-badge").innerText = aktualisFelhasznalo.nev;

    if (aktualisFelhasznalo.szerepkor === "admin") {
        document.getElementById("admin-controls").classList.remove("hidden");
        document.getElementById("nav-reg").classList.remove("hidden");
        document.getElementById("p-dojo").disabled = false;
        document.getElementById("p-dojo").value = aktualisFelhasznalo.klub;
    } else if (aktualisFelhasznalo.szerepkor === "coach") {
        document.getElementById("nav-reg").classList.remove("hidden");
        document.getElementById("p-dojo").value = aktualisFelhasznalo.klub;
        document.getElementById("p-dojo").disabled = true; 
    }

    // JAVÍTÁS: Itt a sima "rajzolVersenyzokListajat()" helyett rászólunk a data.js-re,
    // hogy kérje le a MySQL-ből a legfrissebb neveket! (Ami aztán kirajzolja a listát is).
    if (typeof letoltVersenyzoketABazisbol === "function") {
        letoltVersenyzoketABazisbol();
    } else {
        rajzolVersenyzokListajat(); // Védelem, ha valamiért nem töltött be a data.js
    }
    
    // Kirajzoljuk a Tatami táblázatot!
    rajzolKategoriakTablazatot(); 

    // Alapértelmezetten a Kategóriák fület mutatjuk belépés után
    valtFul('kategoriak');
}

function kijelentkezesVersenybol() {
    localStorage.removeItem("shobu_bejelentkezve");
    window.location.href = "index.html";
}

// FÜL VÁLTÁS (Kategóriák, Nevezés, Ágrajz, Kata)
function valtFul(fulId) {
    var osszesSection = document.querySelectorAll("section");
    for (var i = 0; i < osszesSection.length; i++) {
        osszesSection[i].classList.add("hidden");
    }

    var aktivSection = document.getElementById("tab-" + fulId);
    if (aktivSection) {
        aktivSection.classList.remove("hidden");
    }

    if (fulId === "bracket" && typeof rajzolAgrajz === "function") rajzolAgrajz();
    if (fulId === "kata" && typeof rajzolKata === "function") rajzolKata();
}