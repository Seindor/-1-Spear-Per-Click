export type AtomPrimitive =
    | string
    | number
    | boolean
    | undefined
    | Callback
    | Instance
    | Vector2
    | Vector3
    | CFrame
    | Color3
    | BrickColor
    | EnumItem;

type StringKeyOf<T> = Extract<keyof T, string>;

type IsObject<T> = T extends AtomPrimitive
    ? false
    : T extends readonly unknown[]
      ? false
      : T extends object
        ? true
        : false;

type IsStringRecord<T> = string extends keyof T ? true : false;

export type AtomRecordValue<T> = T extends Record<string, infer TValue> ? TValue : never;

export type AtomPath<T> =
    IsObject<T> extends false
        ? never
        : IsStringRecord<T> extends true
          ? string | `${string}/${AtomPath<AtomRecordValue<T>>}`
          : {
                [K in StringKeyOf<T>]: IsObject<T[K]> extends true
                    ? K | `${K}/${AtomPath<T[K]>}`
                    : K;
            }[StringKeyOf<T>];

export type AtomPathValue<T, TPath extends string> = TPath extends `${infer TKey}/${infer TRest}`
    ? TKey extends keyof T
        ? AtomPathValue<T[TKey], TRest>
        : T extends Record<string, infer TValue>
          ? AtomPathValue<TValue, TRest>
          : never
    : TPath extends keyof T
      ? T[TPath]
      : T extends Record<string, infer TValue>
        ? TValue
        : never;
