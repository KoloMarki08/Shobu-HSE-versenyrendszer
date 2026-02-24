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
                // Itt menti el a böngésző az új, adatbázisból jövő adatokat (pl. klub nevét)
                localStorage.setItem("shobu_bejelentkezve", JSON.stringify(szerverValasz.felhasznalo));
                window.location.href = "verseny.html?tab=kategoriak";
            } else {
                alert("Hibás felhasználónév vagy jelszó az adatbázisban!");
            }
        })
        .catch(function (hiba) {
            console.error("Nincs PHP szerver válasz!", hiba);
        });
}

function belepesKozonsegkent(celFul) {
    var vendeg = { felhasznalonev: 'kozonseg', jelszo: '', szerepkor: 'guest', nev: 'Néző (Közönség)', klub: '-' };
    localStorage.setItem("shobu_bejelentkezve", JSON.stringify(vendeg));
    window.location.href = "verseny.html?tab=" + celFul;
}

function ellenorizBejelentkezestVersenyOldalon() {
    var mentettEmberSzoveg = localStorage.getItem("shobu_bejelentkezve");
    if (mentettEmberSzoveg === null) { window.location.href = "index.html"; return; }

    aktualisFelhasznalo = JSON.parse(mentettEmberSzoveg);
    document.getElementById("user-badge").innerText = aktualisFelhasznalo.nev;

    var dojoMezo = document.getElementById("p-dojo");

    if (aktualisFelhasznalo.szerepkor === "admin") {
        if (document.getElementById("admin-controls")) document.getElementById("admin-controls").classList.remove("hidden");
        if (document.getElementById("nav-reg")) document.getElementById("nav-reg").classList.remove("hidden");
        if (dojoMezo) {
            dojoMezo.disabled = false;
        }
    } else if (aktualisFelhasznalo.szerepkor === "coach") {
        if (document.getElementById("nav-reg")) document.getElementById("nav-reg").classList.remove("hidden");
        // ITT TÖLTI KI AUTOMATIKUSAN A KLUBOT ÉS TILTJA LE A MEZŐT!
        if (dojoMezo) {
            dojoMezo.value = aktualisFelhasznalo.klub;
            dojoMezo.disabled = true;
        }
    } else if (aktualisFelhasznalo.szerepkor === "guest") {
        if (document.getElementById("nav-reg")) document.getElementById("nav-reg").classList.add("hidden");
        if (document.getElementById("admin-controls")) document.getElementById("admin-controls").classList.add("hidden");
    }

    if (typeof letoltVersenyzoketABazisbol === "function") letoltVersenyzoketABazisbol();
    if (typeof letoltKategoriakatABazisbol === "function") letoltKategoriakatABazisbol();

    if (typeof letoltAllapotABazisbol === "function") {
        letoltAllapotABazisbol();
        if (aktualisFelhasznalo.szerepkor === "guest") { setInterval(letoltAllapotABazisbol, 5000); }
    }

    const urlParams = new URLSearchParams(window.location.search);
    valtFul(urlParams.get('tab') || 'kategoriak');
}

function kijelentkezesVersenybol() {
    localStorage.removeItem("shobu_bejelentkezve");
    window.location.href = "index.html";
}

function valtFul(fulId) {
    var osszesSection = document.querySelectorAll("section");
    for (var i = 0; i < osszesSection.length; i++) osszesSection[i].classList.add("hidden");
    var aktivSection = document.getElementById("tab-" + fulId);
    if (aktivSection) aktivSection.classList.remove("hidden");

    if (fulId === "bracket" && typeof rajzolAgrajz === "function") rajzolAgrajz();
    if (fulId === "kata" && typeof rajzolKata === "function") rajzolKata();
    if (fulId === "eredmenyek" && typeof mutasdEredmenyeket === "function") mutasdEredmenyeket();
}