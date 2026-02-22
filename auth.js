/* AUTH.js - Belépés és Két oldalas rendszer kezelése (PHP/MySQL) */

function bejelentkezesKezdolaprol() {
    var beirtNev = document.getElementById("login-user").value;
    var beirtJelszo = document.getElementById("login-pass").value;
    var belepoAdatok = { felhasznalonev: beirtNev, jelszo: beirtJelszo };

    fetch('api.php?akcio=belepes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(belepoAdatok)
    })
        .then(function (valasz) { return valasz.json(); })
        .then(function (szerverValasz) {
            if (szerverValasz.sikeres === true) {
                localStorage.setItem("shobu_bejelentkezve", JSON.stringify(szerverValasz.felhasznalo));
                window.location.href = "verseny.html?tab=kategoriak";
            } else {
                alert("Hibás felhasználónév vagy jelszó az adatbázisban!");
            }
        })
        .catch(function (hiba) {
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
                localStorage.setItem("shobu_bejelentkezve", JSON.stringify(talaltFelhasznalo));
                window.location.href = "verseny.html?tab=kategoriak";
            } else {
                alert("Hibás felhasználónév vagy jelszó!");
            }
        });
}

// ÚJ: KÖZÖNSÉG PANEL BELÉPTETÉS
function belepesKozonsegkent(celFul) {
    var vendeg = { felhasznalonev: 'kozonseg', jelszo: '', szerepkor: 'guest', nev: 'Néző (Közönség)', klub: '-' };
    localStorage.setItem("shobu_bejelentkezve", JSON.stringify(vendeg));
    window.location.href = "verseny.html?tab=" + celFul;
}

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
        if (document.getElementById("p-dojo")) {
            document.getElementById("p-dojo").disabled = false;
            document.getElementById("p-dojo").value = aktualisFelhasznalo.klub;
        }
    } else if (aktualisFelhasznalo.szerepkor === "coach") {
        document.getElementById("nav-reg").classList.remove("hidden");
        if (document.getElementById("p-dojo")) {
            document.getElementById("p-dojo").value = aktualisFelhasznalo.klub;
            document.getElementById("p-dojo").disabled = true;
        }
    } else if (aktualisFelhasznalo.szerepkor === "guest") {
        if (document.getElementById("nav-reg")) document.getElementById("nav-reg").classList.add("hidden");
        if (document.getElementById("admin-controls")) document.getElementById("admin-controls").classList.add("hidden");
    }

    if (typeof letoltVersenyzoketABazisbol === "function") letoltVersenyzoketABazisbol();
    if (typeof letoltKategoriakatABazisbol === "function") letoltKategoriakatABazisbol();

    // URL PARAMÉTER ALAPJÁN UGRÁS A FÜLRE
    const urlParams = new URLSearchParams(window.location.search);
    const tabToOpen = urlParams.get('tab') || 'kategoriak';
    valtFul(tabToOpen);
}

function kijelentkezesVersenybol() {
    localStorage.removeItem("shobu_bejelentkezve");
    window.location.href = "index.html";
}

function valtFul(fulId) {
    var osszesSection = document.querySelectorAll("section");
    for (var i = 0; i < osszesSection.length; i++) {
        osszesSection[i].classList.add("hidden");
    }

    var aktivSection = document.getElementById("tab-" + fulId);
    if (aktivSection) aktivSection.classList.remove("hidden");

    if (fulId === "bracket" && typeof rajzolAgrajz === "function") rajzolAgrajz();
    if (fulId === "kata" && typeof rajzolKata === "function") rajzolKata();
    if (fulId === "eredmenyek" && typeof mutasdEredmenyeket === "function") mutasdEredmenyeket();
}