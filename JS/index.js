window.onload = function() {
    versenyekBetoltese();
};

async function versenyekBetoltese() {
    const container = document.getElementById('versenyekContainer');
    try {
        const res = await fetch(TatamiMaster.API_URL + '/Tournaments');
        if (!res.ok) throw new Error("API hiba");
        const versenyek = await res.json();

        if (versenyek.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; color: #856404;">
                    Még nincs rögzített verseny az adatbázisban.<br>
                    Kattints a fenti <strong>+ Új verseny</strong> gombra a létrehozáshoz!
                </div>`;
            return;
        }

        let html = '';
        for (let v of versenyek) {
            let datumSzoveg = v.date ? new Date(v.date).toLocaleDateString('hu-HU') : 'Aktív verseny';
            let helyszinSzoveg = v.location ? (' 📍 ' + v.location) : '';

            html += `
                <div style="border: 1px solid #ddd; border-left: 5px solid #dc3545; border-radius: 6px; padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
                    <div>
                        <strong style="font-size: 1.15rem; color: #222; display: block;">🥋 ${v.name || ('Verseny #' + v.id)}</strong>
                        <small style="color: #666;">📅 ${datumSzoveg}${helyszinSzoveg}</small>
                    </div>
                    <button class="btn btn-outline-blue" style="font-weight: bold;" onclick="versenyMegnyitasa(${v.id}, '${(v.name || '').replace(/'/g, "")}')">
                        Élő Követés ➔
                    </button>
                </div>`;
        }
        container.innerHTML = html;
    } catch (e) {
        console.error("Nem sikerült betölteni a versenyeket:", e);
        container.innerHTML = `<p style="color: #dc3545;">Nem sikerült elérni a C# szervert (${TatamiMaster.API_URL}/Tournaments).</p>`;
    }
}

function versenyMegnyitasa(id, nev) {
    // Ha sima nézőként kattint a versenyre, töröljük az esetleges korábbi belépést
    localStorage.removeItem('tatamiUser');
    localStorage.setItem('aktualisVersenyId', id);
    localStorage.setItem('aktualisVersenyNev', nev);
    window.location.href = 'views/audience.html';
}

async function ujVersenyGyorsLetrehozas() {
    const nev = prompt("Add meg az új verseny nevét:", "Shobu Kyokushin Karate Kupa 2026");
    if (!nev) return;

    const helyszin = prompt("Add meg a helyszínt (opcionális):", "Vácrátót / Budapest");
    const maiDatum = new Date().toISOString();

    try {
        const res = await TatamiMaster.apiSend('Tournaments', 'POST', {
            name: nev,
            date: maiDatum,
            location: helyszin || ""
        });
        if (res.ok) {
            versenyekBetoltese();
        } else {
            alert("Hiba a verseny létrehozásakor! Ellenőrizd a Tournament.cs mezőit.");
        }
    } catch (e) {
        alert("Szerver hiba a mentés során!");
    }
}