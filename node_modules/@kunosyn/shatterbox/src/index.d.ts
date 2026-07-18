/// <reference types="@rbxts/types" />

import Effects from "./Effects";
import type { 
	HitboxObject, 
	DestructionParams, 
	Settings, 
	WorldInfo, 
	OnDestructCompleted, 
	ImaginaryDestructionParams, 
	ImaginaryVoxel, 
	DestroyedVoxelInfo, 
	OnVoxelDestruct, 
	VertexMath
} from "./types";

/**
 * Shatterbox - A voxel destruction system for Roblox
 * 
 * @example
 * ```ts
 * const shatterbox = new Shatterbox();
 * shatterbox.Start();
 * 
 * // Destroy parts around a ball
 * shatterbox.Destroy({
 *   CFrame: new CFrame(0, 10, 0),
 *   Size: new Vector3(5, 5, 5),
 *   Shape: Enum.PartType.Ball
 * });
 * ```
 */
declare class Shatterbox {
	/**
	 * Settings configuration for this Shatterbox instance
	 * @readonly
	 */
	public readonly Settings: Settings;
	
	/**
	 * Vertex math utilities for intersection testing
	 * @readonly
	 */
	public readonly VertexMath: VertexMath;

	/**
	 * Default Effects for Voxel Destruction.
	 * @readonly
	 */
	public readonly DefaultEffects: Effects;
	
	/**
	 * Whether the Shatterbox instance has been started
	 * @internal
	 */
	private started: boolean;

	/**
	 * Creates a new Shatterbox instance with optional custom settings
	 * 
	 * @param settings Optional configuration settings. If not provided, uses default settings.
	 * 
	 * @example
	 * ```ts
	 * // With default settings
	 * const shatterbox = new Shatterbox();
	 * 
	 * // With custom settings
	 * const shatterbox = new Shatterbox({
	 *   DefaultGridSize: 2,
	 *   UseGreedyMeshing: true,
	 *   MaxDivisionsPerFrame: 100
	 * });
	 * ```
	 */
	constructor(settings?: Partial<Settings>);

	/**
	 * Starts the Shatterbox system. Must be called before using any destruction methods.
	 * Can only be called once per instance.
	 * 
	 * Initializes network events, effect registries, and starts the heartbeat worker.
	 * 
	 * @throws Will warn if called more than once on the same instance
	 * 
	 * @example
	 * ```ts
	 * const shatterbox = new Shatterbox();
	 * shatterbox.Start();
	 * ```
	 */
	public Start(): void;

	/**
	 * Registers an effect callback for voxel destruction
	 * 
	 * Effect callbacks are executed when voxels are destroyed, allowing you to:
	 * - Apply physics effects
	 * - Create particle effects
	 * - Play sounds
	 * - Add custom behavior to destroyed voxels
	 * 
	 * @param name Unique name for the effect (case-insensitive)
	 * @param callback Function to execute when a voxel is destroyed
	 * 
	 * @throws Asserts if name is not a string
	 * @throws Asserts if an effect with this name already exists
	 * 
	 * @example
	 * ```ts
	 * shatterbox.RegisterOnVoxelDestruct("explosion", (voxel, info) => {
	 *   voxel.Anchored = false;
	 *   voxel.Velocity = info.CuttingPart.CFrame.LookVector.mul(50);
	 *   
	 *   const explosion = new Instance("Explosion");
	 *   explosion.Position = voxel.Position;
	 *   explosion.Parent = game.Workspace;
	 * });
	 * 
	 * // Use the effect in destruction
	 * shatterbox.Destroy(part, undefined, undefined, "explosion");
	 * ```
	 */
	public RegisterOnVoxelDestruct(name: string, callback: OnVoxelDestruct): void;

