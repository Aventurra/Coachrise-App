import { Component, ViewChild } from '@angular/core';
import { App, NavController, NavParams } from 'ionic-angular';

import { HomePage } from '../home/home';
import { AboutPage } from '../about/about';
import { ContactPage } from '../contact/contact';
import { CourseStatusPage } from '../course-status/course-status';
import { ProfilePage } from '../profile/profile';
import { DirectoryPage } from '../directory/directory';


import { WishlistPage } from '../wishlist/wishlist';
import { UpdatesPage } from '../updates/updates';
import { UpdatesService } from '../../services/updates';
import { ConfigService } from '../../services/config';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  myIndex:number;
  home: any = HomePage;
  profileTab: any = ProfilePage;
  courseStatus: any = CourseStatusPage;
  stats: any = ContactPage;
  wishlist: any = WishlistPage;
  directoryPage: any = DirectoryPage;
  updates:any = UpdatesPage;

  page:any;
  user: any;
  userdata: any;
  coursetatusdata: any;

  unread_count:number=2;

  constructor(
    private nav: NavController, 
    private navParams: NavParams,
    private config:ConfigService,
    private app:App,
    private updatesService:UpdatesService) {
    
    this.myIndex = 0;
    if (navParams.data.index){
      this.myIndex = navParams.data.index;
    }

    console.log("CONFIG ====");
    
  }

  ionViewDidEnter(){
    this.config.updateUser();
    this.config.getLastCourse();
    
    console.log(this.updatesService.updates.length+'<-Unread read ->'+this.updatesService.readupdates.length)
    this.unread_count = this.updatesService.updates.length - this.updatesService.readupdates.length;
    console.log(this.unread_count+'<---');
  }
}
