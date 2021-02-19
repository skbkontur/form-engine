import { createStore, Store } from "redux";

import { AutoEvaluator } from "../../AutoEvaluators";
import { FormAction } from "../../FormStore/FormActions";
import { buildInitialState, formReducer } from "../../FormStore/FormReducer";
import { FormState } from "../../FormStore/FormState";

export interface TestData1 {
    a: number;
    b: number;
    c?: null | number;
    d?: null | number;
}

export function createFormStore<T>(initialState: T, autoEvaluator: AutoEvaluator<T>): Store<FormState<T>> {
    return createStore<FormState<T>, FormAction, unknown, unknown>(
        // @ts-ignore
        formReducer,
        buildInitialState<T, any>(initialState, null, undefined, autoEvaluator)
    );
}
