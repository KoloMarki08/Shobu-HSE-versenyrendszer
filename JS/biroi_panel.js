let aktualisMod = 'KUMITE';
let akaPont = 0, shiroPont = 0;
let akaBuntetes = 0, shiroBuntetes = 0;
let idoMasodpercben = 120;
let idozitoInterval = null;

let kumiteHistory = { aka: [], shiro: [] };

// Korcsoporthoz igazított Kyokushin küzdőidő és hosszabbítás állapot
let aktivIdoSzabaly = TatamiMaster.KUMITE_IDO_SZABALYOK['FELNOTT'];
let aktivFazisIndex = 0;
let gongHangBekapcsolva = localStorage.getItem('tatamiGongHang') !== 'false';

let panelVersenyzok = [];
let panelKategoriak = [];
let panelTatamik = [];
let panelMeccsek = [];
let aktualisMeccs = null;
let kovetkezoMeccsSzoveg = "Várakozás a következő mérkőzésre...";
let mentesFolyamatban = false;

window.onload = async function() {
    frissitGongGombUI();
    initKataGyorsBillentyuzet();
    await biroiAdatokFrissitese();
    frissitKumiteFazisUI();
    adatokMentese();

    // Ha az Admin egy másik gépen új sorsolást készít vagy meccset módosít, és épp nem fut az óra, frissítjük a listát
    TatamiMaster.on('liveAdatValtozott', async () => {
        if (!idozitoInterval && !mentesFolyamatban) {
            await biroiAdatokFrissitese(true);
        }
    });
};

function toggleGongHang() {
    gongHangBekapcsolva = !gongHangBekapcsolva;
    localStorage.setItem('tatamiGongHang', gongHangBekapcsolva ? 'true' : 'false');
    frissitGongGombUI();
    if (gongHangBekapcsolva) {
        TatamiMaster.lejatszGongHang('figyelmeztetes');
        TatamiMaster.toast("Tatami hangjelzés bekapcsolva (15 mp figyelmeztetés + 0:00 gong).");
    } else {
        TatamiMaster.toast("Tatami hangjelzés némítva.", "figyelem");
    }
}

function frissitGongGombUI() {
    const btn = document.getElementById('btnGongHangToggle');
    if (!btn) return;
    btn.innerHTML = gongHangBekapcsolva
        ? `${TatamiMaster.icon('volume', 16)} <span>Hangjelzés: BE</span>`
        : `${TatamiMaster.icon('volume-x', 16)} <span>Hangjelzés: NÉMA</span>`;
    btn.style.borderColor = gongHangBekapcsolva ? '#18181B' : '#CFC9BC';
}

function initKataGyorsBillentyuzet() {
    const mezok = document.querySelectorAll('.kata-pont');
    mezok.forEach((input, idx) => {
        input.addEventListener('focus', function() { this.select(); });
        input.addEventListener('input', function() {
            let val = this.value.replace(',', '.');
            if (/^\d{2}$/.test(val)) {
                let szam = parseInt(val, 10);
                if (szam > 10) {
                    this.value = (szam / 10).toFixed(1);
                    kataPontSzamitas();
                    if (idx + 1 < mezok.length) {
                        mezok[idx + 1].focus();
                        mezok[idx + 1].select();
                    }
                }
            }
        });
    });
}

async function biroiAdatokFrissitese(megtartAktualisMeccs = false) {
    try {
        const [v, k, t, m] = await Promise.all([
            TatamiMaster.apiGet('Competitors'),
            TatamiMaster.apiGet('Categories'),
            TatamiMaster.apiGet('Tatamis'),
            TatamiMaster.apiGet('Matches')
        ]);
        panelVersenyzok = v;
        panelKategoriak = k;
        panelTatamik = t;
        panelMeccsek = m.sort((a, b) => a.matchOrder - b.matchOrder);

        const tatamiSelect = document.getElementById('panelTatamiSelect');
        if (tatamiSelect) {
            const regiTatami = tatamiSelect.value;
            let tHtml = '<option value="">-- Válassz Tatamit! --</option>';
            for (let tat of panelTatamik) {
                tHtml += `<option value="${tat.id}">${TatamiMaster.escapeHtml(tat.name)}</option>`;
            }
            tatamiSelect.innerHTML = tHtml;

            if (regiTatami) {
                tatamiSelect.value = regiTatami;
            } else if (panelTatamik.length > 0) {
                tatamiSelect.value = panelTatamik[0].id;
            }
            tatamiMeccsekBetoltese(megtartAktualisMeccs);
        }
    } catch (e) {
        console.error("Hiba az adatok betöltésekor:", e);
    }
}

