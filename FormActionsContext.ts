import { ValidationInfo } from "@skbkontur/react-ui-validations";
import React from "react";

import { PathFilter, ValidationResult } from "./Types";

import { AutoValueType } from "./AutoEvaluators";
import { AutoEvaluationControlState } from "./Controls/ControlBinding";
import { FormAction } from "./FormStore/FormActions";
import { AutoEvaluationsState } from "./FormStore/FormAutoEvaluations";
import { FormState } from "./FormStore/FormState";
import { NormalizedPath, Path } from "./Path";

export interface FormContextActions<T, TContext extends {}> {
    getValidationInfo<T>(state: FormState<T>, path: NormalizedPath): undefined | ValidationInfo;
    getPartialValidationResult<T>(state: FormState<T>, path: NormalizedPath): undefined | ValidationResult;
    getValue<TChild>(target: T, path: Path<T, TChild>): TChild;
    getValueFromContext<TChild>(target: TContext, path: Path<TContext, TChild>): TChild;
    userUpdateValue(path: NormalizedPath, value: any): FormAction;
    changeAutoEvaluationType(path: NormalizedPath, type: AutoValueType): FormAction;
    runAutoEvaluations(): FormAction;
    runAllAutoEvaluations(fieldsToApply?: PathFilter): FormAction;
    dispatchCustomAction(action: any): void;
    getAutoEvaluationState<T, TChild>(
        formState: FormState<T>,
        path: Path<T, TChild>
    ): undefined | AutoEvaluationControlState<TChild>;
    isAllAutoEvaluationsEnabled<T>(formState: FormState<T>, pathFilter?: PathFilter): boolean;
    setAutoEvaluationStateToStore(state: AutoEvaluationsState<T>): FormAction;
}

export const FormActionsContext = React.createContext<FormContextActions<any, any>>(null as any);
