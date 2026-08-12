import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-navbar',
  imports: [Icon],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {}
