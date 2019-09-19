ws.onopen = function() {
  console.log("连接成功");
};
ws.onmessage = function(e) {
  try {
    let res = JSON.parse(e.data);
    if (res.type === "camp") {
      currentCamp = res.msg;
      start(res.username);
      if (res.msg == 0) {
        isStep = true;
        h3.innerText = "先手";
      } else {
        h3.innerText = "后手";
      }
    }
    if (res.type === "step") {
      if (res.name == username) {
        isStep = false;
        return;
      } else {
        isStep = true;
      }
      setPiece(allDomList[res.msg.y][res.msg.x], true);
      allPiecePosition[res.msg.x][res.msg.y] = res.name;
    }
    if (res.type == "game-over") {
      ul.onclick = null;
      alert("游戏结束 " + res.winer + " 胜利");
    }
  } catch (error) {
    console.log(e.data);
  }
};
