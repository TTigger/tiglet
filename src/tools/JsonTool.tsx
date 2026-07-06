import { useRef, useState } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import TreeView, { type TreeViewNode } from '../components/TreeView';
import { parseJson, formatJson, minifyJson, buildJsonTree, type JsonTreeNode } from '../lib/jsonTree';

const areaClass =
  'w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-sm text-ink outline-none focus:border-accent';

const TYPE_BADGES: Record<JsonTreeNode['type'], string> = {
  object: 'bg-sky-600 text-white',
  array: 'bg-purple-600 text-white',
  string: 'bg-green-600 text-white',
  number: 'bg-amber-500 text-white',
  boolean: 'bg-pink-600 text-white',
  null: 'bg-slate-400 text-white',
};

function toTreeViewNode(n: JsonTreeNode): TreeViewNode {
  return {
    id: n.path,
    label: n.key,
    badge: n.size !== undefined ? `${n.type} ${n.size}` : n.type,
    badgeClass: TYPE_BADGES[n.type],
    meta: n.children ? undefined : n.preview,
    children: n.children?.map(toTreeViewNode),
  };
}

const SAMPLE = '{\n  "name": "tiglet",\n  "tools": ["json", "diff"],\n  "meta": { "version": 2, "fun": true }\n}';

export default function JsonTool() {
  const [input, setInput] = useState('');
  const [tab, setTab] = useState('format');
  const [copiedPath, setCopiedPath] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed = input.trim() ? parseJson(input) : null;
  const output = parsed?.ok ? (tab === 'minify' ? minifyJson(input) : formatJson(input)) : '';
  const tree = parsed?.ok ? buildJsonTree(parsed.value) : null;

  async function onSelectNode(node: TreeViewNode) {
    try {
      await navigator.clipboard.writeText(node.id);
      setCopiedPath(node.id);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedPath(''), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder='貼上 JSON，例如 {"a": [1, 2, 3]}'
          className={areaClass}
          aria-label="JSON 輸入"
        />
        {!input && (
          <button onClick={() => setInput(SAMPLE)} className="absolute right-3 top-3 text-xs text-muted hover:text-accent">
            填入範例
          </button>
        )}
      </div>

      {parsed && (
        <p className={`text-sm ${parsed.ok ? 'text-green-600' : 'text-red-500'}`}>
          {parsed.ok
            ? '✓ 有效的 JSON'
            : `✗ 解析失敗${parsed.line !== null ? `（第 ${parsed.line} 行第 ${parsed.column} 欄附近）` : ''}`}
        </p>
      )}

      {parsed?.ok && (
        <>
          <div className="flex justify-center">
            <Tabs
              tabs={[
                { id: 'format', label: '格式化' },
                { id: 'minify', label: '壓縮' },
                { id: 'tree', label: '樹狀圖' },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {tab !== 'tree' ? (
            <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
              <div className="flex items-center justify-between border-b border-edge px-4 py-2">
                <span className="text-sm text-muted">{tab === 'minify' ? `壓縮結果（${output.length} 字元）` : '格式化結果'}</span>
                <CopyButton value={output} />
              </div>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-all px-4 py-3 font-mono text-sm text-ink">{output}</pre>
            </div>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
              <div className="flex items-center justify-between border-b border-edge px-4 py-2 text-sm">
                <span className="text-muted">點任意節點複製它的 JSON path</span>
                {copiedPath && <span className="font-mono text-xs text-accent">已複製 {copiedPath} ✓</span>}
              </div>
              <div className="max-h-[28rem] overflow-y-auto px-2 py-1">
                <TreeView nodes={[toTreeViewNode(tree!)]} onSelect={onSelectNode} />
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted">JSON 只在你的瀏覽器解析，不會上傳。</p>
    </div>
  );
}
