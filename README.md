# Shobu HSE Versenyrendszer v2.0

Ez a projekt a Shobu HSE Kyokushin Karate bajnokságainak lebonyolítására készült, teljesen modernizált versenykezelő szoftver. A rendszer leváltja a korábbi natív PHP és fájlalapú (JSON) architektúrát, és egy skálázható, valós idejű kliens-szerver modellt alkalmaz.

A cél egy olyan stabil, hibatűrő platform biztosítása, amely egy zajos sportcsarnokban is megbízhatóan működik, és a bírók számára telepítés nélküli, alkalmazás-szerű élményt nyújt (PWA).

## 🛠 Technológiai Stack

A projekt élesen kettéválik egy adatvezérelt háttérrendszerre (Backend) és egy interaktív felhasználói felületre (Frontend).

### Backend (API & Logika)
* **Keretrendszer:** C# ASP.NET Core Web API
* **Adatbázis:** MySQL
* **ORM:** Entity Framework Core (Code-First megközelítés)
* **Valós idejű kommunikáció:** SignalR (WebSockets)
* **API Dokumentáció:** Swagger / OpenAPI

### Frontend (Kliens)
* **Keretrendszer:** Reaktív JS keretrendszer (Client-side routinggal)
* **Kialakítás:** PWA (Progressive Web App) – böngészőből telepíthető mobil/asztali élmény
* **Stílus:** Egyedi CSS, natív sötét mód (Dark Mode) optimalizálással a bírói tabletekhez

## 🏗 Rendszerarchitektúra és Működés

A rendszer "vékony kliens" elven működik. A böngésző (Frontend) semmilyen üzleti logikát nem tartalmaz és nem számol. Minden adat (mérkőzések állapota, sorsolási ágrajzok, pontozás érvényessége) a C# szerveren dől el. A kliens kizárólag megjeleníti a REST API-tól kapott JSON adatokat, és SignalR-en keresztül valós időben frissül.

### Jogosultsági Szintek (RBAC)
1. **Admin / Főasztal (Teljes hozzáférés):** Törzsadatok kezelése, sorsolások generálása és felülbírálása, mérkőzések véglegesítése.
2. **Bíró / Tatami (Korlátozott hozzáférés):** Időmérés és pontozási események (Waza-ari, Ippon, intések) rögzítése a saját tatamin.
3. **Közönség (Csak olvasható):** Folyamatban lévő meccsek, ágrajzok és eredmények publikus követése.

## 🗄 Adatbázis Modell (Core Entitások)
* **Competitors:** Név, klub (Dojo), övfokozat, kor, súly.
* **Categories:** Kata / Kumite, korosztály, súlycsoport.
* **Registrations:** Kapcsolótábla a versenyzők és a kategóriák között.
* **Matches:** Aka és Shiro azonosítója, tatami száma, sorsolási pozíció és státusz.
* **ScoreEvents:** Időbélyeggel ellátott eseménynapló a visszavonható pontozáshoz.

## 🚀 Telepítés és Futtatás (Setup)

### Előfeltételek (Prerequisites)
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download) (vagy újabb) a backend futtatásához.
* [Node.js](https://nodejs.org/) (v18+) a frontend fejlesztéshez.
* MySQL Server (helyi telepítés vagy Docker konténer).

### Backend telepítése
1. Klónozd a repót és navigálj a backend mappába:
   ```bash
   git clone [https://github.com/kolomarki08/shobu-hse-versenyrendszer.git](https://github.com/kolomarki08/shobu-hse-versenyrendszer.git)
   cd shobu-hse-versenyrendszer/Backend