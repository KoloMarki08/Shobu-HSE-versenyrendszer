window.addEventListener('DOMContentLoaded', function() {
    const passInput = document.getElementById('loginPassword');
    if (!passInput) return;

    // Csomagoljuk a jelszó mezőt egy relatív konténerbe, és adjunk hozzá egy 👁️ gombot
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';

    passInput.parentNode.insertBefore(wrapper, passInput);
    wrapper.appendChild(passInput);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.title = 'Jelszó megjelenítése / elrejtése';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.right = '10px';
    toggleBtn.style.background = 'none';
    toggleBtn.style.border = 'none';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '1.2rem';

    toggleBtn.onclick = function() {
        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggleBtn.innerHTML = '🙈';
        } else {
            passInput.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    };

    wrapper.appendChild(toggleBtn);
});