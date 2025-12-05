export enum TutorialArgs {
  USERS = "utilisateurs",
  RESERVATIONS = "reservations",
  STATIONS = "stations",
  AVAILABILITIES = "disponibilites",
  COURSES = "cours",
  PRIVACY_POLICY = "politique",
  LOGIN = "connexion",
  CONSULT_RESERVATIONS = "consultation_reservations",
  MAKE_RESERVATION = "effectuer_reservation",
  REMINDERS = "rappels",
}

export interface TutorialCardsProps {
  title: string;
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
