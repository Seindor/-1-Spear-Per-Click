/// <reference types="@rbxts/types" />

/** Represents a 3D hitbox for destruction operations */
export interface Hitbox {
    CFrame: CFrame;
    Size: Vector3;
    Shape: Enum.PartType;
}

/** World information used for area-based operations */
export interface WorldInfo {
    CFrame: CFrame;
    Size: Vector3;
}

/** Information about a destroyed voxel passed to callbacks */
export interface DestroyedVoxelInfo {
    DirtyGroupID?: string;
    CuttingPart?: Hitbox;
    IsEdge?: boolean;
    IsAlreadyDebris?: boolean;
    UserData?: Record<string, unknown>;
}

export type OnVoxelDestruct = (voxel: Part, info: DestroyedVoxelInfo) => void;

export type OnDestructCompleted = (
		destroyedVoxelCount: number,
		affectedDirtyGroups: Map<string, boolean>
	) => void;

/** An imaginary voxel that hasn't been instantiated yet */
export interface ImaginaryVoxel {
    CFrame: CFrame;
    Size: Vector3;
    DirtyGroupID: string;
    DestructionID: string;
    GridSize: number;
    isEdge?: boolean;
}

/** Parameters for destruction operations */
export interface DestructionParams {
    /** The cutting part or hitbox performing the destruction */
    CuttingPart?: Part | Model | Hitbox;
    /** Alternative syntax: provide CFrame, Size, and Shape directly */
    CFrame?: CFrame;
    Size?: Vector3;
    Shape?: Enum.PartType;
    /** Filter destruction to only parts with these tags */
    FilterTagged?: string | Array<string>;
    /** Delay before cleaning up destroyed parts (smooth cleanup) */
    CleanupDelay?: number;
    /** Name of the registered OnVoxelDestruct callback */
    OnVoxelDestruct?: string;
    /** Grid size for voxelization */
    GridSize?: number;
    /** Skip creating voxels that are fully encapsulated */
    SkipEncapsulatedVoxels?: boolean;
    /** Callback invoked when destruction completes */
    OnDestructCompleted?: OnDestructCompleted;
    /** Custom user data passed to callbacks */
    UserData?: Record<string, unknown>;
    /** Players to exclude from replication (server-side only) */
    ExcludePlayersReplication?: Player | Array<Player>;
    /** Skip destroying floor surfaces */
    SkipFloors?: boolean;
    /** Skip destroying wall surfaces */
    SkipWalls?: boolean;
    /** Unique identifier for this destruction operation */
    ID?: string;
}

/** Parameters specific to imaginary voxel operations */
export interface ImaginaryDestructionParams extends Omit<DestructionParams, "OnVoxelDestruct" | "OnDestructCompleted"> {}

/** Settings configuration object */
export interface Settings {
    /** Whether to use client-server replication */
    USE_CLIENT_SERVER?: boolean;
    /** Default grid size for voxelization */
    DefaultGridSize?: number;
    /** Default smooth cleanup delay in seconds */
    DefaultSmoothCleanupDelay?: number;
    /** Whether to use smooth cleanup */
    UseSmoothCleanup?: boolean;
    /** Whether to use greedy meshing optimization */
    UseGreedyMeshing?: boolean;
    /** Number of concurrent greedy meshing workers */
    GMWorkerCount?: number;
    /** Traversals per frame for greedy meshing */
    GMTraversalsPerFrame?: number;
    /** Part creations per frame for greedy meshing */
    GMPartCreationsPerFrame?: number;
    /** Maximum divisions per frame */
    MaxDivisionsPerFrame?: number;
    /** Maximum operations per frame */
    MaxOpsPerFrame?: number;
    /** Whether to use priority queue for operations */
    UsePriorityQueue?: boolean;
    /** Number of recent operations to prioritize */
    PrioritizeRecentN?: number;
    /** Maximum puppet count for replication */
    PuppetMaxCount?: number;
    /** Puppet replication frequency in Hz */
    PuppetReplicationFrequency?: number;
    /** Velocity threshold for puppet sleep */
    PuppetSleepVelocity?: number;
    /** Timeout before anchoring sleeping puppets */
    PuppetAnchorTimeout?: number;
    /** Whether to tween puppets on client */
    ClientTweenPuppets?: boolean;
    /** Distance limit for client-side tweening */
    ClientTweenDistanceLimit?: number;
    /** Behavior for non-divisible parts */
    NonDivisibleInteraction?: "NONE" | "FALL" | "REMOVE";
    /** Custom instance skip check function */
    SkipInstanceCheck?: (instance: Instance) => boolean;
}

