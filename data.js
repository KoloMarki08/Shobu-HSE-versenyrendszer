// ==========================================
// 1. ADATBÁZIS: KATEGÓRIÁK ÉS TATAMIK
// ==========================================
const OSSZES_KATEGORIA = [
    // --- KUMITE (LÁNYOK) ---
    { nev: "Kumite Girls 8-9 y.o. -25kg", tipus: "KUMITE", nem: "Girls", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 8-9 y.o. -30kg", tipus: "KUMITE", nem: "Girls", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 8-9 y.o. +30kg", tipus: "KUMITE", nem: "Girls", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 10-11 y.o. -30kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 10-11 y.o. -35kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 10-11 y.o. -40kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 10-11 y.o. -45kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 10-11 y.o. +45kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 12-13 y.o. -40kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 12-13 y.o. -45kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 12-13 y.o. -50kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 12-13 y.o. +50kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 14-15 y.o. -50kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 14-15 y.o. -55kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 14-15 y.o. -60kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 14-15 y.o. +60kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Girls 16-17 y.o. -50kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Girls 16-17 y.o. -55kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Girls 16-17 y.o. -60kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Girls 16-17 y.o. -65kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Girls 16-17 y.o. +65kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 18+ y.o. Open", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 18+ y.o. -55kg", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 18+ y.o. -65kg", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 18+ y.o. +65kg", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 35+ y.o. -55kg", tipus: "KUMITE", nem: "Women", minKor: 35, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 35+ y.o. -65kg", tipus: "KUMITE", nem: "Women", minKor: 35, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Women 35+ y.o. +65kg", tipus: "KUMITE", nem: "Women", minKor: 35, maxKor: 99, tatami: "Tatami B - Kumite" },

    // --- KUMITE (FIÚK) ---
    { nev: "Kumite Boys 8-9 y.o. -25kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 8-9 y.o. -30kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 8-9 y.o. -35kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 8-9 y.o. +35kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 10-11 y.o. -30kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 10-11 y.o. -35kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 10-11 y.o. -40kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 10-11 y.o. -45kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 10-11 y.o. +45kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 12-13 y.o. -40kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 12-13 y.o. -45kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 12-13 y.o. -50kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 12-13 y.o. -55kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 12-13 y.o. +55kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. -50kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. -55kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. -60kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. -65kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. -70kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. -75kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 14-15 y.o. +75kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. -55kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. -60kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. -65kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. -70kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. -75kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. -80kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Boys 16-17 y.o. +80kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 18+ y.o. Open", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 18+ y.o. -60kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 18+ y.o. -70kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 18+ y.o. -80kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 18+ y.o. -90kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 18+ y.o. +90kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 35-44 y.o. -75kg", tipus: "KUMITE", nem: "Men", minKor: 35, maxKor: 44, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 35-44 y.o. -85kg", tipus: "KUMITE", nem: "Men", minKor: 35, maxKor: 44, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 35-44 y.o. +85kg", tipus: "KUMITE", nem: "Men", minKor: 35, maxKor: 44, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 45+ y.o. -75kg", tipus: "KUMITE", nem: "Men", minKor: 45, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 45+ y.o. -85kg", tipus: "KUMITE", nem: "Men", minKor: 45, maxKor: 99, tatami: "Tatami B - Kumite" },
    { nev: "Kumite Men 45+ y.o. +85kg", tipus: "KUMITE", nem: "Men", minKor: 45, maxKor: 99, tatami: "Tatami B - Kumite" },

    // --- KATA (LÁNYOK) ---
    { nev: "Kata Girls 8-9 y.o.", tipus: "KATA", nem: "Girls", minKor: 8, maxKor: 9, tatami: "Tatami C - Kata" },
    { nev: "Kata Girls 10-11 y.o.", tipus: "KATA", nem: "Girls", minKor: 10, maxKor: 11, tatami: "Tatami C - Kata" },
    { nev: "Kata Girls 12-13 y.o.", tipus: "KATA", nem: "Girls", minKor: 12, maxKor: 13, tatami: "Tatami C - Kata" },
    { nev: "Kata Girls 14-15 y.o.", tipus: "KATA", nem: "Girls", minKor: 14, maxKor: 15, tatami: "Tatami A - Kata" },
    { nev: "Kata Girls 16-17 y.o.", tipus: "KATA", nem: "Girls", minKor: 16, maxKor: 17, tatami: "Tatami B - Kata" },
    { nev: "Kata Women 18-34 y.o.", tipus: "KATA", nem: "Women", minKor: 18, maxKor: 34, tatami: "Tatami B - Kata" },
    { nev: "Kata Women 35-49 y.o.", tipus: "KATA", nem: "Women", minKor: 35, maxKor: 49, tatami: "Tatami A - Kata" },
    { nev: "Kata Women 50+ y.o.", tipus: "KATA", nem: "Women", minKor: 50, maxKor: 99, tatami: "Tatami A - Kata" },

    // --- KATA (FIÚK) ---
    { nev: "Kata Boys 8-9 y.o.", tipus: "KATA", nem: "Boys", minKor: 8, maxKor: 9, tatami: "Tatami C - Kata" },
    { nev: "Kata Boys 10-11 y.o.", tipus: "KATA", nem: "Boys", minKor: 10, maxKor: 11, tatami: "Tatami C - Kata" },
    { nev: "Kata Boys 12-13 y.o.", tipus: "KATA", nem: "Boys", minKor: 12, maxKor: 13, tatami: "Tatami C - Kata" },
    { nev: "Kata Boys 14-15 y.o.", tipus: "KATA", nem: "Boys", minKor: 14, maxKor: 15, tatami: "Tatami A - Kata" },
    { nev: "Kata Boys 16-17 y.o.", tipus: "KATA", nem: "Boys", minKor: 16, maxKor: 17, tatami: "Tatami B - Kata" },
    { nev: "Kata Men 18-34 y.o.", tipus: "KATA", nem: "Men", minKor: 18, maxKor: 34, tatami: "Tatami B - Kata" },
    { nev: "Kata Men 35-49 y.o.", tipus: "KATA", nem: "Men", minKor: 35, maxKor: 49, tatami: "Tatami A - Kata" },
    { nev: "Kata Men 50+ y.o.", tipus: "KATA", nem: "Men", minKor: 50, maxKor: 99, tatami: "Tatami A - Kata" }
];

// ==========================================
// 2. FELHASZNÁLÓK (Ezek maradnak teszthez, de a PHP is adhatja majd)
// ==========================================
const FELHASZNALOK = [
    { felhasznalonev: 'KoloMarki', jelszo: '1234', szerepkor: 'admin', klub: 'admin', nev: 'Admin' },
    { felhasznalonev: 'A tatami', jelszo: 'A-tatami', szerepkor: 'judge', klub: '-', nev: 'A_Tatami' },
    { felhasznalonev: 'Balint.Tornai', jelszo: '1234', szerepkor: 'coach', klub: 'Vácrátóti HSE', nev: 'Tornai Balint' }
];

// ==========================================
// 3. GLOBÁLIS VÁLTOZÓK
// ==========================================
var adatok = { 
    versenyzok: [], 
    meccsek: [] 
};
var aktualisFelhasznalo = null; 

// ==========================================
// 4. SEGÉDFÜGGVÉNYEK (PHP/MySQL VERZIÓ!)
// ==========================================

// Ez kéri le a nevezetteket a MySQL-ből (Pincér -> Szakács -> Pincér)
function letoltVersenyzoketABazisbol() {
    fetch('api.php?akcio=lekerdezes')
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(szerverAdatok) {
        adatok.versenyzok = szerverAdatok; 
        rajzolVersenyzokListajat(); 
    })
    .catch(function(hiba) {
        console.error("Adatbázis hiba (Lehet, hogy nincs bekapcsolva a XAMPP):", hiba);
        // Ha nincs adatbázis (pl. GitHubon vagyunk), marad az üres tömb
    });
}

function toroljMindent() { 
    var biztos = confirm("Mindent törölsz a MySQL adatbázisból? Ez nem visszavonható!");
    if(biztos === true) { 
        fetch('api.php?akcio=torles', { method: 'POST' })
        .then(function() {
            location.reload(); 
        });
    } 
}

// ==========================================
// 5. NEVEZÉS LOGIKA
// ==========================================

function frissitKategoriaLegordulot() {
    var nemValaszto = document.getElementById("p-gender");
    var korBevitel = document.getElementById("p-age");
    var kategoriaValaszto = document.getElementById("p-cat");

    var kivalasztottNem = nemValaszto.value;
    var beirtKor = parseInt(korBevitel.value);

    kategoriaValaszto.innerHTML = "";

    if (kivalasztottNem === "" || isNaN(beirtKor) === true) {
        return;
    }

    var szurtKategoriak = [];

    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var aktualisKategoria = OSSZES_KATEGORIA[i];
        var joANem = false;
        var joAKor = false;

        if (aktualisKategoria.nem === kivalasztottNem || aktualisKategoria.nem === "Vegyes") {
            joANem = true;
        }

        if (beirtKor >= aktualisKategoria.minKor && beirtKor <= aktualisKategoria.maxKor) {
            joAKor = true;
        }

        if (joANem === true && joAKor === true) {
            szurtKategoriak.push(aktualisKategoria);
        }
    }

    if (szurtKategoriak.length === 0) {
        kategoriaValaszto.innerHTML = "<option>Nincs találat</option>";
        return;
    }

    var kumiteCsoport = document.createElement("optgroup");
    kumiteCsoport.label = "KUMITE";

    var kataCsoport = document.createElement("optgroup");
    kataCsoport.label = "KATA";

    for (var j = 0; j < szurtKategoriak.length; j++) {
        var kategoriaAmiKell = szurtKategoriak[j];
        var ujOpcio = document.createElement("option");
        ujOpcio.value = kategoriaAmiKell.nev;
        ujOpcio.innerText = kategoriaAmiKell.nev;

        if (kategoriaAmiKell.tipus === "KUMITE") {
            kumiteCsoport.appendChild(ujOpcio);
        } else {
            kataCsoport.appendChild(ujOpcio);
        }
    }

    if (kumiteCsoport.children.length > 0) kategoriaValaszto.appendChild(kumiteCsoport);
    if (kataCsoport.children.length > 0) kategoriaValaszto.appendChild(kataCsoport);
}

