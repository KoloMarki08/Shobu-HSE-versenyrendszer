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
        'pin': '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
        'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
        'chevron-up': '<polyline points="18 15 12 9 6 15"/>',
        'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        'bolt': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'clipboard': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
        'circle': '<circle cx="12" cy="12" r="8"/>',
        'circle-dot': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>'
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

    // Intelligens algoritmus: automatikusan kiválasztja az éppen aktuális versenyt
    // (1. ÉLŐ / NYITVA vagy NEVEZÉS ALATT státusz előnyben a LEZÁRULT-tal szemben,
    //  2. Mai napi verseny > Közelgő jövőbeli verseny > Legutóbbi múltbeli verseny,
    //  3. Mai naphoz időben legközelebb eső dátum,
    //  4. Azonos dátum esetén a legutóbb létrehozott verseny)
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
                idoKategoria = 3; // Mai (vagy tegnapi/holnapi) élő verseny
            } else if (kulonbsegNap > 1) {
                idoKategoria = 2; // Közelgő jövőbeli verseny
            } else {
                idoKategoria = 1; // Már múltbeli dátumú verseny
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

    // --- NEVEZÉS LEZÁRÁSA / MEGNYITÁSA ÁLLAPOTKEZELŐ (VERSENYENKÉNT SZEPARÁLVA) ---
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
    },

    // --- KYOKUSHIN KUMITE FORMÁTUM SZABÁLY (<= 5 FŐ: KÖRMÉRKŐZÉS, > 5 FŐ: EGYENES KIESÉS) ---
    isKumiteKormeccsLetszam: function(indulokSzama) {
        return (parseInt(indulokSzama) || 0) <= 5;
    },

    isKumiteAgrajz: function(katMeccsek) {
        if (!Array.isArray(katMeccsek) || katMeccsek.length === 0) return false;
        const n = katMeccsek.length;
        // 5 főig (2..5 fő) körmérkőzés van: meccsszámok = 1 (2 fő), 3 (3 fő), 6 (4 fő), 10 (5 fő).
        // 6 főtől egyenes kieséses ágrajz van: meccsszámok = 7 (8-as tábla), 15 (16-os tábla), 31 (32-es tábla), 63 (64-es tábla).
        return (n === 7 || n === 15 || n === 31 || n === 63);
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

    injectDesignSystem: function() {
        const utvonal = window.location.pathname.toLowerCase();
        const isViews = utvonal.includes('/views/');
        const rootPrefix = isViews ? '../' : '';

        // 1. Böngészőfül ikon (Favicon) és védjegy meta-adatok beállítása MINDEN oldalon (felülírja a XAMPP ikont!)
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
            link.href = prefix + 'design_system.css';
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
        // 1. Felső fejléc (.top-header h1) logójának és TATAMI MASTER™ védjegyjelölésének egységesítése
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

        // 2. Aloldalakon (Bírói panel, Kyu-bontó, Mérlegelő, Eredmények stb.) aktív verseny-választó sáv beszúrása
        const utvonal = window.location.pathname.toLowerCase();
        if (utvonal.includes('/views/') && !document.getElementById('adminAktivVersenyBar') && !document.getElementById('audienceVersenyBar') && !document.getElementById('tmSubpageVersenyBar')) {
            this.injectSubpageVersenyBar();
        }

        // 3. Hivatalos Védjegy- és Szerzői Jogi Lábjegyzet (.tm-legal-footer) elhelyezése
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

    // Tiszta, gyors GET lekérdezés versenyenkénti (Multi-Tournament) adatszeparációval
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

            // 1. Ha a Versenyeket (Tournaments) kérdezzük le, frissítjük a gyorsítótárat és AUTOMATIKUSAN kiválasztjuk az éppen aktuális versenyt
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

            // 2. Ha minden verseny összesített adatait kérte a hívó (mindenVerseny: true), szűrés nélkül adjuk vissza
            if (opciok && opciok.mindenVerseny === true) {
                return adatok;
            }

            // 3. Versenyhez tartozó entitások szűrése az aktuálisan kiválasztott versenyre (aktualisVersenyId)
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

    // Tiszta POST / PUT / DELETE küldés XSS szűréssel + automatikus versenyhez rendeléssel
    apiSend: async function(vegpont, method, adat, opciok = null) {
        try {
            const tisztaAdat = adat ? this.sanitizePayload(adat) : null;
            const res = await fetch(this.API_URL + '/' + vegpont, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: tisztaAdat ? JSON.stringify(tisztaAdat) : null
            });
            const alapVegpont = vegpont.split('/')[0];

            // Tétel törlésekor (DELETE) eltávolítjuk a verseny-entitás térképből is (akkor is, ha már korábban törlődött: 404)
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

            // Reset-seed esetén visszaállítjuk a verseny-entitás térképet az alap (ID=1) versenyre
            if (vegpont === 'Tournaments/reset-seed') {
                localStorage.removeItem('tatamiVersenyAdatMap');
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('tatamiNevezesLezarva_')) localStorage.removeItem(k);
                });
                this.mentAktualisVerseny(1, 'Shobu HSE Országos Bajnokság 2026');
                return res;
            }

            // Új tétel (POST) létrehozásakor automatikusan hozzárendeljük az aktuális (vagy megadott) versenyhez
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

TatamiMaster.initVersenyKontextus();
TatamiMaster.injectDesignSystem();
TatamiMaster.ellenorizJogosultsag();
window.alert = function(msg) { TatamiMaster.toast(msg); };
