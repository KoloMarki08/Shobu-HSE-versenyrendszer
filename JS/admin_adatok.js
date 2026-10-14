const API_URL = 'https://localhost:7045/api';

let globalVersenyzok = [];
let globalKategoriak = [];
let globalNevezesek = [];
let globalTatamik = [];
let globalMerkozesek = [];

window.onload = function() {
    mindenAdatFrissitese();
};

async function mindenAdatFrissitese() {
    await versenyzokBetoltese();
    await kategoriakBetoltese();
    await tatamikBetoltese();
    await nevezesekBetoltese();
    await merkozesekBetoltese();
}

// ==========================================
// 1. VERSENYZŐK ÉS MÉRLEGELÉS (Competitor.cs)
// ==========================================
async function versenyzokBetoltese() {
    try {
        const res = await fetch(API_URL + '/Competitors');
        globalVersenyzok = await res.json();

        let html = '<table class="data-table">';
        html += '<tr><th>ID</th><th>Név</th><th>Klub</th><th>Övfokozat</th><th>Szül. év</th><th>Mérlegelt Súly (kg)</th><th>Művelet</th></tr>';

        let selectHtml = '<option value="">Válassz versenyzőt...</option>';

        for (let i = 0; i < globalVersenyzok.length; i++) {
            let v = globalVersenyzok[i];
            html += '<tr>';
            html += '<td>' + v.id + '</td>';
            html += '<td><strong>' + v.name + '</strong></td>';
            html += '<td>' + (v.club || '-') + '</td>';
            html += '<td>' + (v.belt || '-') + '</td>';
            html += '<td>' + (v.birthYear || '-') + '</td>';
            // Mérlegelés: közvetlenül átírható súly
            html += '<td>';
            html += '<input type="number" id="sulyInput_' + v.id + '" value="' + v.weight + '" style="width: 70px; padding: 4px;"> kg ';
            html += '<button class="btn btn-outline-blue" style="padding: 4px 8px;" onclick="sulyFrissitese(' + v.id + ')">Mentés</button>';
            html += '</td>';
            html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolVersenyzo(' + v.id + ')">Törlés</button></td>';
            html += '</tr>';

            selectHtml += '<option value="' + v.id + '">' + v.name + ' (' + v.club + ' - ' + v.weight + 'kg)</option>';
        }
        
        html += '</table>';
        document.getElementById('versenyzokTableContainer').innerHTML = html;
        document.getElementById('ujNevezesVersenyzo').innerHTML = selectHtml;
    } catch (e) {
        console.error("Versenyző betöltési hiba:", e);
    }
}

function hozzadVersenyzo() {
    const nev = document.getElementById('ujVersenyzoNev').value;
    const klub = document.getElementById('ujVersenyzoKlub').value;
    const ov = document.getElementById('ujVersenyzoOv').value || "10. kyu";
    const suly = parseInt(document.getElementById('ujVersenyzoSuly').value) || 60;
    const szulEv = parseInt(document.getElementById('ujVersenyzoSzulEv').value) || 2008;

    if (!nev) { alert("A nevet kötelező megadni!"); return; }

    const ujAdat = {
        name: nev,
        club: klub,
        belt: ov,
        weight: suly,
        birthYear: szulEv
    };

    fetch(API_URL + '/Competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujAdat)
    }).then(res => {
        if (res.ok) {
            document.getElementById('ujVersenyzoNev').value = '';
            document.getElementById('ujVersenyzoKlub').value = '';
            document.getElementById('ujVersenyzoOv').value = '';
            document.getElementById('ujVersenyzoSuly').value = '';
            document.getElementById('ujVersenyzoSzulEv').value = '';
            mindenAdatFrissitese();
        }
    });
}

// Mérlegeléskor a versenyző súlyának módosítása
function sulyFrissitese(versenyzoId) {
    const ujSuly = parseInt(document.getElementById('sulyInput_' + versenyzoId).value);
    let v = globalVersenyzok.find(x => x.id === versenyzoId);
    if (!v || isNaN(ujSuly)) return;

    v.weight = ujSuly;

    fetch(API_URL + '/Competitors/' + versenyzoId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v)
    }).then(res => {
        if (res.ok) {
            alert(v.name + " új súlya (" + ujSuly + " kg) rögzítve!");
            mindenAdatFrissitese();
        }
    });
}

function torolVersenyzo(id) {
    if (confirm("Biztosan törlöd ezt a versenyzőt?")) {
        fetch(API_URL + '/Competitors/' + id, { method: 'DELETE' })
        .then(res => { if (res.ok) mindenAdatFrissitese(); });
    }
}

