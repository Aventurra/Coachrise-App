import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, Slides } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { TabsPage } from '../tabs/tabs';

@Component({
  selector: 'page-intro',
  templateUrl: 'intro.html'
})
export class Intro {
  @ViewChild('IntroTabs') introTabs: Slides;
	tabsPage = TabsPage;
  	constructor(
  		public navCtrl: NavController,
  		private storage:Storage) {
  	}

  goToHome(){
  	this.storage.set('introShown', true);
    this.navCtrl.setRoot(this.tabsPage);
  }
  proceed(){
    let index = this.introTabs.getActiveIndex();
    index++;
    this.introTabs.slideTo(index, 500);
  }
}