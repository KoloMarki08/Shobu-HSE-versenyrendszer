let akaWazaari = 0;
let shiroWazaari = 0;
let akaScore = 0;
let shiroScore = 0;

let akaChui = 0;
let akaGenten = 0;
let shiroChui = 0;
let shiroGenten = 0;

let aktualisGyozelemMod = 'HANTEI';
let kenyszeritettGyoztesId = null;

let akaKataAdatok = { pontok: [], minIdx: -1, maxIdx: -1 };
let aktualisMod = 'KUMITE';

let timeLeft = 120;
let timerInterval = null;

let kivalasztottTatamiId = null;
let merkozesekLista = [];
let aktualisMeccs = null;

let akaNevSzoveg = "Várakozás...";
let shiroNevSzoveg = "Várakozás...";
let meccsInfoSzoveg = "Nincs kiválasztott tatami";

window.onload = async function() {
    await tatamikBetolteseBironak();
    // Ha már korábban kiválasztotta a tatamiját ezen a gépen, automatikusan visszaállítjuk!
    const mentettTatami = localStorage.getItem('biroSajatTatamiId');
    if (mentettTatami) {
        document.getElementById('tatamiValaszto').value = mentettTatami;
        tatamiKivalasztva();
    }
    frissitKijelzo();
};

async function tatamikBetolteseBironak() {
    const res = await fetch('https://localhost:7045/api/Tatamis');
    const tatamik = await res.json();
    let html = '<option value="">-- Válassz Tatamit! --</option>';
    for (let t of tatamik) {
        html += '<option value="' + t.id + '">' + t.name + '</option>';
    }
    document.getElementById('tatamiValaszto').innerHTML = html;
}

function tatamiKivalasztva() {
    const val = document.getElementById('tatamiValaszto').value;
    if (!val) {
        kivalasztottTatamiId = null;
        localStorage.removeItem('biroSajatTatamiId');
        return;
    }
    kivalasztottTatamiId = parseInt(val);
    localStorage.setItem('biroSajatTatamiId', kivalasztottTatamiId);
    tatamiMeccseinekBetoltese(true);
}

