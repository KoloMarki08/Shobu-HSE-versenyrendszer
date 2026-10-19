let aktualisMod = 'KUMITE';
let akaPont = 0, shiroPont = 0;
let akaBuntetes = 0, shiroBuntetes = 0;
let idoMasodpercben = 120;
let idozitoInterval = null;

let kumiteHistory = { aka: [], shiro: [] };

let panelVersenyzok = [];
let panelKategoriak = [];
let panelTatamik = [];
let panelMeccsek = [];
let aktualisMeccs = null;
let kovetkezoMeccsSzoveg = "Várakozás a következő mérkőzésre...";
let mentesFolyamatban = false;

window.onload = async function() {
    initKataGyorsBillentyuzet();
    await biroiAdatokFrissitese();
    adatokMentese();
};

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

async function biroiAdatokFrissitese() {
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
                tHtml += `<option value="${tat.id}">${tat.name}</option>`;
            }
            tatamiSelect.innerHTML = tHtml;

            if (regiTatami) {
                tatamiSelect.value = regiTatami;
            } else if (panelTatamik.length > 0) {
                // Ha még nincs kiválasztva tatami, automatikusan kiválasztjuk az 1. Tatamit!
                tatamiSelect.value = panelTatamik[0].id;
            }
            tatamiMeccsekBetoltese();
        }
    } catch (e) {
        console.error("Hiba az adatok betöltésekor:", e);
    }
}

function tatamiMeccsekBetoltese() {
    const tatamiId = parseInt(document.getElementById('panelTatamiSelect').value);
    const meccsSelect = document.getElementById('panelMeccsSelect');
    if (!meccsSelect) return;

    if (!tatamiId) {
        meccsSelect.innerHTML = '<option value="">-- Először válassz Tatamit! --</option>';
        return;
    }

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

        let statusz = m.isFinished ? "✔ [KÉSZ] " : "🔥 [AKTÍV] ";
        let dontoCimke = (isKata && TatamiMaster.isKataDontoMeccs(m.id)) ? " [TOP 6 DÖNTŐ]" : "";
        let parositasSzoveg = isKata
            ? `🥋 ${v1 ? v1.name : '?'}${dontoCimke} (${kat ? kat.name : ''})`
            : `${v1 ? v1.name : '?'} vs. ${v2 ? v2.name : '?'} (${kat ? kat.name : ''})`;

        html += `<option value="${m.id}">${statusz}#${m.matchOrder}: ${parositasSzoveg}</option>`;
    }

    meccsSelect.innerHTML = html;
    if (elsoAktivId !== null) {
        meccsSelect.value = elsoAktivId;
        meccsKivalasztva();
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

    // Következő ("Felkészül") mérkőzés megkeresése ugyanazon a tatamin
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
            ? `⏳ FELKÉSZÜL (#${kovetkezoMeccs.matchOrder}): 🥋 ${kv1 ? kv1.name + ' (' + kv1.club + ')' : '?'}`
            : `⏳ FELKÉSZÜL (#${kovetkezoMeccs.matchOrder}): 🔴 ${kv1 ? kv1.name : '?'} vs. ⚪ ${kv2 ? kv2.name : '?'}`;
    } else {
        kovetkezoMeccsSzoveg = "⏳ FELKÉSZÜL: Nincs több várakozó mérkőzés ezen a tatamin.";
    }

    modValtas(isKata ? 'KATA' : 'KUMITE');
    nullazasMeccsre();
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

