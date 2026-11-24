package com.wuorr.cliploop;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Full-screen wrapper around https://clip-loop.wuorr.com/ for Android TV / Google TV.
 * The web page does all the work (clip grid, looping, D-pad navigation); this just
 * gives it a home-screen tile, no browser chrome, and sensible Back-button behavior.
 */
public class MainActivity extends Activity {
    private static final String HOME = "https://clip-loop.wuorr.com/";
    private static final String HOST = "clip-loop.wuorr.com";

    // The app is already full screen, so hide the page's own full-screen button.
    private static final String HIDE_FS_JS =
        "(function(){var b=document.getElementById('fs');if(b){b.hidden=true;}})();";

    // When coming back to the app, reload to pick up clip changes — but only if
    // nothing is playing, so we never yank a video out from under him.
    private static final String RELOAD_IF_IDLE_JS =
        "(function(){var w=document.getElementById('player-wrap');"
        + "if(!w||!w.classList.contains('on')){location.reload();}})();";

    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#10151f"));

        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Stay on Clip Loop; ignore anything that tries to navigate elsewhere.
                return !HOST.equals(Uri.parse(url).getHost());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(HIDE_FS_JS, null);
            }
        });
        web.setWebChromeClient(new WebChromeClient());

        setContentView(web);
        if (state != null) {
            web.restoreState(state);
        } else {
            web.loadUrl(HOME);
        }
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        web.evaluateJavascript(RELOAD_IF_IDLE_JS, null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        hideSystemUi();
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // While a clip plays, Back returns to the clip grid (the page uses history
        // for that). On the grid itself, Back leaves the app.
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
}
