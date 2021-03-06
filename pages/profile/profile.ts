import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController,ViewController,LoadingController, ToastController,ActionSheetController,AlertController, NavParams, Slides,Platform } from 'ionic-angular';
import { FormBuilder, FormGroup,FormControl, Validators, } from '@angular/forms';

//import { InAppBrowser } from 'ionic-native';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import 'rxjs/add/operator/toPromise';


import { AuthenticationService } from '../../services/authentication';
import { UserService } from '../../services/users';
import { ConfigService } from '../../services/config';

import { User } from '../../models/user';
import { Profile } from '../../models/user';

import { CourseStatusPage } from '../course-status/course-status';
import { ResultPage } from '../result/result';
import { FriendlytimeComponent } from '../../components/friendlytime/friendlytime';

import { PressDirective } from '../../directives/longPress.directive';
import { TabsPage } from '../tabs/tabs';

import { Storage } from '@ionic/storage';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Chart } from 'chart.js';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage implements OnInit{

	isLoggedIn: boolean = false;
    register: boolean = false;
    signin: boolean = false;
	user: User;
    profile: Profile;
    filterargs:any;
    courseStatusPage = CourseStatusPage;
    resultPage=ResultPage;    
    signupForm: FormGroup;
    signinForm: FormGroup;
    profileTab:any;
    imageSrc: string;

    mycoursesactivetab:number=0
    signupFields:{
        'username':null,
        'email':null,
        'password':null,
    };

    signinFields:{
        'username_email':null,
        'password':null,
    };

    more:any={
        'courses':1,
        'results':1,
        'gradebook':1,
        'activity':1,
        'notifications':1,
    };
    @ViewChild('ProfileTabs') profileTabs: Slides;
    @ViewChild('ProfileSlides') profileSlides: Slides;

    @ViewChild('barCanvas') barCanvas;
    @ViewChild('lineCanvas') lineCanvas;
 
    lineChart: any;
    barChart: any;
  	constructor(private navCtrl: NavController, 
        private viewCtrl: ViewController, 
        private toastCtrl: ToastController,
        private navParams : NavParams, 
        private auth: AuthenticationService, 
        private userService:UserService,
        private platform:Platform,
        private config:ConfigService,
        private storage:Storage,
        private formBuilder:FormBuilder,
        private loadingCtrl:LoadingController,
        private action:ActionSheetController,
        private alertCtrl:AlertController,
        private camera: Camera,
        private iab:InAppBrowser
        ) {

            this.register = false;
            this.signin = false;
            this.signupForm = formBuilder.group({
                username: ['',Validators.compose([Validators.required,Validators.maxLength(30), 
                    Validators.pattern(/[a-zA-Z0-9_]+/)]),
                ],
                email: ['', Validators.compose(
                    [Validators.required,Validators.maxLength(40), 
                    Validators.pattern(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/) ])],
                password: ['', Validators.required],
            });

            this.signinForm = formBuilder.group({
                username: ['',Validators.required],
                password: ['', Validators.required],
            });
        }

    ngOnInit(){
        this.filterargs = {type:'number'};

        this.isLoggedIn = this.config.isLoggedIn;
        this.user = this.config.user;
        
        if(!this.config.settings.access_token){
            this.isLoggedIn = false;
        }
        
        if(this.isLoggedIn){

            //this.profileTab = this.navParams.data.index;
            this.userService.getProfile(this.user).subscribe(res=>{
                if(res){
                    this.profile = res;  
                    //this.profileSlides.slideTo(this.profileTab, 0);
                }
            });
        }
    }

  	ionViewDidLoad(){
        console.log('Inside DidLoad');

        if(this.config.isLoggedIn){

            this.userService.getResults();

            this.userService.getQuizChart().subscribe(res=>{
                if(res){
                    this.barChart = new Chart(this.barCanvas.nativeElement, {
                        type: 'bar',
                        data: {
                            labels: res.labels,
                            datasets: [{
                                label: this.config.get_translation('scores'),
                                data: res.data,
                            }]
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero:true
                                    }
                                }]
                            }
                        }
                    });
                }
            });

            this.userService.getCourseChart().subscribe(res=>{
                if(res){
                    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
                        type: 'line',
                        data: {
                            labels: res.labels,
                            datasets: [
                                {
                                    label: this.config.get_translation('percentage'),
                                    fill: false,
                                    lineTension: 0.1,
                                    backgroundColor: "rgba(75,192,192,0.4)",
                                    borderColor: "rgba(75,192,192,1)",
                                    borderCapStyle: 'butt',
                                    borderDash: [],
                                    borderDashOffset: 0.0,
                                    borderJoinStyle: 'miter',
                                    pointBorderColor: "rgba(75,192,192,1)",
                                    pointBackgroundColor: "#fff",
                                    pointBorderWidth: 1,
                                    pointHoverRadius: 5,
                                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                                    pointHoverBorderColor: "rgba(220,220,220,1)",
                                    pointHoverBorderWidth: 2,
                                    pointRadius: 1,
                                    pointHitRadius: 10,
                                    data: res.data,
                                    spanGaps: false,
                                }
                            ]
                        }
             
                    });
                }
            });
        }
    }
      

    showSignIn(){
        this.signin = true;
    }

    onFbLogin(){
        this.auth.fbLogin().subscribe(res=>{
            console.log('Inside FB Login');
            this.auth.signinUser({username:this.config.user.email,password:this.config.user.id}).subscribe(response=>{
                let body = response.json();
                console.log('Sign In response');
                console.log(body);
                if(body.status){
                    this.auth.setAccessToken(body.token.access_token);
                    console.log('Token -'+body.token.access_token);
                    this.navCtrl.setRoot(TabsPage);
                }else{ 

                    this.auth.registerUser({username:this.config.user.email,email:this.config.user.email,password:this.config.user.id}).subscribe(res=>{
                        if(res){
                            console.log('register response');
                            let body = response.json();
                            if(body.status){  
                                console.log('Token -'+body.token.access_token)
                                this.auth.setAccessToken(body.token.access_token);
                                this.navCtrl.setRoot(TabsPage);
                            }
                        }
                    });
                }
                
            })
            
        });
    }
    onSignIn(){
        if(this.signinForm.valid){
            
            let loading = this.loadingCtrl.create({
                content: '<img src="assets/images/bubbles.svg">',
                duration: 15000,//this.config.get_translation('loadingresults'),
                spinner:'hide',
                showBackdrop:true,

            });

            loading.present();
            this.auth.signinUser(this.signinForm.value).subscribe(res=>{
                if(res){
                    
                    let toast = this.toastCtrl.create({
                        message: res.message,
                        duration: 1000,
                        position: 'bottom'
                    });

                    if(res.status){  
                        this.userService.getUser();
                        toast.onDidDismiss(() => {
                            this.navCtrl.setRoot(TabsPage);
                        });
                    }
                    
                    toast.present();
                    loading.dismiss();
                    
                }
            });
        }
    }

    launchAuthorize() {
        this.auth.authRequest();        
    }

  	onClose(){
  		console.log("close");
  		this.viewCtrl.dismiss();
  	}

  	onSignUp(){
  		console.log(this.signupForm);

        let loading = this.loadingCtrl.create({
            content: '<img src="assets/images/bubbles.svg">',duration: 15000,//this.config.get_translation('loadingresults'),
            spinner:'hide',
            showBackdrop:true,

        });

        loading.present();

        if(this.signupForm.valid){
            
            this.auth.registerUser(this.signupForm.value).subscribe(res=>{
                if(res){
                    loading.dismiss();

                    let toast = this.toastCtrl.create({
                        message: res.message,
                        duration: 2000,
                        position: 'bottom'
                    });

                    if(res.status){  
                        this.userService.getUser();
                        toast.onDidDismiss(() => {
                            this.navCtrl.setRoot(TabsPage);
                        });
                    }
                    
                    toast.present();
                }
            });
        }
  	}

    enableRegister(){
      this.register = true;
    }

    backToLogin(){
      this.register = false;
      this.signin = false;
    }

    onTabChanged(){
        let index = this.profileTabs.getActiveIndex();
        this.profileSlides.slideTo(index, 500);
    }

    selectedTab(index:number){
        this.profileSlides.slideTo(index, 500);
    }

    onSlideChanged(){
        let index = this.profileSlides.getActiveIndex();
        this.profileTabs.slideTo(index,500);

        let key = this.profile.tabs[index].key;
        if(!this.profile.data.hasOwnProperty(key)){
            let id:any;
            if('id' in this.user){
                id = this.user.id;
            }else{
                id = this.user;
            }
            let loading = this.loadingCtrl.create({
                content: '<img src="assets/images/bubbles.svg">',duration: 15000,//this.config.get_translation('loadingresults'),
                spinner:'hide',
                showBackdrop:true,

            });
            loading.present();
            this.userService.getProfileTab(id,key).subscribe(res=>{
                loading.dismiss();
                this.profile = this.userService.profile;
                //this.profile.data[key] = res;  
            });
        }
    }

    filterDashData(d:any){
        return d.type == 'number';
    }

    filterObjectData(d:any){
         return d.type == 'objects';   
    }

    checkImage(d:any){
        return d.match(/.+\.(jpeg|jpg)$/);
    }

    triggerImage(url:string,title:string){
        //this.photoViewer.show(url,title);
    }

    triggerCertificateInBrowser(url:string){
        this.platform.ready().then(() => {
            this.iab.create(url, "_blank");
        });
    }

    getSlidesPerView(key:string){

        if(key == 'announcements')
            return 1;

        return 3;
    }

    getCourseProgress(course:any){

        console.log('Course progress');
        //return this.storage.get('courses')
        console.log(course);

        return course.user_progress;
    }

    getCoursStatus(course:any){
        console.log(course);
        return this.show_course_status(course.user_status);
    } 

    show_course_status(status:any){
        if(status == 1){
            return this.config.get_translation('start_course');
        }
        if(status == 2){
            return this.config.get_translation('continue_course');
        }
        if(status == 3){
            return this.config.get_translation('evaluation_course');
        }
        if(status == 4){
            return this.config.get_translation('completed_course');
        }
    }

    loadResult(result:any){

    }
    gettimediff(time:number){
        return (this.config.timestamp - time);
    }
    loadMore() {
        
        let index = this.profileTabs.getActiveIndex();

        let key = this.profile.tabs[index].key;
        console.log('LOADING MORE ='+key);
        return this.userService.getMoreProfileTab(this.user,key).toPromise().then(body=>{
                if(body){
                    console.log(body);
                    if(Array.isArray(body) && Array.isArray(this.profile.data[key])){
                        for(let i=0;i<body.length;i++){
                            if(this.profile.data[key].indexOf(body[i]) == -1){
                                this.profile.data[key].push(body[i]);
                            }
                        }
                        if(body.length < this.config.per_view){
                            this.more[key]=0;
                        }
                    }
                    if(key == 'results'){
                        this.storage.get('results_'+this.config.user.id).then(res=>{
                            if(res){
                                for(let i=0;i<body.length;i++){
                                    if(res.indexOf(body[i]) == -1){
                                        res.push(body[i]);
                                        this.storage.set('results_'+this.config.user.id,res);
                                    }
                                }
                            }
                        });
                    }
                }
        });
    }

    clearCache(){
        this.storage.set('track',this.config.defaultTrack).then(res=>{
            let toast = this.toastCtrl.create({
                message: this.config.get_translation('cache_cleared'),
                duration: 1000,
                position: 'bottom'
            });
            toast.present();
        });
    }

    syncData(){
        
        this.config.getTracker();
        setTimeout(function(){
            let toast = this.toastCtrl.create({
                message: this.config.get_translation('cache_cleared'),
                duration: 2000,
                position: 'bottom'
            });
            toast.present();
        },1000);
    }
    initiate_logout(){
        let alert = this.alertCtrl.create({
            title: this.config.get_translation('logout_from_device'),
            buttons: [
                    {
                        text: this.config.get_translation('cancel'),
                        role: 'cancel',
                        handler: data => {
                        },
                    },
                    {
                        text: this.config.get_translation('logout'),
                        handler: data => {
                            this.logout();
                            this.navCtrl.setRoot(TabsPage);
                        }
                    }
                    ]
            });
        
        alert.present();
    }
    logout(){
        this.storage.clear();
        this.auth.logout();
    }

    doRefresh(refresher){
        let index = this.profileSlides.getActiveIndex();
        let key = this.profile.tabs[index].key;
        console.log(key+'<<<<');
        this.userService.getProfileTab(this.config.user.id,key,true).subscribe(res=>{
            this.profile = this.userService.profile;
            refresher.complete();
        });
    }

    changeImage(){
        let actionSheet = this.action.create({
            title: this.config.get_translation('change_profile_image'),
            buttons: [
                {
                    text: this.config.get_translation('pick_gallery'),
                    handler: () => {
                        const options: CameraOptions = {
                            sourceType:this.camera.PictureSourceType.SAVEDPHOTOALBUM,
                            mediaType: this.camera.MediaType.PICTURE,
                            destinationType: this.camera.DestinationType.FILE_URI,      
                            encodingType: this.camera.EncodingType.JPEG,      
                            quality: 100,
                            allowEdit:true,
                            targetWidth: 460,
                            targetHeight: 460,
                            correctOrientation: true
                        };
                        this.camera.getPicture(options).then((file_uri) => {
                            this.user.avatar = file_uri;
                            this.config.user.avatar = file_uri;
                            this.storage.set('user',this.user);
                            this.userService.saveUserProfilePic(file_uri);
                        }, (err) => {
                          console.log(err);
                        });
                    }
                },
                {
                    text: this.config.get_translation('take_photo'),
                    handler: () => {

                        const options: CameraOptions = {
                            sourceType:this.camera.PictureSourceType.CAMERA,
                            destinationType: this.camera.DestinationType.FILE_URI, 
                            mediaType: this.camera.MediaType.PICTURE,     
                            encodingType: this.camera.EncodingType.JPEG,      
                            quality: 100,
                            allowEdit:true,
                            saveToPhotoAlbum:true,
                            targetWidth: 460,
                            targetHeight: 460,
                            correctOrientation: true
                        };
                        this.camera.getPicture(options).then((file_uri) => {
                            this.user.avatar = file_uri;
                            this.config.user.avatar = file_uri;
                            this.storage.set('user',this.user);
                            this.userService.saveUserProfilePic(file_uri);
                        }, (err) => {
                          console.log(err);
                        });
                    }
                },
                {
                    text: this.config.get_translation('cancel'),
                    role:this.config.get_translation('cancel'),
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                }
            ]
        });

        actionSheet.present();
    }

    editField(field:any){
        let inputs:any[]=[];
        let value = '';
        if('type' in field){
            switch(field.type){
                case 'textbox':
                case 'textarea':
                    
                    if(field.value){
                        value = field.value;
                    }
                    inputs = [{
                        name: field.name,
                        value: value,
                    }];
                break;
                case 'url':
                    if(field.value){
                        value = field.value;
                    }
                    inputs = [{
                        name: field.name,
                        value: value,
                    }];
                break;
                case 'checkbox':
                case 'multiselectbox':
                if(field.options){
                    let field_value:any;
                    if(field.value && !Array.isArray(field.value)){
                        field_value =  field.value.split(','); 
                    }
                    for(let i=0;i<field.options.length;i++){
                       let option:any;
                        option = {
                            name: field.name,
                            type:'checkbox',
                            label: field.options[i],
                            value: field.options[i],
                        };
                        if(field_value && field_value.indexOf(field.options[i]) > -1){
                            option.checked=true;
                        }
                        inputs.push(option);
                    }

                }
                break;
                case 'datebox':
                    if(field.value){
                        value = field.value;
                    }
                    inputs = [{
                        name: field.name,
                        value: value,
                        type:'date',
                    }];
                break;
                case 'radio':
                case 'selectbox':
                if(field.options){
                    for(let i=0;i<field.options.length;i++){
                       let option:any;
                        option = {
                            name: field.name,
                            placeholder: field.value,
                            type:'radio',
                            label: field.options[i],
                            value: field.options[i],
                        };
                        if(field.options[i] == field.value){
                            option.checked=true;
                        }
                        inputs.push(option);
                    }

                }
                break;
                
            }
        }
        this.presentPrompt(field,inputs);
    }

    presentPrompt(field:any,inputs:any) {

        let alert = this.alertCtrl.create({
            title: this.config.get_translation('edit_profile_field'),
            inputs: inputs,
            buttons: [
                    {
                        text: this.config.get_translation('cancel'),
                        role: 'cancel',
                        handler: data => {
                            console.log(field);
                        },
                    },
                    {
                        text: this.config.get_translation('change'),
                        handler: data => {
                            let go = 1;
                            if(field.type && (field.type=='checkbox' || field.type=='multiselectbox')){
                                field.value =  data.join(',');
                            }else if(field.type && (field.type=='selectbox' ||  field.type=='radio' )){
                                 field.value =  data;
                            }else if(field.type == 'url'){
                                if(data[field.name] && data[field.name].length){
                                   if(data[field.name].match(/^(https?:\/\/)?([\da-z*.-]+)\.([a-z\.]{2,6})([\/\w*\s(|%20).-]*)*\/?$/)){
                                    field.value = data[field.name];
                                    }else{
                                        go = 0;
                                        let toast = this.toastCtrl.create({
                                        message: this.config.get_translation('invalid_url'),
                                            duration: 1000,
                                            position: 'bottom'
                                        });
                                        
                                        toast.present();
                                    } 
                                }
                            }else if(data[field.name]){
                                field.value = data[field.name];
                            }
                            let res = this.profile.data['profile'];
                            for(let i=0;i<res.length;i++){
                                if(res[i] && res[i].fields){
                                    if(res[i].fields.length){
                                        for(let k=0;k<res[i].fields.length;k++){
                                            if(res[i].fields[k].id == field.id){
                                                res[i].fields[k] = field;
                                                this.userService.editProfileField(field,go);
                                            }
                                        }
                                    }
                                }
                            }
                            this.profile.data['profile'] = res;
                        }
                    }
                    ]
            });
        
        alert.present();
    }

    showterms(){
        
        let alert = this.alertCtrl.create({
            title: this.config.get_translation('login_terms_conditions'),
            message:this.config.terms_conditions,
            buttons: [
            {
                text: this.config.get_translation('accept_continue'),
                role: 'cancel',
                }
            ]
        });
        alert.present();
    }

    showMyCourses(status:any){
        if(Array.isArray(this.profile.data['courses'])){

            this.storage.get('courses_'+this.config.user.id).then(courses=>{
                if(courses){
                    switch(status){
                        case 'all':
                            this.mycoursesactivetab=0;
                            this.profile.data['courses']=courses;
                        break;
                        case 'active':
                            this.mycoursesactivetab=1;
                            this.profile.data['courses']= courses.filter((item) => {
                                return item.user_progress <100 ;
                            });
                        break;
                        case 'finished':
                            this.mycoursesactivetab=2;
                            this.profile.data['courses']= courses.filter((item) => {
                                return item.user_progress >=100 ;
                            });
                        break;
                    }
                }
            })
        }
    }
}