function tatamiMeccsekBetoltese(megtartAktualisMeccs = false) {
    const tatamiId = parseInt(document.getElementById('panelTatamiSelect').value);
    const meccsSelect = document.getElementById('panelMeccsSelect');
    if (!meccsSelect) return;

    if (!tatamiId) {
        meccsSelect.innerHTML = '<option value="">-- Először válassz Tatamit! --</option>';
        return;
    }

    const elozoMeccsId = megtartAktualisMeccs && aktualisMeccs ? aktualisMeccs.id : null;

    const tatamiMeccsei = panelMeccsek.filter(m => {
        if (m.tatamiId !== tatamiId) return false;
        let kat = panelKategoriak.find(k => k.id === m.categoryId);
        let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
        return isKata ? (m.competitor1Id !== null) : (m.competitor1Id !== null && m.competitor2Id !== null);
    });

    let html = '<option value="">-- Válassz mérkőzést / katázót! --</option>';
    let elsoAktivId = null;

    for (let m of tatamiMeccsei) {
        let v1 = panelVersenyzok.find(v => v.id === m.competitor1Id);
        let v2 = panelVersenyzok.find(v => v.id === m.competitor2Id);
        let kat = panelKategoriak.find(k => k.id === m.categoryId);
        let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');

        if (!m.isFinished && elsoAktivId === null) elsoAktivId = m.id;

        let statusz = m.isFinished ? "[KÉSZ] " : "[AKTÍV] ";
        let dontoCimke = (isKata && TatamiMaster.isKataDontoMeccs(m.id)) ? " [TOP 6 DÖNTŐ]" : "";
        let parositasSzoveg = isKata
            ? `[KATA] ${v1 ? v1.name : '?'}${dontoCimke} (${kat ? kat.name : ''})`
            : `${v1 ? v1.name : '?'} vs. ${v2 ? v2.name : '?'} (${kat ? kat.name : ''})`;

        html += `<option value="${m.id}">${statusz}#${m.matchOrder}: ${TatamiMaster.escapeHtml(parositasSzoveg)}</option>`;
    }

    meccsSelect.innerHTML = html;

    if (elozoMeccsId && tatamiMeccsei.some(m => m.id === elozoMeccsId && !m.isFinished)) {
        meccsSelect.value = elozoMeccsId;
        frissitKovetkezoMeccsSzoveg();
        adatokMentese();
        return;
    }

    if (elsoAktivId !== null) {
        meccsSelect.value = elsoAktivId;
        meccsKivalasztva();
    }
}

function frissitKovetkezoMeccsSzoveg() {
    if (!aktualisMeccs) return;
    let kovetkezoMeccs = panelMeccsek.find(m => {
        if (m.tatamiId !== aktualisMeccs.tatamiId || m.isFinished || m.matchOrder <= aktualisMeccs.matchOrder) return false;
        let mKat = panelKategoriak.find(k => k.id === m.categoryId);
        let mIsKata = (mKat && mKat.matchType && mKat.matchType.toUpperCase() === 'KATA');
        return mIsKata ? (m.competitor1Id !== null) : (m.competitor1Id !== null && m.competitor2Id !== null);
    });

    if (kovetkezoMeccs) {
        let kv1 = panelVersenyzok.find(v => v.id === kovetkezoMeccs.competitor1Id);
        let kv2 = panelVersenyzok.find(v => v.id === kovetkezoMeccs.competitor2Id);
        let kKat = panelKategoriak.find(k => k.id === kovetkezoMeccs.categoryId);
        let kIsKata = (kKat && kKat.matchType && kKat.matchType.toUpperCase() === 'KATA');

        kovetkezoMeccsSzoveg = kIsKata
            ? `FELKÉSZÜL (#${kovetkezoMeccs.matchOrder}): [KATA] ${kv1 ? kv1.name + ' (' + kv1.club + ')' : '?'}`
            : `FELKÉSZÜL (#${kovetkezoMeccs.matchOrder}): [AKA] ${kv1 ? kv1.name : '?'} vs. [SHIRO] ${kv2 ? kv2.name : '?'}`;
    } else {
        kovetkezoMeccsSzoveg = "FELKÉSZÜL: Nincs több várakozó mérkőzés ezen a tatamin.";
    }
}

function meccsKivalasztva() {
    const meccsId = parseInt(document.getElementById('panelMeccsSelect').value);
    if (!meccsId) return;

    aktualisMeccs = panelMeccsek.find(m => m.id === meccsId);
    if (!aktualisMeccs) return;

    let v1 = panelVersenyzok.find(v => v.id === aktualisMeccs.competitor1Id);
    let v2 = panelVersenyzok.find(v => v.id === aktualisMeccs.competitor2Id);
    let kat = panelKategoriak.find(k => k.id === aktualisMeccs.categoryId);
    let tat = panelTatamik.find(t => t.id === aktualisMeccs.tatamiId);
    let isKata = (kat && kat.matchType && kat.matchType.toUpperCase() === 'KATA');
    let isDonto = (isKata && TatamiMaster.isKataDontoMeccs(aktualisMeccs.id));

    const akaTeljesNev = v1 ? `${v1.name} (${v1.club})` : "AKA";
    document.getElementById('akaNevInput').value = akaTeljesNev;
    document.getElementById('shiroNevInput').value = isKata ? "KATA EGYÉNI" : (v2 ? `${v2.name} (${v2.club})` : "SHIRO");
    document.getElementById('meccsKategoriaInput').value = `${tat ? tat.name : ''} — ${kat ? kat.name : ''}${isDonto ? ' [TOP 6 DÖNTŐ]' : ''} (#${aktualisMeccs.matchOrder}. meccs)`;

    const kataNevSpan = document.getElementById('kataAktivVersenyzoNev');
    if (kataNevSpan) kataNevSpan.innerText = akaTeljesNev;

    // Versenyzők rögzített testsúlyának előtöltése a Felnőtt Mérlegelés* segédpanelbe
    const akaKgInp = document.getElementById('merlegelesAkaKg');
    const shiroKgInp = document.getElementById('merlegelesShiroKg');
    if (akaKgInp) akaKgInp.value = (v1 && v1.weight) ? v1.weight : '';
    if (shiroKgInp) shiroKgInp.value = (v2 && v2.weight) ? v2.weight : '';

    // Kategóriához illeszkedő korcsoport-időszabály automatikus kiválasztása
    if (!isKata) {
        aktivIdoSzabaly = TatamiMaster.lekerKumiteIdoSzabaly(kat);
        const korSel = document.getElementById('kumiteKorcsoportSelect');
        if (korSel) korSel.value = aktivIdoSzabaly.kulcs;
    }

    frissitKovetkezoMeccsSzoveg();
    modValtas(isKata ? 'KATA' : 'KUMITE');
    nullazasMeccsre();
}