/** A hitbox object with additional functionality */
export interface HitboxObject {
    CFrame: CFrame;
    Size: Vector3;
    Shape: Enum.PartType;
    DestructDelay?: number;
    FilterTagged?: string | Array<string>;
    OnVoxelDestruct?: string;
    UserData: Record<string, unknown>;
    ExcludePlayersReplication: Array<Player>;
    OnDestructCompleted?: OnDestructCompleted;
    CleanupDelay?: number;
    GridSize?: number;
    SkipEncapsulatedVoxels?: boolean;
    SkipWalls?: boolean;
    SkipFloors?: boolean;
    DestructionType: "DEFAULT" | "IMAGINARY";
    ImaginaryCallback?: (imaginaryVoxels: Array<ImaginaryVoxel>, existingDebris: Array<BasePart>) => void;
    StartConnectionEvent: RBXScriptSignal;
    WeldConnectionEvent: RBXScriptSignal;
    VelocityPrediction: boolean;
    VelocityBias?: number;

    /** Performs voxel destruction around the hitbox */
    Destroy(): void;
    /** Returns imaginary voxels bounded by the hitbox */
    ImaginaryVoxels(): LuaTuple<[Array<ImaginaryVoxel>, Array<BasePart>]>;
    /** Welds the hitbox to follow a part */
    WeldTo(part: BasePart): void;
    /** Unwelds the hitbox */
    Unweld(): void;
    /** Starts continuous destruction */
    Start(): void;
    /** Stops continuous destruction */
    Stop(): void;
    /** Destroys the hitbox and disconnects all connections */
    DestroyHitbox(): void;
}

export type EffectHook = (voxel: BasePart, info: DestroyedVoxelInfo) => void;

export type ClientEffectName<T extends string> = 'Default' | 'Rough' | T
export type ServerEffectName<T extends string> = 'Default' | 'MappingVoxelSpace' | 'BumpyFloorBreakWalls' | T


/// <reference types="@rbxts/types" />

/**
 * Function type for testing if a point is contained within a part shape
 */
type PartTypeContainsPoint = (cframe: CFrame, size: Vector3, p: Vector3) => boolean;

/**
 * Function type for getting vertices of a part shape
 */
type GetVertsFunction = (cframe: CFrame, size: Vector3) => Array<Vector3>;

/**
 * Function type for getting normals of a part shape
 */
type GetNormalsFunction = (cframe: CFrame, size?: Vector3) => Array<Vector3>;

/**
 * Collection of vertex calculation functions for different part shapes
 */
interface GetVertsFunctions {
	/**
	 * Gets the 8 corner vertices of a block part
	 */
	Block: GetVertsFunction;
	
	/**
	 * Gets the 6 vertices of a wedge part
	 */
	Wedge: GetVertsFunction;
	
	/**
	 * Gets the 5 vertices of a corner wedge part
	 */
	CornerWedge: GetVertsFunction;
}

/**
 * Collection of normal calculation functions for different part shapes
 */
interface GetNormalsFunctions {
	/**
	 * Gets the 6 face normals of a block part
	 * @param cframe The CFrame of the block
	 */
	Block: (cframe: CFrame) => Array<Vector3>;
	
	/**
	 * Gets the face normals of a wedge part
	 * @param cframe The CFrame of the wedge
	 * @param size The size of the wedge
	 */
	Wedge: (cframe: CFrame, size: Vector3) => Array<Vector3>;
	
	/**
	 * Gets the face normals of a corner wedge part
	 * @param cframe The CFrame of the corner wedge
	 * @param size The size of the corner wedge
	 */
	CornerWedge: (cframe: CFrame, size: Vector3) => Array<Vector3>;
}

/**
 * VertexMath - Geometric intersection and containment testing utilities
 * 
 * Provides efficient algorithms for:
 * - Vertex and normal calculations for different part shapes
 * - Separating Axis Theorem (SAT) intersection tests
 * - Point-in-shape containment tests
 * - Shape-shape intersection tests
 * 
 * @example
 * ```ts
 * import VertexMath from "./VertexMath";
 * 
 * // Get vertices of a block
 * const blockVerts = VertexMath.GetVerts.Block(
 *   new CFrame(0, 10, 0),
 *   new Vector3(10, 5, 8)
 * );
 * 
 * // Test if a part contains all vertices
 * const part = game.Workspace.WaitForChild("TestPart") as Part;
 * const contained = VertexMath.PartContainsAllVerts(part, blockVerts);
 * ```
 */
