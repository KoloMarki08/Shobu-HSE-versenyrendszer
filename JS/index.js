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

async function bejelentkezes(event) {
    event.preventDefault();
    const uName = document.getElementById('loginUsername').value.trim();
    const uPass = document.getElementById('loginPassword').value.trim();
    const errDiv = document.getElementById('loginError');
    errDiv.style.display = 'none';

    let sikeresUser = null;

    // 1. Ellenőrzés a C# /api/Users táblában
    try {
        const res = await fetch(TatamiMaster.API_URL + '/Users');
        if (res.ok) {
            const users = await res.json();
            const talalat = users.find(u =>
                (u.username && u.username.toLowerCase() === uName.toLowerCase()) &&
                (u.password === uPass || u.passwordHash === uPass)
            );
            if (talalat) {
                sikeresUser = {
                    id: talalat.id,
                    username: talalat.username,
                    role: (talalat.role || 'COACH').toUpperCase()
                };
            }
        }
    } catch (e) {
        console.warn("Users API nem elérhető, tartalék beléptetés használata.");
    }

    // 2. Beépített teszt fiókok (Admin, Bíró, Edző)
    if (!sikeresUser) {
        if (uName.toLowerCase() === 'admin' && uPass === 'admin123') {
            sikeresUser = { id: 1, username: 'Adminisztrátor', role: 'ADMIN' };
        } else if ((uName.toLowerCase() === 'biro' || uName.toLowerCase() === 'bíró') && uPass === 'biro123') {
            sikeresUser = { id: 2, username: 'Asztalbíró', role: 'JUDGE' };
        } else if ((uName.toLowerCase() === 'edzo' || uName.toLowerCase() === 'edző' || uName.toLowerCase() === 'coach') && uPass === 'edzo123') {
            sikeresUser = { id: 3, username: 'Klubedző (Shobu HSE)', role: 'COACH' };
        }
    }

    if (sikeresUser) {
        TatamiMaster.mentBejelentkezes(sikeresUser);

        const role = sikeresUser.role.toUpperCase();
        if (role === 'ADMIN') {
            window.location.href = 'views/admin.html';
        } else if (role === 'JUDGE' || role === 'BIRO') {
            window.location.href = 'views/biroi_panel.html';
        } else if (role === 'COACH' || role === 'EDZO') {
            // Az Edző ugyanazt látja, mint a néző, plusz tud versenyzőt nevezni!
            window.location.href = 'views/audience.html';
        }
    } else {
        errDiv.innerText = "❌ Hibás felhasználónév vagy jelszó!";
        errDiv.style.display = 'block';
    }
}