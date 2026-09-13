import { IconName } from '../../shared/icon/icon';
import { OperationalRole } from './role.model';

export interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  route?: string;
  expanded?: boolean;
  roles?: OperationalRole[];
  children?: MenuItem[];
}
