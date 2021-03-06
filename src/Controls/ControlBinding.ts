import { ValidationInfo } from "@skbkontur/react-ui-validations";
import findLast from "lodash/findLast";
import isEqual from "lodash/isEqual";

import { AutoValueType } from "../AutoEvaluators";
import { FormState } from "../FormStore/FormState";
import { getIn, setIn } from "../FormStore/ImmutableOperators";
import { getNormalizedPath, NormalizedPath, Path, startsWith } from "../Path";
import { GenericModelValidator, PathFilter, ValidationResult, ValidationResultItem } from "../Types";
import { getKeyByNodePath } from "../Utils";

export function getValue<T, TChild>(target: T, path: Path<T, TChild>): TChild {
    return getIn(target, getNormalizedPath(path));
}

export interface AutoEvaluationControlState<TTarget> {
    type: AutoValueType;
    autoValue: TTarget;
    lastManualValue: TTarget;
    initialValue: TTarget;
}

export function getAutoEvaluationState<T, TChild>(
    formState: FormState<T>,
    path: Path<T, TChild>
): undefined | AutoEvaluationControlState<TChild> {
    return getAutoEvaluationStateFromNormalizedPath(formState, getNormalizedPath(path));
}

export function getAutoEvaluationStateFromNormalizedPath<T, TChild>(
    formState: FormState<T>,
    path: NormalizedPath
): undefined | AutoEvaluationControlState<any> {
    const autoEvaluationState = formState.autoEvaluationState;
    if (autoEvaluationState == undefined) {
        return undefined;
    }
    const controlState = autoEvaluationState.nodeStates[getKeyByNodePath(path)];
    if (controlState == null) {
        return undefined;
    }
    return {
        initialValue: controlState.initialValue,
        autoValue: controlState.autoValue,
        lastManualValue: controlState.lastManualValue,
        type: controlState.type,
    };
}

export function isAllAutoEvaluationsEnabled<T>(formState: FormState<T>, pathFilter?: PathFilter): boolean {
    const autoEvaluationState = formState.autoEvaluationState;
    if (autoEvaluationState == undefined) {
        return false;
    }
    return Object.keys(autoEvaluationState.nodeStates)
        .filter(x => pathFilter && pathFilter(x))
        .every(x => autoEvaluationState.nodeStates[x].type === "AutoEvaluated");
}

export function getValidationInfo<TData>(state: FormState<TData>, path: NormalizedPath): undefined | ValidationInfo {
    return extractValidationInfo(state.validationResult, path);
}

export function extractValidationInfo<TData>(
    validationResult: undefined | ValidationResult,
    path: NormalizedPath
): undefined | ValidationInfo {
    if (validationResult == undefined) {
        return undefined;
    }

    let result = getLastValidationInfoByPath(validationResult, path);
    if (result == undefined && path[path.length - 1] === "0") {
        result = getLastValidationInfoByPath(validationResult, path.slice(0, -1));
    }
    if (result == undefined) {
        return undefined;
    }
    return {
        message: result.text,
        type: result.type,
    };
}

export function getPartialValidationResult<TData>(state: FormState<TData>, path: NormalizedPath): ValidationResult {
    if (state.validationResult == undefined) {
        return [];
    }
    const result = state.validationResult
        .filter(x => startsWith(x.path, path))
        .map(x => ({ ...x, path: x.path.slice(path.length) }));
    if (result == undefined) {
        return [];
    }
    return result;
}

export function getChildValidator<TData, TChild>(
    validator: undefined | GenericModelValidator<TData>,
    rootValue: TData,
    path: NormalizedPath
): undefined | ((value: TChild) => ValidationResult) {
    if (validator == undefined) {
        return undefined;
    }
    return (childValue: TChild) => {
        const rootResult = validator(setIn(rootValue, path, childValue));
        const result = rootResult
            .filter(x => startsWith(x.path, path))
            .map(x => ({
                ...x,
                path: x.path.slice(path.length),
            }));
        return result;
    };
}

function getLastValidationInfoByPath(
    validationResult: undefined | ValidationResult,
    path: NormalizedPath
): ValidationResultItem | undefined {
    const stringPath = path.map(x => x.toString());
    const result = findLast(validationResult, x =>
        isEqual(
            x.path.map(x => x.toString()),
            stringPath
        )
    );
    return result;
}
