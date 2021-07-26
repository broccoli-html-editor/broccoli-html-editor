<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * Twig Helper
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class helper_twig{

	/**
	 * Constructor
	 */
	public function __construct(){
	}

	/**
	 * build
	 * @param string $template テンプレート
	 * @param array $data 入力データ
	 * @param array $funcs カスタム関数
	 * @return string バインド済み文字列
	 */
	public function bind($template, $data = array(), $funcs = array()){
		$rtn = $template;

		// PHP版は、ejs ではなく twig に対応
		if( class_exists('\\Twig_Loader_Array') ){
			// Twig ^1.35, ^2.12
			$loader = new \Twig_Loader_Array(array(
				'index' => $template,
			));
			$twig = new \Twig_Environment($loader, array('debug' => true, 'autoescape' => false));
			$twig->addExtension(new \Twig_Extension_Debug());
			foreach( $funcs as $fncName=>$callback ){
				$function = new \Twig_SimpleFunction($fncName, $callback);
				$twig->addFunction($function);
			}
			$rtn = $twig->render('index', $data);

		}elseif( class_exists('\\Twig\\Loader\\ArrayLoader') ){
			// Twig ^3.0.0
			$loader = new \Twig\Loader\ArrayLoader([
				'index' => $template,
			]);
			$twig = new \Twig\Environment($loader, array('debug' => true, 'autoescape' => false));
			$twig->addExtension(new \Twig\Extension\DebugExtension());
			foreach( $funcs as $fncName=>$callback ){
				$function = new \Twig\TwigFunction($fncName, $callback);
				$twig->addFunction($function);
			}
			$rtn = $twig->render('index', $data);

		}

		return $rtn;
	}

}
