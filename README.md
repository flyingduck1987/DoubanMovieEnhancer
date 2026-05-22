# DoubanMovieEnhancer
豆瓣电影IMDb增强
一个油猴脚本（Tampermonkey），为豆瓣电影页面添加IMDb评分和家长指引信息，方便影迷在选择电影时获取更全面的参考。

✨ 功能特点
IMDb评分显示：在豆瓣电影信息栏直接显示IMDb评分和投票数

家长指引内容：自动获取IMDb家长指引（Parental Guide），包含性与裸露、暴力血腥、粗口、烟酒等内容分级

快速跳转：IMDb编号变为可点击链接，一键跳转到IMDb对应页面

备用方案：支持OMDb API和直接请求两种方式获取评分，确保稳定性

📸 效果预览
![截图](img.png)
在豆瓣电影页面的信息栏下方，会自动添加：

IMDb评分（橙色显示，含投票数）

IMDb家长指引内容框（灰色背景，可折叠）

🔧 安装方法
安装油猴插件（Tampermonkey）

点击脚本文件 DoubanMovieEnhancer.js

在打开的页面中点击"安装"

（可选）注册 OMDb API Key 并替换脚本中的 YOUR_API_KEY

📝 使用说明
安装完成后，访问任意豆瓣电影页面（如 https://movie.douban.com/subject/1292052/），脚本会自动运行并在页面中显示IMDb相关信息。

OMDb API 配置（可选）
脚本默认使用直接请求IMDb的方式获取评分。如需更稳定的体验：

访问 https://www.omdbapi.com/apikey.aspx 免费注册

将获取的API Key替换脚本中的 YOUR_API_KEY
