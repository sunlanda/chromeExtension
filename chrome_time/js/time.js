/*
* @Author: chengfubei
* @Date:   2016-08-14 21:04:45
* @Last Modified by:   chengfubei
* @Last Modified time: 2016-08-14 21:42:23
*/

'use strict';

function showTime(el) {
	var today = new Date();
	var h= today.getHours();
	var m= today.getMinutes();
	var s= today.getSeconds();
	m=m>10?m:("0"+m);
	s=s>10?s:("0"+s); //不严谨判断 10
	el.innerHTML =h+":"+m+":"+s;
	setTimeout(function(){
		showTime(el);
	},1000)

}

showTime(document.getElementById('clock'));