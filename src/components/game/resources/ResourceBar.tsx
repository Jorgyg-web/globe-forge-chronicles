import React from 'react';
import ResourceItem, { ResourceItemData } from './ResourceItem';

interface ResourceBarProps {
  items: ResourceItemData[];
  formatValue: (value: number) => string;
  formatDelta: (value: number) => string;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ items, formatValue, formatDelta }) => {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
      {items.map(item => (
        <ResourceItem key={item.key} item={item} formatValue={formatValue} formatDelta={formatDelta} />
      ))}
    </div>
  );
};

export default ResourceBar;
