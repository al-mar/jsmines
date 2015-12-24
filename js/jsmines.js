/// <reference path="utils.js" />

/**
 * All possible markers for a cell.
 * @readonly
 * @enum {number}
*/
var CellMarker = {
  /** A cell has no mark. */
  None:    0,
  
  /** A cell marked with a flag. */
  Flagged: 1,
  
  /** A cell marked with a '?'. */
  Marked:  2,
  
  /** A cell is opened and can't change its mark. */
  Opened:  3
}

function createJsMines(config, eventListeners) {
  // Set defaults
  
  eventListeners = extend({
    /** The board's been created and state initialized. */
    onGameInitialized: function() { },
    
    // Some cells have been opened and timer started.
    onGameStarted: function() { },
    
    // The game is over.
    onGameStopped: function() { },
    
    // A player won.
    onVictory: function() { },
    
    // A player lost.
    onDefeat: function(leftMines, wrongFlags) { },
    
    // A marker has been set on the cell
    onCellMarked: function(position, marker) { },
    
    // A cell has been opened
    onCellOpened: function(position, numberOfMinesAround) { },
    
    // (status: Status) -> void
    onStatusChanged: function(status) { }
  }, eventListeners);

  /** @constant {number} */
  var Mine = 9;

  // A game state
  var boardSize, board, markers, cellsLeft, mines, timer, time, gameStarted = false;
 
  setConfig(config);

  return {
    setConfig: setConfig,
    reset: reset,
    start: startGame,
    markCell: markCell,
    openCell: openCell
  };

  ///////////////////////////////////////////
  //               Methods                 //
  ///////////////////////////////////////////

  function setConfig(cfg) {
    if (!cfg)
      throw new Error("Configuration is not provided.");

    if (!cfg.size || (cfg.size[0] || 0) < 1 || (cfg.size[1] || 0) < 1)
      throw new Error("Invalid board size.");

    if ((cfg.mines || 0) < 1)
      throw new Error("You should specify a number of mines.");

    var newBoardSize = cfg.size[0] * cfg.size[1];
    if (newBoardSize <= cfg.mines)
     throw new Error("There is no free space on the board.");

    boardSize = newBoardSize;
    config = extend({}, cfg);

    reset();
  }

  function reset() {
    if (gameStarted)
      stop();

    board = newArray(boardSize, 0);
    markers = newArray(boardSize, CellMarker.None);
    mines = config.mines;
    cellsLeft = boardSize;
    eventListeners.onGameInitialized(extend({}, config));
    time = void 0;
    updateStatus();
  }

  /* Starts a new game (starts a timer, opens the first cell). */
  function startGame(startPosition) {
    if (gameStarted)
      return;

    gameStarted = true;

    time = +new Date();
    timer = window.setInterval(updateStatus, 1000);

    var forbiddenArea = getNearest(startPosition);
    forbiddenArea.push(getIndex(startPosition));
    for (var i = 0; i < config.mines; i++) {
      (function addMine() {
        var index = ~~(Math.random() * boardSize);
        if (forbiddenArea.indexOf(index) >= 0 || hasMine(board[index]))
          return addMine();

        board[index] = Mine;
        getNearest(getPosition(index)).forEach(function(i) { board[i]++; });
      })();
    }
    
    eventListeners.onGameStarted();
    updateStatus();
  }

  function markCell(position) {
    var index = getIndex(position);
    if (index < 0)
      throw new Error("Invalid position");

    if (!gameStarted)
      return;

    var marker = markers[index];
    if (marker == CellMarker.Opened)
      return;
    
    marker = (marker + 1) % CellMarker.Opened;
    if (!mines && marker === CellMarker.Flagged)
      marker = CellMarker.Marked;

    setMarker(position, marker);
  }

  function openCell(position) {
    var index = getIndex(position);
    if (index < 0)
      throw new Error("Invalid position");

    if (!gameStarted)
      startGame(position);

    if (markers[index] === CellMarker.Opened)
      return;

    markers[index] = CellMarker.Opened;

    if (hasMine(board[index])) { // A mine has been clicked.
      failGame();
      return;
    }

    cellsLeft--;
    eventListeners.onCellOpened(position, board[index]);
    if (cellsLeft === config.mines) {
      winGame();
      return;
    }

    if (!board[index])
      getNearest(position).map(getPosition).forEach(openCell);
  }

  ///////////////////////////////////////////
  //          Internal functions           //
  ///////////////////////////////////////////
  
  /** Sets a game status as updated */
  function updateStatus() {
    var status = {
      gameStarted: gameStarted,
      mines: mines,
      cellsLeft: cellsLeft,
      time: time === void 0
        ? 0
        : ~~((+new Date() - time) / 1000)
    };
    eventListeners.onStatusChanged(status);
  }

  function stop() {
    if (!gameStarted)
      return;
      
    gameStarted = false;

    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }

    updateStatus();
    eventListeners.onGameStopped();
  }

  function hasMine(boardElement) {
      return boardElement >= Mine;
  }

  function failGame() {
    var leftMines = [], wrongFlags = [];
    for (var i = 0; i < board.length; i++) {
      if ((markers[i] === CellMarker.Flagged) !== hasMine(board[i])) {
        var position = getPosition(i);
        Array.prototype.push.call(hasMine(board[i]) ? leftMines : wrongFlags, position);
      }
    }

    eventListeners.onDefeat(leftMines, wrongFlags);

    stop();
  }

  function winGame() {
    board.forEach(function(el, index) { // Open all mines that player left closed.
      var marker = markers[index];
      if (marker !== CellMarker.Opened && marker !== CellMarker.Flagged && hasMine(el))
        setMarker(getPosition(index), CellMarker.Flagged);
    });

    eventListeners.onVictory();

    stop();
  }

  function setMarker(position, marker) {
    var index = getIndex(position);
    if (index < 0 || marker === CellMarker.Opened || markers[index] === CellMarker.Opened)
      return;

    if (markers[index] === marker)
      return;

    if (markers[index] === CellMarker.Flagged) {
      mines++;
      updateStatus();
    }

    if (marker === CellMarker.Flagged) {
      mines--;
      updateStatus();
    }

    markers[index] = marker;
    eventListeners.onCellMarked(position, marker);
  }

  /** Converts 2-d position to the board index. */
  function getIndex(pos, checkPosition) {
    return pos[0] < 0 || pos[0] >= config.size[0] || pos[1] < 0 || pos[1] >= config.size[1]
      ? -1
      : (pos[0] + pos[1] * config.size[1]);
  }

  /** Converts the board index to 2-d position. */
  function getPosition(index) { return [index % config.size[1], ~~(index / config.size[1])]; }

  /** Gets nearest position around 'pos' */
  function getNearest(pos) {
    return [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]
      .map(function(s) { return getIndex([pos[0] + s[0], pos[1] + s[1]]); })
      .filter(function(s) { return s >= 0; });
  }
}
