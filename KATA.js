function generalKata() {
    if (aktualisFelhasznalo.szerepkor !== 'admin') { alert("Csak admin generálhatja le a listát!"); return; }

    var kivalasztottKategoria = document.getElementById('p-cat').value;
    if (kivalasztottKategoria === "") { alert("Kérlek válassz ki egy kategóriát!"); return; }
    if (kivalasztottKategoria.includes('Kumite')) { alert("Ez Kumite kategória!"); return; }

    var jatekosok = adatok.versenyzok.filter(v => v.kategoria === kivalasztottKategoria);
    if (jatekosok.length === 0) { alert("Nincs versenyző!"); return; }

    if (!adatok.kata) adatok.kata = {}; if (!adatok.kataStatus) adatok.kataStatus = {};
    if (!adatok.kata[kivalasztottKategoria]) { adatok.kata[kivalasztottKategoria] = []; adatok.kataStatus[kivalasztottKategoria] = 'selejtezo'; }

    for (var j = 0; j < jatekosok.length; j++) {
        var sqlEmber = jatekosok[j]; var benneVanE = false;
        for (var k = 0; k < adatok.kata[kivalasztottKategoria].length; k++) {
            if (String(adatok.kata[kivalasztottKategoria][k].versenyzo.id) === String(sqlEmber.id)) { benneVanE = true; adatok.kata[kivalasztottKategoria][k].versenyzo.nev = sqlEmber.nev; adatok.kata[kivalasztottKategoria][k].versenyzo.klub = sqlEmber.klub; break; }
        }
        if (!benneVanE) {
            adatok.kata[kivalasztottKategoria].push({ versenyzo: sqlEmber, pontok: ["", "", "", "", ""], osszpont: 0, minPont1: 0, maxPont1: 0, pontokDonto: ["", "", "", "", ""], osszpontDonto: 0, minPontDonto: 0, maxPontDonto: 0 });
        }
    }
    localStorage.setItem('iko_kata_db', JSON.stringify(adatok.kata)); rajzolKata(); valtFul('kata');
}

function wkfSorbarendezes(a, b, isDonto) {
    var osszA = isDonto ? (a.osszpontDonto || 0) : (a.osszpont || 0); var osszB = isDonto ? (b.osszpontDonto || 0) : (b.osszpont || 0);
    var minA = isDonto ? (a.minPontDonto || 0) : (a.minPont1 || 0); var minB = isDonto ? (b.minPontDonto || 0) : (b.minPont1 || 0);
    var maxA = isDonto ? (a.maxPontDonto || 0) : (a.maxPont1 || 0); var maxB = isDonto ? (b.maxPontDonto || 0) : (b.maxPont1 || 0);
    if (osszB !== osszA) return osszB - osszA; if (minB !== minA) return minB - minA; if (maxB !== maxA) return maxB - maxA; return 0;
}

function sorbarendezSelejtezo() {
    var kategoria = document.getElementById('p-cat').value; if (!adatok.kata || !adatok.kata[kategoria]) return;
    var lista = adatok.kata[kategoria]; lista.sort((a, b) => wkfSorbarendezes(a, b, false));

    var voltDontetlen = false;
    for (var i = 1; i < lista.length; i++) {
        if (lista[i].osszpont > 0 && wkfSorbarendezes(lista[i - 1], lista[i], false) === 0) {
            alert("⚠️ TÖKÉLETES DÖNTETLEN!\n\nÚj Katát kell bemutatniuk! A pontjaikat a rendszer most automatikusan törli.");
            lista[i - 1].pontok = ["", "", "", "", ""]; lista[i - 1].osszpont = 0; lista[i - 1].minPont1 = 0; lista[i - 1].maxPont1 = 0;
            lista[i].pontok = ["", "", "", "", ""]; lista[i].osszpont = 0; lista[i].minPont1 = 0; lista[i].maxPont1 = 0; voltDontetlen = true;
        }
    }
    if (voltDontetlen) lista.sort((a, b) => wkfSorbarendezes(a, b, false));
    localStorage.setItem('iko_kata_db', JSON.stringify(adatok.kata)); rajzolKata();
}

