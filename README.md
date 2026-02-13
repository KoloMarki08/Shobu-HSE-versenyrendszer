## SHOBU HSE versenyrendszer

Egy teljesen kliens oldali, böngészőben futó karate versenyrendező rendszer, amely támogatja a nevezéseket, a kumite ágrajzok automatikus generálását, a kata pontozást, valamint a különböző szerepköröket (admin, bíró, edző).  
Az alkalmazás elsősorban teszt/demo, illetve kisebb házi versenyek céljára készült.

### Fő funkciók röviden

- **Nevezés**: versenyzők felvitele név, klub, kor, nem, súly és kategória szerint.
- **Kategória-kezelés**: kategóriák automatikus szűrése az `ALL_CATEGORIES` alapján.
- **Kumite ágrajz**: 2-hatványos tábla, `BYE` helyek, továbbjutók automatikus vezetése.
- **Kumite bírói overlay**: AKA/SHIRO kijelzés, pontozás, szabálytalanságok, időmérés.
- **Kata verseny**: 2 körös lebonyolítás, 5 bíró pontszámai, min/max eldobása, TOP6 továbbjutó.
- **Adatkezelés**: minden adat a böngésző `localStorage` tárolójában marad, nincs szerver.

---

### Fájlstruktúra és fő fájlok

- **`verseny.html`**  
  A fő HTML állomány, amely tartalmazza:
  - a különböző nézeteket (login, nevezés, kumite ágrajz, kumite bírói overlay, kata nevezés és eredmények),
  - a Tailwind CSS CDN betöltését,
  - a fő UI-struktúrát (panelek, tabok, gombok, táblázatok).

- **`stilus.css`**  
  Egyedi stílusok:
  - login kártya, háttérkép-beállítások,
  - kumite ágrajz megjelenítés (meccs dobozok, vonalak),
  - kata pontozó táblázatok formázása,
  - időmérő / timer animációk, kiemelések.

- **`data.js`**  
  Alapadatok és globális állapot:
  - `ALL_CATEGORIES`: az összes elérhető versenykategória (korcsoport, nem, súly, szabályrendszer stb. szerint),
  - `USERS`: a rendszerben létező felhasználók (név, szerepkör, opcionális klub/azonosító),
  - globális `data` és `currentUser` objektumok,
  - adatszintű logika: mentés, betöltés, reset, nevezési lista karbantartása.

- **`auth.js`**  
  Bejelentkezés és jogosultság kezelés:
  - login űrlap kezelése, felhasználó ellenőrzése a `USERS` tömb alapján,
  - `currentUser` beállítása és megjelenítése,
  - UI tabok/nézetek engedélyezése vagy tiltása a szerepkör szerint.

- **`kumite.js`**  
  Kumite modul:
  - nevezett versenyzők sorsolása az adott kategóriában,
  - 2-hatványos (4/8/16/32 stb.) ágrajz automatikus generálása,
  - `BYE` helyek kezelése, hogy ne legyen üres meccs,
  - meccs győztesének felvezetése a következő körbe,
  - bírói overlay: piros (AKA) és fehér (SHIRO) versenyző, pontozás, szabálytalanságok, győztes kijelzése,
  - időmérő (start/stop/reset), visszaszámlálás, hang/animáció támogatása (ha definiálva).

- **`kata.js`**  
  Kata modul:
  - kata kategória indítása az aktuálisan nevezett versenyzőkből,
  - pontozó felület 5 bíró számára (külön input mezők vagy slider/selector),
  - pontszámítási logika (minimális és maximális pont eldobása, maradék 3 összegzése),
  - 1. kör végeredményének rendezése,
  - TOP6 versenyző automatikus továbbvitele a 2. körbe,
  - 2. kör utáni végső sorrend megjelenítése.

---

### Követelmények és futtatás

- **Minimális technikai követelmények**
  - Modern asztali vagy mobil böngésző (Chrome, Firefox, Edge, Safari aktuális verziók),
  - `localStorage` támogatás engedélyezve,
  - internetkapcsolat a Tailwind CSS CDN betöltéséhez.

- **Ajánlott futtatási mód**
  - A projekt fájljainak kicsomagolása egy tetszőleges mappába.
  - `verseny.html` megnyitása:
    - dupla kattintással, **vagy**
    - fejlesztői környezetben (pl. VS Code) `Open with Live Server` vagy bármilyen statikus HTTP szerver használatával.

Első indításkor a login nézet jelenik meg, a böngésző pedig automatikusan létrehozza a szükséges `localStorage` kulcsokat (pl. `iko_db`, `iko_kata_db`) az első mentésnél.

---

### Bejelentkezés és jogosultságok

A rendszer előre definiált, tesztelésre alkalmas felhasználókkal dolgozik, amelyek a `data.js` `USERS` tömbjében találhatók (és jellemzően a HTML-ben is fel vannak sorolva segédletként).

