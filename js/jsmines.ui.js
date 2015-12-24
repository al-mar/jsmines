/// <reference path="jsmines.js" />

function createUI(eventListeners) {
  eventListeners = extend({
    onOpenCell: function(position) { },
    onMarkCell: function(position) { },
    onGameReset: function() { }
  }, eventListeners);

  // UI elements
  var uiElements = {
    gameField: document.getElementById('gameField'),
    messages: document.getElementById('messages'),
    statusPanel: document.getElementById('statusPanel'),
  };

  uiElements.gameField.innerHTML = "<table id='field'></table>";
  uiElements.gameTable = document.getElementById('field');

  var MarkerClass = {};
  var gameStopped = false;
  MarkerClass[CellMarker.Flagged] = 'flag';
  MarkerClass[CellMarker.Marked] = 'mark';

  return {
    onGameInitialized: function(config) {
      drawGameField(config.size);
      attachEventListeners();
    },
    onGameStarted: function() {
    },
    onGameStopped: function(leftMines, wrongFlags) {
      gameStopped = true;
    },
    onVictory: function() {
      uiElements.messages.innerHTML = "<span class='victory'>You won!</span>";
    },
    onDefeat: function(leftMines, wrongFlags) {
      uiElements.messages.innerHTML = "<span class='failure'>Game over!</span>";
 
      leftMines.forEach(function(position) {
        getCell(position).className = 'bomb';
      });

      wrongFlags.forEach(function(position) {
        getCell(position).className = 'flag wrong';
      });
    },
    onCellMarked: function(position, mark) {
      var uiCell = getCell(position);
      uiCell.className = MarkerClass[mark] || '';
    },
    onCellOpened: function(position, mines) {
      var uiCell = getCell(position);
      if (uiCell.className)
        return;

      uiCell.className = "open";
      uiCell.innerHTML = mines || "";
    },
    onStatusChanged: function(status) {
      refreshStatusPanel(status);
    }
  };


  var eventListenersAttached = false;
  function attachEventListeners() {
    if (eventListenersAttached) return;
    eventListenersAttached = true;

    uiElements.gameTable.oncontextmenu = function() { return false; }
    uiElements.gameTable.onmouseup = function(ev) {
      if (gameStopped) {
        gameStopped = false;
        eventListeners.onGameReset();
        return;
      }

      ev = ev || window.event;
      var target = ev.target || ev.srcElement;
      if (target.tagName != "TD")
        return;

      var position = [ target.cellIndex, target.parentNode.rowIndex ];
      var isRightButton = ev.which ? (ev.which == 3) : (ev.button == 2);
      eventListeners[isRightButton ? 'onMarkCell' : 'onOpenCell'](position);
    };
  }

  function drawGameField(size) {
    uiElements.gameTable.innerHTML = replicate("<tr>" + replicate("<td></td>", size[0]) + "</tr>", size[1]);
    uiElements.messages.innerHTML = '';
  }

  // Refresh the game status panel
  function refreshStatusPanel(status) {
    uiElements.statusPanel.innerHTML = "<span class='time'>Time: "
      + pad2(status.time / 3600) + ":"
      + pad2(status.time / 60 % 60) + ":"
      + pad2(status.time % 60)
      + "</span><span class='mines'>&#9760;" + status.mines + "</span>";
  }

  // Get a table cell for the position 'p'
  function getCell(p) { return uiElements.gameTable.rows[p[1]].cells[p[0]]; }
}