function generalDonto() {
    var kat = document.getElementById('p-cat').value; if (!adatok.kata || !adatok.kata[kat]) return;
    adatok.kata[kat].sort((a, b) => wkfSorbarendezes(a, b, false)); adatok.kataStatus[kat] = 'donto';
    localStorage.setItem('iko_kata_db', JSON.stringify(adatok.kata)); localStorage.setItem('iko_kata_status', JSON.stringify(adatok.kataStatus)); rajzolKata();
}

function sorbarendezDonto() {
    var kategoria = document.getElementById('p-cat').value; if (!adatok.kata || !adatok.kata[kategoria]) return;
    adatok.kataStatus[kategoria] = 'donto_rendezve';
    var top6 = adatok.kata[kategoria].slice(0, 6); top6.sort((a, b) => wkfSorbarendezes(a, b, true));

    var voltDontetlen = false;
    for (var i = 1; i < top6.length; i++) {
        if (top6[i].osszpontDonto > 0 && wkfSorbarendezes(top6[i - 1], top6[i], true) === 0) {
            alert("🏆 DÖNTETLEN A DÖNTŐBEN!\n\nÚj Katát kell bemutatniuk!");
            top6[i - 1].pontokDonto = ["", "", "", "", ""]; top6[i - 1].osszpontDonto = 0; top6[i - 1].minPontDonto = 0; top6[i - 1].maxPontDonto = 0;
            top6[i].pontokDonto = ["", "", "", "", ""]; top6[i].osszpontDonto = 0; top6[i].minPontDonto = 0; top6[i].maxPontDonto = 0; voltDontetlen = true;
        }
    }
    if (voltDontetlen) top6.sort((a, b) => wkfSorbarendezes(a, b, true));
    for (var k = 0; k < 6; k++) adatok.kata[kategoria][k] = top6[k];
    localStorage.setItem('iko_kata_status', JSON.stringify(adatok.kataStatus)); localStorage.setItem('iko_kata_db', JSON.stringify(adatok.kata)); rajzolKata();
}