// =========================================================
// KORCSOPORT KÜZDŐIDŐ ÉS HOSSZABBÍTÁS VEZÉRLÉS (KYOKUSHIN TÁBLÁZAT)
// =========================================================
function valtsKumiteKorcsoportSzabaly(kulcs) {
    aktivIdoSzabaly = TatamiMaster.lekerKumiteIdoSzabaly(null, kulcs);
    valtsKumiteFazisIndexre(0, false);
    TatamiMaster.toast(`Időszabály beállítva: ${aktivIdoSzabaly.teljesCimke}`);
}

function valtsKumiteFazisIndexre(ujIndex, nullazPontokat = false) {
    if (!aktivIdoSzabaly || !Array.isArray(aktivIdoSzabaly.fazisok)) return;
    const maxIdx = aktivIdoSzabaly.fazisok.length - 1;
    aktivFazisIndex = Math.max(0, Math.min(maxIdx, ujIndex));

    idoMegallitas();

    const fazis = aktivIdoSzabaly.fazisok[aktivFazisIndex];
    if (nullazPontokat) {
        // Új hosszabbítási menet (Encho-sen) elején a menetpontok 0:0-ról indulnak
        akaPont = 0;
        shiroPont = 0;
        document.getElementById('akaPontDisplay').innerText = 0;
        document.getElementById('shiroPontDisplay').innerText = 0;
        const modSel = document.getElementById('gyozelemModSelect');
        if (modSel) modSel.value = 'HANTEI';
    }

    idoMasodpercben = fazis.mp || 0;
    frissitTimerKijelzo();
    frissitKumiteFazisUI();
    adatokMentese();
}

function kovetkezoKumiteFazis() {
    if (!aktivIdoSzabaly || !Array.isArray(aktivIdoSzabaly.fazisok)) return;
    if (aktivFazisIndex + 1 < aktivIdoSzabaly.fazisok.length) {
        const kovFazis = aktivIdoSzabaly.fazisok[aktivFazisIndex + 1];
        valtsKumiteFazisIndexre(aktivFazisIndex + 1, !kovFazis.isMerlegeles);
        if (kovFazis.isMerlegeles) {
            TatamiMaster.toast("2 + 2 perc döntetlen! Következik a Felnőtt MÉRLEGELÉS* (súlykülönbség-ellenőrzés)!", "figyelem");
        } else {
            TatamiMaster.toast(`${kovFazis.nev} betöltve (${idoFormazas(kovFazis.mp)})!`, "siker");
        }
    } else {
        idoMegallitas();
        const modSel = document.getElementById('gyozelemModSelect');
        if (modSel) modSel.value = 'HANTEI';
        TatamiMaster.toast("Az utolsó hosszabbítás is véget ért! Kötelező Bírói Döntés (HANTEI) következik!", "figyelem");
    }
}

function frissitKumiteFazisUI() {
    const sav = document.getElementById('kumiteFazisSav');
    const cimke = document.getElementById('aktivFazisCimke');
    const kovBtn = document.getElementById('btnKovetkezoFazis');
    const merlegBox = document.getElementById('felnottMerlegelesBox');

    if (!aktivIdoSzabaly || !Array.isArray(aktivIdoSzabaly.fazisok)) return;
    const fazis = aktivIdoSzabaly.fazisok[aktivFazisIndex] || aktivIdoSzabaly.fazisok[0];

    if (sav) {
        sav.innerHTML = aktivIdoSzabaly.fazisok.map((f, idx) => {
            const aktiv = (idx === aktivFazisIndex);
            const stClass = aktiv ? (idx === 0 ? 'active-base' : 'active-overtime') : '';
            const idoRovid = f.isMerlegeles ? 'Súly' : idoFormazas(f.mp);
            return `<button type="button" class="phase-pill-btn ${stClass}" onclick="valtsKumiteFazisIndexre(${idx}, ${idx > 0 && !f.isMerlegeles})">${idx + 1}. ${TatamiMaster.escapeHtml(f.rovid)} (${idoRovid})</button>`;
        }).join('');
    }

    if (cimke) {
        cimke.innerHTML = `${TatamiMaster.icon(fazis.isMerlegeles ? 'scale' : 'clock', 15)} <span>${TatamiMaster.escapeHtml(fazis.nev)} &bull; ${TatamiMaster.escapeHtml(aktivIdoSzabaly.korcsoportNev)}</span>`;
        cimke.style.color = (aktivFazisIndex === 0) ? '#18181B' : '#991B1B';
    }

    if (merlegBox) {
        merlegBox.style.display = fazis.isMerlegeles ? 'block' : 'none';
        if (fazis.isMerlegeles) {
            frissitMerlegelesKiertekeles();
        }
    }

    if (kovBtn) {
        if (aktivFazisIndex + 1 < aktivIdoSzabaly.fazisok.length) {
            const kov = aktivIdoSzabaly.fazisok[aktivFazisIndex + 1];
            kovBtn.innerHTML = `${TatamiMaster.icon('arrow-right', 15)} <span>Döntetlen (Hikiwake) &rarr; ${TatamiMaster.escapeHtml(kov.nev)}</span>`;
            kovBtn.style.background = '#FAF8F5';
            kovBtn.style.color = '#991B1B';
        } else {
            kovBtn.innerHTML = `${TatamiMaster.icon('award', 15)} <span>Utolsó menet &rarr; Kötelező Bírói Döntés (HANTEI)</span>`;
            kovBtn.style.background = '#991B1B';
            kovBtn.style.color = '#FAF8F5';
        }
    }
}

