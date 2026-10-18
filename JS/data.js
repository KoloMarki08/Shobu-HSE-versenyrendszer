let exVersenyzok = [];
let exKategoriak = [];
let exNevezesek = [];
let exTatamik = [];
let exMeccsek = [];

window.addEventListener('DOMContentLoaded', async function() {
    await extraAdatokBetoltese();
});

async function extraAdatokBetoltese() {
    try {
        const [v, k, n, t, m] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Registrations'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches')
        ]);
        exVersenyzok = v;
        exKategoriak = k;
        exNevezesek = n;
        exTatamik = t;
        exMeccsek = m.sort((a, b) => (a.tatamiId - b.tatamiId) || (a.matchOrder - b.matchOrder));

        if (document.getElementById('pageKategoriak')) initKategoriakPage();
        if (document.getElementById('pageEredmenyek')) initEredmenyekPage();
        if (document.getElementById('pageNevezes')) initNevezesPage();
        if (document.getElementById('pageTatami')) initTatamiPage();
        if (document.getElementById('pageReferee')) initRefereePage();
        if (typeof initDedikaltKataPage === 'function' && document.getElementById('pageKata')) initDedikaltKataPage();
        if (typeof initDedikaltKumitePage === 'function' && document.getElementById('pageKumite')) initDedikaltKumitePage();
        if (typeof initDedikaltKiemelesPage === 'function' && document.getElementById('pageKiemeles')) initDedikaltKiemelesPage();
    } catch (e) {
        console.error("Hiba az adatok betöltésekor:", e);
    }
}

// Övfokozat szövegből (pl. "4. kyu", "1. dan") numerikus kyu-számot csinál (Dan = 0)
function parseKyuSzam(beltStr) {
    if (!beltStr) return 10;
    let s = beltStr.toLowerCase().trim();
    if (s.includes('dan')) return 0;
    let szam = parseInt(s.replace(/[^0-9]/g, ''));
    return isNaN(szam) ? 10 : szam;
}

// 1. KATEGORIAK.HTML - KATA KYU-BONTÓ (A/B/C) & SÚLYBONTÓ
function initKategoriakPage() {
    const kataKatok = exKategoriak.filter(k => k.matchType && k.matchType.toUpperCase() === 'KATA');
    const kumiteKatok = exKategoriak.filter(k => !k.matchType || k.matchType.toUpperCase() === 'KUMITE');

    let kataOpt = '<option value="">-- Válassz Kata kategóriát! --</option>';
    for (let k of kataKatok) {
        let db = exNevezesek.filter(n => n.categoryId === k.id).length;
        kataOpt += `<option value="${k.id}">${k.name} (${db} nevezett)</option>`;
    }
    document.getElementById('kyuBontoKatSelect').innerHTML = kataOpt;

    let kumiteOpt = '<option value="">-- Válassz Kumite kategóriát! --</option>';
    for (let k of kumiteKatok) {
        let db = exNevezesek.filter(n => n.categoryId === k.id).length;
        kumiteOpt += `<option value="${k.id}">${k.name} (${db} nevezett)</option>`;
    }
    document.getElementById('sulyBontoKatSelect').innerHTML = kumiteOpt;

    let tablaHtml = '<table class="data-table"><tr><th>ID</th><th>Kategória neve</th><th>Típus</th><th>Nem</th><th>Korcsoport</th><th>Indulók száma és Övfokozataik</th></tr>';
    for (let k of exKategoriak) {
        let nevezettek = exNevezesek.filter(n => n.categoryId === k.id)
                                    .map(n => exVersenyzok.find(v => v.id === n.competitorId))
                                    .filter(Boolean);
        let indulokInfo = nevezettek.map(v => `${v.name} <small>(${v.belt || '-'}, ${v.weight}kg)</small>`).join(', ') || '<em>Még nincs induló</em>';
        tablaHtml += `<tr>
            <td>${k.id}</td>
            <td><strong>${k.name}</strong></td>
            <td><span style="background:${k.matchType === 'KATA' ? '#ffc107' : '#dc3545'};color:${k.matchType === 'KATA' ? '#111' : '#fff'};padding:2px 8px;border-radius:4px;font-weight:bold;">${k.matchType}</span></td>
            <td>${k.gender}</td>
            <td>${k.minAge} - ${k.maxAge} év</td>
            <td><strong>${nevezettek.length} fő:</strong> ${indulokInfo}</td>
        </tr>`;
    }
    tablaHtml += '</table>';
    document.getElementById('kategoriakOsszesitoContainer').innerHTML = tablaHtml;
}