function rajzolKata() {
    var kategoria = document.getElementById('p-cat').value; var tartalom = document.getElementById('kata-content');
    if (!tartalom || !adatok.kata || !adatok.kata[kategoria]) return;

    var eredetiLista = adatok.kata[kategoria]; for (var k = 0; k < eredetiLista.length; k++) eredetiLista[k].helyezes1 = k + 1;
    var szerkeszthetE = (aktualisFelhasznalo !== null && (aktualisFelhasznalo.szerepkor === 'admin' || aktualisFelhasznalo.szerepkor === 'judge'));
    var isDontoGen = (adatok.kataStatus && (adatok.kataStatus[kategoria] === 'donto' || adatok.kataStatus[kategoria] === 'donto_rendezve'));

    var html = '';
    // GOMBOK ELREJTÉSE A KÖZÖNSÉG ELŐL
    if (szerkeszthetE) {
        html += '<div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">';
        html += '<button onclick="sorbarendezSelejtezo()" style="background: #3f3f46; color: white; padding: 10px 15px; border-radius: 5px; font-weight: bold; cursor: pointer;">🔄 1. Forduló Sorbarendezése</button>';
        if (!isDontoGen) html += '<button onclick="generalDonto()" style="background: #CE1126; color: white; padding: 10px 15px; border-radius: 5px; font-weight: bold; cursor: pointer;">🥋 Döntő (Top 6) Generálása</button>';
        html += '</div>';
    }

    html += '<div class="kata-tabla-tarolo" style="margin-bottom: 40px; border: 1px solid #d1d5db; border-top: 4px solid #1a1a1a;">';
    html += '<h3 style="background-color: #f3f4f6; color: #1a1a1a; padding: 12px; margin: 0; text-transform: uppercase; font-weight: 900;">1. Forduló (Selejtező)</h3>';
    html += '<div class="kata-sor" style="background-color: #1a1a1a; color: white; font-weight: bold;"><div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px;">Hely. | Versenyző Neve</div><div class="kata-beviteli-mezok" style="justify-content: center; gap: 5px;"><span style="width: 3rem; text-align:center;">B1</span><span style="width: 3rem; text-align:center;">B2</span><span style="width: 3rem; text-align:center;">B3</span><span style="width: 3rem; text-align:center;">B4</span><span style="width: 3rem; text-align:center;">B5</span></div><div style="width: 60px; text-align: right; font-weight: 900; color: #CE1126;">ÖSSZ</div></div>';

    // READ-ONLY VÉDELEM: A NÉZŐ NEM TUD BELEÍRNI A MEZŐKBE
    var readonlyAttr = szerkeszthetE ? "" : "disabled";

    for (var i = 0; i < eredetiLista.length; i++) {
        var adat = eredetiLista[i]; var v = adat.versenyzo; var hely = adat.helyezes1;
        var sorStilus = "border-bottom: 1px solid #e5e7eb;"; var nevStilus = "";
        if (hely <= 6 && adat.osszpont > 0) { sorStilus += " background-color: #f8fafc;"; nevStilus = "font-weight: bold; color: #1a1a1a;"; }
        if (hely === 6 && eredetiLista.length > 6) sorStilus += " border-bottom: 3px dashed #1a1a1a;";

        html += '<div class="kata-sor" style="' + sorStilus + '"><div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px; ' + nevStilus + '">' + hely + '. [' + v.id + '] ' + v.nev + ' <span style="font-size: 0.8em; color: #94a3b8;">(' + v.klub + ')</span></div><div class="kata-beviteli-mezok">';
        for (var b = 0; b < 5; b++) {
            var ertek = adat.pontok[b] || "";
            html += '<input type="number" step="0.1" min="5.0" max="8.5" class="score-input score-input-1" value="' + ertek + '" ' + readonlyAttr + ' oninput="okosKataPontBeiras(this, \'' + kategoria + '\', \'' + v.id + '\', ' + b + ', 1)" onblur="veglegesitMezot(this, \'' + kategoria + '\', \'' + v.id + '\', ' + b + ', 1)">';
        }
        var tieHtml = (adat.osszpont > 0 && i > 0 && wkfSorbarendezes(eredetiLista[i - 1], adat, false) === 0) ? '<span style="font-size: 10px; color: #CE1126; display: block; line-height: 1;">ÚJ KATA!</span>' : "";
        html += '</div><div style="width: 60px; text-align: right; font-weight: 900; font-size: 1.2rem; color: #1a1a1a;">' + tieHtml + '<span id="osszpont-1-' + v.id + '">' + adat.osszpont.toFixed(1) + '</span></div></div>';
    }
    html += '</div>';

    if (isDontoGen) {
        var top6 = eredetiLista.slice(0, 6); var dontoMegjelenites = top6.slice();
        if (adatok.kataStatus[kategoria] !== 'donto_rendezve') dontoMegjelenites.reverse();

        html += '<div class="kata-tabla-tarolo" style="border: 2px solid #1a1a1a; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">';
        html += '<div style="padding: 12px; background: #1a1a1a; border-bottom: 2px solid #CE1126; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">';
        html += '<h3 style="margin: 0; color: white; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em;">🥋 2. Forduló (Döntő - Top 6)</h3>';
        if (szerkeszthetE && adatok.kataStatus[kategoria] !== 'donto_rendezve') html += '<button onclick="sorbarendezDonto()" style="background: #CE1126; color: white; padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; border: 1px solid #fff;">✅ Végeredmény Sorbarendezése</button>';
        html += '</div>';

        html += '<div class="kata-sor" style="background-color: #f3f4f6; font-weight: bold; border-bottom: 1px solid #d1d5db;"><div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px; color: #1a1a1a;">Helyezés | Versenyző Neve</div><div class="kata-beviteli-mezok" style="justify-content: center; gap: 5px; color: #1a1a1a;"><span style="width: 3rem; text-align:center;">B1</span><span style="width: 3rem; text-align:center;">B2</span><span style="width: 3rem; text-align:center;">B3</span><span style="width: 3rem; text-align:center;">B4</span><span style="width: 3rem; text-align:center;">B5</span></div><div style="width: 60px; text-align: right; font-weight: 900; color: #CE1126;">DÖNTŐ</div></div>';

        for (var m = 0; m < dontoMegjelenites.length; m++) {
            var adatDonto = dontoMegjelenites[m]; var vDonto = adatDonto.versenyzo;
            var sorStilusDonto = "border-bottom: 1px solid #e5e7eb;"; var nevStilusDonto = ""; var helyDontoSzoveg = "Döntős";

            if (adatok.kataStatus[kategoria] === 'donto_rendezve') {
                var helyDonto = m + 1; helyDontoSzoveg = helyDonto + ".";
                if (helyDonto === 1) { nevStilusDonto = "color: #CE1126; font-weight: 900;"; sorStilusDonto += " background-color: #fef2f2;"; sorStilusDonto += " border-bottom: 3px solid #CE1126;"; }
                else if (helyDonto === 2) { nevStilusDonto = "color: #1a1a1a; font-weight: 900;"; sorStilusDonto += " background-color: #f8fafc;"; }
                else if (helyDonto === 3) { nevStilusDonto = "color: #3f3f46; font-weight: 900;"; sorStilusDonto += " background-color: #f4f4f5;"; }
            } else if (m === dontoMegjelenites.length - 1) sorStilusDonto += " border-bottom: 3px solid #CE1126;";

            html += '<div class="kata-sor" style="' + sorStilusDonto + '"><div class="kata-versenyzo-neve" style="flex-grow: 1; min-width: 200px; ' + nevStilusDonto + '">' + helyDontoSzoveg + ' [' + vDonto.id + '] ' + vDonto.nev + ' <span style="font-size: 0.8em; color: #94a3b8;">(1. kör: ' + adatDonto.helyezes1 + '.)</span></div><div class="kata-beviteli-mezok">';
            for (var bd = 0; bd < 5; bd++) {
                var ertekDonto = adatDonto.pontokDonto[bd] || "";
                html += '<input type="number" step="0.1" min="5.0" max="8.5" class="score-input score-input-2" value="' + ertekDonto + '" ' + readonlyAttr + ' oninput="okosKataPontBeiras(this, \'' + kategoria + '\', \'' + vDonto.id + '\', ' + bd + ', 2)" onblur="veglegesitMezot(this, \'' + kategoria + '\', \'' + vDonto.id + '\', ' + bd + ', 2)">';
            }
            var tieDontoHtml = (adatok.kataStatus[kategoria] === 'donto_rendezve' && adatDonto.osszpontDonto > 0 && m > 0 && wkfSorbarendezes(dontoMegjelenites[m - 1], adatDonto, true) === 0) ? '<span style="font-size: 10px; color: #CE1126; display: block; line-height: 1;">ÚJ KATA!</span>' : "";
            html += '</div><div style="width: 60px; text-align: right; font-weight: 900; font-size: 1.2rem; color: #1a1a1a;">' + tieDontoHtml + '<span id="osszpont-2-' + vDonto.id + '">' + adatDonto.osszpontDonto.toFixed(1) + '</span></div></div>';
        }
        html += '</div>';
    }
    tartalom.innerHTML = html;
}

