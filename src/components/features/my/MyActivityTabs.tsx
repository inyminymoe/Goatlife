import { ActivityKeys } from '@/app/my/page';
import Button from '@/components/ui/Button';

interface MyActivityTabsProps {
  categories: { key: ActivityKeys; label: string }[];
  selectedCategory: ActivityKeys;
  onCategoryClick: (key: ActivityKeys) => void;
}

export default function MyActivityTabs({
  categories,
  selectedCategory,
  onCategoryClick,
}: MyActivityTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {categories.map(({ key, label }) => (
        <Button
          key={key}
          variant="filter"
          active={key === selectedCategory}
          onClick={() => onCategoryClick(key)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
