export enum TutorialArgs {
  USERS = "users",
  STATIONS = "stations",
}

export interface TutorialCardsProps {
  title: string;
  description: string;
  args: TutorialArgs;
  isAdminRessource: boolean;
  icons: React.ComponentType<{ className?: string }>;
}

export interface HeadingItem {
  depth: number;
  text: string;
  id: string;
  isActive?: boolean;
}

export interface TutorialViewerProps {
  page: TutorialArgs;
  adminRessources: boolean;
  onHeadings?: (headings: HeadingItem[]) => void;
}

export interface TutorialSidebarProps {
  headings: HeadingItem[];
}

export interface TocNode {
  id: string;
  text: string;
  depth: number;
  children: TocNode[];
  isActive?: boolean;
}

export interface NavMainProps {
  items: TocNode[];
}
