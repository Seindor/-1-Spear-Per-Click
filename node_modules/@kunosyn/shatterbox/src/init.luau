--!native
--!optimize 2

-- Shatterbox release 8

--#selene: allow(multiple_statements)
--#selene: allow(unused_variable)
--#selene: allow(incorrect_standard_library_use)
--#selene: allow(shadowing)

-- Constants
local IndestructibleTag = "Indestructible"
local FallingGroupTag = "FallingGroup"
local DebrisTag = "ShatterboxDebris"
local DirtyGroupIDAttribute = "DirtyGroupID"
local FallingGroupIDAttribute = "FallingGroupID"
local IMAGINARY, NORMAL = "IMAGINARY", "NORMAL"
local EPSILON = 1e-3

-- Services
local HttpService = game:GetService("HttpService")
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local isServer, isClient = RunService:IsServer(), RunService:IsClient()

-- Module references
local src = script
local lib = src:WaitForChild("lib")
local PathToClient = lib:WaitForChild("Client")
local PathToServer = lib:WaitForChild("Server")

local Effects = require(src:WaitForChild('Effects'))
local DefaultSettings = require(src:WaitForChild("Settings"))

-- Library imports
local VertexMath = require(lib:WaitForChild("VertexMath"))
local PartEncapsulatesBlockPart = VertexMath.PartEncapsulatesBlockPart
local GetVerts, GetNormals = VertexMath.GetVerts, VertexMath.GetNormals
local BlockVerts, BlockNormals = GetVerts.Block, GetNormals.Block
local PartContainsAVert, PartContainsAllVerts = VertexMath.PartContainsAVert, VertexMath.PartContainsAllVerts

local PartOperations = require(lib:WaitForChild("PartOperations"))
local PartFromTemplate = PartOperations.PartFromTemplate
local DeserializedPartInstance = PartOperations.DeserializedPartInstance
local SerializedPartInstance = PartOperations.SerializedPartInstance
local GridInfo = PartOperations.GridInfo
local ImaginaryVoxelize = PartOperations.ImaginaryVoxelize
local Voxelize = PartOperations.Voxelize

local SubdivideFunctions = {
	KD = PartOperations.SubdivideKD,
	MOT = PartOperations.SubdivideOctree
}

-- UV mapping tables
local textUVMap = {
	[0] = Vector3.new( 0,  1,  1),
	[1] = Vector3.new( 1,  0,  1),
	[2] = Vector3.new(-1,  1,  0),
	[3] = Vector3.new( 0,  1, -1),
	[4] = Vector3.new(-1,  0,  1),
	[5] = Vector3.new( 1,  1,  0)
}

local axisUVMap = {
	[0] = { "Z", "Y" },
	[1] = { "X", "Z" },
	[2] = { "X", "Y" },
	[3] = { "Z", "Y" },
	[4] = { "X", "Z" },
	[5] = { "X", "Y" }
}

-- Puppet replication constants
local U82RAD = 0.0246399423811
local PRECISE_45_DEGREES = {
	[32] = math.pi * 0.25,
	[64] = math.pi * 0.5,
	[96] = math.pi * 0.75,
	[128] = math.pi,
	[159] = -math.pi * 0.75,
	[191] = -math.pi * 0.5,
	[223] = -math.pi * 0.25,
	[255] = 0
}

local TAU = 2 * math.pi
local RAD2U8 = 40.5845104884

-- DFS search offsets
local DFSWeldSearchXSizeOffset = Vector3.new(1 + EPSILON, 1 - EPSILON, 1 - EPSILON)
local DFSWeldSearchYSizeOffset = Vector3.new(1 - EPSILON, 1 + EPSILON, 1 - EPSILON)
local DFSWeldSearchZSizeOffset = Vector3.new(1 - EPSILON, 1 - EPSILON, 1 + EPSILON)

-- Pre-allocated instances
local overlapParams = OverlapParams.new()
local raycastParams = RaycastParams.new()
raycastParams.FilterType = Enum.RaycastFilterType.Include
local IntersectingPart = Instance.new("Part")

-- Shatterbox Class
local Shatterbox = {}
Shatterbox.__index = Shatterbox

Shatterbox.VertexMath = VertexMath
Shatterbox.DefaultEffects = Effects
Shatterbox.Settings = DefaultSettings :: Settings
Shatterbox.USE_CLIENT_SERVER = DefaultSettings.USE_CLIENT_SERVER :: boolean
Shatterbox.started = false

--[[ CONSTRUCTOR ]]--

function Shatterbox.new (settings: { [string]: unknown })
	local self = setmetatable({}, Shatterbox)
	
	-- Settings
	self.Settings = settings or DefaultSettings
	self.USE_CLIENT_SERVER = self:UseSetting('USE_CLIENT_SERVER') :: boolean
	
	-- State tracking
	self.started = false
	
	-- Network events
	self.ClientEvents = nil
	self.ServerEvents = nil
	self.mapContainer = nil
	
	-- Registry for voxel destruction callbacks
	self.OnVoxelDestructRegistry = setmetatable({}, {
		__index = function(tbl, k) return (k and rawget(tbl, k:lower())) end
	})
	
	-- Dirty group tracking
	self.DirtyGroupData = {}
	self.DirtyGroupMembers = {}
	self.SmoothCleanupQueue = {}
	
	-- Operation tracking
	self.ShatterQueue = {}
	self.CountOperationsProcessing = {}
	self.OperationAffectedDirtyGroups = {}
	self.OperationBlacklistedVoxels = {}
	self.OperationAffectedFallingGroups = {}
	
	-- Greedy meshing
	self.GreedyMeshingQueue = {}
	self.GreedyWorkers = {}
	self.GreedyWorkersTerminationFlags = {}
	self.ActiveGMWorkerCount = 0
	self.ActiveGMWorkerGridSize = {}
	
	-- Puppet system
	self.Puppets = {}
	self.PuppetsLerpData = {}
	self.PuppetNextIndex = 1
	self.PuppetNextReplicationIndex = 1
	self.CreatePuppetQueue = {}
	self.ClientPuppetStepDelta = 1
	self.puppetTimeAccumulation = 0
	self.FakePuppetOverrideIndex = 1
	
	-- Falling groups
	self.FallingGroupMembers = {}
	self.FallingGroupSectionAnchors = {}
	
	-- Frame tracking
	self.frameDivs = 0
	self.clientInitComplete = false
	
	-- Debug counters
	self.ci = 0
	self.cd = 0
	
	-- Object cache (currently unused)
	self.ObjectCache = nil
	self.CachedParts = nil
	
	return self
end

--[[ UTILITY FUNCTIONS ]]--

function Shatterbox.FindHumanoidAsAncestorChild(self: Shatterbox, i: Instance)
	while i do
		local hum = i:FindFirstChildWhichIsA("Humanoid")
		if hum then return hum end
		i = i.Parent :: Instance
	end
	return nil
end

function Shatterbox.ShouldSkipInstance(self: Shatterbox, i: Instance)
	local SkipInstanceCheck: (i: Instance) -> boolean = self:UseSetting('SkipInstanceCheck')
	if SkipInstanceCheck(i) then return true end
	if isClient and (not i:IsA("Part") or i.Shape ~= Enum.PartType.Block) then return true end
	if i:HasTag(IndestructibleTag) then return true end
	if self:FindHumanoidAsAncestorChild(i) then return true end
	return false
end

function Shatterbox:FindFirstAncestorGroup(i: Instance): (Folder|Model)?
	local Ancestor = i.Parent
	while Ancestor and not (Ancestor:IsA("Folder") or Ancestor:IsA("Model")) do 
		Ancestor = Ancestor.Parent 
	end
	return Ancestor
end

