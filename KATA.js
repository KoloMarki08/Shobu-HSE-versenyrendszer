function initKataTournament() {
    if (currentUser.role !== 'admin') { alert("Csak Admin!"); return; }
    const cat = document.getElementById('p-cat').value;
    if (!cat.includes("Kata")) { alert("Nem Kata!"); return; }
    let players = data.players.filter(p => p.cat === cat);
    if (players.length === 0) { alert("Üres!"); return; }
    const kataData = { category: cat, round1: players.map(p => ({ ...p, scores: [0, 0, 0, 0, 0], total: 0 })), round2: [], activeRound: 1 };
    localStorage.setItem('iko_kata_db', JSON.stringify(kataData)); renderKata(); switchTab('kata');
}
function formatKataInput(input, pIdx, sIdx) {
    let val = input.value.replace(/\D/g, '');
    if (val.length === 2) { input.value = val[0] + "." + val[1]; updateKataScore(pIdx, sIdx, input.value); if (input.nextElementSibling) input.nextElementSibling.focus(); } else input.value = val;
}
function renderKata() {
    const kData = JSON.parse(localStorage.getItem('iko_kata_db'));
    const container = document.getElementById('kata-content'); container.innerHTML = "";
    if (!kData || !kData.round1) return;
    const canEdit = (currentUser.role === 'admin' || currentUser.role === 'judge');
    const inputClass = canEdit ? "score-input border bg-white" : "score-input bg-gray-100 disabled";
    container.innerHTML += `<h2 class="text-xl font-bold mb-4 border-b pb-2">Kata: ${kData.category}</h2>`;
    let list = kData.activeRound === 1 ? kData.round1 : kData.round2;
    let html = `<div class="bg-white border rounded shadow">`;
    list.forEach((p, idx) => {
        let inputs = "";
        for (let i = 0; i < 5; i++) inputs += `<input type="text" maxlength="2" class="${inputClass}" value="${p.scores[i] || ''}" ${canEdit ? '' : 'disabled'} oninput="formatKataInput(this, ${idx}, ${i})">`;
        html += `<div class="flex items-center border-b p-2"><div class="flex-1 font-bold text-sm">${p.name}</div>${inputs}<div class="w-16 text-center font-bold ml-2 border-l">${p.total}</div></div>`;
    });
    container.innerHTML += html + "</div>";
    if (currentUser.role === 'admin' && kData.activeRound === 1) container.innerHTML += `<button onclick="finishKataRound1()" class="mt-4 bg-zinc-800 text-white w-full py-2 rounded">TOP 6 Továbbjut</button>`;
}
function updateKataScore(pIdx, sIdx, val) {
    const kData = JSON.parse(localStorage.getItem('iko_kata_db'));
    let list = kData.activeRound === 1 ? kData.round1 : kData.round2;
    list[pIdx].scores[sIdx] = parseFloat(val) || 0;
    const s = list[pIdx].scores;
    const sum = s.reduce((a, b) => a + b, 0);
    list[pIdx].total = Math.round((sum - Math.min(...s) - Math.max(...s)) * 10) / 10;
    localStorage.setItem('iko_kata_db', JSON.stringify(kData)); renderKata();
}
function finishKataRound1() {
    const kData = JSON.parse(localStorage.getItem('iko_kata_db'));
    let sorted = [...kData.round1].sort((a, b) => b.total - a.total);
    let top6 = sorted.slice(0, 6);
    kData.round2 = top6.reverse().map(p => ({ ...p, scores: [0, 0, 0, 0, 0], total: 0 }));
    kData.activeRound = 2;
    localStorage.setItem('iko_kata_db', JSON.stringify(kData)); renderKata();
}