async function kataKyuBontasVegrehajtas() {
    const katId = parseInt(document.getElementById('kyuBontoKatSelect').value);
    const bontasMod = document.getElementById('kyuBontasModSelect').value;

    if (!katId) { alert("Válassz ki egy Kata kategóriát a bontáshoz!"); return; }

    const eredetiKat = exKategoriak.find(k => k.id === katId);
    const katNevezesek = exNevezesek.filter(n => n.categoryId === katId);

    if (katNevezesek.length === 0) {
        alert("Ebben a Kata kategóriában még nincs benevezett versenyző!");
        return;
    }

    let csoportok = (bontasMod === 'ABC') ? [
        { utotag: ' - A kategória (2. kyu - Dan)', minKyu: 0, maxKyu: 2 },
        { utotag: ' - B kategória (6-3. kyu)',     minKyu: 3, maxKyu: 6 },
        { utotag: ' - C kategória (10-7. kyu)',    minKyu: 7, maxKyu: 12 }
    ] : [
        { utotag: ' - A kategória (5. kyu - Dan)', minKyu: 0, maxKyu: 5 },
        { utotag: ' - B kategória (10-6. kyu)',    minKyu: 6, maxKyu: 12 }
    ];

    const alapNev = eredetiKat.name.split(' - ')[0];
    eredetiKat.name = alapNev + csoportok[0].utotag;
    await TatamiMaster.apiSend('Categories/' + eredetiKat.id, 'PUT', eredetiKat);

    let atsorolvaOsszesen = 0;

    for (let i = 1; i < csoportok.length; i++) {
        let cs = csoportok[i];
        let erintettNevezesek = katNevezesek.filter(n => {
            let v = exVersenyzok.find(x => x.id === n.competitorId);
            let kyu = parseKyuSzam(v ? v.belt : '10. kyu');
            return kyu >= cs.minKyu && kyu <= cs.maxKyu;
        });

        const res = await TatamiMaster.apiSend('Categories', 'POST', {
            name: alapNev + cs.utotag,
            matchType: 'KATA',
            gender: eredetiKat.gender,
            minAge: eredetiKat.minAge,
            maxAge: eredetiKat.maxAge
        });

        if (res.ok) {
            const letrejottKat = await res.json();
            for (let nev of erintettNevezesek) {
                await TatamiMaster.apiSend('Registrations/' + nev.id, 'PUT', {
                    id: nev.id,
                    competitorId: nev.competitorId,
                    categoryId: letrejottKat.id
                });
                atsorolvaOsszesen++;
            }
        }
    }

    alert(`✔ Kata Kyu-bontás kész! ${atsorolvaOsszesen} versenyző automatikusan átsorolva az övfokozata alapján!`);
    await extraAdatokBetoltese();
}

