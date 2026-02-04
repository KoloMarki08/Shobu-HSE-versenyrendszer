/* kata.js - Külön modul a formagyakorlathoz */

// Segédfüggvény a mentéshez (használja a közös localStorage kulcsot, vagy külön újat)
function getKataData() {
    return JSON.parse(localStorage.getItem('iko_kata_db')) || { rounds: [] };
}
function saveKataData(data) {
    localStorage.setItem('iko_kata_db', JSON.stringify(data));
}

// KATA inicializálása (Meghívandó a Generálás gombbal)
function initKataTournament() {
    // 1. Kiszedjük a játékosokat a közös adatbázisból, akik KATA kategóriában vannak
    // Feltételezzük, hogy a fő adatbázis 'iko_db' néven fut (a script.js-ből)
    const mainData = JSON.parse(localStorage.getItem('iko_db')) || { players: [] };
    const currentCat = document.getElementById('p-cat').value; // A legördülőből
    
    // Szűrés kategóriára (és feltételezzük, hogy ez Kata kategória)
    // Ha a kategória nevében benne van, hogy "Kata" vagy csak simán mindenkit listázunk aki abban a kat-ban van
    let players = mainData.players.filter(p => p.cat === currentCat);

    if (players.length === 0) {
        alert("Nincs versenyző ebben a kategóriában!");
        return;
    }

    // Létrehozzuk az 1. fordulót
    const kataData = {
        category: currentCat,
        round1: players.map(p => ({
            ...p,
            scores: [0, 0, 0, 0, 0], // 5 bíró
            total: 0,
            min: 0,
            max: 0
        })),
        round2: [], // Üres, majd feltöltjük
        activeRound: 1
    };

    saveKataData(kataData);
    renderKata();
    switchTab('kata'); // Átváltunk a Kata fülre
}

// A Fő Renderelő függvény
function renderKata() {
    const data = getKataData();
    const container = document.getElementById('kata-content');
    container.innerHTML = "";

    if (!data.round1 || data.round1.length === 0) {
        container.innerHTML = "<p class='text-gray-500 text-center p-10'>Nincs aktív Kata verseny. Válassz kategóriát a Nevezésnél és generálj!</p>";
        return;
    }

    // Cím generálása
    const title = document.createElement('h2');
    title.className = "text-2xl font-bold mb-6 border-b pb-2";
    title.innerText = `[ ROUND ${data.activeRound} ] - ${data.category}`;
    container.appendChild(title);

    // Aktuális lista kiválasztása (Round 1 vagy Round 2)
    let currentList = data.activeRound === 1 ? data.round1 : data.round2;

    // Ha Round 2 van, rendezzük őket sorrendbe (a szabályod szerint: a legkisebb pontszámú kezd)
    // De a táblázatban általában indulási sorrendben vannak.
    
    const table = document.createElement('div');
    table.className = "kata-table-wrapper";

    // Fejléc
    table.innerHTML = `
        <div class="kata-header-row">
            <div class="flex-1">Versenyző</div>
            <div class="w-16 text-center text-xs text-gray-400">J1</div>
            <div class="w-16 text-center text-xs text-gray-400">J2</div>
            <div class="w-16 text-center text-xs text-gray-400">J3</div>
            <div class="w-16 text-center text-xs text-gray-400">J4</div>
            <div class="w-16 text-center text-xs text-gray-400">J5</div>
            <div class="w-16 text-center text-xs font-bold text-gray-500 border-l">MIN</div>
            <div class="w-16 text-center text-xs font-bold text-gray-500">MAX</div>
            <div class="w-20 text-center font-black border-l">RESULT</div>
        </div>
    `;

    // Sorok generálása
    currentList.forEach((p, index) => {
        const row = document.createElement('div');
        row.className = "kata-row";
        
        // Versenyző infó
        const infoHTML = `
            <div class="flex-1">
                <div class="font-bold text-sm"><span class="text-blue-700">[ ${p.id} ]</span> ${p.name}</div>
                <div class="text-xs text-gray-400">${p.dojo}</div>
            </div>
        `;

        // Input mezők (5 db)
        let inputsHTML = "";
        for(let i=0; i<5; i++) {
            inputsHTML += `<input type="number" step="0.1" class="score-input" value="${p.scores[i] || ''}" onchange="updateKataScore(${index}, ${i}, this.value)">`;
        }

        // Eredmény mezők
        const statsHTML = `
            <div class="w-16 text-center text-xs text-gray-500 border-l py-2 flex items-center justify-center">${p.min || '-'}</div>
            <div class="w-16 text-center text-xs text-gray-500 py-2 flex items-center justify-center">${p.max || '-'}</div>
            <div class="w-20 text-center font-black text-lg border-l py-2 flex items-center justify-center bg-gray-50">${p.total || '0.0'}</div>
        `;

        row.innerHTML = infoHTML + inputsHTML + statsHTML;
        table.appendChild(row);
    });

    container.appendChild(table);

    // Gombok (Továbbjutás)
    if(data.activeRound === 1) {
        const btn = document.createElement('button');
        btn.className = "mt-8 bg-zinc-900 text-white px-6 py-3 rounded font-bold w-full hover:bg-red-600 transition";
        btn.innerText = "1. FORDULÓ LEZÁRÁSA -> TOP 6 TOVÁBBJUT";
        btn.onclick = finishKataRound1;
        container.appendChild(btn);
    } else {
        const btn = document.createElement('button');
        btn.className = "mt-8 bg-green-700 text-white px-6 py-3 rounded font-bold w-full";
        btn.innerText = "VERSENY VÉGE - EREDMÉNYHIRDETÉS";
        btn.onclick = () => alert("Gratulálunk a győzteseknek!"); // Ide jöhetne egy dobogó
        container.appendChild(btn);
    }
}

