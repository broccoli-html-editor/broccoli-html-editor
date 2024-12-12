<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * File Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class file extends \broccoliHtmlEditor\fieldBase{

	/** $broccoli */
	private $broccoli;

	/** Dummy Image */
	private $_imgDummy = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTYyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTYyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjOTk5OTk5IiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMjExMF80NDYzKSI+CjxwYXRoIGQ9Ik03NzIuMjg4IDQ5Mi44MTJDNzcyLjI4OCA1MDAuMzIxIDc2OS4zMDUgNTA3LjUyMyA3NjMuOTk1IDUxMi44MzJDNzU4LjY4NiA1MTguMTQyIDc1MS40ODQgNTIxLjEyNSA3NDMuOTc1IDUyMS4xMjVDNzM2LjQ2NiA1MjEuMTI1IDcyOS4yNjUgNTE4LjE0MiA3MjMuOTU1IDUxMi44MzJDNzE4LjY0NiA1MDcuNTIzIDcxNS42NjMgNTAwLjMyMSA3MTUuNjYzIDQ5Mi44MTJDNzE1LjY2MyA0ODUuMzA0IDcxOC42NDYgNDc4LjEwMiA3MjMuOTU1IDQ3Mi43OTNDNzI5LjI2NSA0NjcuNDgzIDczNi40NjYgNDY0LjUgNzQzLjk3NSA0NjQuNUM3NTEuNDg0IDQ2NC41IDc1OC42ODYgNDY3LjQ4MyA3NjMuOTk1IDQ3Mi43OTNDNzY5LjMwNSA0NzguMTAyIDc3Mi4yODggNDg1LjMwNCA3NzIuMjg4IDQ5Mi44MTJaIiBmaWxsPSIjQUFBQUFBIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgo8cGF0aCBkPSJNNjk2Ljc4OCA0MDcuODc1QzY4Ni43NzYgNDA3Ljg3NSA2NzcuMTc0IDQxMS44NTIgNjcwLjA5NCA0MTguOTMyQzY2My4wMTUgNDI2LjAxMSA2NTkuMDM4IDQzNS42MTMgNjU5LjAzOCA0NDUuNjI1VjYzNC4zNzVDNjU5LjAzOCA2NDQuMzg3IDY2My4wMTUgNjUzLjk4OSA2NzAuMDk0IDY2MS4wNjhDNjc3LjE3NCA2NjguMTQ4IDY4Ni43NzYgNjcyLjEyNSA2OTYuNzg4IDY3Mi4xMjVIOTIzLjI4OEM5MzMuMyA2NzIuMTI1IDk0Mi45MDIgNjY4LjE0OCA5NDkuOTgxIDY2MS4wNjhDOTU3LjA2MSA2NTMuOTg5IDk2MS4wMzggNjQ0LjM4NyA5NjEuMDM4IDYzNC4zNzVWNDQ1LjYyNUM5NjEuMDM4IDQzNS42MTMgOTU3LjA2MSA0MjYuMDExIDk0OS45ODEgNDE4LjkzMkM5NDIuOTAyIDQxMS44NTIgOTMzLjMgNDA3Ljg3NSA5MjMuMjg4IDQwNy44NzVINjk2Ljc4OFpNOTIzLjI4OCA0MjYuNzVDOTI4LjI5NCA0MjYuNzUgOTMzLjA5NSA0MjguNzM5IDkzNi42MzQgNDMyLjI3OEM5NDAuMTc0IDQzNS44MTggOTQyLjE2MyA0NDAuNjE5IDk0Mi4xNjMgNDQ1LjYyNVY1NjguMzEyTDg3MC44NzIgNTMxLjU2M0M4NjkuMTAyIDUzMC42NzYgODY3LjA5OCA1MzAuMzY5IDg2NS4xNDMgNTMwLjY4NEM4NjMuMTg5IDUzMC45OTkgODYxLjM4MyA1MzEuOTIgODU5Ljk4MSA1MzMuMzE4TDc4OS45NTUgNjAzLjM0NEw3MzkuNzQ3IDU2OS44OThDNzM3LjkzNCA1NjguNjkxIDczNS43NiA1NjguMTQ4IDczMy41OTMgNTY4LjM2MkM3MzEuNDI2IDU2OC41NzUgNzI5LjM5OSA1NjkuNTMxIDcyNy44NTYgNTcxLjA2OEw2NzcuOTEzIDYxNS41VjQ0NS42MjVDNjc3LjkxMyA0NDAuNjE5IDY3OS45MDEgNDM1LjgxOCA2ODMuNDQxIDQzMi4yNzhDNjg2Ljk4MSA0MjguNzM5IDY5MS43ODIgNDI2Ljc1IDY5Ni43ODggNDI2Ljc1SDkyMy4yODhaIiBmaWxsPSIjQUFBQUFBIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzIxMTBfNDQ2MyI+CjxyZWN0IHdpZHRoPSIzMDIiIGhlaWdodD0iMzAyIiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNjU5IDM4OSkiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K';

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
		parent::__construct($broccoli);
	}

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = array();
		if( is_array($fieldData) ){
			$rtn = $fieldData;
		}
		if( !array_key_exists('resKey', $rtn) ){
			$rtn['resKey'] = null;
		}
		if( !array_key_exists('path', $rtn) ){
			$rtn['path'] = null;
		}
		if( !array_key_exists('resType', $rtn) ){
			$rtn['resType'] = null;
		}

		if( $rtn['resType'] == 'web' ){
			return $rtn['webUrl'];
		}elseif( $rtn['resType'] == 'none' ){
			return '';
		}else{
			$data = json_decode('{}');
			$resMgr = $this->broccoli->resourceMgr();
			$data->resourceInfo = $resMgr->getResource( $rtn['resKey'] );

			$is_image_uploaded = true;
			if( $data->resourceInfo === false ){
				$is_image_uploaded = false;
			}elseif( is_object($data->resourceInfo) ){
				if( !property_exists($data->resourceInfo, 'base64') || !strlen(''.$data->resourceInfo->base64) ){
					$is_image_uploaded = false;
				}elseif( property_exists($data->resourceInfo, 'size') && !$data->resourceInfo->size ){
					$is_image_uploaded = false;
				}
			}
			if( $mode != 'canvas' && !$is_image_uploaded ){
				return '';
			}

			$realpath = $resMgr->getResourcePublicRealpath( $rtn['resKey'] );
			$data->publicRealpath = $realpath;

			$publicPath = $resMgr->getResourcePublicPath( $rtn['resKey'] );
			if( !$data->resourceInfo ){
				$publicPath = '';
			}
			$rtn['path'] = $publicPath;
			$data->path = $publicPath;

			if( $mode == 'canvas' ){
				if( !is_file($data->publicRealpath) ){
					// ↓ ダミーの Sample Image
					$data->path = $this->broccoli->getNoimagePlaceholder() ?? $this->_imgDummy;
				}else{
					$resourceType = 'image/png';
					if( property_exists($data, 'resourceInfo') && property_exists($data->resourceInfo, 'type') ){
						$resourceType = $data->resourceInfo->type;
					}
					$data->path = 'data:'.$resourceType.';base64,'.'{broccoli-html-editor-resource-baser64:{'.$rtn['resKey'].'}}';
				}
			}
			if( !$data->path && $data->resourceInfo && $data->resourceInfo->base64 ){
				$data->path = 'data:'.$data->resourceInfo->type.';base64,'.$data->resourceInfo->base64;
			}

			return $data->path;
		}

		return '';
	}

	/**
	 * GPI (Server Side)
	 */
	public function gpi($options){

		switch($options['api']){
			case 'getImageByUrl':
				$result = array();
				$result['base64'] = @base64_encode(file_get_contents($options['data']['url']));
				$result['responseHeaders'] = $http_response_header;
				foreach($http_response_header as $row){
					if(preg_match('/^HTTP\/[0-9\.]+\s+([1-9][0-9]*)/', $row, $matched)){
						$result['status'] = intval( $matched[1] );
					}
				}
				return $result;

			default:
				return 'ERROR: Unknown API';
		}

		return false;
	}

}
