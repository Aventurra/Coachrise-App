import { Injectable,  } from '@angular/core';
import { Http, Headers, Response, RequestOptions, URLSearchParams } from '@angular/http';
import { Platform, LoadingController, ToastController } from 'ionic-angular';

import 'rxjs/add/operator/map';

import { Observable } from 'rxjs/Observable';
import { User } from "../models/user";
//import { InAppBrowser } from 'ionic-native';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { ConfigService } from "./config";


import { TabsPage } from '../pages/tabs/tabs';

import { Storage } from '@ionic/storage';


import { Facebook } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';

@Injectable()
export class AuthenticationService {  


	client_id: string;
	client_secret: string;
	redirect_uri: string;
	state: string;


	browser:any;

    //For Testing purpose
    headers: any;
    access_token: string;
    authCode: string;

    user:User;
	private observable: Observable<any>; //Tracks request in progress

    private baseUrl;
    constructor(
    	public http:Http,
    	private platform : Platform,
        private storage: Storage,
        private config:ConfigService,
        public fb: Facebook, 
        public loadingCtrl:LoadingController,
        public toastCtrl:ToastController,
        private iab:InAppBrowser,
        private googlePlus: GooglePlus
        ) {
        
        this.baseUrl = this.config.settings.oAuthUrl;
        this.client_id = this.config.settings.client_id; 
        this.client_secret = this.config.settings.client_secret;
        this.redirect_uri = this.config.settings.url; 
        this.state = this.config.settings.state; 

        if(!this.config.isLoggedIn){
            this.fb.browserInit(this.config.settings.facebook.app_id, "v2.9");    
        }
        
         
        this.access_token = this.config.settings.access_token;//'mbyrxvaoicy7encgoi3t62jt1koiq6szqmystpt0';

    }

    public authorizeURL(){
    	return this.baseUrl+'authorize?client_id='+this.client_id +'&redirect_uri='+this.redirect_uri+'&response_type=code&scope=basic&state='+this.state;
    }

    public tokenURL(){
      return this.baseUrl+'token';
    }

    public getAccessToken(){
        
        if(this.access_token)
            return this.access_token;
        else 
            return this.config.settings.access_token;

    }

    public setAccessToken(token:any){
        console.log('Setting access token '+token);
        if(token){
            this.access_token =  token;
            console.log('setting token '+token);
            this.config.set_settings('access_token',token);
        }
    }

    public setUser(user:any){
        this.user = user;
        this.storage.set('user',this.user);
        this.config.addToTracker('user',user);
    }

    private getHeaders(){
        this.headers = this.storage.get('token').then((token) => {
            return new Headers({
                "Content-Type": "application/json",
                "Authorization": token,
            });
        });
    }

    public authRequest(){

        this.platform.ready().then(() => {
        
            //, "EnableViewPortScale=yes,closebuttoncaption=Done"
            this.browser = this.iab.create(this.authorizeURL(), "_blank");

            this.browser.on('loadstop', function(event) {
                console.log('listen event oauth callback');

                if((event.url).startsWith(this.redirect_uri)) {
                    console.log('oauth callback url');
                    var query = event.url.substr(event.url.indexOf('?code') + 1);
                    var data = {};
                    var parts = query.split('&');

                    console.log(parts);

                    // read names and values
                    for (var i = 0; i < parts.length; i++) {
                        var name = parts[i].substr(0, parts[i].indexOf('='));
                        var val = parts[i].substr(parts[i].indexOf('=') + 1);
                        val = decodeURIComponent(val);
                        data[name] = val;
                        if(name == 'code'){
                            console.log('authorization code = '+val);
                            this.authCode = val;
                        }
                    }
                    let body = JSON.stringify({
                              grant_type: 'authorization_code',
                              code:this.authCode,
                              client_id:this.client_id,
                              client_secret: this.client_secret,
                              redirect_uri:this.redirect_uri
                          });

                    this.http.post(this.tokenURL(), body)
                      .map(res => res.json())
                      .subscribe(
                          data => {
                              console.log(data);
                              if(!data.error){
                                this.access_token = data.access_token;
                              }
                          },
                          err => {
                            console.log("ERROR!: ", err);
                          }
                      );
                
                }
            });


        });

        //return this.access_token;
    }

    public getUser(){
        
        if(this.config.trackComponents('user')){
            if(this.user){
                return Observable.of(this.user);
            }else{
                this.storage.get('user').then((user) => {
                    this.user = user;
                    return Observable.of(this.user);
                });
            }    
        }else{
            if(this.observable) {
                console.log('request pending');
                return this.observable;
            }else{

                let opt = this.getUserAuthorizationHeaders();

                this.observable =  this.http.get(`${this.config.baseUrl}user/`,opt)
                    .map(response =>{
                        this.observable = null;                    
                        if(response.status == 400) {
                          return "FAILURE";
                        } else if(response.status == 200) {

                            let body = response.json();
                            console.log(body);
                            if(body){ 
                                this.user = body;
                                this.config.updateComponents('user',this.user.id);
                                this.storage.set('user',this.user);
                                return body;
                            }
                        }
                    }); 
            }
        }
        return this.observable;
    }

