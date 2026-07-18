import { phaseAlgorith } from "../Types/SolverTypes";

export type CalculatorOperation = "Add" | "Multiply" | "Divide";

export class Calculator {
    public CalculatePhase(
        currentNumber: number,
        values: number[],
        phaseAlgorithm: phaseAlgorith,
        subAlgorithm: CalculatorOperation,
    ): number {
        const expressionOperation = this.GetExpressionOperation(phaseAlgorithm);
        const phaseValue = this.Combine(values, expressionOperation);

        return this.Apply(currentNumber, phaseValue, subAlgorithm);
    }

    public Flat(currentNumber: number, values: number[]): number {
        return this.CalculatePhase(currentNumber, values, "Flat", "Add");
    }

    public Expression(
        currentNumber: number,
        values: number[],
        expressionOperation: CalculatorOperation,
        finalOperation: CalculatorOperation,
    ): number {
        const phaseValue = this.Combine(values, expressionOperation);
        return this.Apply(currentNumber, phaseValue, finalOperation);
    }

    private Combine(values: number[], operation: CalculatorOperation): number {
        let result = this.GetIdentity(operation);

        for (const value of values) {
            result = this.Apply(result, value, operation);
        }

        return result;
    }

    private Apply(left: number, right: number, operation: CalculatorOperation): number {
        switch (operation) {
            case "Add":
                return left + right;

            case "Multiply":
                return left * right;

            case "Divide":
                return left / right;
        }
    }

    private GetExpressionOperation(phaseAlgorithm: phaseAlgorith): CalculatorOperation {
        switch (phaseAlgorithm) {
            case "Flat":
            case "Expression_Add":
                return "Add";

            case "Expression_Mult":
                return "Multiply";

            case "Expression_Divide":
                return "Divide";
        }
    }

    private GetIdentity(operation: CalculatorOperation): number {
        switch (operation) {
            case "Add":
                return 0;

            case "Multiply":
            case "Divide":
                return 1;
        }
    }
}
