import { UIButtonAggregate } from "../Aggregates/UIButtonAggregate";
import { UIFrameAggregate } from "../Aggregates/UIFrameAggregate";

export type UIEffectPrototype = (wrapper: UIButtonAggregate | UIFrameAggregate) => void;