function Shatterbox:AncestorGroupTags(i: Instance): {string}
	local tags = {}
	local Ancestor = self:FindFirstAncestorGroup(i)
	
	while Ancestor do
		local t = Ancestor:GetTags()
		local found = table.find(t, FallingGroupTag)
		if found then table.remove(t, found) end
		
		if #t > 0 then
			table.move(t, 1, #t, #tags + 1, tags)
		end
		Ancestor = self:FindFirstAncestorGroup(Ancestor)
	end
	
	return tags
end

function Shatterbox:FindFirstAncestorGroupWithTag(i: Instance, tag: string): Instance?
	local Ancestor = self:FindFirstAncestorGroup(i)
	while Ancestor and not Ancestor:HasTag(tag) do 
		Ancestor = self:FindFirstAncestorGroup(Ancestor) 
	end
	return Ancestor
end

function Shatterbox:OverlapParamsOfTagged(tags: {string}): OverlapParams
	local arr
	
	if #tags == 1 then
		arr = CollectionService:GetTagged(tags[1])
	else
		arr = {}
		for _, tag in ipairs(tags) do
			local taggedArray = CollectionService:GetTagged(tag)
			table.move(taggedArray, 1, #taggedArray, #arr + 1, arr)
		end
	end
	
	overlapParams.FilterType = Enum.RaycastFilterType.Include
	overlapParams.FilterDescendantsInstances = arr
	
	return overlapParams
end

--[[ PART MANAGEMENT ]]--

function Shatterbox:InstantiatePart(DirtyGroupID, cframe, size)
	local dirtyGroupData = self.DirtyGroupData[DirtyGroupID]
	local dirtyGroupMembers = self.DirtyGroupMembers[DirtyGroupID]

	local part = PartFromTemplate(dirtyGroupData.OriginalPart, cframe, self.CachedParts)
	part.Size = size

	local partIsDivisible = part:IsA("Part") and part.Shape == Enum.PartType.Block

	if not self.USE_CLIENT_SERVER or not partIsDivisible then
		part.Parent = dirtyGroupData.OriginalParent
	else
		part.Parent = self.mapContainer
	end

	if partIsDivisible and part:FindFirstChildWhichIsA("Texture") then
		local OriginalPart = dirtyGroupData.OriginalPart
		local HalfSizeOriginal = OriginalPart.Size * 0.5
		local HalfSizePart = part.Size * 0.5

		for _, texture in ipairs(part:GetChildren()) do
			if not texture:IsA("Texture") then continue end
			local Face = texture.Face.Value
			local TowardOrigin = textUVMap[Face]

			local GroupOrigin = OriginalPart.CFrame + OriginalPart.CFrame:VectorToWorldSpace(TowardOrigin * HalfSizeOriginal)
			local partOrigin = part.CFrame + part.CFrame:VectorToWorldSpace(TowardOrigin * HalfSizePart)

			local Offset = partOrigin:VectorToObjectSpace(GroupOrigin.Position - partOrigin.Position):Abs()

			texture.OffsetStudsU += Offset[axisUVMap[Face][1]]
			texture.OffsetStudsV += Offset[axisUVMap[Face][2]]
		end
	end

	dirtyGroupMembers[part] = true
	self.ci += 1
	
	return part
end

function Shatterbox:DestroyPart(part)
	local DirtyGroupID = part:GetAttribute(DirtyGroupIDAttribute)
	if not DirtyGroupID then return end

	local dirtyGroupData = self.DirtyGroupData[DirtyGroupID]
	local dirtyGroupMembers = self.DirtyGroupMembers[DirtyGroupID]

	if part == dirtyGroupData.OriginalPart then
		part.Parent = nil
	else
		dirtyGroupMembers[part] = nil
		part:Destroy()
	end

	self.cd += 1
end

function Shatterbox:PopulateDirtyGroup(Part: Part, DirtyGroupID: string?)
	DirtyGroupID = DirtyGroupID or HttpService:GenerateGUID(false)
	Part:SetAttribute(DirtyGroupIDAttribute, DirtyGroupID)
	
	self.DirtyGroupData[DirtyGroupID] = {
		OriginalPart = Part,
		OriginalParent = Part.Parent,
		GridSize = Part:GetAttribute("GridSize")
	}
	self.DirtyGroupMembers[DirtyGroupID] = {}

	if self.USE_CLIENT_SERVER and Part:IsA("Part") and Part.Shape == Enum.PartType.Block then
		for _, tag in ipairs(self:AncestorGroupTags(Part)) do 
			Part:AddTag(tag) 
		end
		Part.Parent = self.mapContainer
	end

	return DirtyGroupID
end

function Shatterbox.UndoDirtyGroup(self: Shatterbox, DirtyGroupID: string)
	local groupData = self.DirtyGroupData[DirtyGroupID]
	local groupMembers = self.DirtyGroupMembers[DirtyGroupID]

	local useGreedyMeshing = self:UseSetting('UseGreedyMeshing')

	if useGreedyMeshing and self.GreedyWorkers[DirtyGroupID] then
		self.GreedyWorkersTerminationFlags[DirtyGroupID] = true
		repeat RunService.Heartbeat:Wait() until not self.GreedyWorkers[DirtyGroupID]
	end

	local OriginalPart = groupData.OriginalPart
	if not self.USE_CLIENT_SERVER or not OriginalPart:IsA("Part") or OriginalPart.Shape ~= Enum.PartType.Block then
		OriginalPart.Parent = groupData.OriginalParent
	else
		OriginalPart.Parent = self.mapContainer
	end

	for member in pairs(groupMembers) do 
		self:DestroyPart(member) 
	end
	self.DirtyGroupMembers[DirtyGroupID] = {}
end

--[[ GREEDY MESHING ]]--

function Shatterbox.QueueGreedyMeshing(self: Shatterbox, DirtyGroupID: string, GridSize: number)
	if self.GreedyWorkers[DirtyGroupID] then 
		self.GreedyWorkersTerminationFlags[DirtyGroupID] = true 
	end

	local previousGridSize = self.GreedyMeshingQueue[DirtyGroupID]
	self.GreedyMeshingQueue[DirtyGroupID] = previousGridSize and math.min(GridSize, previousGridSize) or GridSize
end

function Shatterbox.InitGreedyState(self: Shatterbox, part, GridSize, groupMin, State, DIMYDIMZ, DIMZ)
	local minCFrame, _, S, _, _, _, NVX, NVY, NVZ = GridInfo(part.CFrame:Orthonormalize(), part.Size, GridSize)

	if not minCFrame.Rotation:FuzzyEq(groupMin.Rotation, EPSILON) then
		return 0
	end

	local off = minCFrame.Position - groupMin.Position

	local ODX = off:Dot(groupMin.XVector) / S.X
	local ODY = off:Dot(groupMin.YVector) / S.Y
	local ODZ = off:Dot(groupMin.ZVector) / S.Z
	
	local DX = math.floor(ODX + 0.5)
	local DY = math.floor(ODY + 0.5)
	local DZ = math.floor(ODZ + 0.5)

	if math.abs(DX - ODX) > EPSILON or math.abs(DY - ODY) > EPSILON or math.abs(DZ - ODZ) > EPSILON then
		return 0
	end

	DX -= 1
	DY -= 1

	local traversed = 0
	for X = 1, NVX do
		local dixz = (X + DX) * DIMYDIMZ + DZ
		for Y = 1, NVY do
			local di = dixz + (Y + DY) * DIMZ
			for Z = 1, NVZ do
				if traversed == self:UseSetting('GMTraversalsPerFrame') then
					coroutine.yield()
					traversed = 0
				end

				State[di + Z] = true
				traversed += 1
			end
		end
	end

	DX += 1
	DY += 1

	return {1 + DX, 1 + DY, 1 + DZ, DX + NVX, DY + NVY, DZ + NVZ}, NVX * NVY * NVZ
end

function Shatterbox:GreedyMeshWorker(DirtyGroupID: string, GridSize: number?)
	local dirtyGroupData = self.DirtyGroupData[DirtyGroupID]
	local dirtyGroupMembers = self.DirtyGroupMembers[DirtyGroupID]
	local Original = dirtyGroupData.OriginalPart

	local groupMin, _, VoxelSize, _, _, _, DIMX, DIMY, DIMZ = GridInfo(Original.CFrame, Original.Size, GridSize)
	local DIMYDIMZ = DIMY * DIMZ
	local VSX, VSY, VSZ = VoxelSize.X, VoxelSize.Y, VoxelSize.Z

	local State, Visited = {}, {}
	local OriginalPartsInfo = {}
	local count = 0

	for member in pairs(dirtyGroupMembers) do
		if member:HasTag(DebrisTag) then continue end

		local gridInfo, n = self:InitGreedyState(member, GridSize, groupMin, State, DIMYDIMZ, DIMZ)
		if n > 0 then
			count += n
			table.insert(OriginalPartsInfo, {
				Part = member,
				PartGridInfo = gridInfo,
				Contributed = {}
			})
		end
	end

	local meshed = {}
	local traversed = 0
	local sx, sy, sz = 1, 1, 1

	-- Greedy meshing algorithm
	while count > 0 do
		local X, Y, Z = sx, sy, sz
		local iyz = (Y - 1) * DIMZ + Z
		local si = (X - 1) * DIMYDIMZ + iyz

		while Visited[si] or not State[si] do
			if traversed == self:UseSetting('GMTraversalsPerFrame') then
				coroutine.yield()
				traversed = 0
			end

			if X < DIMX then
				X += 1
			else
				X = 1
				if Y < DIMY then
					Y += 1
				else
					Y = 1
					if Z < DIMZ then
						Z += 1
					else
						Z = 1
					end
				end
				iyz = (Y - 1) * DIMZ + Z
			end

			traversed += 1
			si = (X - 1) * DIMYDIMZ + iyz
		end
		sx, sy, sz = X, Y, Z
		Visited[si] = true

		-- Planar expansion along X axis
		while X < DIMX do
			local DX = X + 1
			if traversed == self:UseSetting('GMTraversalsPerFrame') then
				coroutine.yield()
				traversed = 0
			end

			local index = (DX - 1) * DIMYDIMZ + (Y - 1) * DIMZ + Z
			if Visited[index] or not State[index] then break end

			Visited[index] = true
			traversed += 1
			X = DX
		end

		-- Planar expansion along Y axis
		while Y < DIMY do
			local DY = Y + 1
			local iyz = (DY - 1) * DIMZ + Z
			local breakExpansion = false
			local indices = {}

			for ix = sx, X do
				if traversed == self:UseSetting('GMTraversalsPerFrame') then
					coroutine.yield()
					traversed = 0
				end

				local index = (ix - 1) * DIMYDIMZ + iyz
				if Visited[index] or not State[index] then
					breakExpansion = true
					break
				end

				indices[index] = true
				traversed += 1
			end

			if breakExpansion then break end

			for index in pairs(indices) do
				Visited[index] = true
			end

			Y = DY
		end

		-- Planar expansion along Z axis
		while Z < DIMZ do
			local DZ = Z + 1
			local breakExpansion = false
			local indices = {}

			for ix = sx, X do
				local ixz = (ix - 1) * DIMYDIMZ + DZ
				for iy = sy, Y do
					if traversed == self:UseSetting('GMTraversalsPerFrame') then
						coroutine.yield()
						traversed = 0
					end

					local index = ixz + (iy - 1) * DIMZ
					if Visited[index] or not State[index] then
						breakExpansion = true
						break
					end

					indices[index] = true
					traversed += 1
				end

				if breakExpansion then break end
			end

			if breakExpansion then break end

			for index in pairs(indices) do
				Visited[index] = true
			end

			Z = DZ
		end

		local NX, NY, NZ = X - sx + 1, Y - sy + 1, Z - sz + 1
		count -= NX * NY * NZ

		table.insert(meshed, {
			CFrame = (groupMin + groupMin.XVector * VSX * ((X + sx) * 0.5 - 1) + groupMin.YVector * VSY * ((Y + sy) * 0.5 - 1) + groupMin.ZVector * VSZ * ((Z + sz) * 0.5 - 1)):Orthonormalize(),
			Size = VoxelSize * Vector3.new(NX, NY, NZ),
			Contributed = {},
			MINX = sx,
			MINY = sy,
			MINZ = sz,
			MAXX = X,
			MAXY = Y,
			MAXZ = Z
		})
	end

	-- Process voxel count contributions
	for meshedIndex, MI in ipairs(meshed) do
		local contributedToMeshed = MI.Contributed
		local MINX, MINY, MINZ = MI.MINX, MI.MINY, MI.MINZ
		local MAXX, MAXY, MAXZ = MI.MAXX, MI.MAXY, MI.MAXZ

		for i, partInfo in ipairs(OriginalPartsInfo) do
			local PMINX, PMINY, PMINZ, PMAXX, PMAXY, PMAXZ = unpack(partInfo.PartGridInfo)

			if math.max(PMINX, MINX) > math.min(PMAXX, MAXX) or 
			   math.max(PMINY, MINY) > math.min(PMAXY, MAXY) or 
			   math.max(PMINZ, MINZ) > math.min(PMAXZ, MAXZ) then 
				continue 
			end

			table.insert(contributedToMeshed, i)
			table.insert(partInfo.Contributed, meshedIndex)
		end
	end

	local InstancedMeshIDs, numInstanced, numMeshed = {}, 0, #meshed
	count = 0

	-- Dual DFS for smooth display of meshing
	while numInstanced < numMeshed do
		if count >= self:UseSetting('GMPartCreationsPerFrame') then
			coroutine.yield()
			count = 0
		end

		local startIndex
		for i, meshedInfo in ipairs(meshed) do
			if InstancedMeshIDs[i] then continue end
			if #meshedInfo.Contributed == 1 then
				InstancedMeshIDs[i] = true
				numInstanced += 1
				continue
			end
			startIndex = i
			break
		end

		local visitedOriginals, visitedMeshed, pathStack = {}, {[startIndex] = true}, {startIndex}

		while #pathStack > 0 do
			local mi = table.remove(pathStack)
			local meshedInfo = meshed[mi]

			for _, io in ipairs(meshedInfo.Contributed) do
				if visitedOriginals[io] then continue end
				visitedOriginals[io] = true

				local partInfo = OriginalPartsInfo[io]

				for _, im in ipairs(partInfo.Contributed) do
					if visitedMeshed[im] then continue end
					visitedMeshed[im] = true
					table.insert(pathStack, im)
				end
			end
		end

		for meshedID in pairs(visitedMeshed) do
			InstancedMeshIDs[meshedID] = true
			numInstanced += 1

			local meshedInfo = meshed[meshedID]
			self:InstantiatePart(DirtyGroupID, meshedInfo.CFrame, meshedInfo.Size)

			count += 1
		end

		for originalID in pairs(visitedOriginals) do
			self:DestroyPart(OriginalPartsInfo[originalID].Part)
		end
	end
end

function Shatterbox:GreedyMeshingBehavior()
	if self.ActiveGMWorkerCount < self:UseSetting('GMWorkerCount') then
		local toRemove = {}
		for DirtyGroupID, GridSize in pairs(self.GreedyMeshingQueue) do
			if self.CountOperationsProcessing[DirtyGroupID] or self.GreedyWorkers[DirtyGroupID] then continue end
			if not next(self.DirtyGroupMembers[DirtyGroupID]) then
				toRemove[DirtyGroupID] = true
				continue
			end
			
			local thr = coroutine.create(function()
				self:GreedyMeshWorker(DirtyGroupID, GridSize)
			end)

			toRemove[DirtyGroupID] = true
			self.GreedyWorkers[DirtyGroupID] = thr
			self.ActiveGMWorkerCount += 1
			self.ActiveGMWorkerGridSize[DirtyGroupID] = GridSize

			coroutine.resume(thr)

			if self.ActiveGMWorkerCount >= self:UseSetting('GMWorkerCount') then break end
		end
		for DirtyGroupID in pairs(toRemove) do 
			self.GreedyMeshingQueue[DirtyGroupID] = nil 
		end
	end

	for DirtyGroupID, thr in pairs(self.GreedyWorkers) do
		local status = coroutine.status(thr)

		if status == "dead" or (status == "suspended" and self.GreedyWorkersTerminationFlags[DirtyGroupID]) then
			self.GreedyWorkersTerminationFlags[DirtyGroupID] = nil
			self.GreedyWorkers[DirtyGroupID] = nil
			self.ActiveGMWorkerCount -= 1
			self.ActiveGMWorkerGridSize[DirtyGroupID] = nil
		elseif status == "suspended" then
			coroutine.resume(thr)
		end
	end
end

--[[ MARKING AND DESTRUCTION ]]--

function Shatterbox:MarkDirty(Part: Part, destructionParams)
	local CreatedDirtyGroups = {}

	if Part:HasTag(DebrisTag) then return CreatedDirtyGroups end

	local VisitedDirtyGroups = {}
	local GridSize = Part:GetAttribute("GridSize")
	local PartDirtyGroupID = Part:GetAttribute(DirtyGroupIDAttribute)

	local CreatedFallingGroupID
	local fallingGroupContainer = self:FindFirstAncestorGroupWithTag(Part, FallingGroupTag)

	local PartIsDivisible = Part:IsA("Part") and Part.Shape == Enum.PartType.Block
	local NonDivisibleInteraction = self:UseSetting('NonDivisibleInteraction')

	if not Part:GetAttribute(FallingGroupIDAttribute) and fallingGroupContainer then
		CreatedFallingGroupID = HttpService:GenerateGUID(false)
		local fallingGroupMembers = {}

		for _, part in ipairs(fallingGroupContainer:GetDescendants()) do
			if not part:IsA("BasePart") then continue end

			part:SetAttribute(FallingGroupIDAttribute, CreatedFallingGroupID)
			local DirtyGroupID = self:PopulateDirtyGroup(part, nil)
			VisitedDirtyGroups[DirtyGroupID] = true

			if part:IsA("Part") and part.Shape == Enum.PartType.Block then
				CreatedDirtyGroups[DirtyGroupID] = true
			end

			part.Parent = nil
			self:InstantiatePart(DirtyGroupID, part.CFrame, part.Size)

			fallingGroupMembers[DirtyGroupID] = true
		end
		self.FallingGroupMembers[CreatedFallingGroupID] = fallingGroupMembers

	elseif not PartDirtyGroupID and (PartIsDivisible or NonDivisibleInteraction ~= "NONE") then
		PartDirtyGroupID = self:PopulateDirtyGroup(Part, nil)

		if PartIsDivisible then
			CreatedDirtyGroups[PartDirtyGroupID] = true
		end
	end

	if PartDirtyGroupID then
		VisitedDirtyGroups[PartDirtyGroupID] = true
		if self:UseSetting('UseGreedyMeshing') and not Part:GetAttribute(FallingGroupIDAttribute) and Part:IsA("Part") and Part.Shape == Enum.PartType.Block then
			self:QueueGreedyMeshing(PartDirtyGroupID, GridSize or destructionParams.GridSize or self:UseSetting('DefaultGridSize'))
		end
		if not PartIsDivisible and NonDivisibleInteraction ~= "NONE" and not next(self.DirtyGroupMembers[PartDirtyGroupID]) then
			Part.Parent = nil
			if NonDivisibleInteraction == "FALL" then
				local cloned = self:InstantiatePart(PartDirtyGroupID, Part.CFrame, Part.Size)
				cloned.Anchored = false
			end
		end
	end

	local CleanupDelay = destructionParams.CleanupDelay
	if self:UseSetting('UseSmoothCleanup') and CleanupDelay > 0 then
		for DirtyGroupID in pairs(VisitedDirtyGroups) do
			local prev = self.SmoothCleanupQueue[DirtyGroupID]
			self.SmoothCleanupQueue[DirtyGroupID] = prev and math.max(prev, CleanupDelay) or CleanupDelay
		end
	end

	return CreatedDirtyGroups, CreatedFallingGroupID
end

function Shatterbox:GetDestructibleParts(destructionParams)
	local cuttingPart, replicated = destructionParams.CuttingPart, destructionParams.replicated
	local skipFloors, skipWalls = destructionParams.SkipFloors, destructionParams.SkipWalls
	local skipFloorsOrWalls = skipFloors or skipWalls

	local partsInPart, createdDirtyGroups, createdFallingGroups = {}, {}, {}

	IntersectingPart.CFrame = cuttingPart.CFrame
	IntersectingPart.Size = cuttingPart.Size
	IntersectingPart.Shape = cuttingPart.Shape

	local AffectedFallingGroups = self.OperationAffectedFallingGroups[destructionParams.ID] or {}

	for _, part in ipairs(workspace:GetPartsInPart(IntersectingPart, destructionParams.FilterTagged and self:OverlapParamsOfTagged(destructionParams.FilterTagged))) do
		if (replicated and not part:IsDescendantOf(self.mapContainer)) or self:ShouldSkipInstance(part) then continue end

		if skipFloorsOrWalls then
			raycastParams.FilterDescendantsInstances = {part}
			local res = workspace:Raycast(cuttingPart.CFrame.Position, part.Position - cuttingPart.CFrame.Position, raycastParams)
			if res then
				local isFloor = res.Normal:FuzzyEq(Vector3.yAxis, 0.001)
				if (skipFloors and isFloor) or (skipWalls and not isFloor) then continue end
			end
		end

		local dirtyGroups, fallingGroupID = self:MarkDirty(part, destructionParams)
		for DirtyGroupID in pairs(dirtyGroups) do
			createdDirtyGroups[DirtyGroupID] = true
		end

		if fallingGroupID then 
			createdFallingGroups[fallingGroupID] = true 
		end

		fallingGroupID = part:GetAttribute(FallingGroupIDAttribute)
		if fallingGroupID then
			AffectedFallingGroups[fallingGroupID] = true
		end

		if part:IsA("Part") and part.Shape == Enum.PartType.Block then
			table.insert(partsInPart, part)
		end
	end

	if self.USE_CLIENT_SERVER and not replicated and isClient then
		local ToSendToServer = {}
		for DirtyGroupID in pairs(createdDirtyGroups) do
			local groupData = self.DirtyGroupData[DirtyGroupID]
			local PartToSend = groupData.OriginalPart
			ToSendToServer[DirtyGroupID] = PartToSend
			PartToSend.Parent = nil
			groupData.OriginalPart = PartFromTemplate(PartToSend, PartToSend.CFrame)
			groupData.OriginalPart.Parent = self.mapContainer
		end
		self.ClientEvents.CreateDirtyGroupsFromClient.Fire(ToSendToServer)
	end

	self.OperationAffectedFallingGroups[destructionParams.ID] = AffectedFallingGroups

	return partsInPart, createdDirtyGroups, createdFallingGroups
end

--[[ VALIDATION AND SERIALIZATION ]]--

function Shatterbox:SerializedCuttingPart(p)
	return {
		CFrame = p.CFrame,
		Size = p.Size,
		Shape = p.Shape.Value
	}
end

function Shatterbox.ValidateDestructionParams(self: Shatterbox, intersectingPart, FilterTagged, CleanupDelay, OnVoxelDestruct, GridSize, SkipEncapsulatedVoxels, OnDestructCompleted, UserData, ExcludePlayersReplication, SkipFloors, SkipWalls)
	local CuttingPart = {}
	local params = {}
	local tbl = {} :: { [string]: unknown }

	if typeof(intersectingPart) == "table" then
		tbl = intersectingPart
		if tbl.CuttingPart then
			local cp = tbl.CuttingPart
			if typeof(cp) == "table" or (typeof(cp) == "Instance" and cp:IsA("Part")) then
				assert(cp.CFrame and cp.Size and cp.Shape, "You must provide a CFrame, Size, and Shape for the '{ CuttingPart : { CFrame : CFrame, Size : Vector3, Shape : Enum.PartType } }' syntax.")
				CuttingPart.CFrame = cp.CFrame
				CuttingPart.Size = cp.Size
				CuttingPart.Shape = cp.Shape
			end
		else
			assert(tbl.CFrame and tbl.Size and tbl.Shape, "You must provide a CFrame, Size, and Shape for the '{ CFrame : CFrame, Size : Vector3, Shape : Enum.PartType }' syntax.")
			CuttingPart.CFrame = tbl.CFrame
			CuttingPart.Size = tbl.Size
			CuttingPart.Shape = tbl.Shape
		end
	elseif intersectingPart:IsA("Part") then
		CuttingPart.CFrame = intersectingPart.CFrame
		CuttingPart.Size = intersectingPart.Size
		CuttingPart.Shape = intersectingPart.Shape
	end

	local filterTagged = tbl.FilterTagged or FilterTagged
	if filterTagged then
		if typeof(filterTagged) == "table" then
			for _, k in pairs(filterTagged) do
				assert(typeof(k) == "string", "FilterTagged must be an array of strings only")
			end
		else
			assert(typeof(filterTagged) == "string", "FilterTagged must be a string or an array of strings")
			filterTagged = {filterTagged}
		end
	end

	local playerExclusions = tbl.ExcludePlayersReplication or ExcludePlayersReplication
	if playerExclusions then
		if typeof(playerExclusions) == "table" then
			for _, plr in ipairs(playerExclusions) do
				assert(typeof(plr) == "Instance" and plr:IsA("Player"), "If ExcludePlayersReplication is an array, it must only contain Players.")
			end
		else
			assert(typeof(playerExclusions) == "Instance" and playerExclusions:IsA("Player"), "If ExcludePlayersReplication is not an array, it must be a Player.")
			playerExclusions = {playerExclusions}
		end
	end

	params.CuttingPart = CuttingPart
	params.FilterTagged = filterTagged
	params.CleanupDelay = tbl.CleanupDelay or CleanupDelay or self:UseSetting('DefaultSmoothCleanupDelay')
	params.OnVoxelDestruct = tbl.OnVoxelDestruct or OnVoxelDestruct
	params.GridSize = tbl.GridSize or GridSize
	params.SkipEncapsulatedVoxels = tbl.SkipEncapsulatedVoxels or SkipEncapsulatedVoxels
	params.SkipFloors = tbl.SkipFloors or SkipFloors
	params.SkipWalls = tbl.SkipWalls or SkipWalls
	params.OnDestructCompleted = tbl.OnDestructCompleted or OnDestructCompleted
	params.UserData = tbl.UserData or UserData or {}
	params.ExcludePlayersReplication = playerExclusions or {}
	params.ID = tbl.ID or HttpService:GenerateGUID(false)

	assert(not params.CleanupDelay or typeof(params.CleanupDelay) == "number", "CleanupDelay must be a number if it is set.")
	assert(not params.OnVoxelDestruct or typeof(params.OnVoxelDestruct) == "string", "OnVoxelDestruct must be a string indicating the name of the OnVoxelDestruct callback.")
	assert(not params.GridSize or typeof(params.GridSize) == "number", "GridSize must be a number.")
	assert(not params.SkipEncapsulatedVoxels or typeof(params.SkipEncapsulatedVoxels) == "boolean", "SkipEncapsulatedVoxels must be a boolean.")
	assert(not params.OnDestructCompleted or typeof(params.OnDestructCompleted) == "function", "OnDestructCompleted must be a function.")

	return params
end

function Shatterbox:SerializedDestructionParams(destructionParams)
	destructionParams = table.clone(destructionParams)
	destructionParams.CuttingPart = self:SerializedCuttingPart(destructionParams.CuttingPart)
	return destructionParams
end

function Shatterbox:DeserializedDestructionParams(serialDestructionParams)
	serialDestructionParams.CuttingPart.Shape = Enum.PartType:FromValue(serialDestructionParams.CuttingPart.Shape)
	local destructionParams = self:ValidateDestructionParams(serialDestructionParams)
	destructionParams.replicated = true
	return destructionParams
end

function Shatterbox:ModelQueueBehavior(funcToUse, intersectingPart, FilterTagged, CleanupDelay, OnVoxelDestruct, GridSize, SkipEncapsulatedVoxels, OnDestructCompleted, UserData, ExcludePlayersReplication, SkipFloors, SkipWalls)
	local cuttingPart = if typeof(intersectingPart) == "table" then intersectingPart.CuttingPart else intersectingPart
	local retA, retB = {}, {}
	
	if cuttingPart and typeof(cuttingPart) == "Instance" and cuttingPart:IsA("Model") then
		for _, desc in ipairs(cuttingPart:GetDescendants()) do
			if not desc:IsA("Part") then continue end
			local rA, rB = funcToUse(self, desc, FilterTagged, CleanupDelay, OnVoxelDestruct, GridSize, SkipEncapsulatedVoxels, OnDestructCompleted, UserData, ExcludePlayersReplication, SkipFloors, SkipWalls)
			if rA then
				table.move(rA, 1, #rA, #retA + 1, retA)
			end
			if rB then
				table.move(rB, 1, #rB, #retB + 1, retB)
			end
		end
		return true, retA, retB
	end
	return false, retA, retB
end

--[[ FALLING GROUPS (DFS WELDING) ]]--

function Shatterbox:DFSWeld(FallingGroupID)
	local sectionAnchors = self.FallingGroupSectionAnchors[FallingGroupID] or {}
	for _, part in ipairs(sectionAnchors) do
		part:Destroy()
	end

	local toProcess = {}
	for DirtyGroupID in pairs(self.FallingGroupMembers[FallingGroupID]) do
		for Part in pairs(self.DirtyGroupMembers[DirtyGroupID]) do
			table.insert(toProcess, Part)
		end
	end

	while #toProcess > 0 do
		local StartingPart = table.remove(toProcess)
		local SectionMembers = {}
		local visited, pathStack = {[StartingPart] = true}, {StartingPart}

		while #pathStack > 0 do
			local currentPart = table.remove(pathStack)
			local c, s = currentPart.CFrame, currentPart.Size

			table.insert(SectionMembers, currentPart)

			local nodeVisited = {}

			for _, inAxis in ipairs(workspace:GetPartBoundsInBox(c, s + DFSWeldSearchXSizeOffset)) do
				local inAxisFallingGroup = inAxis:GetAttribute(FallingGroupIDAttribute)
				if (inAxisFallingGroup and inAxisFallingGroup ~= FallingGroupID) or visited[inAxis] or inAxis == currentPart or self:FindHumanoidAsAncestorChild(inAxis) then continue end
				visited[inAxis] = true
				table.insert(SectionMembers, inAxis)
				nodeVisited[inAxis] = true

				if not inAxisFallingGroup or self:ShouldSkipInstance(inAxis) then continue end
				table.insert(pathStack, inAxis)
			end

			for _, inAxis in ipairs(workspace:GetPartBoundsInBox(c, s + DFSWeldSearchYSizeOffset)) do
				local inAxisFallingGroup = inAxis:GetAttribute(FallingGroupIDAttribute)
				if (inAxisFallingGroup and inAxisFallingGroup ~= FallingGroupID) or visited[inAxis] or nodeVisited[inAxis] or inAxis == currentPart or self:FindHumanoidAsAncestorChild(inAxis) then continue end
				visited[inAxis] = true
				table.insert(SectionMembers, inAxis)
				nodeVisited[inAxis] = true

				if not inAxisFallingGroup or self:ShouldSkipInstance(inAxis) then continue end
				table.insert(pathStack, inAxis)
			end

			for _, inAxis in ipairs(workspace:GetPartBoundsInBox(c, s + DFSWeldSearchZSizeOffset)) do
				local inAxisFallingGroup = inAxis:GetAttribute(FallingGroupIDAttribute)
				if (inAxisFallingGroup and inAxisFallingGroup ~= FallingGroupID) or visited[inAxis] or nodeVisited[inAxis] or inAxis == currentPart or self:FindHumanoidAsAncestorChild(inAxis) then continue end
				visited[inAxis] = true
				table.insert(SectionMembers, inAxis)

				if not inAxisFallingGroup or self:ShouldSkipInstance(inAxis) then continue end
				table.insert(pathStack, inAxis)
			end
		end

		local SectionAnchor = Instance.new("Part")
		SectionAnchor.Size = Vector3.one
		SectionAnchor.Transparency = 1
		SectionAnchor.CanCollide = false
		SectionAnchor.CanQuery = false
		SectionAnchor.Parent = workspace

		local avgPos = Vector3.zero
		for _, Part in ipairs(SectionMembers) do
			avgPos += Part.Position

			local found = table.find(toProcess, Part)
			if found then table.remove(toProcess, found) end
		end
		avgPos /= #SectionMembers

		SectionAnchor.CFrame = CFrame.new(avgPos)
		local InverseSectionAnchorCF = SectionAnchor.CFrame:Inverse()

		for _, Part in ipairs(SectionMembers) do
			local weld = Instance.new("Weld")
			weld.C0 = InverseSectionAnchorCF
			weld.C1 = Part.CFrame:Inverse()
			weld.Part0 = SectionAnchor
			weld.Part1 = Part
			weld.Parent = SectionAnchor
		end

		for _, Part in ipairs(SectionMembers) do
			if Part:GetAttribute(FallingGroupIDAttribute) then 
				Part.Anchored = false 
			end
		end

		table.insert(sectionAnchors, SectionAnchor)
	end

	self.FallingGroupSectionAnchors[FallingGroupID] = sectionAnchors
end

--[[ IMAGINARY VOXELS ]]--

function Shatterbox:ImaginaryVoxels_Internal(params, frameLimit, toDestroy)
	local voxels, existingDebris = {}, {}
	local voxelCount = 0

	toDestroy = toDestroy or self:GetDestructibleParts(params)

	if #toDestroy == 0 then return voxels, existingDebris end

	local partsInPart = {}
	for i, part in ipairs(toDestroy) do
		if part:HasTag(DebrisTag) then
			table.insert(existingDebris, part)
			continue
		end

		part.CanQuery = false

		local DirtyGroupID = part:GetAttribute(DirtyGroupIDAttribute)

		table.insert(partsInPart, {
			CFrame = part.CFrame,
			Size = part.Size,
			DestructionID = params.ID,
			DirtyGroupID = DirtyGroupID,
			GridSize = params.GridSize or self.DirtyGroupData[DirtyGroupID].GridSize or self:UseSetting('DefaultGridSize')
		})
	end

	local cuttingPart = params.CuttingPart
	local cpcf, cps, cpsh = cuttingPart.CFrame, cuttingPart.Size, cuttingPart.Shape.Name
	local iBl, iBa, iC = cpsh == "Block", cpsh == "Ball", cpsh == "Cylinder"

	local intersectingVerts, intersectingNormals
	if iBl or iC then
		intersectingVerts = BlockVerts(cpcf, cps)
		intersectingNormals = BlockNormals(cpcf)
	elseif not iBa then
		intersectingVerts = GetVerts[cpsh](cpcf, cps)
		intersectingNormals = GetNormals[cpsh](cpcf, cps)
	end

	local dividing = partsInPart
	local creating = {}

	while #dividing > 0 do
		if frameLimit and self.frameDivs > self:UseSetting('MaxDivisionsPerFrame') then
			table.move(dividing, 1, #dividing, #creating + 1, creating)
			break
		end

		local toDivide = table.remove(dividing, 1)
		local verts = BlockVerts(toDivide.CFrame, toDivide.Size)

		local intersected = PartContainsAVert(cuttingPart, verts)

		if not intersected then
			if iBa then
				intersected = VertexMath.BallIntersectsBlock(cpcf, cps, toDivide.CFrame, toDivide.Size)
			elseif iC then
				intersected = VertexMath.CylinderIntersectsBlock(cpcf, cps, intersectingVerts, intersectingNormals, toDivide.CFrame, toDivide.Size, verts, BlockNormals(toDivide.CFrame))
			else
				intersected = VertexMath.SAT(intersectingVerts, intersectingNormals, verts, BlockNormals(toDivide.CFrame))
			end
		else
			table.remove(verts, intersected)
		end

		if intersected then
			local s, gridSize, DirtyGroupID, destructionID = toDivide.Size, toDivide.GridSize, toDivide.DirtyGroupID, toDivide.DestructionID

			local voxelCountAxis = Vector3.one:Max(s // gridSize)
			local toDivideVoxelContributions = voxelCountAxis.X * voxelCountAxis.Y * voxelCountAxis.Z

			if toDivideVoxelContributions == 1 then
				voxelCount += toDivideVoxelContributions
				table.insert(voxels, toDivide)
				continue
			end

			if PartContainsAllVerts(cuttingPart, verts or BlockVerts(toDivide.CFrame, toDivide.Size)) then
				voxelCount += toDivideVoxelContributions

				if params.SkipEncapsulatedVoxels then continue end

				local newVoxels = ImaginaryVoxelize(toDivide, gridSize)
				for _, created in ipairs(newVoxels) do
					created.GridSize = gridSize
					created.DirtyGroupID = DirtyGroupID
					created.DestructionID = destructionID
				end
				table.move(newVoxels, 1, #newVoxels, #voxels + 1, voxels)

				continue
			end

			if frameLimit then self.frameDivs += 1 end

			toDivide.isEdge = true

			local sx, sy, sz = s.X, s.Y, s.Z
			local minsize, maxsize = math.min(sx, sy, sz), math.max(sx, sy, sz)

			for _, created in ipairs(SubdivideFunctions[(maxsize > 2 * minsize) and "KD" or "MOT"](toDivide, gridSize)) do
				if PartContainsAllVerts(cuttingPart, BlockVerts(created.CFrame, created.Size)) then
					local countAxis = Vector3.one:Max(created.Size // gridSize)
					voxelCount += countAxis.X * countAxis.Y * countAxis.Z

					if params.SkipEncapsulatedVoxels then continue end

					local newVoxels = ImaginaryVoxelize(created, gridSize)
					for _, v in ipairs(newVoxels) do
						v.GridSize = gridSize
						v.DirtyGroupID = DirtyGroupID
						v.DestructionID = destructionID
					end
					table.move(newVoxels, 1, #newVoxels, #voxels + 1, voxels)

					continue
				end

				created.GridSize = gridSize
				created.DirtyGroupID = DirtyGroupID
				created.DestructionID = destructionID
				created.isEdge = true
				table.insert(dividing, created)
			end
		else
			table.insert(creating, toDivide)
		end
	end

	for _, ibox in ipairs(creating) do
		self:InstantiatePart(ibox.DirtyGroupID, ibox.CFrame, ibox.Size)
	end

	for _, part in ipairs(toDestroy) do
		if table.find(existingDebris, part) then continue end
		self:DestroyPart(part)
	end

	for FallingGroupID in pairs(self.OperationAffectedFallingGroups[params.ID]) do
		self:DFSWeld(FallingGroupID)
	end

	return setmetatable(voxels, {__len = function() return voxelCount end}), existingDebris
end

--[[ VOXEL DESTRUCTION HANDLING ]]--

function Shatterbox:HandleVoxelDestruction(callbackName: string?, voxel: Part, info)
	if not info then info = {} end

	local s, e = pcall(self.OnVoxelDestructRegistry[callbackName], voxel, info)

	if not s then warn("Voxel destruction failed: " .. e) end

	if not info.IsAlreadyDebris then voxel:AddTag(DebrisTag) end
end

function Shatterbox:PopShatterQueue()
	local popped, shatterPart, partsInPart
	local v = table.remove(self.ShatterQueue)

	while v and not popped do
		local DestructionID = v.ID
		local AffectedDirtyGroupIDs = self.OperationAffectedDirtyGroups[DestructionID]
		local BlacklistedVoxels = self.OperationBlacklistedVoxels[DestructionID]

		shatterPart, partsInPart = v.CuttingPart, {}

		for _, part in ipairs(self:GetDestructibleParts(v)) do
			if part:HasTag(DebrisTag) then
				if not BlacklistedVoxels[part] then
					BlacklistedVoxels[part] = true
					self:HandleVoxelDestruction(v.OnVoxelDestruct, part, {
						DirtyGroupID = part:GetAttribute(DirtyGroupIDAttribute),
						CuttingPart = shatterPart,
						IsEdge = not PartEncapsulatesBlockPart(shatterPart, part.CFrame, part.Size),
						IsAlreadyDebris = true,
						UserData = v.UserData
					})
				end
				continue
			end

			table.insert(partsInPart, part)
		end

		if #partsInPart == 0 then
			if v.OnDestructCompleted then 
				v.OnDestructCompleted(v.DestroyedVoxels, AffectedDirtyGroupIDs) 
			end

			for DirtyGroupID in pairs(AffectedDirtyGroupIDs) do
				local count = self.CountOperationsProcessing[DirtyGroupID] - 1
				self.CountOperationsProcessing[DirtyGroupID] = count > 0 and count or nil
			end
			self.OperationAffectedDirtyGroups[DestructionID] = nil
			self.OperationAffectedFallingGroups[DestructionID] = nil
			self.OperationBlacklistedVoxels[DestructionID] = nil

			v = table.remove(self.ShatterQueue)
		else
			popped = v
			table.insert(self.ShatterQueue, self:UseSetting('UsePriorityQueue') and math.max(1, #self.ShatterQueue + 1 - self:UseSetting('PrioritizeRecentN')) or 1, popped)
		end
	end

	return popped, partsInPart
end

function Shatterbox:ShatterWorker()
	local popped, partsInPart = self:PopShatterQueue()
	if not popped then return false end

	local blacklistedVoxels = self.OperationBlacklistedVoxels[popped.ID]

	local ivoxels = self:ImaginaryVoxels_Internal(popped, true, partsInPart)
	popped.DestroyedVoxels += #ivoxels

	local OnVoxelDestruct = popped.OnVoxelDestruct
	if self.OnVoxelDestructRegistry[OnVoxelDestruct] then
		local CuttingPart, UserData = popped.CuttingPart, popped.UserData
		for _, ivoxel in ipairs(ivoxels) do
			local voxel = self:InstantiateImaginaryVoxel(ivoxel, true)

			blacklistedVoxels[voxel] = true

			self:HandleVoxelDestruction(OnVoxelDestruct, voxel, {
				DirtyGroupID = ivoxel.DirtyGroupID,
				CuttingPart = CuttingPart,
				IsEdge = ivoxel.isEdge,
				IsAlreadyDebris = false,
				UserData = UserData
			})
		end
	end

	return true
end

--[[ SMOOTH CLEANUP ]]--

function Shatterbox:SmoothCleanupBehavior(deltaTime)
	local toReset = {}

	for DirtyGroupID, countdown in pairs(self.SmoothCleanupQueue) do
		countdown -= deltaTime
		if countdown > 0 then
			self.SmoothCleanupQueue[DirtyGroupID] = countdown
		else
			table.insert(toReset, DirtyGroupID)
		end
	end

	local waitingToTerminate = {}

	for _, DirtyGroupID in ipairs(toReset) do
		if self.CountOperationsProcessing[DirtyGroupID] then continue end

		if self.GreedyMeshingQueue[DirtyGroupID] then 
			self.GreedyMeshingQueue[DirtyGroupID] = nil 
		end
		if self.GreedyWorkers[DirtyGroupID] then
			waitingToTerminate[DirtyGroupID] = true
			continue
		end

		self.SmoothCleanupQueue[DirtyGroupID] = nil
		self:UndoDirtyGroup(DirtyGroupID)
	end

	while RunService.Heartbeat:Wait() do
		local allDone = true
		for DirtyGroupID in pairs(waitingToTerminate) do
			if self.GreedyWorkers[DirtyGroupID] then
				allDone = false
				break
			end
		end
		if allDone then break end
	end

	for DirtyGroupID in pairs(waitingToTerminate) do
		self.SmoothCleanupQueue[DirtyGroupID] = nil
		self:UndoDirtyGroup(DirtyGroupID)
	end
end

--[[ PUPPET SYSTEM ]]--

function Shatterbox:ReadRadianU8(b, bitOff)
	local X = buffer.readbits(b, bitOff, 8)
	return PRECISE_45_DEGREES[X] or (X * U82RAD)
end

function Shatterbox:ReadFloatI25(b, bitOff)
	local X = buffer.readbits(b, bitOff + 1, 24) * 0.001
	return buffer.readbits(b, bitOff, 1) == 0 and X or -X
end

function Shatterbox:WriteFloatI25(b, bitOff, x)
	local S = 0
	if x < 0 then
		S = 1
		x = -x
	end
	buffer.writebits(b, bitOff, 1, S)
	buffer.writebits(b, bitOff + 1, 24, math.round(x * 1000))
end

function Shatterbox:DeserializedPuppet(serialPuppet)
	local Part = DeserializedPartInstance(serialPuppet, self.CachedParts)
	Part.Anchored = true
	Part:AddTag(IndestructibleTag)
	Part.Parent = self.mapContainer
	return Part
end

function Shatterbox:CreatePuppets(puppets)
	for _, serialPuppet in ipairs(puppets) do
		local Part = self:DeserializedPuppet(serialPuppet)

		local OldPuppetData = self.Puppets[self.PuppetNextIndex]
		if OldPuppetData then
			OldPuppetData[1]:Destroy()
			self.PuppetsLerpData[self.PuppetNextIndex] = nil
		end

		self.Puppets[self.PuppetNextIndex] = {Part}

		self.PuppetNextIndex += 1
		if self.PuppetNextIndex > self:UseSetting('PuppetMaxCount') then
			self.PuppetNextIndex = 1
		end
	end
	self.FakePuppetOverrideIndex = self.PuppetNextIndex
end

function Shatterbox:ReplicatePuppetStates(puppetStatesBuffer, stepDelta)
	self.ClientPuppetStepDelta = stepDelta

	local bitLength = buffer.len(puppetStatesBuffer) * 8
	local bitOffset = 0

	local i = 1
	local updatedPuppets, updatedStates = {}, {}

	local clientCamPos = workspace.CurrentCamera.CFrame.Position

	local sqLimit = self:UseSetting('ClientTweenDistanceLimit') ^ 2
	local doNotTweenPuppets = not self:UseSetting('ClientTweenPuppets')
	
	while bitOffset < bitLength do
		local index = buffer.readbits(puppetStatesBuffer, bitOffset + 99, 13)
		local puppetData = self.Puppets[index]
		if puppetData then
			local cframe = CFrame.new(
				self:ReadFloatI25(puppetStatesBuffer, bitOffset),
				self:ReadFloatI25(puppetStatesBuffer, bitOffset + 25),
				self:ReadFloatI25(puppetStatesBuffer, bitOffset + 50)
			) * CFrame.fromEulerAngles(
				self:ReadRadianU8(puppetStatesBuffer, bitOffset + 75),
				self:ReadRadianU8(puppetStatesBuffer, bitOffset + 83),
				self:ReadRadianU8(puppetStatesBuffer, bitOffset + 91)
			)

			local toPlr = clientCamPos - cframe.Position
			if doNotTweenPuppets or (toPlr.X^2 + toPlr.Y^2 + toPlr.Z^2 >= sqLimit) then
				if self.PuppetsLerpData[index] then 
					self.PuppetsLerpData[index] = nil 
				end
				updatedPuppets[i] = puppetData[1]
				updatedStates[i] = cframe
				i += 1
			else
				self.PuppetsLerpData[index] = {
					puppetData[1].CFrame,
					cframe,
					0
				}
			end
		end

		bitOffset += 112
	end

	if i > 1 then 
		workspace:BulkMoveTo(updatedPuppets, updatedStates, Enum.BulkMoveMode.FireCFrameChanged) 
	end
end

function Shatterbox:DestroyPuppet(index)
	self.Puppets[index][1]:Destroy()
	self.Puppets[index] = nil
	self.PuppetsLerpData[index] = nil
end

function Shatterbox:PuppeteerBehavior(deltaTime)
	self.puppetTimeAccumulation += deltaTime
	local P = 1 / self:UseSetting('PuppetReplicationFrequency')
	
	if self.puppetTimeAccumulation >= P then
		repeat self.puppetTimeAccumulation -= P until self.puppetTimeAccumulation < P

		for i, puppetData in pairs(self.Puppets) do
			local puppetVoxel = puppetData[1]

			if puppetVoxel.Anchored then continue end

			if puppetVoxel.AssemblyLinearVelocity.Magnitude <= self:UseSetting('PuppetSleepVelocity') then
				local d = puppetData[4] + deltaTime
				if d >= self:UseSetting('PuppetAnchorTimeout') then
					puppetVoxel.Anchored = true
					table.insert(self.PuppetsLerpData[i], 1, puppetVoxel.CFrame)
					puppetData[4] = 0
				else
					puppetData[4] = d
				end
				continue
			end

			puppetData[4] = 0
			table.insert(self.PuppetsLerpData[i], 1, puppetVoxel.CFrame)
		end

		local AvailablePuppets = {}
		local StartIndex = self.PuppetNextReplicationIndex
		
		while #AvailablePuppets < 70 do
			local ReplicationIndex = self.PuppetNextReplicationIndex
			self.PuppetNextReplicationIndex += 1
			if self.PuppetNextReplicationIndex > self:UseSetting('PuppetMaxCount') then
				self.PuppetNextReplicationIndex = 1
			end
			if self.PuppetNextReplicationIndex == StartIndex then break end

			local puppetData = self.Puppets[ReplicationIndex]
			if not puppetData then continue end

			if #self.PuppetsLerpData[ReplicationIndex] == 0 then continue end

			if table.find(self.CreatePuppetQueue, puppetData[1]) then continue end

			table.insert(AvailablePuppets, ReplicationIndex)
		end

		local countToReplicate = #AvailablePuppets
		if countToReplicate > 0 then
			local puppetStates = buffer.create(countToReplicate * 14)

			for i, ReplicationIndex in ipairs(AvailablePuppets) do
				local bufferBitOffset = (i - 1) * 112

				local cframe = table.remove(self.PuppetsLerpData[ReplicationIndex])
				self:WriteFloatI25(puppetStates, bufferBitOffset, cframe.X)
				self:WriteFloatI25(puppetStates, bufferBitOffset + 25, cframe.Y)
				self:WriteFloatI25(puppetStates, bufferBitOffset + 50, cframe.Z)

				local rX, rY, rZ = cframe:ToEulerAngles()
				buffer.writebits(puppetStates, bufferBitOffset + 75, 8, math.round((rX % TAU) * RAD2U8))
				buffer.writebits(puppetStates, bufferBitOffset + 83, 8, math.round((rY % TAU) * RAD2U8))
				buffer.writebits(puppetStates, bufferBitOffset + 91, 8, math.round((rZ % TAU) * RAD2U8))

				buffer.writebits(puppetStates, bufferBitOffset + 99, 13, ReplicationIndex)
			end

			local stepDelta = 0
			for _, queuedCFrames in pairs(self.PuppetsLerpData) do
				if #queuedCFrames == 0 then continue end
				stepDelta += 1
			end
			stepDelta = stepDelta > 70 and stepDelta // 70 or 1

			self.ServerEvents.ReplicatePuppetStates.FireAll(puppetStates, stepDelta)
		end
	end

	local PQL = #self.CreatePuppetQueue
	if PQL > 0 then
		local toReplicate = table.create(PQL)
		for i, puppetToCreate in ipairs(self.CreatePuppetQueue) do
			toReplicate[i] = SerializedPartInstance(puppetToCreate)
		end
		self.CreatePuppetQueue = {}
		self.ServerEvents.CreatePuppets.FireAll(toReplicate)
	end
end

--[[ REPLICATION ]]--

function Shatterbox:CreateSerialDirtyGroups(SerialDirtyGroups)
	for DirtyGroupID, serialOriginal in pairs(SerialDirtyGroups) do
		local newPart = DeserializedPartInstance(serialOriginal)
		newPart.Parent = self.mapContainer

		self.DirtyGroupData[DirtyGroupID] = {
			OriginalPart = newPart,
			OriginalParent = self.mapContainer,
			GridSize = serialOriginal.Attributes.GridSize
		}
		self.DirtyGroupMembers[DirtyGroupID] = {}
	end
end

function Shatterbox:ReplicateDestructionToClients(destructionType, destructionParams, createdDirtyGroups)
	local serialNewDirtyGroups = {}
	for DirtyGroupID in pairs(createdDirtyGroups) do
		serialNewDirtyGroups[DirtyGroupID] = SerializedPartInstance(self.DirtyGroupData[DirtyGroupID].OriginalPart)
	end

	local exclusions = destructionParams.ExcludePlayersReplication
	if #exclusions > 0 then
		local PlayerList = Players:GetPlayers()
		for _, plr in ipairs(exclusions) do
			local found = table.find(PlayerList, plr)
			if found then table.remove(PlayerList, found) end
		end

		self.ServerEvents.ReplicateDestruction.FireList(PlayerList, destructionType, self:SerializedDestructionParams(destructionParams), serialNewDirtyGroups, self.OperationAffectedDirtyGroups[destructionParams.ID])
	else
		self.ServerEvents.ReplicateDestruction.FireAll(destructionType, self:SerializedDestructionParams(destructionParams), serialNewDirtyGroups, self.OperationAffectedDirtyGroups[destructionParams.ID])
	end
end

function Shatterbox:ReplicateDestructionFromServer(destructionType, serialParams, serialNewDirtyGroups, affectedDirtyGroupIDs)
	local destructionParams = self:DeserializedDestructionParams(serialParams)

	self:CreateSerialDirtyGroups(serialNewDirtyGroups)

	while not self.clientInitComplete do RunService.Heartbeat:Wait() end

	if destructionType == IMAGINARY then
		destructionParams.SkipEncapsulatedVoxels = true
		RunService.Heartbeat:Wait()
		self:ImaginaryVoxels_Internal(destructionParams)

	elseif destructionType == NORMAL then
		local DestructionID = destructionParams.ID

		self.OperationAffectedDirtyGroups[DestructionID] = affectedDirtyGroupIDs
		for DirtyGroupID in pairs(affectedDirtyGroupIDs) do
			self.CountOperationsProcessing[DirtyGroupID] = (self.CountOperationsProcessing[DirtyGroupID] or 0) + 1
		end
		self.OperationBlacklistedVoxels[DestructionID] = {}

		destructionParams.DestroyedVoxels = 0
		table.insert(self.ShatterQueue, destructionParams)
	end
end

function Shatterbox:ReplicateStateToPlayer(plr)
	local serialDirtyGroupData = {}
	for DirtyGroupID, groupData in pairs(self.DirtyGroupData) do
		local OriginalPart = groupData.OriginalPart

		if OriginalPart:IsA("Part") and OriginalPart.Shape == Enum.PartType.Block then
			serialDirtyGroupData[DirtyGroupID] = SerializedPartInstance(OriginalPart)
		end
	end

	local serialDirtyGroupMembers, destroyedDirtyGroups = {}, {}
	for DirtyGroupID in pairs(serialDirtyGroupData) do
		local groupMembers = self.DirtyGroupMembers[DirtyGroupID]
		local OriginalPart = self.DirtyGroupData[DirtyGroupID].OriginalPart

		local serialMembers = {}
		serialDirtyGroupMembers[DirtyGroupID] = serialMembers

		if next(groupMembers) then
			for member in pairs(groupMembers) do
				if member:HasTag(DebrisTag) then
					local found = false
					for _, puppetData in pairs(self.Puppets) do
						if puppetData[1] == member then 
							found = true 
							break 
						end
					end
					if found then continue end
				end
				table.insert(serialMembers, SerializedPartInstance(member))
			end
		elseif not OriginalPart.Parent then
			destroyedDirtyGroups[DirtyGroupID] = true
		end
	end

	local serialShatterQueue = {}
	for _, destructionParams in ipairs(self.ShatterQueue) do
		table.insert(serialShatterQueue, self:SerializedDestructionParams(destructionParams))
	end

	local serialPuppets = {}
	for puppetID, puppetData in pairs(self.Puppets) do
		serialPuppets[puppetID] = SerializedPartInstance(puppetData[1])
	end

	self.ServerEvents.ReplicateState.Fire(plr,
		serialDirtyGroupData,
		serialDirtyGroupMembers,
		destroyedDirtyGroups,
		serialShatterQueue,
		self.CountOperationsProcessing,
		self.OperationAffectedDirtyGroups,
		self.SmoothCleanupQueue,
		self.GreedyMeshingQueue,
		self.ActiveGMWorkerGridSize,
		serialPuppets,
		self.PuppetNextIndex
	)
end

function Shatterbox:ReplicateStateFromServer(serialDirtyGroupData, serialDirtyGroupMembers, destroyedDirtyGroups, serialShatterQueue, serverCountOperationsProcessing, serverOperationAffectedDirtyGroups, serverSmoothCleanupQueue, serverGreedyMeshingQueue, serverActiveGMWorkerGridSize, serialPuppets, serverPuppetsNextIndex)
	for DirtyGroupID, serializedPart in pairs(serialDirtyGroupData) do
		self.DirtyGroupData[DirtyGroupID] = {
			OriginalPart = DeserializedPartInstance(serializedPart),
			OriginalParent = self.mapContainer,
			GridSize = serializedPart.Attributes.GridSize
		}
	end

	for DirtyGroupID, serialGroupMembers in pairs(serialDirtyGroupMembers) do
		local groupMembers = {}
		self.DirtyGroupMembers[DirtyGroupID] = groupMembers

		if destroyedDirtyGroups[DirtyGroupID] then continue end

		if #serialGroupMembers == 0 then
			self.DirtyGroupData[DirtyGroupID].OriginalPart.Parent = self.mapContainer
			continue
		end

		for _, serialMember in ipairs(serialGroupMembers) do
			local part = DeserializedPartInstance(serialMember, self.CachedParts)
			if not part.Parent then part.Parent = self.mapContainer end
			groupMembers[part] = true
		end
	end

	for _, serialDestructionParams in ipairs(serialShatterQueue) do
		table.insert(self.ShatterQueue, self:DeserializedDestructionParams(serialDestructionParams))
	end
	self.CountOperationsProcessing = serverCountOperationsProcessing
	self.OperationAffectedDirtyGroups = serverOperationAffectedDirtyGroups

	self.SmoothCleanupQueue = serverSmoothCleanupQueue

	self.GreedyMeshingQueue = serverGreedyMeshingQueue
	for DirtyGroupID, GridSize in pairs(serverActiveGMWorkerGridSize) do
		local thr = coroutine.create(function()
			self:GreedyMeshWorker(DirtyGroupID, GridSize)
		end)

		self.GreedyWorkers[DirtyGroupID] = thr
		self.ActiveGMWorkerCount += 1
		self.ActiveGMWorkerGridSize[DirtyGroupID] = GridSize

		coroutine.resume(thr)
	end

	self.PuppetNextIndex = serverPuppetsNextIndex
	for puppetID, serialPuppet in pairs(serialPuppets) do
		self.Puppets[puppetID] = {self:DeserializedPuppet(serialPuppet)}
	end

	self.clientInitComplete = true
end

--[[ HEARTBEAT WORKER ]]--

function Shatterbox:HeartbeatWorker(deltaTime)
	if self:UseSetting('UseSmoothCleanup') then 
		coroutine.wrap(function()
			self:SmoothCleanupBehavior(deltaTime)
		end)()
	end

	self.frameDivs = 0
	local ops = 0

	while #self.ShatterQueue > 0 and self.frameDivs < self:UseSetting('MaxDivisionsPerFrame') and ops < self:UseSetting('MaxOpsPerFrame') do
		self:ShatterWorker()
		ops += 1
	end

	if self:UseSetting('UseGreedyMeshing') then 
		self:GreedyMeshingBehavior() 
	end

	if isServer then 
		self:PuppeteerBehavior(deltaTime) 
	end
end

--[[ PUBLIC API METHODS ]]--

function Shatterbox:Puppeteer(voxel: Part)
	assert(isServer, "This function can only be called from the server")

	voxel.Anchored = false
	voxel.Parent = self.mapContainer

	local s, e = pcall(voxel.SetNetworkOwner, voxel, nil)
	if not s then
		warn("Failed to set the network owner of the Puppet, is it welded to an anchored part?\n" .. e)
	end

	local noSleepCon
	noSleepCon = RunService.Heartbeat:Connect(function(deltaTime)
		voxel:ApplyImpulse(Vector3.yAxis * -0.00001)
	end)

	local OldPuppetData = self.Puppets[self.PuppetNextIndex]

	if OldPuppetData then
		OldPuppetData[3]:Disconnect()
		OldPuppetData[2](true)
		self:DestroyPart(OldPuppetData[1])
	end

	table.insert(self.CreatePuppetQueue, voxel)
	local QueueInsertedIndex = #self.CreatePuppetQueue
	local PuppetInsertedIndex = self.PuppetNextIndex

	local PuppetData = {
		voxel,
		function(doNotSignal)
			noSleepCon:Disconnect()

			local found
			for i = 1, QueueInsertedIndex do
				if self.CreatePuppetQueue[i] == voxel then 
					found = i 
					break 
				end
			end
			if found then table.remove(self.CreatePuppetQueue, found) end

			if doNotSignal then return end

			self.Puppets[PuppetInsertedIndex] = nil
			self.PuppetsLerpData[PuppetInsertedIndex] = nil
			self.ServerEvents.DestroyPuppet.FireAll(PuppetInsertedIndex)
		end
	}

	PuppetData[3] = voxel.Destroying:Once(PuppetData[2])
	PuppetData[4] = 0

	self.Puppets[PuppetInsertedIndex] = PuppetData
	self.PuppetsLerpData[PuppetInsertedIndex] = {}
	self.PuppetNextIndex += 1
	if self.PuppetNextIndex > self:UseSetting('PuppetMaxCount') then
		self.PuppetNextIndex = 1
	end
end

function Shatterbox:FakeClientPuppets(fakePuppets: {Part})
	for _, fake in ipairs(fakePuppets) do
		local OldPuppetData = self.Puppets[self.FakePuppetOverrideIndex]
		if OldPuppetData then
			OldPuppetData[1]:Destroy()
			self.PuppetsLerpData[self.FakePuppetOverrideIndex] = nil
		end

		self.Puppets[self.FakePuppetOverrideIndex] = {fake}

		self.FakePuppetOverrideIndex += 1
		if self.FakePuppetOverrideIndex > self:UseSetting('PuppetMaxCount') then
			self.FakePuppetOverrideIndex = 1
		end
	end
end

function Shatterbox:Destroy(intersectingPart, FilterTagged, CleanupDelay, OnVoxelDestruct, GridSize, SkipEncapsulatedVoxels, OnDestructCompleted, UserData, ExcludePlayersReplication, SkipFloors, SkipWalls)
	coroutine.wrap(function()
		local did = self:ModelQueueBehavior(Shatterbox.Destroy, intersectingPart, FilterTagged, CleanupDelay, OnVoxelDestruct, GridSize, SkipEncapsulatedVoxels, OnDestructCompleted, UserData, ExcludePlayersReplication, SkipFloors, SkipWalls)
		if did then return end

		local params = self:ValidateDestructionParams(intersectingPart, FilterTagged, CleanupDelay, OnVoxelDestruct, GridSize, SkipEncapsulatedVoxels, OnDestructCompleted, UserData, ExcludePlayersReplication, SkipFloors, SkipWalls)

		params.DestroyedVoxels = 0

		local destructibleParts, createdDirtyGroups, createdFallingGroups = self:GetDestructibleParts(params)
		if #destructibleParts == 0 then return end

		local DestructionID = params.ID

		local AffectedDirtyGroups = {}
		for _, part in ipairs(destructibleParts) do
			local DirtyGroupID = part:GetAttribute(DirtyGroupIDAttribute)
			if AffectedDirtyGroups[DirtyGroupID] then continue end
			AffectedDirtyGroups[DirtyGroupID] = true
			self.CountOperationsProcessing[DirtyGroupID] = (self.CountOperationsProcessing[DirtyGroupID] or 0) + 1
		end
		self.OperationAffectedDirtyGroups[DestructionID] = AffectedDirtyGroups
		self.OperationBlacklistedVoxels[DestructionID] = {}

		if self.USE_CLIENT_SERVER and isServer then
			self:ReplicateDestructionToClients(NORMAL, params, createdDirtyGroups)
		end

		table.insert(self.ShatterQueue, params)
	end)()
end

function Shatterbox:ImaginaryVoxels(intersectingPart, FilterTagged, CleanupDelay, GridSize, SkipEncapsulatedVoxels, ExcludePlayersReplication, SkipFloors, SkipWalls)
	local did, voxels, existingDebris = self:ModelQueueBehavior(Shatterbox.ImaginaryVoxels, intersectingPart, FilterTagged, CleanupDelay, nil, GridSize, SkipEncapsulatedVoxels, nil, nil, ExcludePlayersReplication, SkipFloors, SkipWalls)

	if did then return voxels, existingDebris end

	local params = self:ValidateDestructionParams(intersectingPart, FilterTagged, CleanupDelay, nil, GridSize, SkipEncapsulatedVoxels, nil, nil, ExcludePlayersReplication, SkipFloors, SkipWalls)

	local destructibleParts, createdDirtyGroups, createdFallingGroups = self:GetDestructibleParts(params)
	if #destructibleParts == 0 then return {}, {} end

	if self.USE_CLIENT_SERVER and isServer then
		self:ReplicateDestructionToClients(IMAGINARY, params, createdDirtyGroups)
	end

	voxels, existingDebris = self:ImaginaryVoxels_Internal(params, false, destructibleParts)

	self.OperationAffectedFallingGroups[params.ID] = nil

	return voxels, existingDebris
end

function Shatterbox:InstantiateImaginaryVoxel(ImaginaryVoxel, doNotGiveDebrisTag: boolean?)
	local DirtyGroupID = ImaginaryVoxel.DirtyGroupID

	local voxel = self:InstantiatePart(DirtyGroupID, ImaginaryVoxel.CFrame, ImaginaryVoxel.Size)

	if not doNotGiveDebrisTag then voxel:AddTag(DebrisTag) end

	voxel.Destroying:Once(function()
		local members = self.DirtyGroupMembers[DirtyGroupID]
		if not members then return end
		members[voxel] = nil
	end)

	voxel.Parent = self.DirtyGroupData[DirtyGroupID].OriginalParent

	return voxel
end

function Shatterbox:ResetArea(area)
	local ACF, AS = area.CFrame, area.Size
	if isServer then self.ServerEvents.SignalResetArea.FireAll(ACF, AS) end

	local AreaVerts = VertexMath.GetVerts.Block(ACF, AS)
	local AreaNormals = VertexMath.GetNormals.Block(ACF)

	local toResetIDs, toTerminate = {}, {}

	for DirtyGroupID, groupData in pairs(self.DirtyGroupData) do
		local originalPart = groupData.OriginalPart
		local cpcf, cps, cpsh = originalPart.CFrame, originalPart.Size, originalPart.Shape.Name
		local iBl, iBa, iC = cpsh == "Block", cpsh == "Ball", cpsh == "Cylinder"

		local intersectingVerts, intersectingNormals
		if iBl or iC then
			intersectingVerts = BlockVerts(cpcf, cps)
			intersectingNormals = BlockNormals(cpcf)
		elseif not iBa then
			intersectingVerts = GetVerts[cpsh](cpcf, cps)
			intersectingNormals = GetNormals[cpsh](cpcf, cps)
		end

		local intersected = PartContainsAVert(originalPart, AreaVerts)
		if not intersected then
			if iBa then
				intersected = VertexMath.BallIntersectsBlock(cpcf, cps, ACF, AS)
			elseif iC then
				intersected = VertexMath.CylinderIntersectsBlock(cpcf, cps, intersectingVerts, intersectingNormals, ACF, AS, AreaVerts, AreaNormals)
			else
				intersected = VertexMath.SAT(intersectingVerts, intersectingNormals, AreaVerts, AreaNormals)
			end
		end

		if intersected then
			local countProcessing = self.CountOperationsProcessing[DirtyGroupID]
			if countProcessing then
				local toCancel, countFound = {}, 0
				for DestructionID, AffectedIDs in pairs(self.OperationAffectedDirtyGroups) do
					if not AffectedIDs[DirtyGroupID] then continue end
					toCancel[DestructionID] = true
					countFound += 1
					if countFound == countProcessing then break end
				end
				for DestructionID in pairs(toCancel) do
					for i, destructionParams in ipairs(self.ShatterQueue) do
						if destructionParams.ID == DestructionID then
							table.remove(self.ShatterQueue, i)
							break
						end
					end
					self.OperationAffectedDirtyGroups[DestructionID] = nil
				end
			end
			
			if self.GreedyWorkers[DirtyGroupID] then
				toTerminate[DirtyGroupID] = true
			else
				toResetIDs[DirtyGroupID] = true
			end
		end
	end

	for DirtyGroupID in pairs(toResetIDs) do 
		self:UndoDirtyGroup(DirtyGroupID) 
	end

	if next(toTerminate) then
		for DirtyGroupID in pairs(toTerminate) do
			self.GreedyWorkersTerminationFlags[DirtyGroupID] = true
		end
		while RunService.Heartbeat:Wait() do
			local allDone = true
			for DirtyGroupID in pairs(toTerminate) do
				if self.GreedyWorkers[DirtyGroupID] then
					allDone = false
					break
				end
			end
			if allDone then break end
		end
	end

	for DirtyGroupID in pairs(toTerminate) do 
		self:UndoDirtyGroup(DirtyGroupID) 
	end
end

function Shatterbox:Reset(doNotRevertOwnership: boolean?, replicated: boolean?)
	self.ShatterQueue = {}
	self.CountOperationsProcessing = {}
	self.OperationAffectedDirtyGroups = {}

	for DirtyGroupID in pairs(self.GreedyWorkers) do
		self.GreedyWorkersTerminationFlags[DirtyGroupID] = true
	end
	while self.ActiveGMWorkerCount > 0 do RunService.Heartbeat:Wait() end

	self.SmoothCleanupQueue = {}

	if isServer then
		for _, puppetData in pairs(self.Puppets) do
			puppetData[3]:Disconnect()
			puppetData[2](true)
			self:DestroyPart(puppetData[1])
		end

		self.ServerEvents.SignalReset.FireAll(doNotRevertOwnership)
	else
		for _, puppetData in pairs(self.Puppets) do
			puppetData[1]:Destroy()
		end
	end

	if doNotRevertOwnership and self.USE_CLIENT_SERVER then
		for DirtyGroupID in pairs(self.DirtyGroupData) do 
			self:UndoDirtyGroup(DirtyGroupID) 
		end
	else
		for DirtyGroupID, groupData in pairs(self.DirtyGroupData) do
			local OriginalPart = groupData.OriginalPart
			if replicated then
				OriginalPart:Destroy()
			else
				OriginalPart:SetAttribute(DirtyGroupIDAttribute)
				OriginalPart.Parent = groupData.OriginalParent
			end
			for member in pairs(self.DirtyGroupMembers[DirtyGroupID]) do 
				member:Destroy() 
			end
		end

		self.DirtyGroupData = {}
		self.DirtyGroupMembers = {}
	end

	self.GreedyMeshingQueue = {}
	self.GreedyWorkers = {}
	self.GreedyWorkersTerminationFlags = {}
	self.ActiveGMWorkerCount = 0
	self.ActiveGMWorkerGridSize = {}

	self.Puppets = {}
	self.PuppetsLerpData = {}
	self.PuppetNextIndex = 1
	self.PuppetNextReplicationIndex = 1
	self.CreatePuppetQueue = {}
end

function Shatterbox:ClearQueue()
	self.ShatterQueue = {}

	if isServer then self.ServerEvents.SignalClearQueue.FireAll() end
end

function Shatterbox:CreateHitbox()
	local hitbox = {}
	hitbox.CFrame = CFrame.new()
	hitbox.Size = Vector3.new(1, 1, 1)
	hitbox.Shape = Enum.PartType.Ball

	hitbox.DestructDelay = nil
	hitbox.FilterTagged = nil
	hitbox.OnVoxelDestruct = nil
	hitbox.UserData = {}
	hitbox.ExcludePlayersReplication = {}
	hitbox.OnDestructCompleted = nil
	hitbox.CleanupDelay = nil
	hitbox.GridSize = nil
	hitbox.SkipEncapsulatedVoxels = nil
	hitbox.SkipWalls = nil
	hitbox.SkipFloors = nil
	hitbox.DestructionType = "DEFAULT"
	hitbox.ImaginaryCallback = nil
	hitbox.StartConnectionEvent = RunService.Heartbeat
	hitbox.WeldConnectionEvent = RunService.PostSimulation
	hitbox.VelocityPrediction = false
	hitbox.VelocityBias = 1

	local _selfRef = self
	function hitbox:Destroy()
		_selfRef:Destroy(hitbox)
		hitbox.ExcludePlayersReplication = {}
	end

	function hitbox:ImaginaryVoxels()
		local voxels, existingDebris = self:ImaginaryVoxels(hitbox)
		hitbox.ExcludePlayersReplication = {}
		return voxels, existingDebris
	end

	local wcon, dcon

	function hitbox:WeldTo(Part: BasePart)
		if wcon then wcon:Disconnect() end
		if dcon then dcon:Disconnect() end
		hitbox.CFrame = Part.CFrame
		wcon = hitbox.WeldConnectionEvent:Connect(function(deltaTime)
			if hitbox.VelocityPrediction then
				hitbox.CFrame = Part.CFrame + Part.AssemblyLinearVelocity * hitbox.VelocityBias * deltaTime
			else
				hitbox.CFrame = Part.CFrame
			end
		end)
		dcon = Part.Destroying:Once(hitbox.DestroyHitbox)
	end

	function hitbox:Unweld()
		if wcon then wcon:Disconnect() end
		if dcon then dcon:Disconnect() end
		wcon, dcon = nil, nil
	end

	local ccon
	local lastCut

	local function DestructionStartConnection()
		if hitbox.DestructDelay then
			local t = time()
			if lastCut and t - lastCut < hitbox.DestructDelay then return end
			lastCut = t
		end

		if hitbox.DestructionType == "DEFAULT" then
			hitbox:Destroy()
		else
			local voxels, existingDebris = hitbox:ImaginaryVoxels()
			if hitbox.ImaginaryCallback then
				hitbox.ImaginaryCallback(voxels, existingDebris)
			end
		end
	end

	function hitbox:Start()
		if ccon then return end
		ccon = hitbox.StartConnectionEvent:Connect(DestructionStartConnection)
	end

	function hitbox:Stop()
		if ccon then ccon:Disconnect() end
		ccon = nil
	end

	function hitbox:DestroyHitbox()
		hitbox:Unweld()
		hitbox:Stop()
	end

	return hitbox
end

function Shatterbox:GetOriginalPart(DirtyGroupID: string)
	local groupData = self.DirtyGroupData[DirtyGroupID]
	if not groupData then return nil end
	return groupData.OriginalPart
end

function Shatterbox:VoxelDistanceVector(voxel, point: Vector3): Vector3
	return voxel.CFrame:PointToObjectSpace(point):Abs() / voxel.Size
end

function Shatterbox:VoxelCountVector(voxel, boxSize: Vector3): Vector3
	return Vector3.one:Max(boxSize / voxel.Size)
end

function Shatterbox:PartEncapsulatesBlockPart(part: Part, contains: Part)
	assert(part:IsA("Part"), "You can only use this function when a Part is the container.")
	assert(contains:IsA("Part") and contains.Shape == Enum.PartType.Block, "You can only use this function when a Block Part is the contained object.")
	return PartEncapsulatesBlockPart(part, contains.CFrame, contains.Size)
end

function Shatterbox:RegisterOnVoxelDestruct(name: string, callback)
	assert(typeof(name) == "string", "You must register the OnVoxelDestruct callback with a string as the name")
	local id = name:lower()
	assert(not rawget(self.OnVoxelDestructRegistry, id), `Callback with name {id} already exists in the registry`)
	self.OnVoxelDestructRegistry[id] = callback
end

function Shatterbox:GetVoxelDestructionEffect(name: string)
	assert(typeof(name) == "string", "Voxel destruction effect names must be a string.")

	local id = name:lower()
	assert(rawget(self.OnVoxelDestructRegistry, id), `No registered voxel destruction behavior "{id}".`)

	return self.OnVoxelDestructRegistry[id]
end


function Shatterbox:PrintState()
	if isServer then self.ServerEvents.SignalPrintState.FireAll() end

	local P = "\n|\n| "
	print(P .. `SHATTERBOX ({isServer and "SERVER" or "CLIENT"})`)
	print(P .. "ShatterQueue length: " .. #self.ShatterQueue)
	print(P .. "ActiveGMWorkerCount: " .. self.ActiveGMWorkerCount)
end

--[[ STARTUP ]]--

function Shatterbox.Start(self: Shatterbox)
	if self.started then
		warn('Cannot start shatterbox more than once.')
		return
	end

	RunService.Heartbeat:Connect(function(deltaTime)
		self:HeartbeatWorker(deltaTime)
	end)

	local effects = require(src.Effects)
	effects._SetRef(self)
	effects._SetRef = nil

	if isServer then
		self.ServerEvents = require(PathToServer).Shatterbox
		self.mapContainer = workspace.CurrentCamera

		if self.USE_CLIENT_SERVER then
			self.ServerEvents.ClientInitComplete.On(function(plr)
				self:ReplicateStateToPlayer(plr)
			end)

			self.ServerEvents.CreateDirtyGroupsFromClient.On(function(plr, DirtyGroups)
				local SerialDirtyGroups = {}
				for DirtyGroupID, part in pairs(DirtyGroups) do
					self:PopulateDirtyGroup(part, DirtyGroupID)
					SerialDirtyGroups[DirtyGroupID] = SerializedPartInstance(part)
				end

				self.ServerEvents.CreateDirtyGroupsFromServer.FireExcept(plr, SerialDirtyGroups)
			end)
		end
		
	elseif isClient then
		self.ClientEvents = require(PathToClient).Shatterbox

		self.mapContainer = workspace:FindFirstChild("ClientMap")
		if not self.mapContainer then
			self.mapContainer = Instance.new("Folder")
			self.mapContainer.Parent = workspace
			self.mapContainer.Name = "ClientMap"
		end

		if self.USE_CLIENT_SERVER then
			self.ClientEvents.ReplicateState.On(function(...)
				self:ReplicateStateFromServer(...)
			end)

			self.ClientEvents.ReplicateDestruction.On(function(...)
				self:ReplicateDestructionFromServer(...)
			end)

			self.ClientEvents.CreateDirtyGroupsFromServer.On(function(...)
				self:CreateSerialDirtyGroups(...)
			end)

			self.ClientEvents.ClientInitComplete.Fire()
		end

		self.ClientEvents.SignalClearQueue.On(function()
			self:ClearQueue()
		end)

		self.ClientEvents.SignalReset.On(function(doNotRevertOwnership)
			self:Reset(doNotRevertOwnership, true)
		end)

		self.ClientEvents.SignalResetArea.On(function(cframe, size)
			self:ResetArea({CFrame = cframe, Size = size})
		end)

		self.ClientEvents.CreatePuppets.On(function(puppets)
			self:CreatePuppets(puppets)
		end)

		self.ClientEvents.ReplicatePuppetStates.On(function(...)
			self:ReplicatePuppetStates(...)
		end)

		self.ClientEvents.DestroyPuppet.On(function(index)
			self:DestroyPuppet(index)
		end)

		self.ClientEvents.SignalPrintState.On(function()
			self:PrintState()
		end)

		-- Client-side puppet interpolation
		RunService.PreRender:Connect(function(deltaTime)
			if not next(self.PuppetsLerpData) then return end

			local P = self.ClientPuppetStepDelta / self:UseSetting('PuppetReplicationFrequency')
			local finishedLerps = {}
			
			for index, lerpData in pairs(self.PuppetsLerpData) do
				local d = lerpData[3] + deltaTime
				if d >= P then
					table.insert(finishedLerps, index)
					self.Puppets[index][1].CFrame = lerpData[2]
				else
					self.Puppets[index][1].CFrame = lerpData[1]:Lerp(lerpData[2], d / P)
					lerpData[3] = d
				end
			end

			for _, index in ipairs(finishedLerps) do 
				self.PuppetsLerpData[index] = nil 
			end
		end)
	end

	self.started = true
end

function Shatterbox.UseSetting<T>(self: Shatterbox, settingName: string): T
	return (self.Settings::any)[settingName] == nil and DefaultSettings[settingName] or (self.Settings::any)[settingName]
end

-- [[ Types ]]

export type WorldInfo = {
	CFrame : CFrame,
	Size : Vector3,
}

export type Hitbox = WorldInfo & {
	Shape : Enum.PartType
}

export type DestroyedVoxelInfo = {
	DirtyGroupID : string,

	CuttingPart : Hitbox,

	IsEdge : boolean,
	IsAlreadyDebris : boolean,

	UserData : {any}
}

export type OnDestructCompleted = (DestroyedVoxelCount : number, AffectedDirtyGroupIDs : { [string] : boolean }) -> ()

export type OnVoxelDestruct = (voxel : Part, info : DestroyedVoxelInfo) -> ()

export type ImaginaryBox = WorldInfo & {

	DirtyGroupID : string, -- the dirty group ID for this box
	GridSize : number -- the GridSize that was applied to this box
}

export type ImaginaryVoxel = ImaginaryBox & {

	isEdge : boolean -- whether or not this box lies along the edge of the intersection
}

type SharedDestructionParams = {

	FilterTagged : (string | {string})?,
	GridSize : number?,
	CleanupDelay : number?,
	SkipEncapsulatedVoxels : boolean?,
	SkipWalls : boolean?,
	SkipFloors : boolean?,
	ExcludePlayersReplication : {Player}?
}

type UsesOnVoxelDestruct = {
	OnVoxelDestruct : string?,
	DestructParameters : { any },

	OnDestructCompleted : OnDestructCompleted?
}

export type InternalImaginaryParams = SharedDestructionParams & { CuttingPart : Hitbox }
export type ImaginaryDestructionParams = SharedDestructionParams & {

	CuttingPart : ((Part?) | (Model?) | (Hitbox?))?,

	CFrame : CFrame?,
	Size : Vector3?,
	Shape : Enum.PartType?
}

export type InternalDestructionParams = InternalImaginaryParams & UsesOnVoxelDestruct
export type DestructionParams = ImaginaryDestructionParams & UsesOnVoxelDestruct

export type ImaginaryVoxelArguments = {
	intersectingPart : Part | Model | WorldInfo | ImaginaryDestructionParams, FilterTagged : (string | {string})?, CleanupDelay : number?, GridSize : number?, SkipEncapsulatedVoxels : boolean?, ExcludePlayersReplication : {Player}?, SkipFloors : boolean?, SkipWalls : boolean?
}

export type DestructionTypes = 'IMAGINARY' | 'NORMAL'

export type Settings = {
	--[[
		DESTRUCTION SETTINGS
		
		Configure the basic behavior of voxel destruction
	]]
	
	-- Default size of each voxel in studs
	-- Smaller values create more detailed destruction but increase performance cost
	-- Default: 4
	DefaultGridSize: number?,
	
	-- Default time in seconds before destroyed parts are restored
	-- Set to 0 to never restore destroyed parts
	-- Default: 0
	DefaultSmoothCleanupDelay: number?,
	
	
	--[[
		GREEDY MESHING SETTINGS
		
		Greedy meshing combines adjacent voxels into larger parts to reduce part count
		This significantly improves performance for large destructions
	]]
	
	-- Enable greedy meshing algorithm to combine adjacent voxels
	-- When enabled, adjacent voxels of the same material are merged into larger parts
	-- Default: true
	UseGreedyMeshing: boolean?,
	
	-- Maximum number of concurrent greedy meshing worker threads
	-- Higher values = faster meshing but more CPU usage per frame
	-- Default: 2
	GMWorkerCount: number?,
	
	-- Number of voxel grid traversals to perform per frame in greedy meshing
	-- Higher values = faster meshing but more frame time used
	-- Default: 10000
	GMTraversalsPerFrame: number?,
	
	-- Number of parts to create per frame during greedy meshing
	-- Controls how smoothly the meshing displays results
	-- Default: 50
	GMPartCreationsPerFrame: number?,
	
	
	--[[
		PERFORMANCE SETTINGS
		
		Control frame budget and processing limits
	]]
	
	-- Maximum number of voxel subdivisions to process per frame
	-- Limits CPU time spent on destruction per frame
	-- Default: 500
	MaxDivisionsPerFrame: number?,
	
	-- Maximum number of destruction operations to process per frame
	-- Each operation can involve multiple subdivisions
	-- Default: 5
	MaxOpsPerFrame: number?,
	
	-- Enable priority queue for destruction operations
	-- When enabled, recent operations are prioritized
	-- Default: true
	UsePriorityQueue: boolean?,
	
	-- Number of recent operations to prioritize when priority queue is enabled
	-- Higher values = more responsive to recent destructions
	-- Default: 5
	PrioritizeRecentN: number?,
	
	
	--[[
		SMOOTH CLEANUP SETTINGS
		
		Configure automatic restoration of destroyed parts
	]]
	
	-- Enable smooth cleanup system
	-- When enabled, destroyed parts are gradually restored over time
	-- Default: true
	UseSmoothCleanup: boolean?,
	
	
	--[[
		NON-DIVISIBLE PART SETTINGS
		
		Control behavior for parts that cannot be subdivided
		(e.g., Balls, Cylinders, Wedges, or parts below minimum voxel size)
	]]
	
	-- How to handle non-divisible parts when destroyed
	-- "NONE": Do nothing, leave the part as-is
	-- "FALL": Make the part fall with physics
	-- "REMOVE": Remove the part entirely
	-- Default: "NONE"
	NonDivisibleInteraction: ("NONE" | "FALL" | "REMOVE")?,
	
	
	--[[
		NETWORK SETTINGS
		
		Configure client-server replication behavior
	]]
	
	-- Enable client-server replication
	-- When enabled, destructions are processed on both server and client
	-- This provides lower latency and better visual feedback
	-- Default: true
	USE_CLIENT_SERVER: boolean?,
	
	
	--[[
		PUPPET SYSTEM SETTINGS
		
		Puppets are falling voxels that are efficiently replicated to clients
		The system uses compressed state updates and client-side interpolation
	]]
	
	-- Maximum number of concurrent puppet voxels
	-- When exceeded, oldest puppets are destroyed to make room for new ones
	-- Default: 500
	PuppetMaxCount: number?,
	
	-- Frequency of puppet state updates in Hz
	-- Higher values = smoother motion but more network traffic
	-- Default: 20
	PuppetReplicationFrequency: number?,
	
	-- Velocity threshold below which puppets are considered "sleeping"
	-- Sleeping puppets are automatically anchored after PuppetAnchorTimeout
	-- Default: 0.5
	PuppetSleepVelocity: number?,
	
	-- Time in seconds before sleeping puppets are anchored
	-- Prevents tiny movements from keeping puppets active
	-- Default: 2
	PuppetAnchorTimeout: number?,
	
	-- Enable client-side interpolation of puppet movement
	-- When enabled, puppets smoothly interpolate between server updates
	-- Default: true
	ClientTweenPuppets: boolean?,
	
	-- Maximum distance from camera to use interpolation (in studs)
	-- Puppets beyond this distance are teleported instead of interpolated
	-- This saves performance on distant puppets
	-- Default: 200
	ClientTweenDistanceLimit: number?,
	
	
	--[[
		CUSTOM FILTER SETTINGS
		
		Provide custom logic for skipping certain instances
	]]
	
	-- Custom function to determine if an instance should be skipped
	-- Return true to skip the instance (don't allow destruction)
	-- Return false to allow the instance to be destroyed
	-- 
	-- Default behavior (if not provided):
	-- - Skip anything with "Indestructible" tag
	-- - Skip anything with a Humanoid ancestor
	-- - Skip non-Block parts on client
	-- 
	-- Example:
	-- SkipInstanceCheck = function(instance)
	--     -- Skip parts named "Important"
	--     if instance.Name == "Important" then
	--         return true
	--     end
	--     -- Skip parts in the "SafeZone" folder
	--     if instance:IsDescendantOf(workspace.SafeZone) then
	--         return true
	--     end
	--     return false
	-- end
	SkipInstanceCheck: ((instance: Instance) -> boolean)?
}

export type Shatterbox = { [string]: any } & typeof(Shatterbox)

return Shatterbox