// Lekéri a tatami meccseit, és automatikusan betölti a soron következőt!
function tatamiMeccseinekBetoltese(autoToltKovetkezot = true) {
    if (!kivalasztottTatamiId) return;

    Promise.all([
        fetch('https://localhost:7045/api/Matches').then(r => r.json()),
        fetch('https://localhost:7045/api/Competitors').then(r => r.json()),
        fetch('https://localhost:7045/api/Categories').then(r => r.json()),
        fetch('https://localhost:7045/api/Tatamis').then(r => r.json())
    ]).then(([meccsek, versenyzok, kategoriak, tatamik]) => {
        // Csak a bíró saját tatamijának meccseit szűrjük le, sorrendben!
        let sajatMeccsek = meccsek.filter(m => m.tatamiId === kivalasztottTatamiId)
                                  .sort((a, b) => a.matchOrder - b.matchOrder);

        let ervenyesMeccsek = [];
        let selectHtml = '';

        for (let m of sajatMeccsek) {
            let t = tatamik.find(x => x.id === m.tatamiId);
            let k = kategoriak.find(x => x.id === m.categoryId);
            let v1 = versenyzok.find(x => x.id === m.competitor1Id);
            let v2 = versenyzok.find(x => x.id === m.competitor2Id);

            m.matchType = (k && k.matchType) ? k.matchType.toUpperCase() : 'KUMITE';

            // Kumiténél 2 küzdő kell (erőnyerőt átugorjuk), Katánál 1 küzdő kell
            if (m.matchType === 'KUMITE' && (!m.competitor1Id || !m.competitor2Id)) continue;
            if (m.matchType === 'KATA' && !m.competitor1Id) continue;

            m.akaNev = v1 ? (v1.name + " (" + v1.club + ")") : ("Versenyző #" + m.competitor1Id);
            m.shiroNev = v2 ? (v2.name + " (" + v2.club + ")") : "";
            m.tatamiNev = t ? t.name : ("Tatami " + m.tatamiId);
            m.katNev = k ? k.name : ("Kat. " + m.categoryId);

            ervenyesMeccsek.push(m);

            let allapot = m.isFinished ? "✔ Kész" : "⏳ Várakozik";
            let parositas = (m.matchType === 'KATA') ? ("🥋 " + m.akaNev) : (m.akaNev + " vs. " + m.shiroNev);
            selectHtml += '<option value="' + m.id + '">[#' + m.matchOrder + ' - ' + allapot + '] ' + parositas + ' (' + m.katNev + ')</option>';
        }

        merkozesekLista = ervenyesMeccsek;
        document.getElementById('meccsValaszto').innerHTML = selectHtml;

        // Megkeressük a tatamin a soron következő (még le nem zárt) és a felkészülő meccset!
        let varakozok = ervenyesMeccsek.filter(m => !m.isFinished);
        let kovetkezo = varakozok[0] || null;
        let felkeszul = varakozok[1] || null;

        if (kovetkezo) {
            let kiiras = '#' + kovetkezo.matchOrder + ' (' + kovetkezo.katNev + '): ' +
                         (kovetkezo.matchType === 'KATA' ? kovetkezo.akaNev : (kovetkezo.akaNev + ' vs. ' + kovetkezo.shiroNev));
            document.getElementById('soronKovetkezoText').innerText = kiiras;
        } else {
            document.getElementById('soronKovetkezoText').innerText = "🎉 Ezen a tatamin minden kisorsolt mérkőzés lezajlott!";
        }

        if (felkeszul) {
            let felkKiiras = '#' + felkeszul.matchOrder + ' (' + felkeszul.katNev + '): ' +
                             (felkeszul.matchType === 'KATA' ? felkeszul.akaNev : (felkeszul.akaNev + ' vs. ' + felkeszul.shiroNev));
            document.getElementById('felkeszulText').innerText = felkKiiras;
        } else {
            document.getElementById('felkeszulText').innerText = "Nincs több várakozó mérkőzés.";
        }

        // Automatikusan betöltjük a soron következő mérkőzést!
        if (autoToltKovetkezot && kovetkezo) {
            document.getElementById('meccsValaszto').value = kovetkezo.id;
            meccsKivalasztva(kovetkezo.id);
        }
    });
}

function meccsKivalasztva(idParam) {
    const valasztottId = parseInt(idParam || document.getElementById('meccsValaszto').value);
    if (!valasztottId) return;

    aktualisMeccs = merkozesekLista.find(m => m.id === valasztottId);
    if (!aktualisMeccs) return;

    akaNevSzoveg = aktualisMeccs.akaNev;
    shiroNevSzoveg = aktualisMeccs.shiroNev;
    aktualisMod = aktualisMeccs.matchType;
    meccsInfoSzoveg = aktualisMeccs.tatamiNev + " | #" + aktualisMeccs.matchOrder + " - " + aktualisMeccs.katNev;

    document.getElementById('akaName').innerText = akaNevSzoveg;
    document.getElementById('shiroName').innerText = shiroNevSzoveg;
    document.getElementById('matchInfoText').innerText = meccsInfoSzoveg;

    const isKata = (aktualisMod === 'KATA');
    document.getElementById('kataVezerloSzekcio').style.display = isKata ? 'block' : 'none';
    document.getElementById('kumiteVezerloSzekcio').style.display = isKata ? 'none' : 'block';

    const shiroCard = document.querySelector('.shiro-card');
    if (shiroCard) shiroCard.style.display = isKata ? 'none' : 'flex';

    const akaTitle = document.querySelector('.aka-card .fighter-title');
    if (akaTitle) akaTitle.innerText = isKata ? 'KATA VERSENYZŐ' : 'AKA (Piros)';

    const kumiteElemek = document.querySelectorAll('.penalty-container, .point-buttons, .penalty-buttons');
    kumiteElemek.forEach(el => el.style.display = isKata ? 'none' : 'flex');

    resetFighter('aka');
    resetFighter('shiro');
    kenyszeritettGyoztesId = null;
    beallitGyozelemMod('HANTEI', '');

    for (let i = 0; i < 5; i++) {
        let inp = document.getElementById('kataJudge' + i);
        if (inp) inp.value = '';
    }
    resetTimer(120);

    // Ha Kata meccs jön, automatikusan az 1. bíró (Vezetőbíró) mezőjébe tesszük a kurzort!
    if (isKata) {
        setTimeout(() => {
            let elsoMezo = document.getElementById('kataJudge0');
            if (elsoMezo) elsoMezo.focus();
        }, 100);
    }
}

