/* ========================================================================= */
/* KUMITE.js - Bírói Panel, Okos Időzítő és Visszavonás (Undo/Redo) Memória  */
/* ========================================================================= */

// --- HIÁNYZÓ ALAPVÁLTOZÓK PÓTOLVA ---
var aktualisMeccs = null;
var idozitoInterval = null;
var ido = 0;

// --- ÚJ: VISSZAVONÁS MEMÓRIA LOGIKA ---
var meccsHistoria = [];
var aktualisHistoriaIndex = -1;
var aktMeccsHistoriaId = null;

function mentsAllapot(elotte) {
    if (!aktualisMeccs) return;

    if (aktMeccsHistoriaId !== aktualisMeccs.id) {
        meccsHistoria = [];
        aktualisHistoriaIndex = -1;
        aktMeccsHistoriaId = aktualisMeccs.id;

        meccsHistoria.push(JSON.parse(JSON.stringify(elotte)));
        aktualisHistoriaIndex = 0;
    }

    if (aktualisHistoriaIndex < meccsHistoria.length - 1) {
        meccsHistoria = meccsHistoria.slice(0, aktualisHistoriaIndex + 1);
    }

    meccsHistoria.push(JSON.parse(JSON.stringify(aktualisMeccs)));
    aktualisHistoriaIndex++;
}

function visszavonasAkcio() {
    if (aktualisHistoriaIndex > 0) {
        aktualisHistoriaIndex--;
        var visszavontAllapot = meccsHistoria[aktualisHistoriaIndex];

        Object.keys(visszavontAllapot).forEach(key => {
            aktualisMeccs[key] = visszavontAllapot[key];
        });
        frissitBiroiFeluletet();
    } else {
        alert("Nincs több visszavonható lépés!");
    }
}

function ujraAkcio() {
    if (aktualisHistoriaIndex < meccsHistoria.length - 1) {
        aktualisHistoriaIndex++;
        var ujraAllapot = meccsHistoria[aktualisHistoriaIndex];

        Object.keys(ujraAllapot).forEach(key => {
            aktualisMeccs[key] = ujraAllapot[key];
        });
        frissitBiroiFeluletet();
    } else {
        alert("Nincs mit újra végrehajtani!");
    }
}

function getMeccsIdo(kategoriaNev, isHosszabbitas, isElodontoVagyDonto) {
    var n = kategoriaNev.toLowerCase();

    if (isHosszabbitas) {
        if (n.includes('8-9')) return 60;
        if (n.includes('10-11') || n.includes('12-13') || n.includes('35-44') || n.includes('45+') || n.includes('35+')) return 90;
        return 120;
    }

    if (n.includes('8-9')) return 60;
    if (n.includes('10-11') || n.includes('12-13')) return 90;
    if (n.includes('14-15') || n.includes('16-17')) return 120;
    if (n.includes('35-44') || n.includes('45+') || n.includes('35+')) return 90;

    var isFelnott = (n.includes('18-34') || n.includes('felnott') || n.includes('felnőtt') || n.includes('senior') || n.includes('szenior') || n.includes('adult'));
    if (isFelnott) {
        if (isElodontoVagyDonto) return 180;
        return 120;
    }

    return 120;
}