export interface VertexMath {
	/**
	 * Collection of functions to get vertices for different part shapes.
	 * 
	 * Each function returns an array of Vector3 positions representing
	 * the corners of the shape in world space.
	 * 
	 * @example
	 * ```ts
	 * // Get block vertices
	 * const blockVerts = VertexMath.GetVerts.Block(
	 *   part.CFrame,
	 *   part.Size
	 * );
	 * 
	 * // Get wedge vertices
	 * const wedgeVerts = VertexMath.GetVerts.Wedge(
	 *   wedgePart.CFrame,
	 *   wedgePart.Size
	 * );
	 * ```
	 */
	GetVerts: GetVertsFunctions;
	
	/**
	 * Collection of functions to get normal vectors for different part shapes.
	 * 
	 * Each function returns an array of Vector3 unit vectors representing
	 * the outward-facing normals of the shape's faces.
	 * 
	 * @example
	 * ```ts
	 * // Get block normals (6 face normals)
	 * const blockNormals = VertexMath.GetNormals.Block(part.CFrame);
	 * 
	 * // Get wedge normals (requires size for slope calculation)
	 * const wedgeNormals = VertexMath.GetNormals.Wedge(
	 *   wedgePart.CFrame,
	 *   wedgePart.Size
	 * );
	 * ```
	 */
	GetNormals: GetNormalsFunctions;
	
	/**
	 * Separating Axis Theorem (SAT) intersection test.
	 * 
	 * Tests whether two convex shapes intersect by checking if there exists
	 * a separating axis between them. This is the fundamental algorithm used
	 * for collision detection in Shatterbox.
	 * 
	 * The algorithm tests separation on all candidate axes:
	 * - Face normals of shape A
	 * - Face normals of shape B
	 * - Cross products of edge directions from both shapes
	 * 
	 * @param VA Vertices of shape A
	 * @param NA Normal vectors of shape A
	 * @param VB Vertices of shape B
	 * @param NB Normal vectors of shape B
	 * @returns True if shapes intersect, false if separated
	 * 
	 * @example
	 * ```ts
	 * const partA = game.Workspace.PartA as Part;
	 * const partB = game.Workspace.PartB as Part;
	 * 
	 * const vertsA = VertexMath.GetVerts.Block(partA.CFrame, partA.Size);
	 * const normalsA = VertexMath.GetNormals.Block(partA.CFrame);
	 * const vertsB = VertexMath.GetVerts.Block(partB.CFrame, partB.Size);
	 * const normalsB = VertexMath.GetNormals.Block(partB.CFrame);
	 * 
	 * if (VertexMath.SAT(vertsA, normalsA, vertsB, normalsB)) {
	 *   print("Parts are intersecting!");
	 * }
	 * ```
	 */
	SAT(VA: Array<Vector3>, NA: Array<Vector3>, VB: Array<Vector3>, NB: Array<Vector3>): boolean;
	
	/**
	 * Tests if a part fully encapsulates a block part.
	 * 
	 * This is an optimized check that tests if all 8 corners of a block
	 * are contained within another part of any shape.
	 * 
	 * @param part The container part (can be Block, Ball, Cylinder, Wedge, or CornerWedge)
	 * @param blockCFrame CFrame of the block to test
	 * @param blockSize Size of the block to test
	 * @returns True if the block is fully inside the part
	 * 
	 * @example
	 * ```ts
	 * const container = game.Workspace.Container as Part;
	 * const blockCF = new CFrame(0, 10, 0);
	 * const blockSize = new Vector3(5, 5, 5);
	 * 
	 * if (VertexMath.PartEncapsulatesBlockPart(container, blockCF, blockSize)) {
	 *   print("Block is fully inside container");
	 * }
	 * ```
	 */
	PartEncapsulatesBlockPart(part: Part, blockCFrame: CFrame, blockSize: Vector3): boolean;
	
	/**
	 * Tests if a part contains all given vertices.
	 * 
	 * Works with any part shape (Block, Ball, Cylinder, Wedge, CornerWedge).
	 * Uses shape-specific containment algorithms for efficiency.
	 * 
	 * @param part The part to test against
	 * @param verts Array of vertex positions in world space
	 * @returns True if all vertices are inside the part
	 * 
	 * @example
	 * ```ts
	 * const part = game.Workspace.TestPart as Part;
	 * const testVerts = [
	 *   new Vector3(0, 10, 0),
	 *   new Vector3(1, 10, 1),
	 *   new Vector3(-1, 10, -1)
	 * ];
	 * 
	 * if (VertexMath.PartContainsAllVerts(part, testVerts)) {
	 *   print("All vertices are inside the part");
	 * }
	 * ```
	 */
	PartContainsAllVerts(part: Part, verts: Array<Vector3>): boolean;
	
