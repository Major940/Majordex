import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

export default function VirtualGrid({ items, itemWidth=220, itemHeight=360, gap=16, renderItem }){
  const ref = useRef(null);
  const [dims, setDims] = useState({ width: 800, cols: 4 });

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      const cols = Math.max(1, Math.floor((width + gap) / (itemWidth + gap)));
      setDims({ width, cols });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [gap, itemWidth]);

  const rows = Math.ceil(items.length / dims.cols);
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * dims.cols + columnIndex;
    if (index >= items.length) return <div style={style} />;
    return <div style={style} className="p-2">{renderItem(items[index], index)}</div>;
  };

  return (
    <div ref={ref} className="w-full">
      <Grid
        columnCount={dims.cols}
        columnWidth={itemWidth + gap}
        height={Math.min(900, Math.max(itemHeight + 100, window.innerHeight - 260))}
        rowCount={rows}
        rowHeight={itemHeight + gap}
        width={dims.width}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {Cell}
      </Grid>
    </div>
  );
}
