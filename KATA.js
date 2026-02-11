/* kata.js - Frissített modul automatikus formázással és fókusz-váltással */

function getKataData() {
    return JSON.parse(localStorage.getItem('iko_kata_db')) || { rounds: [] };
}

function saveKataData(data) {
    localStorage.setItem('iko_kata_db', JSON.stringify(data));
}

function initKataTournament() {
    const mainData = JSON.parse(localStorage.getItem('iko_db')) || { players: [] };
    const currentCat = document.getElementById('p-cat').value; 
    
    let players = mainData.players.filter(p => p.cat === currentCat);

    if (players.length === 0) {
        alert("Nincs versenyző ebben a kategóriában!");
        return;
    }

    const kataData = {
        category: currentCat,
        round1: players.map(p => ({
            ...p,
            scores: [0, 0, 0, 0, 0],
            total: 0,
            min: 0,
            max: 0
        })),
        round2: [],
        activeRound: 1
    };

    saveKataData(kataData);
    renderKata();
    switchTab('kata');
}

// ÚJ FUNKCIÓ: Automatikus tizedesjegy formázás és ugrás
function formatKataInput(input, playerIdx, scoreIdx) {
    // Csak számokat engedünk meg
    let val = input.value.replace(/\D/g, '');
    
    // Ha beírtak 2 számjegyet
    if (val.length === 2) {
        // Formázás: 75 -> 7.5
        input.value = val[0] + "." + val[1];
        
        // Mentés és számítás meghívása
        updateKataScore(playerIdx, scoreIdx, input.value);
        
        // AUTOMATIKUS UGRÁS a következő mezőre
        const nextInput = input.nextElementSibling;
        if (nextInput && nextInput.classList.contains('score-input')) {
            nextInput.focus();
        }
    } else {
        input.value = val;
    }
}

function renderKata() {
    const data = getKataData();
    const container = document.getElementById('kata-content');
    container.innerHTML = "";

    if (!data.round1 || data.round1.length === 0) {
        container.innerHTML = "<p class='text-gray-500 text-center p-10'>Nincs aktív Kata verseny.</p>";
        return;
    }

    const title = document.createElement('h2');
    title.className = "text-2xl font-bold mb-6 border-b pb-2";
    title.innerText = `[ ROUND ${data.activeRound} ] - ${data.category}`;
    container.appendChild(title);

    let currentList = data.activeRound === 1 ? data.round1 : data.round2;
    const table = document.createElement('div');
    table.className = "kata-table-wrapper";

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

    currentList.forEach((p, index) => {
        const row = document.createElement('div');
        row.className = "kata-row";
        
        const infoHTML = `
            <div class="flex-1">
                <div class="font-bold text-sm"><span class="text-blue-700">[ ${p.id} ]</span> ${p.name}</div>
                <div class="text-xs text-gray-400">${p.dojo}</div>
            </div>
        `;

        // Input mezők módosítása: maxlength, inputmode és formatKataInput
        let inputsHTML = '<div class="flex items-center">';
        for(let i=0; i<5; i++) {
            inputsHTML += `
                <input type="text" 
                    maxlength="2" 
                    inputmode="decimal" 
                    class="score-input" 
                    value="${p.scores[i] || ''}" 
                    oninput="formatKataInput(this, ${index}, ${i})">`;
        }
        inputsHTML += '</div>';

        const statsHTML = `
            <div class="w-16 text-center text-xs text-gray-500 border-l py-2 flex items-center justify-center">${p.min || '-'}</div>
            <div class="w-16 text-center text-xs text-gray-500 py-2 flex items-center justify-center">${p.max || '-'}</div>
            <div class="w-20 text-center font-black text-lg border-l py-2 flex items-center justify-center bg-gray-50">${p.total || '0.0'}</div>
        `;

        row.innerHTML = infoHTML + inputsHTML + statsHTML;
        table.appendChild(row);
    });

    container.appendChild(table);

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
        btn.onclick = () => alert("Gratulálunk a győzteseknek!");
        container.appendChild(btn);
    }
}

function updateKataScore(playerIdx, scoreIdx, value) {
    const data = getKataData();
    let list = data.activeRound === 1 ? data.round1 : data.round2;
    
    list[playerIdx].scores[scoreIdx] = parseFloat(value) || 0;

    const s = list[playerIdx].scores;
    const min = Math.min(...s);
    const max = Math.max(...s);
    const sumAll = s.reduce((a, b) => a + b, 0);
    
    let finalScore = sumAll - min - max;
    finalScore = Math.round(finalScore * 10) / 10;

    list[playerIdx].min = min;
    list[playerIdx].max = max;
    list[playerIdx].total = finalScore;

    saveKataData(data);
    // Itt nem hívunk renderKata()-t azonnal az oninput miatt, 
    // hogy ne veszítse el a fókuszt a felhasználó gépelés közben.
    // Csak a statisztikai mezőket frissítjük vizuálisan ha szükséges, 
    // de az oninput-blur kezelés után a render hívása biztonságosabb.
}

function finishKataRound1() {
    const data = getKataData();
    let sorted = [...data.round1].sort((a, b) => b.total - a.total);
    let top6 = sorted.slice(0, 6);

    if(top6.length === 0) { alert("Nincs elég pontszám!"); return; }

    let round2Order = top6.reverse();

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