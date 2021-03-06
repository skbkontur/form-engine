import { AutoEvaluator } from "../AutoEvaluators";
import { ValidationResult } from "../Types";
import { getKeyByNodePath } from "../Utils";

import { FormAction } from "./FormActions";
import {
    applyAllAutoEvaluatedType,
    AutoEvaluationsState,
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
    autoEvaluator?: AutoEvaluator<T>,
    customInitAutoEvaluationState?: (
        value: T,
        autoEvaluator: AutoEvaluator<T>
    ) => AutoEvaluationsState<T> & { value: T }
): FormState<T, TContext> {
    const autoEvaluationStates =
        autoEvaluator != undefined
            ? customInitAutoEvaluationState == null
                ? initAutoEvaluationState(initialValue, autoEvaluator)
                : customInitAutoEvaluationState(initialValue, autoEvaluator)
            : createEmptyAutoEvaluationState<T>(initialValue);
    return {
        context: context,
        validationResult: validator != undefined ? validator(autoEvaluationStates.value) : undefined,
        validator: validator,
        autoEvaluator: autoEvaluator,
        autoEvaluationState: { nodeStates: autoEvaluationStates.nodeStates },
        value: autoEvaluationStates.value,
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
            const validationResult = state.validator != undefined ? state.validator(value) : undefined;

            return {
                ...state,
                value: value,
                validationResult: validationResult,
                autoEvaluationState: autoEvaluationState,
            };
        }
        if (action.type === "RunAutoEvaluations") {
            let { value, autoEvaluationState } = state;
            [value, autoEvaluationState] = runAutoEvaluations(value, autoEvaluationState, autoEvaluator);
            const validationResult = state.validator != undefined ? state.validator(value) : undefined;

            return {
                ...state,
                validationResult: validationResult,
                value: value,
                autoEvaluationState: autoEvaluationState,
            };
        }
        if (action.type === "RunAllAutoEvaluations") {
            let { value, autoEvaluationState } = state;
            [value, autoEvaluationState] = applyAllAutoEvaluatedType(
                value,
                autoEvaluationState,
                autoEvaluator,
                action.pathFilter
            );
            const validationResult = state.validator != undefined ? state.validator(value) : undefined;

            return {
                ...state,
                value: value,
                validationResult: validationResult,
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
    if (action.type === "SetAutoEvaluationStateToStore") {
        return {
            ...state,
            autoEvaluationState: action.state,
        };
    }

    return state;
}
