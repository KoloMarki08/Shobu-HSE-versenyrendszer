/* auth.js - Belépés és nézetváltás kezelése, egyszerű, "junior" stílusban megírva */

// Egyszerű bejelentkezési logika: kiolvassuk a mezőket, majd megkeressük a felhasználót
function bejelentkezes() {
    // Felhasználónév és jelszó mezők kiolvasása
    var felhasznalonevBevitel = document.getElementById("login-user");
    var jelszoBevitel = document.getElementById("login-pass");

    var beirtFelhasznalonev = felhasznalonevBevitel.value;
    var beirtJelszo = jelszoBevitel.value;

    // Itt fogjuk eltárolni a megtalált felhasználót (ha van)
    var talaltFelhasznalo = null;

    // A FELHASZNALOK tömböt a data.js-ből olvassa be a böngésző
    // Junior módon, egyszerű for ciklussal keressük végig
    for (var i = 0; i < FELHASZNALOK.length; i++) {
        var aktualis = FELHASZNALOK[i];
        var ugyanazAFelhasznalonev = (aktualis.felhasznalonev === beirtFelhasznalonev);
        var ugyanazAJelszo = (aktualis.jelszo === beirtJelszo);

        if (ugyanazAFelhasznalonev && ugyanazAJelszo) {
            talaltFelhasznalo = aktualis;
            break; // Nem kell tovább keresni
        }
    }

    // Ha találtunk megfelelő felhasználót, elindítjuk a sessiont
    if (talaltFelhasznalo !== null) {
        allitBejelentkezest(talaltFelhasznalo);
    } else {
        alert("Hibás felhasználónév vagy jelszó!");
    }
}

// Nézőként (guest) való belépés egyszerű, előre megadott adatokkal
function bejelentkezesVendegkent() {
    var vendegFelhasznalo = {
        szerepkor: "guest",
        nev: "Néző",
        klub: "-"
    };

    allitBejelentkezest(vendegFelhasznalo);
}

// Segédfüggvény: elrejti a bejelentkező felületet
function rejtsdElBejelentkezest() {
    var bejelentkezesiOverlay = document.getElementById("login-overlay");
    bejelentkezesiOverlay.classList.add("hidden");
}

// Segédfüggvény: megjeleníti a fő alkalmazást
function mutasdFoAlkalmazast() {
    var alkalmazasGyoker = document.getElementById("app");
    alkalmazasGyoker.classList.remove("hidden");
}

// Segédfüggvény: kiválasztja a kezdő tabot a felhasználó szerepköre alapján
function valasszKezdoFult(felhasznaloObjektum) {
    // Admin és edző esetén a nevezés fülre lépünk
    var adminVagyEdzoE = (felhasznaloObjektum.szerepkor === "admin" || felhasznaloObjektum.szerepkor === "coach");
    
    if (adminVagyEdzoE) {
        valtFul("reg");
    } else {
        // Mindenki másnak (pl. guest, judge) az ágrajz fülre lépünk
        valtFul("bracket");
    }
}

// Itt állítjuk be a globális felhasználót és a kezdő nézetet
// A függvény több lépésre van bontva, hogy könnyebb legyen követni
function allitBejelentkezest(felhasznaloObjektum) {
    // 1. LÉPÉS: Globális változó frissítése
    // Ez a változó más fájlokból is elérhető lesz
    aktualisFelhasznalo = felhasznaloObjektum;

    // 2. LÉPÉS: Bejelentkező felület elrejtése
    // A login overlay-t elrejtjük, hogy ne látszódjon többé
    rejtsdElBejelentkezest();

    // 3. LÉPÉS: Fő alkalmazás megjelenítése
    // Az app div-et megjelenítjük, hogy látszódjon a fő tartalom
    mutasdFoAlkalmazast();

    // 4. LÉPÉS: Felhasználónév, jogosultságok, admin panel stb. frissítése
    // Ez a függvény módosítja a felületet a felhasználó szerepköre szerint
    frissitFelhasznaloiFeluletet();

    // 5. LÉPÉS: Nevezettek lista megjelenítése
    // Itt már biztosan van aktualisFelhasznalo, ezért biztonságosan meghívhatjuk
    rajzolVersenyzokListajat();

    // 6. LÉPÉS: Kezdő tab kiválasztása a szerepkör alapján
    // Admin/edző -> nevezés fül, mindenki más -> ágrajz fül
    valasszKezdoFult(felhasznaloObjektum);

    // 7. LÉPÉS: Kata tartalom frissítése (ha elérhető)
    // Ellenőrizzük, hogy létezik-e a függvény, mielőtt meghívjuk
    // Ez azért fontos, mert ha a kata.js nem töltődött be, akkor hibát kapnánk
    var kataFuggvenyLetezikE = (typeof rajzolKata === "function");
    if (kataFuggvenyLetezikE) {
        rajzolKata();
    }
}

