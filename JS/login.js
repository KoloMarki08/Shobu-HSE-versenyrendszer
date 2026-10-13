document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // Sima API lekérdezés a C# backendtől
    fetch('https://localhost:7045/api/Users')
        .then(response => response.json())
        .then(users => {
            let foundUser = false;

            // Végigmegyünk a kapott adatokon
            for (let i = 0; i < users.length; i++) {
                if (users[i].username === usernameInput && users[i].password === passwordInput) {
                    foundUser = true;
                    
                    // Irányítás a szerepkörnek megfelelő oldalra
                    if (users[i].role === 'Admin') {
                        window.location.href = 'views/admin.html';
                    } else if (users[i].role === 'Referee') {
                        window.location.href = 'views/biroi_panel.html';
                    } else if (users[i].role === 'Coach') {
                        window.location.href = 'views/nevezes.html';
                    }
                    break;
                }
            }

            if (!foundUser) {
                alert('Hibás felhasználónév vagy jelszó!');
            }
        })
        .catch(err => {
            alert('Nem sikerült elérni az adatbázist.');
        });
});