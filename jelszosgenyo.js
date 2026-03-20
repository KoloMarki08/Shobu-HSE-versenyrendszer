function jelszomegjelenito() {
    var passinput = document.getElementById("login-pass");

    if (passinput.getAttribute("type") == "password") {
        passinput.setAttribute("type", "text");
    }

    else {
        passinput.setAttribute("type", "password");
    }
}