// =========================================================
// KATA GYORSBEÜTŐ: 2 SZÁMJEGY -> TIZEDESPONT + AUTO-UGRÁS!
// =========================================================
function kataGyorsBevitel(inputElem, index) {
    // Csak a számjegyeket hagyjuk meg (ha a bíró nem írt pontot, pl. "75")
    let csakSzamok = inputElem.value.replace(/[^0-9]/g, '');

    if (csakSzamok.length === 0) {
        inputElem.value = '';
        szamolKataPontok();
        return;
    }

    // Speciális eset: ha 10.0-t akar beírni ("100"), egyébként 2 számjegynél (pl. "75" -> "7.5")
    if (csakSzamok.startsWith('10') && csakSzamok.length >= 3) {
        inputElem.value = '10.0';
        szamolKataPontok();
        ugorjKovetkezoKataMezore(index);
    } else if (!csakSzamok.startsWith('10') && csakSzamok.length >= 2) {
        let elso = csakSzamok[0];
        let masodik = csakSzamok[1];
        inputElem.value = elso + '.' + masodik;
        szamolKataPontok();
        ugorjKovetkezoKataMezore(index);
    } else {
        // Még csak 1 számjegyet írt be (pl. "7")
        inputElem.value = csakSzamok;
    }
}

function ugorjKovetkezoKataMezore(aktualisIndex) {
    if (aktualisIndex < 4) {
        let kov = document.getElementById('kataJudge' + (aktualisIndex + 1));
        if (kov) {
            kov.focus();
            kov.select();
        }
    } else {
        // Az 5. bíró után egyből a Mentés gombra ugrik, így egy Enterrel menthető!
        let mentesBtn = document.getElementById('mentesGomb');
        if (mentesBtn) mentesBtn.focus();
    }
}

// Ha Backspace-t nyom egy üres mezőben, visszaugrik az előző bíró kockájára
function kataBillentyuKezelo(event, index) {
    if (event.key === 'Backspace' && event.target.value === '' && index > 0) {
        let elozo = document.getElementById('kataJudge' + (index - 1));
        if (elozo) {
            elozo.focus();
            elozo.select();
        }
    }
}

function szamolKataPontok() {
    let nyersPontok = [];
    for (let i = 0; i < 5; i++) {
        let el = document.getElementById('kataJudge' + i);
        nyersPontok.push(el && el.value !== "" ? parseFloat(el.value) : null);
    }

    const ertekeles = TatamiMaster.szamolKataErtekeles(nyersPontok);
    akaScore = ertekeles.osszeg.toFixed(1);
    akaKataAdatok = ertekeles;

    if (ertekeles.kesz) {
        document.getElementById('kataTieBreakInfo').innerHTML =
            'Kiesett Min: <strong>' + ertekeles.minErtek.toFixed(1) + '</strong> | ' +
            'Kiesett Max: <strong>' + ertekeles.maxErtek.toFixed(1) + '</strong> | ' +
            'Vezetőbíró (B1): <strong>' + ertekeles.vezetoBiro.toFixed(1) + '</strong>';
    } else {
        document.getElementById('kataTieBreakInfo').innerText = 'Írd be mind az 5 bíró pontszámát (pl. 75 -> 7.5)!';
    }

    frissitPontEsBuntetesKijelzo();
    frissitKijelzo();
}

