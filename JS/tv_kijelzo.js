setInterval(function() {
    const adatokString = localStorage.getItem('tatamiAdatok');
    if (!adatokString) return;

    const adatok = JSON.parse(adatokString);
    const isKata = (adatok.matchType === 'KATA');

    document.getElementById('tvAkaScore').innerText = adatok.akaScore;
    document.getElementById('tvShiroScore').innerText = adatok.shiroScore;
    document.getElementById('tvTimerDisplay').innerText = adatok.timerDisplay;

    if (adatok.akaName) document.getElementById('tvAkaName').innerText = adatok.akaName;
    if (adatok.shiroName) document.getElementById('tvShiroName').innerText = adatok.shiroName;
    if (adatok.matchInfo) document.getElementById('tvMatchInfo').innerText = adatok.matchInfo;
    if (adatok.nextMatch) document.getElementById('tvNextMatchText').innerText = adatok.nextMatch;

    // KATA módban csak 1 kártya látszik a TV-n (a versenyző egyedül áll a tatamin)
    const shiroCard = document.querySelector('.shiro-card');
    if (shiroCard) shiroCard.style.display = isKata ? 'none' : 'flex';

    const akaTitle = document.querySelector('.aka-card .fighter-title');
    if (akaTitle) akaTitle.innerText = isKata ? 'KATA VERSENYZŐ' : 'AKA (Piros)';

    document.getElementById('tvTimerDisplay').style.display = isKata ? 'none' : 'block';
    document.getElementById('tvKataModeBadge').style.display = isKata ? 'block' : 'none';
    document.getElementById('tvAkaPenalties').style.display = isKata ? 'none' : 'flex';

    const tvAkaJudges = document.getElementById('tvAkaJudges');
    if (isKata && adatok.akaKataAdatok) {
        tvAkaJudges.style.display = 'flex';
        let k = adatok.akaKataAdatok;
        let html = '';
        for (let i = 0; i < 5; i++) {
            let p = (k.pontok && k.pontok[i] !== null && k.pontok[i] !== undefined) ? parseFloat(k.pontok[i]).toFixed(1) : '-';
            let kieso = (i === k.minIdx || i === k.maxIdx) ? 'dropped' : '';
            let cimke = (i === 0) ? 'B1 (Vez.)' : ('B' + (i + 1));
            html += '<div class="tv-judge-box ' + kieso + '"><small style="display:block;font-size:0.75rem;color:#ffc107;">' + cimke + '</small>' + p + '</div>';
        }
        tvAkaJudges.innerHTML = html;
    } else if (tvAkaJudges) {
        tvAkaJudges.style.display = 'none';
        document.getElementById('tvAkaChui').innerText = adatok.akaChui || 0;
        document.getElementById('tvAkaGenten').innerText = adatok.akaGenten || 0;
        document.getElementById('tvShiroChui').innerText = adatok.shiroChui || 0;
        document.getElementById('tvShiroGenten').innerText = adatok.shiroGenten || 0;
    }
}, 500);