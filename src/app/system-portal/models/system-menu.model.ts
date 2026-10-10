import { IconName } from '../../shared/components/icon/icons';
import { PermissionCode } from '../../api/interfaces/access-control/permision.interface';

export interface SystemMenuItem {
  readonly label: string;
  readonly url: string;
  readonly icon: IconName;
  readonly permission: PermissionCode;
}

export interface SystemMenuGroup {
  readonly label: string;
  readonly icon: IconName;
  readonly items: readonly SystemMenuItem[];
}
