import { expect } from "chai";

import { setIn } from "../src/FormStore/ImmutableOperators";

describe("ImmutableOperatorsTest", () => {
    it("simple set", () => {
        const a = {};
        expect(setIn(a, ["b"], 1)).to.eql({ b: 1 });
    });

    it("simple empty path", () => {
        const a = {};
        expect(setIn(a, [], 1)).to.eql(1);
    });

    it("deep set", () => {
        const a = {};
        expect(setIn(a, ["b", "c"], 1)).to.eql({ b: { c: 1 } });
    });

    it("deep set null", () => {
        const a = null;
        expect(setIn(a, ["b", "c"], 1)).to.eql({ b: { c: 1 } });
    });

    it("deep set primitive", () => {
        const a = "a";
        expect(setIn(a, ["b", "c"], 1)).to.eql("a");
    });

    it("deep set in not existing array", () => {
        const a = {};
        expect(setIn(a, ["b", 0], 1)).to.eql({ b: [1] });
    });

    it("deep set in existing array", () => {
        const a = { b: { c: [3, 2] } };
        expect(setIn(a, ["b", "c", 0], 1)).to.eql({ b: { c: [1, 2] } });
    });

    it("deep set in existing array with big index", () => {
        const a = { b: { c: [3, 2] } };
        expect(setIn(a, ["b", "c", 4], 1)).to.eql({ b: { c: [3, 2, undefined, undefined, 1] } });
    });

    it("deep set in not existing array with big index", () => {
        const a = {};
        expect(setIn(a, ["b", "c", 2], 1)).to.eql({ b: { c: [undefined, undefined, 1] } });
    });

    it("deep set in as array to existing object", () => {
        const a = { b: { c: {} } };
        expect(setIn(a, ["b", "c", 0], 1)).to.eql({ b: { c: { [0]: 1 } } });
    });

    it("deep set with array in middle", () => {
        const a = { b: {} };
        expect(setIn(a, ["b", "c", 0, "d"], 1)).to.eql({ b: { c: [{ d: 1 }] } });
    });

    it("deep set in array with index as string", () => {
        const a = { b: [] };
        expect(setIn(a, ["b", "0"], 1)).to.eql({ b: [1] });
    });
});
