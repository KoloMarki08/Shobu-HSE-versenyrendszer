window.onload = function() {
    versenyzokBetoltese();
    kategoriakBetoltese();
    nevezesekBetoltese();
    tatamikBetoltese();     // Ezt add hozzá
    merkozesekBetoltese();  // Ezt is add hozzá
};

// --- VERSENYZŐK KEZELÉSE ---
function versenyzokBetoltese() {
    fetch('https://localhost:7045/api/Competitors')
        .then(response => response.json())
        .then(adatok => {
            let html = '<table class="data-table">';
            html += '<tr><th>ID</th><th>Név</th><th>Klub</th><th>Művelet</th></tr>';

            let selectHtml = '<option value="">Válassz versenyzőt...</option>';

            for (let i = 0; i < adatok.length; i++) {
                // Táblázat sor
                html += '<tr>';
                html += '<td>' + adatok[i].id + '</td>';
                html += '<td>' + adatok[i].name + '</td>';
                html += '<td>' + (adatok[i].club ? adatok[i].club : '-') + '</td>';
                html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolVersenyzo(' + adatok[i].id + ')">Törlés</button></td>';
                html += '</tr>';

                // Legördülő menü opció a nevezésekhez
                selectHtml += '<option value="' + adatok[i].id + '">' + adatok[i].name + ' (' + adatok[i].club + ')</option>';
            }
            
            html += '</table>';
            document.getElementById('versenyzokTableContainer').innerHTML = html;
            document.getElementById('ujNevezesVersenyzo').innerHTML = selectHtml;
        })
        .catch(hiba => {
            document.getElementById('versenyzokTableContainer').innerHTML = '<p style="color:red;">Hiba az adatok betöltésekor!</p>';
        });
}

function hozzadVersenyzo() {
    const nev = document.getElementById('ujVersenyzoNev').value;
    const klub = document.getElementById('ujVersenyzoKlub').value;

    if (nev === "") {
        alert("A nevet kötelező megadni!");
        return;
    }

    const ujAdat = {
        name: nev,
        club: klub
    };

    fetch('https://localhost:7045/api/Competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujAdat)
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('ujVersenyzoNev').value = '';
            document.getElementById('ujVersenyzoKlub').value = '';
            versenyzokBetoltese(); // Újratölti a listát ÉS a legördülő menüt is!
        }
    });
}

function torolVersenyzo(id) {
    if (confirm("Biztosan törölni szeretnéd ezt a versenyzőt?")) {
        fetch('https://localhost:7045/api/Competitors/' + id, { method: 'DELETE' })
        .then(response => { if (response.ok) versenyzokBetoltese(); });
    }
}


// --- KATEGÓRIÁK KEZELÉSE ---
function kategoriakBetoltese() {
    fetch('https://localhost:7045/api/Categories')
        .then(response => response.json())
        .then(adatok => {
            let html = '<table class="data-table">';
            html += '<tr><th>ID</th><th>Kategória Neve</th><th>Művelet</th></tr>';

            let selectHtml = '<option value="">Válassz kategóriát...</option>';

            for (let i = 0; i < adatok.length; i++) {
                html += '<tr>';
                html += '<td>' + adatok[i].id + '</td>';
                html += '<td>' + adatok[i].name + '</td>';
                html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolKategoria(' + adatok[i].id + ')">Törlés</button></td>';
                html += '</tr>';

                selectHtml += '<option value="' + adatok[i].id + '">' + adatok[i].name + '</option>';
            }
            
            html += '</table>';
            document.getElementById('kategoriakTableContainer').innerHTML = html;
            document.getElementById('ujNevezesKategoria').innerHTML = selectHtml;
        });
}

function hozzadKategoria() {
    const nev = document.getElementById('ujKategoriaNev').value;
    if (nev === "") { alert("Kötelező megadni!"); return; }

    fetch('https://localhost:7045/api/Categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nev })
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('ujKategoriaNev').value = '';
            kategoriakBetoltese();
        }
    });
}

function torolKategoria(id) {
    if (confirm("Biztosan törölni szeretnéd ezt a kategóriát?")) {
        fetch('https://localhost:7045/api/Categories/' + id, { method: 'DELETE' })
        .then(response => { if (response.ok) kategoriakBetoltese(); });
    }
}


// --- NEVEZÉSEK KEZELÉSE ---
function nevezesekBetoltese() {
    fetch('https://localhost:7045/api/Registrations')
        .then(response => response.json())
        .then(adatok => {
            let html = '<table class="data-table">';
            // Ha a C# backended bekapcsolta az "Include"-ot, akkor az adatok[i].competitor.name is működhetne. 
            // Most egyelőre az ID-ket íratjuk ki, hogy biztosan működjön.
            html += '<tr><th>Nevezés ID</th><th>Versenyző ID</th><th>Kategória ID</th><th>Művelet</th></tr>';

            for (let i = 0; i < adatok.length; i++) {
                html += '<tr>';
                html += '<td>' + adatok[i].id + '</td>';
                html += '<td>' + adatok[i].competitorId + '</td>';
                html += '<td>' + adatok[i].categoryId + '</td>';
                html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolNevezes(' + adatok[i].id + ')">Törlés</button></td>';
                html += '</tr>';
            }
            
            html += '</table>';
            document.getElementById('nevezesekTableContainer').innerHTML = html;
        });
}

