import { shortcutGroups } from "@/lib/shortcuts/shortcut-map";

export function ShortcutList() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {shortcutGroups.map((group) => (
        <div className="glass-card rounded-lg p-4" key={group.label}>
          <h3 className="font-medium text-sm">{group.label}</h3>
          <div className="mt-3 flex flex-col gap-2">
            {group.shortcuts.map((shortcut) => (
              <div
                className="flex items-center justify-between gap-3 text-sm"
                key={shortcut.keys}
              >
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="rounded-md border border-border bg-muted/60 px-2 py-1 font-mono text-[11px]">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
