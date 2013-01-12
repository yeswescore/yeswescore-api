package com.zenodus.client.html5;

import org.apache.cordova.*;
import org.apache.cordova.api.CordovaInterface;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;


public class zeScoreActivity extends DroidGap
{
	
    private ValueCallback<Uri> mUploadMessage;
    private final static int FILECHOOSER_RESULTCODE = 1;


	
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/index.html");
        
        //this.appView.setWebChromeClient(new FileAttachmentChromeClient(this, this.appView));
    }
    
    
 // openFileChooser is an overridable method in WebChromeClient which isn't
    // included in the SDK's Android stub code
    public class FileAttachmentChromeClient extends CordovaChromeClient {

        public FileAttachmentChromeClient(CordovaInterface ctx, CordovaWebView app) {
            super(ctx, app);

        }

        // For Android > 3.x
        public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType) {
            mUploadMessage = uploadMsg;
            Intent i = new Intent(Intent.ACTION_GET_CONTENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");

            zeScoreActivity.this.startActivityForResult(Intent.createChooser(i, "Choose type of attachment"), FILECHOOSER_RESULTCODE);

        }

        // For Android < 3.x
        public void openFileChooser(ValueCallback<Uri> uploadMsg) {
            mUploadMessage = uploadMsg;
            Intent i = new Intent(Intent.ACTION_GET_CONTENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");
            zeScoreActivity.this.startActivityForResult(Intent.createChooser(i, "Choose type of attachment"), FILECHOOSER_RESULTCODE);
        }

    }
    
}