// ==========================================
// 2. KATEGÓRIÁK ÉS SÚLYBONTÁS (Category.cs)
// ==========================================
async function kategoriakBetoltese() {
    try {
        const res = await fetch(API_URL + '/Categories');
        globalKategoriak = await res.json();

        let html = '<table class="data-table">';
        html += '<tr><th>ID</th><th>Megnevezés</th><th>Típus</th><th>Nem</th><th>Korhatár</th><th>Művelet</th></tr>';

        let selectHtml = '<option value="">Válassz kategóriát...</option>';

        for (let i = 0; i < globalKategoriak.length; i++) {
            let k = globalKategoriak[i];
            html += '<tr>';
            html += '<td>' + k.id + '</td>';
            html += '<td><strong>' + k.name + '</strong></td>';
            html += '<td>' + k.matchType + '</td>';
            html += '<td>' + k.gender + '</td>';
            html += '<td>' + k.minAge + ' - ' + k.maxAge + ' év</td>';
            html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolKategoria(' + k.id + ')">Törlés</button></td>';
            html += '</tr>';

            selectHtml += '<option value="' + k.id + '">' + k.name + ' (' + k.matchType + ')</option>';
        }
        
        html += '</table>';
        document.getElementById('kategoriakTableContainer').innerHTML = html;
        document.getElementById('ujNevezesKategoria').innerHTML = selectHtml;
        document.getElementById('sorsolasKategoriaSelect').innerHTML = selectHtml;
        document.getElementById('bontandoKategoriaSelect').innerHTML = selectHtml;
    } catch (e) {
        console.error("Kategória betöltési hiba:", e);
    }
}

function hozzadKategoria() {
    const nev = document.getElementById('ujKategoriaNev').value;
    const tipus = document.getElementById('ujKategoriaTipus').value;
    const nem = document.getElementById('ujKategoriaNem').value;
    const minKor = parseInt(document.getElementById('ujKategoriaMinKor').value) || 14;
    const maxKor = parseInt(document.getElementById('ujKategoriaMaxKor').value) || 35;

    if (!nev) { alert("A kategória nevét kötelező megadni!"); return; }

    const ujKat = {
        name: nev,
        matchType: tipus,
        gender: nem,
        minAge: minKor,
        maxAge: maxKor
    };

    fetch(API_URL + '/Categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujKat)
    }).then(res => {
        if (res.ok) {
            document.getElementById('ujKategoriaNev').value = '';
            mindenAdatFrissitese();
        }
    });
}

// Automatikus súlycsoport-bontás a mérlegelt súlyok alapján
async function sulycsoportBontas() {
    const katId = parseInt(document.getElementById('bontandoKategoriaSelect').value);
    const hatar = parseInt(document.getElementById('sulyHatarInput').value);

    if (!katId || isNaN(hatar)) {
        alert("Válassz ki egy kategóriát és adj meg egy súlyhatárt (pl. 70)!");
        return;
    }

    const eredetiKat = globalKategoriak.find(k => k.id === katId);
    if (!eredetiKat) return;

    // 1. Létrehozzuk a +súlyhatár kategóriát
    const ujKatAdat = {
        name: eredetiKat.name + " (+" + hatar + "kg)",
        matchType: eredetiKat.matchType,
        gender: eredetiKat.gender,
        minAge: eredetiKat.minAge,
        maxAge: eredetiKat.maxAge
    };

    const res = await fetch(API_URL + '/Categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujKatAdat)
    });

    if (res.ok) {
        const letrejottKat = await res.json();
        // 2. Az eredeti kategóriában lévő, súlyhatár feletti versenyzőket átrakjuk az újba
        const erintettNevezesek = globalNevezesek.filter(n => n.categoryId === katId);
        let atsorolva = 0;

        for (let i = 0; i < erintettNevezesek.length; i++) {
            let nev = erintettNevezesek[i];
            let vers = globalVersenyzok.find(v => v.id === nev.competitorId);
            if (vers && vers.weight >= hatar) {
                nev.categoryId = letrejottKat.id;
                await fetch(API_URL + '/Registrations/' + nev.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: nev.id, competitorId: nev.competitorId, categoryId: letrejottKat.id })
                });
                atsorolva++;
            }
        }
        alert("Súlybontás kész! " + atsorolva + " nehézsúlyú versenyző átsorolva az új kategóriába.");
        mindenAdatFrissitese();
    }
}

function torolKategoria(id) {
    if (confirm("Biztosan törlöd ezt a kategóriát?")) {
        fetch(API_URL + '/Categories/' + id, { method: 'DELETE' })
        .then(res => { if (res.ok) mindenAdatFrissitese(); });
    }
}

