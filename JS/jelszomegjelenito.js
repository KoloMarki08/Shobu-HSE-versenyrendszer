document.getElementById('togglePassword').onclick = function () {
    const passwordInput = document.getElementById('password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.src = 'eye-slash-fill.svg';
    } else {
        passwordInput.type = 'password';
        this.src = 'eye-fill.svg';
    }
};