# TATAMI MASTER™ – Shobu HSE Kyokushin Karate Versenyrendszer

A **TATAMI MASTER™** a Shobu HSE Kyokushin Karate bajnokságainak teljes körű lebonyolítására készült, modern kliens–szerver architektúrájú versenykezelő szoftver. A rendszer több párhuzamos vagy egymást követő verseny kezelését, az edzői nevezést, a többlépcsős Kumite súlycsoport-bontást, a Kata Kyu-bontást, az automatikus pihenőidős tatami-sorsolást (5 főig körmérkőzés, 6+ főtől egyenes kiesés), az aréna bírói vezérlőpultot, a 2. monitoros TV-kijelzőt és az élő nézői/edzői eredménykövetést biztosítja.

---

## Technológiai Stack

### Backend (REST API és Adatbázis)
* **Keretrendszer:** C# ASP.NET Core Web API (`.NET 10.0`) + SignalR / Server-Sent Events (`LiveArena`) valós idejű szinkronizáció
* **Adatbázis:** MySQL / MariaDB (XAMPP)
* **ORM:** Entity Framework Core (`Pomelo.EntityFrameworkCore.MySql`)
* **Alapértelmezett API cím:** `https://localhost:7045/api` (helyi csarnok Wi-Fi / LAN hálózaton automatikusan `http://<szerver-ip>:5008/api`)

### Frontend (Kliens)
* **Felépítés:** HTML5, CSS3 (`Bahnschrift` monokróm és krém dizájnrendszer), moduláris JavaScript (`ES6+`)
* **Kiszolgálás:** XAMPP Apache webszerver (`http://localhost/Shobu-HSE-versenyrendszer/index.html`)

---

## Telepítés és Futtatás Teljesen Új Gépen (`git clone` után)

Az alábbi lépésekkel egy teljesen üres, új Windows gépen percek alatt beüzemelhető a teljes rendszer.

