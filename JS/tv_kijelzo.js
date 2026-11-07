const tvUrlParams = new URLSearchParams(window.location.search);
const tvTatamiId = tvUrlParams.get('tatami'); // Pl. ?tatami=1 vagy üres (legutóbbi aktív tatami)

window.addEventListener('DOMContentLoaded', function() {
    tvKijelzoFrissites();
    window.addEventListener('storage', tvKijelzoFrissites);

    if (typeof TatamiMaster !== 'undefined') {
        TatamiMaster.on('liveTatamiFrissult', function() {
            tvKijelzoFrissites();
        });
        TatamiMaster.on('liveKapcsolatValtozott', function(st) {
            const dot = document.getElementById('tvLiveSyncDot');
            if (dot) {
                dot.innerText = st && st.connected ? 'ÉLŐ SZINKRON AKTÍV' : 'HELYI SZINKRON';
                dot.style.color = st && st.connected ? '#18181B' : '#71717A';
            }
        });
    }

    setInterval(tvKijelzoFrissites, 250);
});

function tvKijelzoFrissites() {
    let adatok = null;
    if (typeof TatamiMaster !== 'undefined') {
        adatok = TatamiMaster.lekerLiveTatamiAllapot(tvTatamiId);
    } else {
        const nyers = localStorage.getItem(tvTatamiId ? ('tatamiAdatok_' + tvTatamiId) : 'tatamiAdatok') || localStorage.getItem('tatamiAdatok');
        if (nyers) {
            try { adatok = JSON.parse(nyers); } catch (e) {}
        }
    }
    if (!adatok) return;

    // 1. Felső kategória és mérkőzés információ
    const matchInfoEl = document.getElementById('tvMatchInfo');
    if (matchInfoEl) {
        matchInfoEl.innerText = adatok.matchInfo || 'TATAMI MASTER — ÉLŐ KÖVETÉS';
    }

    // 2. Alsó "Felkészül" sáv
    const nextBarEl = document.getElementById('tvNextMatchBar');
    if (nextBarEl) {
        nextBarEl.innerText = adatok.nextMatchInfo || 'FELKÉSZÜL: Várakozás a következő mérkőzésre...';
    }

    // 3. Üzemmód váltás (KUMITE vs. KATA)
    const kumiteView = document.getElementById('tvKumiteView');
    const kataView = document.getElementById('tvKataView');
    const isKata = (adatok.mode && adatok.mode.toUpperCase() === 'KATA');

    if (kumiteView && kataView) {
        kumiteView.style.display = isKata ? 'none' : 'grid';
        kataView.style.display = isKata ? 'flex' : 'none';
    }

    // 4. KUMITE adatok, hosszabbítás és mérlegelés fázis frissítése
    const akaNameEl = document.getElementById('tvAkaName');
    const shiroNameEl = document.getElementById('tvShiroName');
    const akaScoreEl = document.getElementById('tvAkaScore');
    const shiroScoreEl = document.getElementById('tvShiroScore');
    const akaPenEl = document.getElementById('tvAkaPenalties');
    const shiroPenEl = document.getElementById('tvShiroPenalties');
    const timerEl = document.getElementById('tvTimer');
    const roundBadgeEl = document.getElementById('tvRoundBadge');
    const ruleLabelEl = document.getElementById('tvRuleLabel');

    if (akaNameEl) akaNameEl.innerText = adatok.akaName || 'AKA Versenyző';
    if (shiroNameEl) shiroNameEl.innerText = adatok.shiroName || 'SHIRO Versenyző';
    if (akaScoreEl) akaScoreEl.innerText = adatok.akaScore !== undefined ? adatok.akaScore : 0;
    if (shiroScoreEl) shiroScoreEl.innerText = adatok.shiroScore !== undefined ? adatok.shiroScore : 0;

    if (akaPenEl) {
        akaPenEl.innerText = formazBuntetesSzoveg(adatok.akaPenalties || 0);
    }
    if (shiroPenEl) {
        shiroPenEl.innerText = formazBuntetesSzoveg(adatok.shiroPenalties || 0);
    }
    if (timerEl) {
        timerEl.innerText = adatok.timer || '02:00';
        const rem = parseInt(adatok.remainingSeconds);
        if (!isNaN(rem) && rem > 0 && rem <= 15 && adatok.roundCode !== 'MERLEGELES') {
            timerEl.classList.add('warning-15s');
        } else {
            timerEl.classList.remove('warning-15s');
        }
    }

    if (roundBadgeEl) {
        const rLabel = adatok.roundLabel || 'ALAPIDŐ';
        roundBadgeEl.innerText = rLabel;
        if (adatok.roundCode && adatok.roundCode !== 'ALAP') {
            roundBadgeEl.classList.add('overtime');
        } else {
            roundBadgeEl.classList.remove('overtime');
        }
    }

    if (ruleLabelEl) {
        if (adatok.roundCode === 'MERLEGELES' && (adatok.weighInAkaKg || adatok.weighInShiroKg)) {
            ruleLabelEl.style.display = 'block';
            ruleLabelEl.innerText = `AKA: ${adatok.weighInAkaKg || '?'} kg  |  SHIRO: ${adatok.weighInShiroKg || '?'} kg`;
        } else if (adatok.ruleLabel) {
            ruleLabelEl.style.display = 'block';
            ruleLabelEl.innerText = adatok.ruleLabel;
        } else {
            ruleLabelEl.style.display = 'none';
        }
    }

    // 5. KATA adatok frissítése
    const kataNameEl = document.getElementById('tvKataName');
    const kataTotalEl = document.getElementById('tvKataTotal');
    if (kataNameEl) kataNameEl.innerText = adatok.akaName || 'Katázó Versenyző';
    if (kataTotalEl) kataTotalEl.innerText = adatok.kataTotal || '0.0';

    const kataScores = adatok.kataScores || ['-', '-', '-', '-', '-'];
    const minIdx = adatok.kataMinIdx !== undefined ? adatok.kataMinIdx : -1;
    const maxIdx = adatok.kataMaxIdx !== undefined ? adatok.kataMaxIdx : -1;

    for (let i = 0; i < 5; i++) {
        const bEl = document.getElementById('tvB' + (i + 1));
        if (bEl) {
            const ertek = (kataScores[i] !== undefined && kataScores[i] !== '') ? kataScores[i] : '-';
            bEl.innerText = ertek;
            if (i === minIdx || i === maxIdx) {
                bEl.style.textDecoration = 'line-through';
                bEl.style.opacity = '0.4';
            } else {
                bEl.style.textDecoration = 'none';
                bEl.style.opacity = '1';
            }
        }
    }
}

function formazBuntetesSzoveg(buntetesSzam) {
    const b = parseInt(buntetesSzam) || 0;
    if (b === 0) return 'Büntetés: Nincs (0)';
    if (b === 1) return '1x Chui (Figyelmeztetés)';
    if (b === 2) return '2x Chui (Figyelmeztetés)';
    if (b === 3) return '1x GENTEN (3. Chui)';
    return 'SIKAKU (2x Genten - Kizárás!)';
}
