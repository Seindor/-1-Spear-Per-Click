// ─────────────────────────────────────────────
//  Pipeline / Components / PipelineValidator.ts
// ─────────────────────────────────────────────

import type { IPipelineStep, PipelineContextData } from "../Types/PipelineTypes";

/**
 * Проверяет:
 *  1. Нет дублирующихся Id
 *  2. Все Before/After ссылаются на существующие Id
 *  3. Нет циклических зависимостей
 */
export class PipelineValidator {
    public Validate<TContext extends PipelineContextData>(steps: IPipelineStep<TContext>[]): void {
        const ids = new Set<string>();

        // 1 — уникальность Id
        for (const step of steps) {
            if (ids.has(step.Id)) {
                error(`[PipelineValidator] Duplicate step Id "${step.Id}"`);
            }
            ids.add(step.Id);
        }

        // 2 — все ссылки существуют
        for (const step of steps) {
            for (const dep of step.After) {
                if (!ids.has(dep)) {
                    error(`[PipelineValidator] Step "${step.Id}" has unknown After dep "${dep}"`);
                }
            }
            for (const dep of step.Before) {
                if (!ids.has(dep)) {
                    error(`[PipelineValidator] Step "${step.Id}" has unknown Before dep "${dep}"`);
                }
            }
        }

        // 3 — циклические зависимости (DFS)
        const visited = new Set<string>();
        const inStack = new Set<string>();

        const visit = (id: string) => {
            if (inStack.has(id)) {
                error(`[PipelineValidator] Cycle detected at "${id}"`);
            }
            if (visited.has(id)) return;

            inStack.add(id);
            visited.add(id);

            const step = steps.find((s) => s.Id === id)!;

            // After означает «я после него» → он предшественник → идём к нему
            for (const dep of step.After) {
                visit(dep);
            }

            inStack.delete(id);
        };

        for (const step of steps) {
            if (!visited.has(step.Id)) visit(step.Id);
        }
    }
}
