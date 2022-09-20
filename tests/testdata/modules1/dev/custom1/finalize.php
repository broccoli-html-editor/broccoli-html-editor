<?php
/**
 * finalize.php
 */
return function( $html, $supply ){
	$data = $supply['data']; // モジュールに入力されたデータが供給される。

	$html = '<p class="finalized" style="color: #f00;">finalized</p>'.$html.' - '.json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES).'<p class="finalized" style="color: #00f;">finalized</p>';

	return $html;
};