// Pontszám frissítése és számolás
function updateKataScore(playerIdx, scoreIdx, value) {
    const data = getKataData();
    let list = data.activeRound === 1 ? data.round1 : data.round2;
    
    list[playerIdx].scores[scoreIdx] = parseFloat(value) || 0;

    // SZÁMÍTÁS: (Összeg - Min - Max)
    const s = list[playerIdx].scores;
    const min = Math.min(...s);
    const max = Math.max(...s);
    
    // Összeg kiszámítása
    const sumAll = s.reduce((a, b) => a + b, 0);
    
    // Végső pont: Összesből kivonjuk a legkisebbet és legnagyobbat
    // (Ez ugyanaz, mintha a középső 3-at adnánk össze)
    let finalScore = sumAll - min - max;

    // Kerekítés 1 tizedesjegyre (ahogy a képen: 15.2)
    finalScore = Math.round(finalScore * 10) / 10;

    list[playerIdx].min = min;
    list[playerIdx].max = max;
    list[playerIdx].total = finalScore;

    saveKataData(data);
    
    // Csak a számokat frissítjük a DOM-ban render nélkül (gyorsabb), de most egyszerűbb újrarenderelni
    renderKata(); 
}

// 1. Kör lezárása és 2. Kör generálása
function finishKataRound1() {
    const data = getKataData();
    
    // 1. Rendezzük sorba pontszám szerint (Csökkenő: Legtöbb pont elől)
    let sorted = [...data.round1].sort((a, b) => b.total - a.total);
    
    // 2. Vesszük a TOP 6-ot
    let top6 = sorted.slice(0, 6);

    if(top6.length === 0) { alert("Nincs elég pontszám!"); return; }

    // 3. A 2. kör indulási sorrendje: A TOP 6 közül a legkevesebb pontú jön először
    // Tehát a sorted tömb 6. helyezettje (aki épp bejutott) lesz az első induló.
    // Ezért a top6 tömböt megfordítjuk (mert az most Csökkenőben van [1. hely, 2. hely...])
    // Megfordítva: [6. hely, 5. hely ... 1. hely]
    let round2Order = top6.reverse();

    // Reseteljük a pontjaikat a 2. körre
    data.round2 = round2Order.map(p => ({
        ...p,
        scores: [0,0,0,0,0],
        total: 0,
        min: 0,
        max: 0
    }));

    data.activeRound = 2;
    saveKataData(data);
    renderKata();
    alert("TOP 6 Versenyző átlépett a 2. fordulóba!");
}