function frissitMerlegelesKiertekeles() {
    const akaKg = parseFloat(document.getElementById('merlegelesAkaKg')?.value);
    const shiroKg = parseFloat(document.getElementById('merlegelesShiroKg')?.value);
    const kuszob = parseFloat(document.getElementById('merlegelesKuszobKg')?.value) || 3;
    const kiirEl = document.getElementById('merlegelesEredmenySzoveg');
    const gyozBtn = document.getElementById('btnMerlegelesGyoztes');
    if (!kiirEl) return;

    if (isNaN(akaKg) || isNaN(shiroKg) || akaKg <= 0 || shiroKg <= 0) {
        kiirEl.innerText = 'Add meg mindkét küzdő pontos testsúlyát (kg) az összehasonlításhoz!';
        if (gyozBtn) gyozBtn.disabled = true;
        adatokMentese();
        return;
    }

    const kulonbseg = Math.round(Math.abs(akaKg - shiroKg) * 10) / 10;
    if (kulonbseg >= kuszob && akaKg !== shiroKg) {
        const konnyebbOldal = akaKg < shiroKg ? 'AKA (Piros)' : 'SHIRO (Fehér)';
        kiirEl.innerHTML = `<span style="color:#991B1B;">Súlykülönbség: ${kulonbseg.toFixed(1)} kg (&ge; ${kuszob} kg)!</span><br>A könnyebb küzdő (<strong>${konnyebbOldal}</strong>) mérlegeléssel győz!`;
        if (gyozBtn) {
            gyozBtn.disabled = false;
            gyozBtn.innerText = `${konnyebbOldal} győz mérlegeléssel`;
        }
    } else {
        kiirEl.innerHTML = `Súlykülönbség: <strong>${kulonbseg.toFixed(1)} kg</strong> (kisebb mint ${kuszob} kg).<br>Nincs döntés súllyal &rarr; <strong>Végső 2 perces hosszabbítás</strong> következik!`;
        if (gyozBtn) gyozBtn.disabled = true;
    }
    adatokMentese();
}

function alkalmazMerlegelesGyoztes() {
    const akaKg = parseFloat(document.getElementById('merlegelesAkaKg')?.value);
    const shiroKg = parseFloat(document.getElementById('merlegelesShiroKg')?.value);
    if (isNaN(akaKg) || isNaN(shiroKg) || akaKg === shiroKg) return;

    const gyoztesSel = document.getElementById('gyoztesSelect');
    const modSel = document.getElementById('gyozelemModSelect');
    if (gyoztesSel) gyoztesSel.value = akaKg < shiroKg ? 'aka' : 'shiro';
    if (modSel) modSel.value = 'HANTEI';

    TatamiMaster.toast(`${akaKg < shiroKg ? 'AKA' : 'SHIRO'} kijelölve győztesnek mérlegelés alapján! Kattints a „Mérkőzés Lezárása” gombra a mentéshez.`);
}

function modValtas(mod) {
    aktualisMod = mod;
    document.getElementById('kumiteVezerlo').style.display = (mod === 'KUMITE') ? 'block' : 'none';
    document.getElementById('kataVezerlo').style.display = (mod === 'KATA') ? 'block' : 'none';

    const gyoztesBox = document.getElementById('kumiteGyoztesValaszto');
    if (gyoztesBox) gyoztesBox.style.display = (mod === 'KUMITE') ? 'flex' : 'none';

    document.getElementById('gombKumiteMod').className = (mod === 'KUMITE') ? 'btn btn-outline-blue' : 'btn btn-outline';
    document.getElementById('gombKataMod').className = (mod === 'KATA') ? 'btn btn-outline-blue' : 'btn btn-outline';
    adatokMentese();
}

