import { IconName } from '../../shared/icon/icon';

export interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  route?: string;
  expanded?: boolean;
  children?: MenuItem[];
}
