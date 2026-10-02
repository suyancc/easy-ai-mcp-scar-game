# wechat-win-client — CYBER RUSH 模块化网页赛车

## 运行方式
ES Module 需要本地 HTTP 服务（不能直接双击 index.html）：

    cd game
    python -m http.server 8080

浏览器打开 http://localhost:8080 。
three.js 走 npmmirror CDN（importmap，首次加载需联网）。

## 目录结构
    game/
      index.html            入口 + importmap + HUD
      src/main.js           装配与主循环
      src/core/             Input（键盘/触屏）· GameState（数值/状态机）
      src/render/           SceneSetup（渲染器/灯光/追车相机）
      src/world/            Road（无尽分块路面）· Scenery（霓虹废墟楼体）
      src/entities/         PlayerCar · Traffic（狂暴敌车）· Obstacles（障碍物）
      src/ui/               HUD
      assets/               10 个 GLB 资产（见下）
    models/
      cyber_car.blend       主角车源文件
      game_assets.blend     敌车/障碍/楼体资产库（9 组件陈列）
    view_*.jpg              展示渲染

## 资产清单（game/assets/）
| 资产 | 说明 |
|---|---|
| cyber_car.glb        | 主角 CYBER GT（低趴宽体霓虹超跑） |
| enemy_rammer.glb     | 狂徒·撞角战车（尖刺+防滚架+锯片） |
| enemy_buggy.glb      | 疯狗·越野 buggy（外露车架+大后轮） |
| enemy_truck.glb      | 屠夫·铲刀卡车（红色+推雪铲） |
| obs_barrel.glb       | 火焰油桶 |
| obs_caltrops.glb     | 钢钉拒马 |
| obs_explosive.glb    | 爆炸桶 |
| scenery_building_1/2/3.glb | 霓虹废墟楼体 ×3 |

## 操作
← → / A D 变道 · 触屏滑动 · R 重开

## 资产规范
原点地面中心 · 1 单位 = 1 米 · 车头朝 -Y（Blender）/ +Z（glTF/Three.js）· 低面数游戏向