// Büntetési állapotok (0..4):
// 0 = 0
// 1 = 1x Chui (csak figyelmeztetés)
// 2 = 2x Chui (csak figyelmeztetés)
// 3 = 1x Genten (a 3. Chui = 1 Genten! Innentől Chui már nem adható, csak Genten!)
// 4 = 2x Genten = SIKAKU (Leléptetés)

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

    // Ha elérte az 1 Gentent (3), innentől már CSAK Gentent lehet adni (a Chui gomb inaktívvá válik)!
    const akaChuiBtn = document.getElementById('akaChuiBtn');
    if (akaChuiBtn) {
        akaChuiBtn.disabled = (akaBuntetes >= 3);
        akaChuiBtn.style.opacity = (akaBuntetes >= 3) ? '0.35' : '1';
        akaChuiBtn.style.cursor = (akaBuntetes >= 3) ? 'not-allowed' : 'pointer';
        akaChuiBtn.innerText = (akaBuntetes >= 3) ? '🔒 Chui lezárva (1G után)' : '⚠️ +1 Chui (Figyelmeztetés)';
    }

    const shiroChuiBtn = document.getElementById('shiroChuiBtn');
    if (shiroChuiBtn) {
        shiroChuiBtn.disabled = (shiroBuntetes >= 3);
        shiroChuiBtn.style.opacity = (shiroBuntetes >= 3) ? '0.35' : '1';
        shiroChuiBtn.style.cursor = (shiroBuntetes >= 3) ? 'not-allowed' : 'pointer';
        shiroChuiBtn.innerText = (shiroBuntetes >= 3) ? '🔒 Chui lezárva (1G után)' : '⚠️ +1 Chui (Figyelmeztetés)';
    }
}

