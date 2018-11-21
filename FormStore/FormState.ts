import { AutoEvaluator } from "Commons/AutoEvaluations/AutoEvaluators";
import { ValidationResult } from "Commons/Mutators/Types";

import { GenericModelValidator } from "../Types";

import { AutoEvaluationsState } from "./FormAutoEvaluations";

export interface FormState<T, TContext = any> {
    value: T;
    context: TContext;
    validator?: GenericModelValidator<T>;
    validationResult?: ValidationResult;
    autoEvaluator?: AutoEvaluator<T>;
    autoEvaluationState: AutoEvaluationsState<T>;
}