function pontValtoztatas(kuzdo, ertek) {
    kumiteHistory[kuzdo].push({ akaPont, shiroPont, akaBuntetes, shiroBuntetes });

    if (kuzdo === 'aka') {
        akaPont = Math.max(0, akaPont + ertek);
        document.getElementById('akaPontDisplay').innerText = akaPont;
    } else {
        shiroPont = Math.max(0, shiroPont + ertek);
        document.getElementById('shiroPontDisplay').innerText = shiroPont;
    }
    ellenorizAutomatikusGyozelem();
    adatokMentese();
}

function formazPanelBuntetes(b) {
    const p = parseInt(b) || 0;
    if (p === 0) return "0";
    if (p === 1) return "1 Chui";
    if (p === 2) return "2 Chui";
    if (p === 3) return "1 Genten";
    return "SIKAKU (2G)";
}

function frissitBuntetesGombokEsKijelzo() {
    document.getElementById('akaBuntetesDisplay').innerText = formazPanelBuntetes(akaBuntetes);
    document.getElementById('shiroBuntetesDisplay').innerText = formazPanelBuntetes(shiroBuntetes);

    const akaChuiBtn = document.getElementById('akaChuiBtn');
    if (akaChuiBtn) {
        akaChuiBtn.disabled = (akaBuntetes >= 3);
        akaChuiBtn.style.opacity = (akaBuntetes >= 3) ? '0.35' : '1';
        akaChuiBtn.style.cursor = (akaBuntetes >= 3) ? 'not-allowed' : 'pointer';
        akaChuiBtn.innerHTML = (akaBuntetes >= 3)
            ? `${TatamiMaster.icon('lock', 14)} Chui lezárva (1G után)`
            : `${TatamiMaster.icon('alert', 14)} +1 Chui (Figyelmeztetés)`;
    }

    const shiroChuiBtn = document.getElementById('shiroChuiBtn');
    if (shiroChuiBtn) {
        shiroChuiBtn.disabled = (shiroBuntetes >= 3);
        shiroChuiBtn.style.opacity = (shiroBuntetes >= 3) ? '0.35' : '1';
        shiroChuiBtn.style.cursor = (shiroBuntetes >= 3) ? 'not-allowed' : 'pointer';
        shiroChuiBtn.innerHTML = (shiroBuntetes >= 3)
            ? `${TatamiMaster.icon('lock', 14)} Chui lezárva (1G után)`
            : `${TatamiMaster.icon('alert', 14)} +1 Chui (Figyelmeztetés)`;
    }
}

function buntetesValtoztatas(kuzdo, tipus) {
    kumiteHistory[kuzdo].push({ akaPont, shiroPont, akaBuntetes, shiroBuntetes });

    let aktualis = (kuzdo === 'aka') ? akaBuntetes : shiroBuntetes;

    if (tipus === 'CHUI' || tipus === 1) {
        if (aktualis < 3) {
            aktualis++;
            if (aktualis === 3) {
                TatamiMaster.toast(`3. Chui = 1 GENTEN! Innentől már csak Gentent lehet adni!`, "figyelem");
            }
        }
    } else if (tipus === 'GENTEN' || tipus >= 2) {
        if (aktualis < 3) {
            aktualis = 3;
            TatamiMaster.toast(`1 GENTEN! Innentől már csak Gentent lehet adni!`, "figyelem");
        } else {
            aktualis = 4;
        }
    }

    if (kuzdo === 'aka') akaBuntetes = aktualis;
    else shiroBuntetes = aktualis;

    frissitBuntetesGombokEsKijelzo();
    ellenorizAutomatikusGyozelem();
    adatokMentese();
}

function kumiteUndo(kuzdo) {
    if (!kumiteHistory[kuzdo] || kumiteHistory[kuzdo].length === 0) {
        TatamiMaster.toast("Nincs visszavonható művelet ennél a küzdőnél!", "figyelem");
        return;
    }
    const elozo = kumiteHistory[kuzdo].pop();
    akaPont = elozo.akaPont;
    shiroPont = elozo.shiroPont;
    akaBuntetes = elozo.akaBuntetes;
    shiroBuntetes = elozo.shiroBuntetes;

    document.getElementById('akaPontDisplay').innerText = akaPont;
    document.getElementById('shiroPontDisplay').innerText = shiroPont;
    frissitBuntetesGombokEsKijelzo();

    ellenorizAutomatikusGyozelem();
    adatokMentese();
}

function ellenorizAutomatikusGyozelem() {
    const gyoztesSel = document.getElementById('gyoztesSelect');
    const modSel = document.getElementById('gyozelemModSelect');
    if (!gyoztesSel || !modSel) return;

    if (akaBuntetes >= 4) {
        idoMegallitas();
        gyoztesSel.value = 'shiro';
        modSel.value = 'SIKAKU';
        TatamiMaster.toast("SIKAKU! AKA elérte a 2 Gentent — SHIRO győzött leléptetéssel!", "hiba");
        return;
    }
    if (shiroBuntetes >= 4) {
        idoMegallitas();
        gyoztesSel.value = 'aka';
        modSel.value = 'SIKAKU';
        TatamiMaster.toast("SIKAKU! SHIRO elérte a 2 Gentent — AKA győzött leléptetéssel!", "hiba");
        return;
    }

    if (akaPont >= 2) {
        idoMegallitas();
        gyoztesSel.value = 'aka';
        if (modSel.value !== 'IPPON') modSel.value = 'AWASETE';
    } else if (shiroPont >= 2) {
        idoMegallitas();
        gyoztesSel.value = 'shiro';
        if (modSel.value !== 'IPPON') modSel.value = 'AWASETE';
    } else if (akaPont === 1 && shiroPont === 0) {
        gyoztesSel.value = 'aka';
        modSel.value = 'WAZAARI';
    } else if (shiroPont === 1 && akaPont === 0) {
        gyoztesSel.value = 'shiro';
        modSel.value = 'WAZAARI';
    } else {
        modSel.value = 'HANTEI';
    }
}

