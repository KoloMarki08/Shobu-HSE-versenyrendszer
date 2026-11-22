# TATAMI MASTER™ – Shobu HSE Kyokushin Karate Versenyrendszer

A **TATAMI MASTER™** a Shobu HSE Kyokushin Karate bajnokságainak teljes körű lebonyolítására készült, modern kliens–szerver architektúrájú versenykezelő szoftver (`https://tatamimaster.hu`).

A rendszer támogatja:
* **Több verseny párhuzamos és egymást követő kezelését** (pontos napra és óra:percre megadható nevezési határidővel, automatikus nevezészárolással).
* **Japán és Európai korhatár-számítási szabályt** (Japán szabály: a verseny napján betöltött pontos életkor `Év-Hónap-Nap` szerint; Európai szabály: születési év alapján).
* **Férfi/Fiú, Női/Lány és Vegyes (pl. Ovis Csipeszharc)** kategóriákat.
* **Zárt IKO edzői regisztráció-elbírálást** (`PENDING` / `APPROVED` / `REJECTED`) jelszó-erősség mérővel és az **`info@tatamimaster.hu`** címről érkező automatikus visszaigazoló, jóváhagyó és elutasító e-mailekkel.
* **Edzői Csapat-sablont (Állandó Egyesületi Versenyzői Keretet)**: a versenyzők neve, születési dátuma és neme rögzített (zárolt), míg a fejlődő adatok (övfokozat és testsúly) versenyről versenyre frissíthetők, és a teljes csapat 1 kattintással benevezhető.
* **Hivatalos Kumite lebonyolítási rendszereket**:
  * **2–5 fő**: Teljes körmérkőzés (mindenki mindenki ellen).
  * **6 fő**: **6 fős Hibrid rendszer** (1. forduló: 3 páros kieséses selejtező -> 2. forduló: a 3 győztes döntő körmérkőzése az 1–3. helyért).
  * **7+ fő**: Klasszikus egyenes kieséses ágrajz, **4 negyedes külső kiemeléssel** (32 fős táblán az **1., 16., 17., 32.** helyre; 16 fős táblán az **1., 8., 9., 16.** helyre; 8 fős táblán az **1., 4., 5., 8.** helyre).
* **Aréna Bírói Vezérlőpultot** (billentyűparancsokkal, hosszabbításkori teljes nullázással, orvosi ápolás és tatami-szünet jelzéssel, meccs-újranyitással, Kata `5,0–9,0` automatikus tizedesvesszős gyorsbevitellel), **2. monitoros TV-kijelzőt** és **OBS Stream Overlay-t**.

---

## Mappa- és Fájlszerkezet (Project Structure)

