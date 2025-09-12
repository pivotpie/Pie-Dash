import React from "react";

interface MapControlsProps {
  showZones: boolean;
  showAreas: boolean;
  showVehicles: boolean;
  showCollectionPoints: boolean;
  onToggleZones: () => void;
  onToggleAreas: () => void;
  onToggleVehicles: () => void;
  onToggleCollectionPoints: () => void;
  onRefresh: () => void;
  selectedZone?: string;
  onZoneFilter?: (zone: string | undefined) => void;
  zones?: Array<{zone_id: string; zone_name: string}>;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showZones,
  showAreas,
  showVehicles,
  showCollectionPoints,
  onToggleZones,
  onToggleAreas,
  onToggleVehicles,
  onToggleCollectionPoints,
  onRefresh,
  selectedZone,
  onZoneFilter,
  zones = []
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold">Map Layers</span>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showZones}
              onChange={onToggleZones}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Zone Boundaries</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAreas}
              onChange={onToggleAreas}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Area Markers</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showVehicles}
              onChange={onToggleVehicles}
              className="rounded border-gray-300"
            />
            <span className="text-sm">🚛 Vehicles</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCollectionPoints}
              onChange={onToggleCollectionPoints}
              className="rounded border-gray-300"
            />
            <span className="text-sm">🎯 Collection Points</span>
          </label>
        </div>
      </div>

      {zones.length > 0 && onZoneFilter && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold">Zone Filter</span>
          </div>
          
          <select
            value={selectedZone || ""}
            onChange={(e) => onZoneFilter(e.target.value || undefined)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.zone_id} value={zone.zone_name}>
                {zone.zone_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow">
        <button
          onClick={onRefresh}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-sm mb-3">Legend</h3>
        
        {showVehicles && (
          <div className="mb-3">
            <div className="text-xs font-semibold mb-2">Vehicles:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Idle</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Maintenance</span>
              </div>
            </div>
          </div>
        )}
        
        {showCollectionPoints && (
          <div>
            <div className="text-xs font-semibold mb-2">Collection Points:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Critical (&gt;7 days)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>High (&gt;3 days)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium (&gt;1 day)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Low (recent)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
