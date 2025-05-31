
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model file
 * 
 */
export type file = $Result.DefaultSelection<Prisma.$filePayload>
/**
 * Model folder
 * 
 */
export type folder = $Result.DefaultSelection<Prisma.$folderPayload>
/**
 * Model onboarding_status
 * 
 */
export type onboarding_status = $Result.DefaultSelection<Prisma.$onboarding_statusPayload>
/**
 * Model user
 * 
 */
export type user = $Result.DefaultSelection<Prisma.$userPayload>
/**
 * Model workspace
 * 
 */
export type workspace = $Result.DefaultSelection<Prisma.$workspacePayload>
/**
 * Model approval
 * 
 */
export type approval = $Result.DefaultSelection<Prisma.$approvalPayload>
/**
 * Model notification
 * 
 */
export type notification = $Result.DefaultSelection<Prisma.$notificationPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Files
 * const files = await prisma.file.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Files
   * const files = await prisma.file.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.file`: Exposes CRUD operations for the **file** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Files
    * const files = await prisma.file.findMany()
    * ```
    */
  get file(): Prisma.fileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.folder`: Exposes CRUD operations for the **folder** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Folders
    * const folders = await prisma.folder.findMany()
    * ```
    */
  get folder(): Prisma.folderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.onboarding_status`: Exposes CRUD operations for the **onboarding_status** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Onboarding_statuses
    * const onboarding_statuses = await prisma.onboarding_status.findMany()
    * ```
    */
  get onboarding_status(): Prisma.onboarding_statusDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **user** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.userDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workspace`: Exposes CRUD operations for the **workspace** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Workspaces
    * const workspaces = await prisma.workspace.findMany()
    * ```
    */
  get workspace(): Prisma.workspaceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.approval`: Exposes CRUD operations for the **approval** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Approvals
    * const approvals = await prisma.approval.findMany()
    * ```
    */
  get approval(): Prisma.approvalDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notification`: Exposes CRUD operations for the **notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.notificationDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    file: 'file',
    folder: 'folder',
    onboarding_status: 'onboarding_status',
    user: 'user',
    workspace: 'workspace',
    approval: 'approval',
    notification: 'notification'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "file" | "folder" | "onboarding_status" | "user" | "workspace" | "approval" | "notification"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      file: {
        payload: Prisma.$filePayload<ExtArgs>
        fields: Prisma.fileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.fileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.fileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>
          }
          findFirst: {
            args: Prisma.fileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.fileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>
          }
          findMany: {
            args: Prisma.fileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>[]
          }
          create: {
            args: Prisma.fileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>
          }
          createMany: {
            args: Prisma.fileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.fileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>[]
          }
          delete: {
            args: Prisma.fileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>
          }
          update: {
            args: Prisma.fileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>
          }
          deleteMany: {
            args: Prisma.fileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.fileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.fileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>[]
          }
          upsert: {
            args: Prisma.fileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$filePayload>
          }
          aggregate: {
            args: Prisma.FileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFile>
          }
          groupBy: {
            args: Prisma.fileGroupByArgs<ExtArgs>
            result: $Utils.Optional<FileGroupByOutputType>[]
          }
          count: {
            args: Prisma.fileCountArgs<ExtArgs>
            result: $Utils.Optional<FileCountAggregateOutputType> | number
          }
        }
      }
      folder: {
        payload: Prisma.$folderPayload<ExtArgs>
        fields: Prisma.folderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.folderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.folderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>
          }
          findFirst: {
            args: Prisma.folderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.folderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>
          }
          findMany: {
            args: Prisma.folderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>[]
          }
          create: {
            args: Prisma.folderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>
          }
          createMany: {
            args: Prisma.folderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.folderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>[]
          }
          delete: {
            args: Prisma.folderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>
          }
          update: {
            args: Prisma.folderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>
          }
          deleteMany: {
            args: Prisma.folderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.folderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.folderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>[]
          }
          upsert: {
            args: Prisma.folderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$folderPayload>
          }
          aggregate: {
            args: Prisma.FolderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFolder>
          }
          groupBy: {
            args: Prisma.folderGroupByArgs<ExtArgs>
            result: $Utils.Optional<FolderGroupByOutputType>[]
          }
          count: {
            args: Prisma.folderCountArgs<ExtArgs>
            result: $Utils.Optional<FolderCountAggregateOutputType> | number
          }
        }
      }
      onboarding_status: {
        payload: Prisma.$onboarding_statusPayload<ExtArgs>
        fields: Prisma.onboarding_statusFieldRefs
        operations: {
          findUnique: {
            args: Prisma.onboarding_statusFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.onboarding_statusFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>
          }
          findFirst: {
            args: Prisma.onboarding_statusFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.onboarding_statusFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>
          }
          findMany: {
            args: Prisma.onboarding_statusFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>[]
          }
          create: {
            args: Prisma.onboarding_statusCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>
          }
          createMany: {
            args: Prisma.onboarding_statusCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.onboarding_statusCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>[]
          }
          delete: {
            args: Prisma.onboarding_statusDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>
          }
          update: {
            args: Prisma.onboarding_statusUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>
          }
          deleteMany: {
            args: Prisma.onboarding_statusDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.onboarding_statusUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.onboarding_statusUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>[]
          }
          upsert: {
            args: Prisma.onboarding_statusUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$onboarding_statusPayload>
          }
          aggregate: {
            args: Prisma.Onboarding_statusAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOnboarding_status>
          }
          groupBy: {
            args: Prisma.onboarding_statusGroupByArgs<ExtArgs>
            result: $Utils.Optional<Onboarding_statusGroupByOutputType>[]
          }
          count: {
            args: Prisma.onboarding_statusCountArgs<ExtArgs>
            result: $Utils.Optional<Onboarding_statusCountAggregateOutputType> | number
          }
        }
      }
      user: {
        payload: Prisma.$userPayload<ExtArgs>
        fields: Prisma.userFieldRefs
        operations: {
          findUnique: {
            args: Prisma.userFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.userFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          findFirst: {
            args: Prisma.userFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.userFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          findMany: {
            args: Prisma.userFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>[]
          }
          create: {
            args: Prisma.userCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          createMany: {
            args: Prisma.userCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.userCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>[]
          }
          delete: {
            args: Prisma.userDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          update: {
            args: Prisma.userUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          deleteMany: {
            args: Prisma.userDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.userUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.userUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>[]
          }
          upsert: {
            args: Prisma.userUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.userGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.userCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      workspace: {
        payload: Prisma.$workspacePayload<ExtArgs>
        fields: Prisma.workspaceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.workspaceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.workspaceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>
          }
          findFirst: {
            args: Prisma.workspaceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.workspaceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>
          }
          findMany: {
            args: Prisma.workspaceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>[]
          }
          create: {
            args: Prisma.workspaceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>
          }
          createMany: {
            args: Prisma.workspaceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.workspaceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>[]
          }
          delete: {
            args: Prisma.workspaceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>
          }
          update: {
            args: Prisma.workspaceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>
          }
          deleteMany: {
            args: Prisma.workspaceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.workspaceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.workspaceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>[]
          }
          upsert: {
            args: Prisma.workspaceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$workspacePayload>
          }
          aggregate: {
            args: Prisma.WorkspaceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkspace>
          }
          groupBy: {
            args: Prisma.workspaceGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkspaceGroupByOutputType>[]
          }
          count: {
            args: Prisma.workspaceCountArgs<ExtArgs>
            result: $Utils.Optional<WorkspaceCountAggregateOutputType> | number
          }
        }
      }
      approval: {
        payload: Prisma.$approvalPayload<ExtArgs>
        fields: Prisma.approvalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.approvalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.approvalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>
          }
          findFirst: {
            args: Prisma.approvalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.approvalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>
          }
          findMany: {
            args: Prisma.approvalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>[]
          }
          create: {
            args: Prisma.approvalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>
          }
          createMany: {
            args: Prisma.approvalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.approvalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>[]
          }
          delete: {
            args: Prisma.approvalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>
          }
          update: {
            args: Prisma.approvalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>
          }
          deleteMany: {
            args: Prisma.approvalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.approvalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.approvalUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>[]
          }
          upsert: {
            args: Prisma.approvalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$approvalPayload>
          }
          aggregate: {
            args: Prisma.ApprovalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApproval>
          }
          groupBy: {
            args: Prisma.approvalGroupByArgs<ExtArgs>
            result: $Utils.Optional<ApprovalGroupByOutputType>[]
          }
          count: {
            args: Prisma.approvalCountArgs<ExtArgs>
            result: $Utils.Optional<ApprovalCountAggregateOutputType> | number
          }
        }
      }
      notification: {
        payload: Prisma.$notificationPayload<ExtArgs>
        fields: Prisma.notificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.notificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.notificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>
          }
          findFirst: {
            args: Prisma.notificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.notificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>
          }
          findMany: {
            args: Prisma.notificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>[]
          }
          create: {
            args: Prisma.notificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>
          }
          createMany: {
            args: Prisma.notificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.notificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>[]
          }
          delete: {
            args: Prisma.notificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>
          }
          update: {
            args: Prisma.notificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>
          }
          deleteMany: {
            args: Prisma.notificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.notificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.notificationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>[]
          }
          upsert: {
            args: Prisma.notificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.notificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.notificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    file?: fileOmit
    folder?: folderOmit
    onboarding_status?: onboarding_statusOmit
    user?: userOmit
    workspace?: workspaceOmit
    approval?: approvalOmit
    notification?: notificationOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type FileCountOutputType
   */

  export type FileCountOutputType = {
    approvals: number
  }

  export type FileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approvals?: boolean | FileCountOutputTypeCountApprovalsArgs
  }

  // Custom InputTypes
  /**
   * FileCountOutputType without action
   */
  export type FileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileCountOutputType
     */
    select?: FileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FileCountOutputType without action
   */
  export type FileCountOutputTypeCountApprovalsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: approvalWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    approvals_to_action: number
    approvals_assigned: number
    notifications: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approvals_to_action?: boolean | UserCountOutputTypeCountApprovals_to_actionArgs
    approvals_assigned?: boolean | UserCountOutputTypeCountApprovals_assignedArgs
    notifications?: boolean | UserCountOutputTypeCountNotificationsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountApprovals_to_actionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: approvalWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountApprovals_assignedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: approvalWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: notificationWhereInput
  }


  /**
   * Count Type WorkspaceCountOutputType
   */

  export type WorkspaceCountOutputType = {
    file: number
    folder: number
  }

  export type WorkspaceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    file?: boolean | WorkspaceCountOutputTypeCountFileArgs
    folder?: boolean | WorkspaceCountOutputTypeCountFolderArgs
  }

  // Custom InputTypes
  /**
   * WorkspaceCountOutputType without action
   */
  export type WorkspaceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspaceCountOutputType
     */
    select?: WorkspaceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WorkspaceCountOutputType without action
   */
  export type WorkspaceCountOutputTypeCountFileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: fileWhereInput
  }

  /**
   * WorkspaceCountOutputType without action
   */
  export type WorkspaceCountOutputTypeCountFolderArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: folderWhereInput
  }


  /**
   * Models
   */

  /**
   * Model file
   */

  export type AggregateFile = {
    _count: FileCountAggregateOutputType | null
    _min: FileMinAggregateOutputType | null
    _max: FileMaxAggregateOutputType | null
  }

  export type FileMinAggregateOutputType = {
    id: string | null
    workspace_id: string | null
    user_id: string | null
    description: string | null
    color: string | null
    created_at: Date | null
    updated_at: Date | null
    pengesahan_pada: Date | null
    is_self_file: boolean | null
  }

  export type FileMaxAggregateOutputType = {
    id: string | null
    workspace_id: string | null
    user_id: string | null
    description: string | null
    color: string | null
    created_at: Date | null
    updated_at: Date | null
    pengesahan_pada: Date | null
    is_self_file: boolean | null
  }

  export type FileCountAggregateOutputType = {
    id: number
    workspace_id: number
    user_id: number
    description: number
    color: number
    labels: number
    created_at: number
    updated_at: number
    pengesahan_pada: number
    is_self_file: number
    _all: number
  }


  export type FileMinAggregateInputType = {
    id?: true
    workspace_id?: true
    user_id?: true
    description?: true
    color?: true
    created_at?: true
    updated_at?: true
    pengesahan_pada?: true
    is_self_file?: true
  }

  export type FileMaxAggregateInputType = {
    id?: true
    workspace_id?: true
    user_id?: true
    description?: true
    color?: true
    created_at?: true
    updated_at?: true
    pengesahan_pada?: true
    is_self_file?: true
  }

  export type FileCountAggregateInputType = {
    id?: true
    workspace_id?: true
    user_id?: true
    description?: true
    color?: true
    labels?: true
    created_at?: true
    updated_at?: true
    pengesahan_pada?: true
    is_self_file?: true
    _all?: true
  }

  export type FileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which file to aggregate.
     */
    where?: fileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of files to fetch.
     */
    orderBy?: fileOrderByWithRelationInput | fileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: fileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` files.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned files
    **/
    _count?: true | FileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FileMaxAggregateInputType
  }

  export type GetFileAggregateType<T extends FileAggregateArgs> = {
        [P in keyof T & keyof AggregateFile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFile[P]>
      : GetScalarType<T[P], AggregateFile[P]>
  }




  export type fileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: fileWhereInput
    orderBy?: fileOrderByWithAggregationInput | fileOrderByWithAggregationInput[]
    by: FileScalarFieldEnum[] | FileScalarFieldEnum
    having?: fileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FileCountAggregateInputType | true
    _min?: FileMinAggregateInputType
    _max?: FileMaxAggregateInputType
  }

  export type FileGroupByOutputType = {
    id: string
    workspace_id: string
    user_id: string
    description: string | null
    color: string | null
    labels: string[]
    created_at: Date
    updated_at: Date
    pengesahan_pada: Date | null
    is_self_file: boolean | null
    _count: FileCountAggregateOutputType | null
    _min: FileMinAggregateOutputType | null
    _max: FileMaxAggregateOutputType | null
  }

  type GetFileGroupByPayload<T extends fileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FileGroupByOutputType[P]>
            : GetScalarType<T[P], FileGroupByOutputType[P]>
        }
      >
    >


  export type fileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    pengesahan_pada?: boolean
    is_self_file?: boolean
    approvals?: boolean | file$approvalsArgs<ExtArgs>
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
    _count?: boolean | FileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["file"]>

  export type fileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    pengesahan_pada?: boolean
    is_self_file?: boolean
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["file"]>

  export type fileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    pengesahan_pada?: boolean
    is_self_file?: boolean
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["file"]>

  export type fileSelectScalar = {
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    pengesahan_pada?: boolean
    is_self_file?: boolean
  }

  export type fileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "workspace_id" | "user_id" | "description" | "color" | "labels" | "created_at" | "updated_at" | "pengesahan_pada" | "is_self_file", ExtArgs["result"]["file"]>
  export type fileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approvals?: boolean | file$approvalsArgs<ExtArgs>
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
    _count?: boolean | FileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type fileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }
  export type fileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }

  export type $filePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "file"
    objects: {
      approvals: Prisma.$approvalPayload<ExtArgs>[]
      workspace: Prisma.$workspacePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      workspace_id: string
      user_id: string
      description: string | null
      color: string | null
      labels: string[]
      created_at: Date
      updated_at: Date
      pengesahan_pada: Date | null
      is_self_file: boolean | null
    }, ExtArgs["result"]["file"]>
    composites: {}
  }

  type fileGetPayload<S extends boolean | null | undefined | fileDefaultArgs> = $Result.GetResult<Prisma.$filePayload, S>

  type fileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<fileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FileCountAggregateInputType | true
    }

  export interface fileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['file'], meta: { name: 'file' } }
    /**
     * Find zero or one File that matches the filter.
     * @param {fileFindUniqueArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends fileFindUniqueArgs>(args: SelectSubset<T, fileFindUniqueArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one File that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {fileFindUniqueOrThrowArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends fileFindUniqueOrThrowArgs>(args: SelectSubset<T, fileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first File that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {fileFindFirstArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends fileFindFirstArgs>(args?: SelectSubset<T, fileFindFirstArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first File that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {fileFindFirstOrThrowArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends fileFindFirstOrThrowArgs>(args?: SelectSubset<T, fileFindFirstOrThrowArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Files that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {fileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Files
     * const files = await prisma.file.findMany()
     * 
     * // Get first 10 Files
     * const files = await prisma.file.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fileWithIdOnly = await prisma.file.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends fileFindManyArgs>(args?: SelectSubset<T, fileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a File.
     * @param {fileCreateArgs} args - Arguments to create a File.
     * @example
     * // Create one File
     * const File = await prisma.file.create({
     *   data: {
     *     // ... data to create a File
     *   }
     * })
     * 
     */
    create<T extends fileCreateArgs>(args: SelectSubset<T, fileCreateArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Files.
     * @param {fileCreateManyArgs} args - Arguments to create many Files.
     * @example
     * // Create many Files
     * const file = await prisma.file.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends fileCreateManyArgs>(args?: SelectSubset<T, fileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Files and returns the data saved in the database.
     * @param {fileCreateManyAndReturnArgs} args - Arguments to create many Files.
     * @example
     * // Create many Files
     * const file = await prisma.file.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Files and only return the `id`
     * const fileWithIdOnly = await prisma.file.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends fileCreateManyAndReturnArgs>(args?: SelectSubset<T, fileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a File.
     * @param {fileDeleteArgs} args - Arguments to delete one File.
     * @example
     * // Delete one File
     * const File = await prisma.file.delete({
     *   where: {
     *     // ... filter to delete one File
     *   }
     * })
     * 
     */
    delete<T extends fileDeleteArgs>(args: SelectSubset<T, fileDeleteArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one File.
     * @param {fileUpdateArgs} args - Arguments to update one File.
     * @example
     * // Update one File
     * const file = await prisma.file.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends fileUpdateArgs>(args: SelectSubset<T, fileUpdateArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Files.
     * @param {fileDeleteManyArgs} args - Arguments to filter Files to delete.
     * @example
     * // Delete a few Files
     * const { count } = await prisma.file.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends fileDeleteManyArgs>(args?: SelectSubset<T, fileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Files.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {fileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Files
     * const file = await prisma.file.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends fileUpdateManyArgs>(args: SelectSubset<T, fileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Files and returns the data updated in the database.
     * @param {fileUpdateManyAndReturnArgs} args - Arguments to update many Files.
     * @example
     * // Update many Files
     * const file = await prisma.file.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Files and only return the `id`
     * const fileWithIdOnly = await prisma.file.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends fileUpdateManyAndReturnArgs>(args: SelectSubset<T, fileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one File.
     * @param {fileUpsertArgs} args - Arguments to update or create a File.
     * @example
     * // Update or create a File
     * const file = await prisma.file.upsert({
     *   create: {
     *     // ... data to create a File
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the File we want to update
     *   }
     * })
     */
    upsert<T extends fileUpsertArgs>(args: SelectSubset<T, fileUpsertArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Files.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {fileCountArgs} args - Arguments to filter Files to count.
     * @example
     * // Count the number of Files
     * const count = await prisma.file.count({
     *   where: {
     *     // ... the filter for the Files we want to count
     *   }
     * })
    **/
    count<T extends fileCountArgs>(
      args?: Subset<T, fileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a File.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FileAggregateArgs>(args: Subset<T, FileAggregateArgs>): Prisma.PrismaPromise<GetFileAggregateType<T>>

    /**
     * Group by File.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {fileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends fileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: fileGroupByArgs['orderBy'] }
        : { orderBy?: fileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, fileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the file model
   */
  readonly fields: fileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for file.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__fileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    approvals<T extends file$approvalsArgs<ExtArgs> = {}>(args?: Subset<T, file$approvalsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    workspace<T extends workspaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, workspaceDefaultArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the file model
   */
  interface fileFieldRefs {
    readonly id: FieldRef<"file", 'String'>
    readonly workspace_id: FieldRef<"file", 'String'>
    readonly user_id: FieldRef<"file", 'String'>
    readonly description: FieldRef<"file", 'String'>
    readonly color: FieldRef<"file", 'String'>
    readonly labels: FieldRef<"file", 'String[]'>
    readonly created_at: FieldRef<"file", 'DateTime'>
    readonly updated_at: FieldRef<"file", 'DateTime'>
    readonly pengesahan_pada: FieldRef<"file", 'DateTime'>
    readonly is_self_file: FieldRef<"file", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * file findUnique
   */
  export type fileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * Filter, which file to fetch.
     */
    where: fileWhereUniqueInput
  }

  /**
   * file findUniqueOrThrow
   */
  export type fileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * Filter, which file to fetch.
     */
    where: fileWhereUniqueInput
  }

  /**
   * file findFirst
   */
  export type fileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * Filter, which file to fetch.
     */
    where?: fileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of files to fetch.
     */
    orderBy?: fileOrderByWithRelationInput | fileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for files.
     */
    cursor?: fileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` files.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of files.
     */
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * file findFirstOrThrow
   */
  export type fileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * Filter, which file to fetch.
     */
    where?: fileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of files to fetch.
     */
    orderBy?: fileOrderByWithRelationInput | fileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for files.
     */
    cursor?: fileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` files.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of files.
     */
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * file findMany
   */
  export type fileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * Filter, which files to fetch.
     */
    where?: fileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of files to fetch.
     */
    orderBy?: fileOrderByWithRelationInput | fileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing files.
     */
    cursor?: fileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` files.
     */
    skip?: number
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * file create
   */
  export type fileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * The data needed to create a file.
     */
    data: XOR<fileCreateInput, fileUncheckedCreateInput>
  }

  /**
   * file createMany
   */
  export type fileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many files.
     */
    data: fileCreateManyInput | fileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * file createManyAndReturn
   */
  export type fileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * The data used to create many files.
     */
    data: fileCreateManyInput | fileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * file update
   */
  export type fileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * The data needed to update a file.
     */
    data: XOR<fileUpdateInput, fileUncheckedUpdateInput>
    /**
     * Choose, which file to update.
     */
    where: fileWhereUniqueInput
  }

  /**
   * file updateMany
   */
  export type fileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update files.
     */
    data: XOR<fileUpdateManyMutationInput, fileUncheckedUpdateManyInput>
    /**
     * Filter which files to update
     */
    where?: fileWhereInput
    /**
     * Limit how many files to update.
     */
    limit?: number
  }

  /**
   * file updateManyAndReturn
   */
  export type fileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * The data used to update files.
     */
    data: XOR<fileUpdateManyMutationInput, fileUncheckedUpdateManyInput>
    /**
     * Filter which files to update
     */
    where?: fileWhereInput
    /**
     * Limit how many files to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * file upsert
   */
  export type fileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * The filter to search for the file to update in case it exists.
     */
    where: fileWhereUniqueInput
    /**
     * In case the file found by the `where` argument doesn't exist, create a new file with this data.
     */
    create: XOR<fileCreateInput, fileUncheckedCreateInput>
    /**
     * In case the file was found with the provided `where` argument, update it with this data.
     */
    update: XOR<fileUpdateInput, fileUncheckedUpdateInput>
  }

  /**
   * file delete
   */
  export type fileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    /**
     * Filter which file to delete.
     */
    where: fileWhereUniqueInput
  }

  /**
   * file deleteMany
   */
  export type fileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which files to delete
     */
    where?: fileWhereInput
    /**
     * Limit how many files to delete.
     */
    limit?: number
  }

  /**
   * file.approvals
   */
  export type file$approvalsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    where?: approvalWhereInput
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    cursor?: approvalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ApprovalScalarFieldEnum | ApprovalScalarFieldEnum[]
  }

  /**
   * file without action
   */
  export type fileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
  }


  /**
   * Model folder
   */

  export type AggregateFolder = {
    _count: FolderCountAggregateOutputType | null
    _min: FolderMinAggregateOutputType | null
    _max: FolderMaxAggregateOutputType | null
  }

  export type FolderMinAggregateOutputType = {
    id: string | null
    workspace_id: string | null
    user_id: string | null
    description: string | null
    color: string | null
    created_at: Date | null
    updated_at: Date | null
    is_self_folder: boolean | null
  }

  export type FolderMaxAggregateOutputType = {
    id: string | null
    workspace_id: string | null
    user_id: string | null
    description: string | null
    color: string | null
    created_at: Date | null
    updated_at: Date | null
    is_self_folder: boolean | null
  }

  export type FolderCountAggregateOutputType = {
    id: number
    workspace_id: number
    user_id: number
    description: number
    color: number
    labels: number
    created_at: number
    updated_at: number
    is_self_folder: number
    _all: number
  }


  export type FolderMinAggregateInputType = {
    id?: true
    workspace_id?: true
    user_id?: true
    description?: true
    color?: true
    created_at?: true
    updated_at?: true
    is_self_folder?: true
  }

  export type FolderMaxAggregateInputType = {
    id?: true
    workspace_id?: true
    user_id?: true
    description?: true
    color?: true
    created_at?: true
    updated_at?: true
    is_self_folder?: true
  }

  export type FolderCountAggregateInputType = {
    id?: true
    workspace_id?: true
    user_id?: true
    description?: true
    color?: true
    labels?: true
    created_at?: true
    updated_at?: true
    is_self_folder?: true
    _all?: true
  }

  export type FolderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which folder to aggregate.
     */
    where?: folderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of folders to fetch.
     */
    orderBy?: folderOrderByWithRelationInput | folderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: folderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` folders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned folders
    **/
    _count?: true | FolderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FolderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FolderMaxAggregateInputType
  }

  export type GetFolderAggregateType<T extends FolderAggregateArgs> = {
        [P in keyof T & keyof AggregateFolder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFolder[P]>
      : GetScalarType<T[P], AggregateFolder[P]>
  }




  export type folderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: folderWhereInput
    orderBy?: folderOrderByWithAggregationInput | folderOrderByWithAggregationInput[]
    by: FolderScalarFieldEnum[] | FolderScalarFieldEnum
    having?: folderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FolderCountAggregateInputType | true
    _min?: FolderMinAggregateInputType
    _max?: FolderMaxAggregateInputType
  }

  export type FolderGroupByOutputType = {
    id: string
    workspace_id: string
    user_id: string
    description: string | null
    color: string | null
    labels: string[]
    created_at: Date
    updated_at: Date
    is_self_folder: boolean | null
    _count: FolderCountAggregateOutputType | null
    _min: FolderMinAggregateOutputType | null
    _max: FolderMaxAggregateOutputType | null
  }

  type GetFolderGroupByPayload<T extends folderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FolderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FolderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FolderGroupByOutputType[P]>
            : GetScalarType<T[P], FolderGroupByOutputType[P]>
        }
      >
    >


  export type folderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    is_self_folder?: boolean
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["folder"]>

  export type folderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    is_self_folder?: boolean
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["folder"]>

  export type folderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    is_self_folder?: boolean
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["folder"]>

  export type folderSelectScalar = {
    id?: boolean
    workspace_id?: boolean
    user_id?: boolean
    description?: boolean
    color?: boolean
    labels?: boolean
    created_at?: boolean
    updated_at?: boolean
    is_self_folder?: boolean
  }

  export type folderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "workspace_id" | "user_id" | "description" | "color" | "labels" | "created_at" | "updated_at" | "is_self_folder", ExtArgs["result"]["folder"]>
  export type folderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }
  export type folderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }
  export type folderIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workspace?: boolean | workspaceDefaultArgs<ExtArgs>
  }

  export type $folderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "folder"
    objects: {
      workspace: Prisma.$workspacePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      workspace_id: string
      user_id: string
      description: string | null
      color: string | null
      labels: string[]
      created_at: Date
      updated_at: Date
      is_self_folder: boolean | null
    }, ExtArgs["result"]["folder"]>
    composites: {}
  }

  type folderGetPayload<S extends boolean | null | undefined | folderDefaultArgs> = $Result.GetResult<Prisma.$folderPayload, S>

  type folderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<folderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FolderCountAggregateInputType | true
    }

  export interface folderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['folder'], meta: { name: 'folder' } }
    /**
     * Find zero or one Folder that matches the filter.
     * @param {folderFindUniqueArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends folderFindUniqueArgs>(args: SelectSubset<T, folderFindUniqueArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Folder that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {folderFindUniqueOrThrowArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends folderFindUniqueOrThrowArgs>(args: SelectSubset<T, folderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Folder that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {folderFindFirstArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends folderFindFirstArgs>(args?: SelectSubset<T, folderFindFirstArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Folder that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {folderFindFirstOrThrowArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends folderFindFirstOrThrowArgs>(args?: SelectSubset<T, folderFindFirstOrThrowArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Folders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {folderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Folders
     * const folders = await prisma.folder.findMany()
     * 
     * // Get first 10 Folders
     * const folders = await prisma.folder.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const folderWithIdOnly = await prisma.folder.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends folderFindManyArgs>(args?: SelectSubset<T, folderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Folder.
     * @param {folderCreateArgs} args - Arguments to create a Folder.
     * @example
     * // Create one Folder
     * const Folder = await prisma.folder.create({
     *   data: {
     *     // ... data to create a Folder
     *   }
     * })
     * 
     */
    create<T extends folderCreateArgs>(args: SelectSubset<T, folderCreateArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Folders.
     * @param {folderCreateManyArgs} args - Arguments to create many Folders.
     * @example
     * // Create many Folders
     * const folder = await prisma.folder.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends folderCreateManyArgs>(args?: SelectSubset<T, folderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Folders and returns the data saved in the database.
     * @param {folderCreateManyAndReturnArgs} args - Arguments to create many Folders.
     * @example
     * // Create many Folders
     * const folder = await prisma.folder.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Folders and only return the `id`
     * const folderWithIdOnly = await prisma.folder.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends folderCreateManyAndReturnArgs>(args?: SelectSubset<T, folderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Folder.
     * @param {folderDeleteArgs} args - Arguments to delete one Folder.
     * @example
     * // Delete one Folder
     * const Folder = await prisma.folder.delete({
     *   where: {
     *     // ... filter to delete one Folder
     *   }
     * })
     * 
     */
    delete<T extends folderDeleteArgs>(args: SelectSubset<T, folderDeleteArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Folder.
     * @param {folderUpdateArgs} args - Arguments to update one Folder.
     * @example
     * // Update one Folder
     * const folder = await prisma.folder.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends folderUpdateArgs>(args: SelectSubset<T, folderUpdateArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Folders.
     * @param {folderDeleteManyArgs} args - Arguments to filter Folders to delete.
     * @example
     * // Delete a few Folders
     * const { count } = await prisma.folder.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends folderDeleteManyArgs>(args?: SelectSubset<T, folderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Folders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {folderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Folders
     * const folder = await prisma.folder.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends folderUpdateManyArgs>(args: SelectSubset<T, folderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Folders and returns the data updated in the database.
     * @param {folderUpdateManyAndReturnArgs} args - Arguments to update many Folders.
     * @example
     * // Update many Folders
     * const folder = await prisma.folder.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Folders and only return the `id`
     * const folderWithIdOnly = await prisma.folder.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends folderUpdateManyAndReturnArgs>(args: SelectSubset<T, folderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Folder.
     * @param {folderUpsertArgs} args - Arguments to update or create a Folder.
     * @example
     * // Update or create a Folder
     * const folder = await prisma.folder.upsert({
     *   create: {
     *     // ... data to create a Folder
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Folder we want to update
     *   }
     * })
     */
    upsert<T extends folderUpsertArgs>(args: SelectSubset<T, folderUpsertArgs<ExtArgs>>): Prisma__folderClient<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Folders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {folderCountArgs} args - Arguments to filter Folders to count.
     * @example
     * // Count the number of Folders
     * const count = await prisma.folder.count({
     *   where: {
     *     // ... the filter for the Folders we want to count
     *   }
     * })
    **/
    count<T extends folderCountArgs>(
      args?: Subset<T, folderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FolderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Folder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FolderAggregateArgs>(args: Subset<T, FolderAggregateArgs>): Prisma.PrismaPromise<GetFolderAggregateType<T>>

    /**
     * Group by Folder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {folderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends folderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: folderGroupByArgs['orderBy'] }
        : { orderBy?: folderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, folderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFolderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the folder model
   */
  readonly fields: folderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for folder.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__folderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    workspace<T extends workspaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, workspaceDefaultArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the folder model
   */
  interface folderFieldRefs {
    readonly id: FieldRef<"folder", 'String'>
    readonly workspace_id: FieldRef<"folder", 'String'>
    readonly user_id: FieldRef<"folder", 'String'>
    readonly description: FieldRef<"folder", 'String'>
    readonly color: FieldRef<"folder", 'String'>
    readonly labels: FieldRef<"folder", 'String[]'>
    readonly created_at: FieldRef<"folder", 'DateTime'>
    readonly updated_at: FieldRef<"folder", 'DateTime'>
    readonly is_self_folder: FieldRef<"folder", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * folder findUnique
   */
  export type folderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * Filter, which folder to fetch.
     */
    where: folderWhereUniqueInput
  }

  /**
   * folder findUniqueOrThrow
   */
  export type folderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * Filter, which folder to fetch.
     */
    where: folderWhereUniqueInput
  }

  /**
   * folder findFirst
   */
  export type folderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * Filter, which folder to fetch.
     */
    where?: folderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of folders to fetch.
     */
    orderBy?: folderOrderByWithRelationInput | folderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for folders.
     */
    cursor?: folderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` folders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of folders.
     */
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * folder findFirstOrThrow
   */
  export type folderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * Filter, which folder to fetch.
     */
    where?: folderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of folders to fetch.
     */
    orderBy?: folderOrderByWithRelationInput | folderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for folders.
     */
    cursor?: folderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` folders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of folders.
     */
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * folder findMany
   */
  export type folderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * Filter, which folders to fetch.
     */
    where?: folderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of folders to fetch.
     */
    orderBy?: folderOrderByWithRelationInput | folderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing folders.
     */
    cursor?: folderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` folders.
     */
    skip?: number
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * folder create
   */
  export type folderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * The data needed to create a folder.
     */
    data: XOR<folderCreateInput, folderUncheckedCreateInput>
  }

  /**
   * folder createMany
   */
  export type folderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many folders.
     */
    data: folderCreateManyInput | folderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * folder createManyAndReturn
   */
  export type folderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * The data used to create many folders.
     */
    data: folderCreateManyInput | folderCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * folder update
   */
  export type folderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * The data needed to update a folder.
     */
    data: XOR<folderUpdateInput, folderUncheckedUpdateInput>
    /**
     * Choose, which folder to update.
     */
    where: folderWhereUniqueInput
  }

  /**
   * folder updateMany
   */
  export type folderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update folders.
     */
    data: XOR<folderUpdateManyMutationInput, folderUncheckedUpdateManyInput>
    /**
     * Filter which folders to update
     */
    where?: folderWhereInput
    /**
     * Limit how many folders to update.
     */
    limit?: number
  }

  /**
   * folder updateManyAndReturn
   */
  export type folderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * The data used to update folders.
     */
    data: XOR<folderUpdateManyMutationInput, folderUncheckedUpdateManyInput>
    /**
     * Filter which folders to update
     */
    where?: folderWhereInput
    /**
     * Limit how many folders to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * folder upsert
   */
  export type folderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * The filter to search for the folder to update in case it exists.
     */
    where: folderWhereUniqueInput
    /**
     * In case the folder found by the `where` argument doesn't exist, create a new folder with this data.
     */
    create: XOR<folderCreateInput, folderUncheckedCreateInput>
    /**
     * In case the folder was found with the provided `where` argument, update it with this data.
     */
    update: XOR<folderUpdateInput, folderUncheckedUpdateInput>
  }

  /**
   * folder delete
   */
  export type folderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    /**
     * Filter which folder to delete.
     */
    where: folderWhereUniqueInput
  }

  /**
   * folder deleteMany
   */
  export type folderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which folders to delete
     */
    where?: folderWhereInput
    /**
     * Limit how many folders to delete.
     */
    limit?: number
  }

  /**
   * folder without action
   */
  export type folderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
  }


  /**
   * Model onboarding_status
   */

  export type AggregateOnboarding_status = {
    _count: Onboarding_statusCountAggregateOutputType | null
    _min: Onboarding_statusMinAggregateOutputType | null
    _max: Onboarding_statusMaxAggregateOutputType | null
  }

  export type Onboarding_statusMinAggregateOutputType = {
    user_id: string | null
    is_completed: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Onboarding_statusMaxAggregateOutputType = {
    user_id: string | null
    is_completed: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Onboarding_statusCountAggregateOutputType = {
    user_id: number
    is_completed: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type Onboarding_statusMinAggregateInputType = {
    user_id?: true
    is_completed?: true
    created_at?: true
    updated_at?: true
  }

  export type Onboarding_statusMaxAggregateInputType = {
    user_id?: true
    is_completed?: true
    created_at?: true
    updated_at?: true
  }

  export type Onboarding_statusCountAggregateInputType = {
    user_id?: true
    is_completed?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type Onboarding_statusAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which onboarding_status to aggregate.
     */
    where?: onboarding_statusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of onboarding_statuses to fetch.
     */
    orderBy?: onboarding_statusOrderByWithRelationInput | onboarding_statusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: onboarding_statusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` onboarding_statuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` onboarding_statuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned onboarding_statuses
    **/
    _count?: true | Onboarding_statusCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Onboarding_statusMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Onboarding_statusMaxAggregateInputType
  }

  export type GetOnboarding_statusAggregateType<T extends Onboarding_statusAggregateArgs> = {
        [P in keyof T & keyof AggregateOnboarding_status]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOnboarding_status[P]>
      : GetScalarType<T[P], AggregateOnboarding_status[P]>
  }




  export type onboarding_statusGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: onboarding_statusWhereInput
    orderBy?: onboarding_statusOrderByWithAggregationInput | onboarding_statusOrderByWithAggregationInput[]
    by: Onboarding_statusScalarFieldEnum[] | Onboarding_statusScalarFieldEnum
    having?: onboarding_statusScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Onboarding_statusCountAggregateInputType | true
    _min?: Onboarding_statusMinAggregateInputType
    _max?: Onboarding_statusMaxAggregateInputType
  }

  export type Onboarding_statusGroupByOutputType = {
    user_id: string
    is_completed: boolean
    created_at: Date
    updated_at: Date
    _count: Onboarding_statusCountAggregateOutputType | null
    _min: Onboarding_statusMinAggregateOutputType | null
    _max: Onboarding_statusMaxAggregateOutputType | null
  }

  type GetOnboarding_statusGroupByPayload<T extends onboarding_statusGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Onboarding_statusGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Onboarding_statusGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Onboarding_statusGroupByOutputType[P]>
            : GetScalarType<T[P], Onboarding_statusGroupByOutputType[P]>
        }
      >
    >


  export type onboarding_statusSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    user_id?: boolean
    is_completed?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["onboarding_status"]>

  export type onboarding_statusSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    user_id?: boolean
    is_completed?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["onboarding_status"]>

  export type onboarding_statusSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    user_id?: boolean
    is_completed?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["onboarding_status"]>

  export type onboarding_statusSelectScalar = {
    user_id?: boolean
    is_completed?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type onboarding_statusOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"user_id" | "is_completed" | "created_at" | "updated_at", ExtArgs["result"]["onboarding_status"]>

  export type $onboarding_statusPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "onboarding_status"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      user_id: string
      is_completed: boolean
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["onboarding_status"]>
    composites: {}
  }

  type onboarding_statusGetPayload<S extends boolean | null | undefined | onboarding_statusDefaultArgs> = $Result.GetResult<Prisma.$onboarding_statusPayload, S>

  type onboarding_statusCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<onboarding_statusFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Onboarding_statusCountAggregateInputType | true
    }

  export interface onboarding_statusDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['onboarding_status'], meta: { name: 'onboarding_status' } }
    /**
     * Find zero or one Onboarding_status that matches the filter.
     * @param {onboarding_statusFindUniqueArgs} args - Arguments to find a Onboarding_status
     * @example
     * // Get one Onboarding_status
     * const onboarding_status = await prisma.onboarding_status.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends onboarding_statusFindUniqueArgs>(args: SelectSubset<T, onboarding_statusFindUniqueArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Onboarding_status that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {onboarding_statusFindUniqueOrThrowArgs} args - Arguments to find a Onboarding_status
     * @example
     * // Get one Onboarding_status
     * const onboarding_status = await prisma.onboarding_status.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends onboarding_statusFindUniqueOrThrowArgs>(args: SelectSubset<T, onboarding_statusFindUniqueOrThrowArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Onboarding_status that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {onboarding_statusFindFirstArgs} args - Arguments to find a Onboarding_status
     * @example
     * // Get one Onboarding_status
     * const onboarding_status = await prisma.onboarding_status.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends onboarding_statusFindFirstArgs>(args?: SelectSubset<T, onboarding_statusFindFirstArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Onboarding_status that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {onboarding_statusFindFirstOrThrowArgs} args - Arguments to find a Onboarding_status
     * @example
     * // Get one Onboarding_status
     * const onboarding_status = await prisma.onboarding_status.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends onboarding_statusFindFirstOrThrowArgs>(args?: SelectSubset<T, onboarding_statusFindFirstOrThrowArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Onboarding_statuses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {onboarding_statusFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Onboarding_statuses
     * const onboarding_statuses = await prisma.onboarding_status.findMany()
     * 
     * // Get first 10 Onboarding_statuses
     * const onboarding_statuses = await prisma.onboarding_status.findMany({ take: 10 })
     * 
     * // Only select the `user_id`
     * const onboarding_statusWithUser_idOnly = await prisma.onboarding_status.findMany({ select: { user_id: true } })
     * 
     */
    findMany<T extends onboarding_statusFindManyArgs>(args?: SelectSubset<T, onboarding_statusFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Onboarding_status.
     * @param {onboarding_statusCreateArgs} args - Arguments to create a Onboarding_status.
     * @example
     * // Create one Onboarding_status
     * const Onboarding_status = await prisma.onboarding_status.create({
     *   data: {
     *     // ... data to create a Onboarding_status
     *   }
     * })
     * 
     */
    create<T extends onboarding_statusCreateArgs>(args: SelectSubset<T, onboarding_statusCreateArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Onboarding_statuses.
     * @param {onboarding_statusCreateManyArgs} args - Arguments to create many Onboarding_statuses.
     * @example
     * // Create many Onboarding_statuses
     * const onboarding_status = await prisma.onboarding_status.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends onboarding_statusCreateManyArgs>(args?: SelectSubset<T, onboarding_statusCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Onboarding_statuses and returns the data saved in the database.
     * @param {onboarding_statusCreateManyAndReturnArgs} args - Arguments to create many Onboarding_statuses.
     * @example
     * // Create many Onboarding_statuses
     * const onboarding_status = await prisma.onboarding_status.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Onboarding_statuses and only return the `user_id`
     * const onboarding_statusWithUser_idOnly = await prisma.onboarding_status.createManyAndReturn({
     *   select: { user_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends onboarding_statusCreateManyAndReturnArgs>(args?: SelectSubset<T, onboarding_statusCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Onboarding_status.
     * @param {onboarding_statusDeleteArgs} args - Arguments to delete one Onboarding_status.
     * @example
     * // Delete one Onboarding_status
     * const Onboarding_status = await prisma.onboarding_status.delete({
     *   where: {
     *     // ... filter to delete one Onboarding_status
     *   }
     * })
     * 
     */
    delete<T extends onboarding_statusDeleteArgs>(args: SelectSubset<T, onboarding_statusDeleteArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Onboarding_status.
     * @param {onboarding_statusUpdateArgs} args - Arguments to update one Onboarding_status.
     * @example
     * // Update one Onboarding_status
     * const onboarding_status = await prisma.onboarding_status.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends onboarding_statusUpdateArgs>(args: SelectSubset<T, onboarding_statusUpdateArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Onboarding_statuses.
     * @param {onboarding_statusDeleteManyArgs} args - Arguments to filter Onboarding_statuses to delete.
     * @example
     * // Delete a few Onboarding_statuses
     * const { count } = await prisma.onboarding_status.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends onboarding_statusDeleteManyArgs>(args?: SelectSubset<T, onboarding_statusDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Onboarding_statuses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {onboarding_statusUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Onboarding_statuses
     * const onboarding_status = await prisma.onboarding_status.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends onboarding_statusUpdateManyArgs>(args: SelectSubset<T, onboarding_statusUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Onboarding_statuses and returns the data updated in the database.
     * @param {onboarding_statusUpdateManyAndReturnArgs} args - Arguments to update many Onboarding_statuses.
     * @example
     * // Update many Onboarding_statuses
     * const onboarding_status = await prisma.onboarding_status.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Onboarding_statuses and only return the `user_id`
     * const onboarding_statusWithUser_idOnly = await prisma.onboarding_status.updateManyAndReturn({
     *   select: { user_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends onboarding_statusUpdateManyAndReturnArgs>(args: SelectSubset<T, onboarding_statusUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Onboarding_status.
     * @param {onboarding_statusUpsertArgs} args - Arguments to update or create a Onboarding_status.
     * @example
     * // Update or create a Onboarding_status
     * const onboarding_status = await prisma.onboarding_status.upsert({
     *   create: {
     *     // ... data to create a Onboarding_status
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Onboarding_status we want to update
     *   }
     * })
     */
    upsert<T extends onboarding_statusUpsertArgs>(args: SelectSubset<T, onboarding_statusUpsertArgs<ExtArgs>>): Prisma__onboarding_statusClient<$Result.GetResult<Prisma.$onboarding_statusPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Onboarding_statuses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {onboarding_statusCountArgs} args - Arguments to filter Onboarding_statuses to count.
     * @example
     * // Count the number of Onboarding_statuses
     * const count = await prisma.onboarding_status.count({
     *   where: {
     *     // ... the filter for the Onboarding_statuses we want to count
     *   }
     * })
    **/
    count<T extends onboarding_statusCountArgs>(
      args?: Subset<T, onboarding_statusCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Onboarding_statusCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Onboarding_status.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Onboarding_statusAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Onboarding_statusAggregateArgs>(args: Subset<T, Onboarding_statusAggregateArgs>): Prisma.PrismaPromise<GetOnboarding_statusAggregateType<T>>

    /**
     * Group by Onboarding_status.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {onboarding_statusGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends onboarding_statusGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: onboarding_statusGroupByArgs['orderBy'] }
        : { orderBy?: onboarding_statusGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, onboarding_statusGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOnboarding_statusGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the onboarding_status model
   */
  readonly fields: onboarding_statusFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for onboarding_status.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__onboarding_statusClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the onboarding_status model
   */
  interface onboarding_statusFieldRefs {
    readonly user_id: FieldRef<"onboarding_status", 'String'>
    readonly is_completed: FieldRef<"onboarding_status", 'Boolean'>
    readonly created_at: FieldRef<"onboarding_status", 'DateTime'>
    readonly updated_at: FieldRef<"onboarding_status", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * onboarding_status findUnique
   */
  export type onboarding_statusFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * Filter, which onboarding_status to fetch.
     */
    where: onboarding_statusWhereUniqueInput
  }

  /**
   * onboarding_status findUniqueOrThrow
   */
  export type onboarding_statusFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * Filter, which onboarding_status to fetch.
     */
    where: onboarding_statusWhereUniqueInput
  }

  /**
   * onboarding_status findFirst
   */
  export type onboarding_statusFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * Filter, which onboarding_status to fetch.
     */
    where?: onboarding_statusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of onboarding_statuses to fetch.
     */
    orderBy?: onboarding_statusOrderByWithRelationInput | onboarding_statusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for onboarding_statuses.
     */
    cursor?: onboarding_statusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` onboarding_statuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` onboarding_statuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of onboarding_statuses.
     */
    distinct?: Onboarding_statusScalarFieldEnum | Onboarding_statusScalarFieldEnum[]
  }

  /**
   * onboarding_status findFirstOrThrow
   */
  export type onboarding_statusFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * Filter, which onboarding_status to fetch.
     */
    where?: onboarding_statusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of onboarding_statuses to fetch.
     */
    orderBy?: onboarding_statusOrderByWithRelationInput | onboarding_statusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for onboarding_statuses.
     */
    cursor?: onboarding_statusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` onboarding_statuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` onboarding_statuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of onboarding_statuses.
     */
    distinct?: Onboarding_statusScalarFieldEnum | Onboarding_statusScalarFieldEnum[]
  }

  /**
   * onboarding_status findMany
   */
  export type onboarding_statusFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * Filter, which onboarding_statuses to fetch.
     */
    where?: onboarding_statusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of onboarding_statuses to fetch.
     */
    orderBy?: onboarding_statusOrderByWithRelationInput | onboarding_statusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing onboarding_statuses.
     */
    cursor?: onboarding_statusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` onboarding_statuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` onboarding_statuses.
     */
    skip?: number
    distinct?: Onboarding_statusScalarFieldEnum | Onboarding_statusScalarFieldEnum[]
  }

  /**
   * onboarding_status create
   */
  export type onboarding_statusCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * The data needed to create a onboarding_status.
     */
    data: XOR<onboarding_statusCreateInput, onboarding_statusUncheckedCreateInput>
  }

  /**
   * onboarding_status createMany
   */
  export type onboarding_statusCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many onboarding_statuses.
     */
    data: onboarding_statusCreateManyInput | onboarding_statusCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * onboarding_status createManyAndReturn
   */
  export type onboarding_statusCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * The data used to create many onboarding_statuses.
     */
    data: onboarding_statusCreateManyInput | onboarding_statusCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * onboarding_status update
   */
  export type onboarding_statusUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * The data needed to update a onboarding_status.
     */
    data: XOR<onboarding_statusUpdateInput, onboarding_statusUncheckedUpdateInput>
    /**
     * Choose, which onboarding_status to update.
     */
    where: onboarding_statusWhereUniqueInput
  }

  /**
   * onboarding_status updateMany
   */
  export type onboarding_statusUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update onboarding_statuses.
     */
    data: XOR<onboarding_statusUpdateManyMutationInput, onboarding_statusUncheckedUpdateManyInput>
    /**
     * Filter which onboarding_statuses to update
     */
    where?: onboarding_statusWhereInput
    /**
     * Limit how many onboarding_statuses to update.
     */
    limit?: number
  }

  /**
   * onboarding_status updateManyAndReturn
   */
  export type onboarding_statusUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * The data used to update onboarding_statuses.
     */
    data: XOR<onboarding_statusUpdateManyMutationInput, onboarding_statusUncheckedUpdateManyInput>
    /**
     * Filter which onboarding_statuses to update
     */
    where?: onboarding_statusWhereInput
    /**
     * Limit how many onboarding_statuses to update.
     */
    limit?: number
  }

  /**
   * onboarding_status upsert
   */
  export type onboarding_statusUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * The filter to search for the onboarding_status to update in case it exists.
     */
    where: onboarding_statusWhereUniqueInput
    /**
     * In case the onboarding_status found by the `where` argument doesn't exist, create a new onboarding_status with this data.
     */
    create: XOR<onboarding_statusCreateInput, onboarding_statusUncheckedCreateInput>
    /**
     * In case the onboarding_status was found with the provided `where` argument, update it with this data.
     */
    update: XOR<onboarding_statusUpdateInput, onboarding_statusUncheckedUpdateInput>
  }

  /**
   * onboarding_status delete
   */
  export type onboarding_statusDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
    /**
     * Filter which onboarding_status to delete.
     */
    where: onboarding_statusWhereUniqueInput
  }

  /**
   * onboarding_status deleteMany
   */
  export type onboarding_statusDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which onboarding_statuses to delete
     */
    where?: onboarding_statusWhereInput
    /**
     * Limit how many onboarding_statuses to delete.
     */
    limit?: number
  }

  /**
   * onboarding_status without action
   */
  export type onboarding_statusDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the onboarding_status
     */
    select?: onboarding_statusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the onboarding_status
     */
    omit?: onboarding_statusOmit<ExtArgs> | null
  }


  /**
   * Model user
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    displayname: string | null
    primaryemail: string | null
    is_admin: boolean | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    displayname: string | null
    primaryemail: string | null
    is_admin: boolean | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    displayname: number
    primaryemail: number
    is_admin: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    displayname?: true
    primaryemail?: true
    is_admin?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    displayname?: true
    primaryemail?: true
    is_admin?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    displayname?: true
    primaryemail?: true
    is_admin?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which user to aggregate.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type userGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: userWhereInput
    orderBy?: userOrderByWithAggregationInput | userOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: userScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    displayname: string | null
    primaryemail: string | null
    is_admin: boolean | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends userGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type userSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    displayname?: boolean
    primaryemail?: boolean
    is_admin?: boolean
    approvals_to_action?: boolean | user$approvals_to_actionArgs<ExtArgs>
    approvals_assigned?: boolean | user$approvals_assignedArgs<ExtArgs>
    notifications?: boolean | user$notificationsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type userSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    displayname?: boolean
    primaryemail?: boolean
    is_admin?: boolean
  }, ExtArgs["result"]["user"]>

  export type userSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    displayname?: boolean
    primaryemail?: boolean
    is_admin?: boolean
  }, ExtArgs["result"]["user"]>

  export type userSelectScalar = {
    id?: boolean
    displayname?: boolean
    primaryemail?: boolean
    is_admin?: boolean
  }

  export type userOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "displayname" | "primaryemail" | "is_admin", ExtArgs["result"]["user"]>
  export type userInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approvals_to_action?: boolean | user$approvals_to_actionArgs<ExtArgs>
    approvals_assigned?: boolean | user$approvals_assignedArgs<ExtArgs>
    notifications?: boolean | user$notificationsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type userIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type userIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $userPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "user"
    objects: {
      approvals_to_action: Prisma.$approvalPayload<ExtArgs>[]
      approvals_assigned: Prisma.$approvalPayload<ExtArgs>[]
      notifications: Prisma.$notificationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      displayname: string | null
      primaryemail: string | null
      is_admin: boolean | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type userGetPayload<S extends boolean | null | undefined | userDefaultArgs> = $Result.GetResult<Prisma.$userPayload, S>

  type userCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<userFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface userDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['user'], meta: { name: 'user' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {userFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends userFindUniqueArgs>(args: SelectSubset<T, userFindUniqueArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {userFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends userFindUniqueOrThrowArgs>(args: SelectSubset<T, userFindUniqueOrThrowArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends userFindFirstArgs>(args?: SelectSubset<T, userFindFirstArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends userFindFirstOrThrowArgs>(args?: SelectSubset<T, userFindFirstOrThrowArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends userFindManyArgs>(args?: SelectSubset<T, userFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {userCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends userCreateArgs>(args: SelectSubset<T, userCreateArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {userCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends userCreateManyArgs>(args?: SelectSubset<T, userCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {userCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends userCreateManyAndReturnArgs>(args?: SelectSubset<T, userCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {userDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends userDeleteArgs>(args: SelectSubset<T, userDeleteArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {userUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends userUpdateArgs>(args: SelectSubset<T, userUpdateArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {userDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends userDeleteManyArgs>(args?: SelectSubset<T, userDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends userUpdateManyArgs>(args: SelectSubset<T, userUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {userUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends userUpdateManyAndReturnArgs>(args: SelectSubset<T, userUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {userUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends userUpsertArgs>(args: SelectSubset<T, userUpsertArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends userCountArgs>(
      args?: Subset<T, userCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends userGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: userGroupByArgs['orderBy'] }
        : { orderBy?: userGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, userGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the user model
   */
  readonly fields: userFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for user.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__userClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    approvals_to_action<T extends user$approvals_to_actionArgs<ExtArgs> = {}>(args?: Subset<T, user$approvals_to_actionArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    approvals_assigned<T extends user$approvals_assignedArgs<ExtArgs> = {}>(args?: Subset<T, user$approvals_assignedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    notifications<T extends user$notificationsArgs<ExtArgs> = {}>(args?: Subset<T, user$notificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the user model
   */
  interface userFieldRefs {
    readonly id: FieldRef<"user", 'String'>
    readonly displayname: FieldRef<"user", 'String'>
    readonly primaryemail: FieldRef<"user", 'String'>
    readonly is_admin: FieldRef<"user", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * user findUnique
   */
  export type userFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where: userWhereUniqueInput
  }

  /**
   * user findUniqueOrThrow
   */
  export type userFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where: userWhereUniqueInput
  }

  /**
   * user findFirst
   */
  export type userFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for users.
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * user findFirstOrThrow
   */
  export type userFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for users.
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * user findMany
   */
  export type userFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which users to fetch.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing users.
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * user create
   */
  export type userCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * The data needed to create a user.
     */
    data: XOR<userCreateInput, userUncheckedCreateInput>
  }

  /**
   * user createMany
   */
  export type userCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many users.
     */
    data: userCreateManyInput | userCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * user createManyAndReturn
   */
  export type userCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * The data used to create many users.
     */
    data: userCreateManyInput | userCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * user update
   */
  export type userUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * The data needed to update a user.
     */
    data: XOR<userUpdateInput, userUncheckedUpdateInput>
    /**
     * Choose, which user to update.
     */
    where: userWhereUniqueInput
  }

  /**
   * user updateMany
   */
  export type userUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update users.
     */
    data: XOR<userUpdateManyMutationInput, userUncheckedUpdateManyInput>
    /**
     * Filter which users to update
     */
    where?: userWhereInput
    /**
     * Limit how many users to update.
     */
    limit?: number
  }

  /**
   * user updateManyAndReturn
   */
  export type userUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * The data used to update users.
     */
    data: XOR<userUpdateManyMutationInput, userUncheckedUpdateManyInput>
    /**
     * Filter which users to update
     */
    where?: userWhereInput
    /**
     * Limit how many users to update.
     */
    limit?: number
  }

  /**
   * user upsert
   */
  export type userUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * The filter to search for the user to update in case it exists.
     */
    where: userWhereUniqueInput
    /**
     * In case the user found by the `where` argument doesn't exist, create a new user with this data.
     */
    create: XOR<userCreateInput, userUncheckedCreateInput>
    /**
     * In case the user was found with the provided `where` argument, update it with this data.
     */
    update: XOR<userUpdateInput, userUncheckedUpdateInput>
  }

  /**
   * user delete
   */
  export type userDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter which user to delete.
     */
    where: userWhereUniqueInput
  }

  /**
   * user deleteMany
   */
  export type userDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which users to delete
     */
    where?: userWhereInput
    /**
     * Limit how many users to delete.
     */
    limit?: number
  }

  /**
   * user.approvals_to_action
   */
  export type user$approvals_to_actionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    where?: approvalWhereInput
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    cursor?: approvalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ApprovalScalarFieldEnum | ApprovalScalarFieldEnum[]
  }

  /**
   * user.approvals_assigned
   */
  export type user$approvals_assignedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    where?: approvalWhereInput
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    cursor?: approvalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ApprovalScalarFieldEnum | ApprovalScalarFieldEnum[]
  }

  /**
   * user.notifications
   */
  export type user$notificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    where?: notificationWhereInput
    orderBy?: notificationOrderByWithRelationInput | notificationOrderByWithRelationInput[]
    cursor?: notificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * user without action
   */
  export type userDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
  }


  /**
   * Model workspace
   */

  export type AggregateWorkspace = {
    _count: WorkspaceCountAggregateOutputType | null
    _min: WorkspaceMinAggregateOutputType | null
    _max: WorkspaceMaxAggregateOutputType | null
  }

  export type WorkspaceMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    url: string | null
    color: string | null
    created_at: Date | null
    name: string | null
    is_self_workspace: boolean | null
  }

  export type WorkspaceMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    url: string | null
    color: string | null
    created_at: Date | null
    name: string | null
    is_self_workspace: boolean | null
  }

  export type WorkspaceCountAggregateOutputType = {
    id: number
    user_id: number
    url: number
    color: number
    created_at: number
    name: number
    is_self_workspace: number
    _all: number
  }


  export type WorkspaceMinAggregateInputType = {
    id?: true
    user_id?: true
    url?: true
    color?: true
    created_at?: true
    name?: true
    is_self_workspace?: true
  }

  export type WorkspaceMaxAggregateInputType = {
    id?: true
    user_id?: true
    url?: true
    color?: true
    created_at?: true
    name?: true
    is_self_workspace?: true
  }

  export type WorkspaceCountAggregateInputType = {
    id?: true
    user_id?: true
    url?: true
    color?: true
    created_at?: true
    name?: true
    is_self_workspace?: true
    _all?: true
  }

  export type WorkspaceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which workspace to aggregate.
     */
    where?: workspaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of workspaces to fetch.
     */
    orderBy?: workspaceOrderByWithRelationInput | workspaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: workspaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` workspaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` workspaces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned workspaces
    **/
    _count?: true | WorkspaceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkspaceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkspaceMaxAggregateInputType
  }

  export type GetWorkspaceAggregateType<T extends WorkspaceAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkspace]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkspace[P]>
      : GetScalarType<T[P], AggregateWorkspace[P]>
  }




  export type workspaceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: workspaceWhereInput
    orderBy?: workspaceOrderByWithAggregationInput | workspaceOrderByWithAggregationInput[]
    by: WorkspaceScalarFieldEnum[] | WorkspaceScalarFieldEnum
    having?: workspaceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkspaceCountAggregateInputType | true
    _min?: WorkspaceMinAggregateInputType
    _max?: WorkspaceMaxAggregateInputType
  }

  export type WorkspaceGroupByOutputType = {
    id: string
    user_id: string
    url: string
    color: string | null
    created_at: Date
    name: string | null
    is_self_workspace: boolean | null
    _count: WorkspaceCountAggregateOutputType | null
    _min: WorkspaceMinAggregateOutputType | null
    _max: WorkspaceMaxAggregateOutputType | null
  }

  type GetWorkspaceGroupByPayload<T extends workspaceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkspaceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkspaceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkspaceGroupByOutputType[P]>
            : GetScalarType<T[P], WorkspaceGroupByOutputType[P]>
        }
      >
    >


  export type workspaceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    url?: boolean
    color?: boolean
    created_at?: boolean
    name?: boolean
    is_self_workspace?: boolean
    file?: boolean | workspace$fileArgs<ExtArgs>
    folder?: boolean | workspace$folderArgs<ExtArgs>
    _count?: boolean | WorkspaceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workspace"]>

  export type workspaceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    url?: boolean
    color?: boolean
    created_at?: boolean
    name?: boolean
    is_self_workspace?: boolean
  }, ExtArgs["result"]["workspace"]>

  export type workspaceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    url?: boolean
    color?: boolean
    created_at?: boolean
    name?: boolean
    is_self_workspace?: boolean
  }, ExtArgs["result"]["workspace"]>

  export type workspaceSelectScalar = {
    id?: boolean
    user_id?: boolean
    url?: boolean
    color?: boolean
    created_at?: boolean
    name?: boolean
    is_self_workspace?: boolean
  }

  export type workspaceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "url" | "color" | "created_at" | "name" | "is_self_workspace", ExtArgs["result"]["workspace"]>
  export type workspaceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    file?: boolean | workspace$fileArgs<ExtArgs>
    folder?: boolean | workspace$folderArgs<ExtArgs>
    _count?: boolean | WorkspaceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type workspaceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type workspaceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $workspacePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "workspace"
    objects: {
      file: Prisma.$filePayload<ExtArgs>[]
      folder: Prisma.$folderPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      url: string
      color: string | null
      created_at: Date
      name: string | null
      is_self_workspace: boolean | null
    }, ExtArgs["result"]["workspace"]>
    composites: {}
  }

  type workspaceGetPayload<S extends boolean | null | undefined | workspaceDefaultArgs> = $Result.GetResult<Prisma.$workspacePayload, S>

  type workspaceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<workspaceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkspaceCountAggregateInputType | true
    }

  export interface workspaceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['workspace'], meta: { name: 'workspace' } }
    /**
     * Find zero or one Workspace that matches the filter.
     * @param {workspaceFindUniqueArgs} args - Arguments to find a Workspace
     * @example
     * // Get one Workspace
     * const workspace = await prisma.workspace.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends workspaceFindUniqueArgs>(args: SelectSubset<T, workspaceFindUniqueArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Workspace that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {workspaceFindUniqueOrThrowArgs} args - Arguments to find a Workspace
     * @example
     * // Get one Workspace
     * const workspace = await prisma.workspace.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends workspaceFindUniqueOrThrowArgs>(args: SelectSubset<T, workspaceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Workspace that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {workspaceFindFirstArgs} args - Arguments to find a Workspace
     * @example
     * // Get one Workspace
     * const workspace = await prisma.workspace.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends workspaceFindFirstArgs>(args?: SelectSubset<T, workspaceFindFirstArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Workspace that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {workspaceFindFirstOrThrowArgs} args - Arguments to find a Workspace
     * @example
     * // Get one Workspace
     * const workspace = await prisma.workspace.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends workspaceFindFirstOrThrowArgs>(args?: SelectSubset<T, workspaceFindFirstOrThrowArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Workspaces that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {workspaceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Workspaces
     * const workspaces = await prisma.workspace.findMany()
     * 
     * // Get first 10 Workspaces
     * const workspaces = await prisma.workspace.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workspaceWithIdOnly = await prisma.workspace.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends workspaceFindManyArgs>(args?: SelectSubset<T, workspaceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Workspace.
     * @param {workspaceCreateArgs} args - Arguments to create a Workspace.
     * @example
     * // Create one Workspace
     * const Workspace = await prisma.workspace.create({
     *   data: {
     *     // ... data to create a Workspace
     *   }
     * })
     * 
     */
    create<T extends workspaceCreateArgs>(args: SelectSubset<T, workspaceCreateArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Workspaces.
     * @param {workspaceCreateManyArgs} args - Arguments to create many Workspaces.
     * @example
     * // Create many Workspaces
     * const workspace = await prisma.workspace.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends workspaceCreateManyArgs>(args?: SelectSubset<T, workspaceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Workspaces and returns the data saved in the database.
     * @param {workspaceCreateManyAndReturnArgs} args - Arguments to create many Workspaces.
     * @example
     * // Create many Workspaces
     * const workspace = await prisma.workspace.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Workspaces and only return the `id`
     * const workspaceWithIdOnly = await prisma.workspace.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends workspaceCreateManyAndReturnArgs>(args?: SelectSubset<T, workspaceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Workspace.
     * @param {workspaceDeleteArgs} args - Arguments to delete one Workspace.
     * @example
     * // Delete one Workspace
     * const Workspace = await prisma.workspace.delete({
     *   where: {
     *     // ... filter to delete one Workspace
     *   }
     * })
     * 
     */
    delete<T extends workspaceDeleteArgs>(args: SelectSubset<T, workspaceDeleteArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Workspace.
     * @param {workspaceUpdateArgs} args - Arguments to update one Workspace.
     * @example
     * // Update one Workspace
     * const workspace = await prisma.workspace.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends workspaceUpdateArgs>(args: SelectSubset<T, workspaceUpdateArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Workspaces.
     * @param {workspaceDeleteManyArgs} args - Arguments to filter Workspaces to delete.
     * @example
     * // Delete a few Workspaces
     * const { count } = await prisma.workspace.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends workspaceDeleteManyArgs>(args?: SelectSubset<T, workspaceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Workspaces.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {workspaceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Workspaces
     * const workspace = await prisma.workspace.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends workspaceUpdateManyArgs>(args: SelectSubset<T, workspaceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Workspaces and returns the data updated in the database.
     * @param {workspaceUpdateManyAndReturnArgs} args - Arguments to update many Workspaces.
     * @example
     * // Update many Workspaces
     * const workspace = await prisma.workspace.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Workspaces and only return the `id`
     * const workspaceWithIdOnly = await prisma.workspace.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends workspaceUpdateManyAndReturnArgs>(args: SelectSubset<T, workspaceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Workspace.
     * @param {workspaceUpsertArgs} args - Arguments to update or create a Workspace.
     * @example
     * // Update or create a Workspace
     * const workspace = await prisma.workspace.upsert({
     *   create: {
     *     // ... data to create a Workspace
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Workspace we want to update
     *   }
     * })
     */
    upsert<T extends workspaceUpsertArgs>(args: SelectSubset<T, workspaceUpsertArgs<ExtArgs>>): Prisma__workspaceClient<$Result.GetResult<Prisma.$workspacePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Workspaces.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {workspaceCountArgs} args - Arguments to filter Workspaces to count.
     * @example
     * // Count the number of Workspaces
     * const count = await prisma.workspace.count({
     *   where: {
     *     // ... the filter for the Workspaces we want to count
     *   }
     * })
    **/
    count<T extends workspaceCountArgs>(
      args?: Subset<T, workspaceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkspaceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Workspace.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspaceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkspaceAggregateArgs>(args: Subset<T, WorkspaceAggregateArgs>): Prisma.PrismaPromise<GetWorkspaceAggregateType<T>>

    /**
     * Group by Workspace.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {workspaceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends workspaceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: workspaceGroupByArgs['orderBy'] }
        : { orderBy?: workspaceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, workspaceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkspaceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the workspace model
   */
  readonly fields: workspaceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for workspace.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__workspaceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    file<T extends workspace$fileArgs<ExtArgs> = {}>(args?: Subset<T, workspace$fileArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    folder<T extends workspace$folderArgs<ExtArgs> = {}>(args?: Subset<T, workspace$folderArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$folderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the workspace model
   */
  interface workspaceFieldRefs {
    readonly id: FieldRef<"workspace", 'String'>
    readonly user_id: FieldRef<"workspace", 'String'>
    readonly url: FieldRef<"workspace", 'String'>
    readonly color: FieldRef<"workspace", 'String'>
    readonly created_at: FieldRef<"workspace", 'DateTime'>
    readonly name: FieldRef<"workspace", 'String'>
    readonly is_self_workspace: FieldRef<"workspace", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * workspace findUnique
   */
  export type workspaceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * Filter, which workspace to fetch.
     */
    where: workspaceWhereUniqueInput
  }

  /**
   * workspace findUniqueOrThrow
   */
  export type workspaceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * Filter, which workspace to fetch.
     */
    where: workspaceWhereUniqueInput
  }

  /**
   * workspace findFirst
   */
  export type workspaceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * Filter, which workspace to fetch.
     */
    where?: workspaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of workspaces to fetch.
     */
    orderBy?: workspaceOrderByWithRelationInput | workspaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for workspaces.
     */
    cursor?: workspaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` workspaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` workspaces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of workspaces.
     */
    distinct?: WorkspaceScalarFieldEnum | WorkspaceScalarFieldEnum[]
  }

  /**
   * workspace findFirstOrThrow
   */
  export type workspaceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * Filter, which workspace to fetch.
     */
    where?: workspaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of workspaces to fetch.
     */
    orderBy?: workspaceOrderByWithRelationInput | workspaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for workspaces.
     */
    cursor?: workspaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` workspaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` workspaces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of workspaces.
     */
    distinct?: WorkspaceScalarFieldEnum | WorkspaceScalarFieldEnum[]
  }

  /**
   * workspace findMany
   */
  export type workspaceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * Filter, which workspaces to fetch.
     */
    where?: workspaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of workspaces to fetch.
     */
    orderBy?: workspaceOrderByWithRelationInput | workspaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing workspaces.
     */
    cursor?: workspaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` workspaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` workspaces.
     */
    skip?: number
    distinct?: WorkspaceScalarFieldEnum | WorkspaceScalarFieldEnum[]
  }

  /**
   * workspace create
   */
  export type workspaceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * The data needed to create a workspace.
     */
    data: XOR<workspaceCreateInput, workspaceUncheckedCreateInput>
  }

  /**
   * workspace createMany
   */
  export type workspaceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many workspaces.
     */
    data: workspaceCreateManyInput | workspaceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * workspace createManyAndReturn
   */
  export type workspaceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * The data used to create many workspaces.
     */
    data: workspaceCreateManyInput | workspaceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * workspace update
   */
  export type workspaceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * The data needed to update a workspace.
     */
    data: XOR<workspaceUpdateInput, workspaceUncheckedUpdateInput>
    /**
     * Choose, which workspace to update.
     */
    where: workspaceWhereUniqueInput
  }

  /**
   * workspace updateMany
   */
  export type workspaceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update workspaces.
     */
    data: XOR<workspaceUpdateManyMutationInput, workspaceUncheckedUpdateManyInput>
    /**
     * Filter which workspaces to update
     */
    where?: workspaceWhereInput
    /**
     * Limit how many workspaces to update.
     */
    limit?: number
  }

  /**
   * workspace updateManyAndReturn
   */
  export type workspaceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * The data used to update workspaces.
     */
    data: XOR<workspaceUpdateManyMutationInput, workspaceUncheckedUpdateManyInput>
    /**
     * Filter which workspaces to update
     */
    where?: workspaceWhereInput
    /**
     * Limit how many workspaces to update.
     */
    limit?: number
  }

  /**
   * workspace upsert
   */
  export type workspaceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * The filter to search for the workspace to update in case it exists.
     */
    where: workspaceWhereUniqueInput
    /**
     * In case the workspace found by the `where` argument doesn't exist, create a new workspace with this data.
     */
    create: XOR<workspaceCreateInput, workspaceUncheckedCreateInput>
    /**
     * In case the workspace was found with the provided `where` argument, update it with this data.
     */
    update: XOR<workspaceUpdateInput, workspaceUncheckedUpdateInput>
  }

  /**
   * workspace delete
   */
  export type workspaceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
    /**
     * Filter which workspace to delete.
     */
    where: workspaceWhereUniqueInput
  }

  /**
   * workspace deleteMany
   */
  export type workspaceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which workspaces to delete
     */
    where?: workspaceWhereInput
    /**
     * Limit how many workspaces to delete.
     */
    limit?: number
  }

  /**
   * workspace.file
   */
  export type workspace$fileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the file
     */
    select?: fileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the file
     */
    omit?: fileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: fileInclude<ExtArgs> | null
    where?: fileWhereInput
    orderBy?: fileOrderByWithRelationInput | fileOrderByWithRelationInput[]
    cursor?: fileWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * workspace.folder
   */
  export type workspace$folderArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the folder
     */
    select?: folderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the folder
     */
    omit?: folderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: folderInclude<ExtArgs> | null
    where?: folderWhereInput
    orderBy?: folderOrderByWithRelationInput | folderOrderByWithRelationInput[]
    cursor?: folderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * workspace without action
   */
  export type workspaceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the workspace
     */
    select?: workspaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the workspace
     */
    omit?: workspaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: workspaceInclude<ExtArgs> | null
  }


  /**
   * Model approval
   */

  export type AggregateApproval = {
    _count: ApprovalCountAggregateOutputType | null
    _min: ApprovalMinAggregateOutputType | null
    _max: ApprovalMaxAggregateOutputType | null
  }

  export type ApprovalMinAggregateOutputType = {
    id: string | null
    file_id_ref: string | null
    file_workspace_id_ref: string | null
    file_user_id_ref: string | null
    approver_user_id: string | null
    assigned_by_user_id: string | null
    status: string | null
    remarks: string | null
    created_at: Date | null
    updated_at: Date | null
    actioned_at: Date | null
  }

  export type ApprovalMaxAggregateOutputType = {
    id: string | null
    file_id_ref: string | null
    file_workspace_id_ref: string | null
    file_user_id_ref: string | null
    approver_user_id: string | null
    assigned_by_user_id: string | null
    status: string | null
    remarks: string | null
    created_at: Date | null
    updated_at: Date | null
    actioned_at: Date | null
  }

  export type ApprovalCountAggregateOutputType = {
    id: number
    file_id_ref: number
    file_workspace_id_ref: number
    file_user_id_ref: number
    approver_user_id: number
    assigned_by_user_id: number
    status: number
    remarks: number
    created_at: number
    updated_at: number
    actioned_at: number
    _all: number
  }


  export type ApprovalMinAggregateInputType = {
    id?: true
    file_id_ref?: true
    file_workspace_id_ref?: true
    file_user_id_ref?: true
    approver_user_id?: true
    assigned_by_user_id?: true
    status?: true
    remarks?: true
    created_at?: true
    updated_at?: true
    actioned_at?: true
  }

  export type ApprovalMaxAggregateInputType = {
    id?: true
    file_id_ref?: true
    file_workspace_id_ref?: true
    file_user_id_ref?: true
    approver_user_id?: true
    assigned_by_user_id?: true
    status?: true
    remarks?: true
    created_at?: true
    updated_at?: true
    actioned_at?: true
  }

  export type ApprovalCountAggregateInputType = {
    id?: true
    file_id_ref?: true
    file_workspace_id_ref?: true
    file_user_id_ref?: true
    approver_user_id?: true
    assigned_by_user_id?: true
    status?: true
    remarks?: true
    created_at?: true
    updated_at?: true
    actioned_at?: true
    _all?: true
  }

  export type ApprovalAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which approval to aggregate.
     */
    where?: approvalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of approvals to fetch.
     */
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: approvalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` approvals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` approvals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned approvals
    **/
    _count?: true | ApprovalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ApprovalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ApprovalMaxAggregateInputType
  }

  export type GetApprovalAggregateType<T extends ApprovalAggregateArgs> = {
        [P in keyof T & keyof AggregateApproval]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApproval[P]>
      : GetScalarType<T[P], AggregateApproval[P]>
  }




  export type approvalGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: approvalWhereInput
    orderBy?: approvalOrderByWithAggregationInput | approvalOrderByWithAggregationInput[]
    by: ApprovalScalarFieldEnum[] | ApprovalScalarFieldEnum
    having?: approvalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ApprovalCountAggregateInputType | true
    _min?: ApprovalMinAggregateInputType
    _max?: ApprovalMaxAggregateInputType
  }

  export type ApprovalGroupByOutputType = {
    id: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    approver_user_id: string
    assigned_by_user_id: string
    status: string
    remarks: string | null
    created_at: Date
    updated_at: Date
    actioned_at: Date | null
    _count: ApprovalCountAggregateOutputType | null
    _min: ApprovalMinAggregateOutputType | null
    _max: ApprovalMaxAggregateOutputType | null
  }

  type GetApprovalGroupByPayload<T extends approvalGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ApprovalGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ApprovalGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ApprovalGroupByOutputType[P]>
            : GetScalarType<T[P], ApprovalGroupByOutputType[P]>
        }
      >
    >


  export type approvalSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    file_id_ref?: boolean
    file_workspace_id_ref?: boolean
    file_user_id_ref?: boolean
    approver_user_id?: boolean
    assigned_by_user_id?: boolean
    status?: boolean
    remarks?: boolean
    created_at?: boolean
    updated_at?: boolean
    actioned_at?: boolean
    approver?: boolean | userDefaultArgs<ExtArgs>
    assigner?: boolean | userDefaultArgs<ExtArgs>
    file?: boolean | fileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["approval"]>

  export type approvalSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    file_id_ref?: boolean
    file_workspace_id_ref?: boolean
    file_user_id_ref?: boolean
    approver_user_id?: boolean
    assigned_by_user_id?: boolean
    status?: boolean
    remarks?: boolean
    created_at?: boolean
    updated_at?: boolean
    actioned_at?: boolean
    approver?: boolean | userDefaultArgs<ExtArgs>
    assigner?: boolean | userDefaultArgs<ExtArgs>
    file?: boolean | fileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["approval"]>

  export type approvalSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    file_id_ref?: boolean
    file_workspace_id_ref?: boolean
    file_user_id_ref?: boolean
    approver_user_id?: boolean
    assigned_by_user_id?: boolean
    status?: boolean
    remarks?: boolean
    created_at?: boolean
    updated_at?: boolean
    actioned_at?: boolean
    approver?: boolean | userDefaultArgs<ExtArgs>
    assigner?: boolean | userDefaultArgs<ExtArgs>
    file?: boolean | fileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["approval"]>

  export type approvalSelectScalar = {
    id?: boolean
    file_id_ref?: boolean
    file_workspace_id_ref?: boolean
    file_user_id_ref?: boolean
    approver_user_id?: boolean
    assigned_by_user_id?: boolean
    status?: boolean
    remarks?: boolean
    created_at?: boolean
    updated_at?: boolean
    actioned_at?: boolean
  }

  export type approvalOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "file_id_ref" | "file_workspace_id_ref" | "file_user_id_ref" | "approver_user_id" | "assigned_by_user_id" | "status" | "remarks" | "created_at" | "updated_at" | "actioned_at", ExtArgs["result"]["approval"]>
  export type approvalInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approver?: boolean | userDefaultArgs<ExtArgs>
    assigner?: boolean | userDefaultArgs<ExtArgs>
    file?: boolean | fileDefaultArgs<ExtArgs>
  }
  export type approvalIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approver?: boolean | userDefaultArgs<ExtArgs>
    assigner?: boolean | userDefaultArgs<ExtArgs>
    file?: boolean | fileDefaultArgs<ExtArgs>
  }
  export type approvalIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    approver?: boolean | userDefaultArgs<ExtArgs>
    assigner?: boolean | userDefaultArgs<ExtArgs>
    file?: boolean | fileDefaultArgs<ExtArgs>
  }

  export type $approvalPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "approval"
    objects: {
      approver: Prisma.$userPayload<ExtArgs>
      assigner: Prisma.$userPayload<ExtArgs>
      file: Prisma.$filePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      file_id_ref: string
      file_workspace_id_ref: string
      file_user_id_ref: string
      approver_user_id: string
      assigned_by_user_id: string
      status: string
      remarks: string | null
      created_at: Date
      updated_at: Date
      actioned_at: Date | null
    }, ExtArgs["result"]["approval"]>
    composites: {}
  }

  type approvalGetPayload<S extends boolean | null | undefined | approvalDefaultArgs> = $Result.GetResult<Prisma.$approvalPayload, S>

  type approvalCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<approvalFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ApprovalCountAggregateInputType | true
    }

  export interface approvalDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['approval'], meta: { name: 'approval' } }
    /**
     * Find zero or one Approval that matches the filter.
     * @param {approvalFindUniqueArgs} args - Arguments to find a Approval
     * @example
     * // Get one Approval
     * const approval = await prisma.approval.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends approvalFindUniqueArgs>(args: SelectSubset<T, approvalFindUniqueArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Approval that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {approvalFindUniqueOrThrowArgs} args - Arguments to find a Approval
     * @example
     * // Get one Approval
     * const approval = await prisma.approval.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends approvalFindUniqueOrThrowArgs>(args: SelectSubset<T, approvalFindUniqueOrThrowArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Approval that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {approvalFindFirstArgs} args - Arguments to find a Approval
     * @example
     * // Get one Approval
     * const approval = await prisma.approval.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends approvalFindFirstArgs>(args?: SelectSubset<T, approvalFindFirstArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Approval that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {approvalFindFirstOrThrowArgs} args - Arguments to find a Approval
     * @example
     * // Get one Approval
     * const approval = await prisma.approval.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends approvalFindFirstOrThrowArgs>(args?: SelectSubset<T, approvalFindFirstOrThrowArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Approvals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {approvalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Approvals
     * const approvals = await prisma.approval.findMany()
     * 
     * // Get first 10 Approvals
     * const approvals = await prisma.approval.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const approvalWithIdOnly = await prisma.approval.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends approvalFindManyArgs>(args?: SelectSubset<T, approvalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Approval.
     * @param {approvalCreateArgs} args - Arguments to create a Approval.
     * @example
     * // Create one Approval
     * const Approval = await prisma.approval.create({
     *   data: {
     *     // ... data to create a Approval
     *   }
     * })
     * 
     */
    create<T extends approvalCreateArgs>(args: SelectSubset<T, approvalCreateArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Approvals.
     * @param {approvalCreateManyArgs} args - Arguments to create many Approvals.
     * @example
     * // Create many Approvals
     * const approval = await prisma.approval.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends approvalCreateManyArgs>(args?: SelectSubset<T, approvalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Approvals and returns the data saved in the database.
     * @param {approvalCreateManyAndReturnArgs} args - Arguments to create many Approvals.
     * @example
     * // Create many Approvals
     * const approval = await prisma.approval.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Approvals and only return the `id`
     * const approvalWithIdOnly = await prisma.approval.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends approvalCreateManyAndReturnArgs>(args?: SelectSubset<T, approvalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Approval.
     * @param {approvalDeleteArgs} args - Arguments to delete one Approval.
     * @example
     * // Delete one Approval
     * const Approval = await prisma.approval.delete({
     *   where: {
     *     // ... filter to delete one Approval
     *   }
     * })
     * 
     */
    delete<T extends approvalDeleteArgs>(args: SelectSubset<T, approvalDeleteArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Approval.
     * @param {approvalUpdateArgs} args - Arguments to update one Approval.
     * @example
     * // Update one Approval
     * const approval = await prisma.approval.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends approvalUpdateArgs>(args: SelectSubset<T, approvalUpdateArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Approvals.
     * @param {approvalDeleteManyArgs} args - Arguments to filter Approvals to delete.
     * @example
     * // Delete a few Approvals
     * const { count } = await prisma.approval.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends approvalDeleteManyArgs>(args?: SelectSubset<T, approvalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Approvals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {approvalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Approvals
     * const approval = await prisma.approval.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends approvalUpdateManyArgs>(args: SelectSubset<T, approvalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Approvals and returns the data updated in the database.
     * @param {approvalUpdateManyAndReturnArgs} args - Arguments to update many Approvals.
     * @example
     * // Update many Approvals
     * const approval = await prisma.approval.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Approvals and only return the `id`
     * const approvalWithIdOnly = await prisma.approval.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends approvalUpdateManyAndReturnArgs>(args: SelectSubset<T, approvalUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Approval.
     * @param {approvalUpsertArgs} args - Arguments to update or create a Approval.
     * @example
     * // Update or create a Approval
     * const approval = await prisma.approval.upsert({
     *   create: {
     *     // ... data to create a Approval
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Approval we want to update
     *   }
     * })
     */
    upsert<T extends approvalUpsertArgs>(args: SelectSubset<T, approvalUpsertArgs<ExtArgs>>): Prisma__approvalClient<$Result.GetResult<Prisma.$approvalPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Approvals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {approvalCountArgs} args - Arguments to filter Approvals to count.
     * @example
     * // Count the number of Approvals
     * const count = await prisma.approval.count({
     *   where: {
     *     // ... the filter for the Approvals we want to count
     *   }
     * })
    **/
    count<T extends approvalCountArgs>(
      args?: Subset<T, approvalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ApprovalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Approval.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApprovalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ApprovalAggregateArgs>(args: Subset<T, ApprovalAggregateArgs>): Prisma.PrismaPromise<GetApprovalAggregateType<T>>

    /**
     * Group by Approval.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {approvalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends approvalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: approvalGroupByArgs['orderBy'] }
        : { orderBy?: approvalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, approvalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetApprovalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the approval model
   */
  readonly fields: approvalFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for approval.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__approvalClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    approver<T extends userDefaultArgs<ExtArgs> = {}>(args?: Subset<T, userDefaultArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    assigner<T extends userDefaultArgs<ExtArgs> = {}>(args?: Subset<T, userDefaultArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    file<T extends fileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, fileDefaultArgs<ExtArgs>>): Prisma__fileClient<$Result.GetResult<Prisma.$filePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the approval model
   */
  interface approvalFieldRefs {
    readonly id: FieldRef<"approval", 'String'>
    readonly file_id_ref: FieldRef<"approval", 'String'>
    readonly file_workspace_id_ref: FieldRef<"approval", 'String'>
    readonly file_user_id_ref: FieldRef<"approval", 'String'>
    readonly approver_user_id: FieldRef<"approval", 'String'>
    readonly assigned_by_user_id: FieldRef<"approval", 'String'>
    readonly status: FieldRef<"approval", 'String'>
    readonly remarks: FieldRef<"approval", 'String'>
    readonly created_at: FieldRef<"approval", 'DateTime'>
    readonly updated_at: FieldRef<"approval", 'DateTime'>
    readonly actioned_at: FieldRef<"approval", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * approval findUnique
   */
  export type approvalFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * Filter, which approval to fetch.
     */
    where: approvalWhereUniqueInput
  }

  /**
   * approval findUniqueOrThrow
   */
  export type approvalFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * Filter, which approval to fetch.
     */
    where: approvalWhereUniqueInput
  }

  /**
   * approval findFirst
   */
  export type approvalFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * Filter, which approval to fetch.
     */
    where?: approvalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of approvals to fetch.
     */
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for approvals.
     */
    cursor?: approvalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` approvals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` approvals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of approvals.
     */
    distinct?: ApprovalScalarFieldEnum | ApprovalScalarFieldEnum[]
  }

  /**
   * approval findFirstOrThrow
   */
  export type approvalFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * Filter, which approval to fetch.
     */
    where?: approvalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of approvals to fetch.
     */
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for approvals.
     */
    cursor?: approvalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` approvals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` approvals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of approvals.
     */
    distinct?: ApprovalScalarFieldEnum | ApprovalScalarFieldEnum[]
  }

  /**
   * approval findMany
   */
  export type approvalFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * Filter, which approvals to fetch.
     */
    where?: approvalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of approvals to fetch.
     */
    orderBy?: approvalOrderByWithRelationInput | approvalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing approvals.
     */
    cursor?: approvalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` approvals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` approvals.
     */
    skip?: number
    distinct?: ApprovalScalarFieldEnum | ApprovalScalarFieldEnum[]
  }

  /**
   * approval create
   */
  export type approvalCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * The data needed to create a approval.
     */
    data: XOR<approvalCreateInput, approvalUncheckedCreateInput>
  }

  /**
   * approval createMany
   */
  export type approvalCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many approvals.
     */
    data: approvalCreateManyInput | approvalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * approval createManyAndReturn
   */
  export type approvalCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * The data used to create many approvals.
     */
    data: approvalCreateManyInput | approvalCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * approval update
   */
  export type approvalUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * The data needed to update a approval.
     */
    data: XOR<approvalUpdateInput, approvalUncheckedUpdateInput>
    /**
     * Choose, which approval to update.
     */
    where: approvalWhereUniqueInput
  }

  /**
   * approval updateMany
   */
  export type approvalUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update approvals.
     */
    data: XOR<approvalUpdateManyMutationInput, approvalUncheckedUpdateManyInput>
    /**
     * Filter which approvals to update
     */
    where?: approvalWhereInput
    /**
     * Limit how many approvals to update.
     */
    limit?: number
  }

  /**
   * approval updateManyAndReturn
   */
  export type approvalUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * The data used to update approvals.
     */
    data: XOR<approvalUpdateManyMutationInput, approvalUncheckedUpdateManyInput>
    /**
     * Filter which approvals to update
     */
    where?: approvalWhereInput
    /**
     * Limit how many approvals to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * approval upsert
   */
  export type approvalUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * The filter to search for the approval to update in case it exists.
     */
    where: approvalWhereUniqueInput
    /**
     * In case the approval found by the `where` argument doesn't exist, create a new approval with this data.
     */
    create: XOR<approvalCreateInput, approvalUncheckedCreateInput>
    /**
     * In case the approval was found with the provided `where` argument, update it with this data.
     */
    update: XOR<approvalUpdateInput, approvalUncheckedUpdateInput>
  }

  /**
   * approval delete
   */
  export type approvalDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
    /**
     * Filter which approval to delete.
     */
    where: approvalWhereUniqueInput
  }

  /**
   * approval deleteMany
   */
  export type approvalDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which approvals to delete
     */
    where?: approvalWhereInput
    /**
     * Limit how many approvals to delete.
     */
    limit?: number
  }

  /**
   * approval without action
   */
  export type approvalDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the approval
     */
    select?: approvalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the approval
     */
    omit?: approvalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: approvalInclude<ExtArgs> | null
  }


  /**
   * Model notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    message: string | null
    type: string | null
    link: string | null
    is_read: boolean | null
    created_at: Date | null
    updated_at: Date | null
    related_approval_process_cuid: string | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    message: string | null
    type: string | null
    link: string | null
    is_read: boolean | null
    created_at: Date | null
    updated_at: Date | null
    related_approval_process_cuid: string | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    user_id: number
    message: number
    type: number
    link: number
    is_read: number
    created_at: number
    updated_at: number
    related_approval_process_cuid: number
    _all: number
  }


  export type NotificationMinAggregateInputType = {
    id?: true
    user_id?: true
    message?: true
    type?: true
    link?: true
    is_read?: true
    created_at?: true
    updated_at?: true
    related_approval_process_cuid?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    user_id?: true
    message?: true
    type?: true
    link?: true
    is_read?: true
    created_at?: true
    updated_at?: true
    related_approval_process_cuid?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    user_id?: true
    message?: true
    type?: true
    link?: true
    is_read?: true
    created_at?: true
    updated_at?: true
    related_approval_process_cuid?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which notification to aggregate.
     */
    where?: notificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications to fetch.
     */
    orderBy?: notificationOrderByWithRelationInput | notificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: notificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type notificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: notificationWhereInput
    orderBy?: notificationOrderByWithAggregationInput | notificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: notificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: string
    user_id: string
    message: string
    type: string | null
    link: string | null
    is_read: boolean
    created_at: Date
    updated_at: Date
    related_approval_process_cuid: string | null
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends notificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type notificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    message?: boolean
    type?: boolean
    link?: boolean
    is_read?: boolean
    created_at?: boolean
    updated_at?: boolean
    related_approval_process_cuid?: boolean
    user?: boolean | userDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type notificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    message?: boolean
    type?: boolean
    link?: boolean
    is_read?: boolean
    created_at?: boolean
    updated_at?: boolean
    related_approval_process_cuid?: boolean
    user?: boolean | userDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type notificationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    message?: boolean
    type?: boolean
    link?: boolean
    is_read?: boolean
    created_at?: boolean
    updated_at?: boolean
    related_approval_process_cuid?: boolean
    user?: boolean | userDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type notificationSelectScalar = {
    id?: boolean
    user_id?: boolean
    message?: boolean
    type?: boolean
    link?: boolean
    is_read?: boolean
    created_at?: boolean
    updated_at?: boolean
    related_approval_process_cuid?: boolean
  }

  export type notificationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "message" | "type" | "link" | "is_read" | "created_at" | "updated_at" | "related_approval_process_cuid", ExtArgs["result"]["notification"]>
  export type notificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | userDefaultArgs<ExtArgs>
  }
  export type notificationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | userDefaultArgs<ExtArgs>
  }
  export type notificationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | userDefaultArgs<ExtArgs>
  }

  export type $notificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "notification"
    objects: {
      user: Prisma.$userPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      message: string
      type: string | null
      link: string | null
      is_read: boolean
      created_at: Date
      updated_at: Date
      related_approval_process_cuid: string | null
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type notificationGetPayload<S extends boolean | null | undefined | notificationDefaultArgs> = $Result.GetResult<Prisma.$notificationPayload, S>

  type notificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<notificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface notificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['notification'], meta: { name: 'notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {notificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends notificationFindUniqueArgs>(args: SelectSubset<T, notificationFindUniqueArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {notificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends notificationFindUniqueOrThrowArgs>(args: SelectSubset<T, notificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends notificationFindFirstArgs>(args?: SelectSubset<T, notificationFindFirstArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends notificationFindFirstOrThrowArgs>(args?: SelectSubset<T, notificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends notificationFindManyArgs>(args?: SelectSubset<T, notificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Notification.
     * @param {notificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends notificationCreateArgs>(args: SelectSubset<T, notificationCreateArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Notifications.
     * @param {notificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends notificationCreateManyArgs>(args?: SelectSubset<T, notificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Notifications and returns the data saved in the database.
     * @param {notificationCreateManyAndReturnArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends notificationCreateManyAndReturnArgs>(args?: SelectSubset<T, notificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Notification.
     * @param {notificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends notificationDeleteArgs>(args: SelectSubset<T, notificationDeleteArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Notification.
     * @param {notificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends notificationUpdateArgs>(args: SelectSubset<T, notificationUpdateArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Notifications.
     * @param {notificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends notificationDeleteManyArgs>(args?: SelectSubset<T, notificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends notificationUpdateManyArgs>(args: SelectSubset<T, notificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications and returns the data updated in the database.
     * @param {notificationUpdateManyAndReturnArgs} args - Arguments to update many Notifications.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends notificationUpdateManyAndReturnArgs>(args: SelectSubset<T, notificationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Notification.
     * @param {notificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends notificationUpsertArgs>(args: SelectSubset<T, notificationUpsertArgs<ExtArgs>>): Prisma__notificationClient<$Result.GetResult<Prisma.$notificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends notificationCountArgs>(
      args?: Subset<T, notificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends notificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: notificationGroupByArgs['orderBy'] }
        : { orderBy?: notificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, notificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the notification model
   */
  readonly fields: notificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__notificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends userDefaultArgs<ExtArgs> = {}>(args?: Subset<T, userDefaultArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the notification model
   */
  interface notificationFieldRefs {
    readonly id: FieldRef<"notification", 'String'>
    readonly user_id: FieldRef<"notification", 'String'>
    readonly message: FieldRef<"notification", 'String'>
    readonly type: FieldRef<"notification", 'String'>
    readonly link: FieldRef<"notification", 'String'>
    readonly is_read: FieldRef<"notification", 'Boolean'>
    readonly created_at: FieldRef<"notification", 'DateTime'>
    readonly updated_at: FieldRef<"notification", 'DateTime'>
    readonly related_approval_process_cuid: FieldRef<"notification", 'String'>
  }
    

  // Custom InputTypes
  /**
   * notification findUnique
   */
  export type notificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * Filter, which notification to fetch.
     */
    where: notificationWhereUniqueInput
  }

  /**
   * notification findUniqueOrThrow
   */
  export type notificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * Filter, which notification to fetch.
     */
    where: notificationWhereUniqueInput
  }

  /**
   * notification findFirst
   */
  export type notificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * Filter, which notification to fetch.
     */
    where?: notificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications to fetch.
     */
    orderBy?: notificationOrderByWithRelationInput | notificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for notifications.
     */
    cursor?: notificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * notification findFirstOrThrow
   */
  export type notificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * Filter, which notification to fetch.
     */
    where?: notificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications to fetch.
     */
    orderBy?: notificationOrderByWithRelationInput | notificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for notifications.
     */
    cursor?: notificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * notification findMany
   */
  export type notificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * Filter, which notifications to fetch.
     */
    where?: notificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications to fetch.
     */
    orderBy?: notificationOrderByWithRelationInput | notificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing notifications.
     */
    cursor?: notificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * notification create
   */
  export type notificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * The data needed to create a notification.
     */
    data: XOR<notificationCreateInput, notificationUncheckedCreateInput>
  }

  /**
   * notification createMany
   */
  export type notificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many notifications.
     */
    data: notificationCreateManyInput | notificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * notification createManyAndReturn
   */
  export type notificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * The data used to create many notifications.
     */
    data: notificationCreateManyInput | notificationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * notification update
   */
  export type notificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * The data needed to update a notification.
     */
    data: XOR<notificationUpdateInput, notificationUncheckedUpdateInput>
    /**
     * Choose, which notification to update.
     */
    where: notificationWhereUniqueInput
  }

  /**
   * notification updateMany
   */
  export type notificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update notifications.
     */
    data: XOR<notificationUpdateManyMutationInput, notificationUncheckedUpdateManyInput>
    /**
     * Filter which notifications to update
     */
    where?: notificationWhereInput
    /**
     * Limit how many notifications to update.
     */
    limit?: number
  }

  /**
   * notification updateManyAndReturn
   */
  export type notificationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * The data used to update notifications.
     */
    data: XOR<notificationUpdateManyMutationInput, notificationUncheckedUpdateManyInput>
    /**
     * Filter which notifications to update
     */
    where?: notificationWhereInput
    /**
     * Limit how many notifications to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * notification upsert
   */
  export type notificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * The filter to search for the notification to update in case it exists.
     */
    where: notificationWhereUniqueInput
    /**
     * In case the notification found by the `where` argument doesn't exist, create a new notification with this data.
     */
    create: XOR<notificationCreateInput, notificationUncheckedCreateInput>
    /**
     * In case the notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<notificationUpdateInput, notificationUncheckedUpdateInput>
  }

  /**
   * notification delete
   */
  export type notificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
    /**
     * Filter which notification to delete.
     */
    where: notificationWhereUniqueInput
  }

  /**
   * notification deleteMany
   */
  export type notificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which notifications to delete
     */
    where?: notificationWhereInput
    /**
     * Limit how many notifications to delete.
     */
    limit?: number
  }

  /**
   * notification without action
   */
  export type notificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notification
     */
    select?: notificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notification
     */
    omit?: notificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: notificationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const FileScalarFieldEnum: {
    id: 'id',
    workspace_id: 'workspace_id',
    user_id: 'user_id',
    description: 'description',
    color: 'color',
    labels: 'labels',
    created_at: 'created_at',
    updated_at: 'updated_at',
    pengesahan_pada: 'pengesahan_pada',
    is_self_file: 'is_self_file'
  };

  export type FileScalarFieldEnum = (typeof FileScalarFieldEnum)[keyof typeof FileScalarFieldEnum]


  export const FolderScalarFieldEnum: {
    id: 'id',
    workspace_id: 'workspace_id',
    user_id: 'user_id',
    description: 'description',
    color: 'color',
    labels: 'labels',
    created_at: 'created_at',
    updated_at: 'updated_at',
    is_self_folder: 'is_self_folder'
  };

  export type FolderScalarFieldEnum = (typeof FolderScalarFieldEnum)[keyof typeof FolderScalarFieldEnum]


  export const Onboarding_statusScalarFieldEnum: {
    user_id: 'user_id',
    is_completed: 'is_completed',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type Onboarding_statusScalarFieldEnum = (typeof Onboarding_statusScalarFieldEnum)[keyof typeof Onboarding_statusScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    displayname: 'displayname',
    primaryemail: 'primaryemail',
    is_admin: 'is_admin'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const WorkspaceScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    url: 'url',
    color: 'color',
    created_at: 'created_at',
    name: 'name',
    is_self_workspace: 'is_self_workspace'
  };

  export type WorkspaceScalarFieldEnum = (typeof WorkspaceScalarFieldEnum)[keyof typeof WorkspaceScalarFieldEnum]


  export const ApprovalScalarFieldEnum: {
    id: 'id',
    file_id_ref: 'file_id_ref',
    file_workspace_id_ref: 'file_workspace_id_ref',
    file_user_id_ref: 'file_user_id_ref',
    approver_user_id: 'approver_user_id',
    assigned_by_user_id: 'assigned_by_user_id',
    status: 'status',
    remarks: 'remarks',
    created_at: 'created_at',
    updated_at: 'updated_at',
    actioned_at: 'actioned_at'
  };

  export type ApprovalScalarFieldEnum = (typeof ApprovalScalarFieldEnum)[keyof typeof ApprovalScalarFieldEnum]


  export const NotificationScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    message: 'message',
    type: 'type',
    link: 'link',
    is_read: 'is_read',
    created_at: 'created_at',
    updated_at: 'updated_at',
    related_approval_process_cuid: 'related_approval_process_cuid'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type fileWhereInput = {
    AND?: fileWhereInput | fileWhereInput[]
    OR?: fileWhereInput[]
    NOT?: fileWhereInput | fileWhereInput[]
    id?: StringFilter<"file"> | string
    workspace_id?: StringFilter<"file"> | string
    user_id?: StringFilter<"file"> | string
    description?: StringNullableFilter<"file"> | string | null
    color?: StringNullableFilter<"file"> | string | null
    labels?: StringNullableListFilter<"file">
    created_at?: DateTimeFilter<"file"> | Date | string
    updated_at?: DateTimeFilter<"file"> | Date | string
    pengesahan_pada?: DateTimeNullableFilter<"file"> | Date | string | null
    is_self_file?: BoolNullableFilter<"file"> | boolean | null
    approvals?: ApprovalListRelationFilter
    workspace?: XOR<WorkspaceScalarRelationFilter, workspaceWhereInput>
  }

  export type fileOrderByWithRelationInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    labels?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    pengesahan_pada?: SortOrderInput | SortOrder
    is_self_file?: SortOrderInput | SortOrder
    approvals?: approvalOrderByRelationAggregateInput
    workspace?: workspaceOrderByWithRelationInput
  }

  export type fileWhereUniqueInput = Prisma.AtLeast<{
    id_workspace_id_user_id?: fileIdWorkspace_idUser_idCompoundUniqueInput
    AND?: fileWhereInput | fileWhereInput[]
    OR?: fileWhereInput[]
    NOT?: fileWhereInput | fileWhereInput[]
    id?: StringFilter<"file"> | string
    workspace_id?: StringFilter<"file"> | string
    user_id?: StringFilter<"file"> | string
    description?: StringNullableFilter<"file"> | string | null
    color?: StringNullableFilter<"file"> | string | null
    labels?: StringNullableListFilter<"file">
    created_at?: DateTimeFilter<"file"> | Date | string
    updated_at?: DateTimeFilter<"file"> | Date | string
    pengesahan_pada?: DateTimeNullableFilter<"file"> | Date | string | null
    is_self_file?: BoolNullableFilter<"file"> | boolean | null
    approvals?: ApprovalListRelationFilter
    workspace?: XOR<WorkspaceScalarRelationFilter, workspaceWhereInput>
  }, "id_workspace_id_user_id">

  export type fileOrderByWithAggregationInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    labels?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    pengesahan_pada?: SortOrderInput | SortOrder
    is_self_file?: SortOrderInput | SortOrder
    _count?: fileCountOrderByAggregateInput
    _max?: fileMaxOrderByAggregateInput
    _min?: fileMinOrderByAggregateInput
  }

  export type fileScalarWhereWithAggregatesInput = {
    AND?: fileScalarWhereWithAggregatesInput | fileScalarWhereWithAggregatesInput[]
    OR?: fileScalarWhereWithAggregatesInput[]
    NOT?: fileScalarWhereWithAggregatesInput | fileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"file"> | string
    workspace_id?: StringWithAggregatesFilter<"file"> | string
    user_id?: StringWithAggregatesFilter<"file"> | string
    description?: StringNullableWithAggregatesFilter<"file"> | string | null
    color?: StringNullableWithAggregatesFilter<"file"> | string | null
    labels?: StringNullableListFilter<"file">
    created_at?: DateTimeWithAggregatesFilter<"file"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"file"> | Date | string
    pengesahan_pada?: DateTimeNullableWithAggregatesFilter<"file"> | Date | string | null
    is_self_file?: BoolNullableWithAggregatesFilter<"file"> | boolean | null
  }

  export type folderWhereInput = {
    AND?: folderWhereInput | folderWhereInput[]
    OR?: folderWhereInput[]
    NOT?: folderWhereInput | folderWhereInput[]
    id?: StringFilter<"folder"> | string
    workspace_id?: StringFilter<"folder"> | string
    user_id?: StringFilter<"folder"> | string
    description?: StringNullableFilter<"folder"> | string | null
    color?: StringNullableFilter<"folder"> | string | null
    labels?: StringNullableListFilter<"folder">
    created_at?: DateTimeFilter<"folder"> | Date | string
    updated_at?: DateTimeFilter<"folder"> | Date | string
    is_self_folder?: BoolNullableFilter<"folder"> | boolean | null
    workspace?: XOR<WorkspaceScalarRelationFilter, workspaceWhereInput>
  }

  export type folderOrderByWithRelationInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    labels?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    is_self_folder?: SortOrderInput | SortOrder
    workspace?: workspaceOrderByWithRelationInput
  }

  export type folderWhereUniqueInput = Prisma.AtLeast<{
    id_workspace_id_user_id?: folderIdWorkspace_idUser_idCompoundUniqueInput
    AND?: folderWhereInput | folderWhereInput[]
    OR?: folderWhereInput[]
    NOT?: folderWhereInput | folderWhereInput[]
    id?: StringFilter<"folder"> | string
    workspace_id?: StringFilter<"folder"> | string
    user_id?: StringFilter<"folder"> | string
    description?: StringNullableFilter<"folder"> | string | null
    color?: StringNullableFilter<"folder"> | string | null
    labels?: StringNullableListFilter<"folder">
    created_at?: DateTimeFilter<"folder"> | Date | string
    updated_at?: DateTimeFilter<"folder"> | Date | string
    is_self_folder?: BoolNullableFilter<"folder"> | boolean | null
    workspace?: XOR<WorkspaceScalarRelationFilter, workspaceWhereInput>
  }, "id_workspace_id_user_id">

  export type folderOrderByWithAggregationInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    labels?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    is_self_folder?: SortOrderInput | SortOrder
    _count?: folderCountOrderByAggregateInput
    _max?: folderMaxOrderByAggregateInput
    _min?: folderMinOrderByAggregateInput
  }

  export type folderScalarWhereWithAggregatesInput = {
    AND?: folderScalarWhereWithAggregatesInput | folderScalarWhereWithAggregatesInput[]
    OR?: folderScalarWhereWithAggregatesInput[]
    NOT?: folderScalarWhereWithAggregatesInput | folderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"folder"> | string
    workspace_id?: StringWithAggregatesFilter<"folder"> | string
    user_id?: StringWithAggregatesFilter<"folder"> | string
    description?: StringNullableWithAggregatesFilter<"folder"> | string | null
    color?: StringNullableWithAggregatesFilter<"folder"> | string | null
    labels?: StringNullableListFilter<"folder">
    created_at?: DateTimeWithAggregatesFilter<"folder"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"folder"> | Date | string
    is_self_folder?: BoolNullableWithAggregatesFilter<"folder"> | boolean | null
  }

  export type onboarding_statusWhereInput = {
    AND?: onboarding_statusWhereInput | onboarding_statusWhereInput[]
    OR?: onboarding_statusWhereInput[]
    NOT?: onboarding_statusWhereInput | onboarding_statusWhereInput[]
    user_id?: StringFilter<"onboarding_status"> | string
    is_completed?: BoolFilter<"onboarding_status"> | boolean
    created_at?: DateTimeFilter<"onboarding_status"> | Date | string
    updated_at?: DateTimeFilter<"onboarding_status"> | Date | string
  }

  export type onboarding_statusOrderByWithRelationInput = {
    user_id?: SortOrder
    is_completed?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type onboarding_statusWhereUniqueInput = Prisma.AtLeast<{
    user_id?: string
    AND?: onboarding_statusWhereInput | onboarding_statusWhereInput[]
    OR?: onboarding_statusWhereInput[]
    NOT?: onboarding_statusWhereInput | onboarding_statusWhereInput[]
    is_completed?: BoolFilter<"onboarding_status"> | boolean
    created_at?: DateTimeFilter<"onboarding_status"> | Date | string
    updated_at?: DateTimeFilter<"onboarding_status"> | Date | string
  }, "user_id">

  export type onboarding_statusOrderByWithAggregationInput = {
    user_id?: SortOrder
    is_completed?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: onboarding_statusCountOrderByAggregateInput
    _max?: onboarding_statusMaxOrderByAggregateInput
    _min?: onboarding_statusMinOrderByAggregateInput
  }

  export type onboarding_statusScalarWhereWithAggregatesInput = {
    AND?: onboarding_statusScalarWhereWithAggregatesInput | onboarding_statusScalarWhereWithAggregatesInput[]
    OR?: onboarding_statusScalarWhereWithAggregatesInput[]
    NOT?: onboarding_statusScalarWhereWithAggregatesInput | onboarding_statusScalarWhereWithAggregatesInput[]
    user_id?: StringWithAggregatesFilter<"onboarding_status"> | string
    is_completed?: BoolWithAggregatesFilter<"onboarding_status"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"onboarding_status"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"onboarding_status"> | Date | string
  }

  export type userWhereInput = {
    AND?: userWhereInput | userWhereInput[]
    OR?: userWhereInput[]
    NOT?: userWhereInput | userWhereInput[]
    id?: StringFilter<"user"> | string
    displayname?: StringNullableFilter<"user"> | string | null
    primaryemail?: StringNullableFilter<"user"> | string | null
    is_admin?: BoolNullableFilter<"user"> | boolean | null
    approvals_to_action?: ApprovalListRelationFilter
    approvals_assigned?: ApprovalListRelationFilter
    notifications?: NotificationListRelationFilter
  }

  export type userOrderByWithRelationInput = {
    id?: SortOrder
    displayname?: SortOrderInput | SortOrder
    primaryemail?: SortOrderInput | SortOrder
    is_admin?: SortOrderInput | SortOrder
    approvals_to_action?: approvalOrderByRelationAggregateInput
    approvals_assigned?: approvalOrderByRelationAggregateInput
    notifications?: notificationOrderByRelationAggregateInput
  }

  export type userWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: userWhereInput | userWhereInput[]
    OR?: userWhereInput[]
    NOT?: userWhereInput | userWhereInput[]
    displayname?: StringNullableFilter<"user"> | string | null
    primaryemail?: StringNullableFilter<"user"> | string | null
    is_admin?: BoolNullableFilter<"user"> | boolean | null
    approvals_to_action?: ApprovalListRelationFilter
    approvals_assigned?: ApprovalListRelationFilter
    notifications?: NotificationListRelationFilter
  }, "id">

  export type userOrderByWithAggregationInput = {
    id?: SortOrder
    displayname?: SortOrderInput | SortOrder
    primaryemail?: SortOrderInput | SortOrder
    is_admin?: SortOrderInput | SortOrder
    _count?: userCountOrderByAggregateInput
    _max?: userMaxOrderByAggregateInput
    _min?: userMinOrderByAggregateInput
  }

  export type userScalarWhereWithAggregatesInput = {
    AND?: userScalarWhereWithAggregatesInput | userScalarWhereWithAggregatesInput[]
    OR?: userScalarWhereWithAggregatesInput[]
    NOT?: userScalarWhereWithAggregatesInput | userScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"user"> | string
    displayname?: StringNullableWithAggregatesFilter<"user"> | string | null
    primaryemail?: StringNullableWithAggregatesFilter<"user"> | string | null
    is_admin?: BoolNullableWithAggregatesFilter<"user"> | boolean | null
  }

  export type workspaceWhereInput = {
    AND?: workspaceWhereInput | workspaceWhereInput[]
    OR?: workspaceWhereInput[]
    NOT?: workspaceWhereInput | workspaceWhereInput[]
    id?: StringFilter<"workspace"> | string
    user_id?: StringFilter<"workspace"> | string
    url?: StringFilter<"workspace"> | string
    color?: StringNullableFilter<"workspace"> | string | null
    created_at?: DateTimeFilter<"workspace"> | Date | string
    name?: StringNullableFilter<"workspace"> | string | null
    is_self_workspace?: BoolNullableFilter<"workspace"> | boolean | null
    file?: FileListRelationFilter
    folder?: FolderListRelationFilter
  }

  export type workspaceOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    url?: SortOrder
    color?: SortOrderInput | SortOrder
    created_at?: SortOrder
    name?: SortOrderInput | SortOrder
    is_self_workspace?: SortOrderInput | SortOrder
    file?: fileOrderByRelationAggregateInput
    folder?: folderOrderByRelationAggregateInput
  }

  export type workspaceWhereUniqueInput = Prisma.AtLeast<{
    id_user_id?: workspaceIdUser_idCompoundUniqueInput
    AND?: workspaceWhereInput | workspaceWhereInput[]
    OR?: workspaceWhereInput[]
    NOT?: workspaceWhereInput | workspaceWhereInput[]
    id?: StringFilter<"workspace"> | string
    user_id?: StringFilter<"workspace"> | string
    url?: StringFilter<"workspace"> | string
    color?: StringNullableFilter<"workspace"> | string | null
    created_at?: DateTimeFilter<"workspace"> | Date | string
    name?: StringNullableFilter<"workspace"> | string | null
    is_self_workspace?: BoolNullableFilter<"workspace"> | boolean | null
    file?: FileListRelationFilter
    folder?: FolderListRelationFilter
  }, "id_user_id">

  export type workspaceOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    url?: SortOrder
    color?: SortOrderInput | SortOrder
    created_at?: SortOrder
    name?: SortOrderInput | SortOrder
    is_self_workspace?: SortOrderInput | SortOrder
    _count?: workspaceCountOrderByAggregateInput
    _max?: workspaceMaxOrderByAggregateInput
    _min?: workspaceMinOrderByAggregateInput
  }

  export type workspaceScalarWhereWithAggregatesInput = {
    AND?: workspaceScalarWhereWithAggregatesInput | workspaceScalarWhereWithAggregatesInput[]
    OR?: workspaceScalarWhereWithAggregatesInput[]
    NOT?: workspaceScalarWhereWithAggregatesInput | workspaceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"workspace"> | string
    user_id?: StringWithAggregatesFilter<"workspace"> | string
    url?: StringWithAggregatesFilter<"workspace"> | string
    color?: StringNullableWithAggregatesFilter<"workspace"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"workspace"> | Date | string
    name?: StringNullableWithAggregatesFilter<"workspace"> | string | null
    is_self_workspace?: BoolNullableWithAggregatesFilter<"workspace"> | boolean | null
  }

  export type approvalWhereInput = {
    AND?: approvalWhereInput | approvalWhereInput[]
    OR?: approvalWhereInput[]
    NOT?: approvalWhereInput | approvalWhereInput[]
    id?: StringFilter<"approval"> | string
    file_id_ref?: StringFilter<"approval"> | string
    file_workspace_id_ref?: StringFilter<"approval"> | string
    file_user_id_ref?: StringFilter<"approval"> | string
    approver_user_id?: StringFilter<"approval"> | string
    assigned_by_user_id?: StringFilter<"approval"> | string
    status?: StringFilter<"approval"> | string
    remarks?: StringNullableFilter<"approval"> | string | null
    created_at?: DateTimeFilter<"approval"> | Date | string
    updated_at?: DateTimeFilter<"approval"> | Date | string
    actioned_at?: DateTimeNullableFilter<"approval"> | Date | string | null
    approver?: XOR<UserScalarRelationFilter, userWhereInput>
    assigner?: XOR<UserScalarRelationFilter, userWhereInput>
    file?: XOR<FileScalarRelationFilter, fileWhereInput>
  }

  export type approvalOrderByWithRelationInput = {
    id?: SortOrder
    file_id_ref?: SortOrder
    file_workspace_id_ref?: SortOrder
    file_user_id_ref?: SortOrder
    approver_user_id?: SortOrder
    assigned_by_user_id?: SortOrder
    status?: SortOrder
    remarks?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    actioned_at?: SortOrderInput | SortOrder
    approver?: userOrderByWithRelationInput
    assigner?: userOrderByWithRelationInput
    file?: fileOrderByWithRelationInput
  }

  export type approvalWhereUniqueInput = Prisma.AtLeast<{
    id_approver_user_id?: approvalIdApprover_user_idCompoundUniqueInput
    AND?: approvalWhereInput | approvalWhereInput[]
    OR?: approvalWhereInput[]
    NOT?: approvalWhereInput | approvalWhereInput[]
    id?: StringFilter<"approval"> | string
    file_id_ref?: StringFilter<"approval"> | string
    file_workspace_id_ref?: StringFilter<"approval"> | string
    file_user_id_ref?: StringFilter<"approval"> | string
    approver_user_id?: StringFilter<"approval"> | string
    assigned_by_user_id?: StringFilter<"approval"> | string
    status?: StringFilter<"approval"> | string
    remarks?: StringNullableFilter<"approval"> | string | null
    created_at?: DateTimeFilter<"approval"> | Date | string
    updated_at?: DateTimeFilter<"approval"> | Date | string
    actioned_at?: DateTimeNullableFilter<"approval"> | Date | string | null
    approver?: XOR<UserScalarRelationFilter, userWhereInput>
    assigner?: XOR<UserScalarRelationFilter, userWhereInput>
    file?: XOR<FileScalarRelationFilter, fileWhereInput>
  }, "id_approver_user_id">

  export type approvalOrderByWithAggregationInput = {
    id?: SortOrder
    file_id_ref?: SortOrder
    file_workspace_id_ref?: SortOrder
    file_user_id_ref?: SortOrder
    approver_user_id?: SortOrder
    assigned_by_user_id?: SortOrder
    status?: SortOrder
    remarks?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    actioned_at?: SortOrderInput | SortOrder
    _count?: approvalCountOrderByAggregateInput
    _max?: approvalMaxOrderByAggregateInput
    _min?: approvalMinOrderByAggregateInput
  }

  export type approvalScalarWhereWithAggregatesInput = {
    AND?: approvalScalarWhereWithAggregatesInput | approvalScalarWhereWithAggregatesInput[]
    OR?: approvalScalarWhereWithAggregatesInput[]
    NOT?: approvalScalarWhereWithAggregatesInput | approvalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"approval"> | string
    file_id_ref?: StringWithAggregatesFilter<"approval"> | string
    file_workspace_id_ref?: StringWithAggregatesFilter<"approval"> | string
    file_user_id_ref?: StringWithAggregatesFilter<"approval"> | string
    approver_user_id?: StringWithAggregatesFilter<"approval"> | string
    assigned_by_user_id?: StringWithAggregatesFilter<"approval"> | string
    status?: StringWithAggregatesFilter<"approval"> | string
    remarks?: StringNullableWithAggregatesFilter<"approval"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"approval"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"approval"> | Date | string
    actioned_at?: DateTimeNullableWithAggregatesFilter<"approval"> | Date | string | null
  }

  export type notificationWhereInput = {
    AND?: notificationWhereInput | notificationWhereInput[]
    OR?: notificationWhereInput[]
    NOT?: notificationWhereInput | notificationWhereInput[]
    id?: StringFilter<"notification"> | string
    user_id?: StringFilter<"notification"> | string
    message?: StringFilter<"notification"> | string
    type?: StringNullableFilter<"notification"> | string | null
    link?: StringNullableFilter<"notification"> | string | null
    is_read?: BoolFilter<"notification"> | boolean
    created_at?: DateTimeFilter<"notification"> | Date | string
    updated_at?: DateTimeFilter<"notification"> | Date | string
    related_approval_process_cuid?: StringNullableFilter<"notification"> | string | null
    user?: XOR<UserScalarRelationFilter, userWhereInput>
  }

  export type notificationOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    message?: SortOrder
    type?: SortOrderInput | SortOrder
    link?: SortOrderInput | SortOrder
    is_read?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    related_approval_process_cuid?: SortOrderInput | SortOrder
    user?: userOrderByWithRelationInput
  }

  export type notificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: notificationWhereInput | notificationWhereInput[]
    OR?: notificationWhereInput[]
    NOT?: notificationWhereInput | notificationWhereInput[]
    user_id?: StringFilter<"notification"> | string
    message?: StringFilter<"notification"> | string
    type?: StringNullableFilter<"notification"> | string | null
    link?: StringNullableFilter<"notification"> | string | null
    is_read?: BoolFilter<"notification"> | boolean
    created_at?: DateTimeFilter<"notification"> | Date | string
    updated_at?: DateTimeFilter<"notification"> | Date | string
    related_approval_process_cuid?: StringNullableFilter<"notification"> | string | null
    user?: XOR<UserScalarRelationFilter, userWhereInput>
  }, "id">

  export type notificationOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    message?: SortOrder
    type?: SortOrderInput | SortOrder
    link?: SortOrderInput | SortOrder
    is_read?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    related_approval_process_cuid?: SortOrderInput | SortOrder
    _count?: notificationCountOrderByAggregateInput
    _max?: notificationMaxOrderByAggregateInput
    _min?: notificationMinOrderByAggregateInput
  }

  export type notificationScalarWhereWithAggregatesInput = {
    AND?: notificationScalarWhereWithAggregatesInput | notificationScalarWhereWithAggregatesInput[]
    OR?: notificationScalarWhereWithAggregatesInput[]
    NOT?: notificationScalarWhereWithAggregatesInput | notificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"notification"> | string
    user_id?: StringWithAggregatesFilter<"notification"> | string
    message?: StringWithAggregatesFilter<"notification"> | string
    type?: StringNullableWithAggregatesFilter<"notification"> | string | null
    link?: StringNullableWithAggregatesFilter<"notification"> | string | null
    is_read?: BoolWithAggregatesFilter<"notification"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"notification"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"notification"> | Date | string
    related_approval_process_cuid?: StringNullableWithAggregatesFilter<"notification"> | string | null
  }

  export type fileCreateInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
    approvals?: approvalCreateNestedManyWithoutFileInput
    workspace: workspaceCreateNestedOneWithoutFileInput
  }

  export type fileUncheckedCreateInput = {
    id: string
    workspace_id: string
    user_id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
    approvals?: approvalUncheckedCreateNestedManyWithoutFileInput
  }

  export type fileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals?: approvalUpdateManyWithoutFileNestedInput
    workspace?: workspaceUpdateOneRequiredWithoutFileNestedInput
  }

  export type fileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workspace_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals?: approvalUncheckedUpdateManyWithoutFileNestedInput
  }

  export type fileCreateManyInput = {
    id: string
    workspace_id: string
    user_id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
  }

  export type fileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type fileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    workspace_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type folderCreateInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: folderCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    is_self_folder?: boolean | null
    workspace: workspaceCreateNestedOneWithoutFolderInput
  }

  export type folderUncheckedCreateInput = {
    id: string
    workspace_id: string
    user_id: string
    description?: string | null
    color?: string | null
    labels?: folderCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    is_self_folder?: boolean | null
  }

  export type folderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
    workspace?: workspaceUpdateOneRequiredWithoutFolderNestedInput
  }

  export type folderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workspace_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type folderCreateManyInput = {
    id: string
    workspace_id: string
    user_id: string
    description?: string | null
    color?: string | null
    labels?: folderCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    is_self_folder?: boolean | null
  }

  export type folderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type folderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    workspace_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type onboarding_statusCreateInput = {
    user_id: string
    is_completed?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type onboarding_statusUncheckedCreateInput = {
    user_id: string
    is_completed?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type onboarding_statusUpdateInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    is_completed?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type onboarding_statusUncheckedUpdateInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    is_completed?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type onboarding_statusCreateManyInput = {
    user_id: string
    is_completed?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type onboarding_statusUpdateManyMutationInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    is_completed?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type onboarding_statusUncheckedUpdateManyInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    is_completed?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type userCreateInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_to_action?: approvalCreateNestedManyWithoutApproverInput
    approvals_assigned?: approvalCreateNestedManyWithoutAssignerInput
    notifications?: notificationCreateNestedManyWithoutUserInput
  }

  export type userUncheckedCreateInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_to_action?: approvalUncheckedCreateNestedManyWithoutApproverInput
    approvals_assigned?: approvalUncheckedCreateNestedManyWithoutAssignerInput
    notifications?: notificationUncheckedCreateNestedManyWithoutUserInput
  }

  export type userUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_to_action?: approvalUpdateManyWithoutApproverNestedInput
    approvals_assigned?: approvalUpdateManyWithoutAssignerNestedInput
    notifications?: notificationUpdateManyWithoutUserNestedInput
  }

  export type userUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_to_action?: approvalUncheckedUpdateManyWithoutApproverNestedInput
    approvals_assigned?: approvalUncheckedUpdateManyWithoutAssignerNestedInput
    notifications?: notificationUncheckedUpdateManyWithoutUserNestedInput
  }

  export type userCreateManyInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
  }

  export type userUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type userUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type workspaceCreateInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
    file?: fileCreateNestedManyWithoutWorkspaceInput
    folder?: folderCreateNestedManyWithoutWorkspaceInput
  }

  export type workspaceUncheckedCreateInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
    file?: fileUncheckedCreateNestedManyWithoutWorkspaceInput
    folder?: folderUncheckedCreateNestedManyWithoutWorkspaceInput
  }

  export type workspaceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
    file?: fileUpdateManyWithoutWorkspaceNestedInput
    folder?: folderUpdateManyWithoutWorkspaceNestedInput
  }

  export type workspaceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
    file?: fileUncheckedUpdateManyWithoutWorkspaceNestedInput
    folder?: folderUncheckedUpdateManyWithoutWorkspaceNestedInput
  }

  export type workspaceCreateManyInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
  }

  export type workspaceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type workspaceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type approvalCreateInput = {
    id?: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
    approver: userCreateNestedOneWithoutApprovals_to_actionInput
    assigner: userCreateNestedOneWithoutApprovals_assignedInput
    file: fileCreateNestedOneWithoutApprovalsInput
  }

  export type approvalUncheckedCreateInput = {
    id?: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    approver_user_id: string
    assigned_by_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approver?: userUpdateOneRequiredWithoutApprovals_to_actionNestedInput
    assigner?: userUpdateOneRequiredWithoutApprovals_assignedNestedInput
    file?: fileUpdateOneRequiredWithoutApprovalsNestedInput
  }

  export type approvalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_id_ref?: StringFieldUpdateOperationsInput | string
    file_workspace_id_ref?: StringFieldUpdateOperationsInput | string
    file_user_id_ref?: StringFieldUpdateOperationsInput | string
    approver_user_id?: StringFieldUpdateOperationsInput | string
    assigned_by_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalCreateManyInput = {
    id?: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    approver_user_id: string
    assigned_by_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_id_ref?: StringFieldUpdateOperationsInput | string
    file_workspace_id_ref?: StringFieldUpdateOperationsInput | string
    file_user_id_ref?: StringFieldUpdateOperationsInput | string
    approver_user_id?: StringFieldUpdateOperationsInput | string
    assigned_by_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type notificationCreateInput = {
    id?: string
    message: string
    type?: string | null
    link?: string | null
    is_read?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    related_approval_process_cuid?: string | null
    user: userCreateNestedOneWithoutNotificationsInput
  }

  export type notificationUncheckedCreateInput = {
    id?: string
    user_id: string
    message: string
    type?: string | null
    link?: string | null
    is_read?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    related_approval_process_cuid?: string | null
  }

  export type notificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
    user?: userUpdateOneRequiredWithoutNotificationsNestedInput
  }

  export type notificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type notificationCreateManyInput = {
    id?: string
    user_id: string
    message: string
    type?: string | null
    link?: string | null
    is_read?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    related_approval_process_cuid?: string | null
  }

  export type notificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type notificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type ApprovalListRelationFilter = {
    every?: approvalWhereInput
    some?: approvalWhereInput
    none?: approvalWhereInput
  }

  export type WorkspaceScalarRelationFilter = {
    is?: workspaceWhereInput
    isNot?: workspaceWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type approvalOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type fileIdWorkspace_idUser_idCompoundUniqueInput = {
    id: string
    workspace_id: string
    user_id: string
  }

  export type fileCountOrderByAggregateInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrder
    color?: SortOrder
    labels?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    pengesahan_pada?: SortOrder
    is_self_file?: SortOrder
  }

  export type fileMaxOrderByAggregateInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    pengesahan_pada?: SortOrder
    is_self_file?: SortOrder
  }

  export type fileMinOrderByAggregateInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    pengesahan_pada?: SortOrder
    is_self_file?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type folderIdWorkspace_idUser_idCompoundUniqueInput = {
    id: string
    workspace_id: string
    user_id: string
  }

  export type folderCountOrderByAggregateInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrder
    color?: SortOrder
    labels?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    is_self_folder?: SortOrder
  }

  export type folderMaxOrderByAggregateInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    is_self_folder?: SortOrder
  }

  export type folderMinOrderByAggregateInput = {
    id?: SortOrder
    workspace_id?: SortOrder
    user_id?: SortOrder
    description?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    is_self_folder?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type onboarding_statusCountOrderByAggregateInput = {
    user_id?: SortOrder
    is_completed?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type onboarding_statusMaxOrderByAggregateInput = {
    user_id?: SortOrder
    is_completed?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type onboarding_statusMinOrderByAggregateInput = {
    user_id?: SortOrder
    is_completed?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NotificationListRelationFilter = {
    every?: notificationWhereInput
    some?: notificationWhereInput
    none?: notificationWhereInput
  }

  export type notificationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type userCountOrderByAggregateInput = {
    id?: SortOrder
    displayname?: SortOrder
    primaryemail?: SortOrder
    is_admin?: SortOrder
  }

  export type userMaxOrderByAggregateInput = {
    id?: SortOrder
    displayname?: SortOrder
    primaryemail?: SortOrder
    is_admin?: SortOrder
  }

  export type userMinOrderByAggregateInput = {
    id?: SortOrder
    displayname?: SortOrder
    primaryemail?: SortOrder
    is_admin?: SortOrder
  }

  export type FileListRelationFilter = {
    every?: fileWhereInput
    some?: fileWhereInput
    none?: fileWhereInput
  }

  export type FolderListRelationFilter = {
    every?: folderWhereInput
    some?: folderWhereInput
    none?: folderWhereInput
  }

  export type fileOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type folderOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type workspaceIdUser_idCompoundUniqueInput = {
    id: string
    user_id: string
  }

  export type workspaceCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    url?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    name?: SortOrder
    is_self_workspace?: SortOrder
  }

  export type workspaceMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    url?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    name?: SortOrder
    is_self_workspace?: SortOrder
  }

  export type workspaceMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    url?: SortOrder
    color?: SortOrder
    created_at?: SortOrder
    name?: SortOrder
    is_self_workspace?: SortOrder
  }

  export type UserScalarRelationFilter = {
    is?: userWhereInput
    isNot?: userWhereInput
  }

  export type FileScalarRelationFilter = {
    is?: fileWhereInput
    isNot?: fileWhereInput
  }

  export type approvalIdApprover_user_idCompoundUniqueInput = {
    id: string
    approver_user_id: string
  }

  export type approvalCountOrderByAggregateInput = {
    id?: SortOrder
    file_id_ref?: SortOrder
    file_workspace_id_ref?: SortOrder
    file_user_id_ref?: SortOrder
    approver_user_id?: SortOrder
    assigned_by_user_id?: SortOrder
    status?: SortOrder
    remarks?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    actioned_at?: SortOrder
  }

  export type approvalMaxOrderByAggregateInput = {
    id?: SortOrder
    file_id_ref?: SortOrder
    file_workspace_id_ref?: SortOrder
    file_user_id_ref?: SortOrder
    approver_user_id?: SortOrder
    assigned_by_user_id?: SortOrder
    status?: SortOrder
    remarks?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    actioned_at?: SortOrder
  }

  export type approvalMinOrderByAggregateInput = {
    id?: SortOrder
    file_id_ref?: SortOrder
    file_workspace_id_ref?: SortOrder
    file_user_id_ref?: SortOrder
    approver_user_id?: SortOrder
    assigned_by_user_id?: SortOrder
    status?: SortOrder
    remarks?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    actioned_at?: SortOrder
  }

  export type notificationCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    message?: SortOrder
    type?: SortOrder
    link?: SortOrder
    is_read?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    related_approval_process_cuid?: SortOrder
  }

  export type notificationMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    message?: SortOrder
    type?: SortOrder
    link?: SortOrder
    is_read?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    related_approval_process_cuid?: SortOrder
  }

  export type notificationMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    message?: SortOrder
    type?: SortOrder
    link?: SortOrder
    is_read?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    related_approval_process_cuid?: SortOrder
  }

  export type fileCreatelabelsInput = {
    set: string[]
  }

  export type approvalCreateNestedManyWithoutFileInput = {
    create?: XOR<approvalCreateWithoutFileInput, approvalUncheckedCreateWithoutFileInput> | approvalCreateWithoutFileInput[] | approvalUncheckedCreateWithoutFileInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutFileInput | approvalCreateOrConnectWithoutFileInput[]
    createMany?: approvalCreateManyFileInputEnvelope
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
  }

  export type workspaceCreateNestedOneWithoutFileInput = {
    create?: XOR<workspaceCreateWithoutFileInput, workspaceUncheckedCreateWithoutFileInput>
    connectOrCreate?: workspaceCreateOrConnectWithoutFileInput
    connect?: workspaceWhereUniqueInput
  }

  export type approvalUncheckedCreateNestedManyWithoutFileInput = {
    create?: XOR<approvalCreateWithoutFileInput, approvalUncheckedCreateWithoutFileInput> | approvalCreateWithoutFileInput[] | approvalUncheckedCreateWithoutFileInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutFileInput | approvalCreateOrConnectWithoutFileInput[]
    createMany?: approvalCreateManyFileInputEnvelope
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type fileUpdatelabelsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type approvalUpdateManyWithoutFileNestedInput = {
    create?: XOR<approvalCreateWithoutFileInput, approvalUncheckedCreateWithoutFileInput> | approvalCreateWithoutFileInput[] | approvalUncheckedCreateWithoutFileInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutFileInput | approvalCreateOrConnectWithoutFileInput[]
    upsert?: approvalUpsertWithWhereUniqueWithoutFileInput | approvalUpsertWithWhereUniqueWithoutFileInput[]
    createMany?: approvalCreateManyFileInputEnvelope
    set?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    disconnect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    delete?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    update?: approvalUpdateWithWhereUniqueWithoutFileInput | approvalUpdateWithWhereUniqueWithoutFileInput[]
    updateMany?: approvalUpdateManyWithWhereWithoutFileInput | approvalUpdateManyWithWhereWithoutFileInput[]
    deleteMany?: approvalScalarWhereInput | approvalScalarWhereInput[]
  }

  export type workspaceUpdateOneRequiredWithoutFileNestedInput = {
    create?: XOR<workspaceCreateWithoutFileInput, workspaceUncheckedCreateWithoutFileInput>
    connectOrCreate?: workspaceCreateOrConnectWithoutFileInput
    upsert?: workspaceUpsertWithoutFileInput
    connect?: workspaceWhereUniqueInput
    update?: XOR<XOR<workspaceUpdateToOneWithWhereWithoutFileInput, workspaceUpdateWithoutFileInput>, workspaceUncheckedUpdateWithoutFileInput>
  }

  export type approvalUncheckedUpdateManyWithoutFileNestedInput = {
    create?: XOR<approvalCreateWithoutFileInput, approvalUncheckedCreateWithoutFileInput> | approvalCreateWithoutFileInput[] | approvalUncheckedCreateWithoutFileInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutFileInput | approvalCreateOrConnectWithoutFileInput[]
    upsert?: approvalUpsertWithWhereUniqueWithoutFileInput | approvalUpsertWithWhereUniqueWithoutFileInput[]
    createMany?: approvalCreateManyFileInputEnvelope
    set?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    disconnect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    delete?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    update?: approvalUpdateWithWhereUniqueWithoutFileInput | approvalUpdateWithWhereUniqueWithoutFileInput[]
    updateMany?: approvalUpdateManyWithWhereWithoutFileInput | approvalUpdateManyWithWhereWithoutFileInput[]
    deleteMany?: approvalScalarWhereInput | approvalScalarWhereInput[]
  }

  export type folderCreatelabelsInput = {
    set: string[]
  }

  export type workspaceCreateNestedOneWithoutFolderInput = {
    create?: XOR<workspaceCreateWithoutFolderInput, workspaceUncheckedCreateWithoutFolderInput>
    connectOrCreate?: workspaceCreateOrConnectWithoutFolderInput
    connect?: workspaceWhereUniqueInput
  }

  export type folderUpdatelabelsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type workspaceUpdateOneRequiredWithoutFolderNestedInput = {
    create?: XOR<workspaceCreateWithoutFolderInput, workspaceUncheckedCreateWithoutFolderInput>
    connectOrCreate?: workspaceCreateOrConnectWithoutFolderInput
    upsert?: workspaceUpsertWithoutFolderInput
    connect?: workspaceWhereUniqueInput
    update?: XOR<XOR<workspaceUpdateToOneWithWhereWithoutFolderInput, workspaceUpdateWithoutFolderInput>, workspaceUncheckedUpdateWithoutFolderInput>
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type approvalCreateNestedManyWithoutApproverInput = {
    create?: XOR<approvalCreateWithoutApproverInput, approvalUncheckedCreateWithoutApproverInput> | approvalCreateWithoutApproverInput[] | approvalUncheckedCreateWithoutApproverInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutApproverInput | approvalCreateOrConnectWithoutApproverInput[]
    createMany?: approvalCreateManyApproverInputEnvelope
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
  }

  export type approvalCreateNestedManyWithoutAssignerInput = {
    create?: XOR<approvalCreateWithoutAssignerInput, approvalUncheckedCreateWithoutAssignerInput> | approvalCreateWithoutAssignerInput[] | approvalUncheckedCreateWithoutAssignerInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutAssignerInput | approvalCreateOrConnectWithoutAssignerInput[]
    createMany?: approvalCreateManyAssignerInputEnvelope
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
  }

  export type notificationCreateNestedManyWithoutUserInput = {
    create?: XOR<notificationCreateWithoutUserInput, notificationUncheckedCreateWithoutUserInput> | notificationCreateWithoutUserInput[] | notificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: notificationCreateOrConnectWithoutUserInput | notificationCreateOrConnectWithoutUserInput[]
    createMany?: notificationCreateManyUserInputEnvelope
    connect?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
  }

  export type approvalUncheckedCreateNestedManyWithoutApproverInput = {
    create?: XOR<approvalCreateWithoutApproverInput, approvalUncheckedCreateWithoutApproverInput> | approvalCreateWithoutApproverInput[] | approvalUncheckedCreateWithoutApproverInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutApproverInput | approvalCreateOrConnectWithoutApproverInput[]
    createMany?: approvalCreateManyApproverInputEnvelope
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
  }

  export type approvalUncheckedCreateNestedManyWithoutAssignerInput = {
    create?: XOR<approvalCreateWithoutAssignerInput, approvalUncheckedCreateWithoutAssignerInput> | approvalCreateWithoutAssignerInput[] | approvalUncheckedCreateWithoutAssignerInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutAssignerInput | approvalCreateOrConnectWithoutAssignerInput[]
    createMany?: approvalCreateManyAssignerInputEnvelope
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
  }

  export type notificationUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<notificationCreateWithoutUserInput, notificationUncheckedCreateWithoutUserInput> | notificationCreateWithoutUserInput[] | notificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: notificationCreateOrConnectWithoutUserInput | notificationCreateOrConnectWithoutUserInput[]
    createMany?: notificationCreateManyUserInputEnvelope
    connect?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
  }

  export type approvalUpdateManyWithoutApproverNestedInput = {
    create?: XOR<approvalCreateWithoutApproverInput, approvalUncheckedCreateWithoutApproverInput> | approvalCreateWithoutApproverInput[] | approvalUncheckedCreateWithoutApproverInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutApproverInput | approvalCreateOrConnectWithoutApproverInput[]
    upsert?: approvalUpsertWithWhereUniqueWithoutApproverInput | approvalUpsertWithWhereUniqueWithoutApproverInput[]
    createMany?: approvalCreateManyApproverInputEnvelope
    set?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    disconnect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    delete?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    update?: approvalUpdateWithWhereUniqueWithoutApproverInput | approvalUpdateWithWhereUniqueWithoutApproverInput[]
    updateMany?: approvalUpdateManyWithWhereWithoutApproverInput | approvalUpdateManyWithWhereWithoutApproverInput[]
    deleteMany?: approvalScalarWhereInput | approvalScalarWhereInput[]
  }

  export type approvalUpdateManyWithoutAssignerNestedInput = {
    create?: XOR<approvalCreateWithoutAssignerInput, approvalUncheckedCreateWithoutAssignerInput> | approvalCreateWithoutAssignerInput[] | approvalUncheckedCreateWithoutAssignerInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutAssignerInput | approvalCreateOrConnectWithoutAssignerInput[]
    upsert?: approvalUpsertWithWhereUniqueWithoutAssignerInput | approvalUpsertWithWhereUniqueWithoutAssignerInput[]
    createMany?: approvalCreateManyAssignerInputEnvelope
    set?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    disconnect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    delete?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    update?: approvalUpdateWithWhereUniqueWithoutAssignerInput | approvalUpdateWithWhereUniqueWithoutAssignerInput[]
    updateMany?: approvalUpdateManyWithWhereWithoutAssignerInput | approvalUpdateManyWithWhereWithoutAssignerInput[]
    deleteMany?: approvalScalarWhereInput | approvalScalarWhereInput[]
  }

  export type notificationUpdateManyWithoutUserNestedInput = {
    create?: XOR<notificationCreateWithoutUserInput, notificationUncheckedCreateWithoutUserInput> | notificationCreateWithoutUserInput[] | notificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: notificationCreateOrConnectWithoutUserInput | notificationCreateOrConnectWithoutUserInput[]
    upsert?: notificationUpsertWithWhereUniqueWithoutUserInput | notificationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: notificationCreateManyUserInputEnvelope
    set?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    disconnect?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    delete?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    connect?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    update?: notificationUpdateWithWhereUniqueWithoutUserInput | notificationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: notificationUpdateManyWithWhereWithoutUserInput | notificationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: notificationScalarWhereInput | notificationScalarWhereInput[]
  }

  export type approvalUncheckedUpdateManyWithoutApproverNestedInput = {
    create?: XOR<approvalCreateWithoutApproverInput, approvalUncheckedCreateWithoutApproverInput> | approvalCreateWithoutApproverInput[] | approvalUncheckedCreateWithoutApproverInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutApproverInput | approvalCreateOrConnectWithoutApproverInput[]
    upsert?: approvalUpsertWithWhereUniqueWithoutApproverInput | approvalUpsertWithWhereUniqueWithoutApproverInput[]
    createMany?: approvalCreateManyApproverInputEnvelope
    set?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    disconnect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    delete?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    update?: approvalUpdateWithWhereUniqueWithoutApproverInput | approvalUpdateWithWhereUniqueWithoutApproverInput[]
    updateMany?: approvalUpdateManyWithWhereWithoutApproverInput | approvalUpdateManyWithWhereWithoutApproverInput[]
    deleteMany?: approvalScalarWhereInput | approvalScalarWhereInput[]
  }

  export type approvalUncheckedUpdateManyWithoutAssignerNestedInput = {
    create?: XOR<approvalCreateWithoutAssignerInput, approvalUncheckedCreateWithoutAssignerInput> | approvalCreateWithoutAssignerInput[] | approvalUncheckedCreateWithoutAssignerInput[]
    connectOrCreate?: approvalCreateOrConnectWithoutAssignerInput | approvalCreateOrConnectWithoutAssignerInput[]
    upsert?: approvalUpsertWithWhereUniqueWithoutAssignerInput | approvalUpsertWithWhereUniqueWithoutAssignerInput[]
    createMany?: approvalCreateManyAssignerInputEnvelope
    set?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    disconnect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    delete?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    connect?: approvalWhereUniqueInput | approvalWhereUniqueInput[]
    update?: approvalUpdateWithWhereUniqueWithoutAssignerInput | approvalUpdateWithWhereUniqueWithoutAssignerInput[]
    updateMany?: approvalUpdateManyWithWhereWithoutAssignerInput | approvalUpdateManyWithWhereWithoutAssignerInput[]
    deleteMany?: approvalScalarWhereInput | approvalScalarWhereInput[]
  }

  export type notificationUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<notificationCreateWithoutUserInput, notificationUncheckedCreateWithoutUserInput> | notificationCreateWithoutUserInput[] | notificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: notificationCreateOrConnectWithoutUserInput | notificationCreateOrConnectWithoutUserInput[]
    upsert?: notificationUpsertWithWhereUniqueWithoutUserInput | notificationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: notificationCreateManyUserInputEnvelope
    set?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    disconnect?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    delete?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    connect?: notificationWhereUniqueInput | notificationWhereUniqueInput[]
    update?: notificationUpdateWithWhereUniqueWithoutUserInput | notificationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: notificationUpdateManyWithWhereWithoutUserInput | notificationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: notificationScalarWhereInput | notificationScalarWhereInput[]
  }

  export type fileCreateNestedManyWithoutWorkspaceInput = {
    create?: XOR<fileCreateWithoutWorkspaceInput, fileUncheckedCreateWithoutWorkspaceInput> | fileCreateWithoutWorkspaceInput[] | fileUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: fileCreateOrConnectWithoutWorkspaceInput | fileCreateOrConnectWithoutWorkspaceInput[]
    createMany?: fileCreateManyWorkspaceInputEnvelope
    connect?: fileWhereUniqueInput | fileWhereUniqueInput[]
  }

  export type folderCreateNestedManyWithoutWorkspaceInput = {
    create?: XOR<folderCreateWithoutWorkspaceInput, folderUncheckedCreateWithoutWorkspaceInput> | folderCreateWithoutWorkspaceInput[] | folderUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: folderCreateOrConnectWithoutWorkspaceInput | folderCreateOrConnectWithoutWorkspaceInput[]
    createMany?: folderCreateManyWorkspaceInputEnvelope
    connect?: folderWhereUniqueInput | folderWhereUniqueInput[]
  }

  export type fileUncheckedCreateNestedManyWithoutWorkspaceInput = {
    create?: XOR<fileCreateWithoutWorkspaceInput, fileUncheckedCreateWithoutWorkspaceInput> | fileCreateWithoutWorkspaceInput[] | fileUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: fileCreateOrConnectWithoutWorkspaceInput | fileCreateOrConnectWithoutWorkspaceInput[]
    createMany?: fileCreateManyWorkspaceInputEnvelope
    connect?: fileWhereUniqueInput | fileWhereUniqueInput[]
  }

  export type folderUncheckedCreateNestedManyWithoutWorkspaceInput = {
    create?: XOR<folderCreateWithoutWorkspaceInput, folderUncheckedCreateWithoutWorkspaceInput> | folderCreateWithoutWorkspaceInput[] | folderUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: folderCreateOrConnectWithoutWorkspaceInput | folderCreateOrConnectWithoutWorkspaceInput[]
    createMany?: folderCreateManyWorkspaceInputEnvelope
    connect?: folderWhereUniqueInput | folderWhereUniqueInput[]
  }

  export type fileUpdateManyWithoutWorkspaceNestedInput = {
    create?: XOR<fileCreateWithoutWorkspaceInput, fileUncheckedCreateWithoutWorkspaceInput> | fileCreateWithoutWorkspaceInput[] | fileUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: fileCreateOrConnectWithoutWorkspaceInput | fileCreateOrConnectWithoutWorkspaceInput[]
    upsert?: fileUpsertWithWhereUniqueWithoutWorkspaceInput | fileUpsertWithWhereUniqueWithoutWorkspaceInput[]
    createMany?: fileCreateManyWorkspaceInputEnvelope
    set?: fileWhereUniqueInput | fileWhereUniqueInput[]
    disconnect?: fileWhereUniqueInput | fileWhereUniqueInput[]
    delete?: fileWhereUniqueInput | fileWhereUniqueInput[]
    connect?: fileWhereUniqueInput | fileWhereUniqueInput[]
    update?: fileUpdateWithWhereUniqueWithoutWorkspaceInput | fileUpdateWithWhereUniqueWithoutWorkspaceInput[]
    updateMany?: fileUpdateManyWithWhereWithoutWorkspaceInput | fileUpdateManyWithWhereWithoutWorkspaceInput[]
    deleteMany?: fileScalarWhereInput | fileScalarWhereInput[]
  }

  export type folderUpdateManyWithoutWorkspaceNestedInput = {
    create?: XOR<folderCreateWithoutWorkspaceInput, folderUncheckedCreateWithoutWorkspaceInput> | folderCreateWithoutWorkspaceInput[] | folderUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: folderCreateOrConnectWithoutWorkspaceInput | folderCreateOrConnectWithoutWorkspaceInput[]
    upsert?: folderUpsertWithWhereUniqueWithoutWorkspaceInput | folderUpsertWithWhereUniqueWithoutWorkspaceInput[]
    createMany?: folderCreateManyWorkspaceInputEnvelope
    set?: folderWhereUniqueInput | folderWhereUniqueInput[]
    disconnect?: folderWhereUniqueInput | folderWhereUniqueInput[]
    delete?: folderWhereUniqueInput | folderWhereUniqueInput[]
    connect?: folderWhereUniqueInput | folderWhereUniqueInput[]
    update?: folderUpdateWithWhereUniqueWithoutWorkspaceInput | folderUpdateWithWhereUniqueWithoutWorkspaceInput[]
    updateMany?: folderUpdateManyWithWhereWithoutWorkspaceInput | folderUpdateManyWithWhereWithoutWorkspaceInput[]
    deleteMany?: folderScalarWhereInput | folderScalarWhereInput[]
  }

  export type fileUncheckedUpdateManyWithoutWorkspaceNestedInput = {
    create?: XOR<fileCreateWithoutWorkspaceInput, fileUncheckedCreateWithoutWorkspaceInput> | fileCreateWithoutWorkspaceInput[] | fileUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: fileCreateOrConnectWithoutWorkspaceInput | fileCreateOrConnectWithoutWorkspaceInput[]
    upsert?: fileUpsertWithWhereUniqueWithoutWorkspaceInput | fileUpsertWithWhereUniqueWithoutWorkspaceInput[]
    createMany?: fileCreateManyWorkspaceInputEnvelope
    set?: fileWhereUniqueInput | fileWhereUniqueInput[]
    disconnect?: fileWhereUniqueInput | fileWhereUniqueInput[]
    delete?: fileWhereUniqueInput | fileWhereUniqueInput[]
    connect?: fileWhereUniqueInput | fileWhereUniqueInput[]
    update?: fileUpdateWithWhereUniqueWithoutWorkspaceInput | fileUpdateWithWhereUniqueWithoutWorkspaceInput[]
    updateMany?: fileUpdateManyWithWhereWithoutWorkspaceInput | fileUpdateManyWithWhereWithoutWorkspaceInput[]
    deleteMany?: fileScalarWhereInput | fileScalarWhereInput[]
  }

  export type folderUncheckedUpdateManyWithoutWorkspaceNestedInput = {
    create?: XOR<folderCreateWithoutWorkspaceInput, folderUncheckedCreateWithoutWorkspaceInput> | folderCreateWithoutWorkspaceInput[] | folderUncheckedCreateWithoutWorkspaceInput[]
    connectOrCreate?: folderCreateOrConnectWithoutWorkspaceInput | folderCreateOrConnectWithoutWorkspaceInput[]
    upsert?: folderUpsertWithWhereUniqueWithoutWorkspaceInput | folderUpsertWithWhereUniqueWithoutWorkspaceInput[]
    createMany?: folderCreateManyWorkspaceInputEnvelope
    set?: folderWhereUniqueInput | folderWhereUniqueInput[]
    disconnect?: folderWhereUniqueInput | folderWhereUniqueInput[]
    delete?: folderWhereUniqueInput | folderWhereUniqueInput[]
    connect?: folderWhereUniqueInput | folderWhereUniqueInput[]
    update?: folderUpdateWithWhereUniqueWithoutWorkspaceInput | folderUpdateWithWhereUniqueWithoutWorkspaceInput[]
    updateMany?: folderUpdateManyWithWhereWithoutWorkspaceInput | folderUpdateManyWithWhereWithoutWorkspaceInput[]
    deleteMany?: folderScalarWhereInput | folderScalarWhereInput[]
  }

  export type userCreateNestedOneWithoutApprovals_to_actionInput = {
    create?: XOR<userCreateWithoutApprovals_to_actionInput, userUncheckedCreateWithoutApprovals_to_actionInput>
    connectOrCreate?: userCreateOrConnectWithoutApprovals_to_actionInput
    connect?: userWhereUniqueInput
  }

  export type userCreateNestedOneWithoutApprovals_assignedInput = {
    create?: XOR<userCreateWithoutApprovals_assignedInput, userUncheckedCreateWithoutApprovals_assignedInput>
    connectOrCreate?: userCreateOrConnectWithoutApprovals_assignedInput
    connect?: userWhereUniqueInput
  }

  export type fileCreateNestedOneWithoutApprovalsInput = {
    create?: XOR<fileCreateWithoutApprovalsInput, fileUncheckedCreateWithoutApprovalsInput>
    connectOrCreate?: fileCreateOrConnectWithoutApprovalsInput
    connect?: fileWhereUniqueInput
  }

  export type userUpdateOneRequiredWithoutApprovals_to_actionNestedInput = {
    create?: XOR<userCreateWithoutApprovals_to_actionInput, userUncheckedCreateWithoutApprovals_to_actionInput>
    connectOrCreate?: userCreateOrConnectWithoutApprovals_to_actionInput
    upsert?: userUpsertWithoutApprovals_to_actionInput
    connect?: userWhereUniqueInput
    update?: XOR<XOR<userUpdateToOneWithWhereWithoutApprovals_to_actionInput, userUpdateWithoutApprovals_to_actionInput>, userUncheckedUpdateWithoutApprovals_to_actionInput>
  }

  export type userUpdateOneRequiredWithoutApprovals_assignedNestedInput = {
    create?: XOR<userCreateWithoutApprovals_assignedInput, userUncheckedCreateWithoutApprovals_assignedInput>
    connectOrCreate?: userCreateOrConnectWithoutApprovals_assignedInput
    upsert?: userUpsertWithoutApprovals_assignedInput
    connect?: userWhereUniqueInput
    update?: XOR<XOR<userUpdateToOneWithWhereWithoutApprovals_assignedInput, userUpdateWithoutApprovals_assignedInput>, userUncheckedUpdateWithoutApprovals_assignedInput>
  }

  export type fileUpdateOneRequiredWithoutApprovalsNestedInput = {
    create?: XOR<fileCreateWithoutApprovalsInput, fileUncheckedCreateWithoutApprovalsInput>
    connectOrCreate?: fileCreateOrConnectWithoutApprovalsInput
    upsert?: fileUpsertWithoutApprovalsInput
    connect?: fileWhereUniqueInput
    update?: XOR<XOR<fileUpdateToOneWithWhereWithoutApprovalsInput, fileUpdateWithoutApprovalsInput>, fileUncheckedUpdateWithoutApprovalsInput>
  }

  export type userCreateNestedOneWithoutNotificationsInput = {
    create?: XOR<userCreateWithoutNotificationsInput, userUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: userCreateOrConnectWithoutNotificationsInput
    connect?: userWhereUniqueInput
  }

  export type userUpdateOneRequiredWithoutNotificationsNestedInput = {
    create?: XOR<userCreateWithoutNotificationsInput, userUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: userCreateOrConnectWithoutNotificationsInput
    upsert?: userUpsertWithoutNotificationsInput
    connect?: userWhereUniqueInput
    update?: XOR<XOR<userUpdateToOneWithWhereWithoutNotificationsInput, userUpdateWithoutNotificationsInput>, userUncheckedUpdateWithoutNotificationsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type approvalCreateWithoutFileInput = {
    id?: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
    approver: userCreateNestedOneWithoutApprovals_to_actionInput
    assigner: userCreateNestedOneWithoutApprovals_assignedInput
  }

  export type approvalUncheckedCreateWithoutFileInput = {
    id?: string
    approver_user_id: string
    assigned_by_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalCreateOrConnectWithoutFileInput = {
    where: approvalWhereUniqueInput
    create: XOR<approvalCreateWithoutFileInput, approvalUncheckedCreateWithoutFileInput>
  }

  export type approvalCreateManyFileInputEnvelope = {
    data: approvalCreateManyFileInput | approvalCreateManyFileInput[]
    skipDuplicates?: boolean
  }

  export type workspaceCreateWithoutFileInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
    folder?: folderCreateNestedManyWithoutWorkspaceInput
  }

  export type workspaceUncheckedCreateWithoutFileInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
    folder?: folderUncheckedCreateNestedManyWithoutWorkspaceInput
  }

  export type workspaceCreateOrConnectWithoutFileInput = {
    where: workspaceWhereUniqueInput
    create: XOR<workspaceCreateWithoutFileInput, workspaceUncheckedCreateWithoutFileInput>
  }

  export type approvalUpsertWithWhereUniqueWithoutFileInput = {
    where: approvalWhereUniqueInput
    update: XOR<approvalUpdateWithoutFileInput, approvalUncheckedUpdateWithoutFileInput>
    create: XOR<approvalCreateWithoutFileInput, approvalUncheckedCreateWithoutFileInput>
  }

  export type approvalUpdateWithWhereUniqueWithoutFileInput = {
    where: approvalWhereUniqueInput
    data: XOR<approvalUpdateWithoutFileInput, approvalUncheckedUpdateWithoutFileInput>
  }

  export type approvalUpdateManyWithWhereWithoutFileInput = {
    where: approvalScalarWhereInput
    data: XOR<approvalUpdateManyMutationInput, approvalUncheckedUpdateManyWithoutFileInput>
  }

  export type approvalScalarWhereInput = {
    AND?: approvalScalarWhereInput | approvalScalarWhereInput[]
    OR?: approvalScalarWhereInput[]
    NOT?: approvalScalarWhereInput | approvalScalarWhereInput[]
    id?: StringFilter<"approval"> | string
    file_id_ref?: StringFilter<"approval"> | string
    file_workspace_id_ref?: StringFilter<"approval"> | string
    file_user_id_ref?: StringFilter<"approval"> | string
    approver_user_id?: StringFilter<"approval"> | string
    assigned_by_user_id?: StringFilter<"approval"> | string
    status?: StringFilter<"approval"> | string
    remarks?: StringNullableFilter<"approval"> | string | null
    created_at?: DateTimeFilter<"approval"> | Date | string
    updated_at?: DateTimeFilter<"approval"> | Date | string
    actioned_at?: DateTimeNullableFilter<"approval"> | Date | string | null
  }

  export type workspaceUpsertWithoutFileInput = {
    update: XOR<workspaceUpdateWithoutFileInput, workspaceUncheckedUpdateWithoutFileInput>
    create: XOR<workspaceCreateWithoutFileInput, workspaceUncheckedCreateWithoutFileInput>
    where?: workspaceWhereInput
  }

  export type workspaceUpdateToOneWithWhereWithoutFileInput = {
    where?: workspaceWhereInput
    data: XOR<workspaceUpdateWithoutFileInput, workspaceUncheckedUpdateWithoutFileInput>
  }

  export type workspaceUpdateWithoutFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
    folder?: folderUpdateManyWithoutWorkspaceNestedInput
  }

  export type workspaceUncheckedUpdateWithoutFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
    folder?: folderUncheckedUpdateManyWithoutWorkspaceNestedInput
  }

  export type workspaceCreateWithoutFolderInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
    file?: fileCreateNestedManyWithoutWorkspaceInput
  }

  export type workspaceUncheckedCreateWithoutFolderInput = {
    id: string
    user_id: string
    url: string
    color?: string | null
    created_at?: Date | string
    name?: string | null
    is_self_workspace?: boolean | null
    file?: fileUncheckedCreateNestedManyWithoutWorkspaceInput
  }

  export type workspaceCreateOrConnectWithoutFolderInput = {
    where: workspaceWhereUniqueInput
    create: XOR<workspaceCreateWithoutFolderInput, workspaceUncheckedCreateWithoutFolderInput>
  }

  export type workspaceUpsertWithoutFolderInput = {
    update: XOR<workspaceUpdateWithoutFolderInput, workspaceUncheckedUpdateWithoutFolderInput>
    create: XOR<workspaceCreateWithoutFolderInput, workspaceUncheckedCreateWithoutFolderInput>
    where?: workspaceWhereInput
  }

  export type workspaceUpdateToOneWithWhereWithoutFolderInput = {
    where?: workspaceWhereInput
    data: XOR<workspaceUpdateWithoutFolderInput, workspaceUncheckedUpdateWithoutFolderInput>
  }

  export type workspaceUpdateWithoutFolderInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
    file?: fileUpdateManyWithoutWorkspaceNestedInput
  }

  export type workspaceUncheckedUpdateWithoutFolderInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    color?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    is_self_workspace?: NullableBoolFieldUpdateOperationsInput | boolean | null
    file?: fileUncheckedUpdateManyWithoutWorkspaceNestedInput
  }

  export type approvalCreateWithoutApproverInput = {
    id?: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
    assigner: userCreateNestedOneWithoutApprovals_assignedInput
    file: fileCreateNestedOneWithoutApprovalsInput
  }

  export type approvalUncheckedCreateWithoutApproverInput = {
    id?: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    assigned_by_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalCreateOrConnectWithoutApproverInput = {
    where: approvalWhereUniqueInput
    create: XOR<approvalCreateWithoutApproverInput, approvalUncheckedCreateWithoutApproverInput>
  }

  export type approvalCreateManyApproverInputEnvelope = {
    data: approvalCreateManyApproverInput | approvalCreateManyApproverInput[]
    skipDuplicates?: boolean
  }

  export type approvalCreateWithoutAssignerInput = {
    id?: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
    approver: userCreateNestedOneWithoutApprovals_to_actionInput
    file: fileCreateNestedOneWithoutApprovalsInput
  }

  export type approvalUncheckedCreateWithoutAssignerInput = {
    id?: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    approver_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalCreateOrConnectWithoutAssignerInput = {
    where: approvalWhereUniqueInput
    create: XOR<approvalCreateWithoutAssignerInput, approvalUncheckedCreateWithoutAssignerInput>
  }

  export type approvalCreateManyAssignerInputEnvelope = {
    data: approvalCreateManyAssignerInput | approvalCreateManyAssignerInput[]
    skipDuplicates?: boolean
  }

  export type notificationCreateWithoutUserInput = {
    id?: string
    message: string
    type?: string | null
    link?: string | null
    is_read?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    related_approval_process_cuid?: string | null
  }

  export type notificationUncheckedCreateWithoutUserInput = {
    id?: string
    message: string
    type?: string | null
    link?: string | null
    is_read?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    related_approval_process_cuid?: string | null
  }

  export type notificationCreateOrConnectWithoutUserInput = {
    where: notificationWhereUniqueInput
    create: XOR<notificationCreateWithoutUserInput, notificationUncheckedCreateWithoutUserInput>
  }

  export type notificationCreateManyUserInputEnvelope = {
    data: notificationCreateManyUserInput | notificationCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type approvalUpsertWithWhereUniqueWithoutApproverInput = {
    where: approvalWhereUniqueInput
    update: XOR<approvalUpdateWithoutApproverInput, approvalUncheckedUpdateWithoutApproverInput>
    create: XOR<approvalCreateWithoutApproverInput, approvalUncheckedCreateWithoutApproverInput>
  }

  export type approvalUpdateWithWhereUniqueWithoutApproverInput = {
    where: approvalWhereUniqueInput
    data: XOR<approvalUpdateWithoutApproverInput, approvalUncheckedUpdateWithoutApproverInput>
  }

  export type approvalUpdateManyWithWhereWithoutApproverInput = {
    where: approvalScalarWhereInput
    data: XOR<approvalUpdateManyMutationInput, approvalUncheckedUpdateManyWithoutApproverInput>
  }

  export type approvalUpsertWithWhereUniqueWithoutAssignerInput = {
    where: approvalWhereUniqueInput
    update: XOR<approvalUpdateWithoutAssignerInput, approvalUncheckedUpdateWithoutAssignerInput>
    create: XOR<approvalCreateWithoutAssignerInput, approvalUncheckedCreateWithoutAssignerInput>
  }

  export type approvalUpdateWithWhereUniqueWithoutAssignerInput = {
    where: approvalWhereUniqueInput
    data: XOR<approvalUpdateWithoutAssignerInput, approvalUncheckedUpdateWithoutAssignerInput>
  }

  export type approvalUpdateManyWithWhereWithoutAssignerInput = {
    where: approvalScalarWhereInput
    data: XOR<approvalUpdateManyMutationInput, approvalUncheckedUpdateManyWithoutAssignerInput>
  }

  export type notificationUpsertWithWhereUniqueWithoutUserInput = {
    where: notificationWhereUniqueInput
    update: XOR<notificationUpdateWithoutUserInput, notificationUncheckedUpdateWithoutUserInput>
    create: XOR<notificationCreateWithoutUserInput, notificationUncheckedCreateWithoutUserInput>
  }

  export type notificationUpdateWithWhereUniqueWithoutUserInput = {
    where: notificationWhereUniqueInput
    data: XOR<notificationUpdateWithoutUserInput, notificationUncheckedUpdateWithoutUserInput>
  }

  export type notificationUpdateManyWithWhereWithoutUserInput = {
    where: notificationScalarWhereInput
    data: XOR<notificationUpdateManyMutationInput, notificationUncheckedUpdateManyWithoutUserInput>
  }

  export type notificationScalarWhereInput = {
    AND?: notificationScalarWhereInput | notificationScalarWhereInput[]
    OR?: notificationScalarWhereInput[]
    NOT?: notificationScalarWhereInput | notificationScalarWhereInput[]
    id?: StringFilter<"notification"> | string
    user_id?: StringFilter<"notification"> | string
    message?: StringFilter<"notification"> | string
    type?: StringNullableFilter<"notification"> | string | null
    link?: StringNullableFilter<"notification"> | string | null
    is_read?: BoolFilter<"notification"> | boolean
    created_at?: DateTimeFilter<"notification"> | Date | string
    updated_at?: DateTimeFilter<"notification"> | Date | string
    related_approval_process_cuid?: StringNullableFilter<"notification"> | string | null
  }

  export type fileCreateWithoutWorkspaceInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
    approvals?: approvalCreateNestedManyWithoutFileInput
  }

  export type fileUncheckedCreateWithoutWorkspaceInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
    approvals?: approvalUncheckedCreateNestedManyWithoutFileInput
  }

  export type fileCreateOrConnectWithoutWorkspaceInput = {
    where: fileWhereUniqueInput
    create: XOR<fileCreateWithoutWorkspaceInput, fileUncheckedCreateWithoutWorkspaceInput>
  }

  export type fileCreateManyWorkspaceInputEnvelope = {
    data: fileCreateManyWorkspaceInput | fileCreateManyWorkspaceInput[]
    skipDuplicates?: boolean
  }

  export type folderCreateWithoutWorkspaceInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: folderCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    is_self_folder?: boolean | null
  }

  export type folderUncheckedCreateWithoutWorkspaceInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: folderCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    is_self_folder?: boolean | null
  }

  export type folderCreateOrConnectWithoutWorkspaceInput = {
    where: folderWhereUniqueInput
    create: XOR<folderCreateWithoutWorkspaceInput, folderUncheckedCreateWithoutWorkspaceInput>
  }

  export type folderCreateManyWorkspaceInputEnvelope = {
    data: folderCreateManyWorkspaceInput | folderCreateManyWorkspaceInput[]
    skipDuplicates?: boolean
  }

  export type fileUpsertWithWhereUniqueWithoutWorkspaceInput = {
    where: fileWhereUniqueInput
    update: XOR<fileUpdateWithoutWorkspaceInput, fileUncheckedUpdateWithoutWorkspaceInput>
    create: XOR<fileCreateWithoutWorkspaceInput, fileUncheckedCreateWithoutWorkspaceInput>
  }

  export type fileUpdateWithWhereUniqueWithoutWorkspaceInput = {
    where: fileWhereUniqueInput
    data: XOR<fileUpdateWithoutWorkspaceInput, fileUncheckedUpdateWithoutWorkspaceInput>
  }

  export type fileUpdateManyWithWhereWithoutWorkspaceInput = {
    where: fileScalarWhereInput
    data: XOR<fileUpdateManyMutationInput, fileUncheckedUpdateManyWithoutWorkspaceInput>
  }

  export type fileScalarWhereInput = {
    AND?: fileScalarWhereInput | fileScalarWhereInput[]
    OR?: fileScalarWhereInput[]
    NOT?: fileScalarWhereInput | fileScalarWhereInput[]
    id?: StringFilter<"file"> | string
    workspace_id?: StringFilter<"file"> | string
    user_id?: StringFilter<"file"> | string
    description?: StringNullableFilter<"file"> | string | null
    color?: StringNullableFilter<"file"> | string | null
    labels?: StringNullableListFilter<"file">
    created_at?: DateTimeFilter<"file"> | Date | string
    updated_at?: DateTimeFilter<"file"> | Date | string
    pengesahan_pada?: DateTimeNullableFilter<"file"> | Date | string | null
    is_self_file?: BoolNullableFilter<"file"> | boolean | null
  }

  export type folderUpsertWithWhereUniqueWithoutWorkspaceInput = {
    where: folderWhereUniqueInput
    update: XOR<folderUpdateWithoutWorkspaceInput, folderUncheckedUpdateWithoutWorkspaceInput>
    create: XOR<folderCreateWithoutWorkspaceInput, folderUncheckedCreateWithoutWorkspaceInput>
  }

  export type folderUpdateWithWhereUniqueWithoutWorkspaceInput = {
    where: folderWhereUniqueInput
    data: XOR<folderUpdateWithoutWorkspaceInput, folderUncheckedUpdateWithoutWorkspaceInput>
  }

  export type folderUpdateManyWithWhereWithoutWorkspaceInput = {
    where: folderScalarWhereInput
    data: XOR<folderUpdateManyMutationInput, folderUncheckedUpdateManyWithoutWorkspaceInput>
  }

  export type folderScalarWhereInput = {
    AND?: folderScalarWhereInput | folderScalarWhereInput[]
    OR?: folderScalarWhereInput[]
    NOT?: folderScalarWhereInput | folderScalarWhereInput[]
    id?: StringFilter<"folder"> | string
    workspace_id?: StringFilter<"folder"> | string
    user_id?: StringFilter<"folder"> | string
    description?: StringNullableFilter<"folder"> | string | null
    color?: StringNullableFilter<"folder"> | string | null
    labels?: StringNullableListFilter<"folder">
    created_at?: DateTimeFilter<"folder"> | Date | string
    updated_at?: DateTimeFilter<"folder"> | Date | string
    is_self_folder?: BoolNullableFilter<"folder"> | boolean | null
  }

  export type userCreateWithoutApprovals_to_actionInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_assigned?: approvalCreateNestedManyWithoutAssignerInput
    notifications?: notificationCreateNestedManyWithoutUserInput
  }

  export type userUncheckedCreateWithoutApprovals_to_actionInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_assigned?: approvalUncheckedCreateNestedManyWithoutAssignerInput
    notifications?: notificationUncheckedCreateNestedManyWithoutUserInput
  }

  export type userCreateOrConnectWithoutApprovals_to_actionInput = {
    where: userWhereUniqueInput
    create: XOR<userCreateWithoutApprovals_to_actionInput, userUncheckedCreateWithoutApprovals_to_actionInput>
  }

  export type userCreateWithoutApprovals_assignedInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_to_action?: approvalCreateNestedManyWithoutApproverInput
    notifications?: notificationCreateNestedManyWithoutUserInput
  }

  export type userUncheckedCreateWithoutApprovals_assignedInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_to_action?: approvalUncheckedCreateNestedManyWithoutApproverInput
    notifications?: notificationUncheckedCreateNestedManyWithoutUserInput
  }

  export type userCreateOrConnectWithoutApprovals_assignedInput = {
    where: userWhereUniqueInput
    create: XOR<userCreateWithoutApprovals_assignedInput, userUncheckedCreateWithoutApprovals_assignedInput>
  }

  export type fileCreateWithoutApprovalsInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
    workspace: workspaceCreateNestedOneWithoutFileInput
  }

  export type fileUncheckedCreateWithoutApprovalsInput = {
    id: string
    workspace_id: string
    user_id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
  }

  export type fileCreateOrConnectWithoutApprovalsInput = {
    where: fileWhereUniqueInput
    create: XOR<fileCreateWithoutApprovalsInput, fileUncheckedCreateWithoutApprovalsInput>
  }

  export type userUpsertWithoutApprovals_to_actionInput = {
    update: XOR<userUpdateWithoutApprovals_to_actionInput, userUncheckedUpdateWithoutApprovals_to_actionInput>
    create: XOR<userCreateWithoutApprovals_to_actionInput, userUncheckedCreateWithoutApprovals_to_actionInput>
    where?: userWhereInput
  }

  export type userUpdateToOneWithWhereWithoutApprovals_to_actionInput = {
    where?: userWhereInput
    data: XOR<userUpdateWithoutApprovals_to_actionInput, userUncheckedUpdateWithoutApprovals_to_actionInput>
  }

  export type userUpdateWithoutApprovals_to_actionInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_assigned?: approvalUpdateManyWithoutAssignerNestedInput
    notifications?: notificationUpdateManyWithoutUserNestedInput
  }

  export type userUncheckedUpdateWithoutApprovals_to_actionInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_assigned?: approvalUncheckedUpdateManyWithoutAssignerNestedInput
    notifications?: notificationUncheckedUpdateManyWithoutUserNestedInput
  }

  export type userUpsertWithoutApprovals_assignedInput = {
    update: XOR<userUpdateWithoutApprovals_assignedInput, userUncheckedUpdateWithoutApprovals_assignedInput>
    create: XOR<userCreateWithoutApprovals_assignedInput, userUncheckedCreateWithoutApprovals_assignedInput>
    where?: userWhereInput
  }

  export type userUpdateToOneWithWhereWithoutApprovals_assignedInput = {
    where?: userWhereInput
    data: XOR<userUpdateWithoutApprovals_assignedInput, userUncheckedUpdateWithoutApprovals_assignedInput>
  }

  export type userUpdateWithoutApprovals_assignedInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_to_action?: approvalUpdateManyWithoutApproverNestedInput
    notifications?: notificationUpdateManyWithoutUserNestedInput
  }

  export type userUncheckedUpdateWithoutApprovals_assignedInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_to_action?: approvalUncheckedUpdateManyWithoutApproverNestedInput
    notifications?: notificationUncheckedUpdateManyWithoutUserNestedInput
  }

  export type fileUpsertWithoutApprovalsInput = {
    update: XOR<fileUpdateWithoutApprovalsInput, fileUncheckedUpdateWithoutApprovalsInput>
    create: XOR<fileCreateWithoutApprovalsInput, fileUncheckedCreateWithoutApprovalsInput>
    where?: fileWhereInput
  }

  export type fileUpdateToOneWithWhereWithoutApprovalsInput = {
    where?: fileWhereInput
    data: XOR<fileUpdateWithoutApprovalsInput, fileUncheckedUpdateWithoutApprovalsInput>
  }

  export type fileUpdateWithoutApprovalsInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
    workspace?: workspaceUpdateOneRequiredWithoutFileNestedInput
  }

  export type fileUncheckedUpdateWithoutApprovalsInput = {
    id?: StringFieldUpdateOperationsInput | string
    workspace_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type userCreateWithoutNotificationsInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_to_action?: approvalCreateNestedManyWithoutApproverInput
    approvals_assigned?: approvalCreateNestedManyWithoutAssignerInput
  }

  export type userUncheckedCreateWithoutNotificationsInput = {
    id: string
    displayname?: string | null
    primaryemail?: string | null
    is_admin?: boolean | null
    approvals_to_action?: approvalUncheckedCreateNestedManyWithoutApproverInput
    approvals_assigned?: approvalUncheckedCreateNestedManyWithoutAssignerInput
  }

  export type userCreateOrConnectWithoutNotificationsInput = {
    where: userWhereUniqueInput
    create: XOR<userCreateWithoutNotificationsInput, userUncheckedCreateWithoutNotificationsInput>
  }

  export type userUpsertWithoutNotificationsInput = {
    update: XOR<userUpdateWithoutNotificationsInput, userUncheckedUpdateWithoutNotificationsInput>
    create: XOR<userCreateWithoutNotificationsInput, userUncheckedCreateWithoutNotificationsInput>
    where?: userWhereInput
  }

  export type userUpdateToOneWithWhereWithoutNotificationsInput = {
    where?: userWhereInput
    data: XOR<userUpdateWithoutNotificationsInput, userUncheckedUpdateWithoutNotificationsInput>
  }

  export type userUpdateWithoutNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_to_action?: approvalUpdateManyWithoutApproverNestedInput
    approvals_assigned?: approvalUpdateManyWithoutAssignerNestedInput
  }

  export type userUncheckedUpdateWithoutNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    displayname?: NullableStringFieldUpdateOperationsInput | string | null
    primaryemail?: NullableStringFieldUpdateOperationsInput | string | null
    is_admin?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals_to_action?: approvalUncheckedUpdateManyWithoutApproverNestedInput
    approvals_assigned?: approvalUncheckedUpdateManyWithoutAssignerNestedInput
  }

  export type approvalCreateManyFileInput = {
    id?: string
    approver_user_id: string
    assigned_by_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalUpdateWithoutFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approver?: userUpdateOneRequiredWithoutApprovals_to_actionNestedInput
    assigner?: userUpdateOneRequiredWithoutApprovals_assignedNestedInput
  }

  export type approvalUncheckedUpdateWithoutFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    approver_user_id?: StringFieldUpdateOperationsInput | string
    assigned_by_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalUncheckedUpdateManyWithoutFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    approver_user_id?: StringFieldUpdateOperationsInput | string
    assigned_by_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalCreateManyApproverInput = {
    id?: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    assigned_by_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type approvalCreateManyAssignerInput = {
    id?: string
    file_id_ref: string
    file_workspace_id_ref: string
    file_user_id_ref: string
    approver_user_id: string
    status: string
    remarks?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    actioned_at?: Date | string | null
  }

  export type notificationCreateManyUserInput = {
    id?: string
    message: string
    type?: string | null
    link?: string | null
    is_read?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    related_approval_process_cuid?: string | null
  }

  export type approvalUpdateWithoutApproverInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assigner?: userUpdateOneRequiredWithoutApprovals_assignedNestedInput
    file?: fileUpdateOneRequiredWithoutApprovalsNestedInput
  }

  export type approvalUncheckedUpdateWithoutApproverInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_id_ref?: StringFieldUpdateOperationsInput | string
    file_workspace_id_ref?: StringFieldUpdateOperationsInput | string
    file_user_id_ref?: StringFieldUpdateOperationsInput | string
    assigned_by_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalUncheckedUpdateManyWithoutApproverInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_id_ref?: StringFieldUpdateOperationsInput | string
    file_workspace_id_ref?: StringFieldUpdateOperationsInput | string
    file_user_id_ref?: StringFieldUpdateOperationsInput | string
    assigned_by_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalUpdateWithoutAssignerInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approver?: userUpdateOneRequiredWithoutApprovals_to_actionNestedInput
    file?: fileUpdateOneRequiredWithoutApprovalsNestedInput
  }

  export type approvalUncheckedUpdateWithoutAssignerInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_id_ref?: StringFieldUpdateOperationsInput | string
    file_workspace_id_ref?: StringFieldUpdateOperationsInput | string
    file_user_id_ref?: StringFieldUpdateOperationsInput | string
    approver_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type approvalUncheckedUpdateManyWithoutAssignerInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_id_ref?: StringFieldUpdateOperationsInput | string
    file_workspace_id_ref?: StringFieldUpdateOperationsInput | string
    file_user_id_ref?: StringFieldUpdateOperationsInput | string
    approver_user_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    actioned_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type notificationUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type notificationUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type notificationUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    type?: NullableStringFieldUpdateOperationsInput | string | null
    link?: NullableStringFieldUpdateOperationsInput | string | null
    is_read?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    related_approval_process_cuid?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type fileCreateManyWorkspaceInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: fileCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    pengesahan_pada?: Date | string | null
    is_self_file?: boolean | null
  }

  export type folderCreateManyWorkspaceInput = {
    id: string
    description?: string | null
    color?: string | null
    labels?: folderCreatelabelsInput | string[]
    created_at?: Date | string
    updated_at?: Date | string
    is_self_folder?: boolean | null
  }

  export type fileUpdateWithoutWorkspaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals?: approvalUpdateManyWithoutFileNestedInput
  }

  export type fileUncheckedUpdateWithoutWorkspaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
    approvals?: approvalUncheckedUpdateManyWithoutFileNestedInput
  }

  export type fileUncheckedUpdateManyWithoutWorkspaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: fileUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pengesahan_pada?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_self_file?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type folderUpdateWithoutWorkspaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type folderUncheckedUpdateWithoutWorkspaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type folderUncheckedUpdateManyWithoutWorkspaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    labels?: folderUpdatelabelsInput | string[]
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_self_folder?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}