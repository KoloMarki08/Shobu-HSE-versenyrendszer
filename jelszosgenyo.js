function jelszomegjelenito() {
            var passinput = document.getElementById(/*ide jonn az id*/);

            if (passinput.getAttribute("type") == "password") 
            {
                passinput.setAttribute("type", "text");
            }

            else 
            {
                passinput.setAttribute("type", "password");
            }
        }
