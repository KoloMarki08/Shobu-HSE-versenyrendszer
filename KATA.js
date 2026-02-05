/* kata.js - RBAC Integrációval */

// Adatok betöltése
function getKataData() { return JSON.parse(localStorage.getItem('rbac_kata_db')) || { rounds: [] }; }
function saveKataData(d) { localStorage.setItem('rbac_kata_db', JSON.stringify(d)); }

function initKataTournament() {
    if(currentUser.role !== 'admin') { alert("Csak Admin indíthat Kata versenyt!"); return; }

    const currentCat = document.getElementById('p-cat').value;
    // Figyelem: A 'data' változó a script.js-ből jön (globális)
    let players = data.players.filter(p => p.cat === currentCat);

    if (players.length === 0) { alert("Nincs versenyző ebben a kategóriában!"); return; }

    const kataData = {
        category: currentCat,
        round1: players.map(p => ({ ...p, scores: [0,0,0,0,0], total: 0, min: 0, max: 0 })),
        round2: [],
        activeRound: 1
    };

    saveKataData(kataData);
    renderKata();
    switchTab('kata');
}

function renderKata() {
    const kData = getKataData();
    const container = document.getElementById('kata-content');
    container.innerHTML = "";

    if (!kData.round1 || kData.round1.length === 0) {
        container.innerHTML = "<p class='text-gray-400 text-center mt-10'>Nincs aktív Kata verseny.</p>";
        return;
    }

    // JOGOSULTSÁG ELLENŐRZÉS:
    // Ki írhatja be a pontokat? Csak Admin vagy Bíró.
    const canEdit = (currentUser && (currentUser.role === 'admin' || currentUser.role === 'judge'));
    const disabledAttr = canEdit ? "" : "disabled";
    const inputClass = canEdit ? "score-input border-blue-300 bg-white" : "score-input bg-gray-100 text-gray-500 cursor-not-allowed";

    // Cím
    container.innerHTML += `<h2 class="text-2xl font-bold mb-4 border-b pb-2">[ KÖR ${kData.activeRound} ] - ${kData.category}</h2>`;

    let currentList = kData.activeRound === 1 ? kData.round1 : kData.round2;
    
    // Táblázat építése
    let html = `<div class="kata-table-wrapper"><div class="kata-header-row flex font-bold bg-gray-100 p-2 text-xs uppercase">
        <div class="flex-1">Név</div>
        <div class="w-12 text-center">J1</div><div class="w-12 text-center">J2</div><div class="w-12 text-center">J3</div><div class="w-12 text-center">J4</div><div class="w-12 text-center">J5</div>
        <div class="w-16 text-center border-l">MIN</div><div class="w-16 text-center">MAX</div><div class="w-20 text-center border-l bg-gray-200">TOTAL</div>
    </div>`;

    currentList.forEach((p, idx) => {
        let inputs = "";
        for(let i=0; i<5; i++) {
            inputs += `<input type="number" step="0.1" class="${inputClass} w-10 text-center mx-1 border rounded" 
                        value="${p.scores[i]}" 
                        ${disabledAttr} 
                        onchange="updateKataScore(${idx}, ${i}, this.value)">`;
        }

        html += `<div class="kata-row flex items-center border-b p-2 bg-white hover:bg-yellow-50">
            <div class="flex-1 font-bold text-sm text-blue-900">${p.name} <span class="text-gray-400 font-normal text-xs ml-2">${p.dojo}</span></div>
            ${inputs}
            <div class="w-16 text-center text-xs text-gray-500 border-l">${p.min}</div>
            <div class="w-16 text-center text-xs text-gray-500">${p.max}</div>
            <div class="w-20 text-center font-black text-lg bg-gray-50 border-l">${p.total}</div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML += html;

    // Gombok (Csak Adminnak)
    if(currentUser && currentUser.role === 'admin') {
        if(kData.activeRound === 1) {
            container.innerHTML += `<button onclick="finishKataRound1()" class="mt-6 bg-zinc-900 text-white w-full py-3 rounded font-bold uppercase hover:bg-red-600 transition">1. FORDULÓ LEZÁRÁSA -> TOP 6</button>`;
        } else {
            container.innerHTML += `<button class="mt-6 bg-green-600 text-white w-full py-3 rounded font-bold uppercase cursor-default">VERSENY VÉGE</button>`;
        }
    }
}

function updateKataScore(pIdx, sIdx, val) {
    // Biztonsági ellenőrzés a függvényen belül is
    if(currentUser.role !== 'admin' && currentUser.role !== 'judge') return;

    const kData = getKataData();
    let list = kData.activeRound === 1 ? kData.round1 : kData.round2;
    list[pIdx].scores[sIdx] = parseFloat(val) || 0;

    const s = list[pIdx].scores;
    const min = Math.min(...s);
    const max = Math.max(...s);
    const sum = s.reduce((a,b)=>a+b, 0);
    list[pIdx].min = min; 
    list[pIdx].max = max;
    list[pIdx].total = Math.round((sum - min - max)*10)/10;

    saveKataData(kData);
    renderKata();
}

function finishKataRound1() {
    if(currentUser.role !== 'admin') return;
    const kData = getKataData();
    // Rendezés pontszám szerint csökkenőbe
    let sorted = [...kData.round1].sort((a,b) => b.total - a.total);
    // Top 6
    let top6 = sorted.slice(0, 6);
    if(top6.length < 1) return;
    
    // Fordított indulási sorrend a 2. körben
    kData.round2 = top6.reverse().map(p => ({...p, scores:[0,0,0,0,0], total:0, min:0, max:0}));
    kData.activeRound = 2;
    saveKataData(kData);
    renderKata();
}