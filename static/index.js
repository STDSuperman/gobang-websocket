let ws = new WebSocket("ws://localhost:3001");
let ul = document.getElementsByTagName("ul")[0];
let checkerboardSize = 400; //当前场次格子数
let boundary = Math.sqrt(checkerboardSize); //获取边界长度
let allDomList = []; //存放棋盘中所有格子的dom
createLi(ul, checkerboardSize); //调用创建棋盘函数
let allPiecePosition = createPieceWareHouse(boundary); //棋盘中存在的所有棋子集合
let username = null;
let currentCamp;
let isStep = false;
let h3 = document.getElementsByTagName("h3")[0];
let audio = document.getElementsByTagName("audio")[0];

/**使用事件委托机制实现棋盘点击事件捕获 */
function start(name) {
  username = name;
  ul.onclick = function(e) {
    if (!isStep) {
      return;
    }
    let target = e.target || window.event;
    let x = target.offsetLeft / 30;
    let y = target.offsetTop / 30;
    if (allPiecePosition[x][y]) {
      alert("当前位置不能摆放棋子");
      return;
    }
    audio.play();
    ws.send(
      JSON.stringify({
        type: "step",
        msg: {
          x,
          y
        },
        name: username
      })
    );
    setPiece(target);
    judgeVictoryOrDefeat(allPiecePosition, target, boundary);
  };
}
/**在棋盘中放入棋子 */
function setPiece(target, isEnemy = false) {
  let x = target.offsetLeft / 30;
  let y = target.offsetTop / 30;
  if (isEnemy) {
    h3.innerText = "我的回合";
    target.style.background =
      "url(" +
      (currentCamp == 0 ? "./black_piece.jpg" : "./white_piece.jpg") +
      ") no-repeat";
  } else {
    h3.innerText = "对方回合";
    target.style.background =
      "url(" +
      (currentCamp == 0 ? "./white_piece.jpg" : "./black_piece.jpg") +
      ") no-repeat";
  }
  target.style.backgroundSize = "20px 20px";
  target.style.backgroundPosition = "center center";
  allPiecePosition[x][y] = username;
}

/**创建棋盘*/
function createLi(target, checkerboardSize) {
  let fragment = document.createDocumentFragment();
  for (let i = 0; i < checkerboardSize; i++) {
    fragment.appendChild(document.createElement("li"));
  }
  target.appendChild(fragment);
  let sideLength = boundary * 30 + "px";
  target.style.width = sideLength;
  target.style.height = sideLength;
}

/**
 * 创建棋子仓库
 */
function createPieceWareHouse(boundary) {
  let arr = [];
  let domList = document.querySelectorAll("li");
  let k = 0;
  for (let i = 0; i < boundary; i++) {
    arr[i] = [];
    allDomList[i] = [];
    for (let j = 0; j < boundary; j++) {
      allDomList[i][j] = domList[k++];
    }
  }
  return arr;
}

/**
 * 判断胜负
 */
function judgeVictoryOrDefeat(pieceList, target, boundary) {
  let x = target.offsetLeft;
  let y = target.offsetTop;
  if (
    detailRulesJudge("left-skew") ||
    detailRulesJudge("right-skew") ||
    detailRulesJudge("vetical") ||
    detailRulesJudge("horizontal")
  ) {
    ws.send(
      JSON.stringify({
        type: "game-over",
        winer: username
      })
    );
    return true;
  }
  /**判断四个方向是否满足至少五个自己的棋子连在一起 */
  function detailRulesJudge(type) {
    let flag = -1;
    let step = 30;
    let tempX, tempY;
    init();
    let count = 1;

    while (true) {
      /**往斜上方判断 */
      if (
        tempX >= 0 &&
        tempY >= 0 &&
        pieceList[tempX / step] &&
        pieceList[tempY / step] &&
        pieceList[tempX / step][tempY / step] &&
        pieceList[tempX / step][tempY / step] === username
      ) {
        ++count;
        changeStep();
      } else {
        /**往斜下方判断 */
        flag = 1;
        init();
        while (true) {
          if (
            tempX <= boundary * 30 &&
            tempY <= boundary * 30 &&
            pieceList[tempX / step] &&
            pieceList[tempY / step] &&
            pieceList[tempX / step][tempY / step] &&
            pieceList[tempX / step][tempY / step] === username
          ) {
            ++count;
            changeStep();
          } else {
            if (count >= 5) {
              return true;
            }
            count = 1;
            break;
          }
        }
        break;
      }
    }
    /**初始化一下数据 */
    function init() {
      switch (type) {
        case "left-skew":
          tempX = x + step * -flag;
          tempY = y + step * flag;
          break;
        case "right-skew":
          tempX = x + step * flag;
          tempY = y + step * flag;
          break;
        case "horizontal":
          tempX = x + step * -flag;
          tempY = y;
          break;
        case "vetical":
          tempX = x;
          tempY = y + step * flag;
          break;
      }
    }
    /**改变步长 */
    function changeStep() {
      switch (type) {
        case "left-skew":
          tempX += step * -flag;
          tempY += step * flag;
          break;
        case "right-skew":
          tempX += step * flag;
          tempY += step * flag;
          break;
        case "horizontal":
          tempX += step * -flag;
          tempY = y;
          break;
        case "vetical":
          tempX = x;
          tempY += step * flag;
          break;
      }
    }
  }
}
