var OSSZES_KATEGORIA = [];
var adatok = { versenyzok: [], meccsek: [] };
var aktualisFelhasznalo = null;
var OSSZES_VERSENY = [];
var AKTIV_VERSENY_ID = 1;

// 1. FÜLEK VÁLTÁSA
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
            frissitNevezesFelulete();
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

    if (!adatok.versenyzok || adatok.versenyzok.length === 0) {
        listaElem.innerHTML = "<li style='padding: 5px; color: gray;'>Még nincs nevező a versenyen.</li>";
        return;
    }

    var miketMutassunk = adatok.versenyzok;

    if (aktualisFelhasznalo !== null && aktualisFelhasznalo.szerepkor === 'coach') {
        miketMutassunk = adatok.versenyzok.filter(e => e.klub === aktualisFelhasznalo.klub);
    }

    if (miketMutassunk.length === 0) {
        listaElem.innerHTML = "<li style='padding: 5px; color: gray;'>A te klubodból még nincs nevező.</li>";
        return;
    }

    var htmlGyujto = "";
    for (var j = 0; j < miketMutassunk.length; j++) {
        var m = miketMutassunk[j];
        var sulySzoveg = m.kategoria.toLowerCase().includes('kata') ? "" : `<span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:12px; font-weight:bold; margin-left:10px; color:#1a1a1a;">⚖️ ${m.suly || '0.0'} kg</span>`;

        htmlGyujto += `<li style="border-bottom: 1px solid #ccc; padding: 5px; display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
            <span><b>${m.nev}</b> (${m.klub}) ${sulySzoveg}</span>
            <span style="color: #CE1126; font-weight: bold;">${m.kategoria}</span>
        </li>`;
    }
    listaElem.innerHTML = htmlGyujto;
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

// 7. NEVEZÉS LEZÁRÁSA ÉS ÚJRANYITÁSA
function frissitNevezesFelulete() {
    var v_id = document.getElementById('p-verseny') ? document.getElementById('p-verseny').value : (AKTIV_VERSENY_ID || 1);
    var aktivV = OSSZES_VERSENY.find(v => String(v.verseny_id) === String(v_id));
    if (!aktivV) return;

    var urlap = document.getElementById('nevezes-urlap-tarolo');
    var uzenet = document.getElementById('nevezes-lezarva-uzenet');
    var adminGomb = document.getElementById('btn-toggle-nevezes');

    if (String(aktivV.nevezes_lezarva) === "1") {
        if (urlap) urlap.classList.add('hidden');
        if (uzenet) uzenet.classList.remove('hidden');
        if (adminGomb) {
            adminGomb.innerText = "🔓 Nevezés Újranyitása";
            adminGomb.className = "bg-green-500 text-white font-bold py-2 px-4 rounded w-full cursor-pointer";
        }
    } else {
        if (urlap) urlap.classList.remove('hidden');
        if (uzenet) uzenet.classList.add('hidden');
        if (adminGomb) {
            adminGomb.innerText = "🔒 Nevezés Lezárása";
            adminGomb.className = "bg-red-500 text-white font-bold py-2 px-4 rounded w-full cursor-pointer";
        }
    }
}

function valtoztatNevezesAllapotot() {
    var v_id = document.getElementById('p-verseny').value;
    var aktivV = OSSZES_VERSENY.find(v => String(v.verseny_id) === String(v_id));
    if (!aktivV) return;

    var ujAllapot = String(aktivV.nevezes_lezarva) === "1" ? 0 : 1;
    var kerdes = ujAllapot === 1 ? "Biztosan LEZÁROD a nevezést ehhez a versenyhez?" : "Biztosan ÚJRANYITOD a nevezést ehhez a versenyhez?";

    if (confirm(kerdes)) {
        fetch('api.php?akcio=nevezesAllapotModositas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verseny_id: v_id, allapot: ujAllapot })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.uzenet);
                letoltVersenyeketABazisbol();
            });
    }
}

// =========================================================================
// 8. ELŐ-SORSOLÁS (KIEMELÉS, MANUÁLIS TÍPUS ÉS KATEGÓRIA ÁTSOROLÁS)
// =========================================================================

var utolsoRendezes = { oszlop: 'kategoria', irany: 1 };

