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
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(szerverValasz) {
        if (szerverValasz.sikeres === true) {
            var szoveg = JSON.stringify(szerverValasz.felhasznalo);
            localStorage.setItem("shobu_bejelentkezve", szoveg);
            window.location.href = "verseny.html";
        } else {
            alert("Hibás felhasználónév vagy jelszó az adatbázisban!");
        }
    })
    .catch(function(hiba) {
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

    if (typeof letoltVersenyzoketABazisbol === "function") {
        letoltVersenyzoketABazisbol();
    }
    
    // EZ A LÉNYEG: Kéri a kategóriákat a MySQL-ből (aztán meg is rajzolja a táblát)
    if (typeof letoltKategoriakatABazisbol === "function") {
        letoltKategoriakatABazisbol();
    } 

    valtFul('kategoriak');
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
    if (aktivSection) {
        aktivSection.classList.remove("hidden");
    }

    if (fulId === "bracket" && typeof rajzolAgrajz === "function") rajzolAgrajz();
    if (fulId === "kata" && typeof rajzolKata === "function") rajzolKata();
}