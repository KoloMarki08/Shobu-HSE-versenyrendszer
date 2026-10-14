const TatamiMaster = {
    API_URL: 'https://localhost:7045/api',
    hooks: {},

    // Győzelmi módok (Jogcímek) és jelmagyarázatuk (Körmérkőzés súlyozással)
    WIN_TYPES: {
        'IPPON':   { kod: 'IPPON',   rovid: 'IPP', cimke: 'Egyből Ippon',                        pont: 3 },
        'AWASETE': { kod: 'AWASETE', rovid: 'AWA', cimke: '2x Waza-ari (Awasete Ippon)',         pont: 3 },
        'WAZAARI': { kod: 'WAZAARI', rovid: 'WAZ', cimke: '1x Waza-ari előny',                   pont: 2 },
        'HANTEI':  { kod: 'HANTEI',  rovid: 'HAN', cimke: 'Bírói döntés (Döntetlen után)',       pont: 1 },
        'SIKAKU':  { kod: 'SIKAKU',  rovid: 'SIK', cimke: 'Leléptetés (2 Genten / Kizárás)',     pont: 3 },
        'KIKEN':   { kod: 'KIKEN',   rovid: 'KIK', cimke: 'Nem jelent meg / Feladta (Kiken)',    pont: 3 },
        'BYE':     { kod: 'BYE',     rovid: 'BYE', cimke: 'Erőnyerő (Mérkőzés nélkül)',          pont: 0 }
    },

    on: function(esemenyNev, fv) {
        if (!this.hooks[esemenyNev]) this.hooks[esemenyNev] = [];
        this.hooks[esemenyNev].push(fv);
    },

    trigger: async function(esemenyNev, adat) {
        if (this.hooks[esemenyNev]) {
            for (let fv of this.hooks[esemenyNev]) await fv(adat);
        }
    },

    apiGet: async function(vegpont) {
        const res = await fetch(this.API_URL + '/' + vegpont);
        return await res.json();
    },

    // --- KATA PONTSZÁMÍTÓ ÉS 4 LÉPCSŐS HOLTVERSENY MOTOR ---
    szamolKataErtekeles: function(pontokTomb) {
        let ervenyes = pontokTomb.map((p, idx) => ({ ertek: parseFloat(p), idx: idx }))
                                 .filter(x => !isNaN(x.ertek) && x.ertek > 0);

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
        let tarolo = JSON.parse(localStorage.getItem('kataEredmenyek') || '{}');
        tarolo[matchId] = { matchId: matchId, competitorId: competitorId, ...ertekeles };
        localStorage.setItem('kataEredmenyek', JSON.stringify(tarolo));
    },

    lekerKataEredmenyek: function() {
        return JSON.parse(localStorage.getItem('kataEredmenyek') || '{}');
    },

    // --- KATA DÖNTŐ (TOP 6) MECCSEK AZONOSÍTÓINAK TÁROLÁSA ---
    megjelolKataDontoMeccsek: function(matchIdTomb) {
        let eddigiek = JSON.parse(localStorage.getItem('kataDontoMeccsIdk') || '[]');
        for (let id of matchIdTomb) {
            if (!eddigiek.includes(id)) eddigiek.push(id);
        }
        localStorage.setItem('kataDontoMeccsIdk', JSON.stringify(eddigiek));
    },

    isKataDontoMeccs: function(matchId) {
        let eddigiek = JSON.parse(localStorage.getItem('kataDontoMeccsIdk') || '[]');
        return eddigiek.includes(matchId);
    },

    // --- KUMITE GYŐZELMI MÓD (JOGCÍM) TÁROLÓ ---
    mentKumiteReszletek: function(matchId, adatok) {
        let tarolo = JSON.parse(localStorage.getItem('kumiteReszletek') || '{}');
        tarolo[matchId] = adatok; // { winType: 'AWASETE', akaWazaari: 2, shiroWazaari: 0, ... }
        localStorage.setItem('kumiteReszletek', JSON.stringify(tarolo));
    },

    lekerKumiteReszletek: function() {
        return JSON.parse(localStorage.getItem('kumiteReszletek') || '{}');
    }
};