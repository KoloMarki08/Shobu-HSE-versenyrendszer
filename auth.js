/* AUTH.js - TELJES VERZIÓ: Minden eredeti funkció + Új adminisztráció */

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
    var navAdmin = document.getElementById("nav-admin"); // Új admin fül gombja
    var adminControls = document.getElementById("admin-controls");
    var navKata = document.getElementById("nav-kata"); 
    var navBracket = document.getElementById("nav-bracket");

    // JOGOSULTSÁGOK BEÁLLÍTÁSA (Eredeti logika szerint)
    if (aktualisFelhasznalo.szerepkor === "admin") {
        if(adminControls) adminControls.classList.remove("hidden");
        if(navReg) navReg.classList.remove("hidden");
        if(navAdmin) navAdmin.classList.remove("hidden"); // Admin látja az admin fület
        if(navKata) navKata.classList.remove("hidden");
        if(navBracket) navBracket.classList.remove("hidden");
        if(dojoMezo) dojoMezo.disabled = false;
        // ÚJ: Adminnál betöltjük a versenykezelő listát
        if (typeof frissitVersenyListat === "function") frissitVersenyListat();
    } 
    else if (aktualisFelhasznalo.szerepkor === "judge") {
        if(adminControls) adminControls.classList.add("hidden");
        if(navReg) navReg.classList.add("hidden");
        if(navKata) navKata.classList.remove("hidden");
        if(navBracket) navBracket.classList.remove("hidden");
    }
    else if (aktualisFelhasznalo.szerepkor === "coach") {
        if(adminControls) adminControls.classList.add("hidden");
        if(navReg) navReg.classList.remove("hidden");
        if(navKata) navKata.classList.add("hidden");
        if(navBracket) navBracket.classList.add("hidden");
        if(dojoMezo) { dojoMezo.value = aktualisFelhasznalo.klub; dojoMezo.disabled = true; }
    } 
    else if (aktualisFelhasznalo.szerepkor === "guest") {
        if(adminControls) adminControls.classList.add("hidden");
        if(navReg) navReg.classList.add("hidden");
        if(navKata) navKata.classList.add("hidden");
        if(navBracket) navBracket.classList.add("hidden");
    }

    // Adatok betöltése (Eredeti hívások)
    if (typeof letoltVersenyzoketABazisbol === "function") letoltVersenyzoketABazisbol();
    if (typeof letoltKategoriakatABazisbol === "function") letoltKategoriakatABazisbol();
    
    if (typeof letoltAllapotABazisbol === "function") {
        letoltAllapotABazisbol();
        if (aktualisFelhasznalo.szerepkor === "guest") { setInterval(letoltAllapotABazisbol, 5000); }
    }

    const urlParams = new URLSearchParams(window.location.search);
    var celFul = urlParams.get('tab') || 'kategoriak';
    
    // Védelem: Ha nem admin/judge akarna tiltott fülre menni
    if ((aktualisFelhasznalo.szerepkor === "coach" || aktualisFelhasznalo.szerepkor === "guest") && 
        (celFul === "kata" || celFul === "bracket" || celFul === "admin")) {
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

/* ========================================================================= */
/* ÚJ FUNKCIÓK AZ ADMIN FÜLHÖZ (Ezeket adtuk hozzá)                         */
/* ========================================================================= */

function mentUjVersenyt() {
    const nev = document.getElementById('new-v-name').value;
    const datum = document.getElementById('new-v-date').value;
    if (!nev || !datum) { alert("Töltsd ki mindkét mezőt!"); return; }

    fetch('api.php?akcio=ujVersenyMentese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nev: nev, datum: datum })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.uzenet);
        document.getElementById('new-v-name').value = "";
        document.getElementById('new-v-date').value = "";
        frissitVersenyListat();
    });
}

function toroljMindent() {
    if (confirm("🚨 FIGYELEM! Ez MINDEN nevezést és versenyzőt töröl az adatbázisból! Biztos?")) {
        fetch('api.php?akcio=torles').then(res => res.json()).then(data => {
            alert(data.uzenet); location.reload();
        });
    }
}

function torolVersenyt(id) {
    if (confirm("🗑️ Biztosan törölni akarod ezt a versenyt és az összes eredményét?")) {
        fetch('api.php?akcio=versenyTorles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verseny_id: id })
        }).then(() => frissitVersenyListat());
    }
}

function frissitVersenyListat() {
    const listaKontener = document.getElementById('admin-verseny-lista');
    if (!listaKontener) return;

    fetch('api.php?akcio=versenyekLekerdezese')
        .then(res => res.json())
        .then(versenyek => {
            if (versenyek.length === 0) {
                listaKontener.innerHTML = '<p class="text-gray-500 italic">Nincsenek rögzített versenyek.</p>';
                return;
            }
            let html = '<table class="w-full text-left bg-white border"><thead><tr class="bg-gray-100"><th class="p-2">Verseny</th><th class="p-2 text-center">Művelet</th></tr></thead><tbody>';
            versenyek.forEach(v => {
                html += `<tr class="border-t"><td class="p-2"><b>${v.nev}</b><br><small>${v.datum}</small></td>
                <td class="p-2 text-center"><button onclick="torolVersenyt(${v.verseny_id})" class="bg-red-500 text-white px-3 py-1 rounded">Törlés</button></td></tr>`;
            });
            listaKontener.innerHTML = html + '</tbody></table>';
        });
}