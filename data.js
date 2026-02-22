// ==========================================
// 1. ADATBÁZIS: KATEGÓRIÁK ÉS TATAMIK
// ==========================================
var OSSZES_KATEGORIA = [];

function letoltKategoriakatABazisbol() {
    fetch('api.php?akcio=kategoriakLekerdezese', { cache: 'no-store' })
        .then(function (valasz) { return valasz.json(); })
        .then(function (szerverAdatok) {
            OSSZES_KATEGORIA = szerverAdatok;
            if (typeof rajzolKategoriakTablazatot === "function") rajzolKategoriakTablazatot();
        })
        .catch(function (hiba) { console.error("Hiba a kategóriák letöltésekor:", hiba); });
}

const FELHASZNALOK = [
    { felhasznalonev: 'KoloMarki', jelszo: '1234', szerepkor: 'admin', klub: 'admin', nev: 'Admin' },
    { felhasznalonev: 'A tatami', jelszo: 'A-tatami', szerepkor: 'judge', klub: '-', nev: 'A_Tatami' },
    { felhasznalonev: 'Balint.Tornai', jelszo: '1234', szerepkor: 'coach', klub: 'Vácrátóti HSE', nev: 'Tornai Balint' }
];

var adatok = { versenyzok: [], meccsek: [] };
var aktualisFelhasznalo = null;

function letoltVersenyzoketABazisbol() {
    fetch('api.php?akcio=lekerdezes', { cache: 'no-store' })
        .then(function (valasz) { return valasz.json(); })
        .then(function (szerverAdatok) { adatok.versenyzok = szerverAdatok; rajzolVersenyzokListajat(); })
        .catch(function (hiba) { console.error("Adatbázis hiba:", hiba); });
}

function toroljMindent() {
    var biztos = confirm("Mindent törölsz a MySQL adatbázisból ÉS az ágrajzokból? Ez nem visszavonható!");
    if (biztos === true) {
        fetch('api.php?akcio=torles', { method: 'POST' })
            .then(function (valasz) { return valasz.json(); })
            .then(function (eredmeny) {
                if (eredmeny.hiba) alert("HIBA: " + eredmeny.hiba);
                else alert(eredmeny.uzenet);
                befejezTeljesTorlest();
            })
            .catch(function (hiba) { console.error("Szerver hiba:", hiba); befejezTeljesTorlest(); });
    }
}

function befejezTeljesTorlest() {
    localStorage.removeItem('iko_db'); localStorage.removeItem('iko_kata_db'); localStorage.removeItem('iko_kata_status');
    letoltVersenyzoketABazisbol(); valtFul('kategoriak');
    document.getElementById('player-list').innerHTML = "";
    if (document.getElementById('bracket-view')) document.getElementById('bracket-view').innerHTML = "";
    if (document.getElementById('kata-content')) document.getElementById('kata-content').innerHTML = "";
}

function frissitKategoriaLegordulot() {
    var nem = document.getElementById("p-gender").value;
    var kor = parseInt(document.getElementById("p-age").value);
    var valaszto = document.getElementById("p-cat");
    valaszto.innerHTML = "";

    if (!OSSZES_KATEGORIA || OSSZES_KATEGORIA.length === 0) { valaszto.innerHTML = "<option value=''>Kategóriák betöltése folyamatban...</option>"; letoltKategoriakatABazisbol(); return; }
    if (nem === "" || isNaN(kor)) { valaszto.innerHTML = "<option value=''>Előbb adja meg a kort és a nemet!</option>"; return; }

    var szurt = OSSZES_KATEGORIA.filter(function (akt) {
        var minK = parseInt(akt.minKor || akt.minkor || 0); var maxK = parseInt(akt.maxKor || akt.maxkor || 99);
        var n = akt.nem || akt.Nem || "";
        return (n === nem || n === "Vegyes" || n === "Open") && (kor >= minK && kor <= maxK);
    });

    if (szurt.length === 0) { valaszto.innerHTML = "<option value=''>Nincs találat</option>"; return; }

    var kumiteCsoport = document.createElement("optgroup"); kumiteCsoport.label = "KUMITE";
    var kataCsoport = document.createElement("optgroup"); kataCsoport.label = "KATA";

    for (var j = 0; j < szurt.length; j++) {
        var ujOpcio = document.createElement("option");
        var nev = szurt[j].nev || szurt[j].Nev;
        ujOpcio.value = nev; ujOpcio.innerText = nev;
        if ((szurt[j].tipus || szurt[j].Tipus) === "KUMITE") kumiteCsoport.appendChild(ujOpcio); else kataCsoport.appendChild(ujOpcio);
    }
    if (kumiteCsoport.children.length > 0) valaszto.appendChild(kumiteCsoport);
    if (kataCsoport.children.length > 0) valaszto.appendChild(kataCsoport);
}

