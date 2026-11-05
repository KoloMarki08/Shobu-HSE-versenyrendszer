window.addEventListener('DOMContentLoaded', function() {
    const passInput = document.getElementById('loginPassword');
    if (!passInput) return;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';

    passInput.parentNode.insertBefore(wrapper, passInput);
    wrapper.appendChild(passInput);

    const eyeSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const eyeOffSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = eyeSvg;
    toggleBtn.title = 'Jelszó megjelenítése / elrejtése';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.right = '12px';
    toggleBtn.style.background = 'none';
    toggleBtn.style.border = 'none';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.color = '#52525B';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.padding = '4px';

    toggleBtn.onclick = function() {
        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggleBtn.innerHTML = eyeOffSvg;
        } else {
            passInput.type = 'password';
            toggleBtn.innerHTML = eyeSvg;
        }
    };

    wrapper.appendChild(toggleBtn);
});
