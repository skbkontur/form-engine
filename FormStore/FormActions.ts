import { AutoValueType } from "Commons/AutoEvaluations/AutoEvaluators";

import { NormalizedPath } from "../Path";

interface FormUpdateAction {
    type: "UpdateValue";
    path: NormalizedPath;
    value: any;
}

interface ChangeAutoEvaluationTypeAction {
    type: "ChangeAutoEvaluationType";
    path: NormalizedPath;
    value: AutoValueType;
}

interface FormReplaceValueAction {
    type: "ReplaceValue";
    value: any;
}

interface FormReplaceValidatorAction {
    type: "ReplaceValidator";
    value: any;
}

interface InitAction {
    type: "@@redux/INIT";
}

interface RunAutoEvaluationsAction {
    type: "RunAutoEvaluations";
}

export type FormAction =
    | InitAction
    | FormReplaceValueAction
    | FormUpdateAction
    | FormReplaceValidatorAction
    | RunAutoEvaluationsAction
    | ChangeAutoEvaluationTypeAction;

export function userUpdateValue(path: NormalizedPath, value: any): FormAction {
    return {
        type: "UpdateValue",
        path: path,
        value: value,
    };
}

export function changeAutoEvaluationType(path: NormalizedPath, value: AutoValueType): FormAction {
    return {
        type: "ChangeAutoEvaluationType",
        path: path,
        value: value,
    };
}

export function runAutoEvaluations(): FormAction {
    return {
        type: "RunAutoEvaluations",
    };
}

export function replaceValue(value: any): FormAction {
    return {
        type: "ReplaceValue",
        value: value,
    };
}

export function replaceValidator(value: any): FormAction {
    return {
        type: "ReplaceValidator",
        value: value,
    };
}
