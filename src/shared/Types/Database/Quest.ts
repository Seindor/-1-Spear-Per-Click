export const enum QuestState {
    Active,
    Completed,
    Failed,
}

export interface IQuestData {
    id: string;

    progress: number;

    completed: QuestState;
}
