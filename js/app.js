/// <reference path="jsmines.js" />
/// <reference path="jsmines.ui.js" />

window.onload = function() {
  var uiEvents = {
    onGameReset: function() { game.reset(); },
    onChangeParameters: function(config) { game.setConfig(config); },
    onOpenCell: function(position) { game.openCell(position); },
    onMarkCell: function(position) { game.markCell(position); }
  };

  var config = {
      size: [20, 20],
      mines: 40
  };

  var uiListeners = createUI(uiEvents);
  var game = createJsMines(config, uiListeners);
}
