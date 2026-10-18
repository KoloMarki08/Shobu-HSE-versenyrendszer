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

async function sulycsoportBontas() {
    const katId = parseInt(document.getElementById('bontandoKategoriaSelect').value);
    const hatar = parseInt(document.getElementById('sulyHatarInput').value);

    if (!katId || isNaN(hatar)) {
        alert("Válassz ki egy kategóriát és adj meg egy súlyhatárt (pl. 70)!");
        return;
    }

    const eredetiKat = globalKategoriak.find(k => k.id === katId);
    if (!eredetiKat) return;

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
        const erintettNevezesek = globalNevezesek.filter(n => n.categoryId === katId);
        let atsorolva = 0;

        for (let i = 0; i < erintettNevezesek.length; i++) {
            let nev = erintettNevezesek[i];
            let vers = globalVersenyzok.find(v => v.id === nev.competitorId);
            if (vers && vers.weight >= hatar) {
                await fetch(API_URL + '/Registrations/' + nev.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: nev.id, competitorId: nev.competitorId, categoryId: letrejottKat.id })
                });
                atsorolva++;
            }
        }
        alert("Súlybontás kész! " + atsorolva + " versenyző átsorolva az új kategóriába.");
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
        alert("⚠️ Válassz versenyzőt és kategóriát is!");
        return;
    }

    // VÉDELEM: Ellenőrizzük, hogy nincs-e már benevezve ebbe a kategóriába!
    const marNevezve = globalNevezesek.some(n => n.competitorId === versenyzoId && n.categoryId === kategoriaId);
    if (marNevezve) {
        alert("⛔ Ez a versenyző már szerepel ebben a kategóriában! (Dupla nevezés nem engedélyezett)");
        return;
    }

    TatamiMaster.apiSend('Registrations', 'POST', { competitorId: versenyzoId, categoryId: kategoriaId })
        .then(res => { if (res.ok) mindenAdatFrissitese(); });
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
// 4. TATAMIK, SORSOLÁS, DRAG & DROP ÉS ÁGRAJZ
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