// ==========================================
// 3. NEVEZÉSEK ÉS ÁTSOROLÁS (Registration.cs)
// ==========================================
async function nevezesekBetoltese() {
    try {
        const res = await fetch(API_URL + '/Registrations');
        globalNevezesek = await res.json();

        let html = '<table class="data-table">';
        html += '<tr><th>ID</th><th>Versenyző (Klub & Súly)</th><th>Jelenlegi Kategória</th><th>Átsorolás másik kategóriába</th><th>Művelet</th></tr>';

        for (let i = 0; i < globalNevezesek.length; i++) {
            let n = globalNevezesek[i];
            let v = globalVersenyzok.find(x => x.id === n.competitorId);
            let k = globalKategoriak.find(x => x.id === n.categoryId);

            let vSzoveg = v ? (v.name + " (" + v.club + ", " + v.weight + " kg)") : ("Versenyző #" + n.competitorId);
            let kSzoveg = k ? k.name : ("Kategória #" + n.categoryId);

            // Kategória választó az azonnali átsoroláshoz
            let katOpciok = '';
            for (let j = 0; j < globalKategoriak.length; j++) {
                let kat = globalKategoriak[j];
                let selected = (kat.id === n.categoryId) ? 'selected' : '';
                katOpciok += '<option value="' + kat.id + '" ' + selected + '>' + kat.name + '</option>';
            }

            html += '<tr>';
            html += '<td>' + n.id + '</td>';
            html += '<td><strong>' + vSzoveg + '</strong></td>';
            html += '<td>' + kSzoveg + '</td>';
            html += '<td>';
            html += '<select id="atsorolSelect_' + n.id + '" style="padding: 4px;">' + katOpciok + '</select> ';
            html += '<button class="btn btn-outline-blue" style="padding: 4px 8px;" onclick="nevezesAtsorolasa(' + n.id + ', ' + n.competitorId + ')">Átsorol</button>';
            html += '</td>';
            html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolNevezes(' + n.id + ')">Törlés</button></td>';
            html += '</tr>';
        }
        
        html += '</table>';
        document.getElementById('nevezesekTableContainer').innerHTML = html;
    } catch (e) {
        console.error("Nevezés betöltési hiba:", e);
    }
}

function hozzadNevezes() {
    const versenyzoId = parseInt(document.getElementById('ujNevezesVersenyzo').value);
    const kategoriaId = parseInt(document.getElementById('ujNevezesKategoria').value);

    if (!versenyzoId || !kategoriaId) {
        alert("Válassz versenyzőt és kategóriát is!");
        return;
    }

    fetch(API_URL + '/Registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId: versenyzoId, categoryId: kategoriaId })
    }).then(res => {
        if (res.ok) mindenAdatFrissitese();
    });
}

function nevezesAtsorolasa(nevezesId, versenyzoId) {
    const ujKategoriaId = parseInt(document.getElementById('atsorolSelect_' + nevezesId).value);
    fetch(API_URL + '/Registrations/' + nevezesId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nevezesId, competitorId: versenyzoId, categoryId: ujKategoriaId })
    }).then(res => {
        if (res.ok) {
            alert("Versenyző sikeresen átsorolva az új kategóriába!");
            mindenAdatFrissitese();
        }
    });
}

function torolNevezes(id) {
    if (confirm("Biztosan törlöd ezt a nevezést?")) {
        fetch(API_URL + '/Registrations/' + id, { method: 'DELETE' })
        .then(res => { if (res.ok) mindenAdatFrissitese(); });
    }
}

// ==========================================
// 4. TATAMIK ÉS VALÓDI SORSOLÁS MOTOR (Match.cs)
// ==========================================
async function tatamikBetoltese() {
    try {
        const res = await fetch(API_URL + '/Tatamis');
        globalTatamik = await res.json();

        let html = '<table class="data-table"><tr><th>ID</th><th>Tatami</th></tr>';
        let selectHtml = '';

        for (let i = 0; i < globalTatamik.length; i++) {
            let t = globalTatamik[i];
            html += '<tr><td>' + t.id + '</td><td><strong>' + t.name + '</strong></td></tr>';
            selectHtml += '<option value="' + t.id + '">' + t.name + '</option>';
        }
        html += '</table>';

        document.getElementById('tatamikTableContainer').innerHTML = html;
        document.getElementById('sorsolasTatamiSelect').innerHTML = selectHtml;
    } catch (e) {
        console.error("Tatami betöltési hiba:", e);
    }
}

function hozzadTatami() {
    const nev = document.getElementById('ujTatamiNev').value;
    if (!nev) return;
    fetch(API_URL + '/Tatamis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nev })
    }).then(res => {
        if (res.ok) {
            document.getElementById('ujTatamiNev').value = '';
            tatamikBetoltese();
        }
    });
}

