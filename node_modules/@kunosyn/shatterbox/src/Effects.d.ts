/// <reference types="@rbxts/types" />

import { DestroyedVoxelInfo } from "./types";

interface Effects {
    Default: (voxel: BasePart, info: DestroyedVoxelInfo) => void;
    BumpyFloorBreakWalls: (voxel: BasePart, info: DestroyedVoxelInfo) => void;
    Rough: (voxel: BasePart, info: DestroyedVoxelInfo) => void;

    /**
     * This effect assumes a spherical hitbox (Shape "Ball").
     * The inner 33% of voxels are removed.
     * Starting at the point where voxels are no longer removed, voxels are black. There is a gradient until around the edges, where the voxels should be their original color.
     */
    MapVoxelSpace: (voxel: BasePart, info: DestroyedVoxelInfo) => void;
}

declare const Effects: Effects;
export = Effects

// local Effects = { }

// local function map(x, a_0, a_1, b_0, b_1)
//     return b_0 + (b_1 - b_0)*(x - a_0)/(a_1 - a_0)
// end

// local raycastParams = RaycastParams.new()
// raycastParams.FilterType = Enum.RaycastFilterType.Include

// local Shatterbox
// Effects._SetRef = function(shatterbox)
//     Shatterbox = shatterbox
// end

// Effects.Default = function(voxel)
//     voxel:Destroy()
// end

// Effects.BumpyFloorBreakWalls = function(voxel, info)
//     if info.IsAlreadyDebris then return end

//     local O = info.UserData.CastOrigin or info.CuttingPart.CFrame.Position
//     local toVoxel = voxel.Position - O
//     -- retrieves the untouched original part, to check if the voxel should be considered a floor
//     local castTo = Shatterbox:GetOriginalPart(info.DirtyGroupID)

//     raycastParams.FilterDescendantsInstances = { castTo }

//     castTo.Parent = workspace
//     local hitResult = workspace:Raycast(O - toVoxel * 0.01, toVoxel * 1.01, raycastParams)
//     castTo.Parent = nil

//     if hitResult and hitResult.Normal:FuzzyEq(Vector3.yAxis, 0.01) then -- if the normal is facing up, it is a floor

//         voxel.Position += Vector3.yAxis * (math.random() - 0.5) -- add some random vertical offset to floor voxels

//     else -- everything else becomes a falling voxel using puppeteer

//         Shatterbox:Puppeteer(voxel) -- start controlled replication of "voxel" to clients (tween between replication of CFrames)

//         voxel.AssemblyLinearVelocity = toVoxel.Unit * (math.random() * 25 + 50)
//     end
// end


// function Effects.Rough (voxel, info)
//     if info.IsAlreadyDebris then -- the voxel is already debris
//         -- fully contained debris is destroyed
//         if not info.IsEdge then
//             voxel:Destroy()
//         end 
        
//         return
//     end

//     local roll = math.random()

//     if info.IsEdge and roll < 0.8 then -- 80% of edge voxels become "edge debris"
//         voxel.CFrame *= CFrame.Angles(math.random() * 2 * math.pi, math.random() * 2 * math.pi, math.random() * 2 * math.pi)
//         voxel.Size *= math.random() + 1
//         return
//     end

//     -- a small percentage of voxels are destroyed
//     if roll > 0.05 then voxel:Destroy()
//         return;
//     end 

//     -- all other voxels are flying debris

//     voxel.Anchored = false
//     voxel.CanCollide = false
//     voxel.AssemblyLinearVelocity = (Vector3.new(math.random(), math.random(), math.random()) - Vector3.one * 0.5) * 80
//     voxel.AssemblyAngularVelocity = (Vector3.new(math.random(), math.random(), math.random()) - Vector3.one * 0.5) * 20

//     -- remember to destroy the voxel
//     game.Debris:AddItem(voxel, 3)
// end

// -- This effect assumes a spherical hitbox (Shape "Ball").
// -- This is an example show you how to use voxel space to perform calculations that are consistent regardless of the gridsize or orientation of voxels.
// -- The inner 33% of voxels are removed.
// -- Starting at the point where voxels are no longer removed, voxels are black. There is a gradient until around the edges, where the voxels should be their original color.
// function Effects.MapVoxelSpace(voxel, info)
//     if info.IsAlreadyDebris then return end

//     -- the radius of the spherical hitbox
//     local R = info.CuttingPart.Size * 0.5

//     -- from the center of the sphere, how many voxels away the edge of the sphere is on each axis (in local space)
//     local MaxVoxelDist = Shatterbox:VoxelCountVector(voxel, math.min(R.X, R.Y, R.Z)*Vector3.one)

//     -- from the center of the current voxel, how many voxels away the center of the sphere is on each axis (in local space)
//     local VoxelDist = Shatterbox:VoxelDistanceVector(voxel, info.CuttingPart.CFrame.Position):Min(MaxVoxelDist)

//     -- The magnitude of this vector is guaranteed to be in the range 0 to close to 1 because spheres hold a consistent magnitude
//     local NormalDist = (VoxelDist / MaxVoxelDist).Magnitude

//     -- destroy voxels close to the center (inner 33% by default)
//     local NormalDistThreshold = 0.33

//     if NormalDist < NormalDistThreshold then
//         voxel:Destroy()
//         return
//     end

//     -- map and clamp the range [NormalDistThreshold, 1] to the range [1, 0]
//     -- So where the voxels begin to appear, they start at black, and where the voxels end, they should be their original color.
//     local Shade = math.clamp(map(NormalDist, NormalDistThreshold,1, 1,0), 0, 1)

//     voxel.Color = voxel.Color:Lerp(Color3.new(), Shade)
// end

// return Effects
