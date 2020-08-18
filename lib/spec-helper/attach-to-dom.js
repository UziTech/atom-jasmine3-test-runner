/** @babel */

const jasmine3Content = document.createElement("div");
jasmine3Content.id = "jasmine3-content";
document.body.appendChild(jasmine3Content);

jasmine.attachToDom = jasmine.attachToDOM = function (element) {
	const jasmineContent = document.querySelector("#jasmine3-content");
	if (!jasmineContent.contains(element)) {
		return jasmineContent.appendChild(element);
	}
};

afterEach(function () {
	if (!window.debugContent) {
		document.getElementById("jasmine3-content").innerHTML = "";
	}
});
