import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerPageRoutingModule } from './ver-routing.module';

import { VerPage } from './ver.page';
import { SafeUrlPipe } from './safe-url-pipe';
// import { ComponentsModule } from 'src/app/components/components.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerPageRoutingModule,
    SafeUrlPipe,
    // ComponentsModule
    PdfViewerModule  // <- Aquí
  ],
  declarations: [VerPage]
})
export class VerPageModule { }
