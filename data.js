var OSSZES_KATEGORIA = [];
var adatok = { versenyzok: [], meccsek: [] };
var aktualisFelhasznalo = null;
var OSSZES_VERSENY = [];
var AKTIV_VERSENY_ID = 1;

// 1. FÜLEK VÁLTÁSA (Ez hiányzott, emiatt lett szürke a képernyő!)
function valtFul(fulNeve) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    var cel = document.getElementById('tab-' + fulNeve);
    if (cel) cel.classList.remove('hidden');

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('tab', fulNeve);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);

    if (fulNeve === 'eredmenyek') { mutasdEredmenyeket(); }
}

// 2. KATEGÓRIÁK LETÖLTÉSE ÉS KIRAJZOLÁSA
function letoltKategoriakatABazisbol() {
    fetch('api.php?akcio=kategoriakLekerdezese', { cache: 'no-store' })
        .then(valasz => valasz.json())
        .then(szerverAdatok => {
            OSSZES_KATEGORIA = szerverAdatok;
            if (typeof rajzolKategoriakTablazatot === "function") rajzolKategoriakTablazatot();
        })
        .catch(hiba => console.error("Hiba a kategóriák letöltésekor:", hiba));
}

function rajzolKategoriakTablazatot() {
    var tablaTorzs = document.getElementById("kategoria-tabla-torzs");
    if (!tablaTorzs) return; tablaTorzs.innerHTML = "";

    for (var i = 0; i < OSSZES_KATEGORIA.length; i++) {
        var kategoria = OSSZES_KATEGORIA[i];
        var tipusStr = (kategoria.nev && kategoria.nev.toLowerCase().includes("kata")) ? "KATA" : "KUMITE";
        var katHtml = '<span style="cursor:pointer; color:#2563eb; font-weight:900; text-decoration:underline;" onclick="megnyitEgyediKategoriat(\'' + kategoria.nev + '\', \'' + tipusStr + '\')">' + kategoria.nev + '</span>';
        var tatamiHtml = kategoria.tatami ? '<span style="cursor:pointer; color:#CE1126; font-weight:bold; text-decoration:underline;" onclick="mutasdTatamiNezetet(\'' + kategoria.tatami + '\')">' + kategoria.tatami + '</span>' : "<span style='color: #9ca3af; font-style: italic;'>Még nincs beosztva</span>";
        tablaTorzs.innerHTML += '<tr><td class="kategoria-tabla-cella" style="border-bottom:1px solid #e5e7eb;">' + katHtml + '</td><td class="kategoria-tabla-cella" style="border-bottom:1px solid #e5e7eb;">' + tatamiHtml + '</td></tr>';
    }
}

// 3. VERSENYEK ÉS VERSENYZŐK LETÖLTÉSE
function letoltVersenyeketABazisbol() {
    fetch('api.php?akcio=versenyekLekerdezese')
        .then(valasz => valasz.json())
        .then(adat => {
            OSSZES_VERSENY = adat;
            if (OSSZES_VERSENY.length > 0) {
                AKTIV_VERSENY_ID = OSSZES_VERSENY[0].verseny_id;
            }
            var regSel = document.getElementById('p-verseny');
            if (regSel) {
                regSel.innerHTML = "";
                OSSZES_VERSENY.forEach(v => {
                    regSel.innerHTML += '<option value="' + v.verseny_id + '">' + v.nev + ' (' + v.datum + ')</option>';
                });
                regSel.value = AKTIV_VERSENY_ID;
            }
            letoltVersenyzoketABazisbol();
        })
        .catch(hiba => console.error("Hiba a versenyek lekérésekor:", hiba));
}

document.addEventListener('DOMContentLoaded', letoltVersenyeketABazisbol);

function letoltVersenyzoketABazisbol() {
    var regSel = document.getElementById('p-verseny');
    var v_id = regSel && regSel.value ? regSel.value : (AKTIV_VERSENY_ID || 1);

    fetch('api.php?akcio=lekerdezes&verseny_id=' + v_id, { cache: 'no-store' })
        .then(valasz => valasz.json())
        .then(szerverAdatok => { adatok.versenyzok = szerverAdatok; rajzolVersenyzokListajat(); })
        .catch(hiba => console.error("Adatbázis hiba:", hiba));
}