async function kategoriaSorsolasa() {
    const katId = parseInt(document.getElementById('sorsolasKategoriaSelect').value);
    const tatamiId = parseInt(document.getElementById('sorsolasTatamiSelect').value);
    const formatum = document.getElementById('sorsolasFormatumSelect').value;

    if (!isKata && indulok.length < 2) {
        alert("⛔ Kumite kategória sorsolásához legalább 2 benevezett versenyző szükséges!");
        return;
    }

    // VÉDELEM: Van-e már kisorsolt meccs ebben a kategóriában?
    const meglevoKatMeccsek = globalMerkozesek.filter(m => m.categoryId === katId);
    if (meglevoKatMeccsek.length > 0) {
        if (!confirm(`⚠️ FIGYELEM! Ebben a kategóriában már van ${meglevoKatMeccsek.length} db kisorsolt mérkőzés!\n\nHa újrasorsolod, a rendszer előbb törli a kategória korábbi meccseit.\nBiztosan folytatod?`)) {
            return;
        }
        for (let regim of meglevoKatMeccsek) {
            await TatamiMaster.apiSend('Matches/' + regim.id, 'DELETE');
        }
    }

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

    const kiemeltIdk = Array.from(document.getElementsByClassName('kiemelt-checkbox'))
                            .filter(cb => cb.checked).map(cb => parseInt(cb.value));
    let kiemeltek = indulok.filter(v => kiemeltIdk.includes(v.id));
    let tobbiek = indulok.filter(v => !kiemeltIdk.includes(v.id)).sort(() => Math.random() - 0.5);
    let rendezett = kiemeltek.concat(tobbiek);

    const tatamiMeccsei = globalMerkozesek.filter(m => m.tatamiId === tatamiId);
    let sorszam = tatamiMeccsei.length > 0 ? Math.max(...tatamiMeccsei.map(m => m.matchOrder)) + 1 : 1;
    let generaltMeccsek = [];

    if (isKata) {
        let kataSorrend = tobbiek.concat(kiemeltek);
        for (let i = 0; i < kataSorrend.length; i++) {
            generaltMeccsek.push({
                categoryId: katId,
                tatamiId: tatamiId,
                competitor1Id: kataSorrend[i].id,
                competitor2Id: null,
                matchOrder: sorszam++,
                isFinished: false,
                winnerId: null
            });
        }
    } else if (formatum === 'kormeccs') {
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
        // KUMITE EGYENES KIESÉS (Ágrajz + Erőnyerők pontos fa-struktúrában)
        let agrajzMeret = 2;
        while (agrajzMeret < rendezett.length) agrajzMeret *= 2;

        let eronyerokSzama = agrajzMeret - rendezett.length;
        let kuzdok = [...rendezett];
        let elsoKorMeccsek = [];

        // 1. Valódi 1. körös meccsek összeállítása (klub-szétválasztással)
        let valodiMeccsekSzama = (rendezett.length - eronyerokSzama) / 2;
        for (let i = 0; i < valodiMeccsekSzama; i++) {
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

        // 2. Erőnyerő (BYE) ágak hozzáadása a maradék versenyzőknek
        while (kuzdok.length > 0) {
            let v = kuzdok.shift();
            elsoKorMeccsek.push({
                categoryId: katId, tatamiId: tatamiId,
                competitor1Id: v.id, competitor2Id: null,
                matchOrder: sorszam++, isFinished: true, winnerId: v.id
            });
        }

        generaltMeccsek.push(...elsoKorMeccsek);

        // 3. Következő fordulók (Elődöntők, Döntő) felépítése és az erőnyerők automatikus továbbjuttatása
        let elozoKorok = elsoKorMeccsek;
        let aktualisAgMeret = agrajzMeret / 4;

        while (aktualisAgMeret >= 1) {
            let ujKorMeccsek = [];
            for (let i = 0; i < aktualisAgMeret; i++) {
                let m1 = elozoKorok[i * 2];
                let m2 = elozoKorok[i * 2 + 1];

                let c1 = (m1 && m1.isFinished) ? m1.winnerId : null;
                let c2 = (m2 && m2.isFinished) ? m2.winnerId : null;

                ujKorMeccsek.push({
                    categoryId: katId, tatamiId: tatamiId,
                    competitor1Id: c1, competitor2Id: c2,
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
    const agrajzSelect = document.getElementById('agrajzKategoriaSelect');
    if (agrajzSelect) {
        agrajzSelect.value = katId;
        rajzolAgrajz();
    }
}

let draggedMatchId = null;

async function merkozesekBetoltese() {
    try {
        const res = await fetch(API_URL + '/Matches');
        globalMerkozesek = await res.json();
        globalMerkozesek.sort((a, b) => (a.tatamiId - b.tatamiId) || (a.matchOrder - b.matchOrder));

        let agrajzSelect = document.getElementById('agrajzKategoriaSelect');
        if (agrajzSelect) {
            let jelenlegiValasztas = agrajzSelect.value;
            let opciok = '<option value="">-- Válassz kategóriát az ágrajzhoz --</option>';
            for (let k of globalKategoriak) {
                opciok += '<option value="' + k.id + '">' + k.name + ' (' + k.matchType + ')</option>';
            }
            agrajzSelect.innerHTML = opciok;
            if (jelenlegiValasztas) agrajzSelect.value = jelenlegiValasztas;
        }

        let html = '<p style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">💡 <em>Tipp: Fogd meg bármelyik sort az egérrel, és húzd át másik sorra a meccssorrend azonnali cseréjéhez!</em></p>';
        html += '<table class="data-table">';
        html += '<tr><th>Sorszám</th><th>Tatami</th><th>Kategória</th><th>Piros (AKA) / Katázó</th><th>Fehér (SHIRO)</th><th>Állapot / Győztes</th><th>Művelet</th></tr>';

        for (let i = 0; i < globalMerkozesek.length; i++) {
            let m = globalMerkozesek[i];
            let tatami = globalTatamik.find(t => t.id === m.tatamiId);
            let kat = globalKategoriak.find(k => k.id === m.categoryId);
            let v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
            let v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);
            let gyoztes = globalVersenyzok.find(v => v.id === m.winnerId);

            let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
            let isDontoKata = (isKata && TatamiMaster.isKataDontoMeccs(m.id));

            let tatamiNev = tatami ? tatami.name : ("Tatami #" + m.tatamiId);
            let katNev = (kat ? kat.name : ("Kat. #" + m.categoryId)) + (isDontoKata ? ' <strong style="color:#28a745;">[TOP 6 DÖNTŐ]</strong>' : '');
            let akaNev = v1 ? (v1.name + " <small>(" + v1.club + ")</small>") : "<em>Várakozik (Továbbjutóra)...</em>";
            
            let shiroNev = "";
            if (isKata) {
                shiroNev = "<em>🥋 KATA Egyéni</em>";
            } else if (m.isFinished && !m.competitor2Id) {
                shiroNev = ""; // Üresen hagyjuk az erőnyerőnél!
            } else if (v2) {
                shiroNev = v2.name + " <small>(" + v2.club + ")</small>";
            } else {
                shiroNev = "<em>Várakozik (Továbbjutóra)...</em>";
            }

            let statuszHtml = m.isFinished 
                ? '<span style="color: green; font-weight: bold;">✔ Kész (' + (gyoztes ? gyoztes.name : '-') + ')</span>'
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

function torolMerkozes(id) {
    if (confirm("Biztosan törlöd ezt a mérkőzést?")) {
        fetch(API_URL + '/Matches/' + id, { method: 'DELETE' })
        .then(res => { if (res.ok) merkozesekBetoltese(); });
    }
}

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

    // --- 1. HA KATA KATEGÓRIA: SELEJTEZŐ + TOP 6 DÖNTŐ RANGLISTA ---
    if (isKata) {
        const kataTarolo = TatamiMaster.lekerKataEredmenyek();
        
        let selejtezoMeccsek = katMeccsek.filter(m => !TatamiMaster.isKataDontoMeccs(m.id));
        let dontoMeccsek = katMeccsek.filter(m => TatamiMaster.isKataDontoMeccs(m.id));

        function epitsKataTablazat(meccsTomb, cim, isSelejtezoTabla) {
            let lista = meccsTomb.map(m => {
                let v = globalVersenyzok.find(x => x.id === m.competitor1Id);
                let eredmeny = kataTarolo[m.id] || {
                    kesz: false, osszeg: 0, minErtek: 0, maxErtek: 0, vezetoBiro: 0,
                    pontok: ['-', '-', '-', '-', '-'], minIdx: -1, maxIdx: -1
                };
                return { meccs: m, versenyzo: v, ...eredmeny };
            });

            let lepontozottak = lista.filter(x => x.kesz).sort(TatamiMaster.kataSorrendHasonlito);
            let varakozok = lista.filter(x => !x.kesz);
            let teljesSorrend = lepontozottak.concat(varakozok);

            let tHtml = '<h4 style="margin-top: 20px; margin-bottom: 10px; color: #222;">' + cim + '</h4>';
            tHtml += '<table class="data-table">';
            tHtml += '<tr><th>Helyezés</th><th>Versenyző (Klub & Öv)</th><th>B1 (Vezető)</th><th>B2</th><th>B3</th><th>B4</th><th>B5</th><th>Min (Kieső)</th><th>Max (Kieső)</th><th>ÖSSZPONTSZÁM</th><th>Státusz</th></tr>';

            for (let i = 0; i < teljesSorrend.length; i++) {
                let item = teljesSorrend[i];
                let vNev = item.versenyzo ? ('<strong>' + item.versenyzo.name + '</strong> <small>(' + item.versenyzo.club + ' - ' + item.versenyzo.belt + ')</small>') : '-';

                let ujrakatazas = false;
                if (item.kesz) {
                    if (i > 0 && teljesSorrend[i-1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i-1]) === 0) ujrakatazas = true;
                    if (i < teljesSorrend.length - 1 && teljesSorrend[i+1].kesz && TatamiMaster.kataSorrendHasonlito(item, teljesSorrend[i+1]) === 0) ujrakatazas = true;
                }

                let top6Jeloles = (isSelejtezoTabla && item.kesz && i < 6);
                let sorStilus = top6Jeloles ? 'background-color: #e8f5e9;' : (!isSelejtezoTabla && item.kesz && i < 3 ? 'background-color: #fffef0;' : '');

                tHtml += '<tr style="' + sorStilus + '">';
                tHtml += '<td><strong>' + (item.kesz ? (i + 1) + '.' : '-') + '</strong></td>';
                tHtml += '<td>' + vNev + (top6Jeloles ? ' <span style="background:#28a745;color:white;padding:2px 6px;border-radius:4px;font-size:0.75rem;">TOP 6 DÖNTŐS</span>' : '') + '</td>';

                for (let b = 0; b < 5; b++) {
                    let p = item.pontok[b] !== undefined && item.pontok[b] !== null ? item.pontok[b] : '-';
                    let st = (b === item.minIdx || b === item.maxIdx) ? 'text-decoration: line-through; color: #999;' : 'font-weight: bold;';
                    tHtml += '<td style="' + st + '">' + p + '</td>';
                }

                tHtml += '<td style="color: #666;">' + (item.kesz ? item.minErtek.toFixed(1) : '-') + '</td>';
                tHtml += '<td style="color: #666;">' + (item.kesz ? item.maxErtek.toFixed(1) : '-') + '</td>';
                tHtml += '<td style="font-size: 1.2rem; font-weight: bold; color: #dc3545;">' + (item.kesz ? item.osszeg.toFixed(1) : '-') + '</td>';
                tHtml += '<td>' + (ujrakatazas ? '<span style="background:#dc3545;color:white;padding:3px 6px;border-radius:4px;font-weight:bold;">⚠️ ÚJRAKATÁZÁS!</span>' : (item.kesz ? '<span style="color:green;font-weight:bold;">✔ Értékelve</span>' : '⏳ Rajtszám: #' + item.meccs.matchOrder)) + '</td>';
                tHtml += '</tr>';
            }
            tHtml += '</table>';
            return tHtml;
        }

        let html = '';

        if (dontoMeccsek.length === 0) {
            html += '<div style="margin-top: 15px; padding: 12px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">';
            html += '<span>🏆 <strong>Kata Döntő (Top 6):</strong> Ha a selejtező lezajlott, egy kattintással beküldheted a legjobb 6 versenyzőt a döntőbe (0 pontról indulnak újra)!</span>';
            html += '<button class="btn btn-outline-green" style="background: #28a745; color: white; font-weight: bold;" onclick="inditKataTop6Donto(' + katId + ')">🚀 Top 6 Döntő Generálása</button>';
            html += '</div>';
        } else {
            html += epitsKataTablazat(dontoMeccsek, '🏆 KATA DÖNTŐ (TOP 6 - Nullázott pontszámokkal)', false);
        }

        html += epitsKataTablazat(selejtezoMeccsek, '📋 1. Kör: Selejtező Ranglista (A legjobb 6 jut a döntőbe)', true);
        container.innerHTML = html;
        return;
    }

    // --- 2. HA KUMITE KATEGÓRIA: VIZUÁLIS ÁGRAJZ + JELMAGYARÁZAT + KÖRMÉRKŐZÉS TABELLA ---
    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();
    katMeccsek.sort((a, b) => a.id - b.id);

    let jelmagyarazatHtml = '<div style="background: #fff; border: 1px solid #ddd; padding: 10px 15px; border-radius: 6px; margin-top: 15px; font-size: 0.85rem; display: flex; gap: 15px; flex-wrap: wrap;">';
    jelmagyarazatHtml += '<strong>📌 Győzelmi Jelmagyarázat:</strong>';
    for (let kulcs in TatamiMaster.WIN_TYPES) {
        let wt = TatamiMaster.WIN_TYPES[kulcs];
        jelmagyarazatHtml += '<span><strong style="color:#dc3545;">[' + wt.rovid + ']</strong> = ' + wt.cimke + (wt.pont ? ' <em>(' + wt.pont + 'p)</em>' : '') + '</span>';
    }
    jelmagyarazatHtml += '</div>';

    let fordulok = [];
    let osszes = katMeccsek.length;
    let isAgrajz = (osszes === 3 || osszes === 7 || osszes === 15);

    if (isAgrajz) {
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

    let html = jelmagyarazatHtml + '<div class="bracket-wrapper">';
    for (let r = 0; r < fordulok.length; r++) {
        let korCim = isAgrajz
            ? (r === fordulok.length - 1 ? "🏆 Döntő" : (r === fordulok.length - 2 ? "Elődöntők" : (r + 1) + ". Forduló"))
            : "Körmérkőzések";

        html += '<div class="bracket-round"><h4>' + korCim + '</h4>';
        for (let m of fordulok[r]) {
            let v1 = globalVersenyzok.find(v => v.id === m.competitor1Id);
            let v2 = globalVersenyzok.find(v => v.id === m.competitor2Id);

            let isBye = (m.isFinished && !m.competitor2Id);
            let akaNev = v1 ? v1.name : "Várakozik...";
            let shiroNev = isBye ? "" : (v2 ? v2.name : "Várakozik...");

            let akaWinner = (m.isFinished && m.winnerId === m.competitor1Id) ? "winner" : "";
            let shiroWinner = (m.isFinished && m.winnerId === m.competitor2Id) ? "winner" : "";

            let reszlet = kumiteAdatok[m.id];
            let modKod = isBye ? '' : (reszlet && reszlet.winType ? reszlet.winType : 'HANTEI');
            let modRovid = (modKod && TatamiMaster.WIN_TYPES[modKod]) ? TatamiMaster.WIN_TYPES[modKod].rovid : modKod;
            let modCimke = (modKod && TatamiMaster.WIN_TYPES[modKod]) ? TatamiMaster.WIN_TYPES[modKod].cimke : '';

            let akaJelzes = akaWinner ? (modRovid ? '<strong>[' + modRovid + ']</strong> ✔' : '✔') : '';
            let shiroJelzes = shiroWinner ? (modRovid ? '<strong>[' + modRovid + ']</strong> ✔' : '✔') : '';

            html += '<div class="bracket-match ' + (m.isFinished ? 'finished' : '') + '" title="' + (m.isFinished ? modCimke : '') + '">';
            html += '<div class="bracket-fighter aka ' + akaWinner + '"><span>🔴 ' + akaNev + '</span><span>' + akaJelzes + '</span></div>';
            html += '<div class="bracket-fighter shiro ' + shiroWinner + '"><span>' + (shiroNev ? '⚪ ' + shiroNev : '&nbsp;') + '</span><span>' + shiroJelzes + '</span></div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';

    if (!isAgrajz) {
        let stat = {};
        for (let m of katMeccsek) {
            if (m.competitor1Id && !stat[m.competitor1Id]) stat[m.competitor1Id] = { id: m.competitor1Id, gyozelem: 0, pont: 0, modok: [] };
            if (m.competitor2Id && !stat[m.competitor2Id]) stat[m.competitor2Id] = { id: m.competitor2Id, gyozelem: 0, pont: 0, modok: [] };

            if (m.isFinished && m.winnerId && stat[m.winnerId]) {
                let reszlet = kumiteAdatok[m.id];
                let modKod = reszlet && reszlet.winType ? reszlet.winType : 'HANTEI';
                let wt = TatamiMaster.WIN_TYPES[modKod] || TatamiMaster.WIN_TYPES['HANTEI'];
                stat[m.winnerId].gyozelem++;
                stat[m.winnerId].pont += wt.pont;
                stat[m.winnerId].modok.push(wt.rovid);
            }
        }

        let tabella = Object.values(stat).sort((a, b) => (b.gyozelem - a.gyozelem) || (b.pont - a.pont));
        html += '<h4 style="margin-top: 20px;">📊 Körmérkőzés Élő Tabella (Győzelmek és Győzelmi mód súlypontok alapján)</h4>';
        html += '<table class="data-table"><tr><th>Helyezés</th><th>Versenyző</th><th>Győzelmek száma</th><th>Súlyozott Pont (IPP/AWA/SIK/KIK=3p, WAZ=2p, HAN=1p)</th><th>Győzelmek módjai</th></tr>';
        for (let i = 0; i < tabella.length; i++) {
            let v = globalVersenyzok.find(x => x.id === tabella[i].id);
            html += '<tr>';
            html += '<td><strong>' + (i + 1) + '.</strong></td>';
            html += '<td><strong>' + (v ? v.name + ' (' + v.club + ')' : '#' + tabella[i].id) + '</strong></td>';
            html += '<td>' + tabella[i].gyozelem + ' db</td>';
            html += '<td style="color:#dc3545; font-weight:bold;">' + tabella[i].pont + ' pont</td>';
            html += '<td>' + (tabella[i].modok.length > 0 ? tabella[i].modok.join(', ') : '-') + '</td>';
            html += '</tr>';
        }
        html += '</table>';
    }

    container.innerHTML = html;
}

async function inditKataTop6Donto(katId) {
    const kataTarolo = TatamiMaster.lekerKataEredmenyek();
    let selejtezoMeccsek = globalMerkozesek.filter(m => m.categoryId === katId && !TatamiMaster.isKataDontoMeccs(m.id));

    let lepontozottak = selejtezoMeccsek.map(m => {
        let eredmeny = kataTarolo[m.id];
        return eredmeny && eredmeny.kesz ? { meccs: m, ...eredmeny } : null;
    }).filter(Boolean);

    if (lepontozottak.length === 0) {
        alert("Még egyetlen versenyző sincs lepontozva a selejtezőben!");
        return;
    }

    lepontozottak.sort(TatamiMaster.kataSorrendHasonlito);
    let top6 = lepontozottak.slice(0, 6);
    top6.reverse(); // A 6. helyezett kezd, az 1. helyezett zárja a döntőt

    let tatamiId = selejtezoMeccsek[0].tatamiId;
    let tatamiMeccsei = globalMerkozesek.filter(m => m.tatamiId === tatamiId);
    let sorszam = tatamiMeccsei.length > 0 ? Math.max(...tatamiMeccsei.map(m => m.matchOrder)) + 1 : 1;

    let ujDontoMeccsIdk = [];

    for (let item of top6) {
        let ujMeccs = {
            categoryId: katId,
            tatamiId: tatamiId,
            competitor1Id: item.meccs.competitor1Id,
            competitor2Id: null,
            matchOrder: sorszam++,
            isFinished: false,
            winnerId: null
        };

        let res = await fetch(API_URL + '/Matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ujMeccs)
        });

        if (res.ok) {
            let mentett = await res.json();
            ujDontoMeccsIdk.push(mentett.id);
        }
    }

    TatamiMaster.megjelolKataDontoMeccsek(ujDontoMeccsIdk);
    alert("A Kata Top " + top6.length + " Döntő sikeresen elindítva! A döntősök felkerültek a tatamira 0 ponttal.");
    await merkozesekBetoltese();
}

// ==========================================
// 5. ADATBÁZIS FELTÖLTÉSE TESZTADATOKKAL
// ==========================================
async function adatbazisFeltoltese() {
    if (!confirm("Feltöltöd az adatbázist tatamikkal, kategóriákkal, versenyzőkkel és nevezésekkel?")) return;

    const headers = { 'Content-Type': 'application/json' };

    try {
        if (globalTatamik.length === 0) {
            const tatamik = ["A tatami", "B tatami", "C tatami"];
            for (let t of tatamik) {
                await fetch(API_URL + '/Tatamis', { method: 'POST', headers, body: JSON.stringify({ name: t }) });
            }
        }

        const kategoriak = [
            { name: "Junior Férfi Kata", matchType: "KATA", gender: "Férfi", minAge: 16, maxAge: 18 },
            { name: "Felnőtt Férfi Kumite -70kg", matchType: "KUMITE", gender: "Férfi", minAge: 18, maxAge: 35 },
            { name: "Felnőtt Férfi Kumite -80kg", matchType: "KUMITE", gender: "Férfi", minAge: 18, maxAge: 35 }
        ];
        for (let k of kategoriak) {
            await fetch(API_URL + '/Categories', { method: 'POST', headers, body: JSON.stringify(k) });
        }

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

        await versenyzokBetoltese();
        await kategoriakBetoltese();

        const kataKat = globalKategoriak.find(k => k.matchType === "KATA");
        const kumite70 = globalKategoriak.find(k => k.name.includes("-70kg"));
        const kumite80 = globalKategoriak.find(k => k.name.includes("-80kg"));

        if (kumite70 && kumite80 && globalVersenyzok.length >= 8) {
            const utolso8 = globalVersenyzok.slice(-8);
            // Mind a 8 főt benevezzük Katába is, hogy a Top 6 Döntőt azonnal tudjuk tesztelni!
            if (kataKat) {
                for (let i = 0; i < 7; i++) {
                    await fetch(API_URL + '/Registrations', {
                        method: 'POST', headers,
                        body: JSON.stringify({ competitorId: utolso8[i].id, categoryId: kataKat.id })
                    });
                }
            }
            for (let i = 0; i < 5; i++) {
                await fetch(API_URL + '/Registrations', {
                    method: 'POST', headers,
                    body: JSON.stringify({ competitorId: utolso8[i].id, categoryId: kumite70.id })
                });
            }
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