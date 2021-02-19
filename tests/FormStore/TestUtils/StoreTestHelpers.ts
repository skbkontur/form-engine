import { Store } from "redux";

import { AutoValueType } from "../../../AutoEvaluators";
import { AutoEvaluationControlState, getAutoEvaluationState, getValue } from "../../../Controls/ControlBinding";
import { changeAutoEvaluationType, runAutoEvaluations, userUpdateValue } from "../../../FormStore/FormActions";
import { FormState } from "../../../FormStore/FormState";
import { getNormalizedPath, Path } from "../../../Path";

export function dispatchUserUpdate<T, TTarget>(store: Store<FormState<T>>, path: Path<T, TTarget>, value: TTarget) {
    store.dispatch(userUpdateValue(getNormalizedPath(path), value));
}

export function dispatchRunAutoEvaluations<T>(store: Store<FormState<T>>) {
    store.dispatch(runAutoEvaluations());
}

export function dispatchChangeAutoEvaluationType<T, TTarget>(
    store: Store<FormState<T>>,
    path: Path<T, TTarget>,
    autoValueType: AutoValueType
) {
    store.dispatch(changeAutoEvaluationType(getNormalizedPath(path), autoValueType));
}

export function getValueFromStore<T, TTarget>(store: Store<FormState<T>>, path: Path<T, TTarget>): TTarget {
    return getValue(store.getState().value, path);
}

export function getAutoEvaluationStateFromStore<T, TTarget>(
    store: Store<FormState<T>>,
    path: Path<T, TTarget>
): undefined | AutoEvaluationControlState<TTarget> {
    return getAutoEvaluationState(store.getState(), path);
}