function rajzolVersenyzokListajat() {
    var listaElem = document.getElementById("player-list");
    if (!listaElem) return;
    listaElem.innerHTML = "";
    if (aktualisFelhasznalo === null || !adatok.versenyzok) return;

    var miketMutassunk = aktualisFelhasznalo.szerepkor === "admin"
        ? adatok.versenyzok
        : adatok.versenyzok.filter(e => e.klub === aktualisFelhasznalo.klub);

    for (var j = 0; j < miketMutassunk.length; j++) {
        var m = miketMutassunk[j];
        listaElem.innerHTML += '<li style="border-bottom: 1px solid #ccc; padding: 5px; display: flex; justify-content: space-between; font-size: 14px;"><span><b>' + m.nev + '</b> (' + m.klub + ')</span><span style="color: #CE1126; font-weight: bold;">' + m.kategoria + '</span></li>';
    }
}

// 4. NEVEZÉS KATEGÓRIA SZŰRŐJE
function frissitKategoriaLegordulot() {
    var nem = document.getElementById("p-gender").value;
    var kor = parseInt(document.getElementById("p-age").value);
    var valaszto = document.getElementById("p-cat");
    if (!valaszto) return;
    valaszto.innerHTML = "";

    if (!OSSZES_KATEGORIA || OSSZES_KATEGORIA.length === 0) {
        valaszto.innerHTML = "<option value=''>Kategóriák betöltése...</option>";
        letoltKategoriakatABazisbol();
        return;
    }

    if (nem === "" || isNaN(kor)) {
        valaszto.innerHTML = "<option value=''>Előbb adja meg a kort és a nemet!</option>";
        return;
    }

    var szurt = OSSZES_KATEGORIA.filter(akt => {
        var minK = parseInt(akt.min_kor || 0);
        var maxK = parseInt(akt.max_kor || 99);
        var n = akt.nem || "";
        return (n === nem || n === "Vegyes" || n === "Open") && (kor >= minK && kor <= maxK);
    });

    if (szurt.length === 0) {
        valaszto.innerHTML = "<option value=''>Nincs megfelelő kategória ehhez a korhoz!</option>";
        return;
    }

    var kumiteCsoport = document.createElement("optgroup"); kumiteCsoport.label = "KUMITE";
    var kataCsoport = document.createElement("optgroup"); kataCsoport.label = "KATA";

    szurt.forEach(kat => {
        var ujOpcio = document.createElement("option");
        ujOpcio.value = kat.nev; ujOpcio.innerText = kat.nev;
        if (kat.tipus === "KUMITE") kumiteCsoport.appendChild(ujOpcio);
        else kataCsoport.appendChild(ujOpcio);
    });

    if (kumiteCsoport.children.length > 0) valaszto.appendChild(kumiteCsoport);
    if (kataCsoport.children.length > 0) valaszto.appendChild(kataCsoport);
}

