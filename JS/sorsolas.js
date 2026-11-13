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
    const formatSel = document.getElementById('dedSorsolasFormatumSelect');
    if (!katId || !listaDiv) return;

    const kivalasztottKat = exKategoriak.find(k => k.id === katId);
    const isKata = (kivalasztottKat && kivalasztottKat.matchType && kivalasztottKat.matchType.toUpperCase() === 'KATA');

    const nevezettek = exNevezesek.filter(n => n.categoryId === katId)
                                  .map(n => exVersenyzok.find(v => v.id === n.competitorId))
                                  .filter(Boolean);

    if (nevezettek.length === 0) {
        listaDiv.innerHTML = '<span style="color:#990000;font-weight:bold;">Ebben a kategóriában még nincs benevezett versenyző!</span>';
        return;
    }

    if (formatSel && !isKata) {
        formatSel.value = TatamiMaster.isKumiteKormeccsLetszam(nevezettek.length) ? 'kormeccs' : 'egyenes';
    }

    const szabalySzoveg = isKata
        ? `Kata rajtlista (${nevezettek.length} fő)`
        : (TatamiMaster.isKumiteKormeccsLetszam(nevezettek.length)
            ? `${nevezettek.length} fő (5 főig automatikus KÖRMÉRKŐZÉS)`
            : `${nevezettek.length} fő (5 fő felett automatikus EGYENES KIESÉS)`);

    listaDiv.innerHTML = `<div style="width:100%;margin-bottom:6px;padding:8px 12px;background:#FFFFFF;border:1px solid #CFC9BC;border-radius:6px;font-size:0.86rem;font-weight:700;color:#18181B;">
        Létszám és hivatalos Kumite szabály: <strong>${szabalySzoveg}</strong>
    </div>` + nevezettek.map(v => `
        <label style="background:#FFFFFF;padding:8px 14px;border:1px solid #D4CFC5;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:8px;">
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
    } else if (TatamiMaster.isKumiteKormeccsLetszam(rendezett.length) || formatum === 'kormeccs') {
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
        generaltMeccsek = TatamiMaster.generalEgyenesKiesesMeccsek(katId, tatamiId, kiemeltek, tobbiek, sorszam);
    }

    for (let m of generaltMeccsek) {
        await TatamiMaster.apiSend('Matches', 'POST', m);
    }

    alert(`Sorsolás kész! (${generaltMeccsek.length} tétel létrehozva). Átirányítás az ágrajzhoz / ranglistához...`);
    window.location.href = isKata ? 'kata.html' : 'kumite.html';
}
