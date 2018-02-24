/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	config.language = 'en';
//	config.toolbarLocation = 'bottom';
	config.fontSize_sizes = '16/16px;24/24px;36/36px;';
//	config.skin = 'kama';
	// config.uiColor = '#AADC6E';
	config.toolbar = [
		{ name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'TextColor', 'BGColor', 'FontSize' ] }
	];

};