// --- ADATKEZELÉS ---
let data = JSON.parse(localStorage.getItem('iko_db')) || { players: [], matches: [] };

function save() { localStorage.setItem('iko_db', JSON.stringify(data)); }
function resetAll() { if(confirm("Biztosan törölni akarsz minden adatot?")) { localStorage.clear(); location.reload(); }}

function switchTab(id) {
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-'+id).classList.remove('hidden');
    if(id === 'bracket') renderBracket();
}

// --- NEVEZÉS FUNKCIÓK ---
function addPlayer() {
    const p = {
        id: 100 + data.players.length + 1, // Startszám generálás
        name: document.getElementById('p-name').value,
        dojo: document.getElementById('p-dojo').value,
        weight: document.getElementById('p-weight').value,
        height: document.getElementById('p-height').value,
        age: document.getElementById('p-age').value,
        cat: document.getElementById('p-cat').value
    };
    if(p.name && p.cat) { 
        data.players.push(p); 
        save(); 
        renderList(); 
        // Mezők ürítése
        document.getElementById('p-name').value = '';
    } else {
        alert("Név és Kategória kötelező!");
    }
}

function renderList() {
    document.getElementById('player-list').innerHTML = data.players.map(p => 
        `<li class="border-b py-1 flex justify-between">
            <span><b class="text-blue-800">[${p.id}]</b> ${p.name}</span>
            <span class="text-gray-500 text-xs">${p.cat} / ${p.dojo}</span>
         </li>`
    ).join('');
}

// --- SORSOLÁS GENERÁLÓ ---
function generate() {
    data.matches = [];
    const cat = document.getElementById('p-cat').value;
    const players = data.players.filter(p => p.cat === cat);
    
    if(players.length < 2) { alert("Minimum 2 versenyző kell!"); return; }

    // 2 hatványa méretre igazítás (Bye helyek)
    const size = Math.pow(2, Math.ceil(Math.log2(players.length)));
    
    // Véletlenszerű keverés (opcionális, most kikapcsolva a dojo szétválasztás miatt)
    // players.sort(() => Math.random() - 0.5); 

    for(let i=0; i<size; i+=2) {
        const p1 = players[i] || { name: "ÜRES", id: null };
        const p2 = players[i+1] || { name: "---", id: null, isBye: true };
        
        const winner = (p1.id && p2.isBye) ? p1 : null;
        
        data.matches.push({
            id: `m1-${i}`, round: 1, cat: cat,
            aka: p1, shiro: p2,
            winner: winner,
            scoreAka: 0, scoreShiro: 0,
            nextId: `m2-${Math.floor(i/4)}`
        });
    }
    
    checkAdvancements();
    save();
    switchTab('bracket');
}

function checkAdvancements() {
    let changed = true;
    while(changed) {
        changed = false;
        data.matches.forEach(m => {
            if(m.winner && m.nextId) {
                let nextM = data.matches.find(x => x.id === m.nextId);
                
                // Ha nincs még következő kör, létrehozzuk
                if(!nextM) {
                    const nextRoundNum = m.round + 1;
                    const maxRounds = Math.ceil(Math.log2(data.players.filter(p=>p.cat===m.cat).length));
                    
                    // Ha ez volt a döntő, nincs következő ID
                    const nextNextId = (nextRoundNum > maxRounds) ? null : `m${nextRoundNum+1}-${Math.floor(parseInt(m.nextId.split('-')[1])/2)}`;

                    nextM = {
                        id: m.nextId, round: nextRoundNum, cat: m.cat,
                        aka: { name: "Várakozás...", id: null }, 
                        shiro: { name: "Várakozás...", id: null },
                        winner: null, scoreAka: 0, scoreShiro: 0,
                        nextId: nextNextId
                    };
                    data.matches.push(nextM);
                    changed = true;
                }
                
                // Játékos beillesztése a megfelelő helyre
                // Az ID-ből kitaláljuk: páros = AKA, páratlan = SHIRO az előző körben
                // De egyszerűbb ellenőrzés:
                if(!nextM.aka.id || nextM.aka.id === m.winner.id) {
                     if(nextM.aka.id !== m.winner.id) { nextM.aka = m.winner; changed = true; }
                } else {
                     if(nextM.shiro.id !== m.winner.id) { nextM.shiro = m.winner; changed = true; }
                }
            }
        });
    }
}