function hozzaadVersenyzot() {
    if (aktualisFelhasznalo.szerepkor !== "admin" && aktualisFelhasznalo.szerepkor !== "coach") { alert("Nincs jogod ehhez!"); return; }
    var nevDoboz = document.getElementById("p-name");
    var versenyzoNeve = nevDoboz.value.trim();
    var kivalasztottKategoria = document.getElementById("p-cat").value;

    if (versenyzoNeve === "" || kivalasztottKategoria === "") { alert("Hiányos adatok!"); return; }

    var ujVersenyzo = {
        nev: versenyzoNeve, klub: document.getElementById("p-dojo").value, kategoria: kivalasztottKategoria,
        suly: document.getElementById("p-weight").value, kor: document.getElementById("p-age").value, tulajdonos: aktualisFelhasznalo.felhasznalonev
    };

    fetch('api.php?akcio=ujNevezes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ujVersenyzo) })
        .then(function (valasz) { return valasz.json(); })
        .then(function () { letoltVersenyzoketABazisbol(); nevDoboz.value = ""; })
        .catch(function (hiba) { alert("Szerver hiba!"); console.error(hiba); });
}

function rajzolVersenyzokListajat() {
    var listaElem = document.getElementById("player-list"); listaElem.innerHTML = "";
    if (aktualisFelhasznalo === null || !adatok.versenyzok) return;

    var miketMutassunk = aktualisFelhasznalo.szerepkor === "admin" ? adatok.versenyzok : adatok.versenyzok.filter(e => e.tulajdonos === aktualisFelhasznalo.felhasznalonev);

    for (var j = 0; j < miketMutassunk.length; j++) {
        var m = miketMutassunk[j];
        listaElem.innerHTML += '<li style="border-bottom: 1px solid #ccc; padding: 5px; display: flex; justify-content: space-between; font-size: 14px;"><span><b>' + m.nev + '</b> (' + m.klub + ')</span><span style="color: #CE1126; font-weight: bold;">' + m.kategoria + '</span></li>';
    }
}

// ÚJ: KATTINTHATÓ LINKKÉ ALAKÍTOTT KATEGÓRIA/TATAMI TÁBLA
function rajzolKategoriakTablazatot() {
    var tablaTorzs = document.getElementById("kategoria-tabla-torzs");
    if (!tablaTorzs) return; tablaTorzs.innerHTML = "";

    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var kategoria = OSSZES_KATEGORIA[i];
        var nev = kategoria.nev || kategoria.Nev;
        var tipus = kategoria.tipus || kategoria.Tipus;

        var katHtml = '<span style="cursor:pointer; color:#2563eb; font-weight:900; text-decoration:underline;" onclick="megnyitEgyediKategoriat(\'' + nev + '\', \'' + tipus + '\')">' + nev + '</span>';
        var tatamiHtml = "<span style='color: #9ca3af; font-style: italic;'>Még nincs beosztva</span>";

        if (kategoria.tatami) {
            tatamiHtml = '<span style="cursor:pointer; color:#CE1126; font-weight:bold; text-decoration:underline;" onclick="mutasdTatamiNezetet(\'' + kategoria.tatami + '\')">' + kategoria.tatami + '</span>';
        }
        tablaTorzs.innerHTML += '<tr><td class="kategoria-tabla-cella" style="border-bottom:1px solid #e5e7eb;">' + katHtml + '</td><td class="kategoria-tabla-cella" style="border-bottom:1px solid #e5e7eb;">' + tatamiHtml + '</td></tr>';
    }
}