function nyitBiroiPanelt(id) {
    aktualisMeccs = adatok.meccsek.find(m => m.id === id);
    if (!aktualisMeccs) return;

    if (aktualisMeccs.wazaariAka === undefined) {
        aktualisMeccs.wazaariAka = 0; aktualisMeccs.wazaariShiro = 0;
        aktualisMeccs.ipponAka = 0; aktualisMeccs.ipponShiro = 0;
        aktualisMeccs.chuiAka = 0; aktualisMeccs.chuiShiro = 0;
        aktualisMeccs.gentenAka = 0; aktualisMeccs.gentenShiro = 0;
        aktualisMeccs.hosszabbitasok = 0;
    }

    var isElodontoVagyDonto = false;
    var cimKiegeszites = "";
    if (!aktualisMeccs.isRoundRobin) {
        if (aktualisMeccs.nextId === null) {
            isElodontoVagyDonto = true;
            cimKiegeszites = " (🏆 DÖNTŐ)";
        } else {
            var nextMatch = adatok.meccsek.find(x => x.id === aktualisMeccs.nextId);
            if (nextMatch && nextMatch.nextId === null) {
                isElodontoVagyDonto = true;
                cimKiegeszites = " (⚔️ ELŐDÖNTŐ)";
            }
        }
    }

    document.getElementById('match-title').innerText = aktualisMeccs.kategoria + cimKiegeszites;
    document.getElementById('aka-name').innerText = aktualisMeccs.aka.nev;
    document.getElementById('shiro-name').innerText = aktualisMeccs.shiro.nev;

    var katObj = OSSZES_KATEGORIA.find(k => k.nev === aktualisMeccs.kategoria);
    var aktTatami = katObj ? katObj.tatami : null;
    var kovetkezoMeccs = null;

    if (aktTatami) {
        var sorszamTerkepe = generalTatamiSorszamTerkepe(aktTatami);

        var aktSorszamSzoveg = sorszamTerkepe[aktualisMeccs.id] ? "MECCS #" + sorszamTerkepe[aktualisMeccs.id] : "KÖR " + aktualisMeccs.round;
        var currentMatchNumElem = document.getElementById('current-match-number');
        if (currentMatchNumElem) currentMatchNumElem.innerText = aktSorszamSzoveg;

        var tatamiMeccsek = [];
        var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === aktTatami && !k.nev.toLowerCase().includes('kata'));

        tatamiKategoriak.forEach(kat => {
            if (adatok.meccsek) {
                var katMeccsei = adatok.meccsek.filter(m =>
                    m.kategoria === kat.nev &&
                    m.winner === null &&
                    m.id !== aktualisMeccs.id &&
                    m.aka && m.aka.nev !== "BYE" && m.aka.id !== null &&
                    m.shiro && m.shiro.nev !== "BYE" && m.shiro.id !== null
                );
                tatamiMeccsek = tatamiMeccsek.concat(katMeccsei);
            }
        });

        tatamiMeccsek.sort((a, b) => {
            var sA = sorszamTerkepe[a.id] || 999999;
            var sB = sorszamTerkepe[b.id] || 999999;
            return sA - sB;
        });

        if (tatamiMeccsek.length > 0) kovetkezoMeccs = tatamiMeccsek[0];
    } else {
        var currentMatchNumElem = document.getElementById('current-match-number');
        if (currentMatchNumElem) currentMatchNumElem.innerText = "KÖR " + aktualisMeccs.round;
    }

    var nextAkaElem = document.getElementById('next-aka-name');
    var nextShiroElem = document.getElementById('next-shiro-name');
    var warningElem = document.getElementById('next-category-warning');
    var nextCatNameElem = document.getElementById('next-category-name');

    if (kovetkezoMeccs) {
        if (nextAkaElem) nextAkaElem.innerText = kovetkezoMeccs.aka.nev;
        if (nextShiroElem) nextShiroElem.innerText = kovetkezoMeccs.shiro.nev;

        if (kovetkezoMeccs.kategoria !== aktualisMeccs.kategoria) {
            if (warningElem) warningElem.style.display = "block";
            if (nextCatNameElem) nextCatNameElem.innerText = kovetkezoMeccs.kategoria;
        } else {
            if (warningElem) warningElem.style.display = "none";
        }
    } else {
        if (nextAkaElem) nextAkaElem.innerText = "- Nincs több -";
        if (nextShiroElem) nextShiroElem.innerText = "- Nincs több -";
        if (warningElem) warningElem.style.display = "none";
    }

    frissitBiroiFeluletet();

    // Itt omlott össze korábban a rendszer, mert az idozitoInterval nem létezett!
    if (idozitoInterval) {
        clearInterval(idozitoInterval);
        idozitoInterval = null;
    }

    ido = getMeccsIdo(aktualisMeccs.kategoria, aktualisMeccs.hosszabbitasok > 0, isElodontoVagyDonto);
    frissitIdozitoFeluletet();

    var btn = document.getElementById('btn-timer');
    if (btn) btn.innerText = "START";

    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById('tab-referee').classList.remove('hidden');

    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
}