function hozzaadVersenyzot() {
    var bejelentkezettEmber = aktualisFelhasznalo;

    var vanJoga = false;
    if (bejelentkezettEmber.szerepkor === "admin" || bejelentkezettEmber.szerepkor === "coach") {
        vanJoga = true;
    }

    if (vanJoga === false) {
        alert("Nincs jogod ehhez!");
        return;
    }

    var nevDoboz = document.getElementById("p-name");
    var versenyzoNeve = nevDoboz.value.trim(); 
    var versenyzoDojo = document.getElementById("p-dojo").value;
    var kivalasztottKategoria = document.getElementById("p-cat").value;
    var versenyzoSulya = document.getElementById("p-weight").value;
    var versenyzoKora = document.getElementById("p-age").value;

    if (versenyzoNeve === "" || kivalasztottKategoria === "") {
        alert("Hiányos adatok! Add meg a nevet és a kategóriát is.");
        return;
    }

    var ujVersenyzo = {
        nev: versenyzoNeve,
        klub: versenyzoDojo,
        kategoria: kivalasztottKategoria,
        suly: versenyzoSulya,
        kor: versenyzoKora,
        tulajdonos: bejelentkezettEmber.felhasznalonev  
    };

    // Küldjük az adatot a MySQL-be (a PHP segítségével)
    fetch('api.php?akcio=ujNevezes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujVersenyzo)
    })
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(eredmeny) {
        // Ha sikeres a mentés, azonnal kérjük a friss listát
        letoltVersenyzoketABazisbol();
        nevDoboz.value = "";
    })
    .catch(function(hiba) {
        alert("Szerver hiba (Nem fut a XAMPP?)");
        console.error(hiba);
    });
}

