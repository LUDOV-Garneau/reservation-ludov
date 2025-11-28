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
