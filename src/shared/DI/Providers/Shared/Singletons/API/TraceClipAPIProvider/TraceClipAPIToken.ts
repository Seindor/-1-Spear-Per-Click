import { createToken } from "shared/DI/Token.ts";
import type { Container } from "shared/DI/Container";
import { TraceClipAPI } from "shared/Domain/TraceClip/API/TraceClipAPI";

export const token = createToken<TraceClipAPI>("TraceClipAPI");