function hozzadNevezes() {
    const versenyzoId = document.getElementById('ujNevezesVersenyzo').value;
    const kategoriaId = document.getElementById('ujNevezesKategoria').value;

    if (versenyzoId === "" || kategoriaId === "") {
        alert("Kérlek válassz versenyzőt és kategóriát is!");
        return;
    }

    const ujAdat = {
        competitorId: parseInt(versenyzoId),
        categoryId: parseInt(kategoriaId)
    };

    fetch('https://localhost:7045/api/Registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujAdat)
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('ujNevezesVersenyzo').value = '';
            document.getElementById('ujNevezesKategoria').value = '';
            nevezesekBetoltese();
        } else {
            alert("Hiba történt a nevezés rögzítésekor!");
        }
    });
}

function torolNevezes(id) {
    if (confirm("Biztosan törölni szeretnéd ezt a nevezést?")) {
        fetch('https://localhost:7045/api/Registrations/' + id, { method: 'DELETE' })
        .then(response => { if (response.ok) nevezesekBetoltese(); });
    }
}

// --- TATAMIK ÉS MÉRKŐZÉSEK (SORSOLÁS) ---

function tatamikBetoltese() {
    fetch('https://localhost:7045/api/Tatamis')
        .then(response => response.json())
        .then(adatok => {
            let html = '<table class="data-table">';
            html += '<tr><th>ID</th><th>Tatami Neve</th></tr>';

            for (let i = 0; i < adatok.length; i++) {
                html += '<tr>';
                html += '<td>' + adatok[i].id + '</td>';
                html += '<td><strong>' + adatok[i].name + '</strong></td>';
                html += '</tr>';
            }
            
            html += '</table>';
            document.getElementById('tatamikTableContainer').innerHTML = html;
        });
}

function merkozesekBetoltese() {
    fetch('https://localhost:7045/api/Matches')
        .then(response => response.json())
        .then(adatok => {
            let html = '<table class="data-table">';
            html += '<tr><th>ID</th><th>Tatami</th><th>Kategória</th><th>Piros (AKA)</th><th>Fehér (SHIRO)</th><th>Művelet</th></tr>';

            for (let i = 0; i < adatok.length; i++) {
                // Ellenőrizzük, hogy az "Include" miatt megjöttek-e a belső adatok. Ha igen, kiírjuk a nevüket!
                let tatamiNev = adatok[i].tatami ? adatok[i].tatami.name : adatok[i].tatamiId;
                let kategoriaNev = adatok[i].category ? adatok[i].category.name : adatok[i].categoryId;
                let akaNev = adatok[i].competitor1 ? adatok[i].competitor1.name : "Versenyző 1";
                let shiroNev = adatok[i].competitor2 ? adatok[i].competitor2.name : "Versenyző 2";

                html += '<tr>';
                html += '<td>' + adatok[i].id + '</td>';
                html += '<td style="color: blue; font-weight: bold;">' + tatamiNev + '</td>';
                html += '<td>' + kategoriaNev + '</td>';
                html += '<td style="color: red; font-weight: bold;">' + akaNev + '</td>';
                html += '<td style="font-weight: bold;">' + shiroNev + '</td>';
                html += '<td><button class="btn btn-outline" style="padding: 4px 8px;" onclick="torolMerkozes(' + adatok[i].id + ')">Törlés</button></td>';
                html += '</tr>';
            }
            
            html += '</table>';
            document.getElementById('merkozesekTableContainer').innerHTML = html;
        });
}

function torolMerkozes(id) {
    if (confirm("Biztosan törlöd ezt a mérkőzést?")) {
        fetch('https://localhost:7045/api/Matches/' + id, { method: 'DELETE' })
        .then(response => { if (response.ok) merkozesekBetoltese(); });
    }
}

// Ideiglenes teszt gomb, amivel manuálisan csinálunk egy meccset, amíg nincs kész a sorsolas.js
function tesztSorsolas() {
    // Ezeket a számokat (ID-kat) majd a rendszer fogja kikövetkeztetni, most fixen küldjük
    const ujMeccs = {
        categoryId: 1,      // Feltételezzük, hogy az 1-es az első kategóriád
        tatamiId: 1,        // Az 1-es az "A tatami"
        competitor1Id: 1,   // Első versenyződ ID-ja
        competitor2Id: 2,   // Második versenyződ ID-ja
        status: "Folyamatban",
        akaScore: 0,
        shiroScore: 0
    };

    fetch('https://localhost:7045/api/Matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ujMeccs)
    })
    .then(response => {
        if (response.ok) {
            merkozesekBetoltese();
        } else {
            alert("Hiba! Biztosan van legalább 2 versenyződ és 1 kategóriád felvéve?");
        }
    });
}