/**
 * qrCode plugin from: https://github.com/jeromeetienne/jquery-qrcode
 */
(function() {
	var _parseUrl;
	// 获取当前url
  	chrome.tabs.query({active:true, currentWindow:true}, updateContentByTabs);
  	// 赋值到textarea
  	function updateContentByTabs(tabs){
		$("#formGroupExampleInput").val(tabs[0].url||"")
		_inputUrlResolve()
	}
	// 解析url
	function _inputUrlResolve() {
		_parseUrl =$("#formGroupExampleInput").val()
		$('#qrBox').html("")
		$('#qrBox').qrcode(_parseUrl);
		
	}
	function _getFocus() {
		console.log("select")
		 $("#formGroupExampleInput").select()

	}
	// 事件触发
	$('#parse').on("click", _inputUrlResolve)
	$('#formGroupExampleInput').on("focus", _getFocus)

})();