	/**
	 * Tests if a part contains at least one vertex.
	 * 
	 * Returns the index (1-based) of the first contained vertex,
	 * or false if no vertices are contained.
	 * 
	 * @param part The part to test against
	 * @param verts Array of vertex positions in world space
	 * @returns Index of first contained vertex (1-based), or false if none
	 * 
	 * @example
	 * ```ts
	 * const part = game.Workspace.TestPart as Part;
	 * const verts = VertexMath.GetVerts.Block(
	 *   new CFrame(0, 10, 0),
	 *   new Vector3(10, 10, 10)
	 * );
	 * 
	 * const result = VertexMath.PartContainsAVert(part, verts);
	 * if (typeIs(result, "number")) {
	 *   print(`Vertex ${result} is inside the part`);
	 *   verts.remove(result - 1); // Convert to 0-based for array access
	 * }
	 * ```
	 */
	PartContainsAVert(part: Part, verts: Array<Vector3>): number | false;
	
	/**
	 * Tests if a ball (sphere) intersects with a block.
	 * 
	 * Uses an optimized algorithm that finds the closest point on the block
	 * to the sphere center, then checks if that point is within the sphere radius.
	 * 
	 * @param sphereCFrame CFrame of the sphere center
	 * @param sphereSize Size of the sphere (uses minimum dimension as diameter)
	 * @param boxCFrame CFrame of the box
	 * @param boxSize Size of the box
	 * @returns True if the sphere and box intersect
	 * 
	 * @example
	 * ```ts
	 * const explosionPos = new CFrame(0, 10, 0);
	 * const explosionSize = new Vector3(8, 8, 8); // 4-stud radius
	 * 
	 * const wall = game.Workspace.Wall as Part;
	 * 
	 * if (VertexMath.BallIntersectsBlock(
	 *   explosionPos,
	 *   explosionSize,
	 *   wall.CFrame,
	 *   wall.Size
	 * )) {
	 *   print("Explosion hits wall!");
	 * }
	 * ```
	 */
	BallIntersectsBlock(
		sphereCFrame: CFrame,
		sphereSize: Vector3,
		boxCFrame: CFrame,
		boxSize: Vector3
	): boolean;
	
	/**
	 * Tests if a cylinder intersects with a block.
	 * 
	 * This is a complex intersection test that combines multiple algorithms:
	 * - Line segment vs cylinder tests for all block edges
	 * - SAT test using cylinder bounding box
	 * - Plane vs cylinder tests for all block faces
	 * 
	 * The cylinder is oriented along its X-axis (right vector).
	 * 
	 * @param cylinderCFrame CFrame of the cylinder
	 * @param cylinderSize Size of the cylinder (X = length, Y/Z = diameter)
	 * @param cylinderBoxVerts Pre-calculated bounding box vertices of cylinder
	 * @param cylinderBoxNormals Pre-calculated bounding box normals of cylinder
	 * @param boxCFrame CFrame of the box
	 * @param boxSize Size of the box
	 * @param boxVerts Vertices of the box
	 * @param boxNormals Normals of the box
	 * @returns True if the cylinder and box intersect
	 * 
	 * @example
	 * ```ts
	 * const cylinder = game.Workspace.Cylinder as Part;
	 * const block = game.Workspace.Block as Part;
	 * 
	 * // Pre-calculate cylinder bounding box
	 * const cylinderVerts = VertexMath.GetVerts.Block(
	 *   cylinder.CFrame,
	 *   cylinder.Size
	 * );
	 * const cylinderNormals = VertexMath.GetNormals.Block(cylinder.CFrame);
	 * 
	 * // Get block geometry
	 * const blockVerts = VertexMath.GetVerts.Block(block.CFrame, block.Size);
	 * const blockNormals = VertexMath.GetNormals.Block(block.CFrame);
	 * 
	 * if (VertexMath.CylinderIntersectsBlock(
	 *   cylinder.CFrame,
	 *   cylinder.Size,
	 *   cylinderVerts,
	 *   cylinderNormals,
	 *   block.CFrame,
	 *   block.Size,
	 *   blockVerts,
	 *   blockNormals
	 * )) {
	 *   print("Cylinder intersects block!");
	 * }
	 * ```
	 */
	CylinderIntersectsBlock(
		cylinderCFrame: CFrame,
		cylinderSize: Vector3,
		cylinderBoxVerts: Array<Vector3>,
		cylinderBoxNormals: Array<Vector3>,
		boxCFrame: CFrame,
		boxSize: Vector3,
		boxVerts: Array<Vector3>,
		boxNormals: Array<Vector3>
	): boolean;
}