	/**
	 * Performs voxel destruction around the intersecting part.
	 * Operations are queued and processed over multiple frames to maintain performance.
	 * 
	 * Supports multiple syntaxes:
	 * 1. Part/Model as cutting shape
	 * 2. WorldInfo table (CFrame, Size, Shape)
	 * 3. DestructionParams object with all options
	 * 
	 * @param intersectingPart The cutting shape or params object
	 * @param FilterTagged Optional tag(s) to filter which parts can be destroyed
	 * @param CleanupDelay Time in seconds before destroyed parts are restored (0 = never restore)
	 * @param OnVoxelDestruct Name of the registered effect callback to execute
	 * @param GridSize Size of each voxel in studs (smaller = more detailed destruction)
	 * @param SkipEncapsulatedVoxels If true, don't create voxels fully inside the cutting part
	 * @param OnDestructCompleted Callback when destruction completes
	 * @param UserData Custom data passed to the effect callback
	 * @param ExcludePlayersReplication Players to exclude from replication (server-side only)
	 * @param SkipFloors If true, don't destroy floor surfaces
	 * @param SkipWalls If true, don't destroy wall surfaces
	 * 
	 * @example
	 * ```ts
	 * // Simple destruction with a part
	 * shatterbox.Destroy(explosionPart);
	 * 
	 * // Destruction with WorldInfo
	 * shatterbox.Destroy({
	 *   CFrame: new CFrame(0, 10, 0),
	 *   Size: new Vector3(10, 10, 10),
	 *   Shape: Enum.PartType.Ball
	 * });
	 * 
	 * // Full params with effect and cleanup
	 * shatterbox.Destroy(
	 *   explosionPart,
	 *   "Destructible", // Only destroy parts tagged "Destructible"
	 *   5, // Restore after 5 seconds
	 *   "explosion", // Use "explosion" effect
	 *   2, // 2-stud voxels
	 *   false,
	 *   (count, groups) => print(`Destroyed ${count} voxels`)
	 * );
	 * 
	 * // Using params object
	 * shatterbox.Destroy({
	 *   CuttingPart: {
	 *     CFrame: missile.CFrame,
	 *     Size: new Vector3(5, 5, 5),
	 *     Shape: Enum.PartType.Ball
	 *   },
	 *   OnVoxelDestruct: "explosion",
	 *   GridSize: 1.5,
	 *   CleanupDelay: 10,
	 *   SkipFloors: true
	 * });
	 * ```
	 */
	public Destroy(
		intersectingPart: Part | Model | WorldInfo | DestructionParams,
		FilterTagged?: string | Array<string>,
		CleanupDelay?: number,
		OnVoxelDestruct?: string,
		GridSize?: number,
		SkipEncapsulatedVoxels?: boolean,
		OnDestructCompleted?: OnDestructCompleted,
		UserData?: Record<string, unknown>,
		ExcludePlayersReplication?: Array<Player>,
		SkipFloors?: boolean,
		SkipWalls?: boolean
	): void;

	/**
	 * Performs instant voxel destruction, yielding until the next Heartbeat.
	 * Returns imaginary voxels (data structures) that can be instantiated as real parts.
	 * 
	 * Use this when you want full control over how voxels are created, or when you need
	 * to inspect/modify voxels before instantiating them.
	 * 
	 * @returns A tuple of [imaginaryVoxels, existingDebris]
	 * - imaginaryVoxels: Array of voxel data that can be instantiated with InstantiateImaginaryVoxel
	 * - existingDebris: Array of existing debris parts that were in the destruction area
	 * 
	 * @example
	 * ```ts
	 * // Get imaginary voxels without creating them
	 * const [voxels, debris] = shatterbox.ImaginaryVoxels({
	 *   CFrame: new CFrame(0, 10, 0),
	 *   Size: new Vector3(5, 5, 5),
	 *   Shape: Enum.PartType.Ball
	 * });
	 * 
	 * print(`Would create ${voxels.size()} voxels`);
	 * 
	 * // Create only edge voxels with custom properties
	 * for (const voxel of voxels) {
	 *   if (voxel.isEdge) {
	 *     const part = shatterbox.InstantiateImaginaryVoxel(voxel);
	 *     part.BrickColor = BrickColor.Red();
	 *     part.Anchored = false;
	 *   }
	 * }
	 * 
	 * // Handle existing debris
	 * for (const debris of debris) {
	 *   debris.BrickColor = BrickColor.Yellow();
	 * }
	 * ```
	 */
	public ImaginaryVoxels(
		intersectingPart: Part | Model | WorldInfo | ImaginaryDestructionParams,
		FilterTagged?: string | Array<string>,
		CleanupDelay?: number,
		GridSize?: number,
		SkipEncapsulatedVoxels?: boolean,
		ExcludePlayersReplication?: Array<Player>,
		SkipFloors?: boolean,
		SkipWalls?: boolean
	): LuaTuple<[Array<ImaginaryVoxel>, Array<BasePart>]>;

