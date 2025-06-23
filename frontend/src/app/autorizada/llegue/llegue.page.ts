import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';

@Component({
  selector: 'app-llegue',
  templateUrl: './llegue.page.html',
  styleUrls: ['./llegue.page.scss'],
  standalone: false,
})
export class LleguePage implements OnInit {

  constructor() { }

    isModalOpen = false;

    setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

    onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.isModalOpen = false;
  }

  ngOnInit() {
  }

}
