import { useState } from 'react';

// 通用可摺疊樹狀視圖：JSON 工具的結構視圖與 Markdown 大綱共用。

export interface TreeViewNode {
  id: string; // 唯一鍵（JSON path / 標題 anchor）
  label: string;
  badge?: string;
  badgeClass?: string; // 徽章配色（tailwind classes）
  meta?: string; // 右側灰字（值預覽、行號等）
  children?: TreeViewNode[];
}

function Node({ node, depth, onSelect }: { node: TreeViewNode; depth: number; onSelect?: (node: TreeViewNode) => void }) {
  const [open, setOpen] = useState(depth < 2); // 深層預設收合
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <li>
      <div className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-edge/40" style={{ paddingLeft: `${depth * 1.1}rem` }}>
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? '收合' : '展開'}
            aria-expanded={open}
            className="w-4 shrink-0 text-xs text-muted hover:text-accent"
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {node.badge && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${node.badgeClass ?? 'bg-edge text-muted'}`}>
            {node.badge}
          </span>
        )}
        <button
          onClick={() => onSelect?.(node)}
          className={`truncate text-left font-mono text-sm text-ink ${onSelect ? 'hover:text-accent' : 'cursor-default'}`}
          title={node.id}
        >
          {node.label}
        </button>
        {node.meta && <span className="ml-auto shrink-0 truncate pl-2 font-mono text-xs text-muted">{node.meta}</span>}
      </div>
      {hasChildren && open && (
        <ul>
          {node.children!.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TreeView({ nodes, onSelect }: { nodes: TreeViewNode[]; onSelect?: (node: TreeViewNode) => void }) {
  return (
    <ul className="overflow-x-auto py-1">
      {nodes.map((n) => (
        <Node key={n.id} node={n} depth={0} onSelect={onSelect} />
      ))}
    </ul>
  );
}
