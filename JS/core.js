const TatamiMaster = {
    API_URL: 'https://localhost:7045/api',
    hooks: {},

    WIN_TYPES: {
        'IPPON':   { kod: 'IPPON',   rovid: 'IPP', cimke: 'Egyből Ippon',                        pont: 3 },
        'AWASETE': { kod: 'AWASETE', rovid: 'AWA', cimke: '2x Waza-ari (Awasete Ippon)',         pont: 3 },
        'WAZAARI': { kod: 'WAZAARI', rovid: 'WAZ', cimke: '1x Waza-ari előny',                   pont: 2 },
        'HANTEI':  { kod: 'HANTEI',  rovid: 'HAN', cimke: 'Bírói döntés (Döntetlen után)',       pont: 1 },
        'SIKAKU':  { kod: 'SIKAKU',  rovid: 'SIK', cimke: 'Leléptetés (2 Genten / Kizárás)',     pont: 3 },
        'KIKEN':   { kod: 'KIKEN',   rovid: 'KIK', cimke: 'Nem jelent meg / Feladta (Kiken)',    pont: 3 },
        'BYE':     { kod: 'BYE',     rovid: 'BYE', cimke: 'Erőnyerő (Mérkőzés nélkül)',          pont: 0 }
    },

    // Biztonságos JSON olvasó (Sérült localStorage esetén sem fagy le az oldal)
    safeJsonParse: function(kulcs, alapErtek) {
        try {
            const nyers = localStorage.getItem(kulcs);
            return nyers ? JSON.parse(nyers) : alapErtek;
        } catch (e) {
            console.warn(`Sérült localStorage kulcs visszaállítva (${kulcs}):`, e);
            localStorage.removeItem(kulcs);
            return alapErtek;
        }
    },

    // Vizuális értesítő sáv (ha leáll a backend vagy hálózati hiba történik)
    mutatRendszerUzenet: function(uzenet, tipus = 'hiba') {
        let banner = document.getElementById('tmSystemBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'tmSystemBanner';
            banner.style.cssText = 'position:fixed;bottom:15px;right:15px;z-index:9999;padding:12px 20px;border-radius:6px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:0.3s;max-width:420px;';
            document.body.appendChild(banner);
        }
        banner.style.background = (tipus === 'hiba') ? '#dc3545' : (tipus === 'figyelem' ? '#ffc107' : '#28a745');
        banner.style.color = (tipus === 'figyelem') ? '#111' : '#fff';
        banner.innerText = uzenet;
        banner.style.display = 'block';

        clearTimeout(this._bannerTimer);
        this._bannerTimer = setTimeout(() => { banner.style.display = 'none'; }, 5000);
    },

    on: function(esemenyNev, fv) {
        if (!this.hooks[esemenyNev]) this.hooks[esemenyNev] = [];
        this.hooks[esemenyNev].push(fv);
    },

    trigger: async function(esemenyNev, adat) {
        if (this.hooks[esemenyNev]) {
            for (let fv of this.hooks[esemenyNev]) {
                try { await fv(adat); } catch (e) { console.error(`Hook hiba (${esemenyNev}):`, e); }
            }
        }
    },

    // Hibatűrő GET lekérdezés
    apiGet: async function(vegpont) {
        try {
            const res = await fetch(this.API_URL + '/' + vegpont);
            if (!res.ok) {
                console.warn(`API GET figyelmeztetés (${vegpont}): HTTP ${res.status}`);
                return [];
            }
            const text = await res.text();
            return text ? JSON.parse(text) : [];
        } catch (err) {
            console.error(`Hálózati hiba a(z) ${vegpont} lekérésekor:`, err);
            this.mutatRendszerUzenet(`⚠️ Nem érhető el a C# szerver (${vegpont}). Ellenőrizd, hogy fut-e a backend!`, 'hiba');
            return [];
        }
    },

    // Hibatűrő POST / PUT / DELETE küldés
    apiSend: async function(vegpont, method, adat) {
        try {
            const res = await fetch(this.API_URL + '/' + vegpont, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: adat ? JSON.stringify(adat) : null
            });
            if (!res.ok) {
                this.mutatRendszerUzenet(`⚠️ Szerver hiba (${method} ${vegpont}): HTTP ${res.status}`, 'hiba');
            }
            return res;
        } catch (err) {
            console.error(`Hálózati hiba (${method} ${vegpont}):`, err);
            this.mutatRendszerUzenet(`❌ Sikertelen művelet! A C# backend nem válaszol.`, 'hiba');
            return { ok: false, status: 0, json: async () => ({}) };
        }
    },

    // --- BELÉPÉSVÉDELEM (AUTH) ---
    mentBejelentkezes: function(userObj) {
        localStorage.setItem('tatamiUser', JSON.stringify(userObj));
    },

    lekerBejelentkezes: function() {
        return this.safeJsonParse('tatamiUser', null);
    },

    kijelentkezes: function() {
        localStorage.removeItem('tatamiUser');
        const isViews = window.location.pathname.toLowerCase().includes('/views/');
        window.location.href = isViews ? '../index.html' : 'index.html';
    },

    ellenorizJogosultsag: function() {
        const utvonal = window.location.pathname.toLowerCase();
        const user = this.lekerBejelentkezes();

        if (utvonal.includes('admin.html') || utvonal.includes('kategoriak.html') || utvonal.includes('kiemeles.html')) {
            if (!user || user.role.toUpperCase() !== 'ADMIN') {
                alert("⛔ Hozzáférés megtagadva! Ehhez a modulhoz Adminisztrátori bejelentkezés szükséges.");
                window.location.href = '../index.html';
            }
        } else if (utvonal.includes('biroi_panel.html')) {
            if (!user || (user.role.toUpperCase() !== 'ADMIN' && user.role.toUpperCase() !== 'JUDGE' && user.role.toUpperCase() !== 'BIRO')) {
                alert("⛔ Hozzáférés megtagadva! A Vezérlőpult használatához Bírói vagy Admin bejelentkezés szükséges!");
                window.location.href = '../index.html';
            }
        }
    },

    // --- KATA PONTSZÁMÍTÓ ÉS 4 LÉPCSŐS HOLTVERSENY MOTOR ---
    szamolKataErtekeles: function(pontokTomb) {
        let ervenyes = pontokTomb.map((p, idx) => ({
            ertek: Math.min(10, Math.max(0, parseFloat(p))), // 0.0 és 10.0 közé szorítjuk!
            idx: idx
        })).filter(x => !isNaN(x.ertek) && x.ertek > 0);

        if (ervenyes.length < 5) {
            let reszOsszeg = ervenyes.reduce((sum, x) => sum + x.ertek, 0);
            return {
                kesz: false,
                osszeg: Math.round(reszOsszeg * 10) / 10,
                minErtek: 0, maxErtek: 0, vezetoBiro: pontokTomb[0] || 0,
                minIdx: -1, maxIdx: -1, pontok: pontokTomb
            };
        }

        let minObj = ervenyes[0];
        for (let x of ervenyes) {
            if (x.ertek < minObj.ertek) minObj = x;
        }

        let maxObj = null;
        for (let x of ervenyes) {
            if (x.idx !== minObj.idx && (!maxObj || x.ertek >= maxObj.ertek)) {
                maxObj = x;
            }
        }

        let kozepOsszeg = 0;
        for (let x of ervenyes) {
            if (x.idx !== minObj.idx && x.idx !== maxObj.idx) {
                kozepOsszeg += x.ertek;
            }
        }

        return {
            kesz: true,
            osszeg: Math.round(kozepOsszeg * 10) / 10,
            minErtek: minObj.ertek,
            maxErtek: maxObj.ertek,
            vezetoBiro: ervenyes[0].ertek,
            minIdx: minObj.idx,
            maxIdx: maxObj.idx,
            pontok: ervenyes.map(x => x.ertek)
        };
    },

    kataSorrendHasonlito: function(a, b) {
        if (b.osszeg !== a.osszeg) return b.osszeg - a.osszeg;
        if (b.minErtek !== a.minErtek) return b.minErtek - a.minErtek;
        if (b.maxErtek !== a.maxErtek) return b.maxErtek - a.maxErtek;
        if (b.vezetoBiro !== a.vezetoBiro) return b.vezetoBiro - a.vezetoBiro;
        return 0;
    },

    mentKataEredmeny: function(matchId, competitorId, ertekeles) {
        let tarolo = this.safeJsonParse('kataEredmenyek', {});
        tarolo[matchId] = { matchId: matchId, competitorId: competitorId, ...ertekeles };
        localStorage.setItem('kataEredmenyek', JSON.stringify(tarolo));
    },

    lekerKataEredmenyek: function() {
        return this.safeJsonParse('kataEredmenyek', {});
    },

    megjelolKataDontoMeccsek: function(matchIdTomb) {
        let eddigiek = this.safeJsonParse('kataDontoMeccsIdk', []);
        for (let id of matchIdTomb) {
            if (!eddigiek.includes(id)) eddigiek.push(id);
        }
        localStorage.setItem('kataDontoMeccsIdk', JSON.stringify(eddigiek));
    },

    isKataDontoMeccs: function(matchId) {
        let eddigiek = this.safeJsonParse('kataDontoMeccsIdk', []);
        return eddigiek.includes(matchId);
    },

    mentKumiteReszletek: function(matchId, adatok) {
        let tarolo = this.safeJsonParse('kumiteReszletek', {});
        tarolo[matchId] = adatok;
        localStorage.setItem('kumiteReszletek', JSON.stringify(tarolo));
    },

    lekerKumiteReszletek: function() {
        return this.safeJsonParse('kumiteReszletek', {});
    }
};

TatamiMaster.ellenorizJogosultsag();