function okosKataPontBeiras(mezo, kategoria, versenyzoId, biroIndex, fordulo) {
    mezo.value = mezo.value.replace(',', '.'); var szoveg = mezo.value;
    if (szoveg.length === 2 && !szoveg.includes('.')) { mezo.value = (parseInt(szoveg) / 10).toFixed(1); }
    if (mezo.value.length === 3) {
        var veglegesPont = parseFloat(mezo.value);
        if (veglegesPont < 5.0) veglegesPont = 5.0; if (veglegesPont > 8.5) veglegesPont = 8.5;
        mezo.value = veglegesPont.toFixed(1);
        var valosIndex = adatok.kata[kategoria].findIndex(item => String(item.versenyzo.id) === String(versenyzoId));
        if (valosIndex === -1) return;
        if (fordulo === 1) adatok.kata[kategoria][valosIndex].pontok[biroIndex] = veglegesPont.toFixed(1); else adatok.kata[kategoria][valosIndex].pontokDonto[biroIndex] = veglegesPont.toFixed(1);

        var osszesMezo = Array.from(document.querySelectorAll('.score-input-' + fordulo)); var index = osszesMezo.indexOf(mezo);
        if (index > -1 && index < osszesMezo.length - 1) { osszesMezo[index + 1].focus(); setTimeout(() => osszesMezo[index + 1].select(), 10); } else { mezo.blur(); }
        szamolKataEredmeny(kategoria, valosIndex, fordulo);
    }
}