// A bejelentkezett felhasználó alapján módosítjuk a felületet
// Ez a függvény frissíti a UI-t a felhasználó szerepköre szerint
function frissitFelhasznaloiFeluletet() {
    // 1. LÉPÉS: Ellenőrizzük, hogy van-e bejelentkezett felhasználó
    // Ha valamiért még nincs aktualisFelhasznalo, egyszerűen kilépünk
    if (!aktualisFelhasznalo) {
        return;
    }

    // 2. LÉPÉS: Felhasználónév kiírása a felső sávban
    // Megkeressük a user-badge elemet és beállítjuk a szövegét
    var felhasznaloJelzo = document.getElementById("user-badge");
    felhasznaloJelzo.innerText = aktualisFelhasznalo.nev;

    // 3. LÉPÉS: Admin specifikus elemek mutatása
    // Csak admin szerepkör esetén jelenítjük meg az admin vezérlőket
    var adminE = (aktualisFelhasznalo.szerepkor === "admin");
    if (adminE) {
        var adminVezerlok = document.getElementById("admin-controls");
        adminVezerlok.classList.remove("hidden");
    }

    // 4. LÉPÉS: Edző és admin esetén látszódjon a nevezés fül
    // Ellenőrizzük, hogy admin vagy edző szerepkörről van-e szó
    var adminVagyEdzoE = (aktualisFelhasznalo.szerepkor === "admin" || aktualisFelhasznalo.szerepkor === "coach");
    
    if (adminVagyEdzoE) {
        // Megjelenítjük a nevezés gombot a navigációban
        var navNevezesGomb = document.getElementById("nav-reg");
        navNevezesGomb.classList.remove("hidden");

        // Kitöltjük a klub mezőt a felhasználó klubjával
        var dojoBevitel = document.getElementById("p-dojo");
        dojoBevitel.value = aktualisFelhasznalo.klub;

        // 5. LÉPÉS: Admin esetén engedjük átírni a klub nevét
        // Edzőknek nem lehet módosítani, csak adminnak
        if (adminE) {
            dojoBevitel.disabled = false;
        }
    }
}

// Egyszerű kijelentkezés: az oldal újratöltése
function kijelentkezes() {
    location.reload();
}

// Nézetek közötti váltás (Nevezés / Kumite ágrajz / Kata eredmények / Bírói panel)
// Ez a függvény vált a különböző nézetek között az oldalon
function valtFul(fulId) {
    // 1. LÉPÉS: Először az összes section-t elrejtjük
    // A querySelectorAll minden <section> elemet megtalál az oldalon
    var osszesSection = document.querySelectorAll("section");

    // Végigmegyünk az összes section-en és elrejtjük őket
    for (var i = 0; i < osszesSection.length; i++) {
        var sectionElem = osszesSection[i];
        // A "hidden" osztály hozzáadásával elrejtjük az elemet
        sectionElem.classList.add("hidden");
    }

    // 2. LÉPÉS: Megjelenítjük azt a section-t, amelyikre váltani szeretnénk
    // Az id paraméterből építjük fel a teljes ID-t
    var fulIdTeljes = "tab-" + fulId;
    
    // Megkeressük az elemet ezzel az ID-val
    var aktivSection = document.getElementById(fulIdTeljes);

    // Csak akkor jelenítjük meg, ha létezik az elem
    if (aktivSection) {
        // A "hidden" osztály eltávolításával megjelenítjük az elemet
        aktivSection.classList.remove("hidden");
    }

    // 3. LÉPÉS: Ha ágrajz fülre lépünk, frissítjük az ágrajz tartalmát
    var agrajzFulE = (fulId === "bracket");
    var agrajzFuggvenyLetezikE = (typeof rajzolAgrajz === "function");
    
    if (agrajzFulE && agrajzFuggvenyLetezikE) {
        rajzolAgrajz();
    }

    // 4. LÉPÉS: Ha kata fülre lépünk, frissítjük a kata tartalmát
    var kataFulE = (fulId === "kata");
    var kataFuggvenyLetezikE = (typeof rajzolKata === "function");
    
    if (kataFulE && kataFuggvenyLetezikE) {
        rajzolKata();
    }
}