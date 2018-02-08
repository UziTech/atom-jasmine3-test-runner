describe("attach-to-dom", function () {
	beforeEach(function () {
		this.jasmine3Content = document.getElementById("jasmine3-content");
	});

	it("should define jasmine.attachToDOM", function () {
		expect(jasmine.attachToDOM).toEqual(jasmine.any(Function));
	});

	it("should attach jasmine3-content to the dom", function () {

		// uses jasmine-jquery
		expect(this.jasmine3Content instanceof HTMLElement).toBe(true);
	});

	it("should append to jasmine3-content", function () {
		const element = document.createElement("div");
		jasmine.attachToDOM(element);
		expect(this.jasmine3Content.contains(element)).toBe(true);
	});
});
