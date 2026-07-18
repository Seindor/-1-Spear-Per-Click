// ─────────────────────────────────────────────
//  Pipeline / Components / PipelineSorter.ts
// ─────────────────────────────────────────────

import type { IPipelineStep, PipelineContextData } from "../Types/PipelineTypes";

/**
 * Топологическая сортировка (алгоритм Кана).
 *
 * Before = ["Spawn"]   → этот шаг должен быть до "Spawn"
 * After  = ["LoadData"] → этот шаг должен быть после "LoadData"
 *
 * Нет Priority — только явные зависимости.
 */
export class PipelineSorter {
    public Sort<TContext extends PipelineContextData>(
        steps: IPipelineStep<TContext>[],
    ): IPipelineStep<TContext>[] {
        // Нормализуем Before → After на противоположном шаге
        // Строим граф зависимостей: id → список тех, кто должен идти после него
        const graph = new Map<string, string[]>(); // id → successors
        const inDegree = new Map<string, number>(); // id → кол-во предшественников

        for (const step of steps) {
            if (!graph.has(step.Id)) graph.set(step.Id, []);
            if (!inDegree.has(step.Id)) inDegree.set(step.Id, 0);
        }

        for (const step of steps) {
            // After = ["LoadData"] → LoadData должен идти ДО step
            for (const dep of step.After) {
                graph.get(dep)!.push(step.Id);
                inDegree.set(step.Id, (inDegree.get(step.Id) ?? 0) + 1);
            }

            // Before = ["Spawn"] → step должен идти ДО Spawn
            for (const dep of step.Before) {
                graph.get(step.Id)!.push(dep);
                inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
            }
        }

        // Kahn — очередь из вершин без предшественников
        const queue: string[] = [];
        for (const [id, deg] of inDegree) {
            if (deg === 0) queue.push(id);
        }

        const order: string[] = [];

        while (queue.size() > 0) {
            const id = queue.shift()!;
            order.push(id);

            for (const successor of graph.get(id) ?? []) {
                const newDeg = (inDegree.get(successor) ?? 1) - 1;
                inDegree.set(successor, newDeg);
                if (newDeg === 0) queue.push(successor);
            }
        }

        if (order.size() !== steps.size()) {
            error("[PipelineSorter] Cycle detected — cannot sort steps");
        }

        // Восстанавливаем объекты шагов в правильном порядке
        return order.map((id) => steps.find((s) => s.Id === id)!);
    }
}