function buntetesValtoztatas(kuzdo, tipus) {
    kumiteHistory[kuzdo].push({ akaPont, shiroPont, akaBuntetes, shiroBuntetes });

    let aktualis = (kuzdo === 'aka') ? akaBuntetes : shiroBuntetes;

    if (tipus === 'CHUI' || tipus === 1) {
        // 1-2 Chuiig csak figyelmeztetés, a 3. Chui -> 1 Genten (3-as szint)
        if (aktualis < 3) {
            aktualis++;
            if (aktualis === 3) {
                TatamiMaster.toast(`🚫 3. Chui = 1 GENTEN! Innentől már csak Gentent lehet adni!`, "figyelem");
            }
        }
    } else if (tipus === 'GENTEN' || tipus >= 2) {
        // Ha még 0, 1 vagy 2 Chuinál tart és egyből Gentent kap -> 1 Genten (3-as szint).
        // Ha már volt 1 Gentenje (3-as szint) és kap még egy Gentent -> 2 Genten = SIKAKU (4-es szint)!
        if (aktualis < 3) {
            aktualis = 3;
            TatamiMaster.toast(`🚫 1 GENTEN! Innentől már csak Gentent lehet adni!`, "figyelem");
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
        TatamiMaster.toast("ℹ️ Nincs visszavonható művelet ennél a küzdőnél!", "figyelem");
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

    // 4-es szint = 2 Genten = SIKAKU!
    if (akaBuntetes >= 4) {
        idoMegallitas();
        gyoztesSel.value = 'shiro';
        modSel.value = 'SIKAKU';
        TatamiMaster.toast("❌ SIKAKU! AKA elérte a 2 Gentent — SHIRO győzött leléptetéssel!", "hiba");
        return;
    }
    if (shiroBuntetes >= 4) {
        idoMegallitas();
        gyoztesSel.value = 'aka';
        modSel.value = 'SIKAKU';
        TatamiMaster.toast("❌ SIKAKU! SHIRO elérte a 2 Gentent — AKA győzött leléptetéssel!", "hiba");
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
    let perc = Math.floor(mp / 60);
    let masodperc = mp % 60;
    return (perc < 10 ? "0" + perc : perc) + ":" + (masodperc < 10 ? "0" + masodperc : masodperc);
}

function idoBeallitas(mp) {
    idoMegallitas();
    idoMasodpercben = mp;
    document.getElementById('panelTimerDisplay').innerText = idoFormazas(idoMasodpercben);
    adatokMentese();
}

function egyeniIdoBeallitas() {
    let mp = parseInt(document.getElementById('egyeniIdoInput').value);
    if (!isNaN(mp) && mp > 0) idoBeallitas(mp);
}

function idoInditas() {
    if (idozitoInterval) return;
    idozitoInterval = setInterval(() => {
        if (idoMasodpercben > 0) {
            idoMasodpercben--;
            document.getElementById('panelTimerDisplay').innerText = idoFormazas(idoMasodpercben);
            adatokMentese();
        } else {
            idoMegallitas();
        }
    }, 1000);
}

function idoMegallitas() {
    clearInterval(idozitoInterval);
    idozitoInterval = null;
}

function nullazasMeccsre() {
    idoMegallitas();
    akaPont = 0; shiroPont = 0;
    akaBuntetes = 0; shiroBuntetes = 0;
    kumiteHistory = { aka: [], shiro: [] };
    idoMasodpercben = 120;

    document.getElementById('akaPontDisplay').innerText = 0;
    document.getElementById('shiroPontDisplay').innerText = 0;
    document.getElementById('akaBuntetesDisplay').innerText = 0;
    document.getElementById('shiroBuntetesDisplay').innerText = 0;
    frissitBuntetesGombokEsKijelzo();
    document.getElementById('panelTimerDisplay').innerText = "02:00";

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

    const adatok = {
        mode: aktualisMod,
        matchInfo: document.getElementById('meccsKategoriaInput').value,
        nextMatchInfo: kovetkezoMeccsSzoveg,
        akaName: document.getElementById('akaNevInput').value,
        shiroName: document.getElementById('shiroNevInput').value,
        akaScore: akaPont,
        shiroScore: shiroPont,
        akaPenalties: akaBuntetes,
        shiroPenalties: shiroBuntetes,
        timer: idoFormazas(idoMasodpercben),
        kataScores: nyersKata,
        kataTotal: document.getElementById('kataOsszpontDisplay').innerText,
        kataMinIdx: kataErtekeles.minIdx,
        kataMaxIdx: kataErtekeles.maxIdx
    };
    localStorage.setItem('tatamiAdatok', JSON.stringify(adatok));
    const aktTatamiId = document.getElementById('panelTatamiSelect')?.value;
    if (aktTatamiId) localStorage.setItem('tatamiAdatok_' + aktTatamiId, JSON.stringify(adatok));
}

async function meccsMentese() {
    if (mentesFolyamatban) return;
    if (!aktualisMeccs) {
        TatamiMaster.toast("⚠️ Először válassz ki egy tatamit és egy mérkőzést!", "figyelem");
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
                TatamiMaster.toast("⚠️ Kérlek adj meg mind az 5 bírónál érvényes pontszámot!", "figyelem");
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

        TatamiMaster.mentKumiteReszletek(aktualisMeccs.id, {
            winnerId: gyoztesId,
            winType: gyozelemMod,
            akaScore: akaPont,
            shiroScore: shiroPont,
            akaPenalties: akaBuntetes,
            shiroPenalties: shiroBuntetes
        });

        await TatamiMaster.apiSend('Matches/' + aktualisMeccs.id, 'PUT', aktualisMeccs);
        await tovabbjuttatasKovetkezoForduloba(aktualisMeccs, gyoztesId);
        await TatamiMaster.trigger('afterMatchSave', { match: aktualisMeccs, winnerId: gyoztesId, winType: gyozelemMod });

        TatamiMaster.toast("✔ Mérkőzés lezárva, győztes továbbjuttatva!");
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
        TatamiMaster.toast(`🏆 A Kata selejtező véget ért! A legjobb ${top6.length} versenyző (Top 6) bekerült a Döntőbe!`);
    } else {
        TatamiMaster.toast("✔ Kata pontszám rögzítve!");
    }
}

async function tovabbjuttatasKovetkezoForduloba(lezartMeccs, gyoztesId) {
    let katMeccsek = panelMeccsek.filter(m => m.categoryId === lezartMeccs.categoryId).sort((a, b) => a.id - b.id);
    let n = katMeccsek.length;
    if (n !== 3 && n !== 7 && n !== 15 && n !== 31) return;

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

                // Ha felülírtunk egy korábbi meccset és emiatt megváltozott a továbbjutó,
                // akkor a következő fordulós meccset automatikusan visszanyitjuk!
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

function nyitObsOverlay() {
    const tatamiId = document.getElementById('panelTatamiSelect')?.value || 1;
    const url = `obs_overlay.html?tatami=${tatamiId}`;
    window.open(url, '_blank', 'width=1280,height=720');
    TatamiMaster.toast(`🎥 OBS Overlay megnyitva a(z) ${tatamiId}. Tatamihoz!`);
}