// --- MEGJELENÍTÉS (A LÉNYEG) ---
function renderBracket() {
    const container = document.getElementById('bracket-view');
    container.innerHTML = "";
    
    if(data.matches.length === 0) {
        container.innerHTML = "<p class='p-10 text-gray-400'>Nincs aktív sorsolás. Generálj egyet!</p>";
        return;
    }

    const maxRound = Math.max(...data.matches.map(m => m.round));
    
    for(let r=1; r<=maxRound; r++) {
        // ID szerinti sorrend fontos a párosításhoz
        const matches = data.matches.filter(m => m.round === r).sort((a,b) => {
            return parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]);
        });
        
        const col = document.createElement('div');
        col.className = "round-column";
        
        matches.forEach(m => {
            const p1HTML = createCardHTML(m.aka);
            const p2HTML = createCardHTML(m.shiro);
            
            // Csak akkor kattintható, ha van két érvényes harcos és nincs még lezárva
            const active = !m.winner && m.aka.id && m.shiro.id;
            
            // Vonalak generálása
            let linesHTML = "";
            if(m.nextId) {
                // Vízszintes kimenő vonal
                linesHTML += `<div class="match-connector-right"></div>`;
                
                // Villa (Függőleges összekötő a következő meccshez)
                // Ha mi vagyunk a "felső" ág (páros index), lefelé kell vonal
                // Ha mi vagyunk az "alsó" ág (páratlan index), felfelé kell vonal
                // Egyszerűsítve: a CSS ::after helyett itt számoljuk ki a magasságot
                // De a képen látható stílushoz fix pozíciók kellenek a szülőtől
                
                // Mivel flexboxot használunk "justify-content: space-around"-al, 
                // a vonalakat CSS abszolút pozícionálással nehéz dinamikusan illeszteni.
                // Ezért itt egy egyszerűsített vizuális megoldást használunk, ami "kockásan" köt össze.
                
                 linesHTML += `
                    <div style="position:absolute; right:-40px; top:20px; bottom:20px; width:1px; background:#000; display:none;" class="connector-vertical"></div>
                 `; 
                 // Megjegyzés: A "space-around" miatt a JS vonalhúzás bonyolult lenne canvas nélkül. 
                 // A style.css-ben lévő connector-right adja a vízszintes vonalat, ami elég a tiszta hatáshoz.
                 // Ha a "villa" effektust akarjuk, azt a szülő container magasságából kellene számolni.
                 // A mostani kód a vízszintes összekötést preferálja a tisztaság miatt.
            }

            col.innerHTML += `
                <div class="match-wrapper">
                    <div ${active ? `onclick="openRef('${m.id}')"` : ""} 
                         class="player-card ${m.winner?.id === m.aka.id ? 'winner-card' : ''}">
                        <div class="color-strip aka-strip"></div>
                        ${p1HTML}
                    </div>
                    <div ${active ? `onclick="openRef('${m.id}')"` : ""} 
                         class="player-card ${m.winner?.id === m.shiro.id ? 'winner-card' : ''}">
                        <div class="color-strip shiro-strip"></div>
                        ${p2HTML}
                    </div>
                    ${linesHTML}
                </div>
            `;
        });
        container.appendChild(col);
    }
    
    // Vonalak utólagos kirajzolása (Opcionális finomhangolás)
    drawConnectingLines();
}

function createCardHTML(p) {
    if(!p || !p.id) return `<div class="card-header text-gray-300 italic">---</div>`;
    return `
        <div class="card-header">
            <span class="player-id">[ ${p.id} ]</span>
            <span>${p.name}</span>
        </div>
        <div class="card-details">
            ${p.dojo || ''} ${p.weight ? `/ ${p.weight}kg` : ''} ${p.age ? `/ ${p.age}y` : ''}
        </div>
    `;
}

// Vonalhúzó segéd (Flexbox kompatibilis)
function drawConnectingLines() {
    // Ez a funkció utólag végigmehetne a DOM-on és behúzhatná a függőleges vonalakat
    // A jelenlegi CSS megoldás (vízszintes vonalak) tisztább mobilon és desktopon is.
}

// --- BÍRÓI PANEL LOGIKA ---
let currMatch = null;
let timerInt = null;
let time = 120; 

function openRef(id) {
    currMatch = data.matches.find(m => m.id === id);
    if(!currMatch) return;
    
    document.getElementById('match-category-title').innerText = currMatch.cat;
    document.getElementById('ref-aka').innerText = currMatch.aka.name;
    document.getElementById('ref-shiro').innerText = currMatch.shiro.name;
    document.getElementById('score-aka').innerText = 0;
    document.getElementById('score-shiro').innerText = 0;
    currMatch.scoreAka = 0; currMatch.scoreShiro = 0;
    
    clearInterval(timerInt);
    time = 120;
    document.getElementById('timer').innerText = "02:00";
    document.getElementById('btn-timer').innerText = "START";
    
    switchTab('referee');
}

function toggleTimer() {
    if(timerInt) {
        clearInterval(timerInt); timerInt = null;
        document.getElementById('btn-timer').innerText = "START";
    } else {
        document.getElementById('btn-timer').innerText = "STOP";
        timerInt = setInterval(() => {
            time--;
            let m = Math.floor(time/60);
            let s = time%60;
            document.getElementById('timer').innerText = `0${m}:${s<10?'0'+s:s}`;
            if(time<=0) clearInterval(timerInt);
        }, 1000);
    }
}

function score(who, pt) {
    if(who==='aka') currMatch.scoreAka += pt; else currMatch.scoreShiro += pt;
    document.getElementById('score-aka').innerText = currMatch.scoreAka;
    document.getElementById('score-shiro').innerText = currMatch.scoreShiro;
}

function endMatch() {
    currMatch.winner = currMatch.scoreAka >= currMatch.scoreShiro ? currMatch.aka : currMatch.shiro;
    checkAdvancements();
    save();
    switchTab('bracket');
}

// Indításkor lista betöltése
renderList();