function rajzolKiemelesTablazatot(oszlop) {
    var tablaTorzs = document.getElementById('kiemeles-tabla-torzs');
    if (!tablaTorzs) return;

    if (utolsoRendezes.oszlop === oszlop) utolsoRendezes.irany *= -1;
    else { utolsoRendezes.oszlop = oszlop; utolsoRendezes.irany = 1; }

    var alapLista = adatok.versenyzok.filter(v => !v.kategoria.toLowerCase().includes('kata'));
    if (!adatok.kategoriaTipusok) adatok.kategoriaTipusok = {};

    var kategoriaLetszam = {};
    alapLista.forEach(v => { kategoriaLetszam[v.kategoria] = (kategoriaLetszam[v.kategoria] || 0) + 1; });

    var szuroMezo = document.getElementById('kiemeles-kategoria-szuro');
    var kivalasztottKat = szuroMezo ? szuroMezo.value : "";

    var beallitasokDiv = document.getElementById('kat-beallitasok');
    var tipusSelect = document.getElementById('kat-tipus-select');

    var osszesKumiteKat = OSSZES_KATEGORIA.filter(k => k.tipus === 'KUMITE' || (!k.nev.toLowerCase().includes('kata'))).map(k => k.nev).sort();

    if (szuroMezo) {
        var egyediKategoriak = [...new Set(alapLista.map(v => v.kategoria))].sort();
        var opciokHtml = '<option value="">Mindegyik kategória (Válassz egyet a beállításokhoz!)</option>';
        egyediKategoriak.forEach(k => {
            var letszam = kategoriaLetszam[k];
            var figy = letszam === 1 ? " ⚠️(1 fő)" : "";
            var isSelected = (k === kivalasztottKat) ? "selected" : "";
            opciokHtml += `<option value="${k}" ${isSelected}>${k}${figy}</option>`;
        });
        szuroMezo.innerHTML = opciokHtml;
    }

    if (kivalasztottKat !== "") {
        if (beallitasokDiv) beallitasokDiv.classList.remove('hidden');
        if (tipusSelect) tipusSelect.value = adatok.kategoriaTipusok[kivalasztottKat] || "auto";
    } else {
        if (beallitasokDiv) beallitasokDiv.classList.add('hidden');
    }

    var lista = alapLista.filter(v => kivalasztottKat === "" || v.kategoria === kivalasztottKat);

    lista.sort((a, b) => {
        var ertekA = a[oszlop] || ""; var ertekB = b[oszlop] || "";
        if (oszlop === 'kiemelt') { return (parseInt(a.kiemelt || 0) - parseInt(b.kiemelt || 0)) * utolsoRendezes.irany; }
        return ertekA.toString().localeCompare(ertekB.toString()) * utolsoRendezes.irany;
    });

    var htmlGyujto = "";
    lista.forEach(v => {
        var isKiemelt = (String(v.kiemelt) === "1") ? "checked" : "";
        var egyedulVan = kategoriaLetszam[v.kategoria] === 1;
        var sorHatter = egyedulVan ? "background-color: #fee2e2;" : "";
        var katSzin = egyedulVan ? "color: #b91c1c;" : "color: #2563eb;";
        var extraSzoveg = egyedulVan ? " <span style='font-size:12px; color: #dc2626;'>⚠️(1 fő)</span>" : "";

        var katSelectHtml = `<select onchange="allitKategoriat(${v.id}, '${v.kategoria}', this.value)" style="padding: 2px 5px; border-radius: 4px; border: 1px solid #cbd5e1; background: transparent; font-weight: bold; ${katSzin} cursor: pointer; max-width: 250px;">`;
        osszesKumiteKat.forEach(kNev => {
            var sel = (kNev === v.kategoria) ? "selected" : "";
            katSelectHtml += `<option value="${kNev}" ${sel} style="color: black;">${kNev}</option>`;
        });
        katSelectHtml += `</select>`;

        var sulyJelzo = `<span style="color: #eab308; background: #1f2937; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 8px;">⚖️ ${v.suly || '0.0'} kg</span>`;

        htmlGyujto += `
            <tr style="border-bottom: 1px solid #e2e8f0; ${sorHatter}">
                <td class="p-3 text-center"><input type="checkbox" style="width:20px; height:20px; cursor:pointer;" onchange="allitKiemelest(${v.id}, this.checked)" ${isKiemelt}></td>
                <td class="p-3 font-bold text-gray-800">${v.nev} ${sulyJelzo}</td>
                <td class="p-3 text-gray-600">${v.klub}</td>
                <td class="p-3">${katSelectHtml}${extraSzoveg}</td>
            </tr>`;
    });
    tablaTorzs.innerHTML = htmlGyujto;
}

function allitKategoriat(versenyzoId, regiKategoriaNev, ujKategoriaNev) {
    if (!confirm("Biztosan áthelyezed ezt a versenyzőt a(z) " + ujKategoriaNev + " kategóriába?")) {
        rajzolKiemelesTablazatot(utolsoRendezes.oszlop);
        return;
    }

    var vIndex = adatok.versenyzok.findIndex(v => String(v.id) === String(versenyzoId) && v.kategoria === regiKategoriaNev);
    if (vIndex !== -1) adatok.versenyzok[vIndex].kategoria = ujKategoriaNev;

    rajzolKiemelesTablazatot(utolsoRendezes.oszlop);

    fetch('api.php?akcio=kategoriaModositas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versenyzo_id: versenyzoId, regi_kategoria: regiKategoriaNev, uj_kategoria: ujKategoriaNev })
    }).catch(err => console.error("Hiba a kategória mentésekor!", err));
}

