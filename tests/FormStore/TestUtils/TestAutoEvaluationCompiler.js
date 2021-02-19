import generate from "@babel/generator";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

import { TestAutoEvaluationBuilder } from "./TestAutoEvaluationBuilder";

/**
 * Тут я просто пофанился, хотле сделать короче код конфигурации автовычислениями тесты.
 * В принципе @babel/parser и прочие всегда есть, ибо компилируем всё бабелем.
 */
export function compileAutoEvaluator(expression) {
    const ast = parse("var __expr__ = " + expression.toString());
    const builder = new TestAutoEvaluationBuilder();
    let inputArgName = "x";

    traverse(ast, {
        enter: function (path) {
            if (path.node.type === "VariableDeclarator" && path.node.id.name === "__expr__") {
                inputArgName = path.node.init.params[0].name;
            }
            if (path.node.type === "AssignmentExpression") {
                builder
                    .target(new Function(inputArgName, "return " + generate(path.node.left).code))
                    .set(new Function(inputArgName, "return " + generate(path.node.right).code));
            }
        },
    });
    return builder.build();
}
