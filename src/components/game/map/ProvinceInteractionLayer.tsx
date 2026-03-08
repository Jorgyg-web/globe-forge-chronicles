import React, { useCallback } from 'react';
import { CachedProvinceData } from './ProvincePathCache';

/**
 * Invisible hit-target layer for province click/hover interactions.
 * Uses a single event handler on the group to avoid per-province listeners.
 */
interface ProvinceInteractionLayerProps {
  provinces: CachedProvinceData[];
  onProvinceClick: (provId: string, countryId: string) => void;
  onProvinceEnter: (provId: string, countryId: string) => void;
  onProvinceLeave: () => void;
}

export const ProvinceInteractionLayer: React.FC<ProvinceInteractionLayerProps> = React.memo(({
  provinces, onProvinceClick, onProvinceEnter, onProvinceLeave,
}) => {
  // Event delegation: attach data attrs and handle at group level
  const handleClick = useCallback((e: React.MouseEvent<SVGGElement>) => {
    const target = (e.target as SVGElement).closest('[data-prov-id]') as SVGElement | null;
    if (target) {
      e.stopPropagation();
      onProvinceClick(target.dataset.provId!, target.dataset.countryId!);
    }
  }, [onProvinceClick]);

  const handleMouseOver = useCallback((e: React.MouseEvent<SVGGElement>) => {
    const target = (e.target as SVGElement).closest('[data-prov-id]') as SVGElement | null;
    if (target) {
      onProvinceEnter(target.dataset.provId!, target.dataset.countryId!);
    }
  }, [onProvinceEnter]);

  return (
    <g onClick={handleClick} onMouseOver={handleMouseOver} onMouseOut={onProvinceLeave}
      className="cursor-pointer">
      {provinces.map(p => (
        <path key={p.id} d={p.geometry}
          data-prov-id={p.id} data-country-id={p.countryId}
          fill="transparent" stroke="none" />
      ))}
    </g>
  );
});
ProvinceInteractionLayer.displayName = 'ProvinceInteractionLayer';