    public fbLogin(){
        console.log('FB CLICKED');
        let  permissions = ["public_profile","email"];

        let loading = this.loadingCtrl.create({
            content: '<img src="assets/images/bubbles.svg">',
            duration: 2000,
            spinner:'hide',
            showBackdrop:true,

        });

        loading.present();
        let env = this;
        return Observable.of(this.fb.login(permissions)
            .then(function(response){
                console.log('FB LOGIN response');
                console.log(response);
                
                let userId = response.authResponse.userID;
                
                let params = new Array<string>();
               
                console.log('Calling FB API <<');
                env.fb.api("/me?fields=name,email,gender", params)
                .then(function(user) {
                    console.log('FB User response');
                    console.log(user);
                    env.config.isLoggedIn=true;
                    env.config.user.id=userId;
                    env.config.user.name=user.name;
                    env.config.user.email=user.email;
                    env.config.user.avatar="https://graph.facebook.com/" + userId + "/picture?type=large";
                    env.setUser(env.config.user);
                    console.log(env.config.user);
                    console.log('attempting signin');
                    loading.dismiss();
                })
          
            }, function(error){
              console.log(error);
        }));


    }

    public googleLogin(){
        let loading = this.loadingCtrl.create({
            content: '<img src="assets/images/bubbles.svg">',
            duration: 2000,
            spinner:'hide',
            showBackdrop:true,

        });

        loading.present();

        this.googlePlus.login({
          'webClientId': '748304661431-qspfovmnrg3iktegbsrvillbu5g4gmab.apps.googleusercontent.com'
        }).then((res) => {
            console.log(res);
            loading.dismiss();
        }, (err) => {
            console.log(err);
        });
    }

    public logout(){
        this.fb.logout();
        this.googlePlus.logout();
    }
    
    public signinUser(form:any): Observable<any>{

        if(this.observable) {
            console.log('User signin pending');
            return this.observable;
        }else{
            form.client_id = this.client_id;
            form.state = this.config.settings.state;
            
            let headers = new Headers({
                'Content-Type': 'application/json'
            });
            let options = new RequestOptions({
                headers: headers
            });

            this.observable =  this.http.post(`${this.config.baseUrl}user/signin`,form,options)
                .map(response =>{
                    this.observable = null;    

                    if(response.status == 400) {
                      return "FAILURE";
                    } else if(response.status == 200) {

                        let body = response.json();
                        if(body.status){
                            this.setAccessToken(body.token.access_token);
                            this.setUser(body.user);
                            this.config.track.counter--;
                            this.config.getTracker();
                        }

                        return {'status':body.status,'message':body.message};
                    }
                });

            return this.observable;    
        }

    }

    public registerUser(form:any): Observable<any>{
        
        if(this.observable) {
            console.log('User registration pending');
            return this.observable;
        }else{
            form.client_id = this.client_id;
            form.state = this.config.settings.state;
            

            let headers = new Headers({
            'Content-Type': 'application/json'
            });
            let options = new RequestOptions({
                headers: headers
            });

            this.observable =  this.http.post(`${this.config.baseUrl}user/register`,form,options)
                .map(response =>{
                    this.observable = null;    

                    if(response.status == 400) {
                      return "FAILURE";
                    } else if(response.status == 200) {

                        let body = response.json();
                        if(body.status){
                            this.setAccessToken(body.token.access_token);
                            this.setUser(body.user);
                        }

                        return {'status':body.status,'message':body.message};
                    }
                });

            return this.observable;    
        }

    }

    public checkEmailAvailability(control:any){
        let email = control.value;
        console.log('CALLED ='+email);
        return new Promise(resolve => {
            this.http.get(`${this.config.baseUrl}user/verify/?email=`+email)
              .map(res => res.json())
              .subscribe(data => {
                resolve(data);
              });
          });
    }
    public checkUsernameAvailability(control:any){
        let username = control.value;
        console.log('CALLED ='+username);
        return new Promise(resolve => {
            this.http.get(`${this.config.baseUrl}user/verify/?username=`+username)
                .map(res => res.json())
                .subscribe(data => {

                    resolve(data);
              });
          });
    }

    public getUserAuthorizationHeaders(){
        var userheaders = new Headers();
        userheaders.append('Authorization', this.config.settings.access_token);
        return new RequestOptions({ headers: userheaders }); 
    }

}  	