	/**
	 * Instantiates an imaginary voxel as a real Part in the workspace.
	 * 
	 * The created part will:
	 * - Be automatically parented to the appropriate location
	 * - Have the DebrisTag tag (unless doNotGiveDebrisTag is true)
	 * - Be registered in the dirty group system
	 * 
	 * @param imaginaryVoxel The imaginary voxel data from ImaginaryVoxels()
	 * @param doNotGiveDebrisTag If true, don't add the DebrisTag to the created part
	 * @returns The created Part instance
	 * 
	 * @example
	 * ```ts
	 * const [voxels] = shatterbox.ImaginaryVoxels(explosionPart);
	 * 
	 * // Create all voxels as debris
	 * for (const voxel of voxels) {
	 *   const part = shatterbox.InstantiateImaginaryVoxel(voxel);
	 *   part.Anchored = false;
	 * }
	 * 
	 * // Create voxels without debris tag (for custom tracking)
	 * for (const voxel of voxels) {
	 *   const part = shatterbox.InstantiateImaginaryVoxel(voxel, true);
	 *   // Add your own custom tag or tracking
	 *   part.SetAttribute("CustomVoxel", true);
	 * }
	 * ```
	 */
	public InstantiateImaginaryVoxel(
		imaginaryVoxel: ImaginaryVoxel,
		doNotGiveDebrisTag?: boolean
	): Part;

	/**
	 * Makes a voxel fall realistically with physics and replicates it to clients.
	 * 
	 * **Server-side only.**
	 * 
	 * Puppets are physics-enabled parts that are efficiently replicated to clients
	 * using compressed state updates. The system automatically:
	 * - Manages network ownership
	 * - Compresses position/rotation data
	 * - Handles client-side interpolation
	 * - Auto-anchors when sleeping
	 * - Cleans up old puppets when limit is reached
	 * 
	 * @param voxel The part to turn into a falling puppet
	 * 
	 * @throws Asserts if called on client
	 * @throws Warns if network ownership cannot be set
	 * 
	 * @example
	 * ```ts
	 * // Create falling debris
	 * const [voxels] = shatterbox.ImaginaryVoxels(explosionPart);
	 * 
	 * for (const voxel of voxels) {
	 *   const part = shatterbox.InstantiateImaginaryVoxel(voxel);
	 *   
	 *   // Apply force
	 *   const direction = voxel.CFrame.Position.sub(explosionPart.Position).Unit;
	 *   part.AssemblyLinearVelocity = direction.mul(50);
	 *   
	 *   // Make it fall with replication
	 *   shatterbox.Puppeteer(part);
	 * }
	 * ```
	 */
	public Puppeteer(voxel: Part): void;

	/**
	 * Creates fake puppets on the client for testing purposes.
	 * 
	 * **Client-side only.**
	 * 
	 * Useful for testing destruction effects without server replication.
	 * 
	 * @param fakePuppets Array of parts to treat as puppets
	 * 
	 * @example
	 * ```ts
	 * // Client-side testing
	 * const testParts: Part[] = [];
	 * for (let i = 0; i < 10; i++) {
	 *   const part = new Instance("Part");
	 *   part.Size = new Vector3(2, 2, 2);
	 *   part.Position = new Vector3(i * 3, 10, 0);
	 *   part.Parent = game.Workspace;
	 *   testParts.push(part);
	 * }
	 * 
	 * shatterbox.FakeClientPuppets(testParts);
	 * ```
	 */
	public FakeClientPuppets(fakePuppets: Array<Part>): void;

	/**
	 * Creates a hitbox object with additional functionality for destruction.
	 * 
	 * Hitboxes provide:
	 * - Welding to moving parts
	 * - Continuous destruction (raycast-like)
	 * - Velocity prediction for fast-moving objects
	 * - Start/Stop control
	 * 
	 * @returns A hitbox object with methods for destruction and movement
	 * 
	 * @example
	 * ```ts
	 * // Create a projectile hitbox
	 * const hitbox = shatterbox.CreateHitbox();
	 * hitbox.Size = new Vector3(2, 2, 2);
	 * hitbox.Shape = Enum.PartType.Ball;
	 * hitbox.OnVoxelDestruct = "explosion";
	 * hitbox.GridSize = 1;
	 * 
	 * // Weld to projectile
	 * hitbox.WeldTo(projectile);
	 * hitbox.VelocityPrediction = true; // Enable for fast projectiles
	 * hitbox.Start();
	 * 
	 * // Cleanup when done
	 * projectile.Touched.Connect(() => {
	 *   hitbox.Stop();
	 *   hitbox.DestroyHitbox();
	 * });
	 * 
	 * // Manual control hitbox
	 * const controlledHitbox = shatterbox.CreateHitbox();
	 * controlledHitbox.DestructDelay = 0.1; // Destroy every 0.1 seconds
	 * 
	 * game.GetService("RunService").Heartbeat.Connect(() => {
	 *   controlledHitbox.CFrame = tool.Handle.CFrame;
	 * });
	 * 
	 * controlledHitbox.Start();
	 * ```
	 */
	public CreateHitbox(): HitboxObject;