// =========================================================
// KUMITE SZABÁLYOK: 3 CHUI = 1 GENTEN, 2 GENTEN = SIKAKU
// =========================================================
function beallitGyozelemMod(kod, uzenet) {
    aktualisGyozelemMod = kod;
    const select = document.getElementById('gyozelemModSelect');
    if (select) select.value = kod;

    const badge = document.getElementById('winTypeBadge');
    if (badge) {
        if (uzenet) {
            badge.style.display = 'inline-block';
            badge.innerText = uzenet;
        } else {
            badge.style.display = 'none';
        }
    }
}

function addPoint(oldal, tipus) {
    if (oldal === 'aka') {
        if (tipus === 'waza-ari') {
            akaWazaari++;
            akaScore += 1;
            if (akaWazaari >= 2) {
                stopTimer();
                kenyszeritettGyoztesId = aktualisMeccs ? aktualisMeccs.competitor1Id : null;
                beallitGyozelemMod('AWASETE', '🔴 AKA NYERT: 2x Waza-ari (Awasete Ippon)!');
            } else if (akaScore > shiroScore) {
                beallitGyozelemMod('WAZAARI', '🔴 AKA Waza-ari előny');
            }
        } else if (tipus === 'ippon') {
            akaScore += 2;
            stopTimer();
            kenyszeritettGyoztesId = aktualisMeccs ? aktualisMeccs.competitor1Id : null;
            beallitGyozelemMod('IPPON', '🔴 AKA NYERT: Egyből Ippon!');
        }
    } else {
        if (tipus === 'waza-ari') {
            shiroWazaari++;
            shiroScore += 1;
            if (shiroWazaari >= 2) {
                stopTimer();
                kenyszeritettGyoztesId = aktualisMeccs ? aktualisMeccs.competitor2Id : null;
                beallitGyozelemMod('AWASETE', '⚪ SHIRO NYERT: 2x Waza-ari (Awasete Ippon)!');
            } else if (shiroScore > akaScore) {
                beallitGyozelemMod('WAZAARI', '⚪ SHIRO Waza-ari előny');
            }
        } else if (tipus === 'ippon') {
            shiroScore += 2;
            stopTimer();
            kenyszeritettGyoztesId = aktualisMeccs ? aktualisMeccs.competitor2Id : null;
            beallitGyozelemMod('IPPON', '⚪ SHIRO NYERT: Egyből Ippon!');
        }
    }
    frissitPontEsBuntetesKijelzo();
    frissitKijelzo();
}

function addPenalty(oldal, tipus) {
    if (oldal === 'aka') {
        if (tipus === 'chui') {
            akaChui++;
            // 3 db Chui = 1 Genten!
            if (akaChui >= 3) {
                akaChui = 0;
                akaGenten++;
            }
        } else if (tipus === 'genten') {
            akaGenten++;
        }
        // 2 Genten = Automatikus leléptetés (Sikaku)!
        if (akaGenten >= 2) {
            stopTimer();
            kenyszeritettGyoztesId = aktualisMeccs ? aktualisMeccs.competitor2Id : null;
            beallitGyozelemMod('SIKAKU', '⚪ SHIRO NYERT: AKA leléptetve (2 Genten)!');
            alert("SIKAKU! AKA elérte a 2 Gentent (leléptetés) -> SHIRO GYŐZÖTT!");
        }
    } else {
        if (tipus === 'chui') {
            shiroChui++;
            // 3 db Chui = 1 Genten!
            if (shiroChui >= 3) {
                shiroChui = 0;
                shiroGenten++;
            }
        } else if (tipus === 'genten') {
            shiroGenten++;
        }
        // 2 Genten = Automatikus leléptetés (Sikaku)!
        if (shiroGenten >= 2) {
            stopTimer();
            kenyszeritettGyoztesId = aktualisMeccs ? aktualisMeccs.competitor1Id : null;
            beallitGyozelemMod('SIKAKU', '🔴 AKA NYERT: SHIRO leléptetve (2 Genten)!');
            alert("SIKAKU! SHIRO elérte a 2 Gentent (leléptetés) -> AKA GYŐZÖTT!");
        }
    }
    frissitPontEsBuntetesKijelzo();
    frissitKijelzo();
}

