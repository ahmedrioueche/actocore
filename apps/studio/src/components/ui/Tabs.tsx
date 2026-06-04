import Tab from "./Tab";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  return (
    <div
      className={`flex gap-4 border-b border-border overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          label={tab.label}
          count={tab.count}
          isActive={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        />
      ))}
    </div>
  );
}