// EZT ÁTÍRTUK A SAJÁT OSZTÁLYNEVEIDRE!
function rajzolVersenyzokListajat() {
    var listaElem = document.getElementById("player-list");
    listaElem.innerHTML = ""; 

    if (aktualisFelhasznalo === null || adatok.versenyzok === undefined) {
        return;
    }

    var miketMutassunk = [];
    var kiVanBent = aktualisFelhasznalo;

    if (kiVanBent.szerepkor === "admin") {
        miketMutassunk = adatok.versenyzok;
    } else {
        for (var i = 0; i < adatok.versenyzok.length; i++) {
            var ember = adatok.versenyzok[i];
            if (ember.tulajdonos === kiVanBent.felhasznalonev) {
                miketMutassunk.push(ember);
            }
        }
    }

    for (var j = 0; j < miketMutassunk.length; j++) {
        var mutatasraVaroEmber = miketMutassunk[j];
        
        // Letisztult HTML kód a saját CSS-ünkkel!
        var htmlDarab = '<li style="border-bottom: 1px solid #ccc; padding: 5px; display: flex; justify-content: space-between; font-size: 14px;">';
        htmlDarab += '<span><b>' + mutatasraVaroEmber.nev + '</b> (' + mutatasraVaroEmber.klub + ')</span>';
        htmlDarab += '<span style="color: red; font-weight: bold;">' + mutatasraVaroEmber.kategoria + '</span>';
        htmlDarab += '</li>';
        
        listaElem.innerHTML += htmlDarab;
    }
}

// ÚJ: Ez rajzolja ki a Kategóriák és Tatamik táblázatot
function rajzolKategoriakTablazatot() {
    var tablaTorzs = document.getElementById("kategoria-tabla-torzs");
    if (tablaTorzs === null) return; 

    tablaTorzs.innerHTML = ""; 

    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var kategoria = OSSZES_KATEGORIA[i];
        
        var tatamiNeve = kategoria.tatami;
        if (tatamiNeve === undefined) {
            tatamiNeve = "Nincs kiosztva";
        }

        // Tiszta HTML, a CSS fájl .táblázat-sor és .táblázat-szoveg osztályaival!
        var sorHtml = '<tr>';
        sorHtml += '<td>' + kategoria.nev + '</td>';
        sorHtml += '<td>' + tatamiNeve + '</td>';
        sorHtml += '</tr>';

        tablaTorzs.innerHTML += sorHtml;
    }
}