// Feladta / Nem jelent meg (Kiken) gomb kezelése
function kikenGyoztes(gyoztesOldal, uzenet) {
    if (!aktualisMeccs) return;
    stopTimer();
    if (gyoztesOldal === 'aka') {
        kenyszeritettGyoztesId = aktualisMeccs.competitor1Id;
        beallitGyozelemMod('KIKEN', '🔴 AKA NYERT (' + uzenet + ')');
    } else {
        kenyszeritettGyoztesId = aktualisMeccs.competitor2Id;
        beallitGyozelemMod('KIKEN', '⚪ SHIRO NYERT (' + uzenet + ')');
    }
    frissitKijelzo();
}

function resetFighter(oldal) {
    if (oldal === 'aka') {
        akaWazaari = 0; akaScore = 0; akaChui = 0; akaGenten = 0;
        akaKataAdatok = { pontok: [], minIdx: -1, maxIdx: -1 };
    } else {
        shiroWazaari = 0; shiroScore = 0; shiroChui = 0; shiroGenten = 0;
    }
    kenyszeritettGyoztesId = null;
    beallitGyozelemMod('HANTEI', '');
    frissitPontEsBuntetesKijelzo();
    frissitKijelzo();
}

function frissitPontEsBuntetesKijelzo() {
    document.getElementById('akaScore').innerText = akaScore;
    document.getElementById('shiroScore').innerText = shiroScore;
    document.getElementById('akaChui').innerText = akaChui;
    document.getElementById('akaGenten').innerText = akaGenten;
    document.getElementById('shiroChui').innerText = shiroChui;
    document.getElementById('shiroGenten').innerText = shiroGenten;
}

function kuldesATvnek(kijelzoIdo) {
    const felkeszulElem = document.getElementById('felkeszulText');
    const felkeszulSzoveg = felkeszulElem ? felkeszulElem.innerText : 'Nincs több várakozó mérkőzés.';

    const adatok = {
        akaName: akaNevSzoveg,
        shiroName: shiroNevSzoveg,
        matchInfo: meccsInfoSzoveg,
        nextMatch: felkeszulSzoveg, // <-- Ezt küldjük át pluszban a TV-nek!
        matchType: aktualisMod,
        winType: aktualisGyozelemMod,
        akaScore: akaScore,
        shiroScore: shiroScore,
        akaChui: akaChui,
        akaGenten: akaGenten,
        shiroChui: shiroChui,
        shiroGenten: shiroGenten,
        akaKataAdatok: akaKataAdatok,
        timerDisplay: kijelzoIdo
    };
    localStorage.setItem('tatamiAdatok', JSON.stringify(adatok));
}

