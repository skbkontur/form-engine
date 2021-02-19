import { AutoEvaluator, TraverseHandler } from "../../../AutoEvaluators";

import { getIn, setIn } from "../../../FormStore/ImmutableOperators";
import { getNormalizedPath, NormalizedPath, Path } from "../../../Path";

interface IAutoEvaluationRule<T> {
    execute(prev: null | undefined | T, next: T, handler?: TraverseHandler): T;
}

class AutoEvaluationSetEvaluation<T, TTarget> {
    public target: Path<T, TTarget>;
    public evaluator: (source: T) => TTarget;
    public deps: NormalizedPath[] = [];

    public constructor(target: Path<T, TTarget>) {
        this.target = target;
    }

    public set(evaluator: (source: T) => TTarget): AutoEvaluationSetEvaluation<T, TTarget> {
        this.evaluator = evaluator;
        return this;
    }

    public dependsOn(...deps: Array<Path<T, any>>): AutoEvaluationSetEvaluation<T, TTarget> {
        this.deps.push(...deps.map(getNormalizedPath));
        return this;
    }

    public execute(prev: null | T, next: T, handler: TraverseHandler): T {
        const targetNormalizedPath = getNormalizedPath(this.target);
        if (prev == null || this.deps.some(x => getIn(prev, x) !== getIn(next, x)) || this.deps.length === 0) {
            let newValue = this.evaluator(next);
            const customResult = handler != null ? handler(newValue, targetNormalizedPath) : null;
            if (customResult != null && customResult.type === "Value") {
                newValue = customResult.value;
            }
            return setIn(next, targetNormalizedPath, newValue);
        }
        return next;
    }
}

export class TestAutoEvaluationBuilder<T> {
    private readonly setters: Array<IAutoEvaluationRule<T>> = [];

    public target<TTarget>(path: Path<T, TTarget>): AutoEvaluationSetEvaluation<T, TTarget> {
        const autoEvaluationSetEvaluation = new AutoEvaluationSetEvaluation<T, TTarget>(path);
        this.setters.push(autoEvaluationSetEvaluation);
        return autoEvaluationSetEvaluation;
    }

    public build(): AutoEvaluator<T> {
        const setters = this.setters;
        return function autoEvaluator(prev: null | undefined | T, next: T, handler?: TraverseHandler): T {
            return setters.reduce((result, setter) => setter.execute(prev, result, handler), next);
        };
    }
}