function idoFormazas(mp) {
    const tisztaMp = Math.max(0, parseInt(mp) || 0);
    let perc = Math.floor(tisztaMp / 60);
    let masodperc = tisztaMp % 60;
    return (perc < 10 ? "0" + perc : perc) + ":" + (masodperc < 10 ? "0" + masodperc : masodperc);
}

function frissitTimerKijelzo() {
    const el = document.getElementById('panelTimerDisplay');
    if (!el) return;
    el.innerText = idoFormazas(idoMasodpercben);
    if (idoMasodpercben > 0 && idoMasodpercben <= 15) {
        el.classList.add('warning-15s');
    } else {
        el.classList.remove('warning-15s');
    }
}

function idoBeallitas(mp) {
    idoMegallitas();
    idoMasodpercben = mp;
    frissitTimerKijelzo();
    adatokMentese();
}

function egyeniIdoBeallitas() {
    let mp = parseInt(document.getElementById('egyeniIdoInput').value);
    if (!isNaN(mp) && mp > 0) idoBeallitas(mp);
}

function idoInditas() {
    if (idozitoInterval) return;
    if (idoMasodpercben <= 0) {
        TatamiMaster.toast("Az időmérő 00:00-n áll! Válassz hosszabbítást vagy állíts be új küzdőidőt!", "figyelem");
        return;
    }
    idozitoInterval = setInterval(() => {
        if (idoMasodpercben > 0) {
            idoMasodpercben--;
            frissitTimerKijelzo();

            // 15 másodperces figyelmeztetés (Shibaraku) és 00:00 végső Gong
            if (idoMasodpercben === 15 && gongHangBekapcsolva) {
                TatamiMaster.lejatszGongHang('figyelmeztetes');
            } else if (idoMasodpercben === 0) {
                if (gongHangBekapcsolva) {
                    TatamiMaster.lejatszGongHang('gong');
                }
                idoMegallitas();
                if (akaPont === shiroPont) {
                    if (aktivIdoSzabaly && aktivFazisIndex + 1 < aktivIdoSzabaly.fazisok.length) {
                        const kov = aktivIdoSzabaly.fazisok[aktivFazisIndex + 1];
                        TatamiMaster.toast(`Lejárt a küzdőidő (00:00)! Döntetlen esetén kattints a „${kov.nev}” gombra!`, "figyelem");
                    } else {
                        TatamiMaster.toast("Lejárt az utolsó hosszabbítás is (00:00)! Kötelező Bírói Döntés (HANTEI)!", "figyelem");
                    }
                }
            }
            adatokMentese();
        } else {
            idoMegallitas();
            adatokMentese();
        }
    }, 1000);
    adatokMentese();
}

function idoMegallitas() {
    const futott = !!idozitoInterval;
    clearInterval(idozitoInterval);
    idozitoInterval = null;
    if (futott) adatokMentese();
}

function nullazasMeccsre() {
    idoMegallitas();
    akaPont = 0; shiroPont = 0;
    akaBuntetes = 0; shiroBuntetes = 0;
    kumiteHistory = { aka: [], shiro: [] };
    aktivFazisIndex = 0;

    const alapMp = (aktivIdoSzabaly && aktivIdoSzabaly.fazisok && aktivIdoSzabaly.fazisok[0])
        ? aktivIdoSzabaly.fazisok[0].mp
        : 120;
    idoMasodpercben = alapMp;

    document.getElementById('akaPontDisplay').innerText = 0;
    document.getElementById('shiroPontDisplay').innerText = 0;
    document.getElementById('akaBuntetesDisplay').innerText = 0;
    document.getElementById('shiroBuntetesDisplay').innerText = 0;
    frissitBuntetesGombokEsKijelzo();
    frissitTimerKijelzo();
    frissitKumiteFazisUI();

    const modSel = document.getElementById('gyozelemModSelect');
    if (modSel) modSel.value = 'HANTEI';

    document.querySelectorAll('.kata-pont').forEach(inp => inp.value = '');
    document.getElementById('kataOsszpontDisplay').innerText = "0.0";
    adatokMentese();
}

function kataPontSzamitas() {
    const nyersPontok = Array.from(document.querySelectorAll('.kata-pont')).map(i => parseFloat(i.value));
    const ertekeles = TatamiMaster.szamolKataErtekeles(nyersPontok);
    document.getElementById('kataOsszpontDisplay').innerText = ertekeles.osszeg.toFixed(1);
    adatokMentese();
}

