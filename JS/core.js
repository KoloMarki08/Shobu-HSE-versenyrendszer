const TatamiMaster = {
    API_URL: 'https://localhost:7045/api',
    hooks: {},

    WIN_TYPES: {
        'IPPON':   { kod: 'IPPON',   rovid: 'IPP', cimke: 'Egyből Ippon',                        pont: 3 },
        'AWASETE': { kod: 'AWASETE', rovid: 'AWA', cimke: '2x Waza-ari (Awasete Ippon)',         pont: 3 },
        'WAZAARI': { kod: 'WAZAARI', rovid: 'WAZ', cimke: '1x Waza-ari előny',                   pont: 2 },
        'HANTEI':  { kod: 'HANTEI',  rovid: 'HAN', cimke: 'Bírói döntés (Döntetlen után)',       pont: 1 },
        'SIKAKU':  { kod: 'SIKAKU',  rovid: 'SIK', cimke: 'Leléptetés (2 Genten / Kizárás)',     pont: 3 },
        'KIKEN':   { kod: 'KIKEN',   rovid: 'KIK', cimke: 'Nem jelent meg / Feladta (Kiken)',    pont: 3 }
    },

    // Automatikusan betölti az új Design System CSS-t minden oldalra!
    injectDesignSystem: function() {
        const utvonal = window.location.pathname.toLowerCase();
        if (utvonal.includes('tv_kijelzo.html')) return; // A TV kijelzőnek saját teljes képernyős stílusa van
        if (document.getElementById('tmDesignSystemCss')) return;

        const isViews = utvonal.includes('/views/');
        const prefix = isViews ? '../CSS/' : 'CSS/';

        const link = document.createElement('link');
        link.id = 'tmDesignSystemCss';
        link.rel = 'stylesheet';
        link.href = prefix + 'design_system.css';
        document.head.appendChild(link);
    },

    safeJsonParse: function(kulcs, alapErtek) {
        try {
            const nyers = localStorage.getItem(kulcs);
            return nyers ? JSON.parse(nyers) : alapErtek;
        } catch (e) {
            localStorage.removeItem(kulcs);
            return alapErtek;
        }
    },

    // Modern animált Toast értesítés a régi alert() helyett
    toast: function(uzenet, tipus = 'siker') {
        let cont = document.getElementById('tmToastContainer');
        if (!cont) {
            cont = document.createElement('div');
            cont.id = 'tmToastContainer';
            document.body.appendChild(cont);
        }

        if (uzenet.includes('❌') || uzenet.includes('⛔') || uzenet.toLowerCase().includes('hiba')) tipus = 'hiba';
        else if (uzenet.includes('⚠️')) tipus = 'figyelem';

        const item = document.createElement('div');
        item.className = 'tm-toast ' + tipus;
        item.innerHTML = `<span>${uzenet}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:#888;">✕</button>`;
        cont.appendChild(item);

        setTimeout(() => {
            if (item.parentElement) item.remove();
        }, 4200);
    },

    mutatRendszerUzenet: function(uzenet, tipus = 'hiba') {
        this.toast(uzenet, tipus);
    },

    on: function(esemenyNev, fv) {
        if (!this.hooks[esemenyNev]) this.hooks[esemenyNev] = [];
        this.hooks[esemenyNev].push(fv);
    },

    trigger: async function(esemenyNev, adat) {
        if (this.hooks[esemenyNev]) {
            for (let fv of this.hooks[esemenyNev]) {
                try { await fv(adat); } catch (e) { console.error(e); }
            }
        }
    },

    apiGet: async function(vegpont) {
        try {
            const res = await fetch(this.API_URL + '/' + vegpont);
            if (!res.ok) return [];
            const text = await res.text();
            return text ? JSON.parse(text) : [];
        } catch (err) {
            this.toast(`⚠️ Nem érhető el a C# szerver (${vegpont}).`, 'hiba');
            return [];
        }
    },

    apiSend: async function(vegpont, method, adat) {
        try {
            const res = await fetch(this.API_URL + '/' + vegpont, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: adat ? JSON.stringify(adat) : null
            });
            if (!res.ok) {
                this.toast(`⚠️ Szerver hiba (${method} ${vegpont}): HTTP ${res.status}`, 'hiba');
            }
            return res;
        } catch (err) {
            this.toast(`❌ Hálózati hiba! A C# backend nem válaszol.`, 'hiba');
            return { ok: false, status: 0, json: async () => ({}) };
        }
    },

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
                window.location.href = '../index.html';
            }
        } else if (utvonal.includes('biroi_panel.html')) {
            if (!user || (user.role.toUpperCase() !== 'ADMIN' && user.role.toUpperCase() !== 'JUDGE' && user.role.toUpperCase() !== 'BIRO')) {
                window.location.href = '../index.html';
            }
        }
    },

    szamolKataErtekeles: function(pontokTomb) {
        let ervenyes = pontokTomb.map((p, idx) => ({
            ertek: Math.min(10, Math.max(0, parseFloat(p))),
            idx: idx
        })).filter(x => !isNaN(x.ertek) && x.ertek > 0);

        if (ervenyes.length < 5) {
            let reszOsszeg = ervenyes.reduce((sum, x) => sum + x.ertek, 0);
            return {
                kesz: false, osszeg: Math.round(reszOsszeg * 10) / 10,
                minErtek: 0, maxErtek: 0, vezetoBiro: pontokTomb[0] || 0,
                minIdx: -1, maxIdx: -1, pontok: pontokTomb
            };
        }

        let minObj = ervenyes[0];
        for (let x of ervenyes) { if (x.ertek < minObj.ertek) minObj = x; }

        let maxObj = null;
        for (let x of ervenyes) {
            if (x.idx !== minObj.idx && (!maxObj || x.ertek >= maxObj.ertek)) maxObj = x;
        }

        let kozepOsszeg = 0;
        for (let x of ervenyes) {
            if (x.idx !== minObj.idx && x.idx !== maxObj.idx) kozepOsszeg += x.ertek;
        }

        return {
            kesz: true,
            osszeg: Math.round(kozepOsszeg * 10) / 10,
            minErtek: minObj.ertek, maxErtek: maxObj.ertek,
            vezetoBiro: ervenyes[0].ertek,
            minIdx: minObj.idx, maxIdx: maxObj.idx,
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

    lekerKataEredmenyek: function() { return this.safeJsonParse('kataEredmenyek', {}); },

    megjelolKataDontoMeccsek: function(matchIdTomb) {
        let eddigiek = this.safeJsonParse('kataDontoMeccsIdk', []);
        for (let id of matchIdTomb) { if (!eddigiek.includes(id)) eddigiek.push(id); }
        localStorage.setItem('kataDontoMeccsIdk', JSON.stringify(eddigiek));
    },

    isKataDontoMeccs: function(matchId) {
        return this.safeJsonParse('kataDontoMeccsIdk', []).includes(matchId);
    },

    mentKumiteReszletek: function(matchId, adatok) {
        let tarolo = this.safeJsonParse('kumiteReszletek', {});
        tarolo[matchId] = adatok;
        localStorage.setItem('kumiteReszletek', JSON.stringify(tarolo));
    },

    lekerKumiteReszletek: function() { return this.safeJsonParse('kumiteReszletek', {}); }
};

TatamiMaster.injectDesignSystem();
TatamiMaster.ellenorizJogosultsag();

// Lecseréljük a böngésző alapértelmezett alert() függvényét a szép Toast értesítőre!
window.alert = function(msg) {
    TatamiMaster.toast(msg);
};