```text
Shobu-HSE-versenyrendszer/
├── index.html                     # Főoldal: Belépés, Edzői Regisztráció (Jelszó-erősség mérővel) & Versenyválasztó
├── views/                         # Felhasználói felületek (HTML nézetek)
│   ├── admin.html                 # Adminisztrációs Központ (1–7. Menü + Gyorsmenü sáv)
│   ├── audience.html              # Élő Nézői Követés, „Mikor küzdök?” & Edzői Nevezési Központ (Csapat-sablonnal)
│   ├── biroi_panel.html           # Aréna Bírói Vezérlőpult (Kumite & Kata)
│   ├── tv_kijelzo.html            # 2. Monitoros / Projektoros TV Kijelző
│   ├── obs_overlay.html           # Élő Közvetítés (OBS Studio) Stream Overlay
│   ├── eredmenyek.html            # Eredményhirdetés, Dobogósok, Klubranglista, Oklevélnyomtató & Díjátadó pipáló
│   └── nevezes.html               # Gyors Mérlegelési Állomás
├── JS/                            # Moduláris Kliensoldali JavaScript Motorok
│   ├── core.js                    # Központi szabály-, sorsolás-, életkor-, QR-, oklevél- és élő szinkron-motor
│   ├── admin_adatok.js            # Admin Központ vezérlő (versenyek, CSV import/export, sorsolás, IKO edző-elbírálás)
│   ├── audience.js                # Nézői élő követés, klubszűrő és Edzői Csapat-sablon vezérlő
│   ├── biroi_panel.js             # Bírói Pult vezérlő (Kumite/Kata pontozás, gyorsbillentyűk, szünetek, továbbjutás)
│   ├── tv_kijelzo.js              # TV Kijelző valós idejű szinkron vezérlő
│   ├── data.js                    # Eredmények, díjátadó pipáló és mérlegelési állomás vezérlő
│   ├── login.js                   # Belépés, hCaptcha, jelszó-erősség mérő és edzői regisztráció vezérlő
│   ├── index.js                   # Főoldali aktuális versenyek dokk vezérlő
│   ├── auth.js                    # Jogosultság-ellenőrző és Admin gyorsnavigációs sáv
│   ├── tabs.js                    # Admin harmonika-menü és gyorsugrás vezérlő
│   └── jelszomegjelenito.js       # Jelszó megjelenítése/elrejtése segédmodul
├── CSS/                           # Stíluslapok
│   ├── design_system.css          # Bahnschrift monokróm-krém-vörös egységes dizájnrendszer
│   └── stlye.css                  # Alap elrendezések, ágrajzok, tatami kártyák és nyomtatási stílusok
├── Backend/                       # C# ASP.NET Core (.NET 10.0) REST API és Valós Idejű Szerver
│   └── Versenyrendszer_Projekt/Versenyrendszer/Versenyrendszer/
│       ├── Program.cs             # Szerver indítás, automatikus DB migráció, CORS és szerepkör-védelem
│       ├── Controllers/           # API Végpontok (Tournaments, Categories, Competitors, Registrations, Tatamis, Matches, Users, LiveArena)
│       ├── Models/                # EF Core Adatmodellek (AppDbContext, Tournament, Category, Competitor, Registration, Tatami, Match, User)
│       ├── Services/              # AuthService (PBKDF2 + HMAC), EmailService (Direct-to-MX info@tatamimaster.hu), LiveArenaStateService (SSE/SignalR)
│       └── Hubs/                  # LiveArenaHub (SignalR valós idejű csatorna)
├── docs/                          # Telepítési útmutatók, szerver szkriptek és adatbázis-sablonok
│   ├── TELEPITESI_UTMUTATO_SZERVEREM_HU.txt
│   ├── telepito.sh
│   └── JO_shobu_system_adatbazis.sql
└── .github/workflows/deploy.yml   # Automatikus GitHub Actions CI/CD élesítés a tatamimaster.hu VPS-re
```

---

## Technológiai Stack

### Backend (REST API, Hitelesítés, E-mail és Adatbázis)
* **Keretrendszer:** C# ASP.NET Core Web API (`.NET 10.0`) + SignalR / Server-Sent Events (`LiveArena`) valós idejű szinkronizáció
* **Adatbázis:** MySQL / MariaDB (EF Core `Pomelo.EntityFrameworkCore.MySql`, automatikus táblalétrehozással és séma-bővítéssel)
* **Hitelesítés:** `PBKDF2-SHA256` (100 000 iteráció) jelszó-hashelés, `HMAC-SHA256` aláírt tokenek és IP-alapú brute-force védelem
* **E-mail küldés:** Beépített `Direct-to-MX (STARTTLS)` és SMTP motor (`info@tatamimaster.hu` feladóval)

### Frontend (Kliens)
* **Felépítés:** HTML5, CSS3 (`Bahnschrift` monokróm és krém dizájnrendszer), moduláris, függőségmentes JavaScript (`ES6+`)

---

## Telepítés és Futtatás Helyi Fejlesztői Gépen

1. **XAMPP (Apache + MySQL/MariaDB)** indítása (Apache: `80` port, MySQL: `3306` port).
2. **C# Backend indítása**:
   ```powershell
   cd C:\xampp\htdocs\Shobu-HSE-versenyrendszer\Backend\Versenyrendszer_Projekt\Versenyrendszer\Versenyrendszer
   dotnet dev-certs https --trust
   dotnet run --launch-profile https
   ```
   *(A szerver induláskor automatikusan létrehozza és frissíti a `shobu_verseny_db` adatbázist és az alapértelmezett fiókokat.)*
3. **Weboldal megnyitása**:
   * Főoldal: `http://localhost/Shobu-HSE-versenyrendszer/index.html?login=1`
   * Éles oldal: `https://tatamimaster.hu`
