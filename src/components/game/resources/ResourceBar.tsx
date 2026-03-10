import React from 'react';
import ResourceItem, { ResourceItemData } from './ResourceItem';

interface ResourceBarProps {
  items: ResourceItemData[];
  formatValue: (value: number) => string;
  formatDelta: (value: number) => string;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ items, formatValue, formatDelta }) => {
  return (
    <div className="flex flex-1 flex-wrap items-stretch gap-2 xl:flex-nowrap">
      {items.map(item => (
        <ResourceItem key={item.key} item={item} formatValue={formatValue} formatDelta={formatDelta} />
      ))}
    </div>
  );
};

export default ResourceBar;
