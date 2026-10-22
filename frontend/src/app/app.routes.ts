import { Routes } from '@angular/router';
import { OrderPageComponent } from './pages/order-page/order-page.component';
import { ShopPageComponent } from './pages/shop-page/shop-page.component';

export const routes: Routes = [
  { path: '', component: ShopPageComponent, title: 'Shop | Shift' },
  { path: 'orders/:id', component: OrderPageComponent, title: 'Order confirmed | Shift' },
  { path: '**', redirectTo: '' },
];