### 0. Előfeltételek (Telepítendő programok az új gépen)
1. **XAMPP (Apache + MySQL/MariaDB):** [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. **.NET 10.0 SDK** (vagy **Visual Studio 2022 / 2026** az *ASP.NET és webfejlesztés* csomaggal): [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
3. **Git:** [https://git-scm.com/](https://git-scm.com/)

---

### 1. Lépés: A GitHub repó klónozása a XAMPP `htdocs` mappájába
Nyiss egy **PowerShell** vagy **Parancssor (CMD)** ablakot, lépj be a XAMPP `htdocs` könyvtárába, és klónozd a repót:

```powershell
cd C:\xampp\htdocs
git clone https://github.com/kolomarki08/Shobu-HSE-versenyrendszer.git
cd Shobu-HSE-versenyrendszer
```

*(Fontos: A projekt mappája a `C:\xampp\htdocs\Shobu-HSE-versenyrendszer` útvonalon legyen, hogy a `http://localhost/Shobu-HSE-versenyrendszer/` címről közvetlenül elérhető legyen.)*

---

### 2. Lépés: XAMPP (Apache és MySQL) elindítása
1. Nyisd meg a **XAMPP Control Panel** alkalmazást.
2. Az **Apache** sorában kattints a **Start** gombra.
3. A **MySQL** sorában kattints a **Start** gombra.
4. Várd meg, amíg mindkét szolgáltatás neve mögött megjelenik a zöld háttér (Apache: `80` / `443` port, MySQL: `3306` port).

---

### 3. Lépés: Az adatbázis automatikus létrehozása (`shobu_verseny_db`)
A C# Backend az adatbázis-kapcsolatot a `Backend/Versenyrendszer_Projekt/Versenyrendszer/Versenyrendszer/appsettings.json` fájlból olvassa:
* **Szerver:** `127.0.0.1` (port: `3306`)
* **Adatbázis neve:** `shobu_verseny_db`
* **Felhasználó:** `root` (jelszó: üres, alapértelmezett XAMPP beállítás)

Az adatbázis és a táblák létrehozásához futtasd az alábbi parancsokat PowerShellben:

```powershell
cd C:\xampp\htdocs\Shobu-HSE-versenyrendszer\Backend\Versenyrendszer_Projekt\Versenyrendszer\Versenyrendszer
dotnet tool install --global dotnet-ef
dotnet ef database update
```

> **Alternatíva Visual Studióban:**
> Ha Visual Studióban nyitod meg a `Backend\Versenyrendszer_Projekt\Versenyrendszer\Versenyrendszer.slnx` fájlt, nyisd meg a **Tools -> NuGet Package Manager -> Package Manager Console** ablakot, és írd be:
> ```powershell
> Update-Database
> ```
> Ez automatikusan létrehozza a `shobu_verseny_db` adatbázist és az összes szükséges táblát (`tournaments`, `competitors`, `categories`, `registrations`, `tatamis`, `matches`, `users`).

---

### 4. Lépés: A C# Backend API szerver elindítása (`https://localhost:7045`)

#### A) Indítás parancssorból (PowerShell / Terminal):
```powershell
cd C:\xampp\htdocs\Shobu-HSE-versenyrendszer\Backend\Versenyrendszer_Projekt\Versenyrendszer\Versenyrendszer

# Legelső alkalommal az új gépen hitelesítsd a helyi HTTPS fejlesztői tanúsítványt:
dotnet dev-certs https --trust

# Indítsd el a Backend szervert HTTPS profillal (https://localhost:7045):
dotnet run --launch-profile https
```

#### B) Indítás Visual Studióból:
1. Nyisd meg a `Backend\Versenyrendszer_Projekt\Versenyrendszer\Versenyrendszer.slnx` fájlt Visual Studióban.
2. A felső eszköztáron a futtatási profilnál válaszd a **`https`** lehetőséget.
3. Nyomd meg az **F5** (vagy `Ctrl + F5`) gombot.

Amikor a konzolon megjelenik a `Now listening on: https://localhost:7045` üzenet, a Backend API készen áll. **Hagyd nyitva ezt a terminált / Visual Studiót a használat közben!**

---

### 5. Lépés: A Weboldal megnyitása és a Gyári Mintaadatok betöltése
1. Nyisd meg a böngésződben a főoldalt:
   * **Főoldal (Belépés / Edzői Regisztráció / Versenyek):**
     [http://localhost/Shobu-HSE-versenyrendszer/index.html](http://localhost/Shobu-HSE-versenyrendszer/index.html)
2. Jelentkezz be Adminisztrátorként:
   * **Felhasználónév:** `admin` *(vagy `KoloMarki`)*
   * **Jelszó:** `admin123` *(vagy `1234`)*
3. **Gyári tesztadatok betöltése 1 kattintással (új gépen az első belépés után):**
   * Az **Admin Központ** (`views/admin.html`) jobb felső sarkában kattints a **„Gyári Mintaadatok Betöltése”** gombra, majd hagyd jóvá a megerősítő ablakot.
   * A rendszer ekkor automatikusan feltölti a teljes alapversenyt (`Shobu HSE Országos Bajnokság 2026`), a 3 küzdőteret (`Tatami A`, `Tatami B`, `Tatami C`), a 31 meghirdetett Kata és Kumite kategóriát, valamint a minta versenyzőket és nevezéseket.

---

## Belépési Fiókok (Teszt és Bemutató Adatok)

| Szerepkör | Felhasználónév | Jelszó | Elérhető felület |
| :--- | :--- | :--- | :--- |
| **Adminisztrátor / Főbíró** | `admin` vagy `KoloMarki` | `admin123` vagy `1234` | Teljes Admin Központ, Bírói Vezérlőpult, Élő Nézői/Edzői Oldal |
| **Asztalbíró (Tatami)** | `biro` vagy `A tatami` | `biro123` vagy `A-tatami` | Aréna Bírói Vezérlőpult, TV Kijelző, OBS Stream Overlay |
| **Klubedző (Coach)** | `edzo` vagy `Balint.Tornai` | `edzo123` vagy `1234` | Élő Nézői és Edzői Nevezési Központ (egyéni és Csapat Kata nevezés) |

*(A főoldalon az **„Edzői Regisztráció”** fülön új edzői fiók is bármikor regisztrálható.)*

---

## A Rendszer Főbb Oldalai és Moduljai

* **Főoldal & Belépés:** `http://localhost/Shobu-HSE-versenyrendszer/index.html`
* **Adminisztrációs Központ (0–5. lépéses lenyitható menükkel):** `http://localhost/Shobu-HSE-versenyrendszer/views/admin.html`
* **Aréna Bírói Vezérlőpult (Kumite korcsoport szerinti hosszabbításokkal, gonggal & Kata pontozással):** `http://localhost/Shobu-HSE-versenyrendszer/views/biroi_panel.html`
* **Élő TV Kijelző (2. monitorra / projektorra, valós idejű szinkronnal):** `http://localhost/Shobu-HSE-versenyrendszer/views/tv_kijelzo.html`
* **OBS Stream Overlay:** `http://localhost/Shobu-HSE-versenyrendszer/views/obs_overlay.html`
* **Élő Nézői & Edzői Követő Oldal („Mikor küzdök?” időbecslővel és A4 Csarnok QR-Plakáttal):** `http://localhost/Shobu-HSE-versenyrendszer/views/audience.html`
* **Eredményhirdetés, Klubranglista & Oklevélnyomtató:** `http://localhost/Shobu-HSE-versenyrendszer/views/eredmenyek.html`

---

## Gyakori Kérdések / Hibaelhárítás Új Gépen

1. **„Nem sikerült elérni a C# Backend szervert” hibaüzenet jelenik meg:**
   * Ellenőrizd, hogy fut-e a C# Backend (`dotnet run --launch-profile https`), és a `https://localhost:7045` címen figyel-e.
   * Ha a böngésző tanúsítványhibát jelez a `https://localhost:7045` címen, nyisd meg külön fülön a `https://localhost:7045/api/Tournaments` címet, és kattints a **Speciális -> Tovább a localhost oldalra** gombra, vagy futtasd a `dotnet dev-certs https --trust` parancsot.
2. **Adatbázis kapcsolódási hiba (`Unable to connect to any of the specified MySQL hosts`):**
   * Ellenőrizd a XAMPP Control Panelben, hogy a **MySQL** modul el van-e indítva.
   * Ha a helyi MySQL szervereden a `root` felhasználónak jelszava van, írd be a jelszót a `Backend/Versenyrendszer_Projekt/Versenyrendszer/Versenyrendszer/appsettings.json` fájl `DefaultConnection` sorába (`Password=...;`).
3. **Eltérő `.NET SDK` verzió van a gépen (pl. `.NET 8.0` vagy `.NET 9.0` a `.NET 10.0` helyett):**
   * A `Backend/Versenyrendszer_Projekt/Versenyrendszer/Versenyrendszer/Versenyrendszer.csproj` fájlban a `<TargetFramework>net10.0</TargetFramework>` sort átírhatod `<TargetFramework>net9.0</TargetFramework>` vagy `<TargetFramework>net8.0</TargetFramework>` értékre a gépeden lévő SDK-nak megfelelően.