async function extraSulyBontas() {
    const katId = parseInt(document.getElementById('sulyBontoKatSelect').value);
    const hatar = parseInt(document.getElementById('extraSulyHatar').value);
    if (!katId || isNaN(hatar)) { alert("Válassz kategóriát és adj meg súlyhatárt!"); return; }

    const eredeti = exKategoriak.find(k => k.id === katId);
    const res = await TatamiMaster.apiSend('Categories', 'POST', {
        name: eredeti.name + " (+" + hatar + "kg)",
        matchType: eredeti.matchType,
        gender: eredeti.gender,
        minAge: eredeti.minAge,
        maxAge: eredeti.maxAge
    });

    if (res.ok) {
        const ujKat = await res.json();
        const nevezettek = exNevezesek.filter(n => n.categoryId === katId);
        let db = 0;
        for (let n of nevezettek) {
            let v = exVersenyzok.find(x => x.id === n.competitorId);
            if (v && v.weight >= hatar) {
                await TatamiMaster.apiSend('Registrations/' + n.id, 'PUT', { id: n.id, competitorId: n.competitorId, categoryId: ujKat.id });
                db++;
            }
        }
        alert(`✔ Súlybontás kész! ${db} versenyző átsorolva a +${hatar}kg kategóriába.`);
        await extraAdatokBetoltese();
    }
}