function veglegesitMezot(mezo, kategoria, versenyzoId, biroIndex, fordulo) {
    if (mezo.value !== "") {
        var veglegesPont = parseFloat(mezo.value); var valosIndex = adatok.kata[kategoria].findIndex(item => String(item.versenyzo.id) === String(versenyzoId));
        if (valosIndex === -1) return;
        if (isNaN(veglegesPont)) { mezo.value = ""; if (fordulo === 1) adatok.kata[kategoria][valosIndex].pontok[biroIndex] = ""; else adatok.kata[kategoria][valosIndex].pontokDonto[biroIndex] = ""; }
        else {
            if (veglegesPont < 5.0) veglegesPont = 5.0; if (veglegesPont > 8.5) veglegesPont = 8.5; mezo.value = veglegesPont.toFixed(1);
            if (fordulo === 1) adatok.kata[kategoria][valosIndex].pontok[biroIndex] = veglegesPont.toFixed(1); else adatok.kata[kategoria][valosIndex].pontokDonto[biroIndex] = veglegesPont.toFixed(1);
        }
        szamolKataEredmeny(kategoria, valosIndex, fordulo);
    }
}

function szamolKataEredmeny(kategoria, valosIndex, fordulo) {
    var pontok = (fordulo === 1) ? adatok.kata[kategoria][valosIndex].pontok : adatok.kata[kategoria][valosIndex].pontokDonto;
    var szamok = []; for (var i = 0; i < pontok.length; i++) { if (pontok[i] !== "") szamok.push(parseFloat(pontok[i])); }
    var osszeg = 0, minP = 0, maxP = 0;
    if (szamok.length === 5) { szamok.sort((a, b) => a - b); minP = szamok[0]; maxP = szamok[4]; osszeg = szamok[1] + szamok[2] + szamok[3]; }
    else { for (var j = 0; j < szamok.length; j++) { osszeg += szamok[j]; } }

    if (fordulo === 1) { adatok.kata[kategoria][valosIndex].osszpont = osszeg; adatok.kata[kategoria][valosIndex].minPont1 = minP; adatok.kata[kategoria][valosIndex].maxPont1 = maxP; }
    else { adatok.kata[kategoria][valosIndex].osszpontDonto = osszeg; adatok.kata[kategoria][valosIndex].minPontDonto = minP; adatok.kata[kategoria][valosIndex].maxPontDonto = maxP; }

    localStorage.setItem('iko_kata_db', JSON.stringify(adatok.kata));
    var pontElem = document.getElementById('osszpont-' + fordulo + '-' + adatok.kata[kategoria][valosIndex].versenyzo.id);
    if (pontElem) pontElem.innerText = osszeg.toFixed(1);
}

window.addEventListener('DOMContentLoaded', function () {
    var mentettKata = localStorage.getItem('iko_kata_db'); if (mentettKata !== null) adatok.kata = JSON.parse(mentettKata);
    var mentettStatus = localStorage.getItem('iko_kata_status'); if (mentettStatus !== null) adatok.kataStatus = JSON.parse(mentettStatus); else adatok.kataStatus = {};
});