function adatokMentese() {
    const nyersKata = Array.from(document.querySelectorAll('.kata-pont')).map(i => i.value);
    const kataErtekeles = TatamiMaster.szamolKataErtekeles(nyersKata.map(x => parseFloat(x)));
    const aktTatamiId = document.getElementById('panelTatamiSelect')?.value || '1';
    const aktTatamiObj = panelTatamik.find(t => String(t.id) === String(aktTatamiId));
    const fazis = (aktivIdoSzabaly && aktivIdoSzabaly.fazisok && aktivIdoSzabaly.fazisok[aktivFazisIndex])
        ? aktivIdoSzabaly.fazisok[aktivFazisIndex]
        : { kod: 'ALAP', nev: 'Alapidő', rovid: 'ALAPIDŐ', isMerlegeles: false };

    const adatok = {
        tatamiId: String(aktTatamiId),
        tatamiName: aktTatamiObj ? aktTatamiObj.name : ('Tatami #' + aktTatamiId),
        versenyId: TatamiMaster.lekerAktualisVersenyId(),
        matchId: aktualisMeccs ? aktualisMeccs.id : null,
        matchOrder: aktualisMeccs ? aktualisMeccs.matchOrder : null,
        mode: aktualisMod,
        matchInfo: document.getElementById('meccsKategoriaInput')?.value || '',
        nextMatchInfo: kovetkezoMeccsSzoveg,
        akaName: document.getElementById('akaNevInput')?.value || 'AKA',
        shiroName: document.getElementById('shiroNevInput')?.value || 'SHIRO',
        akaScore: akaPont,
        shiroScore: shiroPont,
        akaPenalties: akaBuntetes,
        shiroPenalties: shiroBuntetes,
        timer: fazis.isMerlegeles ? 'SÚLY' : idoFormazas(idoMasodpercben),
        remainingSeconds: idoMasodpercben,
        timerRunning: !!idozitoInterval,
        roundCode: aktualisMod === 'KATA' ? 'KATA' : fazis.kod,
        roundLabel: aktualisMod === 'KATA' ? 'KATA PONTOZÁS' : fazis.rovid,
        ruleLabel: aktualisMod === 'KATA' ? '5 bírói pontozás' : (aktivIdoSzabaly ? aktivIdoSzabaly.teljesCimke : ''),
        weighInAkaKg: document.getElementById('merlegelesAkaKg')?.value || '',
        weighInShiroKg: document.getElementById('merlegelesShiroKg')?.value || '',
        kataScores: nyersKata,
        kataTotal: document.getElementById('kataOsszpontDisplay')?.innerText || '0.0',
        kataMinIdx: kataErtekeles.minIdx,
        kataMaxIdx: kataErtekeles.maxIdx
    };

    TatamiMaster.kuldesLiveTatamiAllapot(adatok);
}

async function meccsMentese() {
    if (mentesFolyamatban) return;
    if (!aktualisMeccs) {
        TatamiMaster.toast("Először válassz ki egy tatamit és egy mérkőzést!", "figyelem");
        return;
    }

    const mentesBtn = document.getElementById('mentesGomb');
    mentesFolyamatban = true;
    if (mentesBtn) {
        mentesBtn.disabled = true;
        mentesBtn.style.opacity = '0.6';
    }

    try {
        if (aktualisMod === 'KATA') {
            const nyersPontok = Array.from(document.querySelectorAll('.kata-pont')).map(i => parseFloat(i.value));
            const ertekeles = TatamiMaster.szamolKataErtekeles(nyersPontok);

            if (!ertekeles.kesz) {
                TatamiMaster.toast("Kérlek adj meg mind az 5 bírónál érvényes pontszámot!", "figyelem");
                return;
            }

            TatamiMaster.mentKataEredmeny(aktualisMeccs.id, aktualisMeccs.competitor1Id, ertekeles);
            aktualisMeccs.isFinished = true;
            aktualisMeccs.winnerId = aktualisMeccs.competitor1Id;
            await TatamiMaster.apiSend('Matches/' + aktualisMeccs.id, 'PUT', aktualisMeccs);

            await ellenorizKataSelejtezoEsTop6Donto(aktualisMeccs.categoryId, aktualisMeccs.tatamiId);
            await biroiAdatokFrissitese();
            return;
        }

        const gyoztesOldal = document.getElementById('gyoztesSelect').value;
        const gyozelemMod = document.getElementById('gyozelemModSelect').value;
        const gyoztesId = (gyoztesOldal === 'aka') ? aktualisMeccs.competitor1Id : aktualisMeccs.competitor2Id;

        aktualisMeccs.isFinished = true;
        aktualisMeccs.winnerId = gyoztesId;

        const fazis = (aktivIdoSzabaly && aktivIdoSzabaly.fazisok && aktivIdoSzabaly.fazisok[aktivFazisIndex])
            ? aktivIdoSzabaly.fazisok[aktivFazisIndex]
            : null;

        TatamiMaster.mentKumiteReszletek(aktualisMeccs.id, {
            winnerId: gyoztesId,
            winType: gyozelemMod,
            akaScore: akaPont,
            shiroScore: shiroPont,
            akaPenalties: akaBuntetes,
            shiroPenalties: shiroBuntetes,
            endedInRound: fazis ? fazis.rovid : 'ALAPIDŐ'
        });

        await TatamiMaster.apiSend('Matches/' + aktualisMeccs.id, 'PUT', aktualisMeccs);
        await tovabbjuttatasKovetkezoForduloba(aktualisMeccs, gyoztesId);
        await TatamiMaster.trigger('afterMatchSave', { match: aktualisMeccs, winnerId: gyoztesId, winType: gyozelemMod });

        TatamiMaster.toast("Mérkőzés lezárva, győztes továbbjuttatva!");
        await biroiAdatokFrissitese();
    } finally {
        mentesFolyamatban = false;
        if (mentesBtn) {
            mentesBtn.disabled = false;
            mentesBtn.style.opacity = '1';
        }
    }
}

