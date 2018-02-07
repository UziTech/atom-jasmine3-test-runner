const env = jasmine.getEnv();
const jasmineTagged = !!env.setIncludedTags && !!env.includeSpecsWithoutTags;

const ran = jasmine.createSpy();

describe("jasmine-tagged", function () {
	if (jasmineTagged) {
		env.setIncludedTags(["tagged", "tags"]);
		env.includeSpecsWithoutTags(false);
	}

	it("is #tagged", function () {
		pass();
		ran();
	});

	it("has #multiple #tags", function () {
		pass();
		ran();
	});

	describe("pending", function () {
		it("should #not run", function () {
			fail();
		});

		it("has no tags", function () {
			fail();
		});
	});

	if (jasmineTagged) {
		env.includeSpecsWithoutTags(true);
	}

	describe("including specs without tags", function () {
		it("has no tags", function () {
			expect(true).toBe(true);
			ran();
		});

		it("still does #not run other tags", function () {
			fail();
		});
	});

	describe("describe #with tags", function () {
		it("should not run this test", function () {
			fail();
		});
	});

	it("should run all passing tests", function () {
		expect(ran).toHaveBeenCalledTimes(3);
	});
});

if (jasmineTagged) {
	env.setIncludedTags();
	env.includeSpecsWithoutTags(true);
}
