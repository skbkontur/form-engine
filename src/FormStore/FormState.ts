import { AutoEvaluator } from "../AutoEvaluators";
import { GenericModelValidator, ValidationResult } from "../Types";

import { AutoEvaluationsState } from "./FormAutoEvaluations";

export interface FormState<T, TContext = any> {
    value: T;
    context: TContext;
    validator?: GenericModelValidator<T>;
    validationResult?: ValidationResult;
    autoEvaluator?: AutoEvaluator<T>;
    autoEvaluationState: AutoEvaluationsState<T>;
}
