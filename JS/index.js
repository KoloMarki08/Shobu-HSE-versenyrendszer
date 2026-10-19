window.onload = function() {
    versenyekBetoltese();
};

async function versenyekBetoltese() {
    const container = document.getElementById('versenyekContainer');
    if (!container) return;

    try {
        const res = await fetch(TatamiMaster.API_URL + '/Tournaments');
        if (!res.ok) throw new Error("API hiba");
        const versenyek = await res.json();
        const mellekletek = TatamiMaster.lekerVersenyMellekletek();

        if (versenyek.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; color: #856404;">
                    Még nincs rögzített verseny az adatbázisban.<br>
                    Kattints a fenti <strong>+ Új verseny</strong> gombra a létrehozáshoz!
                </div>`;
            return;
        }

        let html = '';
        for (let v of versenyek) {
            let datumSzoveg = v.date ? new Date(v.date).toLocaleDateString('hu-HU') : '';
            let statuszSzoveg = TatamiMaster.escapeHtml(v.status || 'ÉLŐ / NYITVA');
            let szervezoSzoveg = v.organizer ? (' 👤 Szervező: ' + TatamiMaster.escapeHtml(v.organizer)) : '';
            let tisztaNev = TatamiMaster.escapeHtml(v.name || ('Verseny #' + v.id));

            let extra = mellekletek[v.name] || {};
            let plakatThumb = extra.plakat
                ? `<img src="${extra.plakat}" alt="Plakát" onclick="mutatPlakatNagyban('${v.name.replace(/'/g, "")}')" style="width:70px;height:95px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #ccc;flex-shrink:0;" title="Kattints a plakát nagyításához!">`
                : '';

            let kiirasGomb = extra.kiiras
                ? `<a href="${extra.kiiras}" download="${extra.kiirasNev || 'Versenykiiras.pdf'}" class="btn btn-outline" style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;padding:6px 10px;font-size:0.8rem;">📄 Kiírás letöltése</a>`
                : '';

            html += `
                <div style="border: 1px solid #e2e8f0; border-left: 5px solid #e62e2d; border-radius: 10px; padding: 16px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; gap: 15px; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <div style="display:flex; gap:14px; align-items:center;">
                        ${plakatThumb}
                        <div>
                            <div style="margin-bottom: 5px;">
                                <span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 800; margin-right: 6px;">${statuszSzoveg}</span>
                                <strong style="font-size: 1.15rem; color: #0f172a;">🥋 ${tisztaNev}</strong>
                            </div>
                            <small style="color: #64748b; display: block; margin-bottom: 8px;">📅 ${datumSzoveg}${szervezoSzoveg}</small>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                ${kiirasGomb}
                                ${extra.plakat ? `<button class="btn btn-outline" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:6px 10px;font-size:0.8rem;" onclick="mutatPlakatNagyban('${v.name.replace(/'/g, "")}')">🖼️ Plakát</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-outline-blue" style="font-weight: bold; flex-shrink:0;" onclick="versenyMegnyitasa(${v.id}, '${(v.name || '').replace(/'/g, "")}')">
                        Élő Követés ➔
                    </button>
                </div>`;
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p style="color: #dc3545;">Nem sikerült betölteni a versenyeket az adatbázisból.</p>`;
    }
}

function versenyMegnyitasa(id, nev) {
    localStorage.removeItem('tatamiUser');
    localStorage.setItem('aktualisVersenyId', id);
    localStorage.setItem('aktualisVersenyNev', nev);
    window.location.href = 'views/audience.html';
}

function mutatPlakatNagyban(versenyNev) {
    const extra = TatamiMaster.lekerVersenyMellekletek()[versenyNev];
    if (!extra || !extra.plakat) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
        <img src="${extra.plakat}" style="max-width:90%;max-height:82vh;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,0.8);">
        <button class="btn btn-danger" style="margin-top:15px;padding:10px 24px;" onclick="this.parentElement.remove()">✕ Bezárás</button>
    `;
    document.body.appendChild(modal);
}

// Modális ablak új verseny létrehozásához + Plakát és Versenykiírás csatolásához
function ujVersenyGyorsLetrehozas() {
    let modal = document.getElementById('ujVersenyModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'ujVersenyModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:15px;';
    modal.innerHTML = `
        <div style="background:white;width:100%;max-width:500px;border-radius:14px;padding:26px;box-shadow:0 20px 50px rgba(0,0,0,0.4);border-top:5px solid #e62e2d;">
            <h2 style="margin:0 0 16px 0;">🏆 Új Verseny Létrehozása (+ Plakát & Kiírás)</h2>

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

            <div style="background:#f8fafc;border:1px dashed #94a3b8;padding:12px;border-radius:8px;margin-bottom:12px;">
                <label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:4px;">🖼️ Versenyplakát csatolása (JPG / PNG kép):</label>
                <input type="file" id="modVersenyPlakatFile" accept="image/*" style="width:100%;font-size:0.85rem;">
            </div>

            <div style="background:#f8fafc;border:1px dashed #94a3b8;padding:12px;border-radius:8px;margin-bottom:18px;">
                <label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:4px;">📄 Versenykiírás csatolása (PDF / DOC):</label>
                <input type="file" id="modVersenyKiirasFile" accept=".pdf,.doc,.docx,image/*" style="width:100%;font-size:0.85rem;">
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-danger" onclick="document.getElementById('ujVersenyModal').remove()">Mégse</button>
                <button class="btn btn-outline-green" onclick="mentUjVersenyModalbol()">✔ Verseny Mentése</button>
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
        TatamiMaster.toast("⚠️ Add meg a verseny nevét!", "figyelem");
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
        TatamiMaster.toast("✔ Új verseny (plakáttal és kiírással) sikeresen létrehozva!");
        versenyekBetoltese();
    }
}