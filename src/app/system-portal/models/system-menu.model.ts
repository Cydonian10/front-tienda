import { IconName } from '../../shared/components/icon/icons';

export interface SystemMenuItem {
  readonly label: string;
  readonly url: string;
  readonly icon: IconName;
}

export interface SystemMenuGroup {
  readonly label: string;
  readonly icon: IconName;
  readonly items: readonly SystemMenuItem[];
}