function inditsdHosszabbitast() {
    if (!aktualisMeccs) return;

    var isElodontoVagyDonto = false;
    if (!aktualisMeccs.isRoundRobin) {
        if (aktualisMeccs.nextId === null) isElodontoVagyDonto = true;
        else {
            var nextMatch = adatok.meccsek.find(x => x.id === aktualisMeccs.nextId);
            if (nextMatch && nextMatch.nextId === null) isElodontoVagyDonto = true;
        }
    }

    var n = aktualisMeccs.kategoria.toLowerCase();
    var isFelnott = (n.includes('18-34') || n.includes('felnott') || n.includes('felnőtt') || n.includes('senior') || n.includes('szenior') || n.includes('adult'));

    var maxHosszabbitas = 1;
    if (isFelnott && isElodontoVagyDonto) {
        maxHosszabbitas = 3;
    }

    if ((aktualisMeccs.hosszabbitasok || 0) >= maxHosszabbitas) {
        alert("NINCS TÖBB HOSSZABBÍTÁS!\nElértétek a maximális keretet (" + maxHosszabbitas + " ráadás).\nMost már kötelező bírói döntést (Hantei) hozni!");
        return;
    }

    var hanyadik = (aktualisMeccs.hosszabbitasok || 0) + 1;
    var msg = "Biztosan elindítod a(z) " + hanyadik + ". hosszabbítást (Encho-Sen)?\nEz lenullázza az eddigi pontokat!";

    var biztos = confirm(msg);
    if (biztos) {
        var elotte = JSON.parse(JSON.stringify(aktualisMeccs));
        
        aktualisMeccs.hosszabbitasok = (aktualisMeccs.hosszabbitasok || 0) + 1;
        aktualisMeccs.scoreAka = 0; aktualisMeccs.scoreShiro = 0;
        aktualisMeccs.wazaariAka = 0; aktualisMeccs.wazaariShiro = 0;
        aktualisMeccs.ipponAka = 0; aktualisMeccs.ipponShiro = 0;
        
        mentsAllapot(elotte);
        frissitBiroiFeluletet();

        ido = getMeccsIdo(aktualisMeccs.kategoria, true, isElodontoVagyDonto);
        if (idozitoInterval) { clearInterval(idozitoInterval); idozitoInterval = null; }
        document.getElementById('btn-timer').innerText = "START";
        frissitIdozitoFeluletet();
    }
}

function pontszamAdas(oldal, pont) {
    var elotte = JSON.parse(JSON.stringify(aktualisMeccs));

    if (oldal === 'aka') {
        if (pont === 1) aktualisMeccs.wazaariAka = (aktualisMeccs.wazaariAka || 0) + 1;
        if (pont === 2) aktualisMeccs.ipponAka = (aktualisMeccs.ipponAka || 0) + 1;
        aktualisMeccs.scoreAka = Math.min(aktualisMeccs.scoreAka + pont, 2);
    } else {
        if (pont === 1) aktualisMeccs.wazaariShiro = (aktualisMeccs.wazaariShiro || 0) + 1;
        if (pont === 2) aktualisMeccs.ipponShiro = (aktualisMeccs.ipponShiro || 0) + 1;
        aktualisMeccs.scoreShiro = Math.min(aktualisMeccs.scoreShiro + pont, 2);
    }

    mentsAllapot(elotte);
    frissitBiroiFeluletet();
}

function pontTorles(oldal) {
    if (oldal === 'aka' && aktualisMeccs.scoreAka > 0) {
        aktualisMeccs.scoreAka--;
        if (aktualisMeccs.wazaariAka > 0) aktualisMeccs.wazaariAka--;
    } else if (oldal === 'shiro' && aktualisMeccs.scoreShiro > 0) {
        aktualisMeccs.scoreShiro--;
        if (aktualisMeccs.wazaariShiro > 0) aktualisMeccs.wazaariShiro--;
    }
    frissitBiroiFeluletet();
}

function buntetesAdas(oldal, tipus) {
    var elotte = JSON.parse(JSON.stringify(aktualisMeccs));

    if (oldal === 'aka') {
        if (tipus === 'c') { aktualisMeccs.chuiAka++; if (aktualisMeccs.chuiAka >= 3) { aktualisMeccs.chuiAka = 0; aktualisMeccs.gentenAka++; } }
        else if (tipus === 'g1') { aktualisMeccs.chuiAka = 0; aktualisMeccs.gentenAka = 1; }
        else if (tipus === 'g2') { aktualisMeccs.chuiAka = 0; aktualisMeccs.gentenAka = 2; }
        
        if (aktualisMeccs.gentenAka >= 2) {
            alert("AKA KIZÁRVA (Hansoku Make)!\nSHIRO nyert, és a kizárt versenyző jövőbeli meccseit is automatikusan nullázzuk!");
            aktualisMeccs.scoreShiro = Math.max(aktualisMeccs.scoreShiro, 2);
            aktualisMeccs.kizartOldal = 'aka';
        }
    } else {
        if (tipus === 'c') { aktualisMeccs.chuiShiro++; if (aktualisMeccs.chuiShiro >= 3) { aktualisMeccs.chuiShiro = 0; aktualisMeccs.gentenShiro++; } }
        else if (tipus === 'g1') { aktualisMeccs.chuiShiro = 0; aktualisMeccs.gentenShiro = 1; }
        else if (tipus === 'g2') { aktualisMeccs.chuiShiro = 0; aktualisMeccs.gentenShiro = 2; }
        
        if (aktualisMeccs.gentenShiro >= 2) {
            alert("SHIRO KIZÁRVA (Hansoku Make)!\nAKA nyert, és a kizárt versenyző jövőbeli meccseit is automatikusan nullázzuk!");
            aktualisMeccs.scoreAka = Math.max(aktualisMeccs.scoreAka, 2);
            aktualisMeccs.kizartOldal = 'shiro';
        }
    }

    mentsAllapot(elotte);
    frissitBiroiFeluletet();
}

