function jelszomegjelenito() {
    var passinput = document.getElementById("login-pass");
    var eyeicon = document.getElementById("eye-icon");


    if (passinput.getAttribute("type") == "password") {
        passinput.setAttribute("type", "text");
        eyeicon.src="eye-fill.svg"
    }

    else {
        passinput.setAttribute("type", "password");
        eyeicon.src="eye-slash-fill.svg"
    }
}
