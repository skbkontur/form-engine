import { expect } from "chai";

import { AutoEvaluator } from "../../src/AutoEvaluators";

import { createFormStore, TestData1 } from "./FormStoreAutoEvaluationsBases";
import { getAutoEvaluationStateFromStore, getValueFromStore } from "./TestUtils/StoreTestHelpers";
import { compileAutoEvaluator } from "./TestUtils/TestAutoEvaluationCompiler";

describe("FormStoreAutoEvaluationsInitializationTest", () => {
    let c_eq_a_plus_b: AutoEvaluator<TestData1>;

    beforeAll(() => {
        c_eq_a_plus_b = compileAutoEvaluator<TestData1>(x => (x.c = x.a + x.b));
    });

    it("Стартовое значение НЕ равно автовычисленному", () => {
        const store = createFormStore({ a: 1, b: 2, c: 100500 }, c_eq_a_plus_b);
        expect(getValueFromStore(store, x => x.c)).to.eql(100500);
        expect(getAutoEvaluationStateFromStore(store, x => x.c)).to.eql({
            type: "Initial",
            autoValue: 3,
            lastManualValue: null,
            initialValue: 100500,
        });
    });

    it("Стартовое значение равно автовычисленному", () => {
        const store = createFormStore({ a: 1, b: 2, c: 3 }, c_eq_a_plus_b);
        expect(getValueFromStore(store, x => x.c)).to.eql(3);
        expect(getAutoEvaluationStateFromStore(store, x => x.c)).to.eql({
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: 3,
        });
    });

    it("Стартовое значение равно пустое (undefined)", () => {
        const store = createFormStore({ a: 1, b: 2, c: undefined }, c_eq_a_plus_b);
        expect(getValueFromStore(store, x => x.c)).to.eql(3);
        expect(getAutoEvaluationStateFromStore(store, x => x.c)).to.eql({
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: null,
        });
    });

    it("Стартовое значение равно пустое (null)", () => {
        const store = createFormStore({ a: 1, b: 2, c: null }, c_eq_a_plus_b);
        expect(getValueFromStore(store, x => x.c)).to.eql(3);
        expect(getAutoEvaluationStateFromStore(store, x => x.c)).to.eql({
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: null,
        });
    });
});