// Amikor kiválasztunk egy kategóriát a sorsolásnál, megmutatjuk az indulóit kiemeléshez (Seeding)
function kategoriaInduloitMutat() {
    const katId = parseInt(document.getElementById('sorsolasKategoriaSelect').value);
    const container = document.getElementById('kiemelesContainer');
    const listaDiv = document.getElementById('kiemelesLista');

    if (!katId) {
        container.style.display = 'none';
        return;
    }

    const nevezettek = globalNevezesek.filter(n => n.categoryId === katId);
    if (nevezettek.length === 0) {
        container.style.display = 'block';
        listaDiv.innerHTML = '<span style="color: red;">Ebben a kategóriában még nincs benevezett versenyző!</span>';
        return;
    }

    let html = '';
    for (let i = 0; i < nevezettek.length; i++) {
        let v = globalVersenyzok.find(x => x.id === nevezettek[i].competitorId);
        if (v) {
            html += '<label style="background: white; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">';
            html += '<input type="checkbox" class="kiemelt-checkbox" value="' + v.id + '"> ';
            html += '<strong>' + v.name + '</strong> (' + v.club + ')';
            html += '</label>';
        }
    }

    listaDiv.innerHTML = html;
    container.style.display = 'block';
}

// 1. TÖBBFORDULÓS SORSOLÁS MOTOR (Elődöntők és Döntő előre generálásával + Erőnyerő továbbjutással)
async function kategoriaSorsolasa() {
    const katId = parseInt(document.getElementById('sorsolasKategoriaSelect').value);
    const tatamiId = parseInt(document.getElementById('sorsolasTatamiSelect').value);
    const formatum = document.getElementById('sorsolasFormatumSelect').value;

    if (!katId || !tatamiId) {
        alert("Válassz kategóriát és tatamit a sorsoláshoz!");
        return;
    }

    const kivalasztottKat = globalKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType.toUpperCase() === 'KATA');

    const katNevezesek = globalNevezesek.filter(n => n.categoryId === katId);
    let indulok = katNevezesek.map(n => globalVersenyzok.find(v => v.id === n.competitorId)).filter(Boolean);

    if (indulok.length < 1) {
        alert("Nincs benevezett versenyző ebben a kategóriában!");
        return;
    }

    // Kiemeltek és véletlenszerű keverés
    const kiemeltIdk = Array.from(document.getElementsByClassName('kiemelt-checkbox'))
                            .filter(cb => cb.checked).map(cb => parseInt(cb.value));
    let kiemeltek = indulok.filter(v => kiemeltIdk.includes(v.id));
    let tobbiek = indulok.filter(v => !kiemeltIdk.includes(v.id)).sort(() => Math.random() - 0.5);
    let rendezett = kiemeltek.concat(tobbiek);

    const tatamiMeccsei = globalMerkozesek.filter(m => m.tatamiId === tatamiId);
    let sorszam = tatamiMeccsei.length > 0 ? Math.max(...tatamiMeccsei.map(m => m.matchOrder)) + 1 : 1;
    let generaltMeccsek = [];

    if (isKata) {
        // --- MYKYOKUSHIN KATA SORSOLÁS: EGYÉNI FELLÉPÉSEK RAJTSORRENDBEN ---
        // A kiemeltek a lista végére kerülnek (ahogy a nagy versenyeken szokás, a legjobbak katáznak utoljára)
        let kataSorrend = tobbiek.concat(kiemeltek);
        for (let i = 0; i < kataSorrend.length; i++) {
            generaltMeccsek.push({
                categoryId: katId,
                tatamiId: tatamiId,
                competitor1Id: kataSorrend[i].id,
                competitor2Id: null, // Egy ember katázik egyszerre!
                matchOrder: sorszam++,
                isFinished: false,
                winnerId: null
            });
        }
    } else if (formatum === 'kormeccs') {
        // KUMITE KÖRMÉRKŐZÉS
        for (let i = 0; i < rendezett.length; i++) {
            for (let j = i + 1; j < rendezett.length; j++) {
                generaltMeccsek.push({
                    categoryId: katId, tatamiId: tatamiId,
                    competitor1Id: rendezett[i].id, competitor2Id: rendezett[j].id,
                    matchOrder: sorszam++, isFinished: false, winnerId: null
                });
            }
        }
    } else {
        // KUMITE EGYENES KIESÉS (Ágrajz + Erőnyerő)
        let agrajzMeret = 2;
        while (agrajzMeret < rendezett.length) agrajzMeret *= 2;

        let eronyerokSzama = agrajzMeret - rendezett.length;
        let kuzdok = [...rendezett];
        let elsoKorMeccsek = [];

        for (let i = 0; i < eronyerokSzama; i++) {
            let v = kuzdok.shift();
            elsoKorMeccsek.push({
                categoryId: katId, tatamiId: tatamiId,
                competitor1Id: v.id, competitor2Id: null,
                matchOrder: sorszam++, isFinished: true, winnerId: v.id
            });
        }

        while (kuzdok.length >= 2) {
            let aka = kuzdok.shift();
            let shiroIdx = kuzdok.findIndex(v => v.club !== aka.club);
            if (shiroIdx === -1) shiroIdx = 0;
            let shiro = kuzdok.splice(shiroIdx, 1)[0];

            elsoKorMeccsek.push({
                categoryId: katId, tatamiId: tatamiId,
                competitor1Id: aka.id, competitor2Id: shiro.id,
                matchOrder: sorszam++, isFinished: false, winnerId: null
            });
        }

        generaltMeccsek.push(...elsoKorMeccsek);

        let elozoKorok = elsoKorMeccsek;
        let aktualisAgMeret = agrajzMeret / 4;

        while (aktualisAgMeret >= 1) {
            let ujKorMeccsek = [];
            for (let i = 0; i < aktualisAgMeret; i++) {
                let m1 = elozoKorok[i * 2];
                let m2 = elozoKorok[i * 2 + 1];
                ujKorMeccsek.push({
                    categoryId: katId, tatamiId: tatamiId,
                    competitor1Id: (m1 && m1.isFinished) ? m1.winnerId : null,
                    competitor2Id: (m2 && m2.isFinished) ? m2.winnerId : null,
                    matchOrder: sorszam++, isFinished: false, winnerId: null
                });
            }
            generaltMeccsek.push(...ujKorMeccsek);
            elozoKorok = ujKorMeccsek;
            aktualisAgMeret /= 2;
        }
    }

    for (let m of generaltMeccsek) {
        await fetch(API_URL + '/Matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(m)
        });
    }

    alert(isKata ? ("Kata rajtsorrend kisorsolva! (" + generaltMeccsek.length + " fellépő)") : ("Kumite ágrajz kisorsolva! (" + generaltMeccsek.length + " mérkőzés)"));
    await merkozesekBetoltese();
    document.getElementById('agrajzKategoriaSelect').value = katId;
    rajzolAgrajz();
}