// 2. EREDMENYEK.HTML - DOBOGÓSOK, KLUBRANGLISTA & OKLEVÉL
function initEredmenyekPage() {
    const kataTarolo = TatamiMaster.lekerKataEredmenyek();
    const kumiteAdatok = TatamiMaster.lekerKumiteReszletek();
    let klubPontok = {};

    function adKlubErem(versenyzo, helyezes) {
        if (!versenyzo || !versenyzo.club) return;
        let klub = versenyzo.club;
        if (!klubPontok[klub]) klubPontok[klub] = { klub: klub, arany: 0, ezust: 0, bronz: 0, pont: 0 };
        if (helyezes === 1) { klubPontok[klub].arany++; klubPontok[klub].pont += 5; }
        if (helyezes === 2) { klubPontok[klub].ezust++; klubPontok[klub].pont += 3; }
        if (helyezes === 3) { klubPontok[klub].bronz++; klubPontok[klub].pont += 1; }
    }

    let dobogoHtml = '';

    for (let kat of exKategoriak) {
        let katMeccsek = exMeccsek.filter(m => m.categoryId === kat.id);
        if (katMeccsek.length === 0) continue;

        let dobogosok = [];
        let isKata = (kat.matchType && kat.matchType.toUpperCase() === 'KATA');

        if (isKata) {
            let dontoMeccsek = katMeccsek.filter(m => TatamiMaster.isKataDontoMeccs(m.id));
            let ertekeltMeccsek = (dontoMeccsek.length > 0 ? dontoMeccsek : katMeccsek)
                .map(m => kataTarolo[m.id] && kataTarolo[m.id].kesz ? { m: m, ...kataTarolo[m.id] } : null)
                .filter(Boolean)
                .sort(TatamiMaster.kataSorrendHasonlito);

            if (ertekeltMeccsek[0]) dobogosok.push({ hely: 1, v: exVersenyzok.find(x => x.id === ertekeltMeccsek[0].m.competitor1Id), extra: ertekeltMeccsek[0].osszeg.toFixed(1) + ' p' });
            if (ertekeltMeccsek[1]) dobogosok.push({ hely: 2, v: exVersenyzok.find(x => x.id === ertekeltMeccsek[1].m.competitor1Id), extra: ertekeltMeccsek[1].osszeg.toFixed(1) + ' p' });
            if (ertekeltMeccsek[2]) dobogosok.push({ hely: 3, v: exVersenyzok.find(x => x.id === ertekeltMeccsek[2].m.competitor1Id), extra: ertekeltMeccsek[2].osszeg.toFixed(1) + ' p' });
        } else {
            let sorted = [...katMeccsek].sort((a, b) => a.id - b.id);
            let n = sorted.length;
            let isAgrajz = (n === 3 || n === 7 || n === 15 || n === 31);

            if (isAgrajz) {
                let donto = sorted[n - 1];
                if (donto && donto.isFinished && donto.winnerId) {
                    let elsoId = donto.winnerId;
                    let masodikId = (donto.competitor1Id === elsoId) ? donto.competitor2Id : donto.competitor1Id;
                    dobogosok.push({ hely: 1, v: exVersenyzok.find(x => x.id === elsoId), extra: 'Döntő győztese' });
                    if (masodikId) dobogosok.push({ hely: 2, v: exVersenyzok.find(x => x.id === masodikId), extra: 'Döntős' });

                    if (n >= 3) {
                        [sorted[n - 3], sorted[n - 2]].forEach(ed => {
                            if (ed && ed.isFinished && ed.competitor1Id && ed.competitor2Id) {
                                let vesztesId = (ed.winnerId === ed.competitor1Id) ? ed.competitor2Id : ed.competitor1Id;
                                dobogosok.push({ hely: 3, v: exVersenyzok.find(x => x.id === vesztesId), extra: 'Elődöntős' });
                            }
                        });
                    }
                }
            } else {
                let stat = {};
                for (let m of katMeccsek) {
                    if (m.competitor1Id && !stat[m.competitor1Id]) stat[m.competitor1Id] = { id: m.competitor1Id, gy: 0, p: 0 };
                    if (m.competitor2Id && !stat[m.competitor2Id]) stat[m.competitor2Id] = { id: m.competitor2Id, gy: 0, p: 0 };
                    if (m.isFinished && m.winnerId && stat[m.winnerId]) {
                        let r = kumiteAdatok[m.id];
                        let wt = TatamiMaster.WIN_TYPES[r && r.winType ? r.winType : 'HANTEI'] || { pont: 1 };
                        stat[m.winnerId].gy++;
                        stat[m.winnerId].p += wt.pont;
                    }
                }
                let tab = Object.values(stat).sort((a, b) => (b.gy - a.gy) || (b.p - a.p));
                if (tab[0] && tab[0].gy > 0) dobogosok.push({ hely: 1, v: exVersenyzok.find(x => x.id === tab[0].id), extra: tab[0].p + ' súlypont' });
                if (tab[1] && tab[1].gy > 0) dobogosok.push({ hely: 2, v: exVersenyzok.find(x => x.id === tab[1].id), extra: tab[1].p + ' súlypont' });
                if (tab[2] && tab[2].gy > 0) dobogosok.push({ hely: 3, v: exVersenyzok.find(x => x.id === tab[2].id), extra: tab[2].p + ' súlypont' });
            }
        }

        if (dobogosok.length > 0) {
            dobogoHtml += `<div style="background:white;border:1px solid #ddd;border-left:5px solid #dc3545;border-radius:6px;padding:15px;margin-bottom:15px;">
                <h3 style="margin:0 0 10px 0;">🏆 ${kat.name} (${kat.matchType})</h3>
                <table class="data-table"><tr><th>Helyezés</th><th>Versenyző</th><th>Klub</th><th>Eredmény</th><th>Oklevél</th></tr>`;
            for (let d of dobogosok) {
                if (!d.v) continue;
                adKlubErem(d.v, d.hely);
                let ikon = d.hely === 1 ? '🥇 1. hely' : (d.hely === 2 ? '🥈 2. hely' : '🥉 3. hely');
                dobogoHtml += `<tr>
                    <td><strong>${ikon}</strong></td>
                    <td><strong>${d.v.name}</strong></td>
                    <td>${d.v.club}</td>
                    <td>${d.extra}</td>
                    <td><button class="btn btn-outline-blue" style="padding:4px 10px;" onclick="nyomtatOklevel('${d.v.name}', '${d.v.club}', '${kat.name}', ${d.hely})">🖨️ Oklevél nyomtatása</button></td>
                </tr>`;
            }
            dobogoHtml += `</table></div>`;
        }
    }

    document.getElementById('dobogosokContainer').innerHTML = dobogoHtml || '<p>Még nincs lezárt kategória.</p>';

    let klubLista = Object.values(klubPontok).sort((a, b) => (b.pont - a.pont) || (b.arany - a.arany));
    let kHtml = '<table class="data-table"><tr><th>Helyezés</th><th>Klub / Egyesület</th><th>🥇 Arany (5p)</th><th>🥈 Ezüst (3p)</th><th>🥉 Bronz (1p)</th><th>Összpontszám</th></tr>';
    for (let i = 0; i < klubLista.length; i++) {
        let k = klubLista[i];
        kHtml += `<tr>
            <td><strong>${i + 1}.</strong></td>
            <td><strong>${k.klub}</strong></td>
            <td>${k.arany} db</td>
            <td>${k.ezust} db</td>
            <td>${k.bronz} db</td>
            <td style="color:#dc3545;font-weight:bold;font-size:1.15rem;">${k.pont} pont</td>
        </tr>`;
    }
    kHtml += '</table>';
    document.getElementById('klubRanglistaContainer').innerHTML = klubLista.length > 0 ? kHtml : '<p>Még nincs kiosztott érem.</p>';
}

