let indexLiveDebounce = null;

window.onload = function() {
    versenyekBetoltese();

    if (window.TatamiMaster && typeof TatamiMaster.initLiveSync === 'function') {
        TatamiMaster.initLiveSync({ tatamiFigyeles: false });
        TatamiMaster.on('liveAdatValtozott', function() {
            if (indexLiveDebounce) clearTimeout(indexLiveDebounce);
            indexLiveDebounce = setTimeout(function() {
                versenyekBetoltese();
            }, 350);
        });
    }
};

function toggleVersenyekPanel() {
    const dock = document.getElementById('versenyekDock');
    if (dock) {
        dock.classList.toggle('open');
    }
}

let indexVersenyekCache = [];

async function versenyekBetoltese() {
    const container = document.getElementById('versenyekContainer');
    const countBadge = document.getElementById('versenyekCountBadge');
    const autoNevEl = document.getElementById('indexAutoAktivVersenyNev');
    const autoDatumEl = document.getElementById('indexAutoAktivVersenyDatum');
    if (!container) return;

    try {
        const [versenyek, osszesVersenyzo] = await Promise.all([
            TatamiMaster.apiGet('Tournaments'),
            TatamiMaster.apiGet('Competitors', { mindenVerseny: true })
        ]);
        indexVersenyekCache = Array.isArray(versenyek) ? versenyek : [];
        const mellekletek = TatamiMaster.lekerVersenyMellekletek();

        // Főoldalon a rendszer mindig automatikusan kiválasztja az éppen aktuális versenyt!
        const autoVerseny = TatamiMaster.valasztdAutoAktualisVersenyt(indexVersenyekCache);
        const aktId = autoVerseny ? autoVerseny.id : TatamiMaster.lekerAktualisVersenyId();

        const map = TatamiMaster.lekerVersenyAdatMap();
        const alapId = map.alapVersenyId || 1;

        if (countBadge) countBadge.innerText = indexVersenyekCache.length;

        if (autoVerseny) {
            if (autoNevEl) autoNevEl.innerText = autoVerseny.name || ('Verseny #' + autoVerseny.id);
            if (autoDatumEl) {
                const dSzoveg = autoVerseny.date ? new Date(autoVerseny.date).toLocaleDateString('hu-HU') : '';
                autoDatumEl.innerHTML = `${TatamiMaster.icon('calendar', 12)} ${dSzoveg}`;
            }
        } else {
            if (autoNevEl) autoNevEl.innerText = 'Nincs meghirdetett verseny';
            if (autoDatumEl) autoDatumEl.innerText = '';
        }

        if (indexVersenyekCache.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; background: #FAF8F5; border: 1px solid #E4E0D7; border-radius: 8px; color: #52525B;">
                    Még nincs meghirdetett verseny az adatbázisban.<br>
                    Az adminisztrátor belépés után az <strong>Admin Központban</strong> hozhat létre új versenyt.
                </div>`;
            return;
        }

        let html = '';
        for (let v of indexVersenyekCache) {
            const isAutoAktiv = (v.id === aktId);
            let datumSzoveg = v.date ? new Date(v.date).toLocaleDateString('hu-HU') : '';
            let statuszSzoveg = TatamiMaster.escapeHtml(v.status || 'ÉLŐ / NYITVA');
            let szervezoSzoveg = v.organizer ? (` &bull; ${TatamiMaster.icon('user', 13)} Szervező: ` + TatamiMaster.escapeHtml(v.organizer)) : '';
            let tisztaNev = TatamiMaster.escapeHtml(v.name || ('Verseny #' + v.id));

            let versenyzoDb = Array.isArray(osszesVersenyzo)
                ? osszesVersenyzo.filter(c => TatamiMaster.lekerEntitasVersenyId('Competitors', c.id, alapId) === v.id).length
                : 0;

            let extra = mellekletek[v.name] || {};
            let plakatThumb = extra.plakat
                ? `<img src="${extra.plakat}" alt="Plakát" onclick="mutatPlakatNagyban('${(v.name || '').replace(/'/g, "")}')" style="width:66px;height:90px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #CFC9BC;flex-shrink:0;" title="Kattints a plakát nagyításához!">`
                : '';

            let kiirasGomb = extra.kiiras
                ? `<a href="${extra.kiiras}" download="${extra.kiirasNev || 'Versenykiiras.pdf'}" class="btn btn-outline" style="padding:5px 10px;font-size:0.78rem;">${TatamiMaster.icon('file', 14)} Kiírás letöltése</a>`
                : '';

            let autoBadgeHtml = isAutoAktiv
                ? `<span style="background: #18181B; color: #FAF8F5; padding: 2px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.4px; display: inline-flex; align-items: center; gap: 4px;">${TatamiMaster.icon('check', 11)} AKTUÁLIS VERSENY</span>`
                : '';

            html += `
                <div style="border: ${isAutoAktiv ? '2px solid #18181B' : '1px solid #E4E0D7'}; border-radius: 10px; padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; gap: 14px; background: ${isAutoAktiv ? '#FFFFFF' : '#FAF8F5'}; transition: border-color 0.2s, box-shadow 0.2s;">
                    <div style="display:flex; gap:14px; align-items:center;">
                        ${plakatThumb}
                        <div>
                            <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                ${autoBadgeHtml}
                                <span style="background: #27272A; color: #FAF8F5; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px;">${statuszSzoveg}</span>
                                <span style="background: #F3F0EA; border: 1px solid #CFC9BC; color: #18181B; padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${versenyzoDb} versenyző</span>
                                <strong style="font-size: 1.05rem; color: #18181B; display: inline-flex; align-items: center; gap: 6px;">${TatamiMaster.icon('shield', 15)} ${tisztaNev}</strong>
                            </div>
                            <small style="color: #52525B; display: block; margin-bottom: 8px;">${TatamiMaster.icon('calendar', 13)} ${datumSzoveg}${szervezoSzoveg}</small>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                ${kiirasGomb}
                                ${extra.plakat ? `<button class="btn btn-outline" style="padding:5px 10px;font-size:0.78rem;" onclick="mutatPlakatNagyban('${(v.name || '').replace(/'/g, "")}')">${TatamiMaster.icon('image', 14)} Plakát</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-outline-blue" style="font-weight: 700; flex-shrink:0; padding: 8px 14px; font-size: 0.85rem;" onclick="versenyMegnyitasa(${v.id}, '${(v.name || '').replace(/'/g, "")}')">
                        <span>Élő Követés</span>
                        ${TatamiMaster.icon('arrow-right', 15)}
                    </button>
                </div>`;
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p style="color: #991B1B; font-size: 0.9rem;">Nem sikerült betölteni a versenyeket az adatbázisból.</p>`;
    }
}

function versenyMegnyitasa(id, nev) {
    localStorage.removeItem('tatamiUser');
    TatamiMaster.mentAktualisVerseny(id, nev, true);
    window.location.href = `views/audience.html?versenyId=${encodeURIComponent(id)}`;
}

function mutatPlakatNagyban(versenyNev) {
    const extra = TatamiMaster.lekerVersenyMellekletek()[versenyNev];
    if (!extra || !extra.plakat) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.86);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
        <img src="${extra.plakat}" style="max-width:90%;max-height:82vh;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,0.8);">
        <button class="btn btn-outline" style="margin-top:15px;padding:10px 24px;" onclick="this.parentElement.remove()">${TatamiMaster.icon('x', 16)} Bezárás</button>
    `;
    document.body.appendChild(modal);
}

// Modális ablak új verseny létrehozásához + Plakát és Versenykiírás csatolásához
function ujVersenyGyorsLetrehozas() {
    let modal = document.getElementById('ujVersenyModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'ujVersenyModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:15px;';
    modal.innerHTML = `
        <div style="background:#FFFFFF;width:100%;max-width:500px;border-radius:14px;padding:26px;box-shadow:0 20px 50px rgba(0,0,0,0.35);border:1px solid #E4E0D7;">
            <h2 style="margin:0 0 16px 0;display:flex;align-items:center;gap:8px;color:#18181B;">${TatamiMaster.icon('trophy', 20)} Új Verseny Létrehozása (+ Plakát & Kiírás)</h2>

            <label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:4px;">Verseny neve*</label>
            <input type="text" id="modVersenyNev" class="input-field" style="width:100%;margin-bottom:12px;" value="V. Halas Kupa">

            <label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:4px;">Szervező*</label>
            <input type="text" id="modVersenySzervezo" class="input-field" style="width:100%;margin-bottom:12px;" value="Vácrátóti HSE - Tornai Bálint">

            <div style="display:flex;gap:10px;margin-bottom:12px;">
                <div style="flex:1;">
                    <label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:4px;">Verseny dátuma*</label>
                    <input type="date" id="modVersenyDatum" class="input-field" style="width:100%;" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div style="flex:1;">
                    <label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:4px;">Státusz</label>
                    <select id="modVersenyStatusz" class="input-field" style="width:100%;">
                        <option value="ÉLŐ / NYITVA">ÉLŐ / NYITVA</option>
                        <option value="NEVEZÉS ALATT">NEVEZÉS ALATT</option>
                        <option value="LEZÁRULT">LEZÁRULT</option>
                    </select>
                </div>
            </div>

            <div style="background:#FAF8F5;border:1px dashed #CFC9BC;padding:12px;border-radius:8px;margin-bottom:12px;">
                <label style="font-weight:700;font-size:0.85rem;display:flex;align-items:center;gap:6px;margin-bottom:4px;">${TatamiMaster.icon('image', 15)} Versenyplakát csatolása (JPG / PNG kép):</label>
                <input type="file" id="modVersenyPlakatFile" accept="image/*" style="width:100%;font-size:0.85rem;">
            </div>

            <div style="background:#FAF8F5;border:1px dashed #CFC9BC;padding:12px;border-radius:8px;margin-bottom:18px;">
                <label style="font-weight:700;font-size:0.85rem;display:flex;align-items:center;gap:6px;margin-bottom:4px;">${TatamiMaster.icon('file', 15)} Versenykiírás csatolása (PDF / DOC):</label>
                <input type="file" id="modVersenyKiirasFile" accept=".pdf,.doc,.docx,image/*" style="width:100%;font-size:0.85rem;">
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-outline" onclick="document.getElementById('ujVersenyModal').remove()">Mégse</button>
                <button class="btn btn-outline-green" onclick="mentUjVersenyModalbol()">${TatamiMaster.icon('check', 16)} Verseny Mentése</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function fajlBase64Konvertalas(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

async function mentUjVersenyModalbol() {
    const nev = document.getElementById('modVersenyNev').value.trim();
    const szervezo = document.getElementById('modVersenySzervezo').value.trim();
    const datum = document.getElementById('modVersenyDatum').value;
    const statusz = document.getElementById('modVersenyStatusz').value;

    const plakatFile = document.getElementById('modVersenyPlakatFile').files[0];
    const kiirasFile = document.getElementById('modVersenyKiirasFile').files[0];

    if (!nev) {
        TatamiMaster.toast("Add meg a verseny nevét!", "figyelem");
        return;
    }

    const [plakatB64, kiirasB64] = await Promise.all([
        fajlBase64Konvertalas(plakatFile),
        fajlBase64Konvertalas(kiirasFile)
    ]);

    if (plakatB64 || kiirasB64) {
        TatamiMaster.mentVersenyMelleklet(nev, plakatB64, kiirasB64, kiirasFile ? kiirasFile.name : 'Versenykiiras.pdf');
    }

    const res = await TatamiMaster.apiSend('Tournaments', 'POST', {
        name: nev,
        date: datum ? new Date(datum).toISOString() : new Date().toISOString(),
        status: statusz,
        organizer: szervezo
    });

    if (res.ok) {
        document.getElementById('ujVersenyModal').remove();
        TatamiMaster.toast("Új verseny (plakáttal és kiírással) sikeresen létrehozva!");
        versenyekBetoltese();
    }
}
