'use client';

import { useCallback, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import type { Tile } from '@/types/tile';
import TileRenderer from './TileRenderer';

// react-grid-layout requires these CSS imports
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGrid = WidthProvider(Responsive);

const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 80;

function tilesToLayouts(tiles: Tile[]): { lg: Layout[] } {
  return {
    lg: tiles.map((t) => ({
      i: t.id,
      x: t.pos.x,
      y: t.pos.y,
      w: t.pos.w,
      h: t.pos.h,
      minW: 2,
      minH: 2,
    })),
  };
}

interface Props {
  initialTiles: Tile[];
}

export default function Dashboard({ initialTiles }: Props) {
  const [tiles] = useState<Tile[]>(initialTiles);
  const [layouts, setLayouts] = useState(() => tilesToLayouts(initialTiles));

  const handleLayoutChange = useCallback((_: Layout[], allLayouts: Record<string, Layout[]>) => {
    setLayouts(allLayouts as { lg: Layout[] });
    // TODO: persist to DB via PATCH /api/content/layout
  }, []);

  return (
    <ResponsiveGrid
      className="layout"
      layouts={layouts}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      margin={[12, 12]}
      containerPadding={[16, 16]}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".tile-header"
      resizeHandles={['se']}
    >
      {tiles.map((tile) => (
        <div key={tile.id}>
          <TileRenderer tile={tile} />
        </div>
      ))}
    </ResponsiveGrid>
  );
}
