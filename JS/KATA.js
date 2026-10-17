function initDedikaltKataPage() {
    const sel = document.getElementById('kataHubSelect');
    const kataKatok = exKategoriak.filter(k => k.matchType && k.matchType.toUpperCase() === 'KATA');
    if (sel && sel.options.length === 0) {
        sel.innerHTML = kataKatok.map(k => `<option value="${k.id}">${k.name}</option>`).join('');
    }
    rajzolDedikaltKataTabla();
}

function rajzolDedikaltKataTabla() {
    const katId = parseInt(document.getElementById('kataHubSelect')?.value);
    const cont = document.getElementById('kataHubContainer');
    if (!katId || !cont) return;

    const kataTarolo = TatamiMaster.lekerKataEredmenyek();
    const katMeccsek = exMeccsek.filter(m => m.categoryId === katId);
    if (katMeccsek.length === 0) {
        cont.innerHTML = '<p>Ehhez a Kata kategóriához még nincs kisorsolt rajtsorrend.</p>';
        return;
    }

    let selejtezo = katMeccsek.filter(m => !TatamiMaster.isKataDontoMeccs(m.id));
    let donto = katMeccsek.filter(m => TatamiMaster.isKataDontoMeccs(m.id));

    function epitsTabla(tomb, cim, isSel) {
        let lista = tomb.map(m => ({
            m: m,
            v: exVersenyzok.find(x => x.id === m.competitor1Id),
            ...(kataTarolo[m.id] || { kesz: false, osszeg: 0, minErtek: 0, maxErtek: 0, pontok: ['-','-','-','-','-'], minIdx: -1, maxIdx: -1 })
        }));
        let sorrend = lista.filter(x => x.kesz).sort(TatamiMaster.kataSorrendHasonlito).concat(lista.filter(x => !x.kesz));

        let h = `<h3 style="margin:20px 0 10px 0;">${cim}</h3><table class="data-table"><tr><th>Helyezés</th><th>Versenyző</th><th>B1 (Vez.)</th><th>B2</th><th>B3</th><th>B4</th><th>B5</th><th>Min</th><th>Max</th><th>ÖSSZESEN</th></tr>`;
        sorrend.forEach((it, idx) => {
            let pCols = [0,1,2,3,4].map(b => `<td style="${(b===it.minIdx||b===it.maxIdx)?'text-decoration:line-through;color:#999;':'font-weight:bold;'}">${it.pontok[b] ?? '-'}</td>`).join('');
            h += `<tr style="${isSel && it.kesz && idx < 6 ? 'background:#e8f5e9;' : ''}">
                <td><strong>${it.kesz ? (idx+1)+'.' : '#' + it.m.matchOrder}</strong></td>
                <td><strong>${it.v ? it.v.name + ' (' + it.v.club + ' - ' + it.v.belt + ')' : '-'}</strong> ${isSel && it.kesz && idx < 6 ? '<span style="background:#28a745;color:white;padding:2px 6px;border-radius:4px;font-size:0.75rem;">TOP 6</span>' : ''}</td>
                ${pCols}
                <td>${it.kesz ? it.minErtek.toFixed(1) : '-'}</td>
                <td>${it.kesz ? it.maxErtek.toFixed(1) : '-'}</td>
                <td style="color:#dc3545;font-weight:bold;font-size:1.2rem;">${it.kesz ? it.osszeg.toFixed(1) : '-'}</td>
            </tr>`;
        });
        return h + '</table>';
    }

    cont.innerHTML = (donto.length > 0 ? epitsTabla(donto, '🏆 TOP 6 DÖNTŐ', false) : '') + epitsTabla(selejtezo, '📋 1. Kör: Selejtező Ranglista', true);
}