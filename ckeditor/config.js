/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = function( config ) {
	config.enterMode = 2;
	config.shiftEnterMode = 1;
	config.allowedContent = true;
	
	config.contentsCss = './css/ckeditor-media-stickies-contents.css';

	config.toolbar = [
		{ name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'FontSize', 'TextColor', 'BGColor', 'EmojiPanel' ] }
	];

	config.plugins =
//		'about,' +
//		'a11yhelp,' +
		'autolink,' +
		'basicstyles,' +
		'bidi,' +
		'blockquote,' +
		'clipboard,' +
		'colorbutton,' +
		'colordialog,' +
		'copyformatting,' +
//		'contextmenu,' +
		'dialogadvtab,' +
		'div,' +
//		'elementspath,' +
		'enterkey,' +
		'entities,' +
		'emoji,' + 
//		'filebrowser,' +
		'find,' +
//		'flash,' +
		'floatingspace,' +
		'font,' +
//		'format,' +
		'forms,' +
		'horizontalrule,' +
		'htmlwriter,' +
//		'image,' +
		'image2,' +
		'iframe,' +
		'indentlist,' +
		'indentblock,' +
		'justify,' +
		'language,' +
		'link,' +
		'list,' +
		'liststyle,' +
		'magicline,' +
//		'maximize,' +
//		'newpage,' +
//		'pagebreak,' +
		'pastefromgdocs,' +
		'pastefromlibreoffice,' +
		'pastefromword,' +
		'pastetext,' +
//		'preview,' +
//		'print,' +
//		'removeformat,' +
//		'resize,' +
//		'save,' +
//		'selectall,' +
//		'showblocks,' +
		'showborders,' +
//		'smiley,' +
		'sourcearea,' +
		'specialchar,' +
//		'stylescombo,' +
		'tab,' +
		'table,' +
		'tableselection,' +
		'tabletools,' +
//		'templates,' +
		'toolbar,' +
		'undo,' +
//		'uploadimage,' +
		'wysiwygarea';

	config.toolbarLocation = 'bottom';
	config.fontSize_defaultLabel = '16';
};

// %LEAVE_UNMINIFIED% %REMOVE_LINE%