function befejezMeccset() {
    if (aktualisMeccs.kizartOldal) {
        aktualisMeccs.winner = (aktualisMeccs.kizartOldal === 'aka') ? aktualisMeccs.shiro : aktualisMeccs.aka;
        aktualisMeccs.kizartId = aktualisMeccs[aktualisMeccs.kizartOldal].id;

        var jovoMeccsek = adatok.meccsek.filter(m =>
            m.kategoria === aktualisMeccs.kategoria &&
            m.winner === null &&
            m.id !== aktualisMeccs.id &&
            (m.aka.id === aktualisMeccs.kizartId || m.shiro.id === aktualisMeccs.kizartId)
        );

        jovoMeccsek.forEach(m => {
            m.kizartId = aktualisMeccs.kizartId;
            if (m.aka.id === aktualisMeccs.kizartId) {
                m.scoreAka = 0; m.scoreShiro = 2; m.winner = m.shiro;
            } else {
                m.scoreShiro = 0; m.scoreAka = 2; m.winner = m.aka;
            }
        });
    } else if (aktualisMeccs.scoreAka === aktualisMeccs.scoreShiro) {
        var megerosites = confirm("Döntetlen az állás! Nyomj OK-t a Hantei (Bírói döntés) kiválasztásához!");
        if (!megerosites) return;
        var nyertes = prompt("Írd be a nyertes oldalát: 'aka' vagy 'shiro'");
        if (nyertes === 'aka') aktualisMeccs.winner = aktualisMeccs.aka;
        else if (nyertes === 'shiro') aktualisMeccs.winner = aktualisMeccs.shiro;
        else { alert("Érvénytelen válasz!"); return; }
    } else {
        aktualisMeccs.winner = aktualisMeccs.scoreAka > aktualisMeccs.scoreShiro ? aktualisMeccs.aka : aktualisMeccs.shiro;
    }

    if (!aktualisMeccs.isRoundRobin) ellenorizTovabbjutasokat();
    if (typeof mentsdAzAllapototMySQLbe === "function") mentsdAzAllapototMySQLbe();

    if (aktualisMeccs.nextId === null && aktualisMeccs.winner && !aktualisMeccs.isRoundRobin) {
        fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: aktualisMeccs.winner.id, helyezes: 1, pontszam: 0 }) });
    }

    if (aktualisMeccs.isRoundRobin) {
        var katMeccsek = adatok.meccsek.filter(m => m.kategoria === aktualisMeccs.kategoria);
        var mindKesz = katMeccsek.every(m => m.winner !== null);
        if (mindKesz) {
            var tabella = generalTabella(aktualisMeccs.kategoria);
            if (tabella[0]) fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: tabella[0].id, helyezes: 1, pontszam: tabella[0].P }) });
            if (tabella[1]) fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: tabella[1].id, helyezes: 2, pontszam: tabella[1].P }) });
            if (tabella[2]) fetch('api.php?akcio=vegeredmenyMentes', { method: 'POST', body: JSON.stringify({ versenyzo_id: tabella[2].id, helyezes: 3, pontszam: tabella[2].P }) });
        }
    }

    rajzolAgrajz();

    var katObj = OSSZES_KATEGORIA.find(k => k.nev === aktualisMeccs.kategoria);
    var aktTatami = katObj ? katObj.tatami : null;
    var kovetkezoMeccsId = null;

    if (aktTatami) {
        mutasdTatamiNezetet(aktTatami, true);
        var sorszamTerkepe = generalTatamiSorszamTerkepe(aktTatami);
        var tatamiMeccsek = [];
        var tatamiKategoriak = OSSZES_KATEGORIA.filter(k => k.tatami === aktTatami && !k.nev.toLowerCase().includes('kata'));

        tatamiKategoriak.forEach(kat => {
            if (adatok.meccsek) {
                var katMeccsei = adatok.meccsek.filter(m =>
                    m.kategoria === kat.nev &&
                    m.winner === null &&
                    m.id !== aktualisMeccs.id &&
                    m.aka && m.aka.nev !== "BYE" && m.aka.id !== null &&
                    m.shiro && m.shiro.nev !== "BYE" && m.shiro.id !== null
                );
                tatamiMeccsek = tatamiMeccsek.concat(katMeccsei);
            }
        });

        tatamiMeccsek.sort((a, b) => {
            var sA = sorszamTerkepe[a.id] || 999999;
            var sB = sorszamTerkepe[b.id] || 999999;
            return sA - sB;
        });

        if (tatamiMeccsek.length > 0) kovetkezoMeccsId = tatamiMeccsek[0].id;
    }

    if (kovetkezoMeccsId) {
        nyitBiroiPanelt(kovetkezoMeccsId);
    } else {
        document.body.style.overflow = "auto";
        document.getElementById('tab-referee').classList.add('hidden');
        document.getElementById('tab-tatami').classList.remove('hidden');
    }
}

