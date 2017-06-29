function createEditor(textArea, filename) {

  function gutterClick(cm, n) {
    var info = cm.lineInfo(n);

    var bgClassName = "breakpoint-bg";
    if (info.gutterMarkers) {
      cm.removeLineClass(n, "wrap", bgClassName);
      cm.setGutterMarker(n, "breakpoints", null);
    } else {
      cm.addLineClass(n, 'wrap', bgClassName);
      cm.setGutterMarker(n, "breakpoints", makeMarker());
    }
  }

  function stepLine(cm, head) {
    // editor;
    var bgClassName = 'currentDebugLine';
    var prev = editor.current;
    cm.current = head;
    if (prev) {
      cm.removeLineClass(prev.line - 1, 'wrap', bgClassName);
    }
    if (head) {
      cm.addLineClass(head.line - 1, 'wrap', bgClassName);
      cm.setCursor({ line: head.line, ch: 1 });
    }
  }

  function makeMarker() {
    var marker = document.createElement("div");
    marker.className = "breakpoint";
    marker.innerHTML = "●";
    return marker;
  }

  filename = filename || '';

  var ext = filename.split('.').slice(-1)[0];
  var mode = {
    js: 'application/javascript',
    json: 'application/json',
    map: 'application/json',
    css: 'text/css',
    sass: 'text/x-sass',
    scss: 'text/x-scss',
    less: 'text/x-less',
    xml: 'application/xml',
    html: 'text/html',
    c: 'text/x-csrc',
    cpp: 'text/x-c++src ',
    h: 'text/x-csrc',
    java: 'text/x-java',
    class: 'application/java-vm',
    md: 'text/x-markdown',
    // 'text/x-objectivec',
    // 'text/x-csharp'
  };

  var editor = CodeMirror.fromTextArea(textArea, {
    lineNumbers: true,
    lineWrapping: true,
    mode: mode[ext],
//    mode: "text/x-java",
//            mode:  "javascript",
    gutters: ["CodeMirror-linenumbers", "breakpoints"],
    matchBrackets: true
  });
  editor.setSize("100%", "100%");
  editor.on("gutterClick", gutterClick);

  editor.stepLine = function (head) {
    return stepLine(editor, head);
  };

  return editor;
}
