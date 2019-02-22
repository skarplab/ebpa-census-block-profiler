function updateHandlebarElement(containingElementId, template, context) {
	try {
		document.getElementById(containingElementId).innerHTML = template(context);
	} catch (e){
		console.log(e)
	}
}