function mentsKategoriaTipust() {
    var kat = document.getElementById('kiemeles-kategoria-szuro').value;
    var tip = document.getElementById('kat-tipus-select').value;
    if (kat) {
        if (!adatok.kategoriaTipusok) adatok.kategoriaTipusok = {};
        adatok.kategoriaTipusok[kat] = tip;
    }
}

function allitKiemelest(versenyzoId, isChecked) {
    var ujErtek = isChecked ? 1 : 0;
    var vIndex = adatok.versenyzok.findIndex(v => String(v.id) === String(versenyzoId));
    if (vIndex !== -1) adatok.versenyzok[vIndex].kiemelt = ujErtek;
    fetch('api.php?akcio=kiemelesModositas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versenyzo_id: versenyzoId, kiemelt: ujErtek })
    });
}

// =========================================================================
// 9. AUTOMATIKUS SÚLYCSOPORT GENERÁTOR (Okos szétvágás 10kg-os sávokra)
// =========================================================================

function generalSulycsoportokat() {
    if (!confirm("Biztosan automatikusan szétvágod a kategóriákat 10kg-os súlycsoportokra (-50kg, -60kg, stb.)?\nA kis létszámú (2 fő vagy alatti) csoportokat a rendszer automatikusan összevonja a legközelebbi súlycsoporttal!")) return;

    var csakKumiteVersenyzok = adatok.versenyzok.filter(v => {
        var katNev = v.kategoria.toLowerCase();
        return !katNev.includes('kata') && !katNev.includes('open');
    });

    var katCsoportok = {};

    csakKumiteVersenyzok.forEach(v => {
        if (!katCsoportok[v.kategoria]) katCsoportok[v.kategoria] = [];
        katCsoportok[v.kategoria].push(v);
    });

    var payload = { kategoriak_uj: [] };

    for (var katNev in katCsoportok) {
        var jatekosok = katCsoportok[katNev];
        if (jatekosok.length <= 2) continue;

        var vodrok = {};
        jatekosok.forEach(v => {
            var suly = parseFloat(v.suly || 0);
            if (suly === 0) suly = 50;

            var hatar = Math.ceil(suly / 10) * 10;
            if (hatar < 30) hatar = 30;

            if (!vodrok[hatar]) vodrok[hatar] = [];
            vodrok[hatar].push(v);
        });

        var vodrokTomb = Object.keys(vodrok).map(k => ({ hatar: parseInt(k), versenyzok: vodrok[k] })).sort((a, b) => a.hatar - b.hatar);

        if (vodrokTomb.length <= 1) continue;

        var voltOsszevonas = true;
        while (voltOsszevonas && vodrokTomb.length > 1) {
            voltOsszevonas = false;
            for (var i = 0; i < vodrokTomb.length; i++) {
                if (vodrokTomb[i].versenyzok.length <= 2) {
                    var celIndex = -1;
                    if (i === 0) {
                        celIndex = 1;
                    } else if (i === vodrokTomb.length - 1) {
                        celIndex = i - 1;
                    } else {
                        if (vodrokTomb[i - 1].versenyzok.length <= vodrokTomb[i + 1].versenyzok.length) {
                            celIndex = i - 1;
                        } else {
                            celIndex = i + 1;
                        }
                    }

                    vodrokTomb[celIndex].versenyzok = vodrokTomb[celIndex].versenyzok.concat(vodrokTomb[i].versenyzok);
                    vodrokTomb[celIndex].hatar = Math.max(vodrokTomb[celIndex].hatar, vodrokTomb[i].hatar);

                    vodrokTomb.splice(i, 1);
                    voltOsszevonas = true;
                    break;
                }
            }
        }

        if (vodrokTomb.length <= 1) continue;

        for (var i = 0; i < vodrokTomb.length; i++) {
            var ujNev = katNev;
            var isLast = (i === vodrokTomb.length - 1);

            if (!isLast) {
                ujNev += " -" + vodrokTomb[i].hatar + "kg";
            } else {
                var elozoHatar = vodrokTomb[i - 1].hatar;
                ujNev += " +" + elozoHatar + "kg";
            }

            payload.kategoriak_uj.push({
                regi_nev: katNev,
                uj_nev: ujNev,
                versenyzok: vodrokTomb[i].versenyzok.map(v => v.id)
            });
        }
    }

    if (payload.kategoriak_uj.length === 0) {
        alert("Nem volt mit szétvágni (vagy a kevés létszám miatt a rendszer automatikusan egyben hagyta őket)!");
        return;
    }

    var erintettKategoriak = [...new Set(payload.kategoriak_uj.map(k => k.regi_nev))];
    adatok.meccsek = adatok.meccsek.filter(m => !erintettKategoriak.includes(m.kategoria));
    if (typeof mentsdAzAllapototMySQLbe === "function") mentsdAzAllapototMySQLbe();

    fetch('api.php?akcio=automatikusSulycsoportok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(r => r.json())
        .then(d => {
            alert(d.uzenet);
            letoltVersenyzoketABazisbol();
            letoltKategoriakatABazisbol();
            letoltAllapotABazisbol();
        })
        .catch(e => console.error("Hiba a bontáskor:", e));
}