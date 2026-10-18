function initDedikaltKiemelesPage() {
    const katSel = document.getElementById('dedSorsolasKatSelect');
    const tatSel = document.getElementById('dedSorsolasTatamiSelect');

    if (katSel) {
        katSel.innerHTML = '<option value="">-- Válassz kategóriát! --</option>' +
            exKategoriak.map(k => `<option value="${k.id}">${k.name} (${k.matchType})</option>`).join('');
    }
    if (tatSel) {
        tatSel.innerHTML = exTatamik.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
}

function dedikaltIndulokBetoltese() {
    const katId = parseInt(document.getElementById('dedSorsolasKatSelect').value);
    const listaDiv = document.getElementById('dedKiemelesLista');
    if (!katId || !listaDiv) return;

    const nevezettek = exNevezesek.filter(n => n.categoryId === katId)
                                  .map(n => exVersenyzok.find(v => v.id === n.competitorId))
                                  .filter(Boolean);

    if (nevezettek.length === 0) {
        listaDiv.innerHTML = '<span style="color:#dc3545;font-weight:bold;">Ebben a kategóriában még nincs benevezett versenyző!</span>';
        return;
    }

    listaDiv.innerHTML = nevezettek.map(v => `
        <label style="background:white;padding:8px 14px;border:1px solid #ccc;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:8px;">
            <input type="checkbox" class="ded-kiemelt-cb" value="${v.id}">
            <span><strong>${v.name}</strong> <small>(${v.club} - ${v.belt}, ${v.weight}kg)</small></span>
        </label>
    `).join('');
}

async function dedikaltSorsolasInditasa() {
    const katId = parseInt(document.getElementById('dedSorsolasKatSelect').value);
    const tatamiId = parseInt(document.getElementById('dedSorsolasTatamiSelect').value);
    const formatum = document.getElementById('dedSorsolasFormatumSelect').value;

    if (!katId || !tatamiId) {
        alert("Válassz kategóriát és tatamit is!");
        return;
    }

    const kivalasztottKat = exKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType.toUpperCase() === 'KATA');

    let indulok = exNevezesek.filter(n => n.categoryId === katId)
                             .map(n => exVersenyzok.find(v => v.id === n.competitorId))
                             .filter(Boolean);

    if (indulok.length === 0) {
        alert("Nincs benevezett versenyző ebben a kategóriában!");
        return;
    }

    const kiemeltIdk = Array.from(document.querySelectorAll('.ded-kiemelt-cb:checked')).map(cb => parseInt(cb.value));
    let kiemeltek = indulok.filter(v => kiemeltIdk.includes(v.id));
    let tobbiek = indulok.filter(v => !kiemeltIdk.includes(v.id)).sort(() => Math.random() - 0.5);
    let rendezett = kiemeltek.concat(tobbiek);

    const tatamiMeccsei = exMeccsek.filter(m => m.tatamiId === tatamiId);
    let sorszam = tatamiMeccsei.length > 0 ? Math.max(...tatamiMeccsei.map(m => m.matchOrder)) + 1 : 1;
    let generaltMeccsek = [];

    if (isKata) {
        let kataSorrend = tobbiek.concat(kiemeltek);
        for (let v of kataSorrend) {
            generaltMeccsek.push({
                categoryId: katId, tatamiId: tatamiId,
                competitor1Id: v.id, competitor2Id: null,
                matchOrder: sorszam++, isFinished: false, winnerId: null
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
        let agrajzMeret = 2;
        while (agrajzMeret < rendezett.length) agrajzMeret *= 2;
        let eronyerokSzama = agrajzMeret - rendezett.length;
        let kuzdok = [...rendezett];
        let elsoKorMeccsek = [];

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

        while (kuzdok.length > 0) {
            let v = kuzdok.shift();
            elsoKorMeccsek.push({
                categoryId: katId, tatamiId: tatamiId,
                competitor1Id: v.id, competitor2Id: null,
                matchOrder: sorszam++, isFinished: true, winnerId: v.id
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
        await TatamiMaster.apiSend('Matches', 'POST', m);
    }

    alert(`✔ Sorsolás kész! (${generaltMeccsek.length} tétel létrehozva). Átirányítás az ágrajzhoz / ranglistához...`);
    window.location.href = isKata ? 'kata.html' : 'kumite.html';
}