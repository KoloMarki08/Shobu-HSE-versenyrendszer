// --- KATEGÓRIA  ---
const ALL_CATEGORIES = [

    // --- KUMITE (LÁNYOK) ---
    { name: "Kumite Girls 8-9 y.o. -25kg", type: "KUMITE", gender: "Girls", minAge: 8, maxAge: 9 },
    { name: "Kumite Girls 8-9 y.o. -30kg", type: "KUMITE", gender: "Girls", minAge: 8, maxAge: 9 },
    { name: "Kumite Girls 8-9 y.o. +30kg", type: "KUMITE", gender: "Girls", minAge: 8, maxAge: 9 },
    { name: "Kumite Girls 10-11 y.o. -30kg", type: "KUMITE", gender: "Girls", minAge: 10, maxAge: 11 },
    { name: "Kumite Girls 10-11 y.o. -35kg", type: "KUMITE", gender: "Girls", minAge: 10, maxAge: 11 },
    { name: "Kumite Girls 10-11 y.o. -40kg", type: "KUMITE", gender: "Girls", minAge: 10, maxAge: 11 },
    { name: "Kumite Girls 10-11 y.o. -45kg", type: "KUMITE", gender: "Girls", minAge: 10, maxAge: 11 },
    { name: "Kumite Girls 10-11 y.o. +45kg", type: "KUMITE", gender: "Girls", minAge: 10, maxAge: 11 },
    { name: "Kumite Girls 12-13 y.o. -40kg", type: "KUMITE", gender: "Girls", minAge: 12, maxAge: 13 },
    { name: "Kumite Girls 12-13 y.o. -45kg", type: "KUMITE", gender: "Girls", minAge: 12, maxAge: 13 },
    { name: "Kumite Girls 12-13 y.o. -50kg", type: "KUMITE", gender: "Girls", minAge: 12, maxAge: 13 },
    { name: "Kumite Girls 12-13 y.o. +50kg", type: "KUMITE", gender: "Girls", minAge: 12, maxAge: 13 },
    { name: "Kumite Girls 14-15 y.o. -50kg", type: "KUMITE", gender: "Girls", minAge: 14, maxAge: 15 },
    { name: "Kumite Girls 14-15 y.o. -55kg", type: "KUMITE", gender: "Girls", minAge: 14, maxAge: 15 },
    { name: "Kumite Girls 14-15 y.o. -60kg", type: "KUMITE", gender: "Girls", minAge: 14, maxAge: 15 },
    { name: "Kumite Girls 14-15 y.o. +60kg", type: "KUMITE", gender: "Girls", minAge: 14, maxAge: 15 },
    { name: "Kumite Girls 16-17 y.o. -50kg", type: "KUMITE", gender: "Girls", minAge: 16, maxAge: 17 },
    { name: "Kumite Girls 16-17 y.o. -55kg", type: "KUMITE", gender: "Girls", minAge: 16, maxAge: 17 },
    { name: "Kumite Girls 16-17 y.o. -60kg", type: "KUMITE", gender: "Girls", minAge: 16, maxAge: 17 },
    { name: "Kumite Girls 16-17 y.o. -65kg", type: "KUMITE", gender: "Girls", minAge: 16, maxAge: 17 },
    { name: "Kumite Girls 16-17 y.o. +65kg", type: "KUMITE", gender: "Girls", minAge: 16, maxAge: 17 },
    { name: "Kumite Women 18+ y.o. Open", type: "KUMITE", gender: "Women", minAge: 18, maxAge: 99 },
    { name: "Kumite Women 18+ y.o. -55kg", type: "KUMITE", gender: "Women", minAge: 18, maxAge: 99 },
    { name: "Kumite Women 18+ y.o. -65kg", type: "KUMITE", gender: "Women", minAge: 18, maxAge: 99 },
    { name: "Kumite Women 18+ y.o. +65kg", type: "KUMITE", gender: "Women", minAge: 18, maxAge: 99 },
    { name: "Kumite Women 35+ y.o. -55kg", type: "KUMITE", gender: "Women", minAge: 35, maxAge: 99 },
    { name: "Kumite Women 35+ y.o. -65kg", type: "KUMITE", gender: "Women", minAge: 35, maxAge: 99 },
    { name: "Kumite Women 35+ y.o. +65kg", type: "KUMITE", gender: "Women", minAge: 35, maxAge: 99 },

    // --- KUMITE (FIÚK) ---
    { name: "Kumite Boys 8-9 y.o. -25kg", type: "KUMITE", gender: "Boys", minAge: 8, maxAge: 9 },
    { name: "Kumite Boys 8-9 y.o. -30kg", type: "KUMITE", gender: "Boys", minAge: 8, maxAge: 9 },
    { name: "Kumite Boys 8-9 y.o. -35kg", type: "KUMITE", gender: "Boys", minAge: 8, maxAge: 9 },
    { name: "Kumite Boys 8-9 y.o. +35kg", type: "KUMITE", gender: "Boys", minAge: 8, maxAge: 9 },
    { name: "Kumite Boys 10-11 y.o. -30kg", type: "KUMITE", gender: "Boys", minAge: 10, maxAge: 11 },
    { name: "Kumite Boys 10-11 y.o. -35kg", type: "KUMITE", gender: "Boys", minAge: 10, maxAge: 11 },
    { name: "Kumite Boys 10-11 y.o. -40kg", type: "KUMITE", gender: "Boys", minAge: 10, maxAge: 11 },
    { name: "Kumite Boys 10-11 y.o. -45kg", type: "KUMITE", gender: "Boys", minAge: 10, maxAge: 11 },
    { name: "Kumite Boys 10-11 y.o. +45kg", type: "KUMITE", gender: "Boys", minAge: 10, maxAge: 11 },
    { name: "Kumite Boys 12-13 y.o. -40kg", type: "KUMITE", gender: "Boys", minAge: 12, maxAge: 13 },
    { name: "Kumite Boys 12-13 y.o. -45kg", type: "KUMITE", gender: "Boys", minAge: 12, maxAge: 13 },
    { name: "Kumite Boys 12-13 y.o. -50kg", type: "KUMITE", gender: "Boys", minAge: 12, maxAge: 13 },
    { name: "Kumite Boys 12-13 y.o. -55kg", type: "KUMITE", gender: "Boys", minAge: 12, maxAge: 13 },
    { name: "Kumite Boys 12-13 y.o. +55kg", type: "KUMITE", gender: "Boys", minAge: 12, maxAge: 13 },
    { name: "Kumite Boys 14-15 y.o. -50kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 14-15 y.o. -55kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 14-15 y.o. -60kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 14-15 y.o. -65kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 14-15 y.o. -70kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 14-15 y.o. -75kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 14-15 y.o. +75kg", type: "KUMITE", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kumite Boys 16-17 y.o. -55kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Boys 16-17 y.o. -60kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Boys 16-17 y.o. -65kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Boys 16-17 y.o. -70kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Boys 16-17 y.o. -75kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Boys 16-17 y.o. -80kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Boys 16-17 y.o. +80kg", type: "KUMITE", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kumite Men 18+ y.o. Open", type: "KUMITE", gender: "Men", minAge: 18, maxAge: 99 },
    { name: "Kumite Men 18+ y.o. -60kg", type: "KUMITE", gender: "Men", minAge: 18, maxAge: 99 },
    { name: "Kumite Men 18+ y.o. -70kg", type: "KUMITE", gender: "Men", minAge: 18, maxAge: 99 },
    { name: "Kumite Men 18+ y.o. -80kg", type: "KUMITE", gender: "Men", minAge: 18, maxAge: 99 },
    { name: "Kumite Men 18+ y.o. -90kg", type: "KUMITE", gender: "Men", minAge: 18, maxAge: 99 },
    { name: "Kumite Men 18+ y.o. +90kg", type: "KUMITE", gender: "Men", minAge: 18, maxAge: 99 },
    { name: "Kumite Men 35-44 y.o. -75kg", type: "KUMITE", gender: "Men", minAge: 35, maxAge: 44 },
    { name: "Kumite Men 35-44 y.o. -85kg", type: "KUMITE", gender: "Men", minAge: 35, maxAge: 44 },
    { name: "Kumite Men 35-44 y.o. +85kg", type: "KUMITE", gender: "Men", minAge: 35, maxAge: 44 },
    { name: "Kumite Men 45+ y.o. -75kg", type: "KUMITE", gender: "Men", minAge: 45, maxAge: 99 },
    { name: "Kumite Men 45+ y.o. -85kg", type: "KUMITE", gender: "Men", minAge: 45, maxAge: 99 },
    { name: "Kumite Men 45+ y.o. +85kg", type: "KUMITE", gender: "Men", minAge: 45, maxAge: 99 },

    // --- KATA (LÁNYOK) ---
    { name: "Kata Girls 8-9 y.o.", type: "KATA", gender: "Girls", minAge: 8, maxAge: 9 },
    { name: "Kata Girls 10-11 y.o.", type: "KATA", gender: "Girls", minAge: 10, maxAge: 11 },
    { name: "Kata Girls 12-13 y.o.", type: "KATA", gender: "Girls", minAge: 12, maxAge: 13 },
    { name: "Kata Girls 14-15 y.o.", type: "KATA", gender: "Girls", minAge: 14, maxAge: 15 },
    { name: "Kata Girls 16-17 y.o.", type: "KATA", gender: "Girls", minAge: 16, maxAge: 17 },
    { name: "Kata Women 18-34 y.o.", type: "KATA", gender: "Women", minAge: 18, maxAge: 34 },
    { name: "Kata Women 35-49 y.o.", type: "KATA", gender: "Women", minAge: 35, maxAge: 49 },
    { name: "Kata Women 50+ y.o.", type: "KATA", gender: "Women", minAge: 50, maxAge: 99 },

    // --- KATA (FIÚK) ---
    { name: "Kata Boys 8-9 y.o.", type: "KATA", gender: "Boys", minAge: 8, maxAge: 9 },
    { name: "Kata Boys 10-11 y.o.", type: "KATA", gender: "Boys", minAge: 10, maxAge: 11 },
    { name: "Kata Boys 12-13 y.o.", type: "KATA", gender: "Boys", minAge: 12, maxAge: 13 },
    { name: "Kata Boys 14-15 y.o.", type: "KATA", gender: "Boys", minAge: 14, maxAge: 15 },
    { name: "Kata Boys 16-17 y.o.", type: "KATA", gender: "Boys", minAge: 16, maxAge: 17 },
    { name: "Kata Men 18-34 y.o.", type: "KATA", gender: "Men", minAge: 18, maxAge: 34 },
    { name: "Kata Men 35-49 y.o.", type: "KATA", gender: "Men", minAge: 35, maxAge: 49 },
    { name: "Kata Men 50+ y.o.", type: "KATA", gender: "Men", minAge: 50, maxAge: 99 }

];