// 2. MÉRKŐZÉSEK TÁBLÁZATA + DRAG AND DROP SORRENDMÓDOSÍTÁS
let draggedMatchId = null;

async function merkozesekBetoltese() {
    try {
        const res = await fetch(API_URL + '/Matches');
        globalMerkozesek = await res.json();
        globalMerkozesek.sort((a, b) => (a.tatamiId - b.tatamiId) || (a.matchOrder - b.matchOrder));

        // Frissítjük az ágrajz-választó legördülőt is
        let agrajzSelect = document.getElementById('agrajzKategoriaSelect');
        if (agrajzSelect) {
            let jelenlegiValasztas = agrajzSelect.value;
            let opciok = '<option value="">-- Válassz kategóriát az ágrajzhoz --</option>';
            for (let k of globalKategoriak) {
                opciok += '<option value="' + k.id + '">' + k.name + '</option>';
            }
            agrajzSelect.innerHTML = opciok;
            if (jelenlegiValasztas) agrajzSelect.value = jelenlegiValasztas;
        }

        let html = '<p style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">💡 <em>Tipp: Fogd meg bármelyik sort az egérrel, és húzd át másik sorra a meccssorrend azonnali cseréjéhez!</em></p>';
        html += '<table class="data-table">';
        html += '<tr><th>Sorszám</th><th>Tatami</th><th>Kategória</th><th>Piros (AKA)</th><th>Fehér (SHIRO)</th><th>Állapot / Győztes</th><th>Művelet</th></tr>';

        for (let i = 0; i < globalMerkozesek.length; i++) {
            let m = globalMerkozesek[i];
            let tatami = globalTatamik.find(t => t.id === m.tatamiId);
            let kat = globalKategoriak.find(k => k.id === m.categoryId);
            let v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
            let v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);
            let gyoztes = globalVersenyzok.find(v => v.id === m.winnerId);

            let tatamiNev = tatami ? tatami.name : ("Tatami #" + m.tatamiId);
            let katNev = kat ? kat.name : ("Kat. #" + m.categoryId);
            let akaNev = v1 ? (v1.name + " <small>(" + v1.club + ")</small>") : "<em>Várakozik (Továbbjutóra)...</em>";
            
            let shiroNev = "";
            if (m.isFinished && !m.competitor2Id) {
                shiroNev = "<em>ERŐNYERŐ (BYE)</em>";
            } else if (v2) {
                shiroNev = v2.name + " <small>(" + v2.club + ")</small>";
            } else {
                shiroNev = "<em>Várakozik (Továbbjutóra)...</em>";
            }

            let statuszHtml = m.isFinished 
                ? '<span style="color: green; font-weight: bold;">✔ Győztes: ' + (gyoztes ? gyoztes.name : '-') + '</span>'
                : '<span style="color: #d39e00; font-weight: bold;">⏳ Küzdőtérre vár</span>';

            html += '<tr class="draggable-row" draggable="true" ondragstart="dragStart(event, ' + m.id + ')" ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropMatch(event, ' + m.id + ')">';
            html += '<td><strong>☰ #' + m.matchOrder + '</strong></td>';
            html += '<td style="color: blue; font-weight: bold;">' + tatamiNev + '</td>';
            html += '<td>' + katNev + '</td>';
            html += '<td style="color: #dc3545; font-weight: bold;">' + akaNev + '</td>';
            html += '<td style="font-weight: bold;">' + shiroNev + '</td>';
            html += '<td>' + statuszHtml + '</td>';
            html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolMerkozes(' + m.id + ')">Törlés</button></td>';
            html += '</tr>';
        }
        
        html += '</table>';
        document.getElementById('merkozesekTableContainer').innerHTML = html;
        rajzolAgrajz();
    } catch (e) {
        console.error("Mérkőzés betöltési hiba:", e);
    }
}

