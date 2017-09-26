import { Component, OnInit, ViewChild } from '@angular/core';
import { App, Platform, NavController, MenuController, ModalController,LoadingController } from 'ionic-angular';

//import { StatusBar, Splashscreen } from 'ionic-native';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Intro } from '../pages/intro/intro';
import { TabsPage } from '../pages/tabs/tabs';
import { ContactPage } from '../pages/contact/contact';
import { BlogPage } from '../pages/blog/blog';
import { DirectoryPage } from '../pages/directory/directory';
import { InstructorsPage } from '../pages/instructors/instructors';
import { ConfigService } from '../services/config';
import { Storage } from '@ionic/storage';
import { ImgcacheService } from '../services/imageCache';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnInit {

  styles:any;
  tabsPage = TabsPage;
  intro:Intro;
  pages:any[]=[];

  rootPage: any = 'Tabs';
  loader: any;

  @ViewChild('nav') nav:NavController;
  
    constructor(private config:ConfigService,
        private platform: Platform, 
        private menuCtrl: MenuController,
        private loadingCtrl:LoadingController,
        private app:App,
        private storage:Storage,
        private imgcacheService:ImgcacheService) {


        this.presentLoading();

        platform.ready().then(() => {
            this.storage.get('introShown').then((result) => {
                if(result){
                    imgcacheService.initImgCache().then(() => {
                      this.rootPage = TabsPage;
                      this.loader.dismiss();
                    });
                    
                    
                } else {
                    this.rootPage = Intro;
                    
                    let nav = this.app.getRootNav();
                    imgcacheService.initImgCache().then(() => {
                      nav.setRoot(this.rootPage);
                      this.loader.dismiss();
                    });
                    
                }
            });
        });

        //Tracker
        
        this.pages =[
          { title: 'Home', component: TabsPage, index: 0, hide:false},
          { title: 'Directory', component: DirectoryPage, index: 2, hide:false},
          { title: 'Instructors', component: InstructorsPage, index: 3, hide:false},
          { title: 'Blog', component: BlogPage, index: 1, hide:false},
          { title: 'Contact', component: ContactPage, index: 4, hide:false},
        ];
        
    }

    ngOnInit(){
        this.config.initialize();
    }

    presentLoading() {
        this.loader = this.loadingCtrl.create({
            //content: "Loading..."
        });
        this.loader.present();
    }

    onLoad(page: any){
        let nav = this.app.getRootNav();

        nav.setRoot(page.component,{index:page.index});
        //nav.push(page);
        //this.app.getRootNav().push(page);
        //this.nav.push(page);
        //this.nav.setRoot(page);
        this.menuCtrl.close();
    }
}
