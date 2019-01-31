import { AutoEvaluator } from "Commons/AutoEvaluations/AutoEvaluators";
import { getKeyByNodePath } from "Commons/AutoEvaluations/StateManagement/StateManager";
import { ValidationResult } from "Commons/Mutators/Types";

import { FormAction } from "./FormActions";
import {
    changeAutoEvaluatedType,
    changeAutoEvaluatedValue,
    createEmptyAutoEvaluationState,
    initAutoEvaluationState,
    runAutoEvaluations,
} from "./FormAutoEvaluations";
import { FormState } from "./FormState";
import { setIn } from "./ImmutableOperators";

export function buildInitialState<T, TContext>(
    initialValue: T,
    context: TContext,
    validator?: (value: T) => ValidationResult,
    autoEvaluator?: AutoEvaluator<T>
): FormState<T, TContext> {
    return {
        value: initialValue,
        context: context,
        validationResult: validator != undefined ? validator(initialValue) : undefined,
        validator: validator,
        autoEvaluator: autoEvaluator,
        autoEvaluationState:
            autoEvaluator != undefined
                ? initAutoEvaluationState(initialValue, autoEvaluator)
                : createEmptyAutoEvaluationState<T>(),
    };
}

export function formReducer<TData, TContext>(
    state: FormState<TData, TContext>,
    action: FormAction
): FormState<TData, TContext> {
    const autoEvaluator = state.autoEvaluator;
    if (autoEvaluator != undefined) {
        if (action.type === "ChangeAutoEvaluationType") {
            let { value, autoEvaluationState } = state;
            [value, autoEvaluationState] = changeAutoEvaluatedType(
                value,
                autoEvaluationState,
                action.path,
                getKeyByNodePath(action.path),
                action.value
            );
            [value, autoEvaluationState] = runAutoEvaluations(value, autoEvaluationState, autoEvaluator);
            return {
                ...state,
                value: value,
                autoEvaluationState: autoEvaluationState,
            };
        }
        if (action.type === "RunAutoEvaluations") {
            let { value, autoEvaluationState } = state;
            [value, autoEvaluationState] = runAutoEvaluations(value, autoEvaluationState, autoEvaluator);
            return {
                ...state,
                value: value,
                autoEvaluationState: autoEvaluationState,
            };
        }
        if (action.type === "UpdateValue") {
            const nextValue = setIn(state.value, action.path, action.value);
            const validationResult = state.validator != undefined ? state.validator(nextValue) : undefined;

            let nextAutoEvaluationState = state.autoEvaluationState;
            nextAutoEvaluationState = changeAutoEvaluatedValue(
                state.autoEvaluationState,
                getKeyByNodePath(action.path),
                action.value
            );
            return {
                ...state,
                validationResult: validationResult,
                value: nextValue,
                autoEvaluationState: nextAutoEvaluationState,
            };
        }
    }

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
    if (action.type === "ReplaceValidator") {
        return {
            ...state,
            validationResult: action.value != undefined ? action.value(state.value) : undefined,
            validator: action.value,
        };
    }
    if (action.type === "ReplaceContext") {
        return {
            ...state,
            context: action.value,
        };
    }
    if (action.type === "UserChangeContext") {
        const nextContext = setIn(state.context, action.path, action.value);
        return {
            ...state,
            context: nextContext,
        };
    }

    return state;
}
