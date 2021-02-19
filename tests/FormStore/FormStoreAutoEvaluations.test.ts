import { expect } from "chai";
import { Store } from "redux";

import { AutoEvaluator, AutoValueType } from "../../AutoEvaluators";
import { NodeState } from "../../FormStore/FormAutoEvaluations";
import { FormState } from "../../FormStore/FormState";
import { compileAutoEvaluator } from "../FormStore/TestUtils/TestAutoEvaluationCompiler";

import { createFormStore, TestData1 } from "./FormStoreAutoEvaluationsBases";
import {
    dispatchChangeAutoEvaluationType,
    dispatchRunAutoEvaluations,
    dispatchUserUpdate,
    getAutoEvaluationStateFromStore,
    getValueFromStore,
} from "./TestUtils/StoreTestHelpers";
import { TestAutoEvaluationBuilder } from "./TestUtils/TestAutoEvaluationBuilder";

function strictCast<T>(value: T): T {
    return value;
}

describe("FormStoreAutoEvaluationsTest", () => {
    const initialStates = {
        emptyValue: strictCast<TestData1>({ a: 1, b: 2, c: null }),
        equalsToAuto: strictCast<TestData1>({ a: 1, b: 2, c: 3 }),
        notEqualsToAuto: strictCast<TestData1>({ a: 1, b: 2, c: 4 }),
    };

    let c_eq_a_plus_b: AutoEvaluator<TestData1>;

    before(() => {
        c_eq_a_plus_b = compileAutoEvaluator<TestData1>(x => (x.c = x.a + x.b));
    });

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

    // стартовое значение: пустое, не равно автовыч-му, равно автовыч-му
    // Операция1:
    //  изменить значение руками (новое ручное, совп. с авто, совп. с начальным),
    //  установить тип (ручной, авто, начальный)
    // Операция2:
    //  изменить значение руками (новое ручное, совп. с авто, совп. с начальным),
    //  установить тип (ручной, авто, начальный)
    //
    // Операция3:
    //  изменить зависимое значение руками,

    it("Начало: пустое", () => {
        const store = createFormStore(initialStates.emptyValue, c_eq_a_plus_b);
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: null,
        });
    });

    it("Начало: равно автовыч-му", () => {
        const store = createFormStore(initialStates.equalsToAuto, c_eq_a_plus_b);
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: 3,
        });
    });

    it("Начало: НЕравно автовыч-му", () => {
        const store = createFormStore(initialStates.notEqualsToAuto, c_eq_a_plus_b);
        checkAutoValueAndState(store, 4, {
            type: "Initial",
            autoValue: 3,
            lastManualValue: null,
            initialValue: 4,
        });
    });

    it("Начало: пустое; Меняем на НЕравное автовыч-му", () => {
        const store = createFormStore(initialStates.emptyValue, c_eq_a_plus_b);
        changeAutoFieldValueDirectly(store, 4);
        checkAutoValueAndState(store, 4, {
            type: "Manual",
            autoValue: 3,
            lastManualValue: 4,
            initialValue: null,
        });
    });

    it("Начало: пустое; Меняем на равное автовыч-му", () => {
        const store = createFormStore(initialStates.emptyValue, c_eq_a_plus_b);
        changeAutoFieldValueDirectly(store, 3);
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: null,
        });
    });

    it("Начало: пустое; Меняем на пустое", () => {
        const store = createFormStore(initialStates.emptyValue, c_eq_a_plus_b);
        changeAutoFieldValueDirectly(store, undefined);
        checkAutoValueAndState(store, undefined, {
            type: "Manual",
            autoValue: 3,
            lastManualValue: undefined,
            initialValue: null,
        });
    });

    it("Начало: равное автовыч-му; Меняем на НЕравное автовыч-му", () => {
        const store = createFormStore(initialStates.equalsToAuto, c_eq_a_plus_b);
        changeAutoFieldValueDirectly(store, 4);
        checkAutoValueAndState(store, 4, {
            type: "Manual",
            autoValue: 3,
            lastManualValue: 4,
            initialValue: 3,
        });
    });

    it("Начало: НЕравное автовыч-му; Меняем на равное автовыч-му", () => {
        const store = createFormStore(initialStates.notEqualsToAuto, c_eq_a_plus_b);
        changeAutoFieldValueDirectly(store, 3);
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: 4,
        });
    });

    it("Начало: пустое; Меняем зависимое поле", () => {
        const store = createFormStore(initialStates.emptyValue, c_eq_a_plus_b);
        changeDependentFieldValue(store, 2);
        checkAutoValueAndState(store, 4, {
            type: "AutoEvaluated",
            autoValue: 4,
            lastManualValue: null,
            initialValue: null,
        });
    });

    it("Начало: равно автовыч-му; Меняем зависимое поле", () => {
        const store = createFormStore(initialStates.equalsToAuto, c_eq_a_plus_b);
        changeDependentFieldValue(store, 2);
        checkAutoValueAndState(store, 4, {
            type: "AutoEvaluated",
            autoValue: 4,
            lastManualValue: null,
            initialValue: 3,
        });
    });

    it("Начало: НЕравно автовыч-му; Меняем зависимое поле", () => {
        const store = createFormStore(initialStates.notEqualsToAuto, c_eq_a_plus_b);
        changeDependentFieldValue(store, 3);
        checkAutoValueAndState(store, 4, {
            type: "Initial",
            autoValue: 5,
            lastManualValue: null,
            initialValue: 4,
        });
    });

    it("Начало: пустое; меняем тип на автовыч-ый", () => {
        const store = createFormStore(initialStates.emptyValue, c_eq_a_plus_b);
        changeAutoFieldType(store, "AutoEvaluated");
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: null,
        });
    });

    it("Начало: НЕравно автовыч-му; меняем тип на автовыч-ый", () => {
        const store = createFormStore(initialStates.notEqualsToAuto, c_eq_a_plus_b);
        changeAutoFieldType(store, "AutoEvaluated");
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: null,
            initialValue: 4,
        });
    });

    it("Начало: равно автовыч-му; Меняем на НЕравно аввыч-му; Меняем тип на автовыч-ный", () => {
        const store = createFormStore(initialStates.equalsToAuto, c_eq_a_plus_b);
        changeAutoFieldValueDirectly(store, 4);
        changeAutoFieldType(store, "AutoEvaluated");
        checkAutoValueAndState(store, 3, {
            type: "AutoEvaluated",
            autoValue: 3,
            lastManualValue: 4,
            initialValue: 3,
        });
    });

    it("Начало: равно автовыч-му; Меняем на НЕравно аввыч-му; Меняем тип на автовыч-ный; Проверяем зависимую автовычислялку", () => {
        const store = createFormStore(
            { a: 1, b: 2, c: 3, d: 6 },
            compileAutoEvaluator<TestData1>(x => {
                x.c = x.a + x.b;
                x.d = x.c * 2;
            })
        );
        changeAutoFieldValueDirectly(store, 4);
        changeAutoFieldType(store, "AutoEvaluated");
        expect(getValueFromStore(store, x => x.d)).to.eql(6);
        expect(getAutoEvaluationStateFromStore(store, x => x.d)).to.eql({
            type: "AutoEvaluated",
            autoValue: 6,
            lastManualValue: null,
            initialValue: 6,
        });
    });

    it("Начало: d равно автовыч-му от неавтовычисленного; d - автовыч-е", () => {
        const store = createFormStore(
            { a: 1, b: 2, c: 4, d: 8 },
            compileAutoEvaluator<TestData1>(x => {
                x.c = x.a + x.b;
                x.d = x.c * 2;
            })
        );
        expect(getAutoEvaluationStateFromStore(store, x => x.d)).to.eql({
            type: "AutoEvaluated",
            autoValue: 8,
            lastManualValue: null,
            initialValue: 8,
        });
    });

    function checkAutoValueAndState(
        store: Store<FormState<TestData1>>,
        value: undefined | null | number,
        state: NodeState
    ) {
        expect(getValueFromStore(store, x => x.c)).to.eql(value);
        expect(getAutoEvaluationStateFromStore(store, x => x.c)).to.eql(state);
    }

    function changeAutoFieldType(store: Store<FormState<TestData1>>, type: AutoValueType) {
        dispatchChangeAutoEvaluationType(store, x => x.c, type);
    }

    function changeAutoFieldValueDirectly(store: Store<FormState<TestData1>>, value: undefined | number) {
        dispatchUserUpdate(store, x => x.c, value);
        dispatchRunAutoEvaluations(store);
    }

    function changeDependentFieldValue(store: Store<FormState<TestData1>>, value: undefined | number) {
        dispatchUserUpdate(store, x => x.a, value);
        dispatchRunAutoEvaluations(store);
    }
});