function megnyitEgyediKategoriat(nev, tipus) {
    var sel = document.getElementById('p-cat');
    if (sel) {
        var opt = Array.from(sel.options).find(o => o.value === nev);
        if (!opt) { opt = document.createElement("option"); opt.value = nev; opt.innerText = nev; sel.appendChild(opt); }
        sel.value = nev;
    }
    if (tipus === 'KUMITE') { if (typeof rajzolAgrajz === "function") rajzolAgrajz(); valtFul('bracket'); }
    else { if (typeof rajzolKata === "function") rajzolKata(); valtFul('kata'); }
}

// ÚJ: EREDMÉNY GENERÁLÓ (TOP 4 kiszámítása a memóriából)
function mutasdEredmenyeket() {
    var tartalom = document.getElementById('eredmenyek-content'); tartalom.innerHTML = "";
    if (!OSSZES_KATEGORIA || OSSZES_KATEGORIA.length === 0) { tartalom.innerHTML = "<p>Nincs adat.</p>"; return; }

    var html = "";
    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var kat = OSSZES_KATEGORIA[i];
        var nev = kat.nev || kat.Nev;
        var tipus = kat.tipus || kat.Tipus;
        var dobogo = { a: "-", e: "-", b1: "-", b2: "-" }; var van = false;

        if (tipus !== "KUMITE" && adatok.kata && adatok.kata[nev]) {
            if (adatok.kataStatus && adatok.kataStatus[nev] === 'donto_rendezve') {
                van = true; var kl = adatok.kata[nev];
                if (kl[0]) dobogo.a = kl[0].versenyzo.nev + " (" + kl[0].versenyzo.klub + ")";
                if (kl[1]) dobogo.e = kl[1].versenyzo.nev + " (" + kl[1].versenyzo.klub + ")";
                if (kl[2]) dobogo.b1 = kl[2].versenyzo.nev + " (" + kl[2].versenyzo.klub + ")";
                if (kl[3]) dobogo.b2 = kl[3].versenyzo.nev + " (" + kl[3].versenyzo.klub + ")";
            }
        } else if (tipus === "KUMITE" && adatok.meccsek) {
            var kMeccsek = adatok.meccsek.filter(m => m.kategoria === nev);
            var donto = kMeccsek.find(m => m.nextId === null);
            if (donto && donto.winner) {
                van = true;
                dobogo.a = donto.winner.nev + " (" + donto.winner.klub + ")";
                dobogo.e = (donto.winner.id === donto.aka.id) ? donto.shiro.nev + " (" + donto.shiro.klub + ")" : donto.aka.nev + " (" + donto.aka.klub + ")";
                var elodontok = kMeccsek.filter(m => m.nextId === donto.id);
                if (elodontok[0] && elodontok[0].winner) dobogo.b1 = (elodontok[0].winner.id === elodontok[0].aka.id) ? elodontok[0].shiro.nev : elodontok[0].aka.nev;
                if (elodontok[1] && elodontok[1].winner) dobogo.b2 = (elodontok[1].winner.id === elodontok[1].aka.id) ? elodontok[1].shiro.nev : elodontok[1].aka.nev;
            }
        }
        if (van) {
            html += '<div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px; border-left:5px solid #CE1126; color:#1a1a1a;">';
            html += '<h3 style="font-weight:900; margin-top:0;">' + nev + '</h3>';
            html += '<p style="color:#ca8a04; margin:2px 0;">🥇 1. Hely: <b>' + dobogo.a + '</b></p>';
            html += '<p style="color:#64748b; margin:2px 0;">🥈 2. Hely: <b>' + dobogo.e + '</b></p>';
            html += '<p style="color:#b45309; margin:2px 0;">🥉 3. Hely: <b>' + dobogo.b1 + '</b></p>';
            if (dobogo.b2 !== "-") html += '<p style="color:#b45309; margin:2px 0;">🥉 3. Hely: <b>' + dobogo.b2 + '</b></p>';
            html += '</div>';
        }
    }
    tartalom.innerHTML = html === "" ? "<p style='color:#1a1a1a;'>Még nincsenek befejezett kategóriák.</p>" : html;
}