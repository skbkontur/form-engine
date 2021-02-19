import { expect } from "chai";
import { createStore, Store } from "redux";

import { getValue } from "../../Controls/ControlBinding";
import { FormAction, userUpdateValue } from "../../FormStore/FormActions";
import { buildInitialState, formReducer } from "../../FormStore/FormReducer";
import { FormState } from "../../FormStore/FormState";
import { getNormalizedPath } from "../../Path";

interface TestData1 {
    a: null | string;
}

describe("FormStoreTest", () => {
    it("init store", () => {
        const store = createFormStore<TestData1>({ a: null });
        expect(getValue(store.getState().value, x => x.a)).to.eql(null);
    });

    it("update value", () => {
        const store = createFormStore<TestData1>({ a: null });
        store.dispatch(
            userUpdateValue(
                getNormalizedPath((x: TestData1) => x.a),
                "string"
            )
        );
        expect(getValue(store.getState().value, x => x.a)).to.eql("string");
    });

    it("update whole value", () => {
        const store = createFormStore<TestData1>({ a: null });
        store.dispatch(
            userUpdateValue(
                getNormalizedPath((x: TestData1) => x),
                { a: "string" }
            )
        );
        expect(getValue(store.getState().value, x => x)).to.eql({ a: "string" });
    });

    function createFormStore<T>(initialState: T): Store<FormState<T>> {
        return createStore<FormState<T>, FormAction, unknown, unknown>(
            // @ts-ignore
            formReducer,
            buildInitialState<T, any>(initialState, null)
        );
    }
});
