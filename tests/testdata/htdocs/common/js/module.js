/**
 * module: testMod1:dev/module_js
 */
try{
	(function(){

window.module_js = function(){
    alert('module_js()');
}

	})();

}catch(err){
	console.error('Module Error:', "testMod1:dev/module_js", err);
}


/**
 * module: testMod1:dev/resource_build
 */
try{
	(function(){

// javascript code

	})();

}catch(err){
	console.error('Module Error:', "testMod1:dev/resource_build", err);
}
