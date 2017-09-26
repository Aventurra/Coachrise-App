import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, NavParams, ModalController,ToastController,LoadingController, Platform, Slides } from 'ionic-angular';


import { ProfilePage } from '../profile/profile';
import { SearchPage } from '../search/search';

import { CourseService } from '../../services/course';
import { FullCourse } from '../../models/course';
import { Course } from '../../models/course';

import { InAppBrowser } from '@ionic-native/in-app-browser';

import { Storage } from '@ionic/storage';
import { ConfigService } from '../../services/config';
import { UserService } from '../../services/users';
import { CourseStatusPage } from '../course-status/course-status';

import { LazyImgComponent }   from '../components/lazy-img/lazy-img';
import { LazyLoadDirective }   from '../directives/lazy-load.directive';
import { ImgcacheService } from "../services/imageCache";

@Component({
  selector: 'page-course',
  templateUrl: 'course.html'
})
export class CoursePage implements OnInit{

  	isLoggedIn:false;
    message:string;
    fullCourse: FullCourse;
    course:Course;
  	user: any;
    browser: any;
    myCourse:boolean=false;
    myCoursestatus:number=0;
    coursetabs: string[]=[];
    courseStatusPage = CourseStatusPage;

    @ViewChild('CourseTabs') courseTabs: Slides;
    @ViewChild('CourseSlides') courseSlides: Slides;

    public selected = 0;
    public indicator = null;

  	constructor(public navCtrl: NavController, 
  		public navParams: NavParams,
  		public modalCtrl:ModalController,
      private courseService: CourseService,
      public platform: Platform,
      private config:ConfigService,
      public userService:UserService,
      private storage:Storage,
      private toastCtrl:ToastController,
      private loadingCtrl:LoadingController,
      private iab:InAppBrowser){}

    	ngOnInit(){      
        
          this.course = this.navParams.data;

          if('message' in this.navParams.data){
            this.message = this.navParams.get('message');
          }
          
          let loading = this.loadingCtrl.create({
            content: '<img src="assets/images/bubbles.svg">',
            duration: 15000,//this.config.get_translation('loadingresults'),
            spinner:'hide',
            showBackdrop:true,

        });


        loading.present();

          this.courseService.getFullCourse(this.course).subscribe(res=>{
              this.fullCourse = res;  
              loading.dismiss();
              for(var k in this.fullCourse){
                  if(k != 'course' && k != 'purchase_link'){this.coursetabs.push(k);}
              }
          });

          if(this.config.isLoggedIn){
            this.storage.get('courses_'+this.config.user.id).then(courses=>{
              console.log(courses);
              if(courses){
                if(Array.isArray(courses)){
                  for(let i=0;i<courses.length;i++){
                      if(courses[i].id == this.course.id){
                          this.myCourse=true;
                          this.myCoursestatus=courses[i].user_status;
                      }
                  }
                }
              }
            });
          }
     	}

      purchaseCourse(){

        console.log('Clocked');

        if(this.config.isLoggedIn){
          
          console.log('YAY ! ='+this.fullCourse.course.price);
          if(this.fullCourse.course.price == 0){
            console.log('YAY !')
            this.storage.remove('courses_'+this.config.user.id);
            this.storage.remove('fullcourse_'+this.course.id);
            this.config.removeFromTracker('courses',this.course.id);
            this.config.removeFromTracker('profiletabs','courses');


            this.userService.addCourse(this.course).subscribe(res=>{
              let toast = this.toastCtrl.create({
                  message: res.message,
                  duration: 1000,
                  position: 'bottom'
              });

              if(res.status){  
                  toast.onDidDismiss(() => {
                      this.navCtrl.setRoot(ProfilePage);
                  });
              }
              
              toast.present();
            });
          }
          
        }

        if(this.fullCourse.course.price != 0){
          
          
        
          this.platform.ready().then(() => {        
            if(this.fullCourse.purchase_link){

              this.browser = this.iab.create(this.fullCourse.purchase_link, "_blank","location=no"); //, "

              this.browser.show();
              this.browser.insertCSS({ code: "header,footer{display:none;}" });
              if(this.config.isLoggedIn){
                this.browser.executeScript({ code: "jQuery(document).ready(function(){ jQuery('#billing_email').val("+this.config.user.email+");jQuery('#billing_first_name').val("+this.config.user.name+"); });" });  
              }
              this.browser.on('loadstart').subscribe((event) => {
                
                if(event.url.indexOf('?key=wc_order_') !== -1){
                  let matches = event.url.match('.+/([0-9]+)/.+');
                  this.browser.close();
                  this.navCtrl.setRoot(ProfilePage);
                  //get order id
                  let order_id = matches[1];
                  
                }
              });
              this.browser.on('exit').subscribe((event) => {
                this.browser.close();
              });
            }
          });
        }

        console.log(this.fullCourse.course['price']+' res = '+ (this.fullCourse['price'] == 0 )+' && '+ this.config.isLoggedIn);
        
        if(this.fullCourse.course.price == 0 && !this.config.isLoggedIn){
          let toast = this.toastCtrl.create({
                  message: this.config.get_translation('register_account'),
                  duration: 1000,
                  position: 'bottom'
              });
          toast.present();
              
        }
           
      }

    
      selectedTab(index){
          this.courseSlides.slideTo(index, 500);
      }

      onTabChanged() {
          let index = this.courseTabs.getActiveIndex();
          this.courseSlides.slideTo(index, 500);
      }

      onSlideChanged() {
          let index = this.courseSlides.getActiveIndex();
          this.courseTabs.slideTo(index,500);
      }

     	openProfile(){
  	    let modal = this.modalCtrl.create(ProfilePage,{'isLoggedIn':this.isLoggedIn,'User':this.user});
  	    modal.present();
  	  }

      openSearch(){
          let modal = this.modalCtrl.create(SearchPage);
          modal.present();
      }

      show_course_status(){
        if(this.myCoursestatus == 1){
            return this.config.get_translation('start_course');
        }
        if(this.myCoursestatus == 2){
            return this.config.get_translation('continue_course');
        }
        if(this.myCoursestatus == 3){
            return this.config.get_translation('evaluation_course');
        }
        if(this.myCoursestatus == 4){
            return this.config.get_translation('completed_course');
        }
      }
    
}
