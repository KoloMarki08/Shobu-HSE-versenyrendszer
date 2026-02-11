/* auth.js - Belépés kezelése */

function login() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    // A USERS tömböt a data.js-ből olvassa
    const user = USERS.find(x => x.username === u && x.pass === p);
    
    if(user) {
        setSession(user);
    } else {
        alert("Hibás felhasználónév vagy jelszó!");
    }
}

function loginAsGuest() { 
    setSession({ role: 'guest', name: 'Néző', dojo: '-' }); 
}

function setSession(u) {
    currentUser = u; // Itt a globális változót írjuk felül
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    updateUI(); 
    renderPlayerList(); // Ez most már biztonságos
    
    if(u.role==='admin'||u.role==='coach') switchTab('reg'); 
    else switchTab('bracket');
    
    // Ellenőrizzük, hogy létezik-e a függvény, mielőtt meghívjuk
    if(typeof renderKata === 'function') renderKata();
}

function updateUI() {
    if(!currentUser) return;
    document.getElementById('user-badge').innerText = currentUser.name;
    
    if(currentUser.role === 'admin') document.getElementById('admin-controls').classList.remove('hidden');
    
    if(currentUser.role === 'admin' || currentUser.role === 'coach') {
        document.getElementById('nav-reg').classList.remove('hidden');
        document.getElementById('p-dojo').value = currentUser.dojo;
        if(currentUser.role==='admin') document.getElementById('p-dojo').disabled=false;
    }
}

function logout() { 
    location.reload(); 
}

function switchTab(id) {
    document.querySelectorAll('section').forEach(e => e.classList.add('hidden'));
    document.getElementById('tab-'+id).classList.remove('hidden');
    
    if(id==='bracket' && typeof renderBracket === 'function') renderBracket();
    if(id==='kata' && typeof renderKata === 'function') renderKata();
}