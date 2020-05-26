﻿/*
 Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
*/
(function(){function D(a){return CKEDITOR.plugins.widget&&CKEDITOR.plugins.widget.isDomWidget(a)}function z(a,b){var c=a.getAscendant("table"),d=b.getAscendant("table"),e=CKEDITOR.tools.buildTableMap(c),g=r(a),k=r(b),h=[],f={},l,p;c.contains(d)&&(b=b.getAscendant({td:1,th:1}),k=r(b));g>k&&(c=g,g=k,k=c,c=a,a=b,b=c);for(c=0;c<e[g].length;c++)if(a.$===e[g][c]){l=c;break}for(c=0;c<e[k].length;c++)if(b.$===e[k][c]){p=c;break}l>p&&(c=l,l=p,p=c);for(c=g;c<=k;c++)for(g=l;g<=p;g++)d=new CKEDITOR.dom.element(e[c][g]),
d.$&&!d.getCustomData("selected_cell")&&(h.push(d),CKEDITOR.dom.element.setMarker(f,d,"selected_cell",!0));CKEDITOR.dom.element.clearAllMarkers(f);return h}function I(a){return(a=a.editable().findOne(".cke_table-faked-selection"))&&a.getAscendant("table")}function A(a,b){var c=a.editable().find(".cke_table-faked-selection"),d=a.editable().findOne("[data-cke-table-faked-selection-table]"),e;a.fire("lockSnapshot");a.editable().removeClass("cke_table-faked-selection-editor");for(e=0;e<c.count();e++)c.getItem(e).removeClass("cke_table-faked-selection");
d&&d.data("cke-table-faked-selection-table",!1);a.fire("unlockSnapshot");b&&(m={active:!1},a.getSelection().isInTable()&&a.getSelection().reset())}function t(a,b){var c=[],d,e;for(e=0;e<b.length;e++)d=a.createRange(),d.setStartBefore(b[e]),d.setEndAfter(b[e]),c.push(d);a.getSelection().selectRanges(c)}function J(a){var b=a.editable().find(".cke_table-faked-selection");1>b.count()||(b=z(b.getItem(0),b.getItem(b.count()-1)),t(a,b))}function K(a,b,c){var d=v(a.getSelection(!0));b=b.is("table")?null:
b;var e;(e=m.active&&!m.first)&&!(e=b)&&(e=a.getSelection().getRanges(),e=1<d.length||e[0]&&!e[0].collapsed?!0:!1);if(e)m.first=b||d[0],m.dirty=b?!1:1!==d.length;else if(m.active&&b&&m.first.getAscendant("table").equals(b.getAscendant("table"))){d=z(m.first,b);if(!m.dirty&&1===d.length&&!D(c.data.getTarget()))return A(a,"mouseup"===c.name);m.dirty=!0;m.last=b;t(a,d)}}function L(a){var b=(a=a.editor||a.sender.editor)&&a.getSelection(),c=b&&b.getRanges()||[],d=c&&c[0].getEnclosedNode(),d=d&&d.type==
CKEDITOR.NODE_ELEMENT&&d.is("img"),e;if(b&&(A(a),b.isInTable()&&b.isFake))if(d)a.getSelection().reset();else if(!c[0]._getTableElement({table:1}).hasAttribute("data-cke-tableselection-ignored")){1===c.length&&c[0]._getTableElement()&&c[0]._getTableElement().is("table")&&(e=c[0]._getTableElement());e=v(b,e);a.fire("lockSnapshot");for(b=0;b<e.length;b++)e[b].addClass("cke_table-faked-selection");0<e.length&&(a.editable().addClass("cke_table-faked-selection-editor"),e[0].getAscendant("table").data("cke-table-faked-selection-table",
""));a.fire("unlockSnapshot")}}function r(a){return a.getAscendant("tr",!0).$.rowIndex}function w(a){function b(a,b){return a&&b?a.equals(b)||a.contains(b)||b.contains(a)||a.getCommonAncestor(b).is(l):!1}function c(a){return!a.getAscendant("table",!0)&&a.getDocument().equals(e.document)}function d(a,b,d,e){if("mousedown"===a.name&&(CKEDITOR.tools.getMouseButton(a)===CKEDITOR.MOUSE_BUTTON_LEFT||!e))return!0;if(b=a.name===(CKEDITOR.env.gecko?"mousedown":"mouseup")&&!c(a.data.getTarget()))a=a.data.getTarget().getAscendant({td:1,
th:1},!0),b=!(a&&a.hasClass("cke_table-faked-selection"));return b}if(a.data.getTarget().getName&&("mouseup"===a.name||!D(a.data.getTarget()))){var e=a.editor||a.listenerData.editor,g=e.getSelection(1),k=I(e),h=a.data.getTarget(),f=h&&h.getAscendant({td:1,th:1},!0),h=h&&h.getAscendant("table",!0),l={table:1,thead:1,tbody:1,tfoot:1,tr:1,td:1,th:1};h&&h.hasAttribute("data-cke-tableselection-ignored")||(d(a,g,k,h)&&A(e,!0),!m.active&&"mousedown"===a.name&&CKEDITOR.tools.getMouseButton(a)===CKEDITOR.MOUSE_BUTTON_LEFT&&
h&&(m={active:!0},CKEDITOR.document.on("mouseup",w,null,{editor:e})),(f||h)&&K(e,f||h,a),"mouseup"===a.name&&(CKEDITOR.tools.getMouseButton(a)===CKEDITOR.MOUSE_BUTTON_LEFT&&(c(a.data.getTarget())||b(k,h))&&J(e),m={active:!1},CKEDITOR.document.removeListener("mouseup",w)))}}function M(a){var b=a.data.getTarget().getAscendant("table",!0);b&&b.hasAttribute("data-cke-tableselection-ignored")||(b=a.data.getTarget().getAscendant({td:1,th:1},!0))&&!b.hasClass("cke_table-faked-selection")&&(a.cancel(),a.data.preventDefault())}
function N(a,b){function c(a){a.cancel()}var d=a.getSelection(),e=d.createBookmarks(),g=a.document,k=a.createRange(),h=g.getDocumentElement().$,f=CKEDITOR.env.ie&&9>CKEDITOR.env.version,l=a.blockless||CKEDITOR.env.ie?"span":"div",p,x,n,m;g.getById("cke_table_copybin")||(p=g.createElement(l),x=g.createElement(l),x.setAttributes({id:"cke_table_copybin","data-cke-temp":"1"}),p.setStyles({position:"absolute",width:"1px",height:"1px",overflow:"hidden"}),p.setStyle("ltr"==a.config.contentsLangDirection?
"left":"right","-5000px"),p.setHtml(a.getSelectedHtml(!0)),a.fire("lockSnapshot"),x.append(p),a.editable().append(x),m=a.on("selectionChange",c,null,null,0),f&&(n=h.scrollTop),k.selectNodeContents(p),k.select(),f&&(h.scrollTop=n),setTimeout(function(){x.remove();d.selectBookmarks(e);m.removeListener();a.fire("unlockSnapshot");b&&(a.extractSelectedHtml(),a.fire("saveSnapshot"))},100))}function E(a){var b=a.editor||a.sender.editor,c=b.getSelection();c.isInTable()&&(c.getRanges()[0]._getTableElement({table:1}).hasAttribute("data-cke-tableselection-ignored")||
N(b,"cut"===a.name))}function q(a){this._reset();a&&this.setSelectedCells(a)}function B(a,b,c){a.on("beforeCommandExec",function(d){-1!==CKEDITOR.tools.array.indexOf(b,d.data.name)&&(d.data.selectedCells=v(a.getSelection()))});a.on("afterCommandExec",function(d){-1!==CKEDITOR.tools.array.indexOf(b,d.data.name)&&c(a,d.data)})}var m={active:!1},y,v,C,F,G;q.prototype={};q.prototype._reset=function(){this.cells={first:null,last:null,all:[]};this.rows={first:null,last:null}};q.prototype.setSelectedCells=
function(a){this._reset();a=a.slice(0);this._arraySortByDOMOrder(a);this.cells.all=a;this.cells.first=a[0];this.cells.last=a[a.length-1];this.rows.first=a[0].getAscendant("tr");this.rows.last=this.cells.last.getAscendant("tr")};q.prototype.getTableMap=function(){var a=C(this.cells.first),b;a:{b=this.cells.last;var c=b.getAscendant("table"),d=r(b),c=CKEDITOR.tools.buildTableMap(c),e;for(e=0;e<c[d].length;e++)if((new CKEDITOR.dom.element(c[d][e])).equals(b)){b=e;break a}b=void 0}return CKEDITOR.tools.buildTableMap(this._getTable(),
r(this.rows.first),a,r(this.rows.last),b)};q.prototype._getTable=function(){return this.rows.first.getAscendant("table")};q.prototype.insertRow=function(a,b,c){if("undefined"===typeof a)a=1;else if(0>=a)return;for(var d=this.cells.first.$.cellIndex,e=this.cells.last.$.cellIndex,g=c?[]:this.cells.all,k,h=0;h<a;h++)k=F(c?this.cells.all:g,b),k=CKEDITOR.tools.array.filter(k.find("td, th").toArray(),function(a){return c?!0:a.$.cellIndex>=d&&a.$.cellIndex<=e}),g=b?k.concat(g):g.concat(k);this.setSelectedCells(g)};
q.prototype.insertColumn=function(a){function b(a){a=r(a);return a>=e&&a<=g}if("undefined"===typeof a)a=1;else if(0>=a)return;for(var c=this.cells,d=c.all,e=r(c.first),g=r(c.last),c=0;c<a;c++)d=d.concat(CKEDITOR.tools.array.filter(G(d),b));this.setSelectedCells(d)};q.prototype.emptyCells=function(a){a=a||this.cells.all;for(var b=0;b<a.length;b++)a[b].setHtml("")};q.prototype._arraySortByDOMOrder=function(a){a.sort(function(a,c){return a.getPosition(c)&CKEDITOR.POSITION_PRECEDING?-1:1})};var H={onPaste:function(a){function b(a){var b=
d.createRange();b.selectNodeContents(a);b.select()}function c(a){return Math.max.apply(null,CKEDITOR.tools.array.map(a,function(a){return a.length},0))}var d=a.editor,e=d.getSelection(),g=v(e),k=e.isInTable(!0)&&this.isBoundarySelection(e),h=this.findTableInPastedContent(d,a.data.dataValue),f,l;(function(a,b,d,c){a=a.getRanges();var e=a.length&&a[0]._getTableElement({table:1});if(!b.length||e&&e.hasAttribute("data-cke-tableselection-ignored")||c&&!d)return!1;if(b=!c)(b=a[0])?(b=b.clone(),b.enlarge(CKEDITOR.ENLARGE_ELEMENT),
b=(b=b.getEnclosedNode())&&b.is&&b.is(CKEDITOR.dtd.$tableContent)):b=void 0,b=!b;return b?!1:!0})(e,g,h,k)&&(g=g[0].getAscendant("table"),f=new q(v(e,g)),d.once("afterPaste",function(){var a;if(l){a=new CKEDITOR.dom.element(l[0][0]);var b=l[l.length-1];a=z(a,new CKEDITOR.dom.element(b[b.length-1]))}else a=f.cells.all;t(d,a)}),h?(a.stop(),k?(f.insertRow(1,1===k,!0),e.selectElement(f.rows.first)):(f.emptyCells(),t(d,f.cells.all)),a=f.getTableMap(),l=CKEDITOR.tools.buildTableMap(h),f.insertRow(l.length-
a.length),f.insertColumn(c(l)-c(a)),a=f.getTableMap(),this.pasteTable(f,a,l),d.fire("saveSnapshot"),setTimeout(function(){d.fire("afterPaste")},0)):(b(f.cells.first),d.once("afterPaste",function(){d.fire("lockSnapshot");f.emptyCells(f.cells.all.slice(1));t(d,f.cells.all);d.fire("unlockSnapshot")})))},isBoundarySelection:function(a){a=a.getRanges()[0];var b=a.endContainer.getAscendant("tr",!0);if(b&&a.collapsed){if(a.checkBoundaryOfElement(b,CKEDITOR.START))return 1;if(a.checkBoundaryOfElement(b,CKEDITOR.END))return 2}return 0},
findTableInPastedContent:function(a,b){var c=a.dataProcessor,d=new CKEDITOR.dom.element("body");c||(c=new CKEDITOR.htmlDataProcessor(a));d.setHtml(c.toHtml(b),{fixForBody:!1});return 1<d.getChildCount()?null:d.findOne("table")},pasteTable:function(a,b,c){var d,e=C(a.cells.first),g=a._getTable(),k={},h,f,l,p;for(l=0;l<c.length;l++)for(h=new CKEDITOR.dom.element(g.$.rows[a.rows.first.$.rowIndex+l]),p=0;p<c[l].length;p++)if(f=new CKEDITOR.dom.element(c[l][p]),d=b[l]&&b[l][p]?new CKEDITOR.dom.element(b[l][p]):
null,f&&!f.getCustomData("processed")){if(d&&d.getParent())f.replace(d);else if(0===p||c[l][p-1])(d=0!==p?new CKEDITOR.dom.element(c[l][p-1]):null)&&h.equals(d.getParent())?f.insertAfter(d):0<e?h.$.cells[e]?f.insertAfter(new CKEDITOR.dom.element(h.$.cells[e])):h.append(f):h.append(f,!0);CKEDITOR.dom.element.setMarker(k,f,"processed",!0)}else f.getCustomData("processed")&&d&&d.remove();CKEDITOR.dom.element.clearAllMarkers(k)}};CKEDITOR.plugins.tableselection={getCellsBetween:z,keyboardIntegration:function(a){function b(a){var b=
a.getEnclosedNode();b&&"function"===typeof b.is&&b.is({td:1,th:1})?b.setText(""):a.deleteContents();CKEDITOR.tools.array.forEach(a._find("td"),function(a){a.appendBogus()})}var c=a.editable();c.attachListener(c,"keydown",function(a){function c(b,e){if(!e.length)return null;var l=a.createRange(),g=CKEDITOR.dom.range.mergeRanges(e);CKEDITOR.tools.array.forEach(g,function(a){a.enlarge(CKEDITOR.ENLARGE_ELEMENT)});var m=g[0].getBoundaryNodes(),n=m.startNode,m=m.endNode;if(n&&n.is&&n.is(k)){for(var q=n.getAscendant("table",
!0),u=n.getPreviousSourceNode(!1,CKEDITOR.NODE_ELEMENT,q),r=!1,t=function(a){return!n.contains(a)&&a.is&&a.is("td","th")};u&&!t(u);)u=u.getPreviousSourceNode(!1,CKEDITOR.NODE_ELEMENT,q);!u&&m&&m.is&&!m.is("table")&&m.getNext()&&(u=m.getNext().findOne("td, th"),r=!0);if(u)l["moveToElementEdit"+(r?"Start":"End")](u);else l.setStartBefore(n.getAscendant("table",!0)),l.collapse(!0);g[0].deleteContents();return[l]}if(n)return l.moveToElementEditablePosition(n),[l]}var g={37:1,38:1,39:1,40:1,8:1,46:1,13:1},
k=CKEDITOR.tools.extend({table:1},CKEDITOR.dtd.$tableContent);delete k.td;delete k.th;return function(h){var f=h.data.getKey(),l=h.data.getKeystroke(),k,m=37===f||38==f,n,q,r;if(g[f]&&!a.readOnly&&(k=a.getSelection())&&k.isInTable()&&k.isFake){n=k.getRanges();q=n[0]._getTableElement();r=n[n.length-1]._getTableElement();if(13!==f||a.plugins.enterkey)h.data.preventDefault(),h.cancel();if(36<f&&41>f)n[0].moveToElementEditablePosition(m?q:r,!m),k.selectRanges([n[0]]);else if(13!==f||13===l||l===CKEDITOR.SHIFT+
13){for(h=0;h<n.length;h++)b(n[h]);(h=c(q,n))?n=h:n[0].moveToElementEditablePosition(q);k.selectRanges(n);13===f&&a.plugins.enterkey?(a.fire("lockSnapshot"),13===l?a.execCommand("enter"):a.execCommand("shiftEnter"),a.fire("unlockSnapshot"),a.fire("saveSnapshot")):13!==f&&a.fire("saveSnapshot")}}}}(a),null,null,-1);c.attachListener(c,"keypress",function(c){var e=a.getSelection(),g=c.data.$.charCode||13===c.data.getKey(),k;if(!a.readOnly&&e&&e.isInTable()&&e.isFake&&g&&!(c.data.getKeystroke()&CKEDITOR.CTRL)){c=
e.getRanges();g=c[0].getEnclosedNode().getAscendant({td:1,th:1},!0);for(k=0;k<c.length;k++)b(c[k]);g&&(c[0].moveToElementEditablePosition(g),e.selectRanges([c[0]]))}},null,null,-1)}};CKEDITOR.plugins.add("tableselection",{requires:"clipboard,tabletools",isSupportedEnvironment:function(){return!(CKEDITOR.env.ie&&11>CKEDITOR.env.version)},onLoad:function(){y=CKEDITOR.plugins.tabletools;v=y.getSelectedCells;C=y.getCellColIndex;F=y.insertRow;G=y.insertColumn;CKEDITOR.document.appendStyleSheet(this.path+
"styles/tableselection.css")},init:function(a){this.isSupportedEnvironment()&&(a.addContentsCss&&a.addContentsCss(this.path+"styles/tableselection.css"),a.on("contentDom",function(){var b=a.editable(),c=b.isInline()?b:a.document,d={editor:a};b.attachListener(c,"mousedown",w,null,d);b.attachListener(c,"mousemove",w,null,d);b.attachListener(c,"mouseup",w,null,d);b.attachListener(b,"dragstart",M);b.attachListener(a,"selectionCheck",L);CKEDITOR.plugins.tableselection.keyboardIntegration(a);CKEDITOR.plugins.clipboard&&
!CKEDITOR.plugins.clipboard.isCustomCopyCutSupported&&(b.attachListener(b,"cut",E),b.attachListener(b,"copy",E))}),a.on("paste",H.onPaste,H),B(a,"rowInsertBefore rowInsertAfter columnInsertBefore columnInsertAfter cellInsertBefore cellInsertAfter".split(" "),function(a,c){t(a,c.selectedCells)}),B(a,["cellMerge","cellMergeRight","cellMergeDown"],function(a,c){t(a,[c.commandData.cell])}),B(a,["cellDelete"],function(a){A(a,!0)}))}})})();