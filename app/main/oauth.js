import { BrowserWindow } from "electron";
import electronGoogleOauth from "./google-oauth";
import config from "./config";
import { sendToUi } from "./index";

const googleSignInPopup = async (parentWindow) => {
  const platform = 'google';
  const browserWindowParams = {
    center: true,
    show: true,
    resizable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    // to disable parent window while auth popup is active
    parent: parentWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false
    }
  };

  const googleOauth = electronGoogleOauth(browserWindowParams);
  try {
    const result = await googleOauth.getAccessToken(
      ['email', 'profile'],
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
    );
    const { access_token } = result;
    sendToUi('social:login', { access_token, platform });
  } catch (e) {
    sendToUi('social:login:error', { platform });
  }

};

const facebookSignInPopup = async (parentWindow) => {
  const platform = 'facebook';
  const redirectUri = 'https://www.facebook.com/connect/login_success.html';
  const fbOAuthUri = 'https://www.facebook.com/v6.0/dialog/oauth';
  const fbLoginUrl = `${fbOAuthUri}?client_id=${config.FB_APP_ID}&redirect_uri=${redirectUri}&response_type=token&scope=email`;

  const authWindow = new BrowserWindow({
    width: 640,
    height: 600,
    center: true,
    show: false,
    parent: parentWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false
    }
  });

  authWindow.loadURL(fbLoginUrl);
  authWindow.webContents.on('did-finish-load', function () {
    authWindow.show();
  });

  let access_token, error;
  let closedByUser = true;

  const handleUrl = async function (url) {
    console.log(url);
    const fbTokenRegexp = /access_token=([^&]*)/;
    const fbErrorRegexp = /\?error=(.+)$/;

    const raw_code = fbTokenRegexp.exec(url) || null;
    access_token = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
    error = fbErrorRegexp.exec(url);

    if (access_token || error) {
      closedByUser = false;
      if (access_token) {
        console.log(`Got facebook access token: ${access_token}`);
        // const meUrl = `https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email,first_name`;
        // const me = await axios.get(meUrl).then(response => response.data);
        // console.log(me);
        sendToUi('social:login', { access_token, platform });
      }
      if (error) {
        console.log(`Got facebook error ${error}`);
        sendToUi('social:login:error', { platform });
      }
      authWindow.close();
    }
  }

  authWindow.webContents.on('will-redirect', (event, url) => handleUrl(url));

  authWindow.on('close', (event) => event.returnValue = closedByUser ? { error: 'The popup window was closed' } : { access_token, error })
}

module.exports = {
  googleSignInPopup,
  facebookSignInPopup,
}
