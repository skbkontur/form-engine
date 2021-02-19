import { expect } from "chai";

import { TestData1 } from "./FormStoreAutoEvaluationsBases";
import { TestAutoEvaluationBuilder } from "./TestUtils/TestAutoEvaluationBuilder";
import { compileAutoEvaluator } from "./TestUtils/TestAutoEvaluationCompiler";

export interface TestData2 extends TestData1 {
    a1: number;
    b1: number;
    c1?: null | number;
}

describe("FormStoreAutoEvaluationsTest", () => {
    it("check simple auto evaluator", () => {
        const builder = new TestAutoEvaluationBuilder<TestData1>();
        builder
            .target(x => x.c)
            .set(x => x.a + x.b)
            .dependsOn(
                x => x.a,
                x => x.b
            );
        const autoEvaluator = builder.build();

        const newValue = autoEvaluator({ a: 1, b: 2, c: 3 }, { a: 1, b: 3, c: 3 });
        expect(newValue.c).to.eql(4);
    });

    it("check simple auto evaluator (multiple)", () => {
        const builder = new TestAutoEvaluationBuilder<TestData2>();
        builder
            .target(x => x.c)
            .set(x => x.a + x.b)
            .dependsOn(
                x => x.a,
                x => x.b
            );
        builder
            .target(x => x.c1)
            .set(x => x.a1 + x.b1)
            .dependsOn(
                x => x.a1,
                x => x.b1
            );
        const autoEvaluator = builder.build();

        const newValue = autoEvaluator(
            { a: 1, b: 2, c: 3, a1: 1, b1: 2, c1: 3 },
            { a: 1, b: 3, c: 3, a1: 1, b1: 3, c1: 3 }
        );
        expect(newValue.c).to.eql(4);
    });

    it("check babel based auto evaluator builder", () => {
        const autoEvaluator = compileAutoEvaluator<TestData1>(x => (x.c = x.b + x.a));
        const newValue = autoEvaluator({ a: 1, b: 2, c: 3 }, { a: 1, b: 3, c: 3 });
        expect(newValue.c).to.eql(4);
    });

    it("check babel based auto evaluator builder (another arg name)", () => {
        const autoEvaluator = compileAutoEvaluator<TestData1>(y => (y.c = y.b + y.a));
        const newValue = autoEvaluator({ a: 1, b: 2, c: 3 }, { a: 1, b: 3, c: 3 });
        expect(newValue.c).to.eql(4);
    });

    it("check babel based auto evaluator builder (multiple)", () => {
        const autoEvaluator = compileAutoEvaluator<TestData2>(y => {
            y.c = y.b + y.a;
            y.c1 = y.b1 + y.a1;
        });
        const newValue = autoEvaluator(
            { a: 1, b: 2, c: 3, a1: 1, b1: 2, c1: 3 },
            { a: 1, b: 3, c: 3, a1: 1, b1: 3, c1: 3 }
        );
        expect(newValue.c).to.eql(4);
        expect(newValue.c1).to.eql(4);
    });
});