function hozzaadVersenyzot() {
    if (aktualisFelhasznalo.szerepkor !== "admin" && aktualisFelhasznalo.szerepkor !== "coach") { alert("Nincs jogod ehhez!"); return; }
    var nevDoboz = document.getElementById("p-name");
    if (nevDoboz.value.trim() === "" || document.getElementById("p-cat").value === "") { alert("Hiányos adatok!"); return; }

    var regSel = document.getElementById('p-verseny');
    var v_id = regSel && regSel.value ? regSel.value : AKTIV_VERSENY_ID;

    var ujVersenyzo = {
        nev: nevDoboz.value.trim(),
        klub: document.getElementById("p-dojo").value,
        kategoria: document.getElementById("p-cat").value,
        verseny_id: v_id
    };

    fetch('api.php?akcio=ujNevezes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ujVersenyzo) })
        .then(valasz => valasz.json())
        .then(() => { letoltVersenyzoketABazisbol(); nevDoboz.value = ""; })
        .catch(hiba => alert("Szerver hiba!"));
}

// 5. EREDMÉNYEK KIÍRÁSA
function mutasdEredmenyeket(keresett_id = null) {
    var tartalom = document.getElementById('eredmenyek-content');
    if (!tartalom) return;

    var v_id = keresett_id ? keresett_id : AKTIV_VERSENY_ID;

    var htmlForm = `<div style="margin-bottom: 20px; background: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
        <label style="color: #9ca3af; font-weight: bold; margin-right: 15px; font-size: 14px;">Múltbeli eredmények archívuma:</label>
        <select onchange="mutasdEredmenyeket(this.value)" style="padding: 8px; border-radius: 4px; background: #374151; color: white; border: none; font-weight: bold; cursor: pointer;">`;

    OSSZES_VERSENY.forEach(v => {
        var sel = (String(v.verseny_id) === String(v_id)) ? "selected" : "";
        htmlForm += `<option value="${v.verseny_id}" ${sel}>${v.nev} (${v.datum})</option>`;
    });

    htmlForm += `</select></div><div id="eredmenyek-lista-tarolo"><p style='color:#1a1a1a; font-weight:bold;'>Eredmények betöltése...</p></div>`;
    tartalom.innerHTML = htmlForm;

    var listaTarolo = document.getElementById('eredmenyek-lista-tarolo');

    fetch('api.php?akcio=eredmenyekLekerdezese&verseny_id=' + v_id, { cache: 'no-store' })
        .then(valasz => valasz.json())
        .then(eredmenyek => {
            if (eredmenyek.length === 0) {
                listaTarolo.innerHTML = "<p style='color:#1a1a1a; font-style:italic;'>Ehhez a versenyhez még nincsenek véglegesített eredmények.</p>";
                return;
            }

            var katCsoportok = {};
            eredmenyek.forEach(e => {
                if (!katCsoportok[e.kategoria]) katCsoportok[e.kategoria] = [];
                katCsoportok[e.kategoria].push(e);
            });

            var html = "";
            for (var katNev in katCsoportok) {
                var dobogosok = katCsoportok[katNev];
                html += '<div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px; border-left:5px solid #CE1126; color:#1a1a1a; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">';
                html += '<h3 style="font-weight:900; margin-top:0;">' + katNev + '</h3>';

                dobogosok.forEach(d => {
                    var erme = ""; var szin = "";
                    if (d.helyezes === "1") { erme = "🥇 1."; szin = "#ca8a04"; }
                    else if (d.helyezes === "2") { erme = "🥈 2."; szin = "#64748b"; }
                    else if (d.helyezes === "3") { erme = "🥉 3."; szin = "#b45309"; }
                    html += '<p style="color:' + szin + '; margin:4px 0;">' + erme + ' Hely: <b>' + d.versenyzo_nev + ' (' + d.klub + ')</b></p>';
                });
                html += '</div>';
            }
            listaTarolo.innerHTML = html;
        })
        .catch(hiba => {
            console.error("Hiba az eredmények lekérésekor:", hiba);
            listaTarolo.innerHTML = "<p style='color:#CE1126;'>Hiba történt a szerverhez való kapcsolódáskor.</p>";
        });
}

// 6. EGYÉB FUNKCIÓK
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

function mentsdAzAllapototMySQLbe() {
    var mentes = { meccsek: adatok.meccsek, kata: adatok.kata, kataStatus: adatok.kataStatus };
    fetch('api.php?akcio=allapotMentes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mentes) });
}

function letoltAllapotABazisbol() {
    fetch('api.php?akcio=allapotLekerdezese', { cache: 'no-store' })
        .then(v => v.json()).then(szerver => {
            if (szerver.meccsek) adatok.meccsek = szerver.meccsek;
            if (szerver.kata) adatok.kata = szerver.kata;
            if (szerver.kataStatus) adatok.kataStatus = szerver.kataStatus;

            if (aktualisFelhasznalo && aktualisFelhasznalo.szerepkor === 'guest') {
                var aktivS = document.querySelector("section:not(.hidden)");
                if (aktivS) {
                    if (aktivS.id === 'tab-bracket' && typeof rajzolAgrajz === 'function') rajzolAgrajz();
                    if (aktivS.id === 'tab-kata' && typeof rajzolKata === 'function') rajzolKata();
                    if (aktivS.id === 'tab-eredmenyek' && typeof mutasdEredmenyeket === 'function') mutasdEredmenyeket();
                    if (aktivS.id === 'tab-tatami' && typeof mutasdTatamiNezetet === 'function') {
                        var c = document.getElementById('tatami-content').querySelector('h2');
                        if (c) mutasdTatamiNezetet(c.innerText.split(' -')[0]);
                    }
                }
            }
        });
}

function toroljMindent() {
    var biztos = confirm("Mindent törölsz a MySQL adatbázisból ÉS az ágrajzokból? Ez nem visszavonható!");
    if (biztos === true) {
        fetch('api.php?akcio=torles', { method: 'POST' })
            .then(valasz => valasz.json())
            .then(eredmeny => { alert(eredmeny.uzenet || eredmeny.hiba); befejezTeljesTorlest(); })
            .catch(hiba => befejezTeljesTorlest());
    }
}

function befejezTeljesTorlest() {
    letoltVersenyzoketABazisbol(); valtFul('kategoriak');
    var pList = document.getElementById('player-list'); if (pList) pList.innerHTML = "";
    var bView = document.getElementById('bracket-view'); if (bView) bView.innerHTML = "";
    var kCont = document.getElementById('kata-content'); if (kCont) kCont.innerHTML = "";
}