// Drag & Drop eseménykezelők
function dragStart(ev, matchId) {
    draggedMatchId = matchId;
    ev.currentTarget.classList.add('dragging');
}

function dragOver(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) {
    ev.currentTarget.classList.remove('drag-over');
}

async function dropMatch(ev, targetMatchId) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-over');
    if (!draggedMatchId || draggedMatchId === targetMatchId) return;

    let m1 = globalMerkozesek.find(m => m.id === draggedMatchId);
    let m2 = globalMerkozesek.find(m => m.id === targetMatchId);
    if (!m1 || !m2) return;

    // Megcseréljük a két meccs sorszámát (és ha másik tatamira húzták, a tatamit is!)
    let tempOrder = m1.matchOrder;
    let tempTatami = m1.tatamiId;

    m1.matchOrder = m2.matchOrder;
    m1.tatamiId = m2.tatamiId;

    m2.matchOrder = tempOrder;
    m2.tatamiId = tempTatami;

    await fetch(API_URL + '/Matches/' + m1.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m1) });
    await fetch(API_URL + '/Matches/' + m2.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m2) });

    merkozesekBetoltese();
}

// 3. VIZUÁLIS ÁGRAJZ MEGJELENÍTŐ
function rajzolAgrajz() {
    const select = document.getElementById('agrajzKategoriaSelect');
    const container = document.getElementById('agrajzContainer');
    if (!select || !container) return;

    const katId = parseInt(select.value);
    if (!katId) return;

    const kivalasztottKat = globalKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType.toUpperCase() === 'KATA');
    let katMeccsek = globalMerkozesek.filter(m => m.categoryId === katId);

    if (katMeccsek.length === 0) {
        container.innerHTML = '<p style="color: #888; margin-top: 10px;">Ehhez a kategóriához még nincs kisorsolt mérkőzés / rajtsorrend.</p>';
        return;
    }

    // --- HA KATA KATEGÓRIA: MYKYOKUSHIN RANGLISTA ÉS HOLTVERSENY TÁBLÁZAT ---
    if (isKata) {
        const kataTarolo = TatamiMaster.lekerKataEredmenyek();
        let lista = katMeccsek.map(m => {
            let v = globalVersenyzok.find(x => x.id === m.competitor1Id);
            let eredmeny = kataTarolo[m.id] || { kesz: false, osszeg: 0, minErtek: 0, maxErtek: 0, vezetoBiro: 0, pontok: ['-','-','-','-','-'], minIdx: -1, maxIdx: -1 };
            return { meccs: m, versenyzo: v, ...eredmeny };
        });

        // A már lepontozott versenyzőket a 4 lépcsős nemzetközi szabály szerint sorba rendezzük!
        let lepontozottak = lista.filter(x => x.kesz).sort(TatamiMaster.kataSorrendHasonlito);
        let varakozok = lista.filter(x => !x.kesz);
        let teljesSorrend = lepontozottak.concat(varakozok);

        let html = '<table class="data-table" style="margin-top: 15px;">';
        html += '<tr><th>Helyezés</th><th>Versenyző (Klub & Öv)</th><th>B1 (Vezetőbíró)</th><th>B2</th><th>B3</th><th>B4</th><th>B5</th><th>Min (Kieső)</th><th>Max (Kieső)</th><th>ÖSSZPONTSZÁM</th><th>Státusz / Tie-break</th></tr>';

        for (let i = 0; i < teljesSorrend.length; i++) {
            let item = teljesSorrend[i];
            let vNev = item.versenyzo ? ('<strong>' + item.versenyzo.name + '</strong> <small>(' + item.versenyzo.club + ' - ' + item.versenyzo.belt + ')</small>') : '-';
            
            // Ellenőrizzük, van-e teljes holtverseny (Újrakatázás) az előző vagy következő versenyzővel
            let ujrakatazas = false;
            if (item.kesz) {
                if (i > 0 && teljesSorrend[i-1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i-1]) === 0) ujrakatazas = true;
                if (i < teljesSorrend.length - 1 && teljesSorrend[i+1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i+1]) === 0) ujrakatazas = true;
            }

            html += '<tr style="' + (item.kesz && i < 3 ? 'background-color: #fffef0;' : '') + '">';
            html += '<td><strong>' + (item.kesz ? (i + 1) + '.' : '-') + '</strong></td>';
            html += '<td>' + vNev + '</td>';

            for (let b = 0; b < 5; b++) {
                let p = item.pontok[b] !== undefined ? item.pontok[b] : '-';
                let st = (b === item.minIdx || b === item.maxIdx) ? 'text-decoration: line-through; color: #999;' : 'font-weight: bold;';
                html += '<td style="' + st + '">' + p + '</td>';
            }

            html += '<td style="color: #666;">' + (item.kesz ? item.minErtek.toFixed(1) : '-') + '</td>';
            html += '<td style="color: #666;">' + (item.kesz ? item.maxErtek.toFixed(1) : '-') + '</td>';
            html += '<td style="font-size: 1.2rem; font-weight: bold; color: #dc3545;">' + (item.kesz ? item.osszeg.toFixed(1) : '-') + '</td>';
            html += '<td>' + (ujrakatazas ? '<span style="background:#dc3545;color:white;padding:3px 6px;border-radius:4px;font-weight:bold;">⚠️ ÚJRAKATÁZÁS!</span>' : (item.kesz ? '<span style="color:green;font-weight:bold;">✔ Értékelve</span>' : '⏳ Rajtszám: #' + item.meccs.matchOrder)) + '</td>';
            html += '</tr>';
        }
        html += '</table>';
        container.innerHTML = html;
        return;
    }

    // --- HA KUMITE KATEGÓRIA: VIZUÁLIS ÁGRAJZ ---
    katMeccsek.sort((a, b) => a.id - b.id);
    let fordulok = [];
    let osszes = katMeccsek.length;
    if (osszes === 3 || osszes === 7 || osszes === 15) {
        let korMeret = (osszes + 1) / 2;
        let idx = 0;
        while (korMeret >= 1) {
            fordulok.push(katMeccsek.slice(idx, idx + korMeret));
            idx += korMeret;
            korMeret /= 2;
        }
    } else {
        fordulok.push(katMeccsek);
    }

    let html = '<div class="bracket-wrapper">';
    for (let r = 0; r < fordulok.length; r++) {
        let korCim = (fordulok.length > 1)
            ? (r === fordulok.length - 1 ? "🏆 Döntő" : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló"))
            : "Mérkőzések";

        html += '<div class="bracket-round"><h4>' + korCim + '</h4>';
        for (let m of fordulok[r]) {
            let v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
            let v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);

            let akaNev = v1 ? v1.name : "Várakozik...";
            let shiroNev = (m.isFinished && !m.competitor2Id) ? "ERŐNYERŐ (BYE)" : (v2 ? v2.name : "Várakozik...");

            let akaWinner = (m.isFinished && m.winnerId === m.competitor1Id) ? "winner" : "";
            let shiroWinner = (m.isFinished && m.winnerId === m.competitor2Id) ? "winner" : "";

            html += '<div class="bracket-match ' + (m.isFinished ? 'finished' : '') + '">';
            html += '<div class="bracket-fighter aka ' + akaWinner + '"><span>🔴 ' + akaNev + '</span><span>' + (akaWinner ? '✔' : '') + '</span></div>';
            html += '<div class="bracket-fighter shiro ' + shiroWinner + '"><span>⚪ ' + shiroNev + '</span><span>' + (shiroWinner ? '✔' : '') + '</span></div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// Meccs sorszámának (MatchOrder) módosítása fel/le
function sorrendModositas(meccsId, irany) {
    let m = globalMerkozesek.find(x => x.id === meccsId);
    if (!m) return;

    m.matchOrder = Math.max(1, m.matchOrder + irany);

    fetch(API_URL + '/Matches/' + meccsId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m)
    }).then(res => {
        if (res.ok) merkozesekBetoltese();
    });
}

