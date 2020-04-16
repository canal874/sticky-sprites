/** 
 * @license
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

window.$ = window.jQuery = require('./src/jquery-2.2.4.min.js');

const card = { id: "" };

$(() => {
  let main = require("electron").remote.require("./main");
  const ipcRenderer = require( "electron" ).ipcRenderer;
  
  const {remote} = require('electron');
  const {Menu, MenuItem} = remote;

  //-----------------------------------
  // ContextMenu
  //-----------------------------------
  var menu = new Menu();
  menu.append(new MenuItem({ label: main.i18n("yellow"), click: () => { setCardColor("#ffffa0"); }}));
  menu.append(new MenuItem({ label: main.i18n("red"), click: () => { setCardColor("#ffd0d0"); }}));
  menu.append(new MenuItem({ label: main.i18n("green"), click: () => { setCardColor("#d0ffd0"); }}));
  menu.append(new MenuItem({ label: main.i18n("blue"), click: () => { setCardColor("#d0d0ff"); }}));
  menu.append(new MenuItem({ label: main.i18n("purple"), click: () => { setCardColor("#ffd0ff"); }}));
  menu.append(new MenuItem({ label: main.i18n("gray"), click: () => { setCardColor("#d0d0d0"); }}));
  menu.append(new MenuItem({ label: main.i18n("transparent"), click: () => { setCardColor("#f0f0f0", 0.0); }}));
  
  document.ondragover = (e) => {
    e.preventDefault();
    return false;
  };

  document.ondrop = (e) => {
    e.preventDefault();

    var file = e.dataTransfer.files[0];

    var dropImg = new Image();
    dropImg.onload = () => {
      var width = dropImg.naturalWidth;
      var height = dropImg.naturalHeight;

      // Adjust img to card size
      // ...
      // ...

      var data = "<img src='" + file.path + "' width='" + width + "' height='" + height + "'>";
      CKEDITOR.instances["editor"].setData(data);
      $("#contents").html(data);
    };
    dropImg.src = file.path;

    return false;
  };


  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
  }, false);

  
  //-----------------------------------
  // Global
  //-----------------------------------
  let codeMode = false;

  let toolbarHeight = 64;

  let currentCardColor = "#f0f0a0";
  let currentTitleColor = "#d0d090";
  let currentBgOpacity = 1.0;
  
  let isEditorReady = false;
  
  //----------------------
  // ipc (inter-process communication)
  //----------------------

  // Initialize card
  ipcRenderer.on("card-loaded", (event, id, data, x, y,  width, height, color, bgOpacity) => {
    card.id = id;
    Object.freeze(card);
    
    $("#editor").val(data);
    $("#contents").html(data);

    setCardColor(color, bgOpacity);

    var sprBorder = parseInt($("#card").css("border-left"));
    var sprWidth = width - sprBorder*2;
    var sprHeight = height - sprBorder*2;
    CKEDITOR.config.width =  sprWidth;
    CKEDITOR.config.height =  sprHeight - $("#titlebar").outerHeight() - toolbarHeight; 
    resizeWindow();

//    CKEDITOR.config.uiColor = currentTitleColor;
    CKEDITOR.replace("editor"); 
    CKEDITOR.on("instanceReady", () => {
      isEditorReady = true;
      $("#cke_editor").css('border-top-color', currentTitleColor);      
      $("#cke_1_top").css('background-color', currentTitleColor);
      $("#cke_1_top").css('border-bottom-color', currentTitleColor);
      $("#cke_1_top").css('border-top-color', currentTitleColor);
      $("#cke_1_contents .cke_wysiwyg_frame").css('background-color', currentCardColor);
    });

    setTimeout(()=>{
      $("#card").css("visibility", "visible");
    },300);
  });

  ipcRenderer.on("card-close", (event) => {
    close();
  });

  ipcRenderer.on("card-focused", (event) => {
    $("#card").css({ border: "3px solid red" });
    $("#titlearea").show();
  });
  
  ipcRenderer.on("card-blured", (event) => {
    if($("#contents").css("display") == "none"){
      endEditMode();
    }
    $("#card").css({ border: "3px solid transparent" });
    if(currentBgOpacity == 0){
      $("#titlearea").hide();
    }
  });

  //--------------------------
  // Set card properties
  //--------------------------  
  // cardColor : #HEX (e.g. #ff00ff)
  // cardColor : 0.0-1.0
  let setCardColor = (cardColor, bgOpacity) => {
    currentCardColor = cardColor;
    currentBgOpacity = bgOpacity === undefined ? 1.0 : bgOpacity;
    let scale = 0.8;
    cardColor.match(/#(\w\w)(\w\w)(\w\w)/)
    let red = parseInt(RegExp.$1, 16);
    let green = parseInt(RegExp.$2, 16);
    let blue = parseInt(RegExp.$3, 16);
    $(".card-color").css("background-color", "rgba("+ red + "," + green + "," + blue + "," + currentBgOpacity + ")");

    let r = Math.floor(red * scale).toString(16);
    if (r.length == 1){r= "0" + r;}
    let g = Math.floor(green * scale).toString(16);
    if (g.length == 1){g= "0" + g;}
    let b = Math.floor(blue * scale).toString(16);
    if (b.length == 1){b= "0" + b;}
    currentTitleColor = "#" + r + g + b;

    $(".title-color").css("background-color", currentTitleColor);

　　if(isEditorReady){
      $("#cke_editor").css('border-top-color', currentTitleColor);      
      $("#cke_1_top").css('background-color', currentTitleColor);
      $("#cke_1_top").css('border-bottom-color', currentTitleColor);
      $("#cke_1_top").css('border-top-color', currentTitleColor);
      $("#cke_1_contents .cke_wysiwyg_frame").css('background-color', currentcardColor);
    }
  };

  //--------------------------
  // Save and close card
  //--------------------------  
  let close = () => {
    window.close();
  };


  //--------------------------
  // Edit
  //--------------------------  
  let moveCursorToBottom = () => {
    let editor = CKEDITOR.instances["editor"];
    let s = editor.getSelection(); // getting selection
    let selected_ranges = s.getRanges(); // getting ranges
    let node = selected_ranges[0].startContainer; // selecting the starting node
    let parents = node.getParents(true);
    node = parents[parents.length - 2].getFirst();
    while (true) {
      let x = node.getNext();
      if (x == null) {
        break;
      }
      node = x;
    }

    s.selectElement(node);
    selected_ranges = s.getRanges();
    selected_ranges[0].collapse(false);  //  false collapses the range to the end of the selected node, true before the node.
    s.selectRanges(selected_ranges);  // putting the current selection there

  };

  let startEditMode = () => {
    $("#contents").hide();
    $("#cke_editor").show();

    execAfterWysiwygChanged(
      function(){
        resizeWindow();
        CKEDITOR.instances["editor"].focus();
        moveCursorToBottom();
      }
    );
  };

  let endEditMode = () => {
    let data = CKEDITOR.instances["editor"].getData();
    $("#contents").html(data);
    $("#contents").show();
    setTimeout(() => {
      main.saveCard(card.id, data, currentCardColor, currentBgOpacity);
    },1);
    $("#cke_editor").hide();

    codeMode = false;
    $("#codeBtn").css({ "color":"#000000" });
    CKEDITOR.instances["editor"].setMode("wysiwyg");
  };

  let startCodeMode = () => {
    codeMode = true;
    startEditMode();
    $("#codeBtn").css({ "color":"#a0a0a0" });
    CKEDITOR.instances["editor"].setMode("source");
    CKEDITOR.instances["editor"].focus();
  };

  let execAfterWysiwygChanged = (func) => {
    let editor = CKEDITOR.instances["editor"];
    let s = editor.getSelection(); // getting selection
    if(s){
      func();
    }
    else{
      setTimeout(() => {execAfterWysiwygChanged(func)}, 100);
    }
  };
  
  let endCodeMode = () => {
    codeMode = false;
    $("#codeBtn").css({ "color":"#000000" });
    CKEDITOR.instances["editor"].setMode("wysiwyg");
    execAfterWysiwygChanged(
      function(){
        CKEDITOR.instances["editor"].focus();
        moveCursorToBottom();
      }
    );
  };

  //--------------------------
  // UI
  //--------------------------
  let resizeWindow = () => {
//    console.log("card resize: " + $(window).width() + "," + $(window).height());
    var sprBorder = parseInt($("#card").css("border-left"));
    var sprWidth = $(window).width() - sprBorder*2;
    var sprHeight = $(window).height() - sprBorder*2;

    var contPadding = parseInt($("#contents").css("padding-left"))
    $("#contents").width(sprWidth - contPadding*2);
    $("#contents").height(sprHeight - $("#titlebar").outerHeight() - contPadding*2);

    if(isEditorReady){
//      CKEDITOR.instances["editor"].resize(sprWidth, sprHeight - $("#titlebar").outerHeight());
      CKEDITOR.instances["editor"].resize(sprWidth, sprHeight - $("#titlebar").outerHeight());
    }

    let closeBtnLeft = sprBorder + sprWidth - $("#closeBtn").outerWidth();
    $("#closeBtn").offset({ left: closeBtnLeft });
    let titleBarLeft = $("#codeBtn").position().left + $("#codeBtn").outerWidth();
    let barwidth = closeBtnLeft - titleBarLeft;
    $("#titlebar").offset({ left: titleBarLeft });
    $("#titlebar").width(barwidth);
  };

  $(window).resize(() => {
    resizeWindow();
  });

  $("#newBtn").click(() => {
    main.createCard();
  });

  $("#contents").click(() => {
    startEditMode();
  });

  $("#codeBtn").click(() => {
    if(!codeMode){
      startCodeMode();
    }
    else{
      endCodeMode();
    }
  });

  $("#closeBtn").click(() => {
    let data = CKEDITOR.instances["editor"].getData();
    if(data == ""){
      main.saveToCloseCard(card.id, data, currentCardColor, currentBgOpacity);
    }
    else if(window.confirm(main.i18n("confirm-closing"))){
      main.saveToCloseCard(card.id, data, currentCardColor, currentBgOpacity);
    }
  });

});