function nyomtatOklevel(nev, klub, kategoria, helyezes) {
    const versenyNev = localStorage.getItem('aktualisVersenyNev') || 'TATAMI MASTER KYOKUSHIN KARATE KUPA';
    const w = window.open('', '_blank');
    w.document.write(`
        <html><head><title>Oklevél - ${nev}</title></head>
        <body style="font-family: Georgia, serif; text-align: center; padding: 60px; border: 12px double #dc3545; margin: 20px;">
            <h1 style="font-size: 3.2rem; letter-spacing: 4px; color: #dc3545; margin-bottom: 10px;">OKLEVÉL</h1>
            <h3 style="font-size: 1.5rem; color: #333; margin-bottom: 40px;">${versenyNev}</h3>
            <p style="font-size: 1.3rem;">Igazoljuk, hogy</p>
            <h2 style="font-size: 2.8rem; margin: 15px 0; border-bottom: 2px solid #222; display: inline-block; padding: 0 30px;">${nev}</h2>
            <p style="font-size: 1.4rem; color: #555; margin-top: 5px;">(${klub})</p>
            <p style="font-size: 1.4rem; margin-top: 35px;">a(z) <strong>${kategoria}</strong> kategóriában</p>
            <h1 style="font-size: 3rem; color: #222; margin: 20px 0;">🏆 ${helyezes}. HELYEZÉST</h1>
            <p style="font-size: 1.3rem;">ért el.</p>
            <div style="margin-top: 80px; display: flex; justify-content: space-around; font-size: 1.1rem;">
                <div style="border-top: 1px solid #333; padding-top: 8px; width: 220px;">Főbíró</div>
                <div style="border-top: 1px solid #333; padding-top: 8px; width: 220px;">Versenyigazgató</div>
            </div>
            <script>window.onload = function() { window.print(); }<\/script>
        </body></html>
    `);
    w.document.close();
}

// 3. NEVEZES.HTML - GYORS MÉRLEGELŐ ÁLLOMÁS
function initNevezesPage() {
    const kereso = (document.getElementById('merlegKeresoInput')?.value || '').toLowerCase();
    let szurt = exVersenyzok.filter(v => v.name.toLowerCase().includes(kereso) || (v.club && v.club.toLowerCase().includes(kereso)));

    let html = '<table class="data-table"><tr><th>Név</th><th>Klub</th><th>Öv</th><th>Szül. év</th><th>Mérlegelt Súly (kg)</th><th>Nevezett Kategóriái</th></tr>';
    for (let v of szurt) {
        let katNevLista = exNevezesek.filter(n => n.competitorId === v.id)
                                     .map(n => exKategoriak.find(k => k.id === n.categoryId)?.name)
                                     .filter(Boolean).join(', ') || '<em>Nincs benevezve</em>';
        html += `<tr>
            <td><strong>${v.name}</strong></td>
            <td>${v.club}</td>
            <td>${v.belt}</td>
            <td>${v.birthYear}</td>
            <td>
                <input type="number" id="gyorsSuly_${v.id}" value="${v.weight}" style="width:75px;padding:5px;font-weight:bold;"> kg
                <button class="btn btn-outline-green" style="padding:4px 10px;" onclick="gyorsSulyMentes(${v.id})">✔ Mentés</button>
            </td>
            <td>${katNevLista}</td>
        </tr>`;
    }
    html += '</table>';
    document.getElementById('gyorsMerlegeloContainer').innerHTML = html;
}

