/**
 * Created by chengfubei on 2016/8/26.
 */

chrome.browserAction.onClicked.addListener(function(tab){
    console.log('Turning ' + tab.url + ' red!');
    chrome.tabs.executeScript({
        code:"document.body.style.backgroundColor='rgb(203,233,207)'"
    });
});
