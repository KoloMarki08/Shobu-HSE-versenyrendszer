// --- SZIMULÁLT ADATBÁZISOK ---
const USERS = [
    { username: 'admin', pass: '1234', role: 'admin', dojo: 'HEADQUARTERS', name: 'Fő Admin' },
    { username: 'edzo1', pass: '1234', role: 'coach', dojo: 'Honvéd SE', name: 'Kovács Edző' },
    { username: 'biro',  pass: '1234', role: 'judge', dojo: '-', name: 'Asztalbíró' }
];

let data = JSON.parse(localStorage.getItem('rbac_db')) || { players: [], matches: [] };
let currentUser = null; 

// --- AUTHENTIKÁCIÓ ---
function login() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const foundUser = USERS.find(user => user.username === u && user.pass === p);
    if (foundUser) setSession(foundUser);
    else alert("Hibás felhasználónév vagy jelszó!");
}

function loginAsGuest() {
    setSession({ role: 'guest', name: 'Néző', dojo: '-' });
}

function setSession(user) {
    currentUser = user;
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateUIByRole();
    renderPlayerList();
    
    if(user.role === 'coach' || user.role === 'admin') switchTab('reg');
    else switchTab('bracket');
    
    if(typeof renderKata === "function") renderKata();
}

function logout() { location.reload(); }

// --- UI FRISSÍTÉS JOGOSULTSÁG ALAPJÁN ---
function updateUIByRole() {
    const role = currentUser.role;
    document.getElementById('user-badge').innerText = `${currentUser.name} (${role.toUpperCase()})`;
    if(role === 'admin') document.getElementById('user-badge').className = "text-xs px-2 py-1 rounded bg-red-600 text-white";

    if (role === 'coach' || role === 'admin') {
        document.getElementById('nav-reg').classList.remove('hidden');
        document.getElementById('p-dojo').value = currentUser.dojo;
        if(role === 'admin') document.getElementById('p-dojo').disabled = false;
    }

    if (role === 'admin') {
        document.getElementById('admin-controls').classList.remove('hidden');
    }
}

// --- SEGÉDFÜGGVÉNY A KATEGÓRIA TÍPUSÁHOZ ---
function getCategoryType(catName) {
    if (catName.includes('Kumite')) return 'KUMITE';
    if (catName.includes('Kata')) return 'KATA';
    return 'OTHER';
}

// --- NEVEZÉS (MÓDOSÍTOTT LOGIKA) ---
function addPlayer() {
    if(currentUser.role !== 'coach' && currentUser.role !== 'admin') return;

    const name = document.getElementById('p-name').value.trim(); // Trim: szóközök levágása
    const dojo = document.getElementById('p-dojo').value;
    const cat = document.getElementById('p-cat').value;

    if (!name || !dojo) {
        alert("Kérlek töltsd ki a nevet!");
        return;
    }

    // 1. ELLENŐRZÉS: Van-e már ilyen nevű versenyző ebben a dojoban?
    const existingPlayer = data.players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.dojo === dojo);

    if (existingPlayer) {
        // 2. ELLENŐRZÉS: Ha van, megnézzük a típusokat
        const oldType = getCategoryType(existingPlayer.cat);
        const newType = getCategoryType(cat);

        // Ha az egyik Kumite, a másik Kata -> HIBA
        if (oldType !== newType) {
            alert(`HIBA: ${name} már nevezve van ${oldType} kategóriában!\nNem indulhat egyszerre Kumite-ban és Katában.`);
            return; // Megállítjuk a mentést
        }
        
        // Opcionális: Ha ugyanaz a típus (pl. Kumite Open és Kumite -70kg), azt engedhetjük, vagy azt is tilthatjuk.
        // Jelenleg engedjük, ha a típus azonos.
    }

    // Ha minden rendben, mentés
    data.players.push({
        id: 100 + data.players.length + 1,
        name: name, 
        dojo: dojo, 
        cat: cat,
        owner: currentUser.username
    });
    
    save(); 
    renderPlayerList(); 
    document.getElementById('p-name').value = '';
}

function renderPlayerList() {
    const listEl = document.getElementById('player-list');
    listEl.innerHTML = '';
    let visiblePlayers = [];
    if (currentUser.role === 'admin') visiblePlayers = data.players;
    else if (currentUser.role === 'coach') visiblePlayers = data.players.filter(p => p.owner === currentUser.username);

    visiblePlayers.forEach(p => {
        // Színkód a típushoz
        const typeColor = p.cat.includes('Kata') ? 'text-blue-600' : 'text-red-600';
        
        listEl.innerHTML += `
            <li class="border-b py-2 flex justify-between items-center">
                <span><b>${p.name}</b> (${p.dojo})</span>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded font-bold ${typeColor}">${p.cat}</span>
            </li>`;
    });
}