// --- IDŐMÉRŐ ---
function startTimer() {
    if (timerInterval !== null) return;
    timerInterval = setInterval(function() {
        if (timeLeft > 0) {
            timeLeft--;
            frissitKijelzo();
        } else {
            stopTimer();
            alert("YAME! Lejárt a küzdőidő!");
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer(ujIdoMasodpercben) {
    stopTimer();
    timeLeft = ujIdoMasodpercben || 120;
    frissitKijelzo();
}

function frissitKijelzo() {
    let percek = Math.floor(timeLeft / 60);
    let masodpercek = timeLeft % 60;
    if (masodpercek < 10) masodpercek = "0" + masodpercek;
    if (percek < 10) percek = "0" + percek;

    let formazottIdo = percek + ":" + masodpercek;
    document.getElementById('timerDisplay').innerText = formazottIdo;
    kuldesATvnek(formazottIdo);
}

// --- MENTÉS ÉS AUTOMATIKUS TOVÁBBLÉPÉS A KÖVETKEZŐ MECCSRE ---
async function meccsMentese() {
    if (!aktualisMeccs) {
        alert("Először válassz ki egy tatamit!");
        return;
    }

    stopTimer();
    let gyoztesId = null;

    if (aktualisMod === 'KATA') {
        if (!akaKataAdatok || !akaKataAdatok.kesz) {
            alert("Kérlek írd be mind az 5 bíró pontszámát a lezárás előtt!");
            return;
        }
        TatamiMaster.mentKataEredmeny(aktualisMeccs.id, aktualisMeccs.competitor1Id, akaKataAdatok);
        gyoztesId = aktualisMeccs.competitor1Id;
    } else {
        const valasztottMod = document.getElementById('gyozelemModSelect').value;

        if (kenyszeritettGyoztesId) {
            gyoztesId = kenyszeritettGyoztesId;
        } else if (akaScore > shiroScore) {
            gyoztesId = aktualisMeccs.competitor1Id;
        } else if (shiroScore > akaScore) {
            gyoztesId = aktualisMeccs.competitor2Id;
        } else {
            const akaNyert = confirm("Döntetlen állás! Bírói döntéssel (Hantei / " + valasztottMod + ") AKA (Piros) nyert?\n\nOK = 🔴 AKA nyert\nMégse = ⚪ SHIRO nyert");
            gyoztesId = akaNyert ? aktualisMeccs.competitor1Id : aktualisMeccs.competitor2Id;
        }

        // Elmentjük a győzelem pontos módját (IPP, AWA, WAZ, HAN, SIK, KIK) a körmérkőzéshez és az ágrajzhoz!
        TatamiMaster.mentKumiteReszletek(aktualisMeccs.id, {
            winType: valasztottMod,
            akaScore: akaScore,
            shiroScore: shiroScore,
            winnerId: gyoztesId
        });
    }

    const frissitettMeccs = {
        id: aktualisMeccs.id,
        categoryId: aktualisMeccs.categoryId,
        tatamiId: aktualisMeccs.tatamiId,
        competitor1Id: aktualisMeccs.competitor1Id,
        competitor2Id: aktualisMeccs.competitor2Id,
        matchOrder: aktualisMeccs.matchOrder,
        isFinished: true,
        winnerId: gyoztesId
    };

    const res = await fetch('https://localhost:7045/api/Matches/' + aktualisMeccs.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(frissitettMeccs)
    });

    if (res.ok) {
        // Ha Kumite egyenes kiesés volt, beírjuk a győztest a következő üres ágra
        if (aktualisMod === 'KUMITE') {
            let kovetkezoUresMeccs = merkozesekLista.find(m =>
                m.categoryId === aktualisMeccs.categoryId &&
                m.id > aktualisMeccs.id &&
                !m.isFinished &&
                (m.competitor1Id === null || m.competitor2Id === null)
            );

            if (kovetkezoUresMeccs) {
                if (kovetkezoUresMeccs.competitor1Id === null) kovetkezoUresMeccs.competitor1Id = gyoztesId;
                else kovetkezoUresMeccs.competitor2Id = gyoztesId;

                await fetch('https://localhost:7045/api/Matches/' + kovetkezoUresMeccs.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kovetkezoUresMeccs)
                });
            }
        }

        if (typeof TatamiMaster !== 'undefined') {
            await TatamiMaster.trigger('meccsLezarva', frissitettMeccs);
        }

        // AUTOMATIKUSAN BETÖLTJÜK A TATAMI KÖVETKEZŐ MÉRKŐZÉSÉT!
        tatamiMeccseinekBetoltese(true);
    }
}