	/**
	 * Resets an area without reverting ownership of parts.
	 * 
	 * Undoes all destruction within the specified area while maintaining the
	 * current dirty group structure. Useful for resetting specific zones without
	 * affecting the rest of the map.
	 * 
	 * @param area The area to reset (Part or WorldInfo with CFrame and Size)
	 * 
	 * @example
	 * ```ts
	 * // Reset using a part
	 * const resetZone = game.Workspace.WaitForChild("ResetZone") as Part;
	 * shatterbox.ResetArea(resetZone);
	 * 
	 * // Reset using WorldInfo
	 * shatterbox.ResetArea({
	 *   CFrame: new CFrame(0, 0, 0),
	 *   Size: new Vector3(50, 50, 50)
	 * });
	 * 
	 * // Reset around player
	 * game.GetService("Players").PlayerAdded.Connect((player) => {
	 *   const character = player.Character || player.CharacterAdded.Wait()[0];
	 *   const hrp = character.WaitForChild("HumanoidRootPart") as Part;
	 *   
	 *   shatterbox.ResetArea({
	 *     CFrame: hrp.CFrame,
	 *     Size: new Vector3(20, 20, 20)
	 *   });
	 * });
	 * ```
	 */
	public ResetArea(area: Part | WorldInfo): void;

	/**
	 * Resets all modified parts to their original state.
	 * 
	 * This will:
	 * - Cancel all queued operations
	 * - Terminate all greedy meshing workers
	 * - Clear smooth cleanup timers
	 * - Destroy or restore all puppets
	 * - Restore all original parts
	 * 
	 * @param doNotRevertOwnership If true, keeps parts in their current ownership state
	 * 
	 * @example
	 * ```ts
	 * // Complete reset
	 * shatterbox.Reset();
	 * 
	 * // Reset but maintain dirty groups (for client-server sync)
	 * shatterbox.Reset(true);
	 * 
	 * // Reset on round end
	 * function resetMap() {
	 *   shatterbox.Reset();
	 *   print("Map has been reset!");
	 * }
	 * ```
	 */
	public Reset(doNotRevertOwnership?: boolean): void;

	/**
	 * Cancels all ongoing destruction operations in the queue.
	 * 
	 * This stops processing queued destructions but does not undo
	 * destructions that have already been processed.
	 * 
	 * @example
	 * ```ts
	 * // Cancel all pending destructions
	 * shatterbox.ClearQueue();
	 * 
	 * // Useful for stopping destruction on game state change
	 * function onRoundEnd() {
	 *   shatterbox.ClearQueue(); // Stop processing destructions
	 *   wait(1);
	 *   shatterbox.Reset(); // Then reset the map
	 * }
	 * ```
	 */
	public ClearQueue(): void;

	/**
	 * Returns the original part associated with a DirtyGroupID.
	 * 
	 * The original part is never destroyed by Shatterbox, just has its parent
	 * set to nil. This allows the system to restore parts efficiently.
	 * 
	 * @param dirtyGroupID The ID of the dirty group
	 * @returns The original part, or undefined if not found
	 * 
	 * @example
	 * ```ts
	 * // Get original part from a voxel
	 * const voxel = game.Workspace.FindFirstChild("Voxel") as Part;
	 * const dirtyGroupID = voxel.GetAttribute("DirtyGroupID") as string;
	 * 
	 * if (dirtyGroupID) {
	 *   const original = shatterbox.GetOriginalPart(dirtyGroupID);
	 *   if (original) {
	 *     print(`Original part: ${original.Name}`);
	 *     print(`Original size: ${original.Size}`);
	 *   }
	 * }
	 * ```
	 */
	public GetOriginalPart(dirtyGroupID: string): Part | undefined;

