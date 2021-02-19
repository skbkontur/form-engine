import { GenericModelValidator, ValidationResult } from "../Types";

import { AutoEvaluator } from "../AutoEvaluators";

import { AutoEvaluationsState } from "./FormAutoEvaluations";

export interface FormState<T, TContext = any> {
    value: T;
    context: TContext;
    validator?: GenericModelValidator<T>;
    validationResult?: ValidationResult;
    autoEvaluator?: AutoEvaluator<T>;
    autoEvaluationState: AutoEvaluationsState<T>;
}
