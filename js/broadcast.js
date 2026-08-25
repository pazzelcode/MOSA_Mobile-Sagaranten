/* =========================================================
   LINK FORM
========================================================= */

const formLink =
    new URL(
        "form-permintaan.html",
        window.location.href
    ).href;


/* =========================================================
   ELEMENT
========================================================= */

const messageInput =
    document.getElementById(
        "messageInput"
    );

const formLinkElement =
    document.getElementById(
        "formLink"
    );

const whatsappButton =
    document.getElementById(
        "whatsappButton"
    );

const previewButton =
    document.getElementById(
        "previewButton"
    );

const previewSection =
    document.getElementById(
        "previewSection"
    );

const previewMessage =
    document.getElementById(
        "previewMessage"
    );

const copyLinkButton =
    document.getElementById(
        "copyLink"
    );

const statusElement =
    document.getElementById(
        "broadcastStatus"
    );


/* =========================================================
   SHOW LINK
========================================================= */

formLinkElement.textContent =
    formLink;


/* =========================================================
   BUILD MESSAGE
========================================================= */

function getMessage(){

    return messageInput.value
        .replace(
            /\{LINK_FORM\}/g,
            formLink
        )
        .trim();

}


/* =========================================================
   PREVIEW
========================================================= */

previewButton.addEventListener(
    "click",
    function(){

        const message =
            getMessage();

        previewMessage.textContent =
            message;

        previewSection.classList.toggle(
            "show"
        );

    }
);


/* =========================================================
   WHATSAPP
========================================================= */

whatsappButton.addEventListener(
    "click",
    function(){

        const message =
            getMessage();

        if(!message){

            showStatus(
                "Pesan tidak boleh kosong."
            );

            return;

        }


        /*
         * WhatsApp Share
         *
         * Tidak menggunakan API.
         *
         * WhatsApp akan terbuka dan
         * pengguna memilih sendiri
         * kontak / grup tujuan.
         */

        const whatsappURL =
            "https://wa.me/?text=" +
            encodeURIComponent(
                message
            );


        window.open(
            whatsappURL,
            "_blank"
        );


        showStatus(
            "WhatsApp dibuka. Silakan pilih kontak atau grup yang akan menerima pesan.",
            true
        );

    }
);


/* =========================================================
   COPY LINK
========================================================= */

copyLinkButton.addEventListener(
    "click",
    async function(){

        try{

            await navigator.clipboard.writeText(
                formLink
            );

            copyLinkButton.textContent =
                "COPIED";

            setTimeout(
                function(){

                    copyLinkButton.textContent =
                        "COPY";

                },
                1500
            );

        }catch(error){

            const temp =
                document.createElement(
                    "textarea"
                );

            temp.value =
                formLink;

            document.body.appendChild(
                temp
            );

            temp.select();

            document.execCommand(
                "copy"
            );

            temp.remove();

            copyLinkButton.textContent =
                "COPIED";

            setTimeout(
                function(){

                    copyLinkButton.textContent =
                        "COPY";

                },
                1500
            );

        }

    }
);


/* =========================================================
   STATUS
========================================================= */

function showStatus(
    message,
    success = false
){

    statusElement.textContent =
        message;

    statusElement.className =
        "broadcast-status show";

    if(success){

        statusElement.classList.add(
            "success"
        );

    }

}


/* =========================================================
   AUTO PREVIEW UPDATE
========================================================= */

messageInput.addEventListener(
    "input",
    function(){

        if(
            previewSection.classList.contains(
                "show"
            )
        ){

            previewMessage.textContent =
                getMessage();

        }

    }
);

function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "dashboard.html";

    }

}
