// ==========================================
// 1. ADATBÁZIS: KATEGÓRIÁK
// Itt van az összes kategória felsorolva
// ==========================================
const OSSZES_KATEGORIA = [

    // --- KUMITE (LÁNYOK) ---
    { nev: "Kumite Girls 8-9 y.o. -25kg", tipus: "KUMITE", nem: "Girls", minKor: 8, maxKor: 9 },
    { nev: "Kumite Girls 8-9 y.o. -30kg", tipus: "KUMITE", nem: "Girls", minKor: 8, maxKor: 9 },
    { nev: "Kumite Girls 8-9 y.o. +30kg", tipus: "KUMITE", nem: "Girls", minKor: 8, maxKor: 9 },
    { nev: "Kumite Girls 10-11 y.o. -30kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11 },
    { nev: "Kumite Girls 10-11 y.o. -35kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11 },
    { nev: "Kumite Girls 10-11 y.o. -40kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11 },
    { nev: "Kumite Girls 10-11 y.o. -45kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11 },
    { nev: "Kumite Girls 10-11 y.o. +45kg", tipus: "KUMITE", nem: "Girls", minKor: 10, maxKor: 11 },
    { nev: "Kumite Girls 12-13 y.o. -40kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13 },
    { nev: "Kumite Girls 12-13 y.o. -45kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13 },
    { nev: "Kumite Girls 12-13 y.o. -50kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13 },
    { nev: "Kumite Girls 12-13 y.o. +50kg", tipus: "KUMITE", nem: "Girls", minKor: 12, maxKor: 13 },
    { nev: "Kumite Girls 14-15 y.o. -50kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15 },
    { nev: "Kumite Girls 14-15 y.o. -55kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15 },
    { nev: "Kumite Girls 14-15 y.o. -60kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15 },
    { nev: "Kumite Girls 14-15 y.o. +60kg", tipus: "KUMITE", nem: "Girls", minKor: 14, maxKor: 15 },
    { nev: "Kumite Girls 16-17 y.o. -50kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17 },
    { nev: "Kumite Girls 16-17 y.o. -55kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17 },
    { nev: "Kumite Girls 16-17 y.o. -60kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17 },
    { nev: "Kumite Girls 16-17 y.o. -65kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17 },
    { nev: "Kumite Girls 16-17 y.o. +65kg", tipus: "KUMITE", nem: "Girls", minKor: 16, maxKor: 17 },
    { nev: "Kumite Women 18+ y.o. Open", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99 },
    { nev: "Kumite Women 18+ y.o. -55kg", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99 },
    { nev: "Kumite Women 18+ y.o. -65kg", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99 },
    { nev: "Kumite Women 18+ y.o. +65kg", tipus: "KUMITE", nem: "Women", minKor: 18, maxKor: 99 },
    { nev: "Kumite Women 35+ y.o. -55kg", tipus: "KUMITE", nem: "Women", minKor: 35, maxKor: 99 },
    { nev: "Kumite Women 35+ y.o. -65kg", tipus: "KUMITE", nem: "Women", minKor: 35, maxKor: 99 },
    { nev: "Kumite Women 35+ y.o. +65kg", tipus: "KUMITE", nem: "Women", minKor: 35, maxKor: 99 },

    // --- KUMITE (FIÚK) ---
    { nev: "Kumite Boys 8-9 y.o. -25kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9 },
    { nev: "Kumite Boys 8-9 y.o. -30kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9 },
    { nev: "Kumite Boys 8-9 y.o. -35kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9 },
    { nev: "Kumite Boys 8-9 y.o. +35kg", tipus: "KUMITE", nem: "Boys", minKor: 8, maxKor: 9 },
    { nev: "Kumite Boys 10-11 y.o. -30kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11 },
    { nev: "Kumite Boys 10-11 y.o. -35kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11 },
    { nev: "Kumite Boys 10-11 y.o. -40kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11 },
    { nev: "Kumite Boys 10-11 y.o. -45kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11 },
    { nev: "Kumite Boys 10-11 y.o. +45kg", tipus: "KUMITE", nem: "Boys", minKor: 10, maxKor: 11 },
    { nev: "Kumite Boys 12-13 y.o. -40kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13 },
    { nev: "Kumite Boys 12-13 y.o. -45kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13 },
    { nev: "Kumite Boys 12-13 y.o. -50kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13 },
    { nev: "Kumite Boys 12-13 y.o. -55kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13 },
    { nev: "Kumite Boys 12-13 y.o. +55kg", tipus: "KUMITE", nem: "Boys", minKor: 12, maxKor: 13 },
    { nev: "Kumite Boys 14-15 y.o. -50kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 14-15 y.o. -55kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 14-15 y.o. -60kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 14-15 y.o. -65kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 14-15 y.o. -70kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 14-15 y.o. -75kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 14-15 y.o. +75kg", tipus: "KUMITE", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kumite Boys 16-17 y.o. -55kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Boys 16-17 y.o. -60kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Boys 16-17 y.o. -65kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Boys 16-17 y.o. -70kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Boys 16-17 y.o. -75kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Boys 16-17 y.o. -80kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Boys 16-17 y.o. +80kg", tipus: "KUMITE", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kumite Men 18+ y.o. Open", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99 },
    { nev: "Kumite Men 18+ y.o. -60kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99 },
    { nev: "Kumite Men 18+ y.o. -70kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99 },
    { nev: "Kumite Men 18+ y.o. -80kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99 },
    { nev: "Kumite Men 18+ y.o. -90kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99 },
    { nev: "Kumite Men 18+ y.o. +90kg", tipus: "KUMITE", nem: "Men", minKor: 18, maxKor: 99 },
    { nev: "Kumite Men 35-44 y.o. -75kg", tipus: "KUMITE", nem: "Men", minKor: 35, maxKor: 44 },
    { nev: "Kumite Men 35-44 y.o. -85kg", tipus: "KUMITE", nem: "Men", minKor: 35, maxKor: 44 },
    { nev: "Kumite Men 35-44 y.o. +85kg", tipus: "KUMITE", nem: "Men", minKor: 35, maxKor: 44 },
    { nev: "Kumite Men 45+ y.o. -75kg", tipus: "KUMITE", nem: "Men", minKor: 45, maxKor: 99 },
    { nev: "Kumite Men 45+ y.o. -85kg", tipus: "KUMITE", nem: "Men", minKor: 45, maxKor: 99 },
    { nev: "Kumite Men 45+ y.o. +85kg", tipus: "KUMITE", nem: "Men", minKor: 45, maxKor: 99 },

    // --- KATA (LÁNYOK) ---
    { nev: "Kata Girls 8-9 y.o.", tipus: "KATA", nem: "Girls", minKor: 8, maxKor: 9 },
    { nev: "Kata Girls 10-11 y.o.", tipus: "KATA", nem: "Girls", minKor: 10, maxKor: 11 },
    { nev: "Kata Girls 12-13 y.o.", tipus: "KATA", nem: "Girls", minKor: 12, maxKor: 13 },
    { nev: "Kata Girls 14-15 y.o.", tipus: "KATA", nem: "Girls", minKor: 14, maxKor: 15 },
    { nev: "Kata Girls 16-17 y.o.", tipus: "KATA", nem: "Girls", minKor: 16, maxKor: 17 },
    { nev: "Kata Women 18-34 y.o.", tipus: "KATA", nem: "Women", minKor: 18, maxKor: 34 },
    { nev: "Kata Women 35-49 y.o.", tipus: "KATA", nem: "Women", minKor: 35, maxKor: 49 },
    { nev: "Kata Women 50+ y.o.", tipus: "KATA", nem: "Women", minKor: 50, maxKor: 99 },

    // --- KATA (FIÚK) ---
    { nev: "Kata Boys 8-9 y.o.", tipus: "KATA", nem: "Boys", minKor: 8, maxKor: 9 },
    { nev: "Kata Boys 10-11 y.o.", tipus: "KATA", nem: "Boys", minKor: 10, maxKor: 11 },
    { nev: "Kata Boys 12-13 y.o.", tipus: "KATA", nem: "Boys", minKor: 12, maxKor: 13 },
    { nev: "Kata Boys 14-15 y.o.", tipus: "KATA", nem: "Boys", minKor: 14, maxKor: 15 },
    { nev: "Kata Boys 16-17 y.o.", tipus: "KATA", nem: "Boys", minKor: 16, maxKor: 17 },
    { nev: "Kata Men 18-34 y.o.", tipus: "KATA", nem: "Men", minKor: 18, maxKor: 34 },
    { nev: "Kata Men 35-49 y.o.", tipus: "KATA", nem: "Men", minKor: 35, maxKor: 49 },
    { nev: "Kata Men 50+ y.o.", tipus: "KATA", nem: "Men", minKor: 50, maxKor: 99 }

];

// ==========================================
// 2. FELHASZNÁLÓK
// Itt vannak a belépési adatok. Junior megoldás, de működik!
// ==========================================
const FELHASZNALOK = [
    { felhasznalonev: 'KoloMarki', jelszo: '1234', szerepkor: 'admin', klub: 'admin', nev: 'Admin' },
    { felhasznalonev: 'A tatami', jelszo: 'A-tatami', szerepkor: 'judge', klub: '-', nev: 'A_Tatami' },
    { felhasznalonev: 'Balint.Tornai', jelszo: '1234', szerepkor: 'coach', klub: 'Shobu HSE', nev: 'Edző' }
];

// ==========================================
// 3. GLOBÁLIS VÁLTOZÓK
// Fontos: ezeket minden függvényből el kell érni!
// ==========================================
// Megpróbáljuk betölteni a mentett dolgokat. Ha nincs, csinálunk egy üreset.
var adatokSzovegkent = localStorage.getItem('iko_db');
var adatok;

if (adatokSzovegkent === null) {
    // Még nem járt itt senki, üres minden
    adatok = { 
        versenyzok: [], 
        meccsek: [] 
    };
} else {
    // Visszaalakítjuk a szöveget rendes JavaScript objektummá
    adatok = JSON.parse(adatokSzovegkent);
}

// Ide mentjük el, hogy éppen ki van belépve. Kezdetben senki (null).
// JAVÍTÁS: Ennek a neve aktualisFelhasznalo, ezt kell használni mindenhol!
var aktualisFelhasznalo = null; 

// ==========================================
// 4. SEGÉDFÜGGVÉNYEK
// ==========================================
function mentes() { 
    // Átalakítjuk szöveggé és betesszük a böngésző memóriájába
    var szoveg = JSON.stringify(adatok);
    localStorage.setItem('iko_db', szoveg); 
}

function toroljMindent() { 
    var biztos = confirm("Mindent törölsz? Ez nem visszavonható!");
    if(biztos === true) { 
        localStorage.clear(); 
        location.reload(); // Frissíti az oldalt
    } 
}

// ==========================================
// 5. NEVEZÉS LOGIKA
// ==========================================

// Ez frissíti a legördülő listát, amikor beírják a kort vagy a nemet
function frissitKategoriaLegordulot() {
    // Lekérjük a dobozokat
    var nemValaszto = document.getElementById("p-gender");
    var korBevitel = document.getElementById("p-age");
    var kategoriaValaszto = document.getElementById("p-cat");

    // Kiolvassuk, mik vannak beleírva
    var kivalasztottNem = nemValaszto.value;
    // Számmá kell alakítani, mert a szövegdobozból string jön
    var beirtKor = parseInt(korBevitel.value);

    // Kiürítjük a régit
    kategoriaValaszto.innerHTML = "";

    // Ha valamelyik üres, akkor kilépünk, mert nem tudunk számolni
    if (kivalasztottNem === "" || isNaN(beirtKor) === true) {
        return;
    }

    var szurtKategoriak = [];

    // Végigmegyünk az összes kategórián egy sima for ciklussal
    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var aktualisKategoria = OSSZES_KATEGORIA[i];
        
        var joANem = false;
        var joAKor = false;

        // Megnézzük a nemet
        if (aktualisKategoria.nem === kivalasztottNem || aktualisKategoria.nem === "Vegyes") {
            joANem = true;
        }

        // Megnézzük a kort
        if (beirtKor >= aktualisKategoria.minKor && beirtKor <= aktualisKategoria.maxKor) {
            joAKor = true;
        }

        // Ha mindkettő igaz, beletesszük a jó listába
        if (joANem === true && joAKor === true) {
            szurtKategoriak.push(aktualisKategoria);
        }
    }

    // Ha egyet sem találtunk
    if (szurtKategoriak.length === 0) {
        kategoriaValaszto.innerHTML = "<option>Nincs találat</option>";
        return;
    }

    // Csoportokat csinálunk, hogy szép legyen
    var kumiteCsoport = document.createElement("optgroup");
    kumiteCsoport.label = "KUMITE";

    var kataCsoport = document.createElement("optgroup");
    kataCsoport.label = "KATA";

    // Beletesszük a csoportokba az opciókat
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

    // Hozzáadjuk a HTML-hez
    if (kumiteCsoport.children.length > 0) {
        kategoriaValaszto.appendChild(kumiteCsoport);
    }
    if (kataCsoport.children.length > 0) {
        kategoriaValaszto.appendChild(kataCsoport);
    }
}

// Amikor megnyomják a HOZZÁADÁS gombot
function hozzaadVersenyzot() {
    // Ezt JAVÍTOTTAM: aktualisFelhasznalo a globális változó neve, nem jelenlegiFelhasznalo!
    var bejelentkezettEmber = aktualisFelhasznalo;

    // Megnézzük, van-e joga ehhez
    var vanJoga = false;
    if (bejelentkezettEmber.szerepkor === "admin" || bejelentkezettEmber.szerepkor === "coach") {
        vanJoga = true;
    }

    if (vanJoga === false) {
        alert("Nincs jogod ehhez!");
        return;
    }

    // Kiszedjük a dobozokból az értékeket
    var nevDoboz = document.getElementById("p-name");
    var versenyzoNeve = nevDoboz.value.trim(); // A trim() levágja a felesleges szóközöket
    
    var versenyzoDojo = document.getElementById("p-dojo").value;
    var kivalasztottKategoria = document.getElementById("p-cat").value;
    var versenyzoSulya = document.getElementById("p-weight").value;
    var versenyzoKora = document.getElementById("p-age").value;

    // Ellenőrizzük, hogy ki van-e töltve a név és a kategória
    if (versenyzoNeve === "" || kivalasztottKategoria === "") {
        alert("Hiányos adatok! Add meg a nevet és a kategóriát is.");
        return;
    }

    // Megnézzük, benne van-e már a listában
    var marBenneVan = false;
    for (var i = 0; i < adatok.versenyzok.length; i++) {
        var vizsgaltVersenyzo = adatok.versenyzok[i];
        
        if (vizsgaltVersenyzo.nev === versenyzoNeve && vizsgaltVersenyzo.kategoria === kivalasztottKategoria) {
            marBenneVan = true;
            break; // Megtaláltuk, nem kell tovább pörgetni a ciklust
        }
    }

    if (marBenneVan === true) {
        alert("Már nevezve van ide ez a versenyző!");
        return;
    }

    // Új ID-t csinálunk: 100-ról indul
    var eddigiJatekosokSzama = adatok.versenyzok.length;
    var ujAzonosito = 100 + eddigiJatekosokSzama + 1;
    
    // Csinálunk egy új objektumot a versenyzőnek
    var ujVersenyzo = {
        azonosito: ujAzonosito,
        nev: versenyzoNeve,
        klub: versenyzoDojo,
        kategoria: kivalasztottKategoria,
        suly: versenyzoSulya,
        kor: versenyzoKora,
        // Ide írjuk, hogy ki vette fel (a JAVÍTOTT változóval)
        tulajdonos: bejelentkezettEmber.felhasznalonev  
    };

    // Betesszük a nagy tömbbe
    adatok.versenyzok.push(ujVersenyzo);

    // Elmentjük a gépre
    mentes();

    // Frissítjük a képernyőt
    rajzolVersenyzokListajat();

    // Kiürítjük a név dobozt, hogy lehessen írni a következőt
    nevDoboz.value = "";
}

// Ez rajzolja ki a listát alulra
function rajzolVersenyzokListajat() {
    var listaElem = document.getElementById("player-list");
    listaElem.innerHTML = ""; // Letöröljük a régit

    // JAVÍTVA: Ha nincs senki belépve, akkor nem rajzolunk semmit
    if (aktualisFelhasznalo === null) {
        return;
    }

    var miketMutassunk = [];
    var kiVanBent = aktualisFelhasznalo;

    if (kiVanBent.szerepkor === "admin") {
        // Az admin mindent lát
        miketMutassunk = adatok.versenyzok;
    } else {
        // Az edző csak a sajátjait látja
        for (var i = 0; i < adatok.versenyzok.length; i++) {
            var ember = adatok.versenyzok[i];
            if (ember.tulajdonos === kiVanBent.felhasznalonev) {
                miketMutassunk.push(ember);
            }
        }
    }

    // Végigmegyünk azon, amit mutatni kell, és HTML-t ragasztunk össze
    for (var j = 0; j < miketMutassunk.length; j++) {
        var mutatasraVaroEmber = miketMutassunk[j];
        
        var htmlDarab = '<li class="border-b py-1 flex justify-between text-sm">';
        // Sima string összefűzés, ahogy az iskolában tanultuk!
        htmlDarab = htmlDarab + '<span><b>' + mutatasraVaroEmber.nev + '</b> (' + mutatasraVaroEmber.klub + ')</span>';
        htmlDarab = htmlDarab + '<span>' + mutatasraVaroEmber.kategoria + '</span>';
        htmlDarab = htmlDarab + '</li>';
        
        listaElem.innerHTML = listaElem.innerHTML + htmlDarab;
    }
};