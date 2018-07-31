import { ValidationResult } from "Commons/Mutators/Types";

import { FormAction } from "./FormActions";
import { FormState } from "./FormState";
import { setIn } from "./ImmutableOperators";

export function buildInitialState<T, TContext>(
    initialValue: T,
    context: TContext,
    validator?: (value: T) => ValidationResult
): FormState<T, TContext> {
    return {
        value: initialValue,
        context: context,
        validationResult: validator != undefined ? validator(initialValue) : undefined,
        validator: validator,
    };
}

export function formReducer<TData, TContext>(
    state: FormState<TData, TContext>,
    action: FormAction
): FormState<TData, TContext> {
    if (action.type === "UpdateValue") {
        const nextValue = setIn(state.value, action.path, action.value);
        const validationResult = state.validator != undefined ? state.validator(nextValue) : undefined;
        return {
            ...state,
            validationResult: validationResult,
            value: nextValue,
        };
    }
    if (action.type === "ReplaceValue") {
        return {
            ...state,
            validationResult: state.validator != undefined ? state.validator(action.value) : undefined,
            value: action.value,
        };
    }
    return state;
}