function torolMerkozes(id) {
    if (confirm("Biztosan törlöd ezt a mérkőzést?")) {
        fetch(API_URL + '/Matches/' + id, { method: 'DELETE' })
        .then(res => { if (res.ok) merkozesekBetoltese(); });
    }
}

// ==========================================
// 5. ADATBÁZIS FELTÖLTÉSE TESZTADATOKKAL
// ==========================================
async function adatbazisFeltoltese() {
    if (!confirm("Feltöltöd az adatbázist tatamikkal, kategóriákkal, versenyzőkkel és nevezésekkel?")) return;

    const headers = { 'Content-Type': 'application/json' };

    try {
        // 1. Tatamik (ha még nincsenek)
        if (globalTatamik.length === 0) {
            const tatamik = ["A tatami", "B tatami", "C tatami"];
            for (let t of tatamik) {
                await fetch(API_URL + '/Tatamis', { method: 'POST', headers, body: JSON.stringify({ name: t }) });
            }
        }

        // 2. Kategóriák (Category.cs mezőkkel!)
        const kategoriak = [
            { name: "Junior Férfi Kata", matchType: "KATA", gender: "Férfi", minAge: 16, maxAge: 18 },
            { name: "Felnőtt Férfi Kumite -70kg", matchType: "KUMITE", gender: "Férfi", minAge: 18, maxAge: 35 },
            { name: "Felnőtt Férfi Kumite -80kg", matchType: "KUMITE", gender: "Férfi", minAge: 18, maxAge: 35 }
        ];
        for (let k of kategoriak) {
            await fetch(API_URL + '/Categories', { method: 'POST', headers, body: JSON.stringify(k) });
        }

        // 3. Versenyzők (Competitor.cs mezőkkel, egész szám súlyokkal!)
        const versenyzok = [
            { name: "Kovács János", club: "Shobu HSE", belt: "2. kyu", weight: 68, birthYear: 2006 },
            { name: "Nagy Péter", club: "Vácrátóti HSE", belt: "1. kyu", weight: 69, birthYear: 2005 },
            { name: "Szabó Dávid", club: "Castrum SC", belt: "1. dan", weight: 67, birthYear: 2004 },
            { name: "Tóth Bence", club: "Victory Martfű", belt: "3. kyu", weight: 70, birthYear: 2006 },
            { name: "Horváth Ádám", club: "Shobu HSE", belt: "2. kyu", weight: 66, birthYear: 2007 },
            { name: "Kiss Máté", club: "Yakuzák SE", belt: "1. dan", weight: 78, birthYear: 2003 },
            { name: "Molnár Gergő", club: "Kagami SE", belt: "2. kyu", weight: 79, birthYear: 2005 },
            { name: "Varga Levente", club: "Shobu HSE", belt: "4. kyu", weight: 76, birthYear: 2008 }
        ];
        for (let v of versenyzok) {
            await fetch(API_URL + '/Competitors', { method: 'POST', headers, body: JSON.stringify(v) });
        }

        // Frissítjük a listákat, hogy megkapjuk a MySQL által generált valódi ID-kat
        await versenyzokBetoltese();
        await kategoriakBetoltese();

        // 4. Nevezések létrehozása a valódi ID-kkal
        const kumite70 = globalKategoriak.find(k => k.name.includes("-70kg"));
        const kumite80 = globalKategoriak.find(k => k.name.includes("-80kg"));

        if (kumite70 && kumite80 && globalVersenyzok.length >= 8) {
            const utolso8 = globalVersenyzok.slice(-8);
            // Első 5 fő a -70kg-ba (tökéletes az 5 fős ágrajz + 3 erőnyerő teszteléséhez)
            for (let i = 0; i < 5; i++) {
                await fetch(API_URL + '/Registrations', {
                    method: 'POST', headers,
                    body: JSON.stringify({ competitorId: utolso8[i].id, categoryId: kumite70.id })
                });
            }
            // Utolsó 3 fő a -80kg-ba (tökéletes a 3 fős körmérkőzés teszteléséhez)
            for (let i = 5; i < 8; i++) {
                await fetch(API_URL + '/Registrations', {
                    method: 'POST', headers,
                    body: JSON.stringify({ competitorId: utolso8[i].id, categoryId: kumite80.id })
                });
            }
        }

        await mindenAdatFrissitese();
        alert("Az adatbázis feltöltése sikeresen befejeződött!");
    } catch (hiba) {
        console.error("Hiba a feltöltés során:", hiba);
        alert("Hiba történt a feltöltéskor! Ellenőrizd, hogy fut-e a C# backend.");
    }
}