import { ValidationInfo } from "@skbkontur/react-ui-validations";
import createReactContext from "create-react-context";
import { AutoValueType } from "Commons/AutoEvaluations/AutoEvaluators";
import { ValidationResult } from "Commons/Mutators/Types";

import { AutoEvaluationControlState } from "./Controls/ControlBinding";
import { FormAction } from "./FormStore/FormActions";
import { FormState } from "./FormStore/FormState";
import { NormalizedPath, Path } from "./Path";

// TODO мне тут фатально именование не нравится

export interface FormContextActions<T, TContext extends {}> {
    getValidationInfo<T>(state: FormState<T>, path: NormalizedPath): undefined | ValidationInfo;
    getPartialValidationResult<T>(state: FormState<T>, path: NormalizedPath): undefined | ValidationResult;
    getValue<TChild>(target: T, path: Path<T, TChild>): TChild;
    getValueFromContext<TChild>(target: TContext, path: Path<TContext, TChild>): TChild;
    userUpdateValue(path: NormalizedPath, value: any): FormAction;
    changeAutoEvaluationType(path: NormalizedPath, type: AutoValueType): FormAction;
    runAutoEvaluations(): FormAction;
    dispatchCustomAction(action: any): void;
    getAutoEvaluationState<T, TChild>(
        formState: FormState<T>,
        path: Path<T, TChild>
    ): undefined | AutoEvaluationControlState<TChild>;
    userChangeContext(path: NormalizedPath, nextContext: any): FormAction;
}

export const FormActionsContext = createReactContext<FormContextActions<any, any>>(null as any);