async function ellenorizKataSelejtezoEsTop6Donto(categoryId, tatamiId) {
    const frissMeccsek = await TatamiMaster.apiGet('Matches');
    const katMeccsek = frissMeccsek.filter(m => m.categoryId === categoryId);
    const selejtezoMeccsek = katMeccsek.filter(m => !TatamiMaster.isKataDontoMeccs(m.id));
    const dontoMeccsek = katMeccsek.filter(m => TatamiMaster.isKataDontoMeccs(m.id));

    if (dontoMeccsek.length === 0 && selejtezoMeccsek.length > 0 && selejtezoMeccsek.every(m => m.isFinished)) {
        const kataTarolo = TatamiMaster.lekerKataEredmenyek();
        let rangsor = selejtezoMeccsek.map(m => ({
            meccs: m,
            competitorId: m.competitor1Id,
            ...(kataTarolo[m.id] || { osszeg: 0, minErtek: 0, maxErtek: 0, vezetoBiro: 0 })
        })).sort(TatamiMaster.kataSorrendHasonlito);

        let top6 = rangsor.slice(0, 6);
        const tatamiMeccsei = frissMeccsek.filter(m => m.tatamiId === tatamiId);
        let kovetkezoSorszam = tatamiMeccsei.length > 0 ? Math.max(...tatamiMeccsei.map(m => m.matchOrder)) + 1 : 1;

        let ujDontoMeccsIdk = [];
        for (let t of top6) {
            const res = await TatamiMaster.apiSend('Matches', 'POST', {
                categoryId: categoryId,
                tatamiId: tatamiId,
                competitor1Id: t.competitorId,
                competitor2Id: null,
                matchOrder: kovetkezoSorszam++,
                isFinished: false,
                winnerId: null
            });
            if (res.ok) {
                const letrejott = await res.json();
                ujDontoMeccsIdk.push(letrejott.id);
            }
        }

        TatamiMaster.megjelolKataDontoMeccsek(ujDontoMeccsIdk);
        TatamiMaster.toast(`A Kata selejtező véget ért! A legjobb ${top6.length} versenyző (Top 6) bekerült a Döntőbe!`);
    } else {
        TatamiMaster.toast("Kata pontszám rögzítve!");
    }
}

async function tovabbjuttatasKovetkezoForduloba(lezartMeccs, gyoztesId) {
    let katMeccsek = panelMeccsek.filter(m => m.categoryId === lezartMeccs.categoryId).sort((a, b) => a.id - b.id);
    let n = katMeccsek.length;
    if (!TatamiMaster.isKumiteAgrajz(katMeccsek)) return;

    let fordulok = [];
    let korMeret = (n + 1) / 2;
    let idx = 0;
    while (korMeret >= 1) {
        fordulok.push(katMeccsek.slice(idx, idx + korMeret));
        idx += korMeret;
        korMeret /= 2;
    }

    for (let r = 0; r < fordulok.length - 1; r++) {
        let mIndex = fordulok[r].findIndex(m => m.id === lezartMeccs.id);
        if (mIndex !== -1) {
            let kovMeccs = fordulok[r + 1][Math.floor(mIndex / 2)];
            if (kovMeccs) {
                let regiTovabbjuto = (mIndex % 2 === 0) ? kovMeccs.competitor1Id : kovMeccs.competitor2Id;
                if (mIndex % 2 === 0) kovMeccs.competitor1Id = gyoztesId;
                else kovMeccs.competitor2Id = gyoztesId;

                if (regiTovabbjuto && regiTovabbjuto !== gyoztesId && kovMeccs.isFinished) {
                    kovMeccs.isFinished = false;
                    kovMeccs.winnerId = null;
                }
                await TatamiMaster.apiSend('Matches/' + kovMeccs.id, 'PUT', kovMeccs);
            }
            break;
        }
    }
}

function nyitTvKijelzo() {
    const tatamiId = document.getElementById('panelTatamiSelect')?.value || '';
    const url = tatamiId ? `tv_kijelzo.html?tatami=${encodeURIComponent(tatamiId)}` : 'tv_kijelzo.html';
    window.open(url, '_blank', 'width=1280,height=720');
}

function nyitObsOverlay() {
    const tatamiId = document.getElementById('panelTatamiSelect')?.value || 1;
    const url = `obs_overlay.html?tatami=${encodeURIComponent(tatamiId)}`;
    window.open(url, '_blank', 'width=1280,height=720');
    TatamiMaster.toast(`OBS Overlay megnyitva a(z) ${tatamiId}. Tatamihoz!`);
}
