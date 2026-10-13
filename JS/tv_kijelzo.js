// Fél másodpercenként kiolvassuk a böngésző memóriáját
setInterval(function() {
    // Kikeressük az adatokat, amit a vezérlőpult elmentett
    const adatokString = localStorage.getItem('tatamiAdatok');
    
    if (adatokString) {
        const adatok = JSON.parse(adatokString);
        
        // Frissítjük a TV képernyőjét
        document.getElementById('tvAkaScore').innerText = adatok.akaScore;
        document.getElementById('tvShiroScore').innerText = adatok.shiroScore;
        document.getElementById('tvTimerDisplay').innerText = adatok.timerDisplay;
    }
}, 500); // 500 milliszekundum (fél mp)