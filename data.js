// ==========================================
// 1. ADATBÁZIS: KATEGÓRIÁK ÉS TATAMIK (MYSQL-BŐL)
// ==========================================
var OSSZES_KATEGORIA = [];

function letoltKategoriakatABazisbol() {
    fetch('api.php?akcio=kategoriakLekerdezese', { cache: 'no-store' })
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(szerverAdatok) {
        OSSZES_KATEGORIA = szerverAdatok; 
        if (typeof rajzolKategoriakTablazatot === "function") {
            rajzolKategoriakTablazatot();
        }
    })
    .catch(function(hiba) {
        console.error("Hiba a kategóriák letöltésekor:", hiba);
    });
}

// ==========================================
// 2. FELHASZNÁLÓK (Offline Demóhoz)
// ==========================================
const FELHASZNALOK = [
    { felhasznalonev: 'KoloMarki', jelszo: '1234', szerepkor: 'admin', klub: 'admin', nev: 'Admin' },
    { felhasznalonev: 'A tatami', jelszo: 'A-tatami', szerepkor: 'judge', klub: '-', nev: 'A_Tatami' },
    { felhasznalonev: 'Balint.Tornai', jelszo: '1234', szerepkor: 'coach', klub: 'Vácrátóti HSE', nev: 'Tornai Balint' }
];

// ==========================================
// 3. GLOBÁLIS VÁLTOZÓK
// ==========================================
var adatok = { versenyzok: [], meccsek: [] };
var aktualisFelhasznalo = null; 

// ==========================================
// 4. SEGÉDFÜGGVÉNYEK (PHP/MySQL)
// ==========================================
function letoltVersenyzoketABazisbol() {
    fetch('api.php?akcio=lekerdezes', { cache: 'no-store' })
    .then(function(valasz) {
        return valasz.json();
    })
    .then(function(szerverAdatok) {
        adatok.versenyzok = szerverAdatok; 
        rajzolVersenyzokListajat(); 
    })
    .catch(function(hiba) {
        console.error("Adatbázis hiba:", hiba);
    });
}

function toroljMindent() { 
    var biztos = confirm("Mindent törölsz a MySQL adatbázisból ÉS az ágrajzokból? Ez nem visszavonható!");
    if(biztos === true) { 
        fetch('api.php?akcio=torles', { method: 'POST' })
        .then(function(valasz) { return valasz.json(); })
        .then(function(eredmeny) {
            if (eredmeny.hiba) {
                alert("HIBA: " + eredmeny.hiba);
            } else {
                alert(eredmeny.uzenet); 
            }
            befejezTeljesTorlest();
        })
        .catch(function(hiba) {
            console.error("Szerver hiba:", hiba);
            befejezTeljesTorlest();
        });
    } 
}

function befejezTeljesTorlest() {
    localStorage.removeItem('iko_db');
    localStorage.removeItem('iko_kata_db');
    letoltVersenyzoketABazisbol();
    valtFul('kategoriak');
    document.getElementById('player-list').innerHTML = "";
    if (document.getElementById('bracket-view')) document.getElementById('bracket-view').innerHTML = "";
    if (document.getElementById('kata-content')) document.getElementById('kata-content').innerHTML = "";
}

// ==========================================
// 5. NEVEZÉS LOGIKA ÉS KÉPERNYŐ RAJZOLÁS
// ==========================================
function frissitKategoriaLegordulot() {
    var nemValaszto = document.getElementById("p-gender");
    var korBevitel = document.getElementById("p-age");
    var kategoriaValaszto = document.getElementById("p-cat");

    var kivalasztottNem = nemValaszto.value;
    var beirtKor = parseInt(korBevitel.value);
    kategoriaValaszto.innerHTML = "";

    if (kivalasztottNem === "" || isNaN(beirtKor) === true) return;

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

    fetch('api.php?akcio=ujNevezes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujVersenyzo)
    })
    .then(function(valasz) { return valasz.json(); })
    .then(function(eredmeny) {
        letoltVersenyzoketABazisbol();
        nevDoboz.value = "";
    })
    .catch(function(hiba) {
        alert("Szerver hiba (Nem fut a XAMPP?)");
        console.error(hiba);
    });
}

function rajzolVersenyzokListajat() {
    var listaElem = document.getElementById("player-list");
    listaElem.innerHTML = ""; 

    if (aktualisFelhasznalo === null || adatok.versenyzok === undefined) return;

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
        var htmlDarab = '<li style="border-bottom: 1px solid #ccc; padding: 5px; display: flex; justify-content: space-between; font-size: 14px;">';
        htmlDarab += '<span><b>' + mutatasraVaroEmber.nev + '</b> (' + mutatasraVaroEmber.klub + ')</span>';
        htmlDarab += '<span style="color: #CE1126; font-weight: bold;">' + mutatasraVaroEmber.kategoria + '</span>';
        htmlDarab += '</li>';
        listaElem.innerHTML += htmlDarab;
    }
}

function rajzolKategoriakTablazatot() {
    var tablaTorzs = document.getElementById("kategoria-tabla-torzs");
    if (tablaTorzs === null) return; 

    tablaTorzs.innerHTML = ""; 

    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var kategoria = OSSZES_KATEGORIA[i];
        var tatamiNeve = kategoria.tatami;
        
        if (tatamiNeve === null || tatamiNeve === undefined || tatamiNeve === "") {
            tatamiNeve = "<span style='color: #9ca3af; font-style: italic;'>Még nincs beosztva</span>";
        }

        var sorHtml = '<tr>';
        sorHtml += '<td class="kategoria-tabla-cella">' + kategoria.nev + '</td>';
        sorHtml += '<td class="kategoria-tabla-cella">' + tatamiNeve + '</td>';
        sorHtml += '</tr>';
        tablaTorzs.innerHTML += sorHtml;
    }
}