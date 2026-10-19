window.addEventListener('DOMContentLoaded', function() {
    tvKijelzoFrissites();
    // Azonnali frissítés, ha a másik ablakban (Bírói panelen) változik a localStorage
    window.addEventListener('storage', tvKijelzoFrissites);
    // Biztonsági folyamatos frissítés 250ms-onként
    setInterval(tvKijelzoFrissites, 250);
});

function tvKijelzoFrissites() {
    const nyers = localStorage.getItem('tatamiAdatok');
    if (!nyers) return;

    let adatok = {};
    try {
        adatok = JSON.parse(nyers);
    } catch (e) {
        return;
    }

    // 1. Felső kategória és mérkőzés információ
    const matchInfoEl = document.getElementById('tvMatchInfo');
    if (matchInfoEl) {
        matchInfoEl.innerText = adatok.matchInfo || 'TATAMI MASTER — ÉLŐ KÖVETÉS';
    }

    // 2. Alsó "Felkészül" sáv
    const nextBarEl = document.getElementById('tvNextMatchBar');
    if (nextBarEl) {
        nextBarEl.innerText = adatok.nextMatchInfo || '⏳ FELKÉSZÜL: Várakozás a következő mérkőzésre...';
    }

    // 3. Üzemmód váltás (KUMITE vs. KATA)
    const kumiteView = document.getElementById('tvKumiteView');
    const kataView = document.getElementById('tvKataView');
    const isKata = (adatok.mode && adatok.mode.toUpperCase() === 'KATA');

    if (kumiteView && kataView) {
        kumiteView.style.display = isKata ? 'none' : 'grid';
        kataView.style.display = isKata ? 'flex' : 'none';
    }

    // 4. KUMITE adatok frissítése
    const akaNameEl = document.getElementById('tvAkaName');
    const shiroNameEl = document.getElementById('tvShiroName');
    const akaScoreEl = document.getElementById('tvAkaScore');
    const shiroScoreEl = document.getElementById('tvShiroScore');
    const akaPenEl = document.getElementById('tvAkaPenalties');
    const shiroPenEl = document.getElementById('tvShiroPenalties');
    const timerEl = document.getElementById('tvTimer');

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
            // A kieső legkisebb és legnagyobb pontszámot áthúzzuk és elhalványítjuk a TV-n is!
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
    if (b === 1) return '⚠️ 1x Chui (Figyelmeztetés)';
    if (b === 2) return '⚠️ 2x Chui (Figyelmeztetés)';
    if (b === 3) return '🚫 1x GENTEN (3. Chui)';
    return '❌ SIKAKU (2x Genten - Kizárás!)';
}