function frissitBiroiFeluletet() {
    if (document.getElementById('aka-score'))
        document.getElementById('aka-score').innerText = aktualisMeccs.scoreAka;

    if (document.getElementById('shiro-score'))
        document.getElementById('shiro-score').innerText = aktualisMeccs.scoreShiro;

    var akaPen = document.getElementById('aka-penalties');
    if (akaPen) akaPen.innerHTML = "Chui: " + (aktualisMeccs.chuiAka || 0) + " | Genten: " + (aktualisMeccs.gentenAka || 0);

    var shiroPen = document.getElementById('shiro-penalties');
    if (shiroPen) shiroPen.innerHTML = "Chui: " + (aktualisMeccs.chuiShiro || 0) + " | Genten: " + (aktualisMeccs.gentenShiro || 0);
}

function nullazMeccsPontszamokat() {
    if (confirm("Biztos nullázod a pontokat és büntetéseket?")) {
        var elotte = JSON.parse(JSON.stringify(aktualisMeccs));

        aktualisMeccs.scoreAka = 0; aktualisMeccs.scoreShiro = 0;
        aktualisMeccs.wazaariAka = 0; aktualisMeccs.wazaariShiro = 0;
        aktualisMeccs.ipponAka = 0; aktualisMeccs.ipponShiro = 0;
        aktualisMeccs.chuiAka = 0; aktualisMeccs.chuiShiro = 0;
        aktualisMeccs.gentenAka = 0; aktualisMeccs.gentenShiro = 0;
        delete aktualisMeccs.kizartOldal; delete aktualisMeccs.kizartId;
        aktualisMeccs.hosszabbitasok = 0;

        mentsAllapot(elotte);

        frissitBiroiFeluletet(); 
        if (idozitoInterval) { clearInterval(idozitoInterval); idozitoInterval = null; }

        var isElodontoVagyDonto = false;
        if (!aktualisMeccs.isRoundRobin) {
            if (aktualisMeccs.nextId === null) isElodontoVagyDonto = true;
            else {
                var nextMatch = adatok.meccsek.find(x => x.id === aktualisMeccs.nextId); if (nextMatch && nextMatch.nextId === null) isElodontoVagyDonto = true;
            }
        }
        ido = getMeccsIdo(aktualisMeccs.kategoria, false, isElodontoVagyDonto);
        frissitIdozitoFeluletet();
    }
}

function kapcsolIdozitot() {
    if (idozitoInterval) {
        clearInterval(idozitoInterval); idozitoInterval = null; document.getElementById('btn-timer').innerText = "START";
    }
    else {
        document.getElementById('btn-timer').innerText = "STOP";
        idozitoInterval = setInterval(() => {
            ido--; frissitIdozitoFeluletet();
            if (ido <= 0) { clearInterval(idozitoInterval); idozitoInterval = null; alert("Idő!"); document.getElementById('btn-timer').innerText = "START"; }
        }, 1000);
    }
}

function frissitIdozitoFeluletet() {
    document.getElementById('timer').innerText = Math.floor(ido / 60) + ':' + (ido % 60 < 10 ? '0' : '') + ido % 60;
}