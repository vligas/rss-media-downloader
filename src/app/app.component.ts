import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/admob-free/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {


  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private admobFree: AdMobFree,
    private keyboard: Keyboard,
    private permission: AndroidPermissions
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      this.statusBar.styleBlackTranslucent();
      this.splashScreen.hide();
      const bannerConfig: AdMobFreeBannerConfig = {
        id: 'ca-app-pub-4051415397631703/1639666684',
        autoShow: true
      };
      this.permission.requestPermission(this.permission.PERMISSION.WRITE_EXTERNAL_STORAGE);
      this.admobFree.banner.config(bannerConfig);
      this.admobFree.banner.prepare().then(() => {
      }).catch(alert);

    });
  }
}
