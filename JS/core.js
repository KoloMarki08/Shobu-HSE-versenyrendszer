const TatamiMaster = {
    API_URL: (function() {
        try {
            let overrideApi = null;
            try {
                const params = new URLSearchParams(window.location.search || '');
                overrideApi = params.get('api') || (window.sessionStorage && sessionStorage.getItem('tatamiApiUrlOverride'));
                if (overrideApi && window.sessionStorage) {
                    sessionStorage.setItem('tatamiApiUrlOverride', overrideApi);
                }
            } catch (storageErr) {}
            if (overrideApi) {
                return overrideApi.replace(/\/+$/, '');
            }
            const host = window.location.hostname;
            if (host && host !== 'localhost' && host !== '127.0.0.1') {
                const isPrivateLanIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
                if (isPrivateLanIp) {
                    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
                    const port = proto === 'https:' ? '7045' : '5008';
                    return `${proto}//${host}:${port}/api`;
                }
                // Éles publikus domainen (pl. https://sajatdomain.hu) az Nginx ugyanazon a címen (/api) szolgálja ki a C# Backendet
                return `${window.location.origin}/api`;
            }
        } catch (e) {}
        return 'https://localhost:7045/api';
    })(),
    hooks: {},
    _liveEventSource: null,
    _liveVersion: 0,
    _liveDataVersion: 0,
    _liveConnected: false,

    WIN_TYPES: {
        'IPPON':   { kod: 'IPPON',   rovid: 'IPP', cimke: 'Egyből Ippon',                        pont: 3 },
        'AWASETE': { kod: 'AWASETE', rovid: 'AWA', cimke: '2x Waza-ari (Awasete Ippon)',         pont: 3 },
        'WAZAARI': { kod: 'WAZAARI', rovid: 'WAZ', cimke: '1x Waza-ari előny',                   pont: 2 },
        'HANTEI':  { kod: 'HANTEI',  rovid: 'HAN', cimke: 'Bírói döntés (Döntetlen után)',       pont: 1 },
        'SIKAKU':  { kod: 'SIKAKU',  rovid: 'SIK', cimke: 'Leléptetés (2 Genten / Kizárás)',     pont: 3 },
        'KIKEN':   { kod: 'KIKEN',   rovid: 'KIK', cimke: 'Nem jelent meg / Feladta (Kiken)',    pont: 3 }
    },

    // --- HIVATALOS KYOKUSHIN KUMITE KÜZDŐIDŐ ÉS HOSSZABBÍTÁSI SZABÁLYTÁBLA ---
    // Pontosan a korcsoport-táblázat szerint:
    // Gyerek 3,2,1: 1+1 perc | Serdülő: 1,5+1 perc | Ifjúsági: 2+1 perc | Junior: 2+2+1 perc | Felnőtt: 2+2+mérlegelés*+2 perc | Senior: 1,5+1,5 perc
    KUMITE_IDO_SZABALYOK: {
        'GYEREK': {
            kulcs: 'GYEREK',
            korcsoportNev: 'Gyerek 3,2,1',
            keplet: '1 + 1 perc',
            teljesCimke: 'Gyerek 3,2,1 (1 + 1 perc)',
            fazisok: [
                { kod: 'ALAP',    nev: 'Alapidő (1 perc)',      rovid: 'ALAPIDŐ',        mp: 60, isMerlegeles: false },
                { kod: 'HOSSZ_1', nev: 'Hosszabbítás (1 perc)', rovid: 'HOSSZABBÍTÁS',   mp: 60, isMerlegeles: false }
            ]
        },
        'SERDULO': {
            kulcs: 'SERDULO',
            korcsoportNev: 'Serdülő',
            keplet: '1,5 + 1 perc',
            teljesCimke: 'Serdülő (1,5 + 1 perc)',
            fazisok: [
                { kod: 'ALAP',    nev: 'Alapidő (1,5 perc)',    rovid: 'ALAPIDŐ',        mp: 90, isMerlegeles: false },
                { kod: 'HOSSZ_1', nev: 'Hosszabbítás (1 perc)', rovid: 'HOSSZABBÍTÁS',   mp: 60, isMerlegeles: false }
            ]
        },
        'IFJUSAGI': {
            kulcs: 'IFJUSAGI',
            korcsoportNev: 'Ifjúsági',
            keplet: '2 + 1 perc',
            teljesCimke: 'Ifjúsági (2 + 1 perc)',
            fazisok: [
                { kod: 'ALAP',    nev: 'Alapidő (2 perc)',      rovid: 'ALAPIDŐ',        mp: 120, isMerlegeles: false },
                { kod: 'HOSSZ_1', nev: 'Hosszabbítás (1 perc)', rovid: 'HOSSZABBÍTÁS',   mp: 60,  isMerlegeles: false }
            ]
        },
        'JUNIOR': {
            kulcs: 'JUNIOR',
            korcsoportNev: 'Junior',
            keplet: '2 + 2 + 1 perc',
            teljesCimke: 'Junior (2 + 2 + 1 perc)',
            fazisok: [
                { kod: 'ALAP',    nev: 'Alapidő (2 perc)',         rovid: 'ALAPIDŐ',         mp: 120, isMerlegeles: false },
                { kod: 'HOSSZ_1', nev: '1. Hosszabbítás (2 perc)', rovid: '1. HOSSZABBÍTÁS', mp: 120, isMerlegeles: false },
                { kod: 'HOSSZ_2', nev: '2. Hosszabbítás (1 perc)', rovid: '2. HOSSZABBÍTÁS', mp: 60,  isMerlegeles: false }
            ]
        },
        'FELNOTT': {
            kulcs: 'FELNOTT',
            korcsoportNev: 'Felnőtt',
            keplet: '2 + 2 + mérlegelés* + 2 perc',
            teljesCimke: 'Felnőtt (2 + 2 + mérlegelés* + 2 perc)',
            fazisok: [
                { kod: 'ALAP',       nev: 'Alapidő (2 perc)',            rovid: 'ALAPIDŐ',            mp: 120, isMerlegeles: false },
                { kod: 'HOSSZ_1',    nev: '1. Hosszabbítás (2 perc)',    rovid: '1. HOSSZABBÍTÁS',    mp: 120, isMerlegeles: false },
                { kod: 'MERLEGELES', nev: 'Mérlegelés* (Súlyellenőrzés)', rovid: 'MÉRLEGELÉS*',       mp: 0,   isMerlegeles: true  },
                { kod: 'HOSSZ_2',    nev: 'Végső Hosszabbítás (2 perc)', rovid: 'VÉGSŐ HOSSZABBÍTÁS', mp: 120, isMerlegeles: false }
            ]
        },
        'SENIOR': {
            kulcs: 'SENIOR',
            korcsoportNev: 'Senior',
            keplet: '1,5 + 1,5 perc',
            teljesCimke: 'Senior (1,5 + 1,5 perc)',
            fazisok: [
                { kod: 'ALAP',    nev: 'Alapidő (1,5 perc)',      rovid: 'ALAPIDŐ',      mp: 90, isMerlegeles: false },
                { kod: 'HOSSZ_1', nev: 'Hosszabbítás (1,5 perc)', rovid: 'HOSSZABBÍTÁS', mp: 90, isMerlegeles: false }
            ]
        }
    },

    lekerKumiteIdoSzabaly: function(kategoria, overrideKulcs = null) {
        if (overrideKulcs && this.KUMITE_IDO_SZABALYOK[overrideKulcs]) {
            return this.KUMITE_IDO_SZABALYOK[overrideKulcs];
        }
        if (!kategoria) {
            return this.KUMITE_IDO_SZABALYOK['FELNOTT'];
        }

        const nyersNev = String(kategoria.name || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const minAge = parseInt(kategoria.minAge) || 0;
        const maxAge = parseInt(kategoria.maxAge) || 0;

        // 1. Név alapú kulcsszó-felismerés (magyar és nemzetközi megnevezésekre is)
        if (nyersNev.includes('senior') || nyersNev.includes('veteran') || nyersNev.includes('masters') ||
            nyersNev.includes('35+') || nyersNev.includes('35-') || nyersNev.includes('40+') || nyersNev.includes('45+') || nyersNev.includes('50+')) {
            return this.KUMITE_IDO_SZABALYOK['SENIOR'];
        }
        if (nyersNev.includes('gyerek') || nyersNev.includes('gyermek') || nyersNev.includes('kids') || nyersNev.includes('child') ||
            /\b(u8|u9|u10|u11|6-7|8-9|10-11)\b/.test(nyersNev)) {
            return this.KUMITE_IDO_SZABALYOK['GYEREK'];
        }
        if (nyersNev.includes('serdulo') || /\b(u12|u13|12-13)\b/.test(nyersNev)) {
            return this.KUMITE_IDO_SZABALYOK['SERDULO'];
        }
        if (nyersNev.includes('ifjusagi') || /\b(ifi|kadet|cadet|u14|u15|14-15)\b/.test(nyersNev)) {
            return this.KUMITE_IDO_SZABALYOK['IFJUSAGI'];
        }
        if (nyersNev.includes('junior') || /\b(u16|u17|u18|16-17)\b/.test(nyersNev)) {
            return this.KUMITE_IDO_SZABALYOK['JUNIOR'];
        }
        if (nyersNev.includes('felnott') || nyersNev.includes('adult') || /\b(18-34|18\+|u21|u22)\b/.test(nyersNev)) {
            return this.KUMITE_IDO_SZABALYOK['FELNOTT'];
        }

        // 2. Életkor-határ (minAge / maxAge) alapú pontos besorolás
        if (minAge >= 35) return this.KUMITE_IDO_SZABALYOK['SENIOR'];
        if (maxAge > 0 && maxAge <= 11) return this.KUMITE_IDO_SZABALYOK['GYEREK'];
        if ((minAge >= 12 && maxAge > 0 && maxAge <= 13) || maxAge === 13) return this.KUMITE_IDO_SZABALYOK['SERDULO'];
        if ((minAge >= 14 && maxAge > 0 && maxAge <= 15) || maxAge === 15) return this.KUMITE_IDO_SZABALYOK['IFJUSAGI'];
        if ((minAge >= 16 && maxAge > 0 && maxAge <= 17) || maxAge === 17) return this.KUMITE_IDO_SZABALYOK['JUNIOR'];

        return this.KUMITE_IDO_SZABALYOK['FELNOTT'];
    },

    // Átlagos mérkőzés-időtartam becslés (mp) a "Mikor küzdök?" élő várakozási idő kalkulátorhoz
    becsulMeccsIdotartamMp: function(kategoria) {
        if (!kategoria) return 150;
        const isKata = (kategoria.matchType && kategoria.matchType.toUpperCase() === 'KATA');
        if (isKata) {
            return 90; // Kata bemutatás + bírói pontozás átlagosan ~1,5 perc
        }
        const szabaly = this.lekerKumiteIdoSzabaly(kategoria);
        const alapMp = (szabaly.fazisok && szabaly.fazisok[0]) ? szabaly.fazisok[0].mp : 120;
        // Alapidő + tatamira lépés, bírói döntés és átlagos hosszabbítási ráhagyás (+45 mp)
        return alapMp + 45;
    },

    // --- VONALRAJZOS (LINE-ART) SVG IKON KÖNYVTÁR ---
    ICONS: {
        'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
        'medal': '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>',
        'award': '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
        'chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
        'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'unlock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
        'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
        'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
        'edit': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
        'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
        'check': '<polyline points="20 6 9 17 4 12"/>',
        'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        'ban': '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
        'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        'calendar': '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
        'file': '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>',
        'image': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
        'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
        'undo': '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
        'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        'print': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
        'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
        'shuffle': '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><polyline points="18 2 22 6 18 10"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><polyline points="18 14 22 18 18 22"/>',
        'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
        'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
        'git-branch': '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
        'megaphone': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
        'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
        'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
        'video': '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>',
        'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'play': '<polygon points="5 3 19 12 5 21 5 3"/>',
        'pause': '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>',
        'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
        'pin': '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0-4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
        'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
        'chevron-up': '<polyline points="18 15 12 9 6 15"/>',
        'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        'bolt': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'clipboard': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
        'circle': '<circle cx="12" cy="12" r="8"/>',
        'circle-dot': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
        'qr': '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
        'volume': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
        'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
        'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
        'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'
    },

    icon: function(name, size = 16, extraClass = '') {
        const svgContent = this.ICONS[name] || this.ICONS['circle'];
        return `<svg class="tm-line-icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.18em;flex-shrink:0;display:inline-block;">${svgContent}</svg>`;
    },

    // --- HIVATALOS TATAMI MASTER™ VEKTOROS EMBLÉMA (KANKU-TATAMI OKTOGON LOGÓ) ---
    brandLogoSvg: function(size = 30, extraClass = 'tm-brand-logo') {
        return `<svg class="${extraClass}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TATAMI MASTER™ Hivatalos Védjegy Logó">
            <polygon points="19,2 45,2 62,19 62,45 45,62 19,62 2,45 2,19" fill="#18181B" stroke="#FAF8F5" stroke-width="2.5" stroke-linejoin="round"/>
            <polygon points="21.5,6.5 42.5,6.5 57.5,21.5 57.5,42.5 42.5,57.5 21.5,57.5 6.5,42.5 6.5,21.5" fill="none" stroke="#FAF8F5" stroke-width="1.2" stroke-opacity="0.45" stroke-linejoin="round"/>
            <polygon points="32,10.5 51,32 32,53.5 13,32" fill="#18181B" stroke="#FAF8F5" stroke-width="2.3" stroke-linejoin="round"/>
            <circle cx="32" cy="17.5" r="2.3" fill="#FAF8F5"/>
            <path d="M20 24.5H44" stroke="#FAF8F5" stroke-width="2.8" stroke-linecap="round"/>
            <path d="M32 24.5V46" stroke="#FAF8F5" stroke-width="2.8" stroke-linecap="round"/>
            <path d="M22.5 41.5V29.5L32 37.5L41.5 29.5V41.5" stroke="#FAF8F5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    },

    // --- VALÓS IDEJŰ (LIVE) ESZKÖZÖK KÖZÖTTI SZINKRONIZÁCIÓ (SSE + POLLING TARTALÉK + LOCALSTORAGE) ---
    initLiveSync: function() {
        if (this._liveSyncInditva) return;
        this._liveSyncInditva = true;

        // 1. Azonos gépen belüli azonnali szinkronizáció
        window.addEventListener('storage', (ev) => {
            if (!ev.key) return;
            if (ev.key === 'tatamiAdatok' || ev.key.startsWith('tatamiAdatok_')) {
                try {
                    const parsed = ev.newValue ? JSON.parse(ev.newValue) : null;
                    if (parsed) this.trigger('liveTatamiFrissult', parsed);
                } catch (e) {}
            } else if (['kataEredmenyek', 'kataDontoMeccsIdk', 'kumiteReszletek', 'tatamiVersenyAdatMap'].includes(ev.key) || ev.key.startsWith('tatamiNevezesLezarva_')) {
                this.trigger('liveAdatValtozott', { key: ev.key });
            }
        });

        // 2. Szerveroldali valós idejű (külön gépek, telefonok, TV-k, OBS közötti) szinkronizáció
        this._csatlakozzLiveStreamhez();

        // 3. Könnyűsúlyú biztonsági ellenőrzés arra az esetre, ha a Wi-Fi ideiglenesen bontaná az EventSource kapcsolatot
        setInterval(() => {
            if (!this._liveConnected) {
                this.szinkronizalLiveSnapshotCsendben();
            }
        }, 2000);
    },

    _alkalmazBejovoSnapshot: function(snap) {
        if (!snap || typeof snap !== 'object') return;
        const prevDataVer = this._liveDataVersion;
        if (snap.version) this._liveVersion = snap.version;
        if (snap.dataVersion) this._liveDataVersion = snap.dataVersion;

        // Megosztott állapotok szinkronizálása localStorage-ba (hogy minden meglévő lekérdező függvény azonnal lássa külön gépen is)
        if (snap.shared && typeof snap.shared === 'object') {
            this._alkalmazMegosztottAllapotHelyben('kataEredmenyek', snap.shared.kataEredmenyek);
            this._alkalmazMegosztottAllapotHelyben('kataDontoMeccsIdk', snap.shared.kataDontoMeccsIdk);
            this._alkalmazMegosztottAllapotHelyben('kumiteReszletek', snap.shared.kumiteReszletek);
            this._alkalmazMegosztottAllapotHelyben('versenyAdatMap', snap.shared.versenyAdatMap);
            this._alkalmazMegosztottAllapotHelyben('nevezesLezarva', snap.shared.nevezesLezarva);
        }

        // Élő Tatami eredményjelzők szinkronizálása
        if (snap.tatamik && typeof snap.tatamik === 'object') {
            for (const tKey of Object.keys(snap.tatamik)) {
                const tAdat = snap.tatamik[tKey];
                if (tAdat && typeof tAdat === 'object') {
                    try {
                        localStorage.setItem('tatamiAdatok_' + tKey, JSON.stringify(tAdat));
                    } catch (e) {}
                }
            }
        }
        if (snap.latestTatami && typeof snap.latestTatami === 'object') {
            try {
                localStorage.setItem('tatamiAdatok', JSON.stringify(snap.latestTatami));
            } catch (e) {}
            this.trigger('liveTatamiFrissult', snap.latestTatami);
        }

        if (prevDataVer > 0 && snap.dataVersion && snap.dataVersion !== prevDataVer) {
            this.trigger('liveAdatValtozott', { type: 'data_changed', dataVersion: snap.dataVersion });
        }
    },

    _alkalmazMegosztottAllapotHelyben: function(key, val) {
        if (val === undefined || val === null) return;
        try {
            if (key === 'kataEredmenyek' || key === 'kataDontoMeccsIdk' || key === 'kumiteReszletek') {
                localStorage.setItem(key, JSON.stringify(val));
            } else if (key === 'versenyAdatMap') {
                localStorage.setItem('tatamiVersenyAdatMap', JSON.stringify(val));
            } else if (key === 'nevezesLezarva' && typeof val === 'object') {
                for (const vId of Object.keys(val)) {
                    localStorage.setItem('tatamiNevezesLezarva_' + vId, val[vId] ? 'true' : 'false');
                }
            }
        } catch (e) {}
    },

    _csatlakozzLiveStreamhez: function() {
        if (typeof EventSource === 'undefined') {
            this.szinkronizalLiveSnapshotCsendben();
            return;
        }
        try {
            if (this._liveEventSource) {
                this._liveEventSource.close();
            }
            const es = new EventSource(this.API_URL + '/LiveArena/stream');
            this._liveEventSource = es;

            es.onopen = () => {
                this._liveConnected = true;
                this.trigger('liveKapcsolatValtozott', { connected: true });
            };

            es.addEventListener('snapshot', (e) => {
                this._liveConnected = true;
                try {
                    const snap = JSON.parse(e.data);
                    this._alkalmazBejovoSnapshot(snap);
                } catch (err) {}
            });

            es.addEventListener('tatami_updated', (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.version) this._liveVersion = msg.version;
                    if (msg.tatami) {
                        const tKey = msg.tatamiKey || msg.tatami.tatamiId || 'default';
                        localStorage.setItem('tatamiAdatok_' + tKey, JSON.stringify(msg.tatami));
                        localStorage.setItem('tatamiAdatok', JSON.stringify(msg.tatami));
                        this.trigger('liveTatamiFrissult', msg.tatami);
                    }
                } catch (err) {}
            });

            es.addEventListener('shared_updated', (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.version) this._liveVersion = msg.version;
                    this._alkalmazMegosztottAllapotHelyben(msg.key, msg.value);
                    this.trigger('liveAdatValtozott', { type: 'shared_updated', key: msg.key });
                } catch (err) {}
            });

            es.addEventListener('data_changed', (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.version) this._liveVersion = msg.version;
                    if (msg.dataVersion) this._liveDataVersion = msg.dataVersion;
                    this.trigger('liveAdatValtozott', msg);
                } catch (err) {}
            });

            es.addEventListener('reset_all', () => {
                try {
                    localStorage.removeItem('kataEredmenyek');
                    localStorage.removeItem('kataDontoMeccsIdk');
                    localStorage.removeItem('kumiteReszletek');
                    localStorage.removeItem('tatamiVersenyAdatMap');
                    Object.keys(localStorage).forEach(k => {
                        if (k.startsWith('tatamiNevezesLezarva_') || k.startsWith('tatamiAdatok')) {
                            localStorage.removeItem(k);
                        }
                    });
                } catch (err) {}
                this.trigger('liveAdatValtozott', { type: 'reset_all' });
            });

            es.onerror = () => {
                this._liveConnected = false;
                this.trigger('liveKapcsolatValtozott', { connected: false });
            };
        } catch (e) {
            this._liveConnected = false;
        }
    },

    szinkronizalLiveSnapshotCsendben: async function() {
        try {
            const res = await fetch(`${this.API_URL}/LiveArena/snapshot?sinceVersion=${this._liveVersion || 0}`);
            if (!res.ok) return;
            const snap = await res.json();
            if (snap && snap.changed) {
                this._alkalmazBejovoSnapshot(snap);
            }
        } catch (e) {}
    },

    kuldesLiveTatamiAllapot: function(tatamiAdatok) {
        if (!tatamiAdatok || typeof tatamiAdatok !== 'object') return;
        const tKey = String(tatamiAdatok.tatamiId || 'default');
        try {
            const jsonStr = JSON.stringify(tatamiAdatok);
            localStorage.setItem('tatamiAdatok', jsonStr);
            localStorage.setItem('tatamiAdatok_' + tKey, jsonStr);
        } catch (e) {}

        fetch(this.API_URL + '/LiveArena/tatami', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tatamiAdatok)
        }).catch(() => {});
    },

    kuldesLiveMegosztottAllapot: function(kulcs, ertek, merge = false) {
        fetch(this.API_URL + '/LiveArena/shared', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: kulcs, value: ertek, merge: merge })
        }).catch(() => {});
    },

    lekerLiveTatamiAllapot: function(tatamiId = null) {
        if (tatamiId) {
            const specifikus = this.safeJsonParse('tatamiAdatok_' + tatamiId, null);
            if (specifikus) return specifikus;
        }
        return this.safeJsonParse('tatamiAdatok', null);
    },

    // --- AKTÍV VERSENY (MULTI-TOURNAMENT) KONTEXTUS ÉS AUTOMATIKUS KIVÁLASZTÁS ---
    initVersenyKontextus: function() {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlVersenyId = parseInt(params.get('versenyId'));
            if (!isNaN(urlVersenyId) && urlVersenyId > 0) {
                localStorage.setItem('aktualisVersenyId', String(urlVersenyId));
                sessionStorage.setItem('tatamiManualVersenyId', String(urlVersenyId));
            }
        } catch (e) {}
    },

    keresLegaktualisabbVerseny: function(versenyek) {
        if (!Array.isArray(versenyek) || versenyek.length === 0) return null;
        if (versenyek.length === 1) return versenyek[0];

        const most = new Date();
        const maNap = new Date(most.getFullYear(), most.getMonth(), most.getDate()).getTime();
        const egyNapMs = 24 * 60 * 60 * 1000;

        const ertekel = (v) => {
            const st = (v.status || 'ÉLŐ / NYITVA').toUpperCase();
            const isLezartStatusz = st.includes('LEZÁR');

            let statuszPont = 2;
            if (isLezartStatusz) {
                statuszPont = 0;
            } else if (st.includes('ÉLŐ') || st.includes('NYITVA')) {
                statuszPont = 3;
            } else if (st.includes('NEVEZ')) {
                statuszPont = 2;
            }

            let vNap = maNap;
            if (v.date) {
                const d = new Date(v.date);
                if (!isNaN(d.getTime())) {
                    vNap = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                }
            }

            const kulonbsegNap = Math.round((vNap - maNap) / egyNapMs);
            let idoKategoria = 2;
            if (Math.abs(kulonbsegNap) <= 1) {
                idoKategoria = 3;
            } else if (kulonbsegNap > 1) {
                idoKategoria = 2;
            } else {
                idoKategoria = 1;
            }

            return {
                v: v,
                statuszPont: statuszPont,
                idoKategoria: idoKategoria,
                absTavolsagNap: Math.abs(kulonbsegNap),
                id: v.id || 0
            };
        };

        const rangsorolt = versenyek.map(ertekel).sort((a, b) => {
            if (b.statuszPont !== a.statuszPont) return b.statuszPont - a.statuszPont;
            if (b.idoKategoria !== a.idoKategoria) return b.idoKategoria - a.idoKategoria;
            if (a.absTavolsagNap !== b.absTavolsagNap) return a.absTavolsagNap - b.absTavolsagNap;
            return b.id - a.id;
        });

        return rangsorolt[0].v;
    },

    isAutomatikusVersenyMod: function() {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.has('versenyId')) return false;
            return !sessionStorage.getItem('tatamiManualVersenyId');
        } catch (e) {
            return true;
        }
    },

    valasztdAutoAktualisVersenyt: function(versenyLista = null) {
        try {
            sessionStorage.removeItem('tatamiManualVersenyId');
            const url = new URL(window.location.href);
            if (url.searchParams.has('versenyId')) {
                url.searchParams.delete('versenyId');
                window.history.replaceState({}, '', url.toString());
            }
        } catch (e) {}

        const lista = Array.isArray(versenyLista)
            ? versenyLista
            : this.safeJsonParse('tatamiVersenyekCache', []);
        const autoV = this.keresLegaktualisabbVerseny(lista);
        if (autoV) {
            this.mentAktualisVerseny(autoV.id, autoV.name, false);
        }
        return autoV;
    },

    lekerAktualisVersenyId: function() {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlVersenyId = parseInt(params.get('versenyId'));
            if (!isNaN(urlVersenyId) && urlVersenyId > 0) {
                return urlVersenyId;
            }
            const manualId = parseInt(sessionStorage.getItem('tatamiManualVersenyId'));
            if (!isNaN(manualId) && manualId > 0) {
                return manualId;
            }
        } catch (e) {}

        const cache = this.safeJsonParse('tatamiVersenyekCache', []);
        if (Array.isArray(cache) && cache.length > 0) {
            const autoV = this.keresLegaktualisabbVerseny(cache);
            if (autoV && autoV.id) return autoV.id;
        }
        return parseInt(localStorage.getItem('aktualisVersenyId')) || 1;
    },

    lekerAktualisVersenyNev: function() {
        return localStorage.getItem('aktualisVersenyNev') || 'Shobu HSE Országos Bajnokság 2026';
    },

    mentAktualisVerseny: function(id, nev, manualisValasztas = false) {
        const numId = parseInt(id) || 1;
        localStorage.setItem('aktualisVersenyId', String(numId));
        try {
            if (manualisValasztas) {
                sessionStorage.setItem('tatamiManualVersenyId', String(numId));
            }
        } catch (e) {}

        if (nev) {
            localStorage.setItem('aktualisVersenyNev', nev);
        } else {
            const cache = this.safeJsonParse('tatamiVersenyekCache', []);
            const talalat = cache.find(v => v.id === numId);
            if (talalat && talalat.name) {
                localStorage.setItem('aktualisVersenyNev', talalat.name);
            }
        }
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('versenyId')) {
                url.searchParams.set('versenyId', String(numId));
                window.history.replaceState({}, '', url.toString());
            }
        } catch (e) {}
    },

    lekerVersenyAdatMap: function() {
        const alap = {
            alapVersenyId: 1,
            Competitors: {},
            Categories: {},
            Tatamis: {},
            Registrations: {},
            Matches: {}
        };
        const mentett = this.safeJsonParse('tatamiVersenyAdatMap', null);
        if (!mentett || typeof mentett !== 'object') return alap;
        return {
            alapVersenyId: mentett.alapVersenyId || 1,
            Competitors: mentett.Competitors || {},
            Categories: mentett.Categories || {},
            Tatamis: mentett.Tatamis || {},
            Registrations: mentett.Registrations || {},
            Matches: mentett.Matches || {}
        };
    },

    mentVersenyAdatMap: function(map) {
        try {
            localStorage.setItem('tatamiVersenyAdatMap', JSON.stringify(map));
            this.kuldesLiveMegosztottAllapot('versenyAdatMap', map, false);
        } catch (e) {}
    },

    hozzarendelEntitasVersenyhez: function(tipus, entitasId, versenyId = null) {
        if (!entitasId) return;
        const celVersenyId = parseInt(versenyId) || this.lekerAktualisVersenyId();
        const map = this.lekerVersenyAdatMap();
        if (!map[tipus]) map[tipus] = {};
        map[tipus][String(entitasId)] = celVersenyId;
        this.mentVersenyAdatMap(map);
    },

    lekerEntitasVersenyId: function(tipus, entitasId, alapVersenyId = null) {
        const map = this.lekerVersenyAdatMap();
        const alapId = alapVersenyId || map.alapVersenyId || 1;
        if (map[tipus] && map[tipus][String(entitasId)] !== undefined) {
            return parseInt(map[tipus][String(entitasId)]);
        }
        return alapId;
    },

    // --- NEVEZÉS LEZÁRÁSA / MEGNYITÁSA ÁLLAPOTKEZELŐ (VERSENYENKÉNT SZEPARÁLVA + KÜLÖN GÉPEKRE SZINKRONIZÁLVA) ---
    isNevezesLezarva: function(versenyId = null) {
        const vId = parseInt(versenyId) || this.lekerAktualisVersenyId();
        const perVerseny = localStorage.getItem('tatamiNevezesLezarva_' + vId);
        if (perVerseny !== null) {
            return perVerseny === 'true';
        }
        return false;
    },

    setNevezesLezarva: function(lezarva, versenyId = null) {
        const vId = parseInt(versenyId) || this.lekerAktualisVersenyId();
        localStorage.setItem('tatamiNevezesLezarva_' + vId, lezarva ? 'true' : 'false');
        const payload = {};
        payload[String(vId)] = !!lezarva;
        this.kuldesLiveMegosztottAllapot('nevezesLezarva', payload, true);
    },

    // --- KYOKUSHIN KUMITE FORMÁTUM SZABÁLY (<= 5 FŐ: KÖRMÉRKŐZÉS, > 5 FŐ: EGYENES KIESÉS) ---
    isKumiteKormeccsLetszam: function(indulokSzama) {
        return (parseInt(indulokSzama) || 0) <= 5;
    },

    isKumiteAgrajz: function(katMeccsek) {
        if (!Array.isArray(katMeccsek) || katMeccsek.length === 0) return false;
        const n = katMeccsek.length;
        return (n === 7 || n === 15 || n === 31 || n === 63 || n === 127);
    },

    /**
     * Egyenes kieséses (Kumite) ágrajz generálása szabványos kiemeléssel.
     * - A kiemelt versenyzők elsőbbséget kapnak az erőnyerő (bye) helyekre.
     * - A kiemelések és erőnyerők a tábla ellentétes ágaira/negyedeibe kerülnek
     *   (1. kiemelt felül, 2. alul, 3-4. a maradék ellentétes negyedekben stb.),
     *   így az élmezőny csak a végső fordulókban találkozhat.
     */
    generalEgyenesKiesesMeccsek: function(categoryId, tatamiId, kiemeltek = [], tobbiek = [], startOrder = 1) {
        const ossz = [...kiemeltek, ...tobbiek];
        if (ossz.length === 0) return [];

        let sorszam = startOrder;
        if (ossz.length === 1) {
            return [{
                categoryId,
                tatamiId,
                competitor1Id: ossz[0].id,
                competitor2Id: null,
                matchOrder: sorszam,
                isFinished: true,
                winnerId: ossz[0].id
            }];
        }

        let agrajzMeret = 2;
        while (agrajzMeret < ossz.length) agrajzMeret *= 2;

        const r1Meret = agrajzMeret / 2;
        const eronyerokSzama = agrajzMeret - ossz.length;

        // Szabványos ágrajz pozíciók rangsora (pl. 8-as ág / 4 R1 meccs -> [1, 4, 3, 2])
        let matchSeeds = [1];
        while (matchSeeds.length < r1Meret) {
            const nextLen = matchSeeds.length * 2;
            const mirrorSum = nextLen + 1;
            const expanded = [];
            for (let i = 0; i < matchSeeds.length; i++) {
                const s = matchSeeds[i];
                if (i % 2 === 0) {
                    expanded.push(s, mirrorSum - s);
                } else {
                    expanded.push(mirrorSum - s, s);
                }
            }
            matchSeeds = expanded;
        }

        // R1 meccsindexek fontossági sorrendben (1. seed helye, 2. seed helye, ...)
        const prioritasIndexek = matchSeeds
            .map((seedRank, idx) => ({ seedRank, idx }))
            .sort((a, b) => a.seedRank - b.seedRank)
            .map(item => item.idx);

        const elsoKor = new Array(r1Meret).fill(null);
        const kiemeltSor = [...kiemeltek];
        const egyebSor = [...tobbiek];

        // 1. Erőnyerő helyek kiosztása prioritás szerint (kiemeltek előnyt élveznek!)
        for (let p = 0; p < eronyerokSzama; p++) {
            const mIdx = prioritasIndexek[p];
            const versenyzo = kiemeltSor.length > 0 ? kiemeltSor.shift() : egyebSor.shift();
            elsoKor[mIdx] = {
                categoryId,
                tatamiId,
                competitor1Id: versenyzo.id,
                competitor2Id: null,
                isFinished: true,
                winnerId: versenyzo.id
            };
        }

        // 2. Valódi 1. fordulós mérkőzések aka oldalának feltöltése prioritás szerint
        const valodiSlotok = prioritasIndexek.slice(eronyerokSzama);
        const akaKiosztas = [];
        for (let mIdx of valodiSlotok) {
            const aka = kiemeltSor.length > 0 ? kiemeltSor.shift() : egyebSor.shift();
            akaKiosztas.push({ mIdx, aka });
        }

        // Ha több kiemelt volt, mint az összes 1. körös ághely, a fennmaradók a shiro oldal végére kerülnek
        const kiemeltIdSet = new Set(kiemeltek.map(k => k.id));
        const shiroPool = [...egyebSor, ...kiemeltSor];

        // 3. Shiro ellenfél választása (klubütközés kerülése + jövőbeli aka klubok figyelembevétele)
        akaKiosztas.forEach(({ mIdx, aka }, pos) => {
            const kovAkaKlubok = new Set(akaKiosztas.slice(pos + 1).map(x => x.aka.club));
            let valasztottIdx = -1;

            // Először az unseeded jelöltek közül keressünk olyan nem-ütközőt, aki segít elkerülni későbbi ütközést
            for (let i = 0; i < shiroPool.length; i++) {
                if (shiroPool[i].club === aka.club) continue;
                if (valasztottIdx === -1) valasztottIdx = i;
                if (!kiemeltIdSet.has(shiroPool[i].id) && kovAkaKlubok.has(shiroPool[i].club)) {
                    valasztottIdx = i;
                    break;
                }
            }
            if (valasztottIdx === -1) valasztottIdx = 0;

            const shiro = shiroPool.splice(valasztottIdx, 1)[0];
            elsoKor[mIdx] = {
                categoryId,
                tatamiId,
                competitor1Id: aka.id,
                competitor2Id: shiro.id,
                isFinished: false,
                winnerId: null
            };
        });

        // 4. Sorba rendezés fentről lefelé az ágrajz sorrendjében és sorszámozás
        const generalt = [];
        for (let m of elsoKor) {
            m.matchOrder = sorszam++;
            generalt.push(m);
        }

        // 5. Következő fordulók generálása (automatikus továbbjutással az erőnyerőkről)
        let elozoKor = elsoKor;
        let korMeret = agrajzMeret / 4;
        while (korMeret >= 1) {
            const ujKor = [];
            for (let i = 0; i < korMeret; i++) {
                const m1 = elozoKor[i * 2];
                const m2 = elozoKor[i * 2 + 1];
                ujKor.push({
                    categoryId,
                    tatamiId,
                    competitor1Id: (m1 && m1.isFinished) ? m1.winnerId : null,
                    competitor2Id: (m2 && m2.isFinished) ? m2.winnerId : null,
                    matchOrder: sorszam++,
                    isFinished: false,
                    winnerId: null
                });
            }
            generalt.push(...ujKor);
            elozoKor = ujKor;
            korMeret /= 2;
        }

        return generalt;
    },

    // --- EMOJI-MENTESÍTŐ (AUTOMATIKUS KARAKTERTISZTÍTÓ) ---
    stripEmojis: function(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2300}-\u{23FF}\u{2B50}\u{2934}\u{2935}\u{25AA}-\u{25FE}\u{2194}-\u{21AA}]/gu, '').replace(/\s{2,}/g, ' ').trim();
    },

    // --- HACKER ELLENI VÉDELEM: XSS TISZTÍTÓ ---
    escapeHtml: function(str) {
        if (typeof str !== 'string') return str;
        return this.stripEmojis(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    sanitizePayload: function(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        const tiszta = Array.isArray(obj) ? [] : {};
        for (let k in obj) {
            if (typeof obj[k] === 'string') {
                tiszta[k] = this.stripEmojis(obj[k].replace(/<\/?[^>]+(>|$)/g, ""));
            } else if (typeof obj[k] === 'object' && obj[k] !== null) {
                tiszta[k] = this.sanitizePayload(obj[k]);
            } else {
                tiszta[k] = obj[k];
            }
        }
        return tiszta;
    },

    // --- ISO/IEC 18004 SZABVÁNYÚ, 100% OFFLINE VEKTOROS (SVG) QR-KÓD GENERÁTOR ---
    generalQrSvg: function(szoveg, pixelMeret = 240) {
        const utf8Bytes = Array.from(new TextEncoder().encode(String(szoveg || '')));
        // Verziók 1..10 (ECC Level L: gyors és távolról is könnyen olvasható csarnokplakátokhoz)
        const VERZIO_TABLA = [
            null,
            { ver: 1,  total: 26,  ecPerBlock: 7,  b1: 1, d1: 19,  b2: 0, d2: 0,   align: [] },
            { ver: 2,  total: 44,  ecPerBlock: 10, b1: 1, d1: 34,  b2: 0, d2: 0,   align: [6, 18] },
            { ver: 3,  total: 70,  ecPerBlock: 15, b1: 1, d1: 55,  b2: 0, d2: 0,   align: [6, 22] },
            { ver: 4,  total: 100, ecPerBlock: 20, b1: 1, d1: 80,  b2: 0, d2: 0,   align: [6, 26] },
            { ver: 5,  total: 134, ecPerBlock: 26, b1: 1, d1: 108, b2: 0, d2: 0,   align: [6, 30] },
            { ver: 6,  total: 172, ecPerBlock: 18, b1: 2, d1: 68,  b2: 0, d2: 0,   align: [6, 34] },
            { ver: 7,  total: 196, ecPerBlock: 20, b1: 2, d1: 78,  b2: 0, d2: 0,   align: [6, 22, 38] },
            { ver: 8,  total: 242, ecPerBlock: 24, b1: 2, d1: 97,  b2: 0, d2: 0,   align: [6, 24, 42] },
            { ver: 9,  total: 292, ecPerBlock: 30, b1: 2, d1: 116, b2: 0, d2: 0,   align: [6, 26, 46] },
            { ver: 10, total: 346, ecPerBlock: 18, b1: 2, d1: 68,  b2: 2, d2: 69,  align: [6, 28, 50] }
        ];

        let cfg = VERZIO_TABLA[10];
        for (let v = 1; v <= 10; v++) {
            const c = VERZIO_TABLA[v];
            const dataCap = c.b1 * c.d1 + c.b2 * c.d2;
            const lenBits = v <= 9 ? 8 : 16;
            const maxBytes = Math.floor((dataCap * 8 - 4 - lenBits) / 8);
            if (utf8Bytes.length <= maxBytes) {
                cfg = c;
                break;
            }
        }

        const ver = cfg.ver;
        const dataCapacity = cfg.b1 * cfg.d1 + cfg.b2 * cfg.d2;
        const countBits = ver <= 9 ? 8 : 16;
        const maxAllowed = Math.floor((dataCapacity * 8 - 4 - countBits) / 8);
        const payloadBytes = utf8Bytes.slice(0, maxAllowed);

        // 1. Bitfolyam előállítása (Byte mode = 0100)
        const bits = [];
        const pushBits = (val, len) => {
            for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
        };
        pushBits(0b0100, 4);
        pushBits(payloadBytes.length, countBits);
        for (const b of payloadBytes) pushBits(b, 8);
        pushBits(0, Math.min(4, dataCapacity * 8 - bits.length));
        while (bits.length % 8 !== 0) bits.push(0);

        const dataWords = [];
        for (let i = 0; i < bits.length; i += 8) {
            let byteVal = 0;
            for (let j = 0; j < 8; j++) byteVal = (byteVal << 1) | bits[i + j];
            dataWords.push(byteVal);
        }
        let padToggle = 0;
        while (dataWords.length < dataCapacity) {
            dataWords.push(padToggle % 2 === 0 ? 0xEC : 0x11);
            padToggle++;
        }

        // 2. Reed-Solomon GF(256) hibajavító kódolás (0x11D polinom)
        const gfMultiply = (x, y) => {
            let z = 0;
            for (let i = 7; i >= 0; i--) {
                z = (z << 1) ^ ((z >>> 7) * 0x11D);
                z ^= ((y >>> i) & 1) * x;
            }
            return z;
        };

        const rsDivisor = (deg) => {
            const res = new Array(deg).fill(0);
            res[deg - 1] = 1;
            let root = 1;
            for (let i = 0; i < deg; i++) {
                for (let j = 0; j < deg; j++) {
                    res[j] = gfMultiply(res[j], root);
                    if (j + 1 < deg) res[j] ^= res[j + 1];
                }
                root = gfMultiply(root, 0x02);
            }
            return res;
        };

        const rsRemainder = (data, divisor) => {
            const rem = new Array(divisor.length).fill(0);
            for (const b of data) {
                const factor = b ^ rem.shift();
                rem.push(0);
                divisor.forEach((coef, idx) => {
                    rem[idx] ^= gfMultiply(coef, factor);
                });
            }
            return rem;
        };

        const divisor = rsDivisor(cfg.ecPerBlock);
        const blocksData = [];
        const blocksEc = [];
        let offset = 0;
        for (let i = 0; i < cfg.b1 + cfg.b2; i++) {
            const dLen = i < cfg.b1 ? cfg.d1 : cfg.d2;
            const block = dataWords.slice(offset, offset + dLen);
            offset += dLen;
            blocksData.push(block);
            blocksEc.push(rsRemainder(block, divisor));
        }

        const allCodewords = [];
        const maxDataLen = Math.max(cfg.d1, cfg.d2);
        for (let col = 0; col < maxDataLen; col++) {
            for (let b = 0; b < blocksData.length; b++) {
                if (col < blocksData[b].length) allCodewords.push(blocksData[b][col]);
            }
        }
        for (let col = 0; col < cfg.ecPerBlock; col++) {
            for (let b = 0; b < blocksEc.length; b++) {
                allCodewords.push(blocksEc[b][col]);
            }
        }

        // 3. Modul-mátrix felépítése
        const size = ver * 4 + 17;
        const modules = Array.from({ length: size }, () => new Array(size).fill(false));
        const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));

        const setFunc = (col, row, dark) => {
            if (col < 0 || col >= size || row < 0 || row >= size) return;
            modules[row][col] = !!dark;
            isFunc[row][col] = true;
        };

        const drawFinder = (cx, cy) => {
            for (let dy = -4; dy <= 4; dy++) {
                for (let dx = -4; dx <= 4; dx++) {
                    const dist = Math.max(Math.abs(dx), Math.abs(dy));
                    const xx = cx + dx, yy = cy + dy;
                    if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
                        setFunc(xx, yy, dist !== 2 && dist !== 4);
                    }
                }
            }
        };

        drawFinder(3, 3);
        drawFinder(size - 4, 3);
        drawFinder(3, size - 4);

        for (let i = 0; i < size; i++) {
            if (!isFunc[6][i]) setFunc(i, 6, i % 2 === 0);
            if (!isFunc[i][6]) setFunc(6, i, i % 2 === 0);
        }

        const alignPos = cfg.align;
        for (let i = 0; i < alignPos.length; i++) {
            for (let j = 0; j < alignPos.length; j++) {
                if ((i === 0 && j === 0) || (i === 0 && j === alignPos.length - 1) || (i === alignPos.length - 1 && j === 0)) continue;
                const cx = alignPos[i], cy = alignPos[j];
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        setFunc(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
                    }
                }
            }
        }

        const drawFormatBits = (mask) => {
            const data5 = (0b01 << 3) | mask; // ECC Level L = 01
            let rem = data5;
            for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            const fmtBits = ((data5 << 10) | rem) ^ 0x5412;
            const getBit = (idx) => ((fmtBits >>> idx) & 1) !== 0;

            for (let i = 0; i <= 5; i++) setFunc(8, i, getBit(i));
            setFunc(8, 7, getBit(6));
            setFunc(8, 8, getBit(7));
            setFunc(7, 8, getBit(8));
            for (let i = 9; i < 15; i++) setFunc(14 - i, 8, getBit(i));

            for (let i = 0; i < 8; i++) setFunc(size - 1 - i, 8, getBit(i));
            for (let i = 8; i < 15; i++) setFunc(8, size - 15 + i, getBit(i));
            setFunc(8, size - 8, true);
        };

        drawFormatBits(0);

        if (ver >= 7) {
            let rem = ver;
            for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
            const verBits = (ver << 12) | rem;
            for (let i = 0; i < 18; i++) {
                const bit = ((verBits >>> i) & 1) !== 0;
                const a = size - 11 + (i % 3);
                const b = Math.floor(i / 3);
                setFunc(a, b, bit);
                setFunc(b, a, bit);
            }
        }

        // 4. Zig-zag adatbitek elhelyezése
        let bitIdx = 0;
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const col = right - j;
                    const upward = ((right + 1) & 2) === 0;
                    const row = upward ? (size - 1 - vert) : vert;
                    if (!isFunc[row][col] && bitIdx < allCodewords.length * 8) {
                        const byteVal = allCodewords[bitIdx >>> 3];
                        modules[row][col] = ((byteVal >>> (7 - (bitIdx & 7))) & 1) !== 0;
                        bitIdx++;
                    }
                }
            }
        }

        // 5. Maszkolás (0-s maszk: sakktábla minta a maximális kontrasztért)
        const chosenMask = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!isFunc[r][c] && (r + c) % 2 === 0) {
                    modules[r][c] = !modules[r][c];
                }
            }
        }
        drawFormatBits(chosenMask);

        // 6. Tiszta SVG előállítása 4 modulos fehér csendes zónával (Quiet Zone)
        const quiet = 4;
        const totalMods = size + quiet * 2;
        let pathD = '';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (modules[r][c]) {
                    pathD += `M${c + quiet},${r + quiet}h1v1h-1z`;
                }
            }
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelMeret}" height="${pixelMeret}" style="max-width:100%;height:auto;" viewBox="0 0 ${totalMods} ${totalMods}" shape-rendering="crispEdges" role="img" aria-label="QR-kód">
            <rect width="100%" height="100%" fill="#FFFFFF"/>
            <path d="${pathD}" fill="#18181B"/>
        </svg>`;
    },

    // --- NYOMTATHATÓ A4 CSARNOK QR-PLAKÁT MODAL („MIKOR KÜZDÖK?” ÉS ÉLŐ KÖVETÉS) ---
    nyitQrPlakatModal: async function(versenyObj = null) {
        const aktUser = this.lekerBejelentkezes();
        if (!aktUser || !aktUser.role || String(aktUser.role).toUpperCase() !== 'ADMIN') {
            this.toast('A QR-kód plakát csak adminisztrátorok számára érhető el.', true);
            return;
        }

        let modal = document.getElementById('tmQrPosterModal');
        if (modal) modal.remove();

        const aktId = (versenyObj && versenyObj.id) ? versenyObj.id : this.lekerAktualisVersenyId();
        const cache = this.safeJsonParse('tatamiVersenyekCache', []);
        const vAdat = versenyObj || cache.find(v => v.id === aktId) || {
            id: aktId,
            name: this.lekerAktualisVersenyNev(),
            organizer: 'Shobu HSE',
            date: new Date().toISOString()
        };

        // Alap URL összeállítása az audience.html oldalhoz
        const utvonal = window.location.pathname;
        const basePath = utvonal.toLowerCase().includes('/views/')
            ? utvonal.substring(0, utvonal.toLowerCase().indexOf('/views/'))
            : utvonal.replace(/\/[^\/]*$/, '');
        let defaultHost = window.location.host || 'localhost';
        let lanIpLista = [];

        try {
            const netRes = await fetch(this.API_URL + '/LiveArena/network-info');
            if (netRes.ok) {
                const netInfo = await netRes.json();
                if (Array.isArray(netInfo.lanIps) && netInfo.lanIps.length > 0) {
                    lanIpLista = netInfo.lanIps;
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        const portPart = window.location.port ? (':' + window.location.port) : '';
                        defaultHost = lanIpLista[0] + portPart;
                    }
                }
            }
        } catch (e) {}

        const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const alapUrl = `${proto}//${defaultHost}${basePath}/views/audience.html?versenyId=${aktId}`;
        const datumSzoveg = vAdat.date ? new Date(vAdat.date).toLocaleDateString('hu-HU') : '-';

        if (!document.getElementById('tmQrPosterPrintStyle')) {
            const st = document.createElement('style');
            st.id = 'tmQrPosterPrintStyle';
            st.textContent = `
                @media print {
                    body.tm-printing-qr-poster > *:not(#tmQrPosterModal) { display: none !important; }
                    body.tm-printing-qr-poster { background: #FFFFFF !important; margin: 0 !important; padding: 0 !important; }
                    body.tm-printing-qr-poster #tmQrPosterModal {
                        position: static !important;
                        background: #FFFFFF !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        display: block !important;
                    }
                    body.tm-printing-qr-poster .tm-qr-no-print { display: none !important; }
                    body.tm-printing-qr-poster #tmQrPosterSheet {
                        box-shadow: none !important;
                        border: 3px solid #18181B !important;
                        max-width: 100% !important;
                        margin: 0 auto !important;
                        page-break-inside: avoid !important;
                    }
                }
            `;
            document.head.appendChild(st);
        }

        const ipGombokHtml = lanIpLista.length > 0
            ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;">
                <span style="font-size:0.78rem;font-weight:700;color:#52525B;">Felismert helyi Wi-Fi IP cím(ek):</span>
                ${lanIpLista.map(ip => {
                    const portPart = window.location.port ? (':' + window.location.port) : '';
                    const cel = `${proto}//${ip}${portPart}${basePath}/views/audience.html?versenyId=${aktId}`;
                    return `<button type="button" class="btn btn-outline" style="padding:3px 9px;font-size:0.76rem;" onclick="document.getElementById('tmQrUrlInput').value='${this.escapeHtml(cel)}';TatamiMaster.frissitQrPlakatElonezet();">${this.icon('wifi', 12)} ${this.escapeHtml(ip)}</button>`;
                }).join('')}
               </div>`
            : '';

        modal = document.createElement('div');
        modal.id = 'tmQrPosterModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.84);z-index:10010;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
        modal.innerHTML = `
            <div style="background:#FAF8F5;width:100%;max-width:740px;border-radius:14px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,0.5);border:2px solid #18181B;color:#18181B;">
                <div class="tm-qr-no-print" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid #E4E0D7;margin-bottom:14px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${this.icon('qr', 22)}
                        <div>
                            <strong style="font-size:1.12rem;display:block;">Nyomtatható A4 Csarnok QR-Plakát</strong>
                            <span style="font-size:0.82rem;color:#52525B;">Függeszd ki a bejáratnál, a lelátón és a melegítőteremben!</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button type="button" class="btn btn-outline-blue" onclick="TatamiMaster.letoltQrSvg()">
                            ${this.icon('save', 15)} QR-kód Letöltése (SVG)
                        </button>
                        <button type="button" class="btn btn-outline-green" onclick="TatamiMaster.nyomtatQrPlakat()">
                            ${this.icon('print', 15)} A4 Plakát Nyomtatása
                        </button>
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('tmQrPosterModal').remove()">
                            ${this.icon('x', 15)} Bezárás
                        </button>
                    </div>
                </div>

                <div class="tm-qr-no-print" style="background:#FFFFFF;border:1px solid #E4E0D7;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
                    <label for="tmQrUrlInput" style="font-size:0.82rem;font-weight:800;color:#18181B;display:block;margin-bottom:4px;">
                        QR-kód célcíme (URL – ha a telefonok helyi Wi-Fi-ről csatlakoznak, a gép helyi IP-címe szerepeljen a localhost helyett):
                    </label>
                    <input type="text" id="tmQrUrlInput" class="input-field" style="width:100%;font-weight:700;font-size:0.88rem;" value="${this.escapeHtml(alapUrl)}" oninput="TatamiMaster.frissitQrPlakatElonezet()">
                    ${ipGombokHtml}
                </div>

                <!-- NYOMTATHATÓ A4 PLAKÁT LAP -->
                <div id="tmQrPosterSheet" style="background:#FFFFFF;border:3px solid #18181B;border-radius:12px;padding:24px 16px;text-align:center;">
                    <div style="display:inline-flex;align-items:center;gap:10px;background:#18181B;color:#FAF8F5;padding:8px 16px;border-radius:8px;font-weight:800;letter-spacing:1px;font-size:0.85rem;margin-bottom:14px;max-width:100%;">
                        ${this.brandLogoSvg(24)}
                        <span>TATAMI MASTER&trade; &bull; ÉLŐ VERSENYKÖVETÉS</span>
                    </div>

                    <h1 style="margin:6px 0 8px 0;font-size:clamp(1.35rem, 4.5vw, 2rem);line-height:1.2;color:#18181B;text-transform:uppercase;letter-spacing:0.5px;">
                        ${this.escapeHtml(vAdat.name || 'Karate Bajnokság')}
                    </h1>
                    <div style="font-size:0.95rem;color:#52525B;font-weight:700;margin-bottom:20px;">
                        Dátum: ${this.escapeHtml(datumSzoveg)} &bull; Szervező: ${this.escapeHtml(vAdat.organizer || 'Shobu HSE')}
                    </div>

                    <div id="tmQrSvgBox" style="display:inline-block;padding:14px;border:3px solid #18181B;border-radius:14px;background:#FFFFFF;margin-bottom:16px;max-width:100%;">
                        ${this.generalQrSvg(alapUrl, 270)}
                    </div>

                    <div style="font-size:1.25rem;font-weight:800;color:#990000;letter-spacing:0.4px;margin-bottom:6px;text-transform:uppercase;">
                        Olvasd be a telefonod kamerájával!
                    </div>
                    <div id="tmQrUrlCaption" style="font-family:Consolas,monospace;font-size:0.82rem;color:#3F3F46;background:#FAF8F5;border:1px solid #E4E0D7;display:inline-block;padding:5px 12px;border-radius:6px;margin-bottom:20px;word-break:break-all;max-width:100%;">
                        ${this.escapeHtml(alapUrl)}
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 190px), 1fr));gap:12px;text-align:left;border-top:2px solid #E4E0D7;padding-top:18px;">
                        <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:8px;padding:12px;">
                            <strong style="display:flex;align-items:center;gap:6px;font-size:0.92rem;color:#18181B;margin-bottom:4px;">
                                ${this.icon('clock', 16)} 1. „Mikor küzdök?”
                            </strong>
                            <span style="font-size:0.82rem;color:#3F3F46;line-height:1.4;display:block;">
                                Írd be a versenyző vagy klub nevét, és lásd melyik tatamin, hanyadik meccsként, várhatóan hány perc múlva szólítanak!
                            </span>
                        </div>
                        <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:8px;padding:12px;">
                            <strong style="display:flex;align-items:center;gap:6px;font-size:0.92rem;color:#18181B;margin-bottom:4px;">
                                ${this.icon('monitor', 16)} 2. Élő Tatami Állás
                            </strong>
                            <span style="font-size:0.82rem;color:#3F3F46;line-height:1.4;display:block;">
                                Valós idejű óra, pontszámok, hosszabbítások és „Felkészül” szólítások minden tatamiról külön frissítés nélkül.
                            </span>
                        </div>
                        <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:8px;padding:12px;">
                            <strong style="display:flex;align-items:center;gap:6px;font-size:0.92rem;color:#18181B;margin-bottom:4px;">
                                ${this.icon('git-branch', 16)} 3. Ágrajz &amp; Ranglista
                            </strong>
                            <span style="font-size:0.82rem;color:#3F3F46;line-height:1.4;display:block;">
                                Élő Kumite ágrajzok, körmérkőzés-tabellák és 5-bírói Kata rangsorok közvetlenül a mobilodon.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    frissitQrPlakatElonezet: function() {
        const inp = document.getElementById('tmQrUrlInput');
        const svgBox = document.getElementById('tmQrSvgBox');
        const cap = document.getElementById('tmQrUrlCaption');
        if (!inp || !svgBox) return;
        const url = inp.value.trim() || window.location.href;
        svgBox.innerHTML = this.generalQrSvg(url, 270);
        if (cap) cap.innerText = url;
    },

    nyomtatQrPlakat: function() {
        document.body.classList.add('tm-printing-qr-poster');
        setTimeout(() => {
            window.print();
            setTimeout(() => document.body.classList.remove('tm-printing-qr-poster'), 400);
        }, 80);
    },

    letoltQrSvg: function() {
        const svgEl = document.querySelector('#tmQrSvgBox svg');
        if (!svgEl) return;
        const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TATAMI_MASTER_QR_Verseny_${this.lekerAktualisVersenyId()}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    injectDesignSystem: function() {
        const utvonal = window.location.pathname.toLowerCase();
        const isViews = utvonal.includes('/views/');
        const rootPrefix = isViews ? '../' : '';

        if (!document.getElementById('tmFaviconSvg')) {
            document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());

            const favSvg = document.createElement('link');
            favSvg.id = 'tmFaviconSvg';
            favSvg.rel = 'icon';
            favSvg.type = 'image/svg+xml';
            favSvg.href = rootPrefix + 'favicon.svg';
            document.head.appendChild(favSvg);

            const favShortcut = document.createElement('link');
            favShortcut.rel = 'shortcut icon';
            favShortcut.type = 'image/svg+xml';
            favShortcut.href = rootPrefix + 'favicon.svg';
            document.head.appendChild(favShortcut);
        }

        if (!document.querySelector('meta[name="copyright"]')) {
            const metaCopy = document.createElement('meta');
            metaCopy.name = 'copyright';
            metaCopy.content = '© 2026 TATAMI MASTER™ - Shobu HSE. Minden jog fenntartva (All Rights Reserved).';
            document.head.appendChild(metaCopy);

            const metaTm = document.createElement('meta');
            metaTm.name = 'application-name';
            metaTm.content = 'TATAMI MASTER™';
            document.head.appendChild(metaTm);
        }

        if (document.title && document.title.includes('Tatami Master') && !document.title.includes('™')) {
            document.title = document.title.replace('Tatami Master', 'TATAMI MASTER™');
        }

        if (utvonal.includes('tv_kijelzo.html') || utvonal.includes('obs_overlay.html')) return;

        if (!document.getElementById('tmDesignSystemCss')) {
            const prefix = isViews ? '../CSS/' : 'CSS/';
            const link = document.createElement('link');
            link.id = 'tmDesignSystemCss';
            link.rel = 'stylesheet';
            link.href = prefix + 'design_system.css?v=20261113_mobile3';
            document.head.appendChild(link);
        }

        const runBranding = () => this.injectBrandingAndLegal(rootPrefix);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runBranding);
        } else {
            runBranding();
        }
    },

    injectBrandingAndLegal: function(rootPrefix = '') {
        const headerH1 = document.querySelector('.top-header h1');
        if (headerH1) {
            const firstSvg = headerH1.querySelector('svg');
            if (firstSvg && !firstSvg.classList.contains('tm-brand-logo')) {
                const wrapper = document.createElement('span');
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                wrapper.innerHTML = this.brandLogoSvg(30);
                firstSvg.replaceWith(wrapper.firstElementChild);
            }
            const emEl = headerH1.querySelector('em');
            if (emEl && !emEl.innerHTML.includes('™')) {
                emEl.innerHTML = `TATAMI MASTER<sup class="tm-trademark" title="TATAMI MASTER™ – Védjegyoltalom alatt álló márkanév és logó">™</sup>`;
            }
        }

        const utvonal = window.location.pathname.toLowerCase();
        if (utvonal.includes('/views/') && !document.getElementById('adminAktivVersenyBar') && !document.getElementById('audienceVersenyBar') && !document.getElementById('tmSubpageVersenyBar')) {
            this.injectSubpageVersenyBar();
        }

        if (!document.getElementById('tmLegalFooter')) {
            const footer = document.createElement('footer');
            footer.id = 'tmLegalFooter';
            footer.className = 'tm-legal-footer';
            footer.innerHTML = `
                <div class="tm-legal-footer-brand">
                    ${this.brandLogoSvg(24)}
                    <div>
                        <div style="font-weight: 700; color: #18181B;">
                            &copy; 2026 TATAMI MASTER<sup style="font-size:0.7em;">&trade;</sup> &bull; Shobu HSE Kyokushin Karate Versenyrendszer. Minden jog fenntartva.
                        </div>
                        <div style="font-size: 0.74rem; color: #71717A;">
                            A „TATAMI MASTER&trade;” név, a Kanku-Tatami Oktogon embléma és a szoftveres felület védjegyoltalom (&trade;) és szerzői jogi védelem (&copy;) alatt áll (1999. évi LXXVI. tv. &amp; 1997. évi XI. tv.).
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <a href="${rootPrefix}logo.svg" download="TATAMI_MASTER_Official_Logo.svg" class="tm-legal-badge-btn" style="text-decoration:none;">
                        ${this.icon('image', 13)}
                        <span>Hivatalos Logó (SVG)</span>
                    </a>
                    <button type="button" class="tm-legal-badge-btn" onclick="TatamiMaster.mutatVedjegyNyilatkozat('${rootPrefix}')">
                        ${this.icon('shield-check', 14)}
                        <span>Védjegy &amp; Oltalmi Adatlap (&trade; / &copy;)</span>
                    </button>
                </div>
            `;
            document.body.appendChild(footer);
        }
    },

    injectSubpageVersenyBar: async function() {
        const container = document.querySelector('main.admin-container') || document.querySelector('main');
        if (!container || document.getElementById('tmSubpageVersenyBar')) return;

        const bar = document.createElement('div');
        bar.id = 'tmSubpageVersenyBar';
        bar.className = 'pro-card';
        bar.style.cssText = 'padding:12px 18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border:1.5px solid #18181B;background:#FFFFFF;';
        bar.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <span style="background:#18181B;color:#FAF8F5;padding:4px 10px;border-radius:6px;font-weight:700;font-size:0.78rem;display:inline-flex;align-items:center;gap:6px;">
                    ${this.icon('trophy', 14)} AKTÍV VERSENY
                </span>
                <strong id="tmSubpageVersenyNev" style="font-size:1.02rem;color:#18181B;">${this.escapeHtml(this.lekerAktualisVersenyNev())}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <label for="tmSubpageVersenySelect" style="font-size:0.84rem;font-weight:700;color:#52525B;">Verseny váltása:</label>
                <select id="tmSubpageVersenySelect" class="input-field" style="min-width:240px;padding:6px 12px;font-weight:700;" onchange="TatamiMaster.valtsSubpageVersenyt(this.value)"></select>
            </div>
        `;
        container.insertBefore(bar, container.firstChild);

        try {
            const versenyek = await this.apiGet('Tournaments');
            const sel = document.getElementById('tmSubpageVersenySelect');
            const nevEl = document.getElementById('tmSubpageVersenyNev');
            const aktId = this.lekerAktualisVersenyId();
            if (sel && Array.isArray(versenyek)) {
                sel.innerHTML = versenyek.map(v =>
                    `<option value="${v.id}" ${v.id === aktId ? 'selected' : ''}>#${v.id} – ${this.escapeHtml(v.name)} (${this.escapeHtml(v.status || 'ÉLŐ')})</option>`
                ).join('');
            }
            const aktObj = Array.isArray(versenyek) ? versenyek.find(v => v.id === aktId) : null;
            if (aktObj && nevEl) {
                nevEl.innerText = aktObj.name;
            }
        } catch (e) {}
    },

    valtsSubpageVersenyt: function(versenyId) {
        const numId = parseInt(versenyId);
        if (!numId) return;
        const cache = this.safeJsonParse('tatamiVersenyekCache', []);
        const v = cache.find(x => x.id === numId);
        this.mentAktualisVerseny(numId, v ? v.name : '', true);
        window.location.reload();
    },

    mutatVedjegyNyilatkozat: function(rootPrefix = '') {
        let modal = document.getElementById('tmTrademarkModal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'tmTrademarkModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.82);z-index:10005;display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto;';
        modal.innerHTML = `
            <div style="background:#FFFFFF;width:100%;max-width:680px;border-radius:14px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.45);border:1.5px solid #18181B;color:#18181B;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid #E4E0D7;margin-bottom:18px;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        ${this.brandLogoSvg(52)}
                        <div>
                            <div style="font-size:0.75rem;font-weight:800;color:#52525B;letter-spacing:0.8px;text-transform:uppercase;">Szellemi Tulajdon &amp; Védjegyoltalmi Dokumentáció</div>
                            <h2 style="margin:2px 0 0 0;font-size:1.4rem;">TATAMI MASTER<sup style="font-size:0.6em;">&trade;</sup> Hivatalos Védjegy Adatlap</h2>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline" style="padding:6px 12px;" onclick="document.getElementById('tmTrademarkModal').remove()">
                        ${this.icon('x', 16)} Bezárás
                    </button>
                </div>

                <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:10px;padding:16px;margin-bottom:16px;font-size:0.88rem;line-height:1.55;">
                    <div style="font-weight:800;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                        ${this.icon('shield-check', 16)}
                        <span>1. Védjegyjogi Státusz és Jelöléshasználat (&trade; vs. &reg;)</span>
                    </div>
                    <p style="margin:0;color:#3F3F46;">
                        A <strong>TATAMI MASTER&trade;</strong> kombinált (szó- és ábrás) megjelölés jelenleg a <strong>&trade; (Trademark)</strong> jelölést viseli, amely a védjegybejelentés és a lajstromozási eljárás alatt álló, kereskedelmi és szakmai forgalomban használt egyedi megjelölések hivatalos nemzetközi figyelmeztető jelzése. A Szellemi Tulajdon Nemzeti Hivatala (SZTNH) vagy az EUIPO általi végleges lajstromozási okirat kiállítását követően a jelölés <strong>&reg; (Registered Trademark)</strong> szimbólumra váltható.
                    </p>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:14px;margin-bottom:16px;font-size:0.86rem;">
                    <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:10px;padding:14px;">
                        <strong style="display:block;margin-bottom:6px;">2. Ábrás elem (Logó) grafikai leírása:</strong>
                        <div style="color:#3F3F46;line-height:1.5;">
                            • <strong>Forma:</strong> Szabályos nyolcszögletű (oktogon) tatami-küzdőtér pajzs dupla belső szegélyvonallal.<br>
                            • <strong>Központi motívum:</strong> Kyokushin Kanku rombusz-csúcs a felső csúcsban nap-maggal, belsejében geometriai Torii-kaput és fekete övet (Obi) formázó <strong>„TM”</strong> monogrammal.<br>
                            • <strong>Színkódok:</strong> Obszidián fekete (<code>#18181B</code>) és Krémfehér (<code>#FAF8F5</code>).<br>
                            • <strong>Tipográfia:</strong> <code>Bahnschrift</code> geometriai betűtípus.
                        </div>
                    </div>
                    <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:10px;padding:14px;">
                        <strong style="display:block;margin-bottom:6px;">3. Nizzai Osztályozás (SZTNH bejelentéshez):</strong>
                        <div style="color:#3F3F46;line-height:1.5;">
                            • <strong>9. osztály:</strong> Szoftverek és webalkalmazások küzdősport- és karateversenyek lebonyolítására, bírói pontozásra, ágrajz-sorsolásra.<br>
                            • <strong>41. osztály:</strong> Sportversenyek, harcművészeti bajnokságok szervezése, lebonyolítása és élő eredményközlés.<br>
                            • <strong>42. osztály:</strong> Sportinformatikai szoftverfejlesztés és felhőalapú versenyrendszer-szolgáltatás (SaaS).
                        </div>
                    </div>
                </div>

                <div style="background:#FAF8F5;border:1px solid #E4E0D7;border-radius:10px;padding:14px;margin-bottom:18px;font-size:0.84rem;color:#3F3F46;line-height:1.5;">
                    <strong style="color:#18181B;display:block;margin-bottom:4px;">4. Szerzői Jogi Védelem (Copyright &copy; 2026):</strong>
                    A szoftver forráskódja, adatbázis-struktúrája, sorsolási algoritmusa, valamint a <strong>TATAMI MASTER&trade;</strong> vektoros grafikai embléma a szerzői jogról szóló <strong>1999. évi LXXVI. törvény (Szjt.)</strong> alapján a létrejöttével automatikusan szerzői jogi védelem alatt áll. Engedély nélküli másolása, módosítása vagy jogosulatlan felhasználása tilos.
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <a href="${rootPrefix}logo.svg" download="TATAMI_MASTER_Official_Logo.svg" class="btn btn-outline-blue" style="text-decoration:none;">
                        ${this.icon('image', 15)}
                        <span>Vektoros Logó Letöltése Védjegybejelentéshez (SVG)</span>
                    </a>
                    <button type="button" class="btn btn-outline-green" onclick="window.print()">
                        ${this.icon('print', 15)}
                        <span>Adatlap Nyomtatása</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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

    toast: function(uzenet, tipus = 'siker') {
        let cont = document.getElementById('tmToastContainer');
        if (!cont) {
            cont = document.createElement('div');
            cont.id = 'tmToastContainer';
            document.body.appendChild(cont);
        }
        const lower = String(uzenet).toLowerCase();
        if (lower.includes('hiba') || lower.includes('nem ') || lower.includes('sikaku') || lower.includes('lezárva') || lower.includes('lezárult')) tipus = 'hiba';
        else if (lower.includes('figyelem') || lower.includes('kérlek') || lower.includes('válassz') || lower.includes('add meg')) tipus = 'figyelem';

        const iconName = tipus === 'hiba' ? 'x' : (tipus === 'figyelem' ? 'alert' : 'check');
        const item = document.createElement('div');
        item.className = 'tm-toast ' + tipus;
        item.innerHTML = `<span style="display:flex;align-items:center;gap:10px;">${this.icon(iconName, 17)}<span>${this.escapeHtml(uzenet)}</span></span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:inherit;opacity:0.7;display:flex;align-items:center;padding:2px;">${this.icon('x', 15)}</button>`;
        cont.appendChild(item);

        setTimeout(() => { if (item.parentElement) item.remove(); }, 4200);
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

    apiGet: async function(vegpont, opciok = null) {
        try {
            const res = await fetch(this.API_URL + '/' + vegpont);
            if (!res.ok) {
                console.warn(`API GET hiba (${vegpont}): HTTP ${res.status}`);
                return [];
            }
            const text = await res.text();
            const adatok = text ? JSON.parse(text) : [];
            if (!Array.isArray(adatok)) return adatok;

            const alapVegpont = vegpont.split('/')[0];

            if (alapVegpont === 'Tournaments') {
                try {
                    localStorage.setItem('tatamiVersenyekCache', JSON.stringify(adatok));
                } catch (e) {}

                if (adatok.length > 0) {
                    const map = this.lekerVersenyAdatMap();
                    const legkisebbId = Math.min(...adatok.map(v => v.id));
                    if (!map.alapVersenyId || !adatok.some(v => v.id === map.alapVersenyId)) {
                        map.alapVersenyId = legkisebbId;
                        this.mentVersenyAdatMap(map);
                    }

                    const autoVerseny = this.keresLegaktualisabbVerseny(adatok) || adatok[0];
                    const isAuto = this.isAutomatikusVersenyMod();

                    if (isAuto) {
                        this.mentAktualisVerseny(autoVerseny.id, autoVerseny.name, false);
                    } else {
                        const aktId = this.lekerAktualisVersenyId();
                        const aktVerseny = adatok.find(v => v.id === aktId);
                        if (!aktVerseny) {
                            this.valasztdAutoAktualisVersenyt(adatok);
                        } else if (aktVerseny.name) {
                            localStorage.setItem('aktualisVersenyNev', aktVerseny.name);
                        }
                    }
                }
                return adatok;
            }

            if (opciok && opciok.mindenVerseny === true) {
                return adatok;
            }

            const aktVersenyId = (opciok && opciok.versenyId)
                ? parseInt(opciok.versenyId)
                : this.lekerAktualisVersenyId();

            const map = this.lekerVersenyAdatMap();
            const alapId = map.alapVersenyId || 1;

            if (alapVegpont === 'Competitors' || alapVegpont === 'Categories' || alapVegpont === 'Tatamis') {
                let valtozott = false;
                if (!map[alapVegpont]) map[alapVegpont] = {};
                for (let elem of adatok) {
                    if (elem && elem.id !== undefined && map[alapVegpont][String(elem.id)] === undefined) {
                        map[alapVegpont][String(elem.id)] = alapId;
                        valtozott = true;
                    }
                }
                if (valtozott) this.mentVersenyAdatMap(map);

                return adatok.filter(elem => {
                    const elemVersenyId = parseInt(map[alapVegpont][String(elem.id)]) || alapId;
                    return elemVersenyId === aktVersenyId;
                });
            }

            if (alapVegpont === 'Registrations') {
                return adatok.filter(reg => {
                    if (map.Registrations && map.Registrations[String(reg.id)] !== undefined) {
                        return parseInt(map.Registrations[String(reg.id)]) === aktVersenyId;
                    }
                    const compVersenyId = this.lekerEntitasVersenyId('Competitors', reg.competitorId, alapId);
                    const catVersenyId = this.lekerEntitasVersenyId('Categories', reg.categoryId, alapId);
                    return compVersenyId === aktVersenyId && catVersenyId === aktVersenyId;
                });
            }

            if (alapVegpont === 'Matches') {
                return adatok.filter(meccs => {
                    if (map.Matches && map.Matches[String(meccs.id)] !== undefined) {
                        return parseInt(map.Matches[String(meccs.id)]) === aktVersenyId;
                    }
                    const catVersenyId = this.lekerEntitasVersenyId('Categories', meccs.categoryId, alapId);
                    const tatVersenyId = this.lekerEntitasVersenyId('Tatamis', meccs.tatamiId, alapId);
                    return catVersenyId === aktVersenyId || tatVersenyId === aktVersenyId;
                });
            }

            return adatok;
        } catch (err) {
            console.error(`Hálózati hiba (${vegpont}):`, err);
            return [];
        }
    },

    apiSend: async function(vegpont, method, adat, opciok = null) {
        try {
            const tisztaAdat = adat ? this.sanitizePayload(adat) : null;
            const res = await fetch(this.API_URL + '/' + vegpont, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: tisztaAdat ? JSON.stringify(tisztaAdat) : null
            });
            const alapVegpont = vegpont.split('/')[0];

            if (method === 'DELETE' && ['Competitors', 'Categories', 'Tatamis', 'Registrations', 'Matches'].includes(alapVegpont) && (res.ok || res.status === 404)) {
                const reszek = vegpont.split('/');
                const toroltId = parseInt(reszek[1]);
                if (!isNaN(toroltId)) {
                    const map = this.lekerVersenyAdatMap();
                    if (map[alapVegpont] && map[alapVegpont][String(toroltId)] !== undefined) {
                        delete map[alapVegpont][String(toroltId)];
                        this.mentVersenyAdatMap(map);
                    }
                }
            }

            if (!res.ok) {
                if (!(method === 'DELETE' && res.status === 404 && opciok && opciok.csendes404)) {
                    this.toast(`Szerver hiba (${method} ${vegpont}): HTTP ${res.status}`, 'hiba');
                }
                return res;
            }

            if (vegpont === 'Tournaments/reset-seed') {
                localStorage.removeItem('tatamiVersenyAdatMap');
                localStorage.removeItem('kataEredmenyek');
                localStorage.removeItem('kataDontoMeccsIdk');
                localStorage.removeItem('kumiteReszletek');
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('tatamiNevezesLezarva_') || k.startsWith('tatamiAdatok')) {
                        localStorage.removeItem(k);
                    }
                });
                this.mentAktualisVerseny(1, 'Shobu HSE Országos Bajnokság 2026');
                return res;
            }

            if (method === 'POST' && ['Competitors', 'Categories', 'Tatamis', 'Registrations', 'Matches'].includes(alapVegpont)) {
                try {
                    const klon = res.clone();
                    const letrejott = await klon.json();
                    if (letrejott && letrejott.id !== undefined) {
                        const celVersenyId = (opciok && opciok.versenyId)
                            ? parseInt(opciok.versenyId)
                            : this.lekerAktualisVersenyId();
                        this.hozzarendelEntitasVersenyhez(alapVegpont, letrejott.id, celVersenyId);
                    }
                } catch (e) {}
            }

            return res;
        } catch (err) {
            this.toast(`Hálózati hiba! Ellenőrizd, hogy fut-e a C# szerver.`, 'hiba');
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
        window.location.href = isViews ? 'audience.html' : 'views/audience.html';
    },

    ellenorizJogosultsag: function() {
        const utvonal = window.location.pathname.toLowerCase();
        const user = this.lekerBejelentkezes();

        if (utvonal.includes('admin.html') || utvonal.includes('kategoriak.html') || utvonal.includes('kiemeles.html')) {
            if (!user || user.role.toUpperCase() !== 'ADMIN') {
                window.location.href = '../index.html?login=1';
            }
        } else if (utvonal.includes('biroi_panel.html')) {
            if (!user || (user.role.toUpperCase() !== 'ADMIN' && user.role.toUpperCase() !== 'JUDGE' && user.role.toUpperCase() !== 'BIRO')) {
                window.location.href = '../index.html?login=1';
            }
        }
    },

    mentVersenyMelleklet: function(versenyNev, plakatBase64, kiirasBase64, kiirasFajlNev) {
        let tarolo = this.safeJsonParse('versenyMellekletek', {});
        tarolo[versenyNev] = {
            plakat: plakatBase64 || null,
            kiiras: kiirasBase64 || null,
            kiirasNev: kiirasFajlNev || 'Versenykiiras.pdf'
        };
        try {
            localStorage.setItem('versenyMellekletek', JSON.stringify(tarolo));
        } catch (e) {
            this.toast("A csatolt fájl mérete túl nagy a böngésző tárolójához!", "figyelem");
        }
    },

    lekerVersenyMellekletek: function() {
        return this.safeJsonParse('versenyMellekletek', {});
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

    // Övfokozat szövegből (pl. "4. kyu", "1. dan") numerikus kyu-szám (Dan = 0)
    parseKyuSzam: function(beltStr) {
        if (!beltStr) return 10;
        const s = String(beltStr).toLowerCase().trim();
        if (s.includes('dan')) return 0;
        const szam = parseInt(s.replace(/[^0-9]/g, ''), 10);
        return isNaN(szam) ? 10 : szam;
    },

    // Közös 5 bírás Kata ranglista és döntős táblázat HTML (Admin 6. menü és Nézői nézet számára)
    epitsKataRanglistaHtml: function(katMeccsek, versenyzok, kataTarolo = null) {
        const tarolo = kataTarolo || this.lekerKataEredmenyek();
        const selejtezo = katMeccsek.filter(m => !this.isKataDontoMeccs(m.id));
        const donto = katMeccsek.filter(m => this.isKataDontoMeccs(m.id));

        const epitsTabla = (meccsTomb, cim, ikonNev, isSelejtezoTabla) => {
            const lista = meccsTomb.map(m => {
                const v = versenyzok.find(x => x.id === m.competitor1Id);
                const er = tarolo[m.id] || {
                    kesz: false, osszeg: 0, minErtek: 0, maxErtek: 0, vezetoBiro: 0,
                    pontok: ['-', '-', '-', '-', '-'], minIdx: -1, maxIdx: -1
                };
                return { meccs: m, versenyzo: v, ...er };
            });

            const lepontozottak = lista.filter(x => x.kesz).sort(this.kataSorrendHasonlito);
            const varakozok = lista.filter(x => !x.kesz);
            const teljesSorrend = lepontozottak.concat(varakozok);

            let tHtml = `<h3 style="margin-top: 22px; margin-bottom: 10px; color: #18181B; display:flex; align-items:center; gap:8px;">${this.icon(ikonNev, 18)}<span>${cim}</span></h3>`;
            tHtml += '<div style="overflow-x: auto;"><table class="data-table">';
            tHtml += '<tr><th>Helyezés</th><th>Versenyző / Csapat</th><th>B1 (Vezető)</th><th>B2</th><th>B3</th><th>B4</th><th>B5</th><th>Min (Kieső)</th><th>Max (Kieső)</th><th>ÖSSZPONTSZÁM</th><th>Státusz</th></tr>';

            for (let i = 0; i < teljesSorrend.length; i++) {
                const item = teljesSorrend[i];
                const vNev = item.versenyzo
                    ? `<strong>${this.escapeHtml(item.versenyzo.name)}</strong> <small style="color:#52525B;">(${this.escapeHtml(item.versenyzo.club || '')}${item.versenyzo.belt ? ' - ' + this.escapeHtml(item.versenyzo.belt) : ''})</small>`
                    : '-';

                let ujrakatazas = false;
                if (item.kesz) {
                    if (i > 0 && teljesSorrend[i - 1].kesz && this.kataSorrendHasonlito(item, teljesSorrend[i - 1]) === 0) ujrakatazas = true;
                    if (i < teljesSorrend.length - 1 && teljesSorrend[i + 1].kesz && this.kataSorrendHasonlito(item, teljesSorrend[i + 1]) === 0) ujrakatazas = true;
                }

                const top6Jeloles = (isSelejtezoTabla && item.kesz && i < 6);
                const eremJel = (!isSelejtezoTabla && item.kesz && i < 3)
                    ? `${this.icon('medal', 15)} ${i + 1}.`
                    : (item.kesz ? (i + 1) + '.' : '-');
                const sorStilus = (top6Jeloles || (!isSelejtezoTabla && item.kesz && i < 3)) ? 'background-color: #FAF8F5;' : '';

                tHtml += `<tr style="${sorStilus}">`;
                tHtml += `<td><strong>${eremJel}</strong></td>`;
                tHtml += `<td>${vNev}${top6Jeloles ? ' <span style="background:#18181B;color:#FAF8F5;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;">TOP 6 DÖNTŐS</span>' : ''}</td>`;

                for (let b = 0; b < 5; b++) {
                    const p = (item.pontok && item.pontok[b] !== undefined && item.pontok[b] !== null) ? item.pontok[b] : '-';
                    const st = (b === item.minIdx || b === item.maxIdx) ? 'text-decoration: line-through; color: #A1A1AA;' : 'font-weight: 700; color: #18181B;';
                    tHtml += `<td style="${st}">${p}</td>`;
                }

                tHtml += `<td style="color: #71717A;">${item.kesz ? Number(item.minErtek).toFixed(1) : '-'}</td>`;
                tHtml += `<td style="color: #71717A;">${item.kesz ? Number(item.maxErtek).toFixed(1) : '-'}</td>`;
                tHtml += `<td style="font-size: 1.2rem; font-weight: 800; color: #18181B;">${item.kesz ? Number(item.osszeg).toFixed(1) : '-'}</td>`;
                tHtml += `<td>${ujrakatazas
                    ? `<span style="background:#990000;color:white;padding:3px 8px;border-radius:4px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${this.icon('alert', 13)} ÚJRAKATÁZÁS!</span>`
                    : (item.kesz
                        ? `<span style="color:#18181B;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${this.icon('check', 14)} Értékelve</span>`
                        : `<span style="color:#52525B;display:inline-flex;align-items:center;gap:4px;">${this.icon('clock', 13)} Rajtszám: #${item.meccs.matchOrder}</span>`)}</td>`;
                tHtml += '</tr>';
            }
            tHtml += '</table></div>';
            return tHtml;
        };

        let html = `<p style="font-size: 0.86rem; color: #52525B; margin-top: 12px; display:flex; align-items:center; gap:6px;">${this.icon('info', 15)} <em>Kata szabály: Az 5 bírói pontszámból a legmagasabb és a legalacsonyabb kiesik, a középső 3 összege adja a pontszámot. A selejtező legjobb 6 versenyzője (Top 6) a döntőben 0 pontról indulva újra katázik!</em></p>`;
        if (donto.length > 0) {
            html += epitsTabla(donto, '2. Kör: TOP 6 DÖNTŐ (Éremcsata - 0 pontról)', 'trophy', false);
        }
        if (selejtezo.length > 0) {
            html += epitsTabla(selejtezo, '1. Kör: Selejtező Ranglista', 'clipboard', true);
        }
        return html;
    },

    mentKataEredmeny: function(matchId, competitorId, ertekeles) {
        let tarolo = this.safeJsonParse('kataEredmenyek', {});
        const rekord = { matchId: matchId, competitorId: competitorId, ...ertekeles };
        tarolo[matchId] = rekord;
        localStorage.setItem('kataEredmenyek', JSON.stringify(tarolo));
        const delta = {};
        delta[String(matchId)] = rekord;
        this.kuldesLiveMegosztottAllapot('kataEredmenyek', delta, true);
    },

    lekerKataEredmenyek: function() { return this.safeJsonParse('kataEredmenyek', {}); },

    megjelolKataDontoMeccsek: function(matchIdTomb) {
        let eddigiek = this.safeJsonParse('kataDontoMeccsIdk', []);
        for (let id of matchIdTomb) { if (!eddigiek.includes(id)) eddigiek.push(id); }
        localStorage.setItem('kataDontoMeccsIdk', JSON.stringify(eddigiek));
        this.kuldesLiveMegosztottAllapot('kataDontoMeccsIdk', eddigiek, false);
    },

    isKataDontoMeccs: function(matchId) {
        return this.safeJsonParse('kataDontoMeccsIdk', []).includes(matchId);
    },

    mentKumiteReszletek: function(matchId, adatok) {
        let tarolo = this.safeJsonParse('kumiteReszletek', {});
        tarolo[matchId] = adatok;
        localStorage.setItem('kumiteReszletek', JSON.stringify(tarolo));
        const delta = {};
        delta[String(matchId)] = adatok;
        this.kuldesLiveMegosztottAllapot('kumiteReszletek', delta, true);
    },

    lekerKumiteReszletek: function() { return this.safeJsonParse('kumiteReszletek', {}); }
};

window.TatamiMaster = TatamiMaster;
TatamiMaster.initVersenyKontextus();
TatamiMaster.injectDesignSystem();
TatamiMaster.ellenorizJogosultsag();
TatamiMaster.initLiveSync();
window.alert = function(msg) { TatamiMaster.toast(msg); };
