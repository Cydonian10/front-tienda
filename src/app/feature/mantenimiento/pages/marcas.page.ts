import { Component, signal } from '@angular/core';
import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';

@Component({
  selector: 'marcas-page',
  imports: [BreadcrumbsNg],
  templateUrl: './marcas.page.html',
})
export default class MarcasPage {
  protected readonly title = signal('Marcas Page');
}
