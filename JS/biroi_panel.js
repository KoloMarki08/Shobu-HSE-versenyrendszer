let akaScore = 0;
let shiroScore = 0;
let timeLeft = 120;
let timerInterval = null;

// Oldal betöltésekor egyből kiküldjük az alap adatokat a TV-nek
window.onload = function() {
    frissitKijelzo();
};

// Ez a függvény felel a TV és a Vezérlő szinkronizálásáért
function kuldesATvnek(kijelzoIdo) {
    const adatok = {
        akaScore: akaScore,
        shiroScore: shiroScore,
        timerDisplay: kijelzoIdo
    };
    
    // Beleírjuk a böngésző helyi memóriájába
    localStorage.setItem('tatamiAdatok', JSON.stringify(adatok));
}

function addPoint(oldal, tipus) {
    let pont = tipus === 'waza-ari' ? 1 : 2;

    if (oldal === 'aka') {
        akaScore += pont;
        document.getElementById('akaScore').innerText = akaScore;
    } else if (oldal === 'shiro') {
        shiroScore += pont;
        document.getElementById('shiroScore').innerText = shiroScore;
    }
    frissitKijelzo();
}

function resetPoint(oldal) {
    if (oldal === 'aka') {
        akaScore = 0;
        document.getElementById('akaScore').innerText = akaScore;
    } else {
        shiroScore = 0;
        document.getElementById('shiroScore').innerText = shiroScore;
    }
    frissitKijelzo();
}

// --- IDŐMÉRŐ FUNKCIÓK ---
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

function resetTimer() {
    stopTimer();
    timeLeft = 120; 
    frissitKijelzo();
}

function frissitKijelzo() {
    let percek = Math.floor(timeLeft / 60);
    let masodpercek = timeLeft % 60;

    if (masodpercek < 10) masodpercek = "0" + masodpercek;
    if (percek < 10) percek = "0" + percek;

    let formzottIdo = percek + ":" + masodpercek;
    
    // Helyi (Vezérlő) idő frissítése
    document.getElementById('timerDisplay').innerText = formzottIdo;
    
    // Adatok fellövése a TV-nek
    kuldesATvnek(formzottIdo);
}