// 2. FELHASZNÁLÓK
const USERS = [
    { username: 'KoloMarki', pass: '1234', role: 'admin', dojo: 'admin', name: 'Admin' },
    { username: 'A tatami', pass: 'A-tatami', role: 'judge', dojo: '-', name: 'A_Tatami' },
    { username: 'Balint.Tornai', pass: '1234', role: 'coach', dojo: 'Shobu HSE', name: 'Edző' }
];

// 3. GLOBÁLIS VÁLTOZÓK (CSAK ITT DEKLARÁLJUK ŐKET!)
let data = JSON.parse(localStorage.getItem('iko_db')) || { players: [], matches: [] };
let currentUser = null; 

// 4. SEGÉDFÜGGVÉNYEK
function save() { 
    localStorage.setItem('iko_db', JSON.stringify(data)); 
}

function resetAll() { 
    if(confirm("Mindent törölsz? Ez nem visszavonható!")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

// 5. NEVEZÉS LOGIKA
function updateCategoryDropdown() {
    const gender = document.getElementById('p-gender').value;
    const age = parseInt(document.getElementById('p-age').value);
    const catSelect = document.getElementById('p-cat');
    
    catSelect.innerHTML = "";
    if (!gender || isNaN(age)) return;
    
    const filtered = ALL_CATEGORIES.filter(c => (c.gender === gender || c.gender === 'Vegyes') && age >= c.minAge && age <= c.maxAge);
    
    if(filtered.length === 0) {
        catSelect.innerHTML = "<option>Nincs találat</option>";
        return;
    }

    const grpK = document.createElement('optgroup'); grpK.label="KUMITE";
    const grpF = document.createElement('optgroup'); grpF.label="KATA";
    
    filtered.forEach(c => {
        const o = document.createElement('option'); o.value=c.name; o.innerText=c.name;
        if(c.type==="KUMITE") grpK.appendChild(o); else grpF.appendChild(o);
    });
    
    if(grpK.children.length>0) catSelect.appendChild(grpK);
    if(grpF.children.length>0) catSelect.appendChild(grpF);
}

function addPlayer() {
    if(currentUser.role!=='admin' && currentUser.role!=='coach') return;
    const name = document.getElementById('p-name').value.trim();
    const dojo = document.getElementById('p-dojo').value;
    const cat = document.getElementById('p-cat').value;
    
    if(!name || !cat) { alert("Hiányos adatok!"); return; }
    
    const exists = data.players.some(p => p.name===name && p.cat===cat);
    if(exists) { alert("Már nevezve van ide!"); return; }

    data.players.push({
        id: 100 + data.players.length + 1,
        name, dojo, cat,
        weight: document.getElementById('p-weight').value,
        age: document.getElementById('p-age').value,
        owner: currentUser.username
    });
    save(); renderPlayerList(); document.getElementById('p-name').value='';
}

function renderPlayerList() {
    const l = document.getElementById('player-list'); l.innerHTML = '';
    // Ha nincs bejelentkezve senki, ne haljon meg a kód
    if(!currentUser) return;

    let vis = (currentUser.role==='admin') ? data.players : data.players.filter(p=>p.owner===currentUser.username);
    vis.forEach(p => {
        l.innerHTML += `<li class="border-b py-1 flex justify-between text-sm"><span><b>${p.name}</b> (${p.dojo})</span><span>${p.cat}</span></li>`;
    });
}