- **Szerepkörök és jogosultságok**
  - **admin**
    - versenyzők nevezése, módosítása, törlése,
    - kumite sorsolás indítása, ágrajz kezelése,
    - kata versenyek indítása, körök lezárása,
    - teljes adatbázis resetelése (kumite + kata).
  - **coach**
    - saját versenyzők neveztetése a megfelelő kategóriákba,
    - nevezett lista és eredmények megtekintése (olvasási jog),
    - kumite/kata lebonyolítást közvetlenül nem módosítja.
  - **judge**
    - kumite és kata pontozó felületek használata,
    - meccsek/körök eredményének rögzítése az aktuális felületen,
    - nevezési adatok és globális beállítások módosítására nincs jogosultság.

A belépés után a szerepkörnek megfelelően válnak elérhetővé a tabok és gombok (pl. az admin lát minden menüpontot, a coach a nevezés és listák részét, a judge pedig a pontozó felületeket).

---

### Fő funkciók részletesebben

- **Nevezés**
  - Új versenyzők rögzítése:
    - név,
    - klub,
    - születési év / korcsoport,
    - nem,
    - súlycsoport,
    - kumite és/vagy kata kategória.
  - A lehetséges kategóriák listáját az `ALL_CATEGORIES` tömb határozza meg.
  - A felület automatikusan csak azokat a kategóriákat ajánlja fel, amelyek megfelelnek a versenyző korának, nemének és súlyának.
  - A nevezések a böngésző `localStorage` tárhelyén kerülnek mentésre, így frissítés után is megmaradnak ugyanazon a gépen és böngészőben.

- **Kumite ágrajz**
  - Egy kiválasztott kumite kategória nevezett listájából:
    - a rendszer sorsolással létrehoz egy 2-hatványos (4, 8, 16, 32, … fős) táblát,
    - ha a nevezettek száma nem pontosan 2-hatvány, a fennmaradó helyeket `BYE` pozíciók töltik ki.
  - Minden meccsnek van:
    - AKA (piros) és SHIRO (fehér) versenyzője,
    - a bíró az overlayen keresztül rögzítheti a pontokat, intéseket, győztest.
  - A győztesek automatikusan továbbjutnak a következő kör megfelelő mérkőzésébe, amíg ki nem alakul a kategória győztese.
  - A kumite overlay támogatja az időzítést (start/stop/reset), vizuális visszajelzésekkel.

- **Kata verseny**
  - A kiválasztott kata kategória résztvevői 1. körben lépnek tatamira.
  - Minden versenyzőhöz 5 bíró ad pontszámot.
  - Pontszámítás:
    - a rendszer eldobja a legmagasabb és legalacsonyabb pontot,
    - a megmaradt 3 pont összege adja az adott kör eredményét.
  - Az 1. kör végén a versenyzők pontszám szerint rendezve jelennek meg.
  - **TOP6 továbbjutás**:
    - az első 6 versenyző automatikusan továbbjut a 2. körbe,
    - a 2. kör pontozása azonos elv mentén történik,
    - a végső sorrend a 2. kör eredményei alapján alakul ki.

- **Adatkezelés és reset**
  - Az adatok a böngésző `localStorage` tárhelyén vannak tárolva, tipikusan:
    - kumite nevezések és ágrajz: `iko_db`,
    - kata nevezések és eredmények: `iko_kata_db`.
  - **Teljes reset** gomb:
    - törli a fenti kulcsok tartalmát,
    - visszaállítja a rendszert „üres” állapotba (új verseny vagy tesztelés előtt hasznos).

---

### Ismert korlátok és megjegyzések

- **Nincs backend / szerver**  
  Az alkalmazás teljesen kliens oldali, nem kapcsolódik adatbázishoz vagy API-hoz.  
  Minden adat azon a gépen és abban a böngészőben marad, ahol rögzítették.

- **Adatok lokális jellege**
  - Másik böngészőben vagy másik gépen a nevezések és eredmények nem látszanak.
  - Böngésző cache / `localStorage` teljes törlése esetén az adatok elvesznek.

- **Tailwind CDN függőség**
  - A kinézethez a Tailwind CSS CDN betöltése szükséges.
  - **Offline használathoz**:
    - a Tailwindet lokálisan kell buildelni/bundelni és a projektbe másolni,
    - a `verseny.html` hivatkozását ennek megfelelően kell módosítani.

- **Teszt/demo fókusz**
  - A rendszer elsősorban oktatási, demo vagy kisebb háziverseny környezetre lett optimalizálva.
  - Nagy, több páston, több gépen párhuzamosan futó hivatalos versenyekhez további fejlesztés (pl. központi adatbázis, szinkronizáció, többeszközös kezelés) szükséges.

---

### Fejlesztői jegyzetek

- A logika teljes egészében JavaScript-ben, kliens oldalon fut.
- Nem használ keretrendszert (React/Vue/Angular stb.), „vanilla” JS + Tailwind + saját CSS alapokra épül.
- A kód könnyen futtatható bármilyen statikus fájlokat kiszolgáló környezetből, ezért kiválóan alkalmas kísérletezésre, oktatásra, illetve gyors PoC-kre.

---

### Licenc és szerző

Add meg itt a választott licencet (pl. MIT, GPL, „csak belső használatra” stb.), valamint a készítő(k) nevét és elérhetőségét, ha publikusan is megosztod a projektet.

