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
    
    // Lekérjük a menügombokat a HTML-ből
    var navReg = document.getElementById("nav-reg");
    var adminControls = document.getElementById("admin-controls");
    var navKata = document.getElementById("nav-kata"); 
    var navBracket = document.getElementById("nav-bracket");

    // JOGOSULTSÁGOK BEÁLLÍTÁSA
    if (aktualisFelhasznalo.szerepkor === "admin") {
        if(adminControls) adminControls.classList.remove("hidden");
        if(navReg) navReg.classList.remove("hidden");
        if(navKata) navKata.classList.remove("hidden");
        if(navBracket) navBracket.classList.remove("hidden");
        if(dojoMezo) dojoMezo.disabled = false;
    } 
    else if (aktualisFelhasznalo.szerepkor === "judge") { // Bíró látja a paneleket, de nem nevezhet
        if(adminControls) adminControls.classList.add("hidden");
        if(navReg) navReg.classList.add("hidden");
        if(navKata) navKata.classList.remove("hidden");
        if(navBracket) navBracket.classList.remove("hidden");
    }
    else if (aktualisFelhasznalo.szerepkor === "coach") {
        if(adminControls) adminControls.classList.add("hidden");
        if(navReg) navReg.classList.remove("hidden");
        if(navKata) navKata.classList.add("hidden"); // Edző elől ELREJTVE
        if(navBracket) navBracket.classList.add("hidden"); // Edző elől ELREJTVE
        if(dojoMezo) { dojoMezo.value = aktualisFelhasznalo.klub; dojoMezo.disabled = true; }
    } 
    else if (aktualisFelhasznalo.szerepkor === "guest") {
        if(adminControls) adminControls.classList.add("hidden");
        if(navReg) navReg.classList.add("hidden");
        if(navKata) navKata.classList.add("hidden"); // Néző elől ELREJTVE
        if(navBracket) navBracket.classList.add("hidden"); // Néző elől ELREJTVE
    }

    // Adatok betöltése
    if (typeof letoltVersenyzoketABazisbol === "function") letoltVersenyzoketABazisbol();
    if (typeof letoltKategoriakatABazisbol === "function") letoltKategoriakatABazisbol();
    
    if (typeof letoltAllapotABazisbol === "function") {
        letoltAllapotABazisbol();
        if (aktualisFelhasznalo.szerepkor === "guest") { setInterval(letoltAllapotABazisbol, 5000); }
    }

    const urlParams = new URLSearchParams(window.location.search);
    var celFul = urlParams.get('tab') || 'kategoriak';
    
    // BIZTONSÁGI VÉDELEM: Ha egy edző vagy néző trükközne az URL-lel (?tab=kata), átdobjuk a kategóriákra!
    if ((aktualisFelhasznalo.szerepkor === "coach" || aktualisFelhasznalo.szerepkor === "guest") && 
        (celFul === "kata" || celFul === "bracket")) {
        celFul = "kategoriak";
    }
    
    valtFul(celFul);
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