	/**
	 * Converts a point to voxel space distance relative to the voxel.
	 * 
	 * Returns a vector indicating how many voxels away the point is on each
	 * local axis as fractional quantities. Useful for spatial queries and
	 * calculating voxel-based distances.
	 * 
	 * @param voxel The reference voxel part
	 * @param point The world space point to convert
	 * @returns Distance vector in voxel space
	 * 
	 * @example
	 * ```ts
	 * const voxel = game.Workspace.WaitForChild("Voxel") as Part;
	 * const targetPos = new Vector3(10, 10, 10);
	 * 
	 * const distance = shatterbox.VoxelDistanceVector(voxel, targetPos);
	 * print(`Distance: ${distance.X}x, ${distance.Y}y, ${distance.Z}z voxels`);
	 * 
	 * // Check if point is within 5 voxels
	 * if (distance.Magnitude < 5) {
	 *   print("Point is close to voxel");
	 * }
	 * ```
	 */
	public VoxelDistanceVector(voxel: Part, point: Vector3): Vector3;

	/**
	 * Returns how many voxels a box has on each axis as fractional quantities.
	 * 
	 * Minimum of 1 on each axis (a box is always at least 1 voxel large).
	 * 
	 * @param voxel The reference voxel part (for voxel size)
	 * @param boxSize The size of the box to measure
	 * @returns Voxel count vector
	 * 
	 * @example
	 * ```ts
	 * const voxel = game.Workspace.WaitForChild("Voxel") as Part;
	 * const testSize = new Vector3(10, 5, 8);
	 * 
	 * const voxelCount = shatterbox.VoxelCountVector(voxel, testSize);
	 * print(`Would create ${voxelCount.X * voxelCount.Y * voxelCount.Z} voxels`);
	 * 
	 * // Estimate performance impact
	 * const totalVoxels = voxelCount.X * voxelCount.Y * voxelCount.Z;
	 * if (totalVoxels > 1000) {
	 *   warn("Large destruction - may impact performance");
	 * }
	 * ```
	 */
	public VoxelCountVector(voxel: Part, boxSize: Vector3): Vector3;

	/**
	 * Returns true if the contains part is fully encapsulated by the part.
	 * 
	 * @param part The container part
	 * @param contains The part to check if it's contained (must be a Block part)
	 * @returns True if fully contained, false otherwise
	 * 
	 * @throws Asserts if part is not a Part
	 * @throws Asserts if contains is not a Block Part
	 * 
	 * @example
	 * ```ts
	 * const container = game.Workspace.WaitForChild("Container") as Part;
	 * const testPart = game.Workspace.WaitForChild("TestPart") as Part;
	 * 
	 * if (shatterbox.PartEncapsulatesBlockPart(container, testPart)) {
	 *   print("TestPart is fully inside Container");
	 * } else {
	 *   print("TestPart is partially or not inside Container");
	 * }
	 * ```
	 */
	public PartEncapsulatesBlockPart(part: Part, contains: Part): boolean;

	/**
	 * Prints the current state of Shatterbox for debugging.
	 * 
	 * Shows:
	 * - ShatterQueue length
	 * - Active greedy meshing workers
	 * - Dirty group counts
	 * - Operation processing counts
	 * 
	 * Output is formatted for easy reading in the console.
	 * 
	 * @example
	 * ```ts
	 * // Debug performance issues
	 * shatterbox.PrintState();
	 * 
	 * // Monitor queue size
	 * game.GetService("RunService").Heartbeat.Connect(() => {
	 *   if (frameCount % 60 === 0) {
	 *     shatterbox.PrintState();
	 *   }
	 * });
	 * ```
	 */
	public PrintState(): void;

	/**
	 * Gets a setting value, falling back to default if not set in instance settings.
	 * 
	 * @param settingName Name of the setting to retrieve
	 * @returns The setting value
	 * 
	 * @example
	 * ```ts
	 * const gridSize = shatterbox.UseSetting<number>("DefaultGridSize");
	 * const useGreedy = shatterbox.UseSetting<boolean>("UseGreedyMeshing");
	 * ```
	 */
	public UseSetting<T>(settingName: keyof Settings): T;
}

export = Shatterbox;