async function gyorsSulyMentes(id) {
    let v = exVersenyzok.find(x => x.id === id);
    let ujSuly = parseInt(document.getElementById('gyorsSuly_' + id).value);
    if (!v || isNaN(ujSuly)) return;
    v.weight = ujSuly;
    await TatamiMaster.apiSend('Competitors/' + id, 'PUT', v);
    alert(`✔ ${v.name} mérlegelt súlya (${ujSuly} kg) elmentve!`);
    await extraAdatokBetoltese();
}

// 4. TATAMI.HTML - PÁSTSZÉLI FELVEZETŐ NÉZET
function initTatamiPage() {
    const sel = document.getElementById('pastTatamiSelect');
    if (sel && sel.options.length === 0) {
        sel.innerHTML = exTatamik.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
    const tatamiId = parseInt(sel.value);
    const meccsek = exMeccsek.filter(m => m.tatamiId === tatamiId && (m.competitor1Id || m.competitor2Id));

    let html = '<table class="data-table"><tr><th>Sorszám</th><th>Kategória</th><th>Küzdők / Katázó</th><th>Státusz</th></tr>';
    for (let m of meccsek) {
        let kat = exKategoriak.find(k => k.id === m.categoryId);
        let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        if (!isKata && m.isFinished && !m.competitor2Id) continue;

        let v1 = exVersenyzok.find(v => v.id === m.competitor1Id);
        let v2 = exVersenyzok.find(v => v.id === m.competitor2Id);
        let parositas = isKata
            ? `🥋 <strong>${v1 ? v1.name + ' (' + v1.club + ')' : 'Várakozik...'}</strong>`
            : `<span style="color:#dc3545;font-weight:bold;">🔴 ${v1 ? v1.name + ' (' + v1.club + ')' : 'Várakozik...'}</span> vs. <strong>⚪ ${v2 ? v2.name + ' (' + v2.club + ')' : 'Várakozik...'}</strong>`;

        html += `<tr style="${m.isFinished ? 'opacity:0.55;background:#f8f9fa;' : ''}">
            <td><strong>#${m.matchOrder}</strong></td>
            <td>${kat ? kat.name : ''}</td>
            <td>${parositas}</td>
            <td>${m.isFinished ? '<span style="color:green;font-weight:bold;">✔ Lezajlott</span>' : '<span style="background:#ffc107;padding:3px 8px;border-radius:4px;font-weight:bold;">📢 Szólítandó</span>'}</td>
        </tr>`;
    }
    html += '</table>';
    document.getElementById('pastListaContainer').innerHTML = html;
}

// 5. REFEREE.HTML - OLDALBÍRÓI MOBIL PONTOZÓ PAD
function initRefereePage() {
    setInterval(() => {
        const tvAdat = JSON.parse(localStorage.getItem('tatamiAdatok') || '{}');
        const infoElem = document.getElementById('refAktMeccsInfo');
        if (infoElem) {
            infoElem.innerText = tvAdat.akaName ? `${tvAdat.matchInfo} — ${tvAdat.akaName}` : 'Várakozás az asztalbíróra...';
        }
    }, 1000);
}

function kuldOldalbiroiPont() {
    const biroIndex = parseInt(document.getElementById('refBiroSzamSelect').value);
    const pont = parseFloat(document.getElementById('refPontInput').value);
    if (isNaN(pont) || pont < 0 || pont > 10) {
        alert("Kérlek adj meg egy érvényes pontszámot (0.0 - 10.0)!");
        return;
    }
    let mobilPontok = JSON.parse(localStorage.getItem('mobilKataPontok') || '{}');
    mobilPontok['B' + biroIndex] = pont.toFixed(1);
    localStorage.setItem('mobilKataPontok', JSON.stringify(mobilPontok));
    alert(`✔ B${biroIndex + 1} bírói pontszám (${pont.toFixed(1)}) elküldve!`);
}