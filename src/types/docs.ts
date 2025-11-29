export enum TutorialArgs {
  USERS = "users",
  RESERVATIONS = "reservations",
  STATIONS = "stations",
  AVAILABILITIES = "availabilities",
  COURSES = "courses",
  PRIVACY_POLICY = "privacy_policy",
  LOGIN = "login",
  CONSULT_RESERVATIONS = "consult_reservations",
  REMINDERS = "reminders",
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
  adminRessources: boolean;
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