// --- KUMITE SORSOLÁS ---
function generate() {
    if(currentUser.role !== 'admin') return;
    data.matches = [];
    const cat = document.getElementById('p-cat').value; 
    
    // Csak akkor generáljunk, ha ez KUMITE kategória!
    if (cat.includes('Kata')) {
        alert("Ez egy Kata kategória! Használd a kék 'Kata Verseny Indítása' gombot.");
        return;
    }

    const players = data.players.filter(p => p.cat === cat);
    if(players.length < 2) { alert("Nincs elég versenyző ebben a kategóriában!"); return; }

    const size = Math.pow(2, Math.ceil(Math.log2(players.length)));
    for(let i=0; i<size; i+=2) {
        const p1 = players[i] || { name: "ÜRES", id: null };
        const p2 = players[i+1] || { name: "---", id: null, isBye: true };
        data.matches.push({
            id: `m1-${i}`, round: 1, cat: cat,
            aka: p1, shiro: p2, winner: (p1.id && p2.isBye) ? p1 : null,
            scoreAka: 0, scoreShiro: 0, nextId: `m2-${Math.floor(i/4)}`
        });
    }
    checkAdvancements(); save(); switchTab('bracket');
}

function checkAdvancements() {
    let changed = true;
    while(changed) {
        changed = false;
        data.matches.forEach(m => {
            if(m.winner && m.nextId) {
                let nextM = data.matches.find(x => x.id === m.nextId);
                if(!nextM) {
                    nextM = { id: m.nextId, round: m.round + 1, cat: m.cat, aka: {name:"...",id:null}, shiro: {name:"...",id:null}, winner:null, scoreAka:0, scoreShiro:0, nextId:null};
                    data.matches.push(nextM); changed = true;
                }
                if(!nextM.aka.id || nextM.aka.id === m.winner.id) {
                     if(nextM.aka.id !== m.winner.id) { nextM.aka = m.winner; changed = true; }
                } else {
                     if(nextM.shiro.id !== m.winner.id) { nextM.shiro = m.winner; changed = true; }
                }
            }
        });
    }
}

function renderBracket() {
    const container = document.getElementById('bracket-view');
    container.innerHTML = "";
    const canEdit = (currentUser.role === 'admin' || currentUser.role === 'judge');
    
    if(data.matches.length === 0) {
        container.innerHTML = "<p class='text-gray-400'>Nincs aktív Kumite ágrajz.</p>";
        return;
    }

    const maxRound = Math.max(...data.matches.map(m => m.round));
    for(let r=1; r<=maxRound; r++) {
        const matches = data.matches.filter(m => m.round === r);
        const col = document.createElement('div');
        col.className = "round-column";
        matches.forEach(m => {
            const active = !m.winner && m.aka.id && m.shiro.id;
            const clickAction = (active && canEdit) ? `onclick="openRef('${m.id}')"` : "";
            col.innerHTML += `
                <div class="match-wrapper">
                    <div ${clickAction} class="player-card ${active && canEdit ? 'clickable' : ''} ${m.winner?.id === m.aka.id ? 'winner-card' : ''}">
                        <div class="color-strip aka-strip"></div><b>${m.aka.name}</b> <span class="float-right">${m.scoreAka}</span>
                    </div>
                    <div ${clickAction} class="player-card ${active && canEdit ? 'clickable' : ''} ${m.winner?.id === m.shiro.id ? 'winner-card' : ''}">
                        <div class="color-strip shiro-strip"></div><b>${m.shiro.name}</b> <span class="float-right">${m.scoreShiro}</span>
                    </div>
                    ${ m.nextId ? '<div class="match-connector-right"></div>' : '' }
                </div>`;
        });
        container.appendChild(col);
    }
}

// --- KUMITE BÍRÓI PANEL ---
let currMatch = null;
function openRef(id) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'judge') return;
    currMatch = data.matches.find(m => m.id === id);
    document.getElementById('ref-aka').innerText = currMatch.aka.name;
    document.getElementById('ref-shiro').innerText = currMatch.shiro.name;
    switchTab('referee');
}
function score(who, pt) {
    if(who === 'aka') currMatch.scoreAka += pt; else currMatch.scoreShiro += pt;
    document.getElementById('score-aka').innerText = currMatch.scoreAka;
    document.getElementById('score-shiro').innerText = currMatch.scoreShiro;
}
function endMatch() {
    currMatch.winner = currMatch.scoreAka >= currMatch.scoreShiro ? currMatch.aka : currMatch.shiro;
    checkAdvancements(); save(); switchTab('bracket');
}

// --- SEGÉD ---
function switchTab(id) {
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-'+id).classList.remove('hidden');
    if(id === 'bracket') renderBracket();
    if(id === 'kata') renderKata(); 
}
function save() { localStorage.setItem('rbac_db', JSON.stringify(data)); }
function resetAll() { if(confirm("Törlés?")) { localStorage.clear(); location.reload(); }}