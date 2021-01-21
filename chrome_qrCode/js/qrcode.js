(function () {
  var _parseUrl;
	// 获取当前url
	if(chrome.tabs){
		chrome.tabs.query({active:true, currentWindow:true}, updateContentByTabs);
	}else{
		updateContentByTabs([{url:'http://127.0.0.1'}])
	}
  // 赋值到textarea
  function updateContentByTabs(tabs) {
    console.log(tabs[0]);
    $("#urlTextarea").val(tabs[0].url || "");
    _inputUrlResolve();
  }
  // 解析url
  function _inputUrlResolve() {
    console.log($("#urlTextarea").val());
    _parseUrl = $("#urlTextarea").val();
    $("#qrBox").html("");
    $("#qrBox").qrcode(_parseUrl);
    $("#qrBox").children('canvas').attr('id','canvas')
  }
  function _copyCurrentQr() {
		// ...
	}
	function funDownload(content, accept, filename='qrcode') {
		var saveImg = document.createElement('a');
		saveImg.href = content
		saveImg.download = filename
		document.body.appendChild(saveImg);  
		saveImg.click()
		document.body.removeChild(saveImg);  
	}
  function _getFocus() {
    console.log("select");
    $("#urlTextarea").select();
  }
  function canvasToImagePng() {
		if($('#urlTextarea').val()<1){
			return false
		}
		var canvas = document.getElementById("canvas")
		var png = canvas.toDataURL("image/png", 1.0);
		funDownload(png,'png')
  }
  function canvasToImageJpg() {
		if($('#urlTextarea').val()<1){
			return false
		}
		var canvas = document.getElementById("canvas")
		var jpg = canvas.toDataURL("image/jpeg", 1.0);
		funDownload(jpg,'jpeg')
  }
  // 事件触发
  $("#qrBox").on("click", "canvas", _copyCurrentQr);
  $("#dl_png").on("click", canvasToImagePng);
  $("#dl_jpg").on("click", canvasToImageJpg);
  
  $("#urlTextarea").on("focus", _getFocus);
  $("#urlTextarea").on("keyup", _inputUrlResolve);
})();
