class ErrorAlert {
    errorAlertID = "errorAlert"
    errorAlertTextID = "errorAlertText"
    constructor() {
        if (!ErrorAlert.instance) {
            ErrorAlert.instance = this;
        }
        this.#addElementToDocument();
        return ErrorAlert.instance;
    }
    getTextID(){
        return this.errorAlertTextID
    }

    getAlertID(){
        return this.errorAlertID
    }

    #addElementToDocument(){
        let alert = document.createElement('div')
        alert.id = "errorAlert"
        alert.className = "alert alert-danger alert-dismissible fade"
        alert.role = "alert"

        let alertText = document.createElement('p')
        alertText.innerText = "Error while starting solve"
        alertText.id = "errorAlertText"
        alert.appendChild(alertText)

        let alertExitBtn = document.createElement('div')
        alertExitBtn.innerHTML = '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
        alert.appendChild(alertExitBtn)

        document.body.prepend(alert)
    }

    setErrorMsg(msg){
        this.lastMsg = msg
        document.getElementById(this.errorAlertTextID).innerText = msg;
    }

    show(msg) {
        this.setErrorMsg(msg)
        document.getElementById(this.errorAlertID).classList.add("show");
    }
}