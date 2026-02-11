function login() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const user = USERS.find(x => x.username === u && x.pass === p);
    if (user) setSession(user); else alert("Hibás adatok!");
}
function loginAsGuest() { setSession({ role: 'guest', name: 'Néző', dojo: '-' }); }

function setSession(u) {
    currentUser = u;
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateUI(); renderPlayerList();
    if (u.role === 'admin' || u.role === 'coach') switchTab('reg'); else switchTab('bracket');
    if (typeof renderKata === 'function') renderKata();
}

function updateUI() {
    document.getElementById('user-badge').innerText = currentUser.name;
    if (currentUser.role === 'admin') document.getElementById('admin-controls').classList.remove('hidden');
    if (currentUser.role === 'admin' || currentUser.role === 'coach') {
        document.getElementById('nav-reg').classList.remove('hidden');
        document.getElementById('p-dojo').value = currentUser.dojo;
        if (currentUser.role === 'admin') document.getElementById('p-dojo').disabled = false;
    }
}

function logout() { location.reload(); }

function switchTab(id) {
    document.querySelectorAll('section').forEach(e => e.classList.add('hidden'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    if (id === 'bracket') renderBracket();
    if (id === 'kata') renderKata();
}