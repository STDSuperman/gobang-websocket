const fs = require("fs");
const Koa = require("koa");
const path = require("path");
const Router = require("koa-router")();
let KoaStatic = require("koa-static");

/**获取本机ip地址 */
let getIp = require("./getIp");
const ip = getIp();

let app = new Koa();
let username = "";
let uid = 0;
let userList = {};
app.use(KoaStatic(path.join(__dirname, "../static")));
Router.get("/", async (ctx, next) => {
  ctx.response.redirect("/login");
  await next();
});

Router.get("/login", async ctx => {
  ctx.body = fs.readFileSync(path.resolve(__dirname, "../login.html")).toString();
});
Router.post("/submit", async ctx => {
  if (ctx.cookies.get("userId")) {
    ctx.body = "OK";
    return;
  }
  await parsePostData().then(data => {
    ctx.username = username = data.split("=")[1];
  });

  ctx.cookies.set("userId", uid);
  userList[uid] = username;
  uid++;

  ctx.body = "OK";
  /**解析post数据 */
  function parsePostData() {
    return new Promise((resolve, reject) => {
      try {
        let postData = "";
        ctx.req.addListener("data", data => {
          // 有数据传入的时候
          postData += data;
        });
        ctx.req.on("end", () => {
          resolve(postData);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
});
Router.get("/index", async ctx => {
  if (!ctx.cookies.get("userId")) {
    ctx.redirect('/login')
  }
  let data = fs.readFileSync(path.resolve(__dirname, "../index.html"));
  ctx.body = data.toString();
});

app.listen(3000, () => {
  console.log(`Please visit http://${ip}:3000`);
});

app.use(Router.routes()); /*启动路由*/
app.use(Router.allowedMethods());

const ws = require("nodejs-websocket");
let WebSocketServer = ws
  .createServer(function(user) {
    user.username =
      (user.headers.cookie && userList[user.headers.cookie.split("=")[1]]) ||
      username;
    sendMsgToAllUser(user.username + " 进入房间");
    if (WebSocketServer.connections.length >= 2) {
      let data = {
        type: "start"
      };
      sendMsgToAllUser(JSON.stringify(data));
      /**
       * 0代表白棋
       * 1代表黑棋
       */
      WebSocketServer.connections[0].sendText(
        JSON.stringify({
          type: "camp",
          msg: 0,
          username: WebSocketServer.connections[0].username
        })
      );
      WebSocketServer.connections[1].sendText(
        JSON.stringify({
          type: "camp",
          msg: 1,
          username: WebSocketServer.connections[1].username
        })
      );
    }
    user.on("text", function(data) {
      sendMsgToAllUser(data); //给所有连接者发消息
    });
    user.on("error", function(err) {
      console.log(err);
    });
    user.on("close", function() {
      sendMsgToAllUser(user.username + " 离开了房间");
    });
  })
  .listen(3001);

/**拿到所有连接者发送消息方法 */
function sendMsgToAllUser(data) {
  WebSocketServer.connections.forEach(item => {
    item.sendText(data);
  });
}
