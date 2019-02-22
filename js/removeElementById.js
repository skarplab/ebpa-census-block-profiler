function removeElementById(id) {
    try{
        let element = document.getElementById(id)
        element.remove()